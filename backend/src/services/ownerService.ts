import prisma from '../config/database';
import { AppError } from '../middlewares/errorHandler';
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination';
import { normalizePhone, getPhoneVariants } from '../utils/phoneUtils';
import { nextCustomerCode } from '../utils/codeGenerator';

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
    data.phone = normalizePhone(data.phone);

    // Check if phone number already exists (search all format variants)
    const existingOwner = await prisma.owner.findFirst({
      where: { phone: { in: getPhoneVariants(data.phone) } },
    });

    if (existingOwner) {
      throw new AppError('Phone number already exists', 400, 'PHONE_EXISTS');
    }

    let customerCode: string;
    try {
      customerCode = await nextCustomerCode();
    } catch (err) {
      console.error('[OwnerService] nextCustomerCode failed, using fallback:', err);
      const lastOwner = await prisma.owner.findFirst({
        where: { customerCode: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { customerCode: true },
      });
      const lastNum = lastOwner?.customerCode ? parseInt(lastOwner.customerCode.substring(1)) || 0 : 0;
      customerCode = `C${(lastNum + 1).toString().padStart(8, '0')}`;
    }

    const owner = await prisma.owner.create({
      data: {
        ...data,
        customerCode,
      },
      include: {
        pets: true,
      },
    });

    // Welcome email is now sent after pet creation (in petService.create)
    // to include pet name in the email

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
    // Normalize phone if provided
    if (data.phone) {
      data.phone = normalizePhone(data.phone);
    }

    // Check if phone number already exists for another owner (search all format variants)
    if (data.phone) {
      const existingOwner = await prisma.owner.findFirst({
        where: {
          phone: { in: getPhoneVariants(data.phone) },
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
