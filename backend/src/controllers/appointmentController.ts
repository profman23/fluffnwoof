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

  /**
   * Create multiple appointments in batch
   * Used for booking next appointments from PatientRecordModal
   * Returns created and skipped appointments with reasons
   */
  async createBatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointments } = req.body;

      if (!Array.isArray(appointments) || appointments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'يجب توفير قائمة بالمواعيد',
        });
      }

      // Convert date strings to Date objects
      const appointmentsWithDates = appointments.map((appt: any) => ({
        ...appt,
        appointmentDate: new Date(appt.appointmentDate + 'T00:00:00.000Z'),
      }));

      const result = await appointmentService.createBatch(appointmentsWithDates);

      // إنشاء رسالة مناسبة
      let message = '';
      if (result.created.length > 0 && result.skipped.length === 0) {
        message = `تم إنشاء ${result.created.length} موعد بنجاح`;
      } else if (result.created.length > 0 && result.skipped.length > 0) {
        message = `تم إنشاء ${result.created.length} موعد بنجاح، وتم تخطي ${result.skipped.length} موعد بسبب تعارض`;
      } else if (result.created.length === 0 && result.skipped.length > 0) {
        message = `لم يتم إنشاء أي موعد. تم تخطي ${result.skipped.length} موعد بسبب تعارض`;
      } else {
        message = 'لا توجد مواعيد للإنشاء';
      }

      res.status(201).json({
        success: true,
        message,
        data: {
          created: result.created,
          skipped: result.skipped,
        },
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

  async getUpcomingByPetId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { petId } = req.params;
      const appointments = await appointmentService.getUpcomingByPetId(petId);

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByScheduledFromRecordId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { recordId } = req.params;
      const appointments = await appointmentService.getByScheduledFromRecordId(recordId);

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  },
};
