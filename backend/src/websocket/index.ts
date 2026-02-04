/**
 * WebSocket Server Configuration
 * Uses Socket.io for real-time booking updates
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { config } from '../config/env';
import { bookingNamespace, BookingEvents } from './bookingNamespace';

let io: SocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export const initializeWebSocket = (httpServer: HttpServer): SocketServer => {
  // Parse CORS origins - handle both string and array
  const originConfig = config.cors.origin;
  const corsOrigins = Array.isArray(originConfig)
    ? originConfig
    : typeof originConfig === 'string'
      ? originConfig.split(',').map((origin) => origin.trim())
      : ['http://localhost:5173'];

  io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    path: '/ws',
    transports: ['websocket', 'polling'],
    // Performance optimizations
    pingTimeout: 60000,
    pingInterval: 25000,
    // Connection limits for stability
    maxHttpBufferSize: 1e6, // 1MB max message size
    connectTimeout: 45000,  // 45s connection timeout
    // Memory optimization - clean up stale connections faster
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes max
      skipMiddlewares: true,
    },
  });

  // Main namespace connection handler
  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[WS] Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`[WS] Socket error: ${socket.id}`, error);
    });
  });

  // Initialize booking namespace
  const bookingNs = io.of('/booking');
  bookingNamespace.initialize(bookingNs);

  console.log('✅ WebSocket server initialized');
  return io;
};

/**
 * Get Socket.io instance (for emitting from other parts of the app)
 */
export const getIO = (): SocketServer | null => io;

/**
 * Get WebSocket connection stats for monitoring
 */
export const getConnectionStats = async (): Promise<{
  totalConnections: number;
  bookingConnections: number;
  rooms: number;
}> => {
  if (!io) {
    return { totalConnections: 0, bookingConnections: 0, rooms: 0 };
  }

  const mainSockets = await io.fetchSockets();
  const bookingNs = io.of('/booking');
  const bookingSockets = await bookingNs.fetchSockets();

  return {
    totalConnections: mainSockets.length,
    bookingConnections: bookingSockets.length,
    rooms: bookingNs.adapter.rooms.size,
  };
};

/**
 * Emit event to booking namespace
 */
export const emitBookingEvent = (
  event: BookingEvents,
  data: any,
  room?: string
): void => {
  if (!io) {
    console.warn('[WS] Socket.io not initialized');
    return;
  }

  const bookingNs = io.of('/booking');

  if (room) {
    bookingNs.to(room).emit(event, data);
  } else {
    bookingNs.emit(event, data);
  }
};

/**
 * Get room name for vet/date combination
 */
export const getVetDateRoom = (vetId: string, date: string): string => {
  return `vet:${vetId}:${date}`;
};

export { BookingEvents };
export default { initializeWebSocket, getIO, emitBookingEvent, getVetDateRoom };
