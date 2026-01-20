import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';

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
    // Check if phone number already exists
    const existingOwner = await prisma.owner.findUnique({
      where: { phone: data.phone },
    });

    if (existingOwner) {
      throw new AppError('Phone number already exists', 400, 'PHONE_EXISTS');
    }

    const customerCode = await generateCustomerCode();

    const owner = await prisma.owner.create({
      data: {
        ...data,
        customerCode,
      },
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
            { customerCode: { contains: search, mode: 'insensitive' as const } },
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
    // Check if phone number already exists for another owner
    if (data.phone) {
      const existingOwner = await prisma.owner.findFirst({
        where: {
          phone: data.phone,
          NOT: { id },
        },
      });

      if (existingOwner) {
        throw new AppError('Phone number already exists', 400, 'PHONE_EXISTS');
      }
    }

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
