import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';

export const ownerService = {
  async create(data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
    nationalId?: string;
    notes?: string;
  }) {
    const owner = await prisma.owner.create({
      data,
      include: {
        pets: true,
      },
    });

    return owner;
  },

  async findAll(page?: number, limit?: number, search?: string) {
    const { skip, limit: take, page: currentPage } = getPaginationParams(page, limit);

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [owners, total] = await Promise.all([
      prisma.owner.findMany({
        where,
        skip,
        take,
        include: {
          pets: {
            select: {
              id: true,
              name: true,
              species: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.owner.count({ where }),
    ]);

    return createPaginatedResponse(owners, total, currentPage, take);
  },

  async findById(id: string) {
    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        pets: {
          include: {
            appointments: {
              take: 5,
              orderBy: { appointmentDate: 'desc' },
            },
          },
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!owner) {
      throw new AppError('المالك غير موجود', 404);
    }

    return owner;
  },

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      nationalId?: string;
      notes?: string;
    }
  ) {
    const owner = await prisma.owner.update({
      where: { id },
      data,
      include: {
        pets: true,
      },
    });

    return owner;
  },

  async delete(id: string) {
    await prisma.owner.delete({
      where: { id },
    });

    return { message: 'تم حذف المالك بنجاح' };
  },
};
