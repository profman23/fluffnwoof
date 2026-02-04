import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OtpType } from '@prisma/client';
import { sendOtpEmail } from './emailService';
import { AppError } from '../middlewares/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const BCRYPT_ROUNDS = 10;

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  nationalId?: string;
  preferredLang?: string;
}

interface CustomerTokenPayload {
  id: string;
  email: string;
  type: 'customer';
}

/**
 * Generate 6-digit OTP code
 */
const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate customer JWT token
 */
const generateToken = (owner: { id: string; email: string }): string => {
  const payload: CustomerTokenPayload = {
    id: owner.id,
    email: owner.email!,
    type: 'customer',
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate customer code (C00000001 format)
 */
const generateCustomerCode = async (): Promise<string> => {
  const lastOwner = await prisma.owner.findFirst({
    orderBy: { customerCode: 'desc' },
  });

  let nextNumber = 1;
  if (lastOwner?.customerCode) {
    const match = lastOwner.customerCode.match(/C(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `C${nextNumber.toString().padStart(8, '0')}`;
};

/**
 * Register new customer (Step 1: Create owner and send OTP)
 */
export const register = async (input: RegisterInput) => {
  const { firstName, lastName, email, phone, address, nationalId, preferredLang = 'ar' } = input;

  // Check if email already exists and is verified
  const existingByEmail = await prisma.owner.findFirst({
    where: { email, isVerified: true },
  });
  if (existingByEmail) {
    throw new AppError('البريد الإلكتروني مسجل بالفعل', 409, 'EMAIL_EXISTS', 'Email is already registered');
  }

  // Check if phone already exists
  const existingByPhone = await prisma.owner.findFirst({
    where: { phone },
  });

  let owner;

  if (existingByPhone) {
    // Owner exists with this phone
    if (existingByPhone.isVerified && existingByPhone.passwordHash) {
      throw new AppError('رقم الهاتف مسجل بالفعل', 409, 'PHONE_EXISTS', 'Phone number is already registered');
    }

    // Update existing unverified owner
    owner = await prisma.owner.update({
      where: { id: existingByPhone.id },
      data: {
        firstName,
        lastName,
        email,
        address,
        nationalId,
        preferredLang,
      },
    });
  } else {
    // Create new owner
    const customerCode = await generateCustomerCode();

    owner = await prisma.owner.create({
      data: {
        customerCode,
        firstName,
        lastName,
        email,
        phone,
        address,
        nationalId,
        preferredLang,
        isVerified: false,
        portalEnabled: true,
      },
    });
  }

  // Generate and save OTP
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete any existing OTPs for this email
  await prisma.ownerOtp.deleteMany({
    where: { email, type: OtpType.REGISTRATION },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      email,
      code: otpCode,
      type: OtpType.REGISTRATION,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP email
  await sendOtpEmail({
    to: email,
    recipientName: `${firstName} ${lastName}`,
    otpCode,
    type: 'REGISTRATION',
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  return {
    success: true,
    message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
    ownerId: owner.id,
    email,
  };
};

/**
 * Verify OTP code
 */
export const verifyOtp = async (email: string, code: string, type: OtpType) => {
  const otp = await prisma.ownerOtp.findFirst({
    where: {
      email,
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

  // Verify code - debug logging
  console.log('[OTP Debug] Stored code:', otp.code, '| Entered code:', code, '| Match:', otp.code === code);

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
 * Resend OTP code
 */
export const resendOtp = async (email: string, type: OtpType) => {
  const owner = await prisma.owner.findFirst({
    where: { email },
  });

  if (!owner) {
    throw new AppError('البريد الإلكتروني غير مسجل', 404, 'EMAIL_NOT_FOUND', 'Email is not registered');
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
    where: { email, type },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      email,
      code: otpCode,
      type,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP email
  await sendOtpEmail({
    to: email,
    recipientName: `${owner.firstName} ${owner.lastName}`,
    otpCode,
    type: type === OtpType.REGISTRATION ? 'REGISTRATION' : 'PASSWORD_RESET',
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  return {
    success: true,
    message: 'تم إرسال رمز التحقق مرة أخرى',
  };
};

/**
 * Complete registration (set password after OTP verification)
 */
export const completeRegistration = async (ownerId: string, password: string) => {
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

  // Update owner
  const updatedOwner = await prisma.owner.update({
    where: { id: ownerId },
    data: {
      passwordHash,
      isVerified: true,
      verifiedAt: new Date(),
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
      email: updatedOwner.email,
      phone: updatedOwner.phone,
      customerCode: updatedOwner.customerCode,
      preferredLang: updatedOwner.preferredLang,
    },
  };
};

/**
 * Login customer
 */
export const login = async (email: string, password: string) => {
  const owner = await prisma.owner.findFirst({
    where: { email },
  });

  if (!owner) {
    throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Staff-created owner without password - needs to set password first
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
    throw new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
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
      email: owner.email,
      phone: owner.phone,
      customerCode: owner.customerCode,
      preferredLang: owner.preferredLang,
    },
  };
};

/**
 * Request password reset (forgot password)
 * Works for both verified users AND staff-created owners (no password yet)
 */
export const forgotPassword = async (email: string) => {
  // Find owner by email (regardless of verification status)
  const owner = await prisma.owner.findFirst({
    where: { email },
  });

  if (!owner) {
    // Don't reveal if email exists or not for security
    return {
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة تحتوي على رمز إعادة التعيين',
    };
  }

  // Generate OTP
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete existing password reset OTPs
  await prisma.ownerOtp.deleteMany({
    where: { email, type: OtpType.PASSWORD_RESET },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      email,
      code: otpCode,
      type: OtpType.PASSWORD_RESET,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP email
  await sendOtpEmail({
    to: email,
    recipientName: `${owner.firstName} ${owner.lastName}`,
    otpCode,
    type: 'PASSWORD_RESET',
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  return {
    success: true,
    message: 'تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني',
  };
};

/**
 * Reset password (after OTP verification)
 * Works for both verified users AND staff-created owners
 * Returns token for auto-login after password reset
 */
export const resetPassword = async (email: string, newPassword: string) => {
  const owner = await prisma.owner.findFirst({
    where: { email },
  });

  if (!owner) {
    throw new AppError('العميل غير موجود', 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update owner - also set isVerified to true (for staff-created owners)
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
      email: updatedOwner.email,
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
    email: owner.email,
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
    email: owner.email,
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

/**
 * Check email status for registration flow
 * Returns: NOT_FOUND | REGISTERED | CLAIMABLE
 */
export const checkEmailStatus = async (email: string): Promise<{
  status: 'NOT_FOUND' | 'REGISTERED' | 'CLAIMABLE';
  ownerId?: string;
}> => {
  const owner = await prisma.owner.findFirst({
    where: { email },
    select: { id: true, passwordHash: true, isVerified: true },
  });

  if (!owner) {
    return { status: 'NOT_FOUND' };
  }

  // Has passwordHash = fully registered via portal
  if (owner.passwordHash) {
    return { status: 'REGISTERED' };
  }

  // Exists but no password = staff-created owner (can claim account)
  return { status: 'CLAIMABLE', ownerId: owner.id };
};

/**
 * Claim account for staff-created owners
 * Sends OTP to verify email ownership before allowing password setup
 */
export const claimAccount = async (email: string) => {
  const owner = await prisma.owner.findFirst({
    where: { email },
  });

  if (!owner) {
    throw new AppError('البريد الإلكتروني غير مسجل', 404, 'EMAIL_NOT_FOUND', 'Email is not registered');
  }

  if (owner.passwordHash) {
    throw new AppError('الحساب مفعل بالفعل. يرجى تسجيل الدخول', 400, 'ALREADY_VERIFIED', 'Account is already verified. Please login');
  }

  // Generate and save OTP
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Delete any existing OTPs for this email
  await prisma.ownerOtp.deleteMany({
    where: { email, type: OtpType.REGISTRATION },
  });

  // Create new OTP
  await prisma.ownerOtp.create({
    data: {
      ownerId: owner.id,
      email,
      code: otpCode,
      type: OtpType.REGISTRATION,
      expiresAt,
      attempts: 0,
    },
  });

  // Send OTP email
  await sendOtpEmail({
    to: email,
    recipientName: `${owner.firstName} ${owner.lastName}`,
    otpCode,
    type: 'REGISTRATION',
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });

  return {
    success: true,
    message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
    ownerId: owner.id,
    email,
  };
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
  checkEmailStatus,
  claimAccount,
};
