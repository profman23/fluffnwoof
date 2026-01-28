import { Request, Response, NextFunction } from 'express';
import { reminderService } from '../services/reminderService';
import { ReminderEventType, NotificationChannel, ReminderLogStatus } from '@prisma/client';

export const reminderController = {
  // Get all reminder settings
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await reminderService.getSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  },

  // Get a specific setting
  async getSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventType, reminderOrder } = req.params;
      const setting = await reminderService.getSetting(
        eventType as ReminderEventType,
        parseInt(reminderOrder) || 1
      );

      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }

      res.json(setting);
    } catch (error) {
      next(error);
    }
  },

  // Update a setting
  async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventType, reminderOrder } = req.params;
      const data = req.body;

      const setting = await reminderService.updateSetting(
        eventType as ReminderEventType,
        data,
        parseInt(reminderOrder) || 1
      );

      res.json(setting);
    } catch (error) {
      next(error);
    }
  },

  // Toggle a setting
  async toggleSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventType, reminderOrder } = req.params;
      const { isEnabled } = req.body;

      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ message: 'isEnabled must be a boolean' });
      }

      const setting = await reminderService.toggleSetting(
        eventType as ReminderEventType,
        isEnabled,
        parseInt(reminderOrder) || 1
      );

      res.json(setting);
    } catch (error) {
      next(error);
    }
  },

  // Get reminder logs
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, channel } = req.query;

      const result = await reminderService.getLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as ReminderLogStatus | undefined,
        channel: channel as NotificationChannel | undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get stats
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reminderService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  // Get message templates
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await reminderService.getTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  },

  // Trigger a reminder manually (for testing)
  async triggerReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId, eventType, reminderOrder } = req.body;

      if (!appointmentId || !eventType) {
        return res.status(400).json({ message: 'appointmentId and eventType are required' });
      }

      const result = await reminderService.sendReminder(
        appointmentId,
        eventType as ReminderEventType,
        reminderOrder || 1
      );

      res.json({ success: true, result });
    } catch (error) {
      next(error);
    }
  },
};
