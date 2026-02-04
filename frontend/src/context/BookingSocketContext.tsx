/**
 * Booking Socket Context
 * Provides real-time slot availability updates via WebSocket
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Event types matching backend
export enum BookingEvents {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  RESERVE_SLOT = 'reserve:slot',
  RELEASE_SLOT = 'release:slot',
  EXTEND_RESERVATION = 'extend:reservation',
  SLOT_RESERVED = 'slot:reserved',
  SLOT_RELEASED = 'slot:released',
  SLOT_BOOKED = 'slot:booked',
  SLOT_CANCELLED = 'slot:cancelled',
  RESERVATION_ERROR = 'reservation:error',
  RESERVATION_EXTENDED = 'reservation:extended',
  AVAILABILITY_CHANGED = 'availability:changed',
}

export interface SlotStatus {
  status: 'available' | 'reserved' | 'booked';
  expiresAt?: Date;
  isOwn?: boolean;
}

export interface ReservationInfo {
  reservationId: string;
  time: string;
  expiresAt: Date;
  isOwn: boolean;
}

interface BookingSocketContextValue {
  isConnected: boolean;
  slotStatuses: Record<string, SlotStatus>;
  currentReservation: ReservationInfo | null;
  reservationError: { code: string; message: string; messageAr: string } | null;

  // Actions
  subscribe: (vetId: string, date: string) => void;
  unsubscribe: (vetId: string, date: string) => void;
  reserveSlot: (params: {
    vetId: string;
    date: string;
    time: string;
    duration: number;
    customerId?: string;
  }) => void;
  releaseSlot: (reservationId: string) => void;
  extendReservation: (reservationId: string) => void;
  clearReservationError: () => void;
}

const BookingSocketContext = createContext<BookingSocketContextValue | null>(null);

interface BookingSocketProviderProps {
  children: React.ReactNode;
}

export const BookingSocketProvider: React.FC<BookingSocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [slotStatuses, setSlotStatuses] = useState<Record<string, SlotStatus>>({});
  const [currentReservation, setCurrentReservation] = useState<ReservationInfo | null>(null);
  const [reservationError, setReservationError] = useState<{
    code: string;
    message: string;
    messageAr: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    // Remove /api suffix to get the base URL for WebSocket
    const wsUrl = apiUrl.replace(/\/api\/?$/, '');

    const socket = io(`${wsUrl}/booking`, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[BookingSocket] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[BookingSocket] Disconnected:', reason);
      setIsConnected(false);
      setCurrentReservation(null);
    });

    socket.on('connect_error', (error) => {
      console.error('[BookingSocket] Connection error:', error);
      setIsConnected(false);
    });

    // Handle slot reserved event
    socket.on(BookingEvents.SLOT_RESERVED, (data) => {
      const { reservationId, time, expiresAt, isOwn } = data;

      setSlotStatuses((prev) => ({
        ...prev,
        [time]: {
          status: 'reserved',
          expiresAt: new Date(expiresAt),
          isOwn,
        },
      }));

      if (isOwn) {
        setCurrentReservation({
          reservationId,
          time,
          expiresAt: new Date(expiresAt),
          isOwn: true,
        });
        setReservationError(null);
      }
    });

    // Handle slot released event
    socket.on(BookingEvents.SLOT_RELEASED, (data) => {
      const { reservationId, time } = data;

      setSlotStatuses((prev) => {
        const newStatuses = { ...prev };
        // Find and remove the released slot
        Object.keys(newStatuses).forEach((key) => {
          if (newStatuses[key].status === 'reserved') {
            // Check by time if available
            if (time && key === time) {
              delete newStatuses[key];
            }
          }
        });
        return newStatuses;
      });

      if (currentReservation?.reservationId === reservationId) {
        setCurrentReservation(null);
      }
    });

    // Handle slot booked event (another user completed booking)
    socket.on(BookingEvents.SLOT_BOOKED, (data) => {
      const { time } = data;

      setSlotStatuses((prev) => ({
        ...prev,
        [time]: { status: 'booked' },
      }));
    });

    // Handle slot cancelled event (another user cancelled)
    socket.on(BookingEvents.SLOT_CANCELLED, (data) => {
      const { time } = data;

      setSlotStatuses((prev) => {
        const newStatuses = { ...prev };
        delete newStatuses[time];
        return newStatuses;
      });
    });

    // Handle reservation error
    socket.on(BookingEvents.RESERVATION_ERROR, (data) => {
      setReservationError({
        code: data.code,
        message: data.message,
        messageAr: data.messageAr,
      });
    });

    // Handle reservation extended
    socket.on(BookingEvents.RESERVATION_EXTENDED, (data) => {
      const { reservationId, expiresAt } = data;

      if (currentReservation?.reservationId === reservationId) {
        setCurrentReservation((prev) =>
          prev ? { ...prev, expiresAt: new Date(expiresAt) } : null
        );
      }
    });

    // Handle availability changed (bulk update)
    socket.on(BookingEvents.AVAILABILITY_CHANGED, (data) => {
      const { reservations } = data;

      if (reservations) {
        const newStatuses: Record<string, SlotStatus> = {};
        reservations.forEach((res: any) => {
          newStatuses[res.time] = {
            status: 'reserved',
            expiresAt: new Date(res.expiresAt),
            isOwn: res.isOwn,
          };
        });
        setSlotStatuses(newStatuses);
      }
    });

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      socket.disconnect();
    };
  }, []);

  // Heartbeat to keep reservation alive
  useEffect(() => {
    if (currentReservation && socketRef.current) {
      // Send heartbeat every 2 minutes
      heartbeatIntervalRef.current = setInterval(() => {
        socketRef.current?.emit(BookingEvents.EXTEND_RESERVATION, {
          reservationId: currentReservation.reservationId,
        });
      }, 2 * 60 * 1000);

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      };
    }
  }, [currentReservation]);

  const subscribe = useCallback((vetId: string, date: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(BookingEvents.SUBSCRIBE, { vetId, date });
    }
  }, []);

  const unsubscribe = useCallback((vetId: string, date: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(BookingEvents.UNSUBSCRIBE, { vetId, date });
    }
  }, []);

  const reserveSlot = useCallback(
    (params: {
      vetId: string;
      date: string;
      time: string;
      duration: number;
      customerId?: string;
    }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(BookingEvents.RESERVE_SLOT, params);
      }
    },
    []
  );

  const releaseSlot = useCallback((reservationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(BookingEvents.RELEASE_SLOT, { reservationId });
      setCurrentReservation(null);
    }
  }, []);

  const extendReservation = useCallback((reservationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(BookingEvents.EXTEND_RESERVATION, { reservationId });
    }
  }, []);

  const clearReservationError = useCallback(() => {
    setReservationError(null);
  }, []);

  const value: BookingSocketContextValue = {
    isConnected,
    slotStatuses,
    currentReservation,
    reservationError,
    subscribe,
    unsubscribe,
    reserveSlot,
    releaseSlot,
    extendReservation,
    clearReservationError,
  };

  return (
    <BookingSocketContext.Provider value={value}>{children}</BookingSocketContext.Provider>
  );
};

export const useBookingSocket = (): BookingSocketContextValue => {
  const context = useContext(BookingSocketContext);
  if (!context) {
    throw new Error('useBookingSocket must be used within a BookingSocketProvider');
  }
  return context;
};

export default BookingSocketContext;
