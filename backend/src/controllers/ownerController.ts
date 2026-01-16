import { Response, NextFunction } from 'express';
import { ownerService } from '../services/ownerService';
import { AuthRequest } from '../types';

export const ownerController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const owner = await ownerService.create(req.body);

      res.status(201).json({
        success: true,
        message: 'تم إضافة المالك بنجاح',
        data: owner,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await ownerService.findAll(
        Number(page),
        Number(limit),
        search as string
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
      const owner = await ownerService.findById(req.params.id);

      res.status(200).json({
        success: true,
        data: owner,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const owner = await ownerService.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'تم تحديث بيانات المالك بنجاح',
        data: owner,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ownerService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
