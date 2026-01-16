import { Response, NextFunction } from 'express';
import { medicalRecordService } from '../services/medicalRecordService';
import { auditService } from '../services/auditService';
import { AuthRequest } from '../types';

export const medicalRecordController = {
  /**
   * Get all medical records with pagination and search
   */
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, search } = req.query;
      const result = await medicalRecordService.findAll(
        Number(page) || 1,
        Number(limit) || 20,
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

  /**
   * Get audit log for a medical record
   */
  async getAuditLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await auditService.getResourceHistory('MedicalRecord', req.params.id);
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new medical record
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await medicalRecordService.create({
        ...req.body,
        createdById: req.user?.id,
      });

      res.status(201).json({
        success: true,
        message: 'تم إنشاء السجل الطبي بنجاح',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get medical record by ID
   */
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await medicalRecordService.findById(req.params.id);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get medical record by appointment ID
   */
  async findByAppointmentId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await medicalRecordService.findByAppointmentId(req.params.appointmentId);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all medical records for a pet
   */
  async findByPetId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const result = await medicalRecordService.findByPetId(
        req.params.petId,
        Number(page) || 1,
        Number(limit) || 20
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

  /**
   * Update medical record
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await medicalRecordService.update(req.params.id, {
        ...req.body,
        updatedById: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: 'تم تحديث السجل الطبي بنجاح',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete medical record
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await medicalRecordService.delete(req.params.id);

      res.status(200).json({
        success: true,
        message: 'تم حذف السجل الطبي بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get or create medical record for appointment
   * Used when opening patient record from FlowBoard
   */
  async getOrCreateForAppointment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await medicalRecordService.getOrCreateForAppointment(
        req.params.appointmentId,
        req.user?.id || ''
      );

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  },
};
