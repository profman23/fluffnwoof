import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { userService } from '../services/userService';
import { userPreferencesService } from '../services/userPreferencesService';
import { AppError } from '../middlewares/errorHandler';
import prisma from '../lib/prisma';

export const profileController = {
  /**
   * Get current user's profile
   */
  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('غير مصرح بالوصول', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          roleId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              name: true,
              displayNameEn: true,
              displayNameAr: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      res.json({
        message: 'تم جلب الملف الشخصي بنجاح',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update current user's profile (name only)
   */
  async updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('غير مصرح بالوصول', 401);
      }

      const { firstName, lastName } = req.body;

      // Validate input
      if (!firstName && !lastName) {
        throw new AppError('يرجى تقديم الاسم الأول أو الأخير', 400);
      }

      const updateData: { firstName?: string; lastName?: string } = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          roleId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              name: true,
              displayNameEn: true,
              displayNameAr: true,
            },
          },
        },
      });

      res.json({
        message: 'تم تحديث الملف الشخصي بنجاح',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get current user's preferences
   */
  async getMyPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('غير مصرح بالوصول', 401);
      }

      const preferences = await userPreferencesService.getPreferencesWithDefaults(req.user.id);

      res.json({
        message: 'تم جلب التفضيلات بنجاح',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update current user's preferences
   */
  async updateMyPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('غير مصرح بالوصول', 401);
      }

      const { headerBgColor, sidebarBgColor, sidebarHoverColor, flowBoardColors } = req.body;

      // Validate hex colors if provided
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      if (headerBgColor && !hexColorRegex.test(headerBgColor)) {
        throw new AppError('لون خلفية الهيدر غير صالح', 400);
      }
      if (sidebarBgColor && !hexColorRegex.test(sidebarBgColor)) {
        throw new AppError('لون خلفية السايد بار غير صالح', 400);
      }
      if (sidebarHoverColor && !hexColorRegex.test(sidebarHoverColor)) {
        throw new AppError('لون الوقوف غير صالح', 400);
      }

      // Validate flowBoardColors if provided
      if (flowBoardColors) {
        const validKeys = ['scheduled', 'checkIn', 'inProgress', 'hospitalized', 'completed'];
        for (const key of Object.keys(flowBoardColors)) {
          if (!validKeys.includes(key)) {
            throw new AppError(`مفتاح غير صالح في ألوان الـ FlowBoard: ${key}`, 400);
          }
          if (!hexColorRegex.test(flowBoardColors[key])) {
            throw new AppError(`لون غير صالح للـ ${key}`, 400);
          }
        }
      }

      const preferences = await userPreferencesService.updatePreferences(req.user.id, {
        headerBgColor,
        sidebarBgColor,
        sidebarHoverColor,
        flowBoardColors,
      });

      // Return with defaults applied
      const preferencesWithDefaults = await userPreferencesService.getPreferencesWithDefaults(req.user.id);

      res.json({
        message: 'تم حفظ التفضيلات بنجاح',
        data: preferencesWithDefaults,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reset current user's preferences to defaults
   */
  async resetMyPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('غير مصرح بالوصول', 401);
      }

      await userPreferencesService.resetPreferences(req.user.id);

      // Return defaults
      const preferences = await userPreferencesService.getPreferencesWithDefaults(req.user.id);

      res.json({
        message: 'تم إعادة التفضيلات إلى الوضع الافتراضي',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  },
};
