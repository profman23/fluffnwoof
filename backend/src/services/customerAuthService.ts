import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OtpType } from '@prisma/client';
import { sendOtpSms } from './smsService';
import { AppError } from '../middlewares/errorHandler';
import { normalizePhone, getPhoneVariants } from '../utils/phoneUtils';
import { nextCustomerCode } from '../utils/codeGenerator';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 10;

interface RegisterInput {
  phone: string;
  preferredLang?: string;
}

interface CustomerTokenPayload {
  id: string;
  phone: string;
  type: 'customer';
}

/**
 * Check if email is a placeholder (generated during import)
 */
const isPlaceholderEmail = (email: string | null | undefined): boolean => {
  if (!email) return true;
  return email.endsWith('@import.local') || email.startsWith('noemail_');
};

/**
 * Check if name is a placeholder (set before details step is completed)
 */
const isPlaceholderName = (name: string | null | undefined): boolean =>
  !name || name === 'pending';

/**
 * Generate 6-digit OTP code
 */
const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate customer JWT token
 */
const generateToken = (owner: { id: string; phone: string }): string => {
  const payload: CustomerTokenPayload = {
    id: owner.id,
    phone: owner.phone,
    type: 'customer',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// customerCode generation moved to utils/codeGenerator.ts (atomic UPSERT)

/**
 * Find owner by phone using all possible format variants.
 * If multiple owners match (due to past format inconsistencies), merges them:
 *   - Keeps the one with pets/data (primary), deletes the placeholder duplicate
 *   - Transfers portal auth data (password, verification) to the primary
 * Auto-normalizes the stored phone to standard 0xxxxxxxxx format.
 */
const findOwnerByPhone = async (rawPhone: string) => {
  const phone = normalizePhone(rawPhone);
  const variants = getPhoneVariants(rawPhone);

  const owners = await prisma.owner.findMany({
    where: { phone: { in: variants } },
    include: { pets: { select: { id: true } } },
  });

  if (owners.length === 0) return null;

  let primary = owners[0];

  if (owners.length > 1) {
    // Pick primary: prefer the one with pets, then the one with a password
    primary = owners.reduce((best, curr) => {
      if (curr.pets.length > best.pets.length) return curr;
      if (curr.pets.length === best.pets.length && curr.passwordHash && !best.passwordHash) return curr;
      return best;
    });

    // Merge portal auth data from duplicates into primary
    for (const dup of owners) {
      if (dup.id === primary.id) continue;

      // Transfer password/verification if primary doesn't have them
      if (!primary.passwordHash && dup.passwordHash) {
        primary.passwordHash = dup.passwordHash;
        primary.isVerified = dup.isVerified;
        primary.verifiedAt = dup.verifiedAt;
      }

      // Move any pets from duplicate to primary
      await prisma.pet.updateMany({
        where: { ownerId: dup.id },
        data: { ownerId: primary.id },
      });

      // Move OTPs
      await prisma.ownerOtp.updateMany({
        where: { ownerId: dup.id },
        data: { ownerId: primary.id, phone },
      });

      // Delete duplicate
      await prisma.owner.delete({ where: { id: dup.id } });
    }

    // Update primary with merged data + normalized phone
    await prisma.owner.update({
      where: { id: primary.id },
      data: {
        phone,
        passwordHash: primary.passwordHash,
        isVerified: primary.isVerified,
        verifiedAt: primary.verifiedAt,
        portalEnabled: primary.portalEnabled || true,
      },
    });
    primary.phone = phone;
  } else if (primary.phone !== phone) {
    // Single owner, just normalize the phone
    await prisma.owner.update({
      where: { id: primary.id },
      data: { phone },
    });
    primary.phone = phone;
  }

  return primary;
};

/**
 * Check phone status for registration flow
 * Returns: NOT_FOUND | REGISTERED | CLAIMABLE
 */
export const checkPhoneStatus = async (rawPhone: string): Promise<{
  status: 'NOT_FOUND' | 'REGISTERED' | 'CLAIMABLE';
  ownerId?: string;
}> => {
  const owner = await findOwnerByPhone(rawPhone) as any;

  if (!owner) {
    return { status: 'NOT_FOUND' };
  }

  // Has passwordHash + isVerified = fully registered via portal
  if (owner.passwordHash && owner.isVerified) {
    return { status: 'REGISTERED' };
  }

  // Exists but no password or not verified = staff-created or incomplete registration
  return { status: 'CLAIMABLE', ownerId: owner.id };
};

/**
 * Register new customer (Step 1: Create/find owner and send OTP via SMS)
 */
export const register = async (input: RegisterInput) => {
  const { phone: rawPhone, preferredLang = 'ar' } = input;
  const phone = normalizePhone(rawPhone);

  // Check if phone already exists (search all format variants)
  const existingByPhone = await findOwnerByPhone(rawPhone);

  let owner;

  if (existingByPhone) {
    // Already fully registered → reject
    if (existingByPhone.isVerified && existingByPhone.passwordHash) {
      throw new AppError('رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول', 409, 'PHONE_EXISTS', 'Phone number is already registered. Please login');
    }

    // Exists but not verified (staff-created or incomplete) → just update lang + portal flag
    owner = await prisma.owner.update({
      where: { id: existingByPhone.id },
      data: {
        preferredLang,
        portalEnabled: true,
      },
    });
  } else {
    // Create new owner with placeholder name (will be updated in completeRegistration)
    const customerCode = await nextCustomerCode();

    owner = await prisma.owner.create({
      data: {
        customerCode,
        firstName: 'pending',
        lastName: 'pending',
        phone,
        email: `noemail_${phone}@import.local`,
        preferredLang,
        isVerified: false,
        portalEnabled: true,
      },
    });
  }

  // Generate and save OTP
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete any existing OTPs for this phone
  await prisma.ownerOtp.deleteMany({
    where: { phone, type: OtpType.REGISTRATION },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      phone,
      code: otpCode,
      type: OtpType.REGISTRATION,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP via SMS
  await sendOtpSms(phone, otpCode, preferredLang as 'ar' | 'en');

  return {
    success: true,
    message: 'تم إرسال رمز التحقق إلى رقم جوالك',
    ownerId: owner.id,
    phone,
    existingData: existingByPhone ? {
      firstName: isPlaceholderName(existingByPhone.firstName) ? '' : existingByPhone.firstName,
      lastName: isPlaceholderName(existingByPhone.lastName) ? '' : existingByPhone.lastName,
      email: isPlaceholderEmail(existingByPhone.email) ? '' : (existingByPhone.email ?? ''),
    } : null,
  };
};

/**
 * Verify OTP code (phone-based)
 */
export const verifyOtp = async (rawPhone: string, code: string, type: OtpType) => {
  const phone = normalizePhone(rawPhone);
  const otp = await prisma.ownerOtp.findFirst({
    where: {
      phone,
      type,
      usedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw new AppError('لم يتم العثور على رمز تحقق', 404, 'OTP_NOT_FOUND', 'Verification code not found');
  }

  // Check if expired
  if (new Date() > otp.expiresAt) {
    throw new AppError('انتهت صلاحية رمز التحقق', 400, 'OTP_EXPIRED', 'Verification code has expired');
  }

  // Check attempts
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('تم تجاوز الحد الأقصى للمحاولات', 400, 'MAX_ATTEMPTS', 'Maximum attempts exceeded');
  }

  if (otp.code !== code) {
    // Increment attempts
    await prisma.ownerOtp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });

    const remainingAttempts = MAX_OTP_ATTEMPTS - otp.attempts - 1;
    throw new AppError(
      `رمز التحقق غير صحيح. المحاولات المتبقية: ${remainingAttempts}`,
      400,
      'INVALID_OTP',
      `Invalid verification code. ${remainingAttempts} attempts remaining`
    );
  }

  // Mark OTP as used
  await prisma.ownerOtp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  return {
    success: true,
    ownerId: otp.ownerId,
    message: 'تم التحقق بنجاح',
  };
};

/**
 * Resend OTP code via SMS
 */
export const resendOtp = async (rawPhone: string, type: OtpType) => {
  const phone = normalizePhone(rawPhone);
  const owner = await findOwnerByPhone(rawPhone);

  if (!owner) {
    throw new AppError('رقم الهاتف غير مسجل', 404, 'PHONE_NOT_FOUND', 'Phone number is not registered');
  }

  // Check if already verified (for registration)
  if (type === OtpType.REGISTRATION && owner.isVerified && owner.passwordHash) {
    throw new AppError('الحساب مفعل بالفعل', 400, 'ALREADY_VERIFIED', 'Account is already verified');
  }

  // Generate new OTP
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete existing OTPs
  await prisma.ownerOtp.deleteMany({
    where: { phone, type },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      phone,
      code: otpCode,
      type,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP via SMS
  await sendOtpSms(phone, otpCode, owner.preferredLang as 'ar' | 'en');

  return {
    success: true,
    message: 'تم إرسال رمز التحقق مرة أخرى',
  };
};

/**
 * Complete registration: update email (if real) + set password + verify account
 */
export const completeRegistration = async (
  ownerId: string,
  password: string,
  firstName: string,
  lastName: string,
  email?: string
) => {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
  });

  if (!owner) {
    throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  if (owner.isVerified && owner.passwordHash) {
    throw new AppError('الحساب مفعل بالفعل', 400, 'ALREADY_VERIFIED', 'Account is already verified');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Prepare email update: only if provided and not placeholder
  let emailUpdate: { email: string } | object = {};
  if (email && !isPlaceholderEmail(email)) {
    // Check email not used by another owner
    const emailConflict = await prisma.owner.findFirst({
      where: { email, id: { not: ownerId } },
    });
    if (!emailConflict) {
      emailUpdate = { email };
    }
  }

  // Update owner with name + password + verification
  const updatedOwner = await prisma.owner.update({
    where: { id: ownerId },
    data: {
      firstName,
      lastName,
      passwordHash,
      isVerified: true,
      verifiedAt: new Date(),
      portalEnabled: true,
      ...emailUpdate,
    },
  });

  // Generate token
  const token = generateToken(updatedOwner);

  return {
    success: true,
    token,
    owner: {
      id: updatedOwner.id,
      firstName: updatedOwner.firstName,
      lastName: updatedOwner.lastName,
      email: isPlaceholderEmail(updatedOwner.email) ? null : updatedOwner.email,
      phone: updatedOwner.phone,
      customerCode: updatedOwner.customerCode,
      preferredLang: updatedOwner.preferredLang,
    },
  };
};

/**
 * Login customer (phone + password)
 */
export const login = async (rawPhone: string, password: string) => {
  const phone = normalizePhone(rawPhone);
  const owner = await findOwnerByPhone(rawPhone);

  if (!owner) {
    throw new AppError('رقم الهاتف أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS', 'Invalid phone or password');
  }

  // No password set yet
  if (!owner.passwordHash) {
    throw new AppError(
      'حسابك مسجل ولكن لم يتم تعيين كلمة مرور. اضغط على "نسيت كلمة المرور" لإنشاء كلمة مرور',
      401,
      'NO_PASSWORD',
      'Your account exists but no password is set. Click "Forgot Password" to create one'
    );
  }

  if (!owner.isVerified) {
    throw new AppError('الحساب غير مفعل. يرجى إكمال عملية التسجيل', 401, 'NOT_VERIFIED', 'Account is not verified. Please complete registration');
  }

  if (!owner.portalEnabled) {
    throw new AppError('تم تعطيل حسابك. يرجى التواصل مع العيادة', 403, 'ACCOUNT_DISABLED', 'Your account has been disabled. Please contact the clinic');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, owner.passwordHash);
  if (!isValidPassword) {
    throw new AppError('رقم الهاتف أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS', 'Invalid phone or password');
  }

  // Update last login
  await prisma.owner.update({
    where: { id: owner.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate token
  const token = generateToken(owner);

  return {
    success: true,
    token,
    owner: {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: isPlaceholderEmail(owner.email) ? null : owner.email,
      phone: owner.phone,
      customerCode: owner.customerCode,
      preferredLang: owner.preferredLang,
    },
  };
};

/**
 * Forgot password: send OTP via SMS
 */
export const forgotPassword = async (rawPhone: string) => {
  const phone = normalizePhone(rawPhone);
  const owner = await findOwnerByPhone(rawPhone);

  if (!owner) {
    // Don't reveal if phone exists for security
    return {
      success: true,
      message: 'إذا كان رقم الهاتف مسجلاً، ستصلك رسالة تحتوي على رمز إعادة التعيين',
    };
  }

  // Generate OTP
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete existing password reset OTPs
  await prisma.ownerOtp.deleteMany({
    where: { phone, type: OtpType.PASSWORD_RESET },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      phone,
      code: otpCode,
      type: OtpType.PASSWORD_RESET,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP via SMS
  await sendOtpSms(phone, otpCode, owner.preferredLang as 'ar' | 'en');

  return {
    success: true,
    message: 'تم إرسال رمز إعادة التعيين إلى رقم جوالك',
  };
};

/**
 * Reset password (after OTP verification)
 */
export const resetPassword = async (rawPhone: string, newPassword: string) => {
  const phone = normalizePhone(rawPhone);
  const owner = await findOwnerByPhone(rawPhone);

  if (!owner) {
    throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update owner
  const updatedOwner = await prisma.owner.update({
    where: { id: owner.id },
    data: {
      passwordHash,
      isVerified: true,
      verifiedAt: owner.verifiedAt || new Date(),
    },
  });

  // Generate token for auto-login
  const token = generateToken(updatedOwner);

  return {
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح',
    token,
    owner: {
      id: updatedOwner.id,
      customerCode: updatedOwner.customerCode,
      firstName: updatedOwner.firstName,
      lastName: updatedOwner.lastName,
      email: isPlaceholderEmail(updatedOwner.email) ? null : updatedOwner.email,
      phone: updatedOwner.phone,
      preferredLang: updatedOwner.preferredLang,
    },
  };
};

/**
 * Get customer profile
 */
export const getProfile = async (ownerId: string) => {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    include: {
      pets: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!owner) {
    throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  return {
    id: owner.id,
    customerCode: owner.customerCode,
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: isPlaceholderEmail(owner.email) ? null : owner.email,
    phone: owner.phone,
    address: owner.address,
    preferredLang: owner.preferredLang,
    pets: owner.pets.map(pet => ({
      id: pet.id,
      petCode: pet.petCode,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      birthDate: pet.birthDate,
      photoUrl: pet.photoUrl,
    })),
  };
};

/**
 * Update customer profile
 */
export const updateProfile = async (ownerId: string, data: {
  firstName?: string;
  lastName?: string;
  address?: string;
  preferredLang?: string;
}) => {
  const owner = await prisma.owner.update({
    where: { id: ownerId },
    data,
  });

  return {
    id: owner.id,
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: isPlaceholderEmail(owner.email) ? null : owner.email,
    phone: owner.phone,
    address: owner.address,
    preferredLang: owner.preferredLang,
  };
};

/**
 * Verify customer JWT token
 */
export const verifyToken = (token: string): CustomerTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CustomerTokenPayload;

    if (decoded.type !== 'customer') {
      throw new AppError('رمز غير صالح', 401, 'INVALID_TOKEN', 'Invalid token');
    }

    return decoded;
  } catch (error) {
    throw new AppError('رمز غير صالح أو منتهي الصلاحية', 401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
};

export default {
  register,
  verifyOtp,
  resendOtp,
  completeRegistration,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  verifyToken,
  checkPhoneStatus,
};
