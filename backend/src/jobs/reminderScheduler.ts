import cron from 'node-cron';
import { reminderService } from '../services/reminderService';

/**
 * Reminder Scheduler
 * Runs scheduled jobs to:
 * 1. Schedule pre-appointment reminders for upcoming appointments
 * 2. Process and send pending scheduled reminders
 * 3. Schedule follow-up reminders
 */

let isSchedulerRunning = false;

// Process pending reminders every 5 minutes
const processPendingReminders = cron.schedule('*/5 * * * *', async () => {
  if (isSchedulerRunning) {
    console.log('[Reminder Scheduler] Skipping - previous job still running');
    return;
  }

  isSchedulerRunning = true;
  console.log('[Reminder Scheduler] Processing pending reminders...');

  try {
    const processed = await reminderService.processScheduledReminders();
    if (processed > 0) {
      console.log(`[Reminder Scheduler] Processed ${processed} reminders`);
    }
  } catch (error) {
    console.error('[Reminder Scheduler] Error processing reminders:', error);
  } finally {
    isSchedulerRunning = false;
  }
});

// Stop initially - will be started manually
processPendingReminders.stop();

// Schedule pre-appointment reminders every hour
const schedulePreAppointmentReminders = cron.schedule('0 * * * *', async () => {
  console.log('[Reminder Scheduler] Scheduling pre-appointment reminders...');

  try {
    const scheduled = await reminderService.schedulePreAppointmentReminders();
    if (scheduled > 0) {
      console.log(`[Reminder Scheduler] Scheduled ${scheduled} pre-appointment reminders`);
    }
  } catch (error) {
    console.error('[Reminder Scheduler] Error scheduling pre-appointment reminders:', error);
  }
});

// Stop initially - will be started manually
schedulePreAppointmentReminders.stop();

// Schedule follow-up reminders daily at 8:00 AM
const scheduleFollowUpReminders = cron.schedule('0 8 * * *', async () => {
  console.log('[Reminder Scheduler] Scheduling follow-up reminders...');

  try {
    const scheduled = await reminderService.scheduleFollowUpReminders();
    if (scheduled > 0) {
      console.log(`[Reminder Scheduler] Scheduled ${scheduled} follow-up reminders`);
    }
  } catch (error) {
    console.error('[Reminder Scheduler] Error scheduling follow-up reminders:', error);
  }
});

// Stop initially - will be started manually
scheduleFollowUpReminders.stop();

export const reminderScheduler = {
  /**
   * Start all reminder scheduler jobs
   */
  start() {
    console.log('[Reminder Scheduler] Starting scheduler...');
    processPendingReminders.start();
    schedulePreAppointmentReminders.start();
    scheduleFollowUpReminders.start();
    console.log('[Reminder Scheduler] Scheduler started successfully');
    console.log('  - Process pending reminders: every 5 minutes');
    console.log('  - Schedule pre-appointment reminders: every hour');
    console.log('  - Schedule follow-up reminders: daily at 8:00 AM');
  },

  /**
   * Stop all scheduler jobs
   */
  stop() {
    console.log('[Reminder Scheduler] Stopping scheduler...');
    processPendingReminders.stop();
    schedulePreAppointmentReminders.stop();
    scheduleFollowUpReminders.stop();
    console.log('[Reminder Scheduler] Scheduler stopped');
  },

  /**
   * Run a specific job manually (for testing)
   */
  async runManually(jobType: 'process' | 'preAppointment' | 'followUp') {
    switch (jobType) {
      case 'process':
        return await reminderService.processScheduledReminders();
      case 'preAppointment':
        return await reminderService.schedulePreAppointmentReminders();
      case 'followUp':
        return await reminderService.scheduleFollowUpReminders();
    }
  },
};
