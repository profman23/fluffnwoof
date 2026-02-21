import { Request, Response, NextFunction } from 'express';
import { OtpType, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import customerAuthService from '../services/customerAuthService';
import { shiftService } from '../services/shiftService';
import { visitTypeService } from '../services/visitTypeService';
import { appointmentService } from '../services/appointmentService';
import { formService } from '../services/formService';
import { sendPendingBookingEmail, sendCancellationNotice } from '../services/emailService';
import * as uploadService from '../services/uploadService';
import { AppError } from '../middlewares/errorHandler';
import { slotSuggestionService } from '../services/slotSuggestionService';
import { bookingNamespace } from '../websocket/bookingNamespace';

/**
 * Calculate the difference in hours between two dates
 */
const differenceInHours = (dateLeft: Date, dateRight: Date): number => {
  const diffMs = dateLeft.getTime() - dateRight.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
};

// =====================================
// Auth Endpoints
// =====================================

/**
 * POST /api/portal/check-phone
 * Check phone status for registration flow
 */
export const checkPhone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError('رقم الهاتف مطلوب', 400, 'PHONE_REQUIRED', 'Phone is required');
    }

    const result = await customerAuthService.checkPhoneStatus(phone);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/register
 * Register new customer (phone-first)
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, preferredLang } = req.body;

    if (!phone) {
      throw new AppError('رقم الهاتف مطلوب', 400, 'PHONE_REQUIRED', 'Phone number is required');
    }

    const result = await customerAuthService.register({ phone, preferredLang });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/verify-otp
 * Verify OTP code (phone-based)
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code, type } = req.body;

    if (!phone || !code || !type) {
      throw new AppError('البيانات المطلوبة غير مكتملة', 400);
    }

    const otpType = type === 'registration' ? OtpType.REGISTRATION : OtpType.PASSWORD_RESET;
    const result = await customerAuthService.verifyOtp(phone, code, otpType);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/resend-otp
 * Resend OTP code via SMS
 */
export const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, type } = req.body;

    if (!phone || !type) {
      throw new AppError('البيانات المطلوبة غير مكتملة', 400);
    }

    const otpType = type === 'registration' ? OtpType.REGISTRATION : OtpType.PASSWORD_RESET;
    const result = await customerAuthService.resendOtp(phone, otpType);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/complete-registration
 * Set password after OTP verification
 */
export const completeRegistration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId, password, firstName, lastName, email } = req.body;

    if (!ownerId || !password || !firstName || !lastName) {
      throw new AppError('البيانات المطلوبة غير مكتملة', 400, 'REQUIRED_FIELDS', 'Required fields are missing');
    }

    if (password.length < 8) {
      throw new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400, 'PASSWORD_TOO_SHORT', 'Password must be at least 8 characters');
    }

    const result = await customerAuthService.completeRegistration(ownerId, password, firstName, lastName, email);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/login
 * Login customer (phone + password)
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      throw new AppError('رقم الهاتف وكلمة المرور مطلوبان', 400, 'VALIDATION_ERROR', 'Phone and password are required');
    }

    const result = await customerAuthService.login(phone, password);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/forgot-password
 * Request password reset via SMS OTP
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw new AppError('رقم الهاتف مطلوب', 400, 'PHONE_REQUIRED', 'Phone number is required');
    }

    const result = await customerAuthService.forgotPassword(phone);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/reset-password
 * Reset password after OTP verification
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, newPassword } = req.body;

    if (!phone || !newPassword) {
      throw new AppError('البيانات المطلوبة غير مكتملة', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400);
    }

    const result = await customerAuthService.resetPassword(phone, newPassword);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// =====================================
// Profile Endpoints
// =====================================

/**
 * GET /api/portal/me
 * Get customer profile
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const result = await customerAuthService.getProfile(customerId);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/portal/me
 * Update customer profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { firstName, lastName, address, preferredLang } = req.body;

    const result = await customerAuthService.updateProfile(customerId, {
      firstName,
      lastName,
      address,
      preferredLang,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Pets Endpoints
// =====================================

/**
 * GET /api/portal/pets
 * Get customer's pets
 */
