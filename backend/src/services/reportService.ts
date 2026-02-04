import prisma from '../lib/prisma';

interface GetNextAppointmentsParams {
  startDate?: string;
  endDate?: string;
  vetId?: string;
  customerCode?: string;
  phone?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const reportService = {
  getNextAppointments: async (params: GetNextAppointmentsParams): Promise<PaginatedResult<any>> => {
    const { startDate, endDate, vetId, customerCode, phone, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: {
        in: ['SCHEDULED', 'CONFIRMED'],
      },
    };

    // Date filtering - تحويل التاريخ لـ ISO DateTime
    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate + 'T00:00:00.000Z');
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Vet filtering
    if (vetId) {
      where.vetId = vetId;
    }

    // Customer code filtering
    if (customerCode) {
      where.pet = {
        ...where.pet,
        owner: {
          customerCode: { contains: customerCode, mode: 'insensitive' },
        },
      };
    }

    // Phone filtering
    if (phone) {
      where.pet = {
        ...where.pet,
        owner: {
          ...where.pet?.owner,
          phone: { contains: phone },
        },
      };
    }

    // Get total count
    const total = await prisma.appointment.count({ where });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            petCode: true,
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
        },
        vet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' },
      ],
      skip,
      take: limit,
    });

    return {
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};
