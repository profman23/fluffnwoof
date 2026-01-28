import { Response } from 'express';
import { AuthRequest } from '../types';
import * as whatsappService from '../services/whatsappService';

export const whatsappController = {
  // Test connection
  async testConnection(req: AuthRequest, res: Response) {
    try {
      const result = await whatsappService.testConnection();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Send text message
  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { phone, message, recipientName } = req.body;

      if (!phone || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone and message are required',
        });
      }

      const result = await whatsappService.sendWhatsapp({
        phone,
        message,
        recipientName,
        sentById: req.user?.id,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Send template message
  async sendTemplate(req: AuthRequest, res: Response) {
    try {
      const { phone, templateName, templateLanguage, parameters, recipientName } = req.body;

      if (!phone || !templateName) {
        return res.status(400).json({
          success: false,
          message: 'Phone and templateName are required',
        });
      }

      const result = await whatsappService.sendWhatsappTemplate({
        phone,
        templateName,
        templateLanguage,
        parameters,
        recipientName,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get templates
  async getTemplates(req: AuthRequest, res: Response) {
    try {
      const result = await whatsappService.getTemplates();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};
