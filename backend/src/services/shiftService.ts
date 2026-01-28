import prisma from '../config/database';
import { DayOfWeek, VetSchedule, VetDayOff, VetBreak, VetSchedulePeriod } from '@prisma/client';

// Helper function to get day of week from date
const getDayOfWeekFromDate = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
};

// Helper function to convert time string "HH:MM" to minutes from midnight
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to normalize date string to UTC midnight for consistent Prisma comparison
// This ensures "2024-01-26" is always treated as 2024-01-26T00:00:00.000Z regardless of timezone
const normalizeDateForDb = (dateStr: string): Date => {
  // Parse the date string parts to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create a Date at UTC midnight
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

// Helper function to convert minutes to time string "HH:MM"
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export interface ScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface DayOffInput {
  date: string; // "YYYY-MM-DD"
  reason?: string;
}

export interface BreakInput {
  dayOfWeek?: DayOfWeek;
  specificDate?: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  description?: string;
  isRecurring: boolean;
}

// New Schedule Period Input (فترة جدولة محددة بتاريخ)
export interface SchedulePeriodInput {
  startDate: string;        // "YYYY-MM-DD"
  endDate: string;          // "YYYY-MM-DD"
  workingDays: DayOfWeek[]; // أيام العمل
  workStartTime: string;    // "09:00"
  workEndTime: string;      // "18:00"
  breakStartTime?: string;  // "12:00" (اختياري)
  breakEndTime?: string;    // "13:00" (اختياري)
}

export const shiftService = {
  // ==================== Schedule Management ====================

  // Get vet's weekly schedule
  async getVetSchedule(vetId: string): Promise<VetSchedule[]> {
    return prisma.vetSchedule.findMany({
      where: { vetId },
      orderBy: { dayOfWeek: 'asc' },
    });
  },

  // Get schedule for a specific day
  async getScheduleForDay(vetId: string, dayOfWeek: DayOfWeek): Promise<VetSchedule | null> {
    return prisma.vetSchedule.findUnique({
      where: {
        vetId_dayOfWeek: { vetId, dayOfWeek },
      },
    });
  },

  // Upsert a single schedule entry
  async upsertSchedule(vetId: string, data: ScheduleInput): Promise<VetSchedule> {
    return prisma.vetSchedule.upsert({
      where: {
        vetId_dayOfWeek: { vetId, dayOfWeek: data.dayOfWeek },
      },
      update: {
        startTime: data.startTime,
        endTime: data.endTime,
        isWorkingDay: data.isWorkingDay,
      },
      create: {
        vetId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isWorkingDay: data.isWorkingDay,
      },
    });
  },

  // Bulk update all schedule entries for a vet
  async bulkUpdateSchedule(vetId: string, schedules: ScheduleInput[]): Promise<VetSchedule[]> {
    const results: VetSchedule[] = [];

    for (const schedule of schedules) {
      const result = await this.upsertSchedule(vetId, schedule);
      results.push(result);
    }

    return results;
  },

  // Initialize default schedule for a vet (all days working, 9-6)
  async initializeDefaultSchedule(vetId: string): Promise<VetSchedule[]> {
    const defaultSchedules: ScheduleInput[] = [
      { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
      { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: false }, // Friday off
      { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: false }, // Saturday off
    ];

    return this.bulkUpdateSchedule(vetId, defaultSchedules);
  },

  // ==================== Day Off Management ====================

  // Get vet's days off (with optional date range filter)
  async getVetDaysOff(
    vetId: string,
    startDate?: string,
    endDate?: string
  ): Promise<VetDayOff[]> {
    const where: any = { vetId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = normalizeDateForDb(startDate);
      if (endDate) where.date.lte = normalizeDateForDb(endDate);
    }

    return prisma.vetDayOff.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  },

  // Create a day off
  async createDayOff(vetId: string, data: DayOffInput): Promise<VetDayOff> {
    return prisma.vetDayOff.create({
      data: {
        vetId,
        date: normalizeDateForDb(data.date),
        reason: data.reason,
      },
    });
  },

  // Delete a day off
  async deleteDayOff(id: string): Promise<void> {
    await prisma.vetDayOff.delete({
      where: { id },
    });
  },

  // Check if a date is a day off for a vet
  async isDateDayOff(vetId: string, date: string): Promise<boolean> {
    const normalizedDate = normalizeDateForDb(date);
    const dayOff = await prisma.vetDayOff.findUnique({
      where: {
        vetId_date: { vetId, date: normalizedDate },
      },
    });
    return !!dayOff;
  },

  // ==================== Break Management ====================

  // Get vet's breaks
  async getVetBreaks(vetId: string): Promise<VetBreak[]> {
    return prisma.vetBreak.findMany({
      where: { vetId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  // Create a break
  async createBreak(vetId: string, data: BreakInput): Promise<VetBreak> {
    return prisma.vetBreak.create({
      data: {
        vetId,
        dayOfWeek: data.isRecurring ? data.dayOfWeek : null,
        specificDate: !data.isRecurring && data.specificDate ? normalizeDateForDb(data.specificDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        isRecurring: data.isRecurring,
      },
    });
  },

  // Update a break
  async updateBreak(id: string, data: BreakInput): Promise<VetBreak> {
    return prisma.vetBreak.update({
      where: { id },
      data: {
        dayOfWeek: data.isRecurring ? data.dayOfWeek : null,
        specificDate: !data.isRecurring && data.specificDate ? normalizeDateForDb(data.specificDate) : null,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        isRecurring: data.isRecurring,
      },
    });
  },

  // Delete a break
  async deleteBreak(id: string): Promise<void> {
    await prisma.vetBreak.delete({
      where: { id },
    });
  },

  // Get breaks for a specific date (recurring + one-time)
  async getBreaksForDate(vetId: string, date: string): Promise<VetBreak[]> {
    const normalizedDate = normalizeDateForDb(date);
    const dayOfWeek = getDayOfWeekFromDate(normalizedDate);

    return prisma.vetBreak.findMany({
      where: {
        vetId,
        OR: [
          // Recurring breaks for this day of week
          { isRecurring: true, dayOfWeek },
          // One-time breaks for this specific date
          { isRecurring: false, specificDate: normalizedDate },
        ],
      },
      orderBy: { startTime: 'asc' },
    });
  },

  // ==================== Availability Calculation ====================

  // Availability response with reason for no slots
  // Get available time slots for a vet on a specific date
  async getAvailableSlots(
    vetId: string,
    date: string,
    durationMinutes: number
  ): Promise<string[]> {
    const result = await this.getAvailableSlotsWithReason(vetId, date, durationMinutes);
    return result.slots;
  },

  // Get available time slots with reason for unavailability
  async getAvailableSlotsWithReason(
    vetId: string,
    date: string,
    durationMinutes: number
  ): Promise<{ slots: string[]; unavailableReason: 'dayOff' | 'weekendOff' | 'noSchedule' | 'fullyBooked' | null }> {
    const normalizedDate = normalizeDateForDb(date);
    const dayOfWeek = getDayOfWeekFromDate(normalizedDate);

    // Check if it's a day off
    const isDayOff = await this.isDateDayOff(vetId, date);
    if (isDayOff) return { slots: [], unavailableReason: 'dayOff' };

    // Get schedule for this day
    const schedule = await this.getScheduleForDay(vetId, dayOfWeek);
    if (!schedule) return { slots: [], unavailableReason: 'noSchedule' };
    if (!schedule.isWorkingDay) return { slots: [], unavailableReason: 'weekendOff' };

    // Get breaks for this day
    const breaks = await this.getBreaksForDate(vetId, date);

    // Get existing appointments for this vet on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        vetId,
        appointmentDate: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: { notIn: ['CANCELLED'] },
      },
      select: { appointmentTime: true, duration: true },
    });

    // Build available slots
    const slots: string[] = [];
    const startMinutes = timeToMinutes(schedule.startTime);
    const endMinutes = timeToMinutes(schedule.endTime);

    // Generate slots every 15 minutes
    for (let time = startMinutes; time + durationMinutes <= endMinutes; time += 15) {
      const slotStart = time;
      const slotEnd = time + durationMinutes;
      const slotTime = minutesToTime(slotStart);

      // Check if slot overlaps with any break
      const overlapsBreak = breaks.some((brk) => {
        const breakStart = timeToMinutes(brk.startTime);
        const breakEnd = timeToMinutes(brk.endTime);
        return slotStart < breakEnd && slotEnd > breakStart;
      });

      if (overlapsBreak) continue;

      // Check if slot overlaps with any existing appointment
      const overlapsAppointment = existingAppointments.some((apt) => {
        const aptStart = timeToMinutes(apt.appointmentTime);
        const aptEnd = aptStart + apt.duration;
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (overlapsAppointment) continue;

      slots.push(slotTime);
    }

    // If we had working hours but no slots are available, it means fully booked
    if (slots.length === 0) {
      return { slots: [], unavailableReason: 'fullyBooked' };
    }

    return { slots, unavailableReason: null };
  },

  // Check if a vet is available at a specific time
  async isVetAvailable(
    vetId: string,
    date: string,
    time: string,
    duration: number
  ): Promise<boolean> {
    const availableSlots = await this.getAvailableSlots(vetId, date, duration);
    return availableSlots.includes(time);
  },

  // Get all vets with their schedules
  async getAllVetsWithSchedules() {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            name: true,
            displayNameEn: true,
            displayNameAr: true,
          },
        },
        vetSchedules: true,
      },
      orderBy: { firstName: 'asc' },
    });

    // Map vetSchedules to schedules and role to string for frontend compatibility
    return users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role?.displayNameEn || user.role?.name || '',
      schedules: user.vetSchedules,
    }));
  },

  // ==================== Alias Methods for Controller ====================

  // Alias for getVetSchedule
  async getSchedules(vetId: string) {
    return this.getVetSchedule(vetId);
  },

  // Alias for bulkUpdateSchedule
  async setSchedulesBulk(vetId: string, schedules: ScheduleInput[]) {
    return this.bulkUpdateSchedule(vetId, schedules);
  },

  // Alias for getVetDaysOff
  async getDaysOff(vetId: string, startDate?: string, endDate?: string) {
    return this.getVetDaysOff(vetId, startDate, endDate);
  },

  // Alias for createDayOff
  async addDayOff(vetId: string, date: string, reason?: string) {
    return this.createDayOff(vetId, { date, reason });
  },

  // Alias for deleteDayOff
  async removeDayOff(id: string) {
    return this.deleteDayOff(id);
  },

  // Alias for getVetBreaks
  async getBreaks(vetId: string) {
    return this.getVetBreaks(vetId);
  },

  // Alias for createBreak
  async addBreak(vetId: string, data: BreakInput) {
    return this.createBreak(vetId, data);
  },

  // Alias for deleteBreak
  async removeBreak(id: string) {
    return this.deleteBreak(id);
  },

  // ==================== Schedule Period Management (New System) ====================

  // Get all schedule periods for a vet
  async getSchedulePeriods(vetId: string): Promise<VetSchedulePeriod[]> {
    return prisma.vetSchedulePeriod.findMany({
      where: { vetId, isActive: true },
      orderBy: { startDate: 'desc' },
    });
  },

  // Get schedule period that covers a specific date
  async getSchedulePeriodForDate(vetId: string, date: string): Promise<VetSchedulePeriod | null> {
    const normalizedDate = normalizeDateForDb(date);

    return prisma.vetSchedulePeriod.findFirst({
      where: {
        vetId,
        isActive: true,
        startDate: { lte: normalizedDate },
        endDate: { gte: normalizedDate },
      },
    });
  },

  // Create a new schedule period
  async createSchedulePeriod(vetId: string, data: SchedulePeriodInput): Promise<VetSchedulePeriod> {
    return prisma.vetSchedulePeriod.create({
      data: {
        vetId,
        startDate: normalizeDateForDb(data.startDate),
        endDate: normalizeDateForDb(data.endDate),
        workingDays: data.workingDays,
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        breakStartTime: data.breakStartTime || null,
        breakEndTime: data.breakEndTime || null,
        isActive: true,
      },
    });
  },

  // Update a schedule period
  async updateSchedulePeriod(id: string, data: Partial<SchedulePeriodInput>): Promise<VetSchedulePeriod> {
    const updateData: any = {};

    if (data.startDate) updateData.startDate = normalizeDateForDb(data.startDate);
    if (data.endDate) updateData.endDate = normalizeDateForDb(data.endDate);
    if (data.workingDays) updateData.workingDays = data.workingDays;
    if (data.workStartTime) updateData.workStartTime = data.workStartTime;
    if (data.workEndTime) updateData.workEndTime = data.workEndTime;
    if (data.breakStartTime !== undefined) updateData.breakStartTime = data.breakStartTime || null;
    if (data.breakEndTime !== undefined) updateData.breakEndTime = data.breakEndTime || null;

    return prisma.vetSchedulePeriod.update({
      where: { id },
      data: updateData,
    });
  },

  // Delete (soft delete) a schedule period
  async deleteSchedulePeriod(id: string): Promise<void> {
    await prisma.vetSchedulePeriod.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // Hard delete a schedule period
  async removeSchedulePeriod(id: string): Promise<void> {
    await prisma.vetSchedulePeriod.delete({
      where: { id },
    });
  },

  // Get all vets with their schedule periods
  async getAllVetsWithSchedulePeriods() {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: {
          select: {
            name: true,
            displayNameEn: true,
            displayNameAr: true,
          },
        },
        vetSchedulePeriods: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role?.displayNameEn || user.role?.name || '',
      schedulePeriods: user.vetSchedulePeriods,
    }));
  },

  // Get available slots using the new period-based system
  async getAvailableSlotsWithPeriod(
    vetId: string,
    date: string,
    durationMinutes: number
  ): Promise<{ slots: string[]; unavailableReason: 'dayOff' | 'weekendOff' | 'noSchedule' | 'fullyBooked' | null }> {
    const normalizedDate = normalizeDateForDb(date);
    const dayOfWeek = getDayOfWeekFromDate(normalizedDate);

    // Get schedule period for this date
    const period = await this.getSchedulePeriodForDate(vetId, date);

    if (!period) {
      // No schedule period defined for this date - return noSchedule
      return { slots: [], unavailableReason: 'noSchedule' };
    }

    // Check if this day is a working day in the period
    if (!period.workingDays.includes(dayOfWeek)) {
      return { slots: [], unavailableReason: 'weekendOff' };
    }

    // Get existing appointments for this vet on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        vetId,
        appointmentDate: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: { notIn: ['CANCELLED'] },
      },
      select: { appointmentTime: true, duration: true },
    });

    // Build available slots
    const slots: string[] = [];
    const startMinutes = timeToMinutes(period.workStartTime);
    const endMinutes = timeToMinutes(period.workEndTime);

    // Get break times if they exist
    const breakStart = period.breakStartTime ? timeToMinutes(period.breakStartTime) : null;
    const breakEnd = period.breakEndTime ? timeToMinutes(period.breakEndTime) : null;

    // Generate slots every 15 minutes
    for (let time = startMinutes; time + durationMinutes <= endMinutes; time += 15) {
      const slotStart = time;
      const slotEnd = time + durationMinutes;
      const slotTime = minutesToTime(slotStart);

      // Check if slot overlaps with break
      if (breakStart !== null && breakEnd !== null) {
        if (slotStart < breakEnd && slotEnd > breakStart) {
          continue;
        }
      }

      // Check if slot overlaps with any existing appointment
      const overlapsAppointment = existingAppointments.some((apt) => {
        const aptStart = timeToMinutes(apt.appointmentTime);
        const aptEnd = aptStart + apt.duration;
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (overlapsAppointment) continue;

      slots.push(slotTime);
    }

    // If we had working hours but no slots are available, it means fully booked
    if (slots.length === 0) {
      return { slots: [], unavailableReason: 'fullyBooked' };
    }

    return { slots, unavailableReason: null };
  },
};
