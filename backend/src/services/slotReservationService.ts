/**
 * Slot Reservation Service
 * Manages temporary slot holds to prevent race conditions in booking
 *
 * Flow:
 * 1. Customer selects a time slot -> createReservation (5-minute hold)
 * 2. Customer completes booking -> confirmReservation (converts to appointment)
 * 3. Customer leaves page -> releaseReservation (frees the slot)
 * 4. Time expires -> expireStaleReservations (cron job cleans up)
 */

import prisma from '../config/database';
import { ReservationStatus } from '@prisma/client';

// Default reservation hold time in milliseconds (5 minutes)
const DEFAULT_HOLD_DURATION_MS = 5 * 60 * 1000;

export interface CreateReservationParams {
  vetId: string;
  date: string;           // YYYY-MM-DD format
  time: string;           // HH:mm format
  duration: number;       // minutes
  customerId?: string;
  sessionId: string;
}

export interface ReservationResult {
  id: string;
  vetId: string;
  reservationDate: Date;
  reservationTime: string;
  duration: number;
  status: ReservationStatus;
  expiresAt: Date;
  sessionId: string;
}

export const slotReservationService = {
  /**
   * Create a temporary slot reservation (5-minute hold)
   * Prevents other users from booking the same slot
   */
  async createReservation(params: CreateReservationParams): Promise<ReservationResult> {
    const { vetId, date, time, duration, customerId, sessionId } = params;
    const expiresAt = new Date(Date.now() + DEFAULT_HOLD_DURATION_MS);
    const reservationDate = new Date(date + 'T00:00:00.000Z');

    return await prisma.$transaction(async (tx) => {
      // Check if slot is already reserved by another session
      const existingReservation = await tx.slotReservation.findFirst({
        where: {
          vetId,
          reservationDate,
          reservationTime: time,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingReservation) {
        // If same session, extend the reservation
        if (existingReservation.sessionId === sessionId) {
          const updated = await tx.slotReservation.update({
            where: { id: existingReservation.id },
            data: { expiresAt, updatedAt: new Date() },
          });
          return updated;
        }

        // Different session - slot is being held by another user
        throw new SlotReservationError(
          'SLOT_BEING_RESERVED',
          'This slot is being held by another customer',
          'هذه الفترة قيد الحجز من قبل عميل آخر',
          Math.ceil((existingReservation.expiresAt.getTime() - Date.now()) / 1000)
        );
      }

      // Check if slot is already booked (actual appointment exists)
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          vetId,
          appointmentDate: reservationDate,
          appointmentTime: time,
          status: { not: 'CANCELLED' },
        },
      });

      if (existingAppointment) {
        throw new SlotReservationError(
          'SLOT_ALREADY_BOOKED',
          'This slot has already been booked',
          'هذه الفترة محجوزة بالفعل'
        );
      }

      // Create new reservation
      const reservation = await tx.slotReservation.create({
        data: {
          vetId,
          reservationDate,
          reservationTime: time,
          duration,
          customerId,
          sessionId,
          status: 'PENDING',
          expiresAt,
        },
      });

      return reservation;
    }, {
      isolationLevel: 'Serializable', // Strongest isolation to prevent race conditions
      timeout: 10000,
    });
  },

  /**
   * Confirm a reservation (converts to actual appointment)
   * Called when customer completes the booking form
   */
  async confirmReservation(reservationId: string, sessionId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.slotReservation.findFirst({
        where: {
          id: reservationId,
          sessionId,
          status: 'PENDING',
        },
      });

      if (!reservation) {
        throw new SlotReservationError(
          'RESERVATION_NOT_FOUND',
          'Reservation not found or already processed',
          'الحجز المؤقت غير موجود أو تمت معالجته'
        );
      }

      if (reservation.expiresAt < new Date()) {
        throw new SlotReservationError(
          'RESERVATION_EXPIRED',
          'Your reservation has expired. Please select a new time.',
          'انتهت صلاحية الحجز المؤقت. يرجى اختيار وقت جديد.'
        );
      }

      await tx.slotReservation.update({
        where: { id: reservationId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });
    });
  },

  /**
   * Release a reservation (when user navigates away or cancels)
   */
  async releaseReservation(reservationId: string, sessionId: string): Promise<void> {
    await prisma.slotReservation.updateMany({
      where: {
        id: reservationId,
        sessionId,
        status: 'PENDING',
      },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });
  },

  /**
   * Release all reservations for a session (cleanup on disconnect)
   */
  async releaseSessionReservations(sessionId: string): Promise<number> {
    const result = await prisma.slotReservation.updateMany({
      where: {
        sessionId,
        status: 'PENDING',
      },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });
    return result.count;
  },

  /**
   * Expire stale reservations (run via cron job every minute)
   */
  async expireStaleReservations(): Promise<number> {
    const result = await prisma.slotReservation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    return result.count;
  },

  /**
   * Get active reservation for a slot
   */
  async getActiveReservation(vetId: string, date: string, time: string): Promise<ReservationResult | null> {
    const reservationDate = new Date(date + 'T00:00:00.000Z');

    return await prisma.slotReservation.findFirst({
      where: {
        vetId,
        reservationDate,
        reservationTime: time,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
  },

  /**
   * Get all active reservations for a vet on a specific date
   * Used to show "being reserved" status in real-time
   */
  async getActiveReservationsForDate(vetId: string, date: string): Promise<ReservationResult[]> {
    const reservationDate = new Date(date + 'T00:00:00.000Z');

    return await prisma.slotReservation.findMany({
      where: {
        vetId,
        reservationDate,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { reservationTime: 'asc' },
    });
  },

  /**
   * Check if a slot is available (not reserved or booked)
   */
  async isSlotAvailable(vetId: string, date: string, time: string, excludeSessionId?: string): Promise<{
    available: boolean;
    reason?: 'RESERVED' | 'BOOKED';
    expiresIn?: number;
  }> {
    const reservationDate = new Date(date + 'T00:00:00.000Z');

    // Check for active reservation
    const reservation = await prisma.slotReservation.findFirst({
      where: {
        vetId,
        reservationDate,
        reservationTime: time,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        ...(excludeSessionId && { sessionId: { not: excludeSessionId } }),
      },
    });

    if (reservation) {
      return {
        available: false,
        reason: 'RESERVED',
        expiresIn: Math.ceil((reservation.expiresAt.getTime() - Date.now()) / 1000),
      };
    }

    // Check for existing appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        vetId,
        appointmentDate: reservationDate,
        appointmentTime: time,
        status: { not: 'CANCELLED' },
      },
    });

    if (appointment) {
      return {
        available: false,
        reason: 'BOOKED',
      };
    }

    return { available: true };
  },

  /**
   * Extend reservation time (heartbeat from client)
   */
  async extendReservation(reservationId: string, sessionId: string): Promise<Date> {
    const newExpiresAt = new Date(Date.now() + DEFAULT_HOLD_DURATION_MS);

    const result = await prisma.slotReservation.updateMany({
      where: {
        id: reservationId,
        sessionId,
        status: 'PENDING',
      },
      data: {
        expiresAt: newExpiresAt,
      },
    });

    if (result.count === 0) {
      throw new SlotReservationError(
        'RESERVATION_NOT_FOUND',
        'Reservation not found or already processed',
        'الحجز المؤقت غير موجود أو تمت معالجته'
      );
    }

    return newExpiresAt;
  },
};

/**
 * Custom error class for slot reservation errors
 */
export class SlotReservationError extends Error {
  code: string;
  messageAr: string;
  expiresInSeconds?: number;

  constructor(code: string, message: string, messageAr: string, expiresInSeconds?: number) {
    super(message);
    this.name = 'SlotReservationError';
    this.code = code;
    this.messageAr = messageAr;
    this.expiresInSeconds = expiresInSeconds;
  }
}

export default slotReservationService;
