import { Request, Response, NextFunction } from 'express';
import * as emailService from '../services/emailService';

/**
 * Test email connection
 */
export const testConnection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await emailService.testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: 'Email connection successful',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email connection failed',
        error: result.error,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Send a test email
 */
export const sendTestEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, subject, message } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject: subject || 'Test Email from Fluff N\' Woof',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">رسالة تجريبية</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #374151;">${message || 'هذه رسالة تجريبية من نظام Fluff N\' Woof'}</p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">تم الإرسال بنجاح!</p>
          </div>
        </div>
      `,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.errorMessage,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Send appointment notification email
 */
export const sendAppointmentEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { to, recipientName, petName, appointmentDate, appointmentTime, type } = req.body;

    if (!to || !recipientName || !petName || !appointmentDate || !appointmentTime || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, recipientName, petName, appointmentDate, appointmentTime, type',
      });
    }

    const validTypes = ['BOOKED', 'CONFIRMED', 'CANCELLED', 'REMINDER', 'FOLLOWUP'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const result = await emailService.sendAppointmentEmail({
      to,
      recipientName,
      petName,
      appointmentDate,
      appointmentTime,
      type,
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Appointment email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send appointment email',
        error: result.errorMessage,
      });
    }
  } catch (error) {
    next(error);
  }
};
