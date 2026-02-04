/**
 * Booking Namespace for Socket.io
 * Handles real-time slot reservation updates
 */

import { Namespace, Socket } from 'socket.io';
import { slotReservationService, SlotReservationError } from '../services/slotReservationService';

// Event types for booking namespace
export enum BookingEvents {
  // Client -> Server
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  RESERVE_SLOT = 'reserve:slot',
  RELEASE_SLOT = 'release:slot',
  EXTEND_RESERVATION = 'extend:reservation',
  HEARTBEAT = 'heartbeat',

  // Server -> Client
  SLOT_RESERVED = 'slot:reserved',
  SLOT_RELEASED = 'slot:released',
  SLOT_BOOKED = 'slot:booked',
  SLOT_CANCELLED = 'slot:cancelled',
  RESERVATION_ERROR = 'reservation:error',
  RESERVATION_EXTENDED = 'reservation:extended',
  AVAILABILITY_CHANGED = 'availability:changed',
}

interface SubscribePayload {
  vetId: string;
  date: string;
}

interface ReserveSlotPayload {
  vetId: string;
  date: string;
  time: string;
  duration: number;
  customerId?: string;
}

interface ReleaseSlotPayload {
  reservationId: string;
}

interface ExtendReservationPayload {
  reservationId: string;
}

// Store active sessions and their reservations
const sessionReservations = new Map<string, Set<string>>();

