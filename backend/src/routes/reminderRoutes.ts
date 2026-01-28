import { Router } from 'express';
import { reminderController } from '../controllers/reminderController';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all reminder settings
router.get('/settings', requireScreenAccess('reminders'), reminderController.getSettings);

// Get a specific setting
router.get(
  '/settings/:eventType/:reminderOrder',
  requireScreenAccess('reminders'),
  reminderController.getSetting
);

// Update a setting
router.put(
  '/settings/:eventType/:reminderOrder',
  requireScreenModify('reminders'),
  reminderController.updateSetting
);

// Toggle a setting
router.patch(
  '/settings/:eventType/:reminderOrder/toggle',
  requireScreenModify('reminders'),
  reminderController.toggleSetting
);

// Get reminder logs
router.get('/logs', requireScreenAccess('reminders'), reminderController.getLogs);

// Get stats
router.get('/stats', requireScreenAccess('reminders'), reminderController.getStats);

// Get message templates
router.get('/templates', requireScreenAccess('reminders'), reminderController.getTemplates);

// Trigger a reminder manually (admin only)
router.post(
  '/trigger',
  requireScreenModify('reminders'),
  reminderController.triggerReminder
);

export default router;
