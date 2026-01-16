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
   */
  async create(data: CreateMedicalRecordInput) {
    // Check if appointment already has a medical record
    if (data.appointmentId) {
      const existing = await prisma.medicalRecord.findFirst({
        where: { appointmentId: data.appointmentId },
      });
      if (existing) {
        throw new AppError('This appointment already has a medical record', 400);
      }
    }

    return prisma.medicalRecord.create({
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
   * Update medical record
   */
  async update(id: string, data: UpdateMedicalRecordInput) {
    // Check if record exists
    const existing = await prisma.medicalRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Medical record not found', 404);
    }

    return prisma.medicalRecord.update({
      where: { id },
      data: {
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
        updatedById: data.updatedById,
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
   */
  async getOrCreateForAppointment(appointmentId: string, userId: string) {
    // Try to find existing record
    let record = await this.findByAppointmentId(appointmentId);

    if (!record) {
      // Get appointment details to create record
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

      // Create new record
      const newRecord = await this.create({
        petId: appointment.petId,
        vetId: appointment.vetId,
        appointmentId: appointmentId,
        visitDate: appointment.appointmentDate,
        createdById: userId,
      });

      // Fetch with full relations
      record = await this.findByAppointmentId(appointmentId);
      if (!record) {
        return newRecord;
      }
    }

    return record;
  },
};
