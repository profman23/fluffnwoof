import { Response } from 'express';
import { AuthRequest } from '../types';
import * as smsService from '../services/smsService';
import { SmsStatus } from '@prisma/client';

// Get SMS balance
export const getBalance = async (req: AuthRequest, res: Response) => {
  try {
    const balance = await smsService.getBalance();
    res.json(balance);
  } catch (error: any) {
    console.error('Error getting SMS balance:', error);
    res.status(500).json({ message: error.message || 'Failed to get SMS balance' });
  }
};

// Send SMS
export const sendSms = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, message, recipientName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ message: 'Phone and message are required' });
    }

    const userId = req.user?.id;

    const result = await smsService.sendSms({
      phone,
      message,
      recipientName,
      sentById: userId,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ message: error.message || 'Failed to send SMS' });
  }
};

// Get SMS logs
export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, status, phone } = req.query;

    const result = await smsService.getLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as SmsStatus | undefined,
      phone: phone as string | undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error getting SMS logs:', error);
    res.status(500).json({ message: error.message || 'Failed to get SMS logs' });
  }
};

// Get message status
export const getMessageStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ message: 'Message ID is required' });
    }

    const status = await smsService.getMessageStatus(messageId);
    res.json(status);
  } catch (error: any) {
    console.error('Error getting message status:', error);
    res.status(500).json({ message: error.message || 'Failed to get message status' });
  }
};
