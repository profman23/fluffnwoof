import { Request, Response, NextFunction } from 'express';
import { visitTypeService } from '../services/visitTypeService';
import { AppError } from '../middlewares/errorHandler';

export const visitTypeController = {
  // Get all visit types
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const visitTypes = await visitTypeService.getAll(includeInactive);

      res.json({
        success: true,
        data: visitTypes,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get visit type by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const visitType = await visitTypeService.getById(id);

      if (!visitType) {
        throw new AppError('Visit type not found', 404);
      }

      res.json({
        success: true,
        data: visitType,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create a new visit type
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, nameEn, nameAr, duration, color, isActive, sortOrder } = req.body;

      if (!nameEn || !nameAr) {
        throw new AppError('Name in English and Arabic are required', 400);
      }

      if (!duration || duration < 1) {
        throw new AppError('Duration must be at least 1 minute', 400);
      }

      const visitType = await visitTypeService.create({
        code,
        nameEn,
        nameAr,
        duration,
        color,
        isActive,
        sortOrder,
      });

      res.status(201).json({
        success: true,
        data: visitType,
        message: 'Visit type created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a visit type
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { code, nameEn, nameAr, duration, color, isActive, sortOrder } = req.body;

      const visitType = await visitTypeService.update(id, {
        code,
        nameEn,
        nameAr,
        duration,
        color,
        isActive,
        sortOrder,
      });

      res.json({
        success: true,
        data: visitType,
        message: 'Visit type updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Toggle active status
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        throw new AppError('isActive must be a boolean', 400);
      }

      const visitType = await visitTypeService.toggleActive(id, isActive);

      res.json({
        success: true,
        data: visitType,
        message: `Visit type ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a visit type
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      await visitTypeService.delete(id);

      res.json({
        success: true,
        message: 'Visit type deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Reorder visit types
  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderedIds } = req.body;

      if (!Array.isArray(orderedIds)) {
        throw new AppError('orderedIds must be an array', 400);
      }

      await visitTypeService.reorder(orderedIds);

      res.json({
        success: true,
        message: 'Visit types reordered successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Seed default visit types
  async seedDefaults(req: Request, res: Response, next: NextFunction) {
    try {
      await visitTypeService.seedDefaults();

      res.json({
        success: true,
        message: 'Default visit types seeded successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
