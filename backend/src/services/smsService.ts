import { SmsStatus } from '@prisma/client';
import prisma from '../config/database';
import { madarClient, madarConfig } from '../config/madarSms';

interface SendSmsParams {
  phone: string;
  message: string;
  recipientName?: string;
  sentById?: string;
}

interface MadarBalanceResponse {
  status: string;
  message: string | null;
  data: {
    balance: number;
  };
}

interface MadarSendResponse {
  status: string;
  message: string | null;
  data: {
    message: {
      id: string;
      status: string;
    };
  };
}

// Format Saudi phone number to 966xxxxxxxxx format
function formatSaudiPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading zeros
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '966' + cleaned.substring(1);
  }

  // Add 966 if not present
  if (!cleaned.startsWith('966')) {
    cleaned = '966' + cleaned;
  }

  return cleaned;
}

// Get SMS balance from Madar
export const getBalance = async () => {
  try {
    const response = await madarClient.post<MadarBalanceResponse>('/get-balance');
    return {
      balance: response.data.data.balance,
      status: response.data.status,
    };
  } catch (error: any) {
    console.error('Failed to get SMS balance:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get SMS balance');
  }
};

// Send SMS
export const sendSms = async (params: SendSmsParams) => {
  const { phone, message, recipientName, sentById } = params;

  // Format phone number
  const formattedPhone = formatSaudiPhone(phone);

  // Create log entry first
  const smsLog = await prisma.smsLog.create({
    data: {
      recipientPhone: formattedPhone,
      recipientName,
      messageBody: message,
      status: 'PENDING',
      sentById,
    },
  });

  try {
    const response = await madarClient.post<MadarSendResponse>('/send', {
      number: formattedPhone,
      senderName: madarConfig.senderName,
      sendAtOption: 'Now',
      messageBody: message,
      allow_duplicate: true,
    });

    // Update log with success
    const updatedLog = await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        messageId: response.data.data.message.id,
        status: 'SENT',
        sentAt: new Date(),
      },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedLog;
  } catch (error: any) {
    // Update log with failure
    const failedLog = await prisma.smsLog.update({
      where: { id: smsLog.id },
      data: {
        status: 'FAILED',
        errorMessage: error.response?.data?.message || error.message,
      },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return failedLog;
  }
};

// Get SMS logs with pagination
export const getLogs = async (params: {
  page?: number;
  limit?: number;
  status?: SmsStatus;
  phone?: string;
}) => {
  const { page = 1, limit = 20, status, phone } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (phone) {
    where.recipientPhone = {
      contains: phone,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.smsLog.findMany({
      where,
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.smsLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get message status from Madar
export const getMessageStatus = async (messageId: string) => {
  try {
    const response = await madarClient.post(`/message-status/${messageId}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to get message status:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get message status');
  }
};
