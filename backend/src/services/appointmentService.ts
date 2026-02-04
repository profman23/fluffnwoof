import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';
import { AppointmentStatus } from '@prisma/client';
import { reminderService } from './reminderService';

export const appointmentService = {
  /**
   * التحقق من وجود تعارض في المواعيد للدكتور
   */
  async checkTimeConflict(
    vetId: string,
    date: Date | string,
    startTime: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    // حساب وقت النهاية للموعد الجديد
    const [startHour, startMin] = startTime.split(':').map(Number);
    const newStartMinutes = startHour * 60 + startMin;
    const newEndMinutes = newStartMinutes + duration;

    // تحويل التاريخ إلى بداية ونهاية اليوم
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // جلب كل مواعيد الدكتور في نفس اليوم (ما عدا الملغية)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        vetId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
      },
      select: {
        appointmentTime: true,
        duration: true,
      },
    });

    // التحقق من التعارض مع كل موعد موجود
    for (const appt of existingAppointments) {
      const [existHour, existMin] = appt.appointmentTime.split(':').map(Number);
      const existStartMinutes = existHour * 60 + existMin;
      const existEndMinutes = existStartMinutes + (appt.duration || 30);

      // يوجد تعارض إذا:
      // الموعد الجديد يبدأ قبل نهاية الموجود AND
      // الموعد الجديد ينتهي بعد بداية الموجود
      if (newStartMinutes < existEndMinutes && newEndMinutes > existStartMinutes) {
        return true; // يوجد تعارض
      }
    }

    return false; // لا يوجد تعارض
  },

  async create(data: {
    petId: string;
    vetId: string;
    appointmentDate: Date;
    appointmentTime: string;
    duration?: number;
    visitType?: string;
    reason?: string;
    notes?: string;
    scheduledFromRecordId?: string;
    source?: 'STAFF' | 'CUSTOMER_PORTAL';
  }) {
    // استخدام Transaction لمنع Race Conditions عند الحجز المتزامن
    const result = await prisma.$transaction(async (tx) => {
      // التحقق من تعارض المواعيد داخل الـ transaction
      const [startHour, startMin] = data.appointmentTime.split(':').map(Number);
      const newStartMinutes = startHour * 60 + startMin;
      const newEndMinutes = newStartMinutes + (data.duration || 30);

      const targetDate = typeof data.appointmentDate === 'string' ? new Date(data.appointmentDate) : data.appointmentDate;
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // جلب كل مواعيد الدكتور في نفس اليوم (ما عدا الملغية)
      const existingAppointments = await tx.appointment.findMany({
        where: {
          vetId: data.vetId,
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { not: 'CANCELLED' },
        },
        select: {
          appointmentTime: true,
          duration: true,
        },
      });

      // التحقق من التعارض مع كل موعد موجود
      for (const appt of existingAppointments) {
        const [existHour, existMin] = appt.appointmentTime.split(':').map(Number);
        const existStartMinutes = existHour * 60 + existMin;
        const existEndMinutes = existStartMinutes + (appt.duration || 30);

        if (newStartMinutes < existEndMinutes && newEndMinutes > existStartMinutes) {
          throw new AppError('هذا الدكتور لديه موعد آخر في هذا الوقت', 409);
        }
      }

      // إنشاء الموعد داخل نفس الـ transaction
      const appointment = await tx.appointment.create({
        data: {
          ...data,
          duration: data.duration || 30,
        },
        include: {
          pet: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          vet: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return appointment;
    });

    // إرسال تذكير حجز الموعد (يتحقق من الإعدادات تلقائياً)
    reminderService.sendReminder(result.id, 'APPOINTMENT_BOOKED')
      .catch(err => console.error('[Reminder] APPOINTMENT_BOOKED send failed:', err));

    return result;
  },

  /**
   * Create multiple appointments in a single transaction
   * Used for booking next appointments from PatientRecordModal
   * Returns both created and skipped appointments with reasons
   */
  async createBatch(appointments: Array<{
    petId: string;
    vetId: string;
    appointmentDate: Date;
    appointmentTime: string;
    duration?: number;
    visitType?: string;
    reason?: string;
    notes?: string;
    scheduledFromRecordId?: string;
  }>): Promise<{
    created: any[];
    skipped: Array<{ visitType?: string; appointmentTime: string; appointmentDate: Date; reason: string }>;
  }> {
    if (!appointments || appointments.length === 0) {
      return { created: [], skipped: [] };
    }

    return await prisma.$transaction(async (tx) => {
      const created: any[] = [];
      const skipped: Array<{ visitType?: string; appointmentTime: string; appointmentDate: Date; reason: string }> = [];

      for (const data of appointments) {
        // التحقق من تعارض المواعيد داخل الـ transaction
        const [startHour, startMin] = data.appointmentTime.split(':').map(Number);
        const newStartMinutes = startHour * 60 + startMin;
        const newEndMinutes = newStartMinutes + (data.duration || 30);

        const targetDate = typeof data.appointmentDate === 'string'
          ? new Date(data.appointmentDate)
          : data.appointmentDate;
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // جلب كل مواعيد الدكتور في نفس اليوم
        const existingAppointments = await tx.appointment.findMany({
          where: {
            vetId: data.vetId,
            appointmentDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { not: 'CANCELLED' },
          },
          select: {
            appointmentTime: true,
            duration: true,
          },
        });

        // التحقق من التعارض
        let conflictTime: string | null = null;
        for (const appt of existingAppointments) {
          const [existHour, existMin] = appt.appointmentTime.split(':').map(Number);
          const existStartMinutes = existHour * 60 + existMin;
          const existEndMinutes = existStartMinutes + (appt.duration || 30);

          if (newStartMinutes < existEndMinutes && newEndMinutes > existStartMinutes) {
            conflictTime = appt.appointmentTime;
            break;
          }
        }

        if (conflictTime) {
          // تخطي هذا الموعد وتسجيل السبب
          skipped.push({
            visitType: data.visitType,
            appointmentTime: data.appointmentTime,
            appointmentDate: data.appointmentDate,
            reason: `تعارض مع موعد آخر في الساعة ${conflictTime}`,
          });
          continue;
        }

        // إنشاء الموعد
        const appointment = await tx.appointment.create({
          data: {
            ...data,
            duration: data.duration || 30,
          },
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
            vet: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        created.push(appointment);
      }

      return { created, skipped };
    });
  },

  async findAll(
    page?: number,
    limit?: number,
    vetId?: string,
    status?: AppointmentStatus,
    date?: string
  ) {
    const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

    const where: any = {};

    if (vetId) where.vetId = vetId;
    if (status) where.status = status;
    if (date) {
      where.appointmentDate = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take,
        include: {
          pet: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          vet: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'asc' }],
      }),
      prisma.appointment.count({ where }),
    ]);

    return createPaginatedResponse(appointments, total, currentPage, take);
  },

  async findById(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        medicalRecords: {
          include: {
            prescriptions: true,
          },
        },
        invoice: {
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new AppError('الموعد غير موجود', 404);
    }

    return appointment;
  },

  async update(
    id: string,
    data: {
      appointmentDate?: Date;
      appointmentTime?: string;
      duration?: number;
      status?: AppointmentStatus;
      reason?: string;
      notes?: string;
      vetId?: string;
    }
  ) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return appointment;
  },

  async delete(id: string) {
    await prisma.appointment.delete({
      where: { id },
    });

    return { message: 'تم حذف الموعد بنجاح' };
  },

  async getUpcoming(vetId?: string, limit: number = 10) {
    const where: any = {
      appointmentDate: {
        gte: new Date(),
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
    };

    if (vetId) where.vetId = vetId;

    const appointments = await prisma.appointment.findMany({
      where,
      take: limit,
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
    });

    return appointments;
  },

  async getFlowBoardData(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
            isFinalized: true,
          },
        },
        medicalRecords: {
          select: {
            recordCode: true,
            isClosed: true,
          },
        },
      },
      orderBy: [{ appointmentTime: 'asc' }],
    });

    // Get owner data separately for each pet
    const appointmentsWithOwner = await Promise.all(
      appointments.map(async (appointment) => {
        const pet = await prisma.pet.findUnique({
          where: { id: appointment.petId },
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        });
        // Get medical record (one-to-one relation, not array)
        const medicalRecord = appointment.medicalRecords || null;
        return {
          ...appointment,
          pet: {
            ...appointment.pet,
            owner: pet?.owner,
          },
          medicalRecord: medicalRecord ? {
            recordCode: medicalRecord.recordCode,
            isClosed: medicalRecord.isClosed,
          } : null,
        };
      })
    );

    // Group by status for Flow Board columns
    // CANCELLED appointments are included in scheduled column for display with different styling
    // COMPLETED appointments are shown in completed column (including those with finalized invoices)
    // Exclude unconfirmed portal bookings (pending approval) from FlowBoard
    // CONFIRMED appointments (approved portal bookings) are shown in scheduled column
    const columns = {
      scheduled: appointmentsWithOwner.filter(
        (a) => {
          // Exclude pending portal bookings (awaiting staff approval)
          if (a.source === 'CUSTOMER_PORTAL' && !a.isConfirmed && a.status === 'SCHEDULED') {
            return false;
          }
          // Include SCHEDULED, CONFIRMED (approved portal bookings), and CANCELLED
          return a.status === 'SCHEDULED' || a.status === 'CONFIRMED' || a.status === 'CANCELLED';
        }
      ),
      checkIn: appointmentsWithOwner.filter((a) => a.status === 'CHECK_IN'),
      inProgress: appointmentsWithOwner.filter((a) => a.status === 'IN_PROGRESS'),
      hospitalized: appointmentsWithOwner.filter((a) => a.status === 'HOSPITALIZED'),
      completed: appointmentsWithOwner.filter(
        (a) => a.status === 'COMPLETED'
      ),
    };

    return columns;
  },

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // إرسال تذكير إلغاء الموعد (يتحقق من الإعدادات تلقائياً)
    if (status === 'CANCELLED') {
      reminderService.sendReminder(appointment.id, 'APPOINTMENT_CANCELLED')
        .catch(err => console.error('[Reminder] APPOINTMENT_CANCELLED send failed:', err));
    }

    return appointment;
  },

  async updateConfirmation(id: string, isConfirmed: boolean) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { isConfirmed },
      include: {
        pet: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // إرسال تذكير تأكيد الموعد (يتحقق من الإعدادات تلقائياً)
    if (isConfirmed) {
      reminderService.sendReminder(appointment.id, 'APPOINTMENT_CONFIRMED')
        .catch(err => console.error('[Reminder] APPOINTMENT_CONFIRMED send failed:', err));
    }

    return appointment;
  },

  /**
   * Get upcoming appointments for a specific pet
   */
  async getUpcomingByPetId(petId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        petId,
        appointmentDate: { gte: today },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
      include: {
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return appointments;
  },

  /**
   * Get appointments scheduled from a specific medical record
   */
  async getByScheduledFromRecordId(recordId: string) {
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledFromRecordId: recordId,
      },
      orderBy: [{ appointmentDate: 'asc' }, { appointmentTime: 'asc' }],
      include: {
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return appointments;
  },
};
