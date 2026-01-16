import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';
import { Species, Gender } from '@prisma/client';

export const petService = {
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
  }) {
    const pet = await prisma.pet.create({
      data,
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
    const pet = await prisma.pet.update({
      where: { id },
      data,
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
