/**
 * Reservation Cleanup Job
 * Expires stale slot reservations every minute
 */

import { slotReservationService } from '../services/slotReservationService';

let cleanupInterval: NodeJS.Timeout | null = null;

// Run every 60 seconds
const CLEANUP_INTERVAL_MS = 60 * 1000;

export const reservationCleanupJob = {
  /**
   * Start the cleanup job
   */
  start(): void {
    if (cleanupInterval) {
      console.log('[ReservationCleanup] Already running');
      return;
    }

    console.log('[ReservationCleanup] Started - running every 60 seconds');

    // Run immediately on start
    this.runCleanup();

    // Schedule recurring cleanup
    cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, CLEANUP_INTERVAL_MS);
  },

  /**
   * Stop the cleanup job
   */
  stop(): void {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
      console.log('[ReservationCleanup] Stopped');
    }
  },

  /**
   * Run a single cleanup cycle
   */
  async runCleanup(): Promise<void> {
    try {
      const expiredCount = await slotReservationService.expireStaleReservations();

      if (expiredCount > 0) {
        console.log(`[ReservationCleanup] Expired ${expiredCount} stale reservations`);
      }
    } catch (error) {
      console.error('[ReservationCleanup] Error:', error);
    }
  },
};

export default reservationCleanupJob;