export const bookingNamespace = {
  namespace: null as Namespace | null,

  /**
   * Initialize the booking namespace with event handlers
   */
  initialize(namespace: Namespace): void {
    this.namespace = namespace;

    namespace.on('connection', (socket: Socket) => {
      const sessionId = socket.id;
      console.log(`[Booking] Client connected: ${sessionId}`);

      // Initialize session reservations set
      sessionReservations.set(sessionId, new Set());

      // Handle subscription to vet/date updates
      socket.on(BookingEvents.SUBSCRIBE, (payload: SubscribePayload) => {
        this.handleSubscribe(socket, payload);
      });

      // Handle unsubscription
      socket.on(BookingEvents.UNSUBSCRIBE, (payload: SubscribePayload) => {
        this.handleUnsubscribe(socket, payload);
      });

      // Handle slot reservation
      socket.on(BookingEvents.RESERVE_SLOT, async (payload: ReserveSlotPayload) => {
        await this.handleReserveSlot(socket, payload);
      });

      // Handle slot release
      socket.on(BookingEvents.RELEASE_SLOT, async (payload: ReleaseSlotPayload) => {
        await this.handleReleaseSlot(socket, payload);
      });

      // Handle reservation extension (heartbeat)
      socket.on(BookingEvents.EXTEND_RESERVATION, async (payload: ExtendReservationPayload) => {
        await this.handleExtendReservation(socket, payload);
      });

      // Handle disconnection - release all reservations
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  },

  /**
   * Subscribe to updates for a specific vet and date
   */
  handleSubscribe(socket: Socket, payload: SubscribePayload): void {
    const { vetId, date } = payload;
    const room = `vet:${vetId}:${date}`;

    socket.join(room);
    console.log(`[Booking] ${socket.id} subscribed to ${room}`);

    // Send current active reservations for this vet/date
    this.sendActiveReservations(socket, vetId, date);
  },

  /**
   * Unsubscribe from updates
   */
  handleUnsubscribe(socket: Socket, payload: SubscribePayload): void {
    const { vetId, date } = payload;
    const room = `vet:${vetId}:${date}`;

    socket.leave(room);
    console.log(`[Booking] ${socket.id} unsubscribed from ${room}`);
  },

  /**
   * Handle slot reservation request
   */
  async handleReserveSlot(socket: Socket, payload: ReserveSlotPayload): Promise<void> {
    const { vetId, date, time, duration, customerId } = payload;
    const sessionId = socket.id;

    try {
      const reservation = await slotReservationService.createReservation({
        vetId,
        date,
        time,
        duration,
        customerId,
        sessionId,
      });

      // Track reservation for this session
      const sessionRes = sessionReservations.get(sessionId);
      if (sessionRes) {
        sessionRes.add(reservation.id);
      }

      // Broadcast to all clients in the room
      const room = `vet:${vetId}:${date}`;
      this.namespace?.to(room).emit(BookingEvents.SLOT_RESERVED, {
        reservationId: reservation.id,
        vetId,
        date,
        time,
        expiresAt: reservation.expiresAt,
        isOwn: false, // Will be overridden on client for the owner
      });

      // Send confirmation to the requester
      socket.emit(BookingEvents.SLOT_RESERVED, {
        reservationId: reservation.id,
        vetId,
        date,
        time,
        expiresAt: reservation.expiresAt,
        isOwn: true,
      });

      console.log(`[Booking] Slot reserved: ${vetId}/${date}/${time} by ${sessionId}`);
    } catch (error) {
      if (error instanceof SlotReservationError) {
        socket.emit(BookingEvents.RESERVATION_ERROR, {
          code: error.code,
          message: error.message,
          messageAr: error.messageAr,
          expiresInSeconds: error.expiresInSeconds,
        });
      } else {
        console.error('[Booking] Reserve slot error:', error);
        socket.emit(BookingEvents.RESERVATION_ERROR, {
          code: 'UNKNOWN_ERROR',
          message: 'An error occurred while reserving the slot',
          messageAr: 'حدث خطأ أثناء حجز الفترة',
        });
      }
    }
  },

  /**
   * Handle slot release request
   */
  async handleReleaseSlot(socket: Socket, payload: ReleaseSlotPayload): Promise<void> {
    const { reservationId } = payload;
    const sessionId = socket.id;

    try {
      await slotReservationService.releaseReservation(reservationId, sessionId);

      // Remove from session tracking
      const sessionRes = sessionReservations.get(sessionId);
      if (sessionRes) {
        sessionRes.delete(reservationId);
      }

      // Broadcast release to all rooms this socket is in
      socket.rooms.forEach((room) => {
        if (room.startsWith('vet:')) {
          this.namespace?.to(room).emit(BookingEvents.SLOT_RELEASED, {
            reservationId,
          });
        }
      });

      console.log(`[Booking] Slot released: ${reservationId} by ${sessionId}`);
    } catch (error) {
      console.error('[Booking] Release slot error:', error);
    }
  },

  /**
   * Handle reservation extension (keep-alive)
   */
  async handleExtendReservation(socket: Socket, payload: ExtendReservationPayload): Promise<void> {
    const { reservationId } = payload;
    const sessionId = socket.id;

    try {
      const newExpiresAt = await slotReservationService.extendReservation(
        reservationId,
        sessionId
      );

      socket.emit(BookingEvents.RESERVATION_EXTENDED, {
        reservationId,
        expiresAt: newExpiresAt,
      });
    } catch (error) {
      if (error instanceof SlotReservationError) {
        socket.emit(BookingEvents.RESERVATION_ERROR, {
          code: error.code,
          message: error.message,
          messageAr: error.messageAr,
        });
      }
    }
  },

  /**
   * Handle client disconnection - release all their reservations
   */
  async handleDisconnect(socket: Socket): Promise<void> {
    const sessionId = socket.id;
    console.log(`[Booking] Client disconnected: ${sessionId}`);

    try {
      // Release all reservations for this session
      const released = await slotReservationService.releaseSessionReservations(sessionId);

      if (released > 0) {
        console.log(`[Booking] Released ${released} reservations for ${sessionId}`);

        // Broadcast to all booking rooms
        this.namespace?.emit(BookingEvents.AVAILABILITY_CHANGED, {
          reason: 'SESSION_DISCONNECTED',
        });
      }

      // Clean up session tracking
      sessionReservations.delete(sessionId);
    } catch (error) {
      console.error('[Booking] Disconnect cleanup error:', error);
    }
  },

  /**
   * Send active reservations for a vet/date to a client
   */
  async sendActiveReservations(socket: Socket, vetId: string, date: string): Promise<void> {
    try {
      const reservations = await slotReservationService.getActiveReservationsForDate(vetId, date);

      socket.emit(BookingEvents.AVAILABILITY_CHANGED, {
        vetId,
        date,
        reservations: reservations.map((r) => ({
          time: r.reservationTime,
          expiresAt: r.expiresAt,
          isOwn: r.sessionId === socket.id,
        })),
      });
    } catch (error) {
      console.error('[Booking] Send active reservations error:', error);
    }
  },

  /**
   * Broadcast slot booked event (called from appointment creation)
   */
  broadcastSlotBooked(vetId: string, date: string, time: string): void {
    const room = `vet:${vetId}:${date}`;
    this.namespace?.to(room).emit(BookingEvents.SLOT_BOOKED, {
      vetId,
      date,
      time,
    });
  },

  /**
   * Broadcast slot cancelled event (called from appointment cancellation)
   */
  broadcastSlotCancelled(vetId: string, date: string, time: string): void {
    const room = `vet:${vetId}:${date}`;
    this.namespace?.to(room).emit(BookingEvents.SLOT_CANCELLED, {
      vetId,
      date,
      time,
    });
  },
};

export default bookingNamespace;
