import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';
import { Species, Gender } from '@prisma/client';
import { reminderService } from './reminderService';
import { normalizePhone, getPhoneVariants } from '../utils/phoneUtils';

// Generate next pet code (P00000001, P00000002, etc.)
async function generatePetCode(): Promise<string> {
  const lastPet = await prisma.pet.findFirst({
    orderBy: { petCode: 'desc' },
    select: { petCode: true },
  });

  if (!lastPet || !lastPet.petCode) {
    return 'P00000001';
  }

  const lastNumber = parseInt(lastPet.petCode.substring(1), 10);
  const nextNumber = lastNumber + 1;
  return `P${nextNumber.toString().padStart(8, '0')}`;
}

// Generate next customer code (C00000001, C00000002, etc.)
async function generateCustomerCode(): Promise<string> {
  const lastOwner = await prisma.owner.findFirst({
    orderBy: { customerCode: 'desc' },
    select: { customerCode: true },
  });

  if (!lastOwner || !lastOwner.customerCode) {
    return 'C00000001';
  }

  const lastNumber = parseInt(lastOwner.customerCode.substring(1), 10);
  const nextNumber = lastNumber + 1;
  return `C${nextNumber.toString().padStart(8, '0')}`;
}

export const petService = {
  /**
   * Create owner + pet in a single transaction (atomic).
   * If pet creation fails, owner creation is rolled back.
   */
  async createWithOwner(data: {
    owner: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
    };
    pet: {
      name: string;
      species: Species;
      breed?: string;
      gender: Gender;
      birthDate?: Date;
      color?: string;
      weight?: number;
      microchipId?: string;
      photoUrl?: string;
      notes?: string;
    };
  }) {
    const { owner: ownerData, pet: petData } = data;
    ownerData.phone = normalizePhone(ownerData.phone);
    const { birthDate, ...restPetData } = petData;

    const parsedBirthDate = birthDate
      ? new Date(`${String(birthDate).split('T')[0]}T00:00:00.000Z`)
      : undefined;

    // Check phone uniqueness before transaction (search all format variants)
    const existingOwner = await prisma.owner.findFirst({
      where: { phone: { in: getPhoneVariants(ownerData.phone) } },
    });
    if (existingOwner) {
      throw new AppError('Phone number already exists', 400, 'PHONE_EXISTS');
    }

    const result = await prisma.$transaction(async (tx) => {
      const customerCode = await generateCustomerCode();
      const petCode = await generatePetCode();

      const owner = await tx.owner.create({
        data: {
          ...ownerData,
          customerCode,
        },
      });

      const pet = await tx.pet.create({
        data: {
          ...restPetData,
          petCode,
          birthDate: parsedBirthDate,
          ownerId: owner.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              customerCode: true,
            },
          },
        },
      });

      return pet;
    });

    // Send welcome email outside transaction (non-blocking)
    if (result.owner) {
      reminderService.sendOwnerWelcomeReminder(result.owner.id, result.name).catch((error) => {
        console.error('[PetService] Failed to send welcome reminder:', error);
      });
    }

    return result;
  },

  async create(data: {
    name: string;
    species: Species;
    breed?: string;
    gender: Gender;
    birthDate?: Date;
    color?: string;
    weight?: number;
    microchipId?: string;
    photoUrl?: string;
    notes?: string;
    ownerId: string;
    sendWelcomeEmail?: boolean;
  }) {
    const { sendWelcomeEmail, birthDate, ...restData } = data;
    const petCode = await generatePetCode();

    // Convert birthDate string (YYYY-MM-DD) to proper ISO DateTime for Prisma
    const parsedBirthDate = birthDate
      ? new Date(`${String(birthDate).split('T')[0]}T00:00:00.000Z`)
      : undefined;

    const pet = await prisma.pet.create({
      data: {
        ...restData,
        petCode,
        birthDate: parsedBirthDate,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            customerCode: true,
          },
        },
      },
    });

    // Send welcome email if requested (for new owners)
    if (sendWelcomeEmail && pet.owner) {
      reminderService.sendOwnerWelcomeReminder(pet.owner.id, pet.name).catch((error) => {
        console.error('[PetService] Failed to send welcome reminder:', error);
      });
    }

    return pet;
  },

  async findAll(page?: number, limit?: number, search?: string, ownerId?: string) {
    const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { breed: { contains: search, mode: 'insensitive' as const } },
        { microchipId: { contains: search } },
        { petCode: { contains: search, mode: 'insensitive' as const } },
        { owner: { firstName: { contains: search, mode: 'insensitive' as const } } },
        { owner: { lastName: { contains: search, mode: 'insensitive' as const } } },
        { owner: { phone: { contains: search } } },
        { owner: { customerCode: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    const [pets, total] = await Promise.all([
      prisma.pet.findMany({
        where,
        skip,
        take,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              customerCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pet.count({ where }),
    ]);

    return createPaginatedResponse(pets, total, currentPage, take);
  },

  async findById(id: string) {
    const pet = await prisma.pet.findUnique({
      where: { id },
      include: {
        owner: true,
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            vet: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        medicalRecords: {
          orderBy: { visitDate: 'desc' },
          include: {
            vet: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            prescriptions: true,
          },
        },
        vaccinations: {
          orderBy: { vaccineDate: 'desc' },
          include: {
            vet: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!pet) {
      throw new AppError('الحيوان الأليف غير موجود', 404);
    }

    return pet;
  },

  async update(
    id: string,
    data: {
      name?: string;
      species?: Species;
      breed?: string;
      gender?: Gender;
      birthDate?: Date;
      color?: string;
      weight?: number;
      microchipId?: string;
      photoUrl?: string;
      notes?: string;
      isActive?: boolean;
    }
  ) {
    const { birthDate, ...restData } = data;
    const parsedBirthDate = birthDate
      ? new Date(`${String(birthDate).split('T')[0]}T00:00:00.000Z`)
      : undefined;
    const pet = await prisma.pet.update({
      where: { id },
      data: {
        ...restData,
        birthDate: parsedBirthDate,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            customerCode: true,
          },
        },
      },
    });

    return pet;
  },

  async delete(id: string) {
    await prisma.pet.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'تم حذف الحيوان الأليف بنجاح' };
  },
};