export const getPets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;

    const pets = await prisma.pet.findMany({
      where: {
        ownerId: customerId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: pets });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portal/pets/:id
 * Get pet details with medical records and appointments
 */
export const getPetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id } = req.params;

    const pet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: customerId,
        isActive: true,
      },
      include: {
        medicalRecords: {
          orderBy: { visitDate: 'desc' },
          take: 10,
          include: {
            vet: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 5,
          include: {
            vet: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!pet) {
      throw new AppError('الحيوان غير موجود', 404, 'PET_NOT_FOUND', 'Pet not found');
    }

    res.json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/pets
 * Add new pet
 */
export const addPet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { name, species, breed, gender, birthDate, color, weight, notes } = req.body;

    if (!name || !species || !gender) {
      throw new AppError('اسم الحيوان والنوع والجنس مطلوبين', 400);
    }

    // Generate pet code
    const lastPet = await prisma.pet.findFirst({
      orderBy: { petCode: 'desc' },
    });

    let nextNumber = 1;
    if (lastPet?.petCode) {
      const match = lastPet.petCode.match(/P(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const petCode = `P${nextNumber.toString().padStart(8, '0')}`;

    const pet = await prisma.pet.create({
      data: {
        petCode,
        name,
        species,
        breed,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        color,
        weight: weight ? parseFloat(weight) : null,
        notes,
        ownerId: customerId,
      },
    });

    res.status(201).json({ success: true, data: pet });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/portal/pets/:id
 * Update pet info
 */
export const updatePet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id } = req.params;
    const { name, breed, birthDate, color, weight, notes } = req.body;

    // Verify ownership
    const pet = await prisma.pet.findFirst({
      where: { id, ownerId: customerId },
    });

    if (!pet) {
      throw new AppError('الحيوان غير موجود', 404);
    }

    const updatedPet = await prisma.pet.update({
      where: { id },
      data: {
        name,
        breed,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        color,
        weight: weight ? parseFloat(weight) : undefined,
        notes,
      },
    });

    res.json({ success: true, data: updatedPet });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/pets/:id/photo
 * Upload pet photo (customer must own the pet)
 */
export const uploadPetPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id: petId } = req.params;

    // Verify pet ownership
    const pet = await prisma.pet.findFirst({
      where: { id: petId, ownerId: customerId },
    });

    if (!pet) {
      throw new AppError('الحيوان غير موجود', 404, 'PET_NOT_FOUND', 'Pet not found');
    }

    if (!req.file) {
      throw new AppError('لم يتم رفع صورة', 400, 'NO_FILE', 'No file uploaded');
    }

    const updatedPet = await uploadService.uploadPetPhoto(petId, req.file);
    res.json({ success: true, data: updatedPet });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/portal/pets/:id/photo
 * Remove pet photo (customer must own the pet)
 */
export const removePetPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id: petId } = req.params;

    // Verify pet ownership
    const pet = await prisma.pet.findFirst({
      where: { id: petId, ownerId: customerId },
    });

    if (!pet) {
      throw new AppError('الحيوان غير موجود', 404, 'PET_NOT_FOUND', 'Pet not found');
    }

    const updatedPet = await uploadService.removePetPhoto(petId);
    res.json({ success: true, data: updatedPet });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Booking Data Endpoints (Public)
// =====================================

/**
 * GET /api/portal/visit-types
 * Get active visit types
 */
export const getVisitTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitTypes = await prisma.visitTypeConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        code: true,
        nameEn: true,
        nameAr: true,
        duration: true,
        color: true,
      },
    });

    res.json({ success: true, data: visitTypes });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portal/vets
 * Get available vets with schedules
 */
