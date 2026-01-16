import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { userService } from '../services/userService';
import { permissionService } from '../services/permissionService';
import { AppError } from '../middlewares/errorHandler';

export const userController = {
  /**
   * Create new user (Admin only)
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, roleId, firstName, lastName, phone } = req.body;

      const user = await userService.create({
        email,
        password,
        roleId,
        firstName,
        lastName,
        phone,
      });

      res.status(201).json({
        message: 'تم إنشاء المستخدم بنجاح',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * List all users with pagination
   */
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      const result = await userService.findAll(page, limit, search);

      res.json({
        message: 'تم جلب المستخدمين بنجاح',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user details
   */
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.findById(id);

      if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
      }

      res.json({
        message: 'تم جلب المستخدم بنجاح',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user info
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { email, roleId, firstName, lastName, phone } = req.body;

      const user = await userService.update(id, {
        email,
        roleId,
        firstName,
        lastName,
        phone,
      });

      res.json({
        message: 'تم تحديث المستخدم بنجاح',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deactivate user (set isActive = false)
   */
  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await userService.deactivate(id);

      res.json({
        message: 'تم تعطيل المستخدم بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reactivate user
   */
  async reactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await userService.reactivate(id);

      res.json({
        message: 'تم تفعيل المستخدم بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const permissions = await permissionService.getUserPermissions(id);

      res.json({
        message: 'تم جلب الصلاحيات بنجاح',
        data: { permissions },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Grant custom permission to user
   */
  async grantPermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { permissionName } = req.body;

      if (!req.user) {
        throw new AppError('غير مصرح بالوصول', 401);
      }

      await permissionService.grantPermission(id, permissionName, req.user.id);

      res.json({
        message: 'تم منح الصلاحية بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Revoke custom permission from user
   */
  async revokePermission(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, permissionName } = req.params;

      await permissionService.revokePermission(id, permissionName);

      res.json({
        message: 'تم إلغاء الصلاحية بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all available permissions
   */
  async getAllPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await permissionService.getAllPermissions();

      res.json({
        message: 'تم جلب الصلاحيات بنجاح',
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await permissionService.getPermissionsByCategory();

      res.json({
        message: 'تم جلب الصلاحيات بنجاح',
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user statistics
   */
  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await userService.getUserStatistics();

      res.json({
        message: 'تم جلب الإحصائيات بنجاح',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change user password (Admin reset)
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        throw new AppError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 400);
      }

      await userService.changePassword(id, newPassword);

      res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },
};
