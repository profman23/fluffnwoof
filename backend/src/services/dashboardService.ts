import prisma from '../config/database';

export interface DashboardStats {
  todayAppointments: number;
  registeredPets: number;
  registeredOwners: number;
  pendingInvoices: number;
  totalMedicalRecords: number;
}

export interface UpcomingAppointment {
  id: string;
  type: string;
  petName: string;
  petSpecies: string;
  ownerName: string;
  vetName: string;
  time: string;
  date: string;
}

export interface UpcomingVaccination {
  id: string;
  petName: string;
  petSpecies: string;
  ownerName: string;
  vaccineName: string;
  dueDate: string;
  daysUntil: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAppointments,
      registeredPets,
      registeredOwners,
      pendingInvoices,
      totalMedicalRecords,
    ] = await Promise.all([
      // Today's appointments
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      // Total registered pets
      prisma.pet.count({
        where: { isActive: true },
      }),
      // Total registered owners
      prisma.owner.count(),
      // Pending invoices
      prisma.invoice.count({
        where: {
          status: {
            in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'],
          },
        },
      }),
      // Total medical records
      prisma.medicalRecord.count(),
    ]);

    return {
      todayAppointments,
      registeredPets,
      registeredOwners,
      pendingInvoices,
      totalMedicalRecords,
    };
  },

  async getUpcomingAppointments(limit = 5): Promise<UpcomingAppointment[]> {
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: now,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' },
      ],
      take: limit,
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        vet: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      type: apt.visitType || 'GENERAL_CHECKUP',
      petName: apt.pet.name,
      petSpecies: apt.pet.species,
      ownerName: apt.pet.owner
        ? `${apt.pet.owner.firstName} ${apt.pet.owner.lastName}`
        : '-',
      vetName: apt.vet ? `Dr. ${apt.vet.firstName} ${apt.vet.lastName}` : '-',
      time: apt.appointmentTime,
      date: apt.appointmentDate.toISOString(),
    }));
  },

  async getUpcomingVaccinations(limit = 5): Promise<UpcomingVaccination[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 14); // Next 2 weeks

    const vaccinations = await prisma.vaccination.findMany({
      where: {
        nextDueDate: {
          gte: today,
          lte: nextWeek,
        },
      },
      orderBy: {
        nextDueDate: 'asc',
      },
      take: limit,
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
      },
    });

    return vaccinations.map((vac) => {
      const dueDate = new Date(vac.nextDueDate!);
      const diffTime = dueDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: vac.id,
        petName: vac.pet.name,
        petSpecies: vac.pet.species,
        ownerName: vac.pet.owner
          ? `${vac.pet.owner.firstName} ${vac.pet.owner.lastName}`
          : '-',
        vaccineName: vac.vaccineName,
        dueDate: vac.nextDueDate!.toISOString(),
        daysUntil,
      };
    });
  },

  async getDashboardData() {
    const [stats, upcomingAppointments, upcomingVaccinations] = await Promise.all([
      this.getStats(),
      this.getUpcomingAppointments(),
      this.getUpcomingVaccinations(),
    ]);

    return {
      stats,
      upcomingAppointments,
      upcomingVaccinations,
    };
  },
};
