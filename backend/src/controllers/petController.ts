import { Response, NextFunction } from 'express';
import { petService } from '../services/petService';
import { AuthRequest } from '../types';

export const petController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pet = await petService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'تم إضافة الحيوان الأليف بنجاح',
        data: pet,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, ownerId } = req.query;
      const result = await petService.findAll(
        Number(page),
        Number(limit),
        search as string,
        ownerId as string
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pet = await petService.findById(req.params.id);

      res.status(200).json({
        success: true,
        data: pet,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pet = await petService.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات الحيوان الأليف بنجاح',
        data: pet,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await petService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
