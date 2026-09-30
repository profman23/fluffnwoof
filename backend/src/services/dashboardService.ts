import prisma from '../config/database';

export interface DashboardStats {
  todayAppointments: number;
  // Fields below have no vetId and are hidden (null) when scoped to a single vet
  registeredPets: number | null;
  registeredOwners: number | null;
  pendingInvoices: number | null;
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

export interface VetPerformanceStats {
  vetId: string;
  vetName: string;
  totalRecords: number;
  completeRecords: number;
  incompleteRecords: number;
  completionRate: number;
  lastActivity: string | null;
}

export const dashboardService = {
  async getStats(scopeVetId?: string): Promise<DashboardStats> {
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
      // Today's appointments (scopable by vet)
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow,
          },
          ...(scopeVetId ? { vetId: scopeVetId } : {}),
        },
      }),
      // Total registered pets — no vetId, hidden when scoped
      scopeVetId
        ? Promise.resolve(null)
        : prisma.pet.count({
            where: { isActive: true },
          }),
      // Total registered owners — no vetId, hidden when scoped
      scopeVetId ? Promise.resolve(null) : prisma.owner.count(),
      // Pending invoices — no vetId, hidden when scoped
      scopeVetId
        ? Promise.resolve(null)
        : prisma.invoice.count({
            where: {
              status: {
                in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'],
              },
            },
          }),
      // Total medical records (scopable by vet)
      prisma.medicalRecord.count({
        where: {
          ...(scopeVetId ? { vetId: scopeVetId } : {}),
        },
      }),
    ]);

    return {
      todayAppointments,
      registeredPets,
      registeredOwners,
      pendingInvoices,
      totalMedicalRecords,
    };
  },

  async getUpcomingAppointments(limit = 5, scopeVetId?: string): Promise<UpcomingAppointment[]> {
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: now,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        ...(scopeVetId ? { vetId: scopeVetId } : {}),
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

  async getUpcomingVaccinations(limit = 5, scopeVetId?: string): Promise<UpcomingVaccination[]> {
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
        ...(scopeVetId ? { vetId: scopeVetId } : {}),
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

  async getDashboardData(scopeVetId?: string) {
    const [stats, upcomingAppointments, upcomingVaccinations] = await Promise.all([
      this.getStats(scopeVetId),
      this.getUpcomingAppointments(5, scopeVetId),
      this.getUpcomingVaccinations(5, scopeVetId),
    ]);

    return {
      stats,
      upcomingAppointments,
      upcomingVaccinations,
    };
  },

  async getVetPerformanceStats(scopeVetId?: string): Promise<VetPerformanceStats[]> {
    // Get vets (users who can create medical records). When scoped, only the vet themselves.
    const vets = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(scopeVetId ? { id: scopeVetId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Get medical records for each vet
    const vetStats = await Promise.all(
      vets.map(async (vet) => {
        const records = await prisma.medicalRecord.findMany({
          where: {
            vetId: vet.id,
            // Exclude records linked to cancelled appointments
            OR: [
              { appointmentId: null },
              { appointment: { status: { not: 'CANCELLED' } } },
            ],
          },
          select: {
            id: true,
            chiefComplaint: true,
            history: true,
            weight: true,
            temperature: true,
            heartRate: true,
            respirationRate: true,
            bodyConditionScore: true,
            muscleCondition: true,
            painScore: true,
            hydration: true,
            attitude: true,
            behaviour: true,
            mucousMembranes: true,
            crt: true,
            diagnosis: true,
            treatment: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

        // Calculate complete records (all required fields filled)
        const requiredFields = [
          'chiefComplaint', 'history', 'weight', 'temperature', 'heartRate',
          'respirationRate', 'bodyConditionScore', 'muscleCondition', 'painScore',
          'hydration', 'attitude', 'behaviour', 'mucousMembranes', 'crt',
          'diagnosis', 'treatment'
        ];

        let completeRecords = 0;
        records.forEach((record) => {
          const isComplete = requiredFields.every((field) => {
            const value = record[field as keyof typeof record];
            return value !== null && value !== undefined && value !== '';
          });
          if (isComplete) completeRecords++;
        });

        const totalRecords = records.length;
        const incompleteRecords = totalRecords - completeRecords;
        const completionRate = totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 0;
        const lastActivity = records.length > 0 ? records[0].updatedAt.toISOString() : null;

        return {
          vetId: vet.id,
          vetName: `Dr. ${vet.firstName} ${vet.lastName}`,
          totalRecords,
          completeRecords,
          incompleteRecords,
          completionRate,
          lastActivity,
        };
      })
    );

    // Sort by total records descending, then by completion rate
    return vetStats
      .filter(v => v.totalRecords > 0)
      .sort((a, b) => b.totalRecords - a.totalRecords || b.completionRate - a.completionRate);
  },

  /**
   * Get comprehensive analytics for dashboard with date range
   */
  async getAnalytics(startDate: Date, endDate: Date, scopeVetId?: string) {
    // Normalize dates
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Calculate previous period for comparison
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - periodDays);
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);

    const [
      appointmentsData,
      patientsData,
      vetsData,
      prevAppointmentsCount,
    ] = await Promise.all([
      this.getAppointmentsAnalytics(start, end, scopeVetId),
      // Patients analytics has no vetId — omitted (null) when scoped to a vet
      scopeVetId ? Promise.resolve(null) : this.getPatientsAnalytics(start, end),
      this.getVetsAnalytics(start, end, scopeVetId),
      // Previous period appointment count for comparison (scopable)
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: prevStart, lte: prevEnd },
          ...(scopeVetId ? { vetId: scopeVetId } : {}),
        },
      }),
    ]);

    // Calculate percentage change for appointments
    const appointmentsChange = prevAppointmentsCount > 0
      ? Math.round(((appointmentsData.total - prevAppointmentsCount) / prevAppointmentsCount) * 100)
      : 0;

    // Patients comparison only when not scoped
    let patients: (typeof patientsData & { petsChange: number; ownersChange: number }) | null = null;
    if (patientsData) {
      const [prevPatientsCount, prevOwnersCount] = await Promise.all([
        prisma.pet.count({
          where: { createdAt: { gte: prevStart, lte: prevEnd } },
        }),
        prisma.owner.count({
          where: { createdAt: { gte: prevStart, lte: prevEnd } },
        }),
      ]);

      const patientsChange = prevPatientsCount > 0
        ? Math.round(((patientsData.newPets - prevPatientsCount) / prevPatientsCount) * 100)
        : 0;
      const ownersChange = prevOwnersCount > 0
        ? Math.round(((patientsData.newOwners - prevOwnersCount) / prevOwnersCount) * 100)
        : 0;

      patients = {
        ...patientsData,
        petsChange: patientsChange,
        ownersChange: ownersChange,
      };
    }

    return {
      appointments: {
        ...appointmentsData,
        change: appointmentsChange,
      },
      patients,
      vets: vetsData,
    };
  },

  /**
   * Get appointments analytics with daily trend
   */
  async getAppointmentsAnalytics(startDate: Date, endDate: Date, scopeVetId?: string) {
    // Get all appointments in range
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(scopeVetId ? { vetId: scopeVetId } : {}),
      },
      select: {
        id: true,
        appointmentDate: true,
        status: true,
        visitType: true,
      },
    });

    // Calculate totals
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length;
    const inProgress = appointments.filter(a =>
      ['SCHEDULED', 'CONFIRMED', 'CHECK_IN', 'IN_PROGRESS', 'HOSPITALIZED', 'READY_TO_CHECKOUT'].includes(a.status)
    ).length;

    // Group by date for trend
    const trendMap = new Map<string, { total: number; completed: number; cancelled: number }>();

    // Initialize all dates in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      trendMap.set(dateKey, { total: 0, completed: 0, cancelled: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill with actual data
    appointments.forEach(apt => {
      const dateKey = apt.appointmentDate.toISOString().split('T')[0];
      const existing = trendMap.get(dateKey);
      if (existing) {
        existing.total++;
        if (apt.status === 'COMPLETED') existing.completed++;
        if (apt.status === 'CANCELLED') existing.cancelled++;
      }
    });

    // Convert to array
    const trend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Group by visit type
    const byVisitType = appointments.reduce((acc, apt) => {
      const type = apt.visitType || 'GENERAL_CHECKUP';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      completed,
      cancelled,
      inProgress,
      trend,
      byVisitType: Object.entries(byVisitType).map(([type, count]) => ({ type, count })),
    };
  },

  /**
   * Get patients analytics
   */
  async getPatientsAnalytics(startDate: Date, endDate: Date) {
    const [newPets, newOwners, totalPets, totalOwners, speciesDistribution] = await Promise.all([
      // New pets in period
      prisma.pet.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // New owners in period
      prisma.owner.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total active pets
      prisma.pet.count({
        where: { isActive: true },
      }),
      // Total owners
      prisma.owner.count(),
      // Species distribution
      prisma.pet.groupBy({
        by: ['species'],
        where: { isActive: true },
        _count: { id: true },
      }),
    ]);

    return {
      newPets,
      newOwners,
      totalPets,
      totalOwners,
      bySpecies: speciesDistribution.map(s => ({
        species: s.species,
        count: s._count.id,
      })),
    };
  },

  /**
   * Get vets analytics with appointments count.
   * When scoped, only the vet themselves is returned.
   */
  async getVetsAnalytics(startDate: Date, endDate: Date, scopeVetId?: string) {
    const vets = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(scopeVetId ? { id: scopeVetId } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const vetAnalytics = await Promise.all(
      vets.map(async (vet) => {
        const [appointmentsCount, completedRecords, totalRecords] = await Promise.all([
          prisma.appointment.count({
            where: {
              vetId: vet.id,
              appointmentDate: { gte: startDate, lte: endDate },
              status: { not: 'CANCELLED' },
            },
          }),
          prisma.medicalRecord.count({
            where: {
              vetId: vet.id,
              isClosed: true,
              visitDate: { gte: startDate, lte: endDate },
              OR: [
                { appointmentId: null },
                { appointment: { status: { not: 'CANCELLED' } } },
              ],
            },
          }),
          prisma.medicalRecord.count({
            where: {
              vetId: vet.id,
              visitDate: { gte: startDate, lte: endDate },
              OR: [
                { appointmentId: null },
                { appointment: { status: { not: 'CANCELLED' } } },
              ],
            },
          }),
        ]);

        const completionRate = totalRecords > 0
          ? Math.round((completedRecords / totalRecords) * 100)
          : 0;

        return {
          vetId: vet.id,
          vetName: `Dr. ${vet.firstName} ${vet.lastName}`,
          appointments: appointmentsCount,
          completedRecords,
          totalRecords,
          completionRate,
        };
      })
    );

    // Sort by appointments count
    return {
      performance: vetAnalytics
        .filter(v => v.appointments > 0 || v.totalRecords > 0)
        .sort((a, b) => b.appointments - a.appointments),
      totalVets: vets.length,
    };
  },
};
