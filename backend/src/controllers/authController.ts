import { Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthRequest } from '../types';
import { t } from '../utils/i18n';
import { permissionService } from '../services/permissionService';

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lang = (req as any).language || 'ar';
      const { user, token } = await authService.register(req.body, lang);

      res.status(201).json({
        success: true,
        message: t('auth.accountCreated', lang),
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lang = (req as any).language || 'ar';
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password, lang);

      res.status(200).json({
        success: true,
        message: t('auth.loginSuccess', lang),
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lang = (req as any).language || 'ar';
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: t('auth.unauthorized', lang),
        });
      }

      const user = await authService.getProfile(req.user.id, lang);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lang = (req as any).language || 'ar';
      res.status(200).json({
        success: true,
        message: t('auth.logoutSuccess', lang),
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      console.log('req.user:', req.user);
      console.log('req.user.id:', req.user.id);

      const permissions = await permissionService.getUserPermissions(req.user.id);

      res.status(200).json({
        success: true,
        data: { permissions },
      });
    } catch (error) {
      next(error);
    }
  },
};
