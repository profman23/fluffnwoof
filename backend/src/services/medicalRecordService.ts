import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';

export interface CreateMedicalRecordInput {
  petId: string;
  vetId: string;
  appointmentId?: string;
  visitDate?: Date;
  // Subjective
  chiefComplaint?: string;
  history?: string;
  // Objective
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respirationRate?: number;
  bodyConditionScore?: number;
  muscleCondition?: string;
  painScore?: number;
  hydration?: string;
  attitude?: string;
  behaviour?: string;
  mucousMembranes?: string;
  crt?: number;
  // Assessment & Plan
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  // Metadata
  createdById?: string;
}

export interface UpdateMedicalRecordInput {
  // Subjective
  chiefComplaint?: string;
  history?: string;
  // Objective
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respirationRate?: number;
  bodyConditionScore?: number;
  muscleCondition?: string;
  painScore?: number;
  hydration?: string;
  attitude?: string;
  behaviour?: string;
  mucousMembranes?: string;
  crt?: number;
  // Assessment & Plan
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  // Metadata
  updatedById?: string;
  // Optimistic Locking
  version?: number;
}

export const medicalRecordService = {
  /**
   * Find all medical records with pagination and search
   */
  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { pet: { name: { contains: search, mode: 'insensitive' as const } } },
            { pet: { owner: { firstName: { contains: search, mode: 'insensitive' as const } } } },
            { pet: { owner: { lastName: { contains: search, mode: 'insensitive' as const } } } },
            { diagnosis: { contains: search, mode: 'insensitive' as const } },
            { chiefComplaint: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pet: {
            include: { owner: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointment: true,
        },
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Create a new medical record
   * Handles unique constraint violations gracefully
   */
  async create(data: CreateMedicalRecordInput) {
    try {
      return await prisma.medicalRecord.create({
        data: {
          petId: data.petId,
          vetId: data.vetId,
          appointmentId: data.appointmentId,
          visitDate: data.visitDate || new Date(),
          chiefComplaint: data.chiefComplaint,
          history: data.history,
          weight: data.weight,
          temperature: data.temperature,
          heartRate: data.heartRate,
          respirationRate: data.respirationRate,
          bodyConditionScore: data.bodyConditionScore,
          muscleCondition: data.muscleCondition,
          painScore: data.painScore,
          hydration: data.hydration,
          attitude: data.attitude,
          behaviour: data.behaviour,
          mucousMembranes: data.mucousMembranes,
          crt: data.crt,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          notes: data.notes,
          createdById: data.createdById,
        },
        include: {
          pet: {
            include: { owner: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointment: true,
          prescriptions: true,
        },
      });
    } catch (error: any) {
      // Handle unique constraint violation (P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('appointmentId')) {
        throw new AppError('هذا الموعد لديه سجل طبي بالفعل', 400);
      }
      throw error;
    }
  },

  /**
   * Find medical record by ID
   */
  async findById(id: string) {
    const record = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        pet: {
          include: { owner: true },
        },
        vet: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        appointment: true,
        prescriptions: true,
      },
    });

    if (!record) {
      throw new AppError('Medical record not found', 404);
    }

    return record;
  },

  /**
   * Find medical record by appointment ID
   */
  async findByAppointmentId(appointmentId: string) {
    return prisma.medicalRecord.findFirst({
      where: { appointmentId },
      include: {
        pet: {
          include: { owner: true },
        },
        vet: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        appointment: true,
        prescriptions: true,
      },
    });
  },

  /**
   * Find all medical records for a pet
   */
  async findByPetId(petId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { petId },
        orderBy: { visitDate: 'desc' },
        skip,
        take: limit,
        include: {
          vet: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointment: {
            select: { id: true, visitType: true, appointmentTime: true },
          },
          prescriptions: true,
        },
      }),
      prisma.medicalRecord.count({ where: { petId } }),
    ]);

    return {
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Build update data object, filtering out empty/undefined values
   * This prevents overwriting existing data with empty strings
   */
  buildUpdateData(data: UpdateMedicalRecordInput): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // String fields - only include if non-empty
    const stringFields = [
      'chiefComplaint', 'history', 'muscleCondition', 'hydration',
      'attitude', 'behaviour', 'mucousMembranes', 'diagnosis', 'treatment', 'notes'
    ] as const;

    for (const field of stringFields) {
      const value = data[field];
      // Only include if it's a non-empty string
      if (value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '') {
        result[field] = value;
      }
    }

    // Number fields - include if defined and valid (0 is a valid value)
    const numberFields = [
      'weight', 'temperature', 'heartRate', 'respirationRate',
      'bodyConditionScore', 'painScore', 'crt'
    ] as const;

    for (const field of numberFields) {
      const value = data[field];
      if (value !== undefined && value !== null && typeof value === 'number' && !isNaN(value)) {
        result[field] = value;
      }
    }

    // Always include updatedById if provided
    if (data.updatedById) {
      result.updatedById = data.updatedById;
    }

    return result;
  },

  /**
   * Update medical record
   * Only updates fields that are explicitly provided and non-empty
   * Uses transaction with optimistic locking to prevent race conditions
   */
  async update(id: string, data: UpdateMedicalRecordInput) {
    // Build sanitized update data - only includes non-empty values
    const updateData = this.buildUpdateData(data);
    const expectedVersion = data.version;

    return await prisma.$transaction(async (tx) => {
      // Check if record exists and get current version
      const existing = await tx.medicalRecord.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('Medical record not found', 404);
      }

      // Optimistic locking: check version if provided
      if (expectedVersion !== undefined && existing.version !== expectedVersion) {
        throw new AppError('السجل تم تعديله من مستخدم آخر. يرجى تحديث الصفحة والمحاولة مرة أخرى.', 409);
      }

      // If no actual changes, return the existing record with full relations
      if (Object.keys(updateData).length === 0 ||
          (Object.keys(updateData).length === 1 && updateData.updatedById)) {
        return tx.medicalRecord.findUnique({
          where: { id },
          include: {
            pet: {
              include: { owner: true },
            },
            vet: {
              select: { id: true, firstName: true, lastName: true },
            },
            appointment: true,
            prescriptions: true,
          },
        });
      }

      // Update with version increment
      return tx.medicalRecord.update({
        where: { id },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
        include: {
          pet: {
            include: { owner: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointment: true,
          prescriptions: true,
        },
      });
    });
  },

  /**
   * Delete medical record
   */
  async delete(id: string) {
    const existing = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Medical record not found', 404);
    }

    await prisma.medicalRecord.delete({ where: { id } });
    return { success: true };
  },

  /**
   * Create or get medical record for appointment
   * Used when opening patient record from FlowBoard
   * Uses findFirst + create with race condition handling
   */
  async getOrCreateForAppointment(appointmentId: string, userId: string) {
    // Get appointment details first (needed for create operation)
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pet: true,
        vet: true,
      },
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const includeRelations = {
      pet: {
        include: { owner: true },
      },
      vet: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      appointment: true,
      prescriptions: true,
    };

    // أولاً: حاول البحث عن السجل الموجود
    let record = await prisma.medicalRecord.findFirst({
      where: { appointmentId },
      include: includeRelations,
    });

    // إذا موجود، أرجعه
    if (record) {
      return record;
    }

    // إذا غير موجود، حاول إنشاءه مع التعامل مع race condition
    try {
      record = await prisma.medicalRecord.create({
        data: {
          petId: appointment.petId,
          vetId: appointment.vetId,
          appointmentId: appointmentId,
          visitDate: appointment.appointmentDate,
          createdById: userId,
        },
        include: includeRelations,
      });
      return record;
    } catch (error: any) {
      // في حالة unique constraint violation، معناها مستخدم آخر أنشأه
      if (error.code === 'P2002') {
        // أعد البحث وأرجع السجل الذي أنشأه المستخدم الآخر
        record = await prisma.medicalRecord.findFirst({
          where: { appointmentId },
          include: includeRelations,
        });
        if (record) return record;
      }
      throw error;
    }
  },

  /**
   * Close medical record
   * Uses transaction with row-level locking to prevent race conditions
   */
  async closeRecord(id: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. قفل الصف باستخدام FOR UPDATE لمنع التزامن
      // نحول الـ UUID column إلى text للمقارنة مع المعامل النصي
      const existingRows = await tx.$queryRaw<any[]>`
        SELECT id, "isClosed", "recordCode", "appointmentId"
        FROM medical_records
        WHERE id::text = ${id}
        FOR UPDATE
      `;

      if (!existingRows || existingRows.length === 0) {
        throw new AppError('Medical record not found', 404);
      }

      const existing = existingRows[0];

      if (existing.isClosed) {
        throw new AppError('Medical record is already closed', 400);
      }

      // 2. توليد recordCode باستخدام database function (atomic)
      let recordCode = existing.recordCode;
      if (!recordCode) {
        const result = await tx.$queryRaw<{ generate_record_code: string }[]>`
          SELECT generate_record_code()
        `;
        recordCode = result[0].generate_record_code;
      }

      // 3. تحديث السجل مع زيادة version
      const updatedRecord = await tx.medicalRecord.update({
        where: { id },
        data: {
          isClosed: true,
          closedAt: new Date(),
          closedById: userId,
          recordCode: recordCode,
          version: { increment: 1 },
        },
        include: {
          pet: {
            include: { owner: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true },
          },
          closedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointment: true,
          prescriptions: true,
        },
      });

      // 4. نقل الموعد إلى COMPLETED إذا موجود
      if (existing.appointmentId) {
        await tx.appointment.update({
          where: { id: existing.appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      return updatedRecord;
    });
  },

  /**
   * Reopen medical record
   * Uses transaction to ensure atomicity and prevent race conditions
   */
  async reopenRecord(id: string) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.medicalRecord.findUnique({
        where: { id },
        include: { appointment: true },
      });

      if (!existing) {
        throw new AppError('Medical record not found', 404);
      }

      if (!existing.isClosed) {
        throw new AppError('Medical record is not closed', 400);
      }

      // Update medical record with version increment
      const updatedRecord = await tx.medicalRecord.update({
        where: { id },
        data: {
          isClosed: false,
          closedAt: null,
          closedById: null,
          version: { increment: 1 },
        },
        include: {
          pet: {
            include: { owner: true },
          },
          vet: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointment: true,
          prescriptions: true,
        },
      });

      // Move appointment back to IN_PROGRESS if it exists and is COMPLETED
      if (existing.appointmentId && existing.appointment?.status === 'COMPLETED') {
        await tx.appointment.update({
          where: { id: existing.appointmentId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return updatedRecord;
    });
  },
};
