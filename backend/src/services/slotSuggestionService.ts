/**
 * Slot Suggestion Service
 * Provides smart alternative slot suggestions when a conflict occurs
 *
 * Strategy:
 * 1. Find nearby slots on the same day (±2 hours)
 * 2. Find same time slot on next available days
 * 3. Sort by proximity to requested time
 */

import prisma from '../config/database';
import { shiftService } from './shiftService';

export interface SlotSuggestion {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  labelEn: string;        // "15 min later"
  labelAr: string;        // "بعد 15 دقيقة"
  vetId: string;
  vetName?: string;
}

export interface FindAlternativesParams {
  vetId: string;
  requestedDate: string;  // YYYY-MM-DD
  requestedTime: string;  // HH:mm
  duration: number;       // minutes
  limit?: number;
}

export const slotSuggestionService = {
  /**
   * Find alternative slots when the requested slot is taken
   */
  async findAlternatives(params: FindAlternativesParams): Promise<SlotSuggestion[]> {
    const { vetId, requestedDate, requestedTime, duration, limit = 5 } = params;
    const alternatives: SlotSuggestion[] = [];

    // Strategy 1: Find nearby slots on same day (±2 hours)
    const sameDaySlots = await this.findNearbySameDay(vetId, requestedDate, requestedTime, duration);
    alternatives.push(...sameDaySlots);

    // Strategy 2: Find same time on next 3 days
    if (alternatives.length < limit) {
      const nextDaysSlots = await this.findSameTimeNextDays(vetId, requestedDate, requestedTime, duration, 3);
      alternatives.push(...nextDaysSlots);
    }

    // Sort by proximity to requested time and return limited results
    return this.sortByProximity(alternatives, requestedDate, requestedTime).slice(0, limit);
  },

  /**
   * Find available slots within ±2 hours of requested time on same day
   */
  async findNearbySameDay(
    vetId: string,
    date: string,
    requestedTime: string,
    duration: number
  ): Promise<SlotSuggestion[]> {
    const suggestions: SlotSuggestion[] = [];
    const [reqHour, reqMin] = requestedTime.split(':').map(Number);
    const requestedMinutes = reqHour * 60 + reqMin;

    // Get all available slots for this day
    const result = await shiftService.getAvailableSlotsWithReason(vetId, date, duration);
    const availableSlots = result.slots;

    if (!availableSlots || availableSlots.length === 0) {
      return suggestions;
    }

    // Filter slots within ±2 hours
    const nearbySlots = availableSlots.filter((slotTime: string) => {
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;
      const diff = Math.abs(slotMinutes - requestedMinutes);

      return diff <= 120 && diff > 0; // Within 2 hours, exclude same time
    });

    // Convert to suggestions with labels
    for (const slotTime of nearbySlots) {
      const [slotHour, slotMin] = slotTime.split(':').map(Number);
      const slotMinutes = slotHour * 60 + slotMin;
      const diffMinutes = slotMinutes - requestedMinutes;

      suggestions.push({
        date,
        time: slotTime,
        vetId,
        ...this.getTimeLabel(diffMinutes, 0),
      });
    }

    return suggestions;
  },

  /**
   * Find same time slot on next N available days
   */
  async findSameTimeNextDays(
    vetId: string,
    startDate: string,
    requestedTime: string,
    duration: number,
    daysToCheck: number
  ): Promise<SlotSuggestion[]> {
    const suggestions: SlotSuggestion[] = [];
    const start = new Date(startDate);

    for (let i = 1; i <= daysToCheck * 2 && suggestions.length < daysToCheck; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];

      // Check if slot is available on this day
      const result = await shiftService.getAvailableSlotsWithReason(vetId, dateStr, duration);
      const availableSlots = result.slots;

      if (!availableSlots || availableSlots.length === 0) {
        continue;
      }

      const slotAvailable = availableSlots.includes(requestedTime);

      if (slotAvailable) {
        suggestions.push({
          date: dateStr,
          time: requestedTime,
          vetId,
          ...this.getDayLabel(i),
        });
      }
    }

    return suggestions;
  },

  /**
   * Get human-readable label for time difference
   */
  getTimeLabel(diffMinutes: number, _diffDays: number): { labelEn: string; labelAr: string } {
    const absDiff = Math.abs(diffMinutes);
    const isBefore = diffMinutes < 0;

    if (absDiff < 60) {
      return {
        labelEn: isBefore ? `${absDiff} min earlier` : `${absDiff} min later`,
        labelAr: isBefore ? `قبل ${absDiff} دقيقة` : `بعد ${absDiff} دقيقة`,
      };
    } else {
      const hours = Math.floor(absDiff / 60);
      const mins = absDiff % 60;
      const hourLabel = hours === 1 ? 'hour' : 'hours';
      const hourLabelAr = hours === 1 ? 'ساعة' : 'ساعات';

      if (mins === 0) {
        return {
          labelEn: isBefore ? `${hours} ${hourLabel} earlier` : `${hours} ${hourLabel} later`,
          labelAr: isBefore ? `قبل ${hours} ${hourLabelAr}` : `بعد ${hours} ${hourLabelAr}`,
        };
      } else {
        return {
          labelEn: isBefore
            ? `${hours}h ${mins}m earlier`
            : `${hours}h ${mins}m later`,
          labelAr: isBefore
            ? `قبل ${hours} ${hourLabelAr} و ${mins} دقيقة`
            : `بعد ${hours} ${hourLabelAr} و ${mins} دقيقة`,
        };
      }
    }
  },

  /**
   * Get human-readable label for day difference
   */
  getDayLabel(daysAhead: number): { labelEn: string; labelAr: string } {
    if (daysAhead === 1) {
      return { labelEn: 'Same time tomorrow', labelAr: 'نفس الوقت غداً' };
    } else if (daysAhead === 2) {
      return { labelEn: 'Same time in 2 days', labelAr: 'نفس الوقت بعد يومين' };
    } else {
      return {
        labelEn: `Same time in ${daysAhead} days`,
        labelAr: `نفس الوقت بعد ${daysAhead} أيام`,
      };
    }
  },

  /**
   * Sort suggestions by proximity to requested date/time
   */
  sortByProximity(
    suggestions: SlotSuggestion[],
    requestedDate: string,
    requestedTime: string
  ): SlotSuggestion[] {
    const reqDateTime = new Date(`${requestedDate}T${requestedTime}:00`);

    return suggestions.sort((a, b) => {
      const aDateTime = new Date(`${a.date}T${a.time}:00`);
      const bDateTime = new Date(`${b.date}T${b.time}:00`);

      const aDiff = Math.abs(aDateTime.getTime() - reqDateTime.getTime());
      const bDiff = Math.abs(bDateTime.getTime() - reqDateTime.getTime());

      return aDiff - bDiff;
    });
  },

  /**
   * Find alternatives across multiple vets (when customer doesn't care which vet)
   */
  async findAlternativesAnyVet(params: {
    requestedDate: string;
    requestedTime: string;
    duration: number;
    limit?: number;
  }): Promise<SlotSuggestion[]> {
    const { requestedDate, requestedTime, duration, limit = 10 } = params;
    const alternatives: SlotSuggestion[] = [];

    // Get all bookable vets
    const vets = await prisma.user.findMany({
      where: {
        isBookable: true,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    // Find alternatives for each vet
    for (const vet of vets) {
      const vetAlternatives = await this.findAlternatives({
        vetId: vet.id,
        requestedDate,
        requestedTime,
        duration,
        limit: 3, // Limit per vet
      });

      // Add vet name to suggestions
      const withVetName = vetAlternatives.map((alt) => ({
        ...alt,
        vetName: `${vet.firstName} ${vet.lastName}`,
      }));

      alternatives.push(...withVetName);
    }

    // Sort all by proximity and return limited results
    return this.sortByProximity(alternatives, requestedDate, requestedTime).slice(0, limit);
  },
};

export default slotSuggestionService;
