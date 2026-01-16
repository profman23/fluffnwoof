import { Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointmentService';
import { AuthRequest } from '../types';
import { AppointmentStatus } from '@prisma/client';

export const appointmentController = {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointmentDate, ...rest } = req.body;
      // Convert date string to proper Date object (set to start of day in UTC)
      const dateObj = new Date(appointmentDate + 'T00:00:00.000Z');
      const appointment = await appointmentService.create({
        ...rest,
        appointmentDate: dateObj,
      });

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الموعد بنجاح',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, vetId, status, date } = req.query;
      const result = await appointmentService.findAll(
        Number(page),
        Number(limit),
        vetId as string,
        status as AppointmentStatus,
        date as string
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
      const appointment = await appointmentService.findById(req.params.id);

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointmentDate, ...rest } = req.body;
      const updateData: any = { ...rest };

      // Convert date string to proper Date object if provided
      if (appointmentDate) {
        updateData.appointmentDate = new Date(appointmentDate + 'T00:00:00.000Z');
      }

      const appointment = await appointmentService.update(req.params.id, updateData);

      res.status(200).json({
        success: true,
        message: 'تم تحديث الموعد بنجاح',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await appointmentService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUpcoming(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { vetId, limit } = req.query;
      const appointments = await appointmentService.getUpcoming(
        vetId as string,
        Number(limit) || 10
      );

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getFlowBoardData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const data = await appointmentService.getFlowBoardData(date as string);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const appointment = await appointmentService.updateStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'تم تحديث حالة الموعد بنجاح',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateConfirmation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isConfirmed } = req.body;
      const appointment = await appointmentService.updateConfirmation(id, isConfirmed);

      res.status(200).json({
        success: true,
        message: isConfirmed ? 'تم تأكيد الموعد بنجاح' : 'تم إلغاء تأكيد الموعد',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  },
};
