import { VisitType } from '../types';

// Duration in minutes for each visit type
export const VISIT_TYPE_DURATION: Record<VisitType, number> = {
  [VisitType.GENERAL_CHECKUP]: 30,
  [VisitType.VACCINATION]: 15,
  [VisitType.GROOMING]: 60,
  [VisitType.SURGERY]: 120,
  [VisitType.EMERGENCY]: 45,
};

// Generate time slots based on duration, filtering past times for today
export const generateTimeSlots = (durationMinutes: number, selectedDate: string): string[] => {
  const slots: string[] = [];
  const startHour = 8; // 8:00 AM
  const endHour = 23; // 11:00 PM
  const endMinute = 30; // End at 11:30 PM

  // Check if selected date is today
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const isToday = selectedDate === today;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += durationMinutes) {
      // Skip past times if today
      if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
        continue;
      }

      // Calculate end time of this slot
      const slotEndMinutes = hour * 60 + minute + durationMinutes;
      const maxEndMinutes = endHour * 60 + endMinute;

      // Only add slot if it ends by 11:30 PM
      if (slotEndMinutes <= maxEndMinutes) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
  }

  return slots;
};

// Check if a time slot conflicts with booked appointments
export const isSlotBooked = (
  slot: string,
  slotDuration: number,
  bookedAppointments: { appointmentTime: string; duration: number }[]
): boolean => {
  const [slotHour, slotMinute] = slot.split(':').map(Number);
  const slotStartMinutes = slotHour * 60 + slotMinute;
  const slotEndMinutes = slotStartMinutes + slotDuration;

  for (const appt of bookedAppointments) {
    const [apptHour, apptMinute] = appt.appointmentTime.split(':').map(Number);
    const apptStartMinutes = apptHour * 60 + apptMinute;
    const apptEndMinutes = apptStartMinutes + appt.duration;

    // Check for overlap
    if (slotStartMinutes < apptEndMinutes && slotEndMinutes > apptStartMinutes) {
      return true;
    }
  }

  return false;
};

// Get tomorrow's date in YYYY-MM-DD format
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
