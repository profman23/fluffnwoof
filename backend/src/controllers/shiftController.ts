import { Request, Response, NextFunction } from 'express';
import { shiftService } from '../services/shiftService';
import { AppError } from '../middlewares/errorHandler';

export const shiftController = {
  // ==================== SCHEDULES ====================

  // Get all schedules for a vet
  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const schedules = await shiftService.getSchedules(vetId);

      res.json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk update schedules for a vet
  async updateSchedulesBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { schedules } = req.body;

      if (!Array.isArray(schedules)) {
        throw new AppError('Schedules must be an array', 400);
      }

      const result = await shiftService.setSchedulesBulk(vetId, schedules);

      res.json({
        success: true,
        data: result,
        message: 'Schedules updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== DAYS OFF ====================

  // Get all days off for a vet
  async getDaysOff(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { startDate, endDate } = req.query;

      const daysOff = await shiftService.getDaysOff(
        vetId,
        startDate as string | undefined,
        endDate as string | undefined
      );

      res.json({
        success: true,
        data: daysOff,
      });
    } catch (error) {
      next(error);
    }
  },

  // Add a day off
  async addDayOff(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { date, reason } = req.body;

      if (!date) {
        throw new AppError('Date is required', 400);
      }

      const dayOff = await shiftService.addDayOff(vetId, date, reason);

      res.status(201).json({
        success: true,
        data: dayOff,
        message: 'Day off added successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove a day off
  async removeDayOff(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await shiftService.removeDayOff(id);

      res.json({
        success: true,
        message: 'Day off removed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== BREAKS ====================

  // Get all breaks for a vet
  async getBreaks(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const breaks = await shiftService.getBreaks(vetId);

      res.json({
        success: true,
        data: breaks,
      });
    } catch (error) {
      next(error);
    }
  },

  // Add a break
  async addBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { dayOfWeek, specificDate, startTime, endTime, description, isRecurring } = req.body;

      if (!startTime || !endTime) {
        throw new AppError('Start time and end time are required', 400);
      }

      if (isRecurring && !dayOfWeek) {
        throw new AppError('Day of week is required for recurring breaks', 400);
      }

      if (!isRecurring && !specificDate) {
        throw new AppError('Specific date is required for one-time breaks', 400);
      }

      const breakItem = await shiftService.addBreak(vetId, {
        dayOfWeek,
        specificDate,
        startTime,
        endTime,
        description,
        isRecurring: isRecurring ?? true,
      });

      res.status(201).json({
        success: true,
        data: breakItem,
        message: 'Break added successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a break
  async updateBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { dayOfWeek, specificDate, startTime, endTime, description, isRecurring } = req.body;

      const breakItem = await shiftService.updateBreak(id, {
        dayOfWeek,
        specificDate,
        startTime,
        endTime,
        description,
        isRecurring,
      });

      res.json({
        success: true,
        data: breakItem,
        message: 'Break updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove a break
  async removeBreak(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await shiftService.removeBreak(id);

      res.json({
        success: true,
        message: 'Break removed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== AVAILABILITY ====================

  // Get available time slots for a vet on a specific date
  async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { date, duration } = req.query;

      if (!date) {
        throw new AppError('Date is required', 400);
      }

      const durationMinutes = duration ? parseInt(duration as string, 10) : 30;

      const result = await shiftService.getAvailableSlotsWithReason(
        vetId,
        date as string,
        durationMinutes
      );

      res.json({
        success: true,
        data: {
          slots: result.slots,
          unavailableReason: result.unavailableReason,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all vets with their schedules
  async getAllVetsWithSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const vets = await shiftService.getAllVetsWithSchedules();

      res.json({
        success: true,
        data: vets,
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== SCHEDULE PERIODS (New System) ====================

  // Get all schedule periods for a vet
  async getSchedulePeriods(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const periods = await shiftService.getSchedulePeriods(vetId);

      res.json({
        success: true,
        data: periods,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create a new schedule period
  async createSchedulePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { startDate, endDate, workingDays, workStartTime, workEndTime, breakStartTime, breakEndTime } = req.body;

      if (!startDate || !endDate) {
        throw new AppError('Start date and end date are required', 400);
      }

      if (!workingDays || !Array.isArray(workingDays) || workingDays.length === 0) {
        throw new AppError('Working days are required', 400);
      }

      if (!workStartTime || !workEndTime) {
        throw new AppError('Work start time and end time are required', 400);
      }

      const period = await shiftService.createSchedulePeriod(vetId, {
        startDate,
        endDate,
        workingDays,
        workStartTime,
        workEndTime,
        breakStartTime,
        breakEndTime,
      });

      res.status(201).json({
        success: true,
        data: period,
        message: 'Schedule period created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a schedule period
  async updateSchedulePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { startDate, endDate, workingDays, workStartTime, workEndTime, breakStartTime, breakEndTime } = req.body;

      const period = await shiftService.updateSchedulePeriod(id, {
        startDate,
        endDate,
        workingDays,
        workStartTime,
        workEndTime,
        breakStartTime,
        breakEndTime,
      });

      res.json({
        success: true,
        data: period,
        message: 'Schedule period updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a schedule period
  async deleteSchedulePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await shiftService.deleteSchedulePeriod(id);

      res.json({
        success: true,
        message: 'Schedule period deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all vets with their schedule periods
  async getAllVetsWithSchedulePeriods(req: Request, res: Response, next: NextFunction) {
    try {
      const vets = await shiftService.getAllVetsWithSchedulePeriods();

      res.json({
        success: true,
        data: vets,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get availability using the new period-based system
  async getAvailabilityWithPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { vetId } = req.params;
      const { date, duration } = req.query;

      if (!date) {
        throw new AppError('Date is required', 400);
      }

      const durationMinutes = duration ? parseInt(duration as string, 10) : 30;

      const result = await shiftService.getAvailableSlotsWithPeriod(
        vetId,
        date as string,
        durationMinutes
      );

      res.json({
        success: true,
        data: {
          slots: result.slots,
          unavailableReason: result.unavailableReason,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