export const getVets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get all active users marked as bookable (regardless of role)
    // isBookable is the only control for who appears in booking lists
    const vets = await prisma.user.findMany({
      where: {
        isActive: true,
        isBookable: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        vetSchedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        vetSchedulePeriods: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    // Auto-initialize schedules for vets without any
    const result = await Promise.all(
      vets.map(async (vet) => {
        let schedules = vet.vetSchedules;

        // If vet has no schedules, initialize default schedules
        if (schedules.length === 0) {
          schedules = await shiftService.initializeDefaultSchedule(vet.id);
        }

        // Check if vet has any active schedule periods
        const hasActivePeriod = vet.vetSchedulePeriods.some(period => {
          const today = new Date();
          const periodStart = new Date(period.startDate);
          const periodEnd = new Date(period.endDate);
          return periodStart <= today && periodEnd >= today;
        });

        return {
          id: vet.id,
          firstName: vet.firstName,
          lastName: vet.lastName,
          avatar: vet.avatarUrl,
          hasActivePeriod,
          schedule: schedules.map(s => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isWorkingDay: s.isWorkingDay,
          })),
        };
      })
    );

    // Since isBookable is explicitly set, return all bookable vets
    // They will have their schedules auto-initialized if empty
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portal/availability/:vetId/:date
 * Get available time slots for a vet on a specific date
 */
export const getAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vetId, date } = req.params;
    const duration = parseInt(req.query.duration as string) || 30;

    // Use existing shiftService for availability calculation
    const result = await shiftService.getAvailableSlotsWithReason(vetId, date, duration);

    res.json({
      success: true,
      data: {
        date,
        vetId,
        slots: result.slots,
        unavailableReason: result.unavailableReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Appointment Endpoints
// =====================================

/**
 * GET /api/portal/appointments
 * Get customer's appointments
 */
export const getAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { filter } = req.query; // 'upcoming' | 'past' | 'all'

    // Normalize to start of today (midnight UTC) for proper date-only comparison
    // This ensures appointments for today are included in 'upcoming'
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const whereClause: any = {
      pet: { ownerId: customerId },
    };

    if (filter === 'upcoming') {
      // Include appointments from today onwards (not cancelled/completed)
      whereClause.appointmentDate = { gte: todayStart };
      whereClause.status = { notIn: ['CANCELLED', 'COMPLETED'] };
    } else if (filter === 'past') {
      // Include appointments before today OR any cancelled/completed
      whereClause.OR = [
        { appointmentDate: { lt: todayStart } },
        { status: { in: ['CANCELLED', 'COMPLETED'] } },
      ];
    }

    // For 'upcoming', show nearest appointments first (asc)
    // For 'past' or 'all', show most recent first (desc)
    const sortOrder = filter === 'upcoming' ? 'asc' : 'desc';

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        pet: {
          select: { id: true, name: true, species: true, petCode: true, photoUrl: true },
        },
        vet: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [
        { appointmentDate: sortOrder },
        { appointmentTime: sortOrder },
      ],
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portal/appointments/:id
 * Get appointment details with pet and vet info
 */
export const getAppointmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        pet: { ownerId: customerId },
      },
      include: {
        pet: {
          select: { id: true, name: true, species: true, petCode: true, photoUrl: true },
        },
        vet: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        medicalRecords: {
          select: {
            id: true,
            diagnosis: true,
            treatment: true,
            notes: true,
            visitDate: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError('الموعد غير موجود', 404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/appointments
 * Book new appointment with atomic transaction to prevent race conditions
 */
export const bookAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { petId, vetId, visitType, appointmentDate, appointmentTime, reason } = req.body;

    // Validate required fields
    if (!petId || !vetId || !visitType || !appointmentDate || !appointmentTime) {
      throw new AppError('جميع الحقول المطلوبة يجب ملؤها', 400);
    }

    // Verify pet ownership (outside transaction for early validation)
    const pet = await prisma.pet.findFirst({
      where: { id: petId, ownerId: customerId },
      include: { owner: true },
    });

    if (!pet) {
      throw new AppError('الحيوان غير موجود', 404);
    }

    // Get visit type duration
    const visitTypeConfig = await prisma.visitTypeConfig.findFirst({
      where: { code: visitType, isActive: true },
    });
    const duration = visitTypeConfig?.duration || 30;

    // Normalize date string for database
    const dateStr = new Date(appointmentDate).toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // ATOMIC TRANSACTION: Check availability + create booking in one operation
    // This prevents race conditions where two customers book the same slot
    const result = await prisma.$transaction(
      async (tx) => {
        // Step 1: Lock the vet row to serialize concurrent bookings
        // This ensures only one booking operation proceeds at a time for this vet
        await tx.$queryRaw`
          SELECT id FROM "users"
          WHERE id = ${vetId}
          FOR UPDATE
        `;

        // Step 2: Check if slot is already booked (inside transaction)
        const existingAppointment = await tx.appointment.findFirst({
          where: {
            vetId,
            appointmentDate: normalizedDate,
            appointmentTime,
            status: { notIn: ['CANCELLED'] },
          },
        });

        if (existingAppointment) {
          throw new Error('SLOT_ALREADY_BOOKED');
        }

        // Step 2b: Check for active reservation by another session
        const existingReservation = await tx.slotReservation.findFirst({
          where: {
            vetId,
            reservationDate: normalizedDate,
            reservationTime: appointmentTime,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        });

        if (existingReservation) {
          throw new Error('SLOT_RESERVED');
        }

        // Step 3: Create the appointment (protected by row lock + unique constraint)
        const appointment = await tx.appointment.create({
          data: {
            petId,
            vetId,
            visitType,
            appointmentDate: normalizedDate,
            appointmentTime,
            duration,
            reason,
            status: 'SCHEDULED',
            source: 'CUSTOMER_PORTAL',
            isConfirmed: false,
          },
          include: {
            pet: { include: { owner: true } },
            vet: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        // Step 4: Create staff notification with PENDING status
        await tx.staffNotification.create({
          data: {
            type: 'CUSTOMER_BOOKING',
            appointmentId: appointment.id,
            status: 'PENDING',
          },
        });

        return appointment;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000, // 10 seconds
      }
    );

    // Broadcast slot booked event via WebSocket
    const broadcastDateStr = normalizedDate.toISOString().split('T')[0];
    bookingNamespace.broadcastSlotBooked(vetId, broadcastDateStr, appointmentTime);

    // Send pending approval email to customer (outside transaction - non-critical)
    if (pet.owner.email) {
      try {
        await sendPendingBookingEmail({
          to: pet.owner.email,
          recipientName: `${pet.owner.firstName} ${pet.owner.lastName}`,
          petName: pet.name,
          appointmentDate: normalizedDate.toLocaleDateString('ar-EG'),
          appointmentTime,
        });
      } catch (emailError) {
        console.error('Failed to send pending booking email:', emailError);
        // Don't fail the booking if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم استلام طلب الحجز وسيتم إشعارك عند الموافقة',
      data: result,
    });
  } catch (error: any) {
    const { vetId, visitType, appointmentDate, appointmentTime } = req.body;

    // Get visit type duration for alternatives
    let duration = 30;
    try {
      const visitTypeConfig = await prisma.visitTypeConfig.findFirst({
        where: { code: visitType, isActive: true },
      });
      duration = visitTypeConfig?.duration || 30;
    } catch (_) {
      // Use default duration if lookup fails
    }

    // Check if this is a conflict-related error (race condition handling)
    const isConflictError =
      error.message === 'SLOT_ALREADY_BOOKED' ||
      error.message === 'SLOT_RESERVED' ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
      // P2034: Transaction conflict/serialization failure (concurrent booking)
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') ||
      // Handle PostgreSQL serialization failures
      (error.message?.includes('could not serialize') || error.message?.includes('serialization'));

    // Get smart alternatives for all conflict types
    let alternatives: any[] = [];
    if (isConflictError) {
      try {
        const dateStr = new Date(appointmentDate).toISOString().split('T')[0];
        alternatives = await slotSuggestionService.findAlternatives({
          vetId,
          requestedDate: dateStr,
          requestedTime: appointmentTime,
          duration,
          limit: 5,
        });
      } catch (altError) {
        console.error('Failed to get alternatives:', altError);
      }

      // All conflict errors return 409 with alternatives
      return res.status(409).json({
        success: false,
        error: error.message === 'SLOT_RESERVED'
          ? 'هذا الموعد قيد الحجز من قبل عميل آخر. يرجى اختيار وقت آخر.'
          : 'تم حجز هذا الموعد من قبل عميل آخر. يرجى اختيار وقت آخر.',
        errorEn: error.message === 'SLOT_RESERVED'
          ? 'This slot is being reserved by another customer. Please select a different time.'
          : 'This time slot has just been booked by another customer. Please select a different time.',
        code: error.message === 'SLOT_RESERVED' ? 'SLOT_RESERVED' : 'SLOT_CONFLICT',
        alternatives,
      });
    }

    next(error);
  }
};

/**
 * DELETE /api/portal/appointments/:id
 * Cancel appointment (24-hour rule for confirmed appointments)
 */
export const cancelAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id } = req.params;

    // Find appointment and verify ownership
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        pet: { ownerId: customerId },
      },
      include: {
        pet: {
          include: { owner: true },
        },
        vet: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!appointment) {
      throw new AppError('الموعد غير موجود', 404);
    }

    // Check if already cancelled or completed
    if (appointment.status === 'CANCELLED') {
      throw new AppError('الموعد ملغي بالفعل', 400);
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('لا يمكن إلغاء موعد مكتمل', 400);
    }

    // Check 24-hour rule for confirmed appointments
    if (appointment.status !== 'SCHEDULED') {
      const appointmentDateTime = new Date(
        `${appointment.appointmentDate.toISOString().split('T')[0]}T${appointment.appointmentTime}`
      );
      const hoursUntil = differenceInHours(appointmentDateTime, new Date());

      if (hoursUntil < 24) {
        throw new AppError('لا يمكن إلغاء الموعد قبل أقل من 24 ساعة', 400);
      }
    }

    // Cancel the appointment
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: 'CUSTOMER',
        cancelledAt: new Date(),
      },
    });

    // Create staff notification
    await prisma.staffNotification.create({
      data: {
        type: 'CUSTOMER_CANCELLATION',
        appointmentId: id,
      },
    });

    // Send cancellation email
    if (appointment.pet.owner.email) {
      await sendCancellationNotice({
        to: appointment.pet.owner.email,
        recipientName: `${appointment.pet.owner.firstName} ${appointment.pet.owner.lastName}`,
        petName: appointment.pet.name,
        appointmentDate: appointment.appointmentDate.toLocaleDateString('ar-EG'),
        appointmentTime: appointment.appointmentTime,
        cancelledBy: 'CUSTOMER',
      });
    }

    res.json({
      success: true,
      message: 'تم إلغاء الموعد بنجاح',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================
// Forms Endpoints
// =====================================

/**
 * GET /api/portal/forms
 * Get all forms requiring customer signature
 */
export const getForms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { status } = req.query;

    // Get all pets for this customer
    const customerPets = await prisma.pet.findMany({
      where: { ownerId: customerId },
      select: { id: true },
    });

    const petIds = customerPets.map((p) => p.id);

    // Build status filter
    let statusFilter: any = {};
    if (status === 'pending') {
      statusFilter = { clientSignedAt: null };
    } else if (status === 'signed') {
      statusFilter = { clientSignedAt: { not: null } };
    }

    // Get forms for customer's pets
    const forms = await prisma.petForm.findMany({
      where: {
        petId: { in: petIds },
        ...statusFilter,
      },
      include: {
        template: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            category: true,
            requiresClientSignature: true,
            requiresVetSignature: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            petCode: true,
          },
        },
        signatures: {
          select: {
            id: true,
            signerType: true,
            signerName: true,
            signedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to include pending status
    const transformedForms = forms.map((form) => {
      const clientSigned = form.signatures.some((s) => s.signerType === 'CLIENT');
      const vetSigned = form.signatures.some((s) => s.signerType === 'VET');
      const isComplete =
        (!form.template.requiresClientSignature || clientSigned) &&
        (!form.template.requiresVetSignature || vetSigned);

      // Get signed dates from signatures
      const clientSignature = form.signatures.find((s) => s.signerType === 'CLIENT');
      const vetSignature = form.signatures.find((s) => s.signerType === 'VET');

      return {
        id: form.id,
        template: form.template,
        pet: form.pet,
        status: isComplete ? 'COMPLETED' : clientSigned ? 'AWAITING_VET' : 'PENDING',
        clientSignedAt: clientSignature?.signedAt || null,
        vetSignedAt: vetSignature?.signedAt || null,
        expiresAt: form.expiresAt,
        createdAt: form.createdAt,
        signatures: form.signatures,
      };
    });

    res.json({ success: true, data: transformedForms });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portal/forms/:id
 * Get form details for signing
 */
export const getFormById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id } = req.params;

    // Get form with all details
    const form = await prisma.petForm.findFirst({
      where: {
        id,
        pet: { ownerId: customerId },
      },
      include: {
        template: true,
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                customerCode: true,
                nationalId: true,
                address: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            reason: true,
            vet: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        signatures: {
          select: {
            id: true,
            signerType: true,
            signerName: true,
            signedAt: true,
          },
        },
      },
    });

    if (!form) {
      throw new AppError('النموذج غير موجود', 404, 'FORM_NOT_FOUND', 'Form not found');
    }

    // Check if expired
    if (form.expiresAt && new Date() > form.expiresAt) {
      throw new AppError('انتهت صلاحية النموذج', 400, 'FORM_EXPIRED', 'Form has expired');
    }

    // Fill template variables
    const vet = form.appointment?.vet || null;
    const filledContentEn = formService.fillTemplateVariables(
      form.template.contentEn,
      form.pet,
      vet,
      form.appointment
    );

    const filledContentAr = formService.fillTemplateVariables(
      form.template.contentAr,
      form.pet,
      vet,
      form.appointment
    );

    // Check signature status
    const clientSigned = form.signatures.some((s) => s.signerType === 'CLIENT');
    const vetSigned = form.signatures.some((s) => s.signerType === 'VET');

    res.json({
      success: true,
      data: {
        id: form.id,
        template: {
          id: form.template.id,
          nameEn: form.template.nameEn,
          nameAr: form.template.nameAr,
          category: form.template.category,
          requiresClientSignature: form.template.requiresClientSignature,
          requiresVetSignature: form.template.requiresVetSignature,
        },
        contentEn: filledContentEn,
        contentAr: filledContentAr,
        pet: form.pet,
        appointment: form.appointment,
        vet: vet,
        signatures: form.signatures,
        status: {
          clientSigned,
          vetSigned,
          isComplete:
            (!form.template.requiresClientSignature || clientSigned) &&
            (!form.template.requiresVetSignature || vetSigned),
        },
        expiresAt: form.expiresAt,
        createdAt: form.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/portal/forms/:id/sign
 * Sign a form as customer
 */
export const signForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customerId!;
    const { id } = req.params;
    const { signatureData } = req.body;

    if (!signatureData) {
      throw new AppError('بيانات التوقيع مطلوبة', 400, 'SIGNATURE_REQUIRED', 'Signature data is required');
    }

    // Verify form belongs to customer's pet
    const form = await prisma.petForm.findFirst({
      where: {
        id,
        pet: { ownerId: customerId },
      },
      include: {
        pet: {
          include: { owner: true },
        },
        template: true,
      },
    });

    if (!form) {
      throw new AppError('النموذج غير موجود', 404, 'FORM_NOT_FOUND', 'Form not found');
    }

    // Check if already signed by client
    const existingSignature = await prisma.formSignature.findFirst({
      where: {
        petFormId: id,
        signerType: 'CLIENT',
      },
    });

    if (existingSignature) {
      throw new AppError('تم توقيع النموذج مسبقاً', 400, 'ALREADY_SIGNED', 'Form already signed');
    }

    // Check if expired
    if (form.expiresAt && new Date() > form.expiresAt) {
      throw new AppError('انتهت صلاحية النموذج', 400, 'FORM_EXPIRED', 'Form has expired');
    }

    // Get customer info
    const customer = await prisma.owner.findUnique({
      where: { id: customerId },
      select: { firstName: true, lastName: true },
    });

    // Create signature
    const signature = await formService.signForm({
      petFormId: id,
      signerType: 'CLIENT',
      signerName: `${customer?.firstName} ${customer?.lastName}`,
      signerId: customerId,
      signatureData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: signature,
      message: 'تم توقيع النموذج بنجاح',
      messageEn: 'Form signed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  // Auth
  checkPhone,
  register,
  verifyOtp,
  resendOtp,
  completeRegistration,
  login,
  forgotPassword,
  resetPassword,
  // Profile
  getProfile,
  updateProfile,
  // Pets
  getPets,
  getPetById,
  addPet,
  updatePet,
  uploadPetPhoto,
  removePetPhoto,
  // Booking data
  getVisitTypes,
  getVets,
  getAvailability,
  // Appointments
  getAppointments,
  getAppointmentById,
  bookAppointment,
  cancelAppointment,
  // Forms
  getForms,
  getFormById,
  signForm,
};
