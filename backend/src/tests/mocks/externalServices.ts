// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - External Service Mocks
// Centralised mocks for SMS, Email, WhatsApp, Cloudinary
// NEVER send real messages in tests
// ══════════════════════════════════════════════════════════════

import { vi } from 'vitest';

export function setupSmsMocks() {
  vi.mock('../../services/smsService', () => ({
    getBalance: vi.fn().mockResolvedValue({ balance: 100, status: 'success' }),
    sendSms: vi.fn().mockResolvedValue({
      id: 'mock-sms-id',
      phone: '+966500000000',
      message: 'Test',
      status: 'SENT',
      createdAt: new Date(),
    }),
    sendOtpSms: vi.fn().mockResolvedValue(undefined),
    getMessageStatus: vi.fn().mockResolvedValue({ status: 'DELIVERED' }),
    getLogs: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }),
  }));
}

export function setupEmailMocks() {
  const mockResult = { success: true, messageId: 'mock-email-id' };

  vi.mock('../../services/emailService', () => ({
    sendEmail: vi.fn().mockResolvedValue(mockResult),
    sendAppointmentEmail: vi.fn().mockResolvedValue(mockResult),
    sendOtpEmail: vi.fn().mockResolvedValue(mockResult),
    sendPortalBookingConfirmation: vi.fn().mockResolvedValue(mockResult),
    sendPendingBookingEmail: vi.fn().mockResolvedValue(mockResult),
    sendBookingApprovedEmail: vi.fn().mockResolvedValue(mockResult),
    sendBookingRejectedEmail: vi.fn().mockResolvedValue(mockResult),
    sendCancellationNotice: vi.fn().mockResolvedValue(mockResult),
    sendFormNotificationEmail: vi.fn().mockResolvedValue(mockResult),
    testConnection: vi.fn().mockResolvedValue({ success: true, provider: 'mock' }),
    emailService: {
      sendEmail: vi.fn().mockResolvedValue(mockResult),
      sendAppointmentEmail: vi.fn().mockResolvedValue(mockResult),
      sendOtpEmail: vi.fn().mockResolvedValue(mockResult),
      sendPortalBookingConfirmation: vi.fn().mockResolvedValue(mockResult),
      sendPendingBookingEmail: vi.fn().mockResolvedValue(mockResult),
      sendBookingApprovedEmail: vi.fn().mockResolvedValue(mockResult),
      sendBookingRejectedEmail: vi.fn().mockResolvedValue(mockResult),
      sendCancellationNotice: vi.fn().mockResolvedValue(mockResult),
      sendFormNotificationEmail: vi.fn().mockResolvedValue(mockResult),
      testConnection: vi.fn().mockResolvedValue({ success: true, provider: 'mock' }),
    },
    default: {
      sendEmail: vi.fn().mockResolvedValue(mockResult),
      sendAppointmentEmail: vi.fn().mockResolvedValue(mockResult),
      sendOtpEmail: vi.fn().mockResolvedValue(mockResult),
      sendPortalBookingConfirmation: vi.fn().mockResolvedValue(mockResult),
      sendPendingBookingEmail: vi.fn().mockResolvedValue(mockResult),
      sendBookingApprovedEmail: vi.fn().mockResolvedValue(mockResult),
      sendBookingRejectedEmail: vi.fn().mockResolvedValue(mockResult),
      sendCancellationNotice: vi.fn().mockResolvedValue(mockResult),
      sendFormNotificationEmail: vi.fn().mockResolvedValue(mockResult),
      testConnection: vi.fn().mockResolvedValue({ success: true, provider: 'mock' }),
    },
  }));
}

export function setupWhatsappMocks() {
  vi.mock('../../services/whatsappService', () => ({
    sendWhatsapp: vi.fn().mockResolvedValue({
      success: true,
      messageId: 'mock-wa-id',
      status: 'sent',
    }),
    testConnection: vi.fn().mockResolvedValue({
      success: true,
      message: 'Connected',
      account: { friendlyName: 'Test' },
    }),
    getTemplates: vi.fn().mockResolvedValue({
      success: true,
      templates: [],
    }),
  }));
}

export function setupCloudinaryMocks() {
  vi.mock('../../config/cloudinary', () => {
    const memoryStorage = { _handleFile: vi.fn(), _removeFile: vi.fn() };
    return {
      userAvatarStorage: memoryStorage,
      petPhotoStorage: memoryStorage,
      medicalAttachmentStorage: memoryStorage,
      clinicLogoStorage: memoryStorage,
      default: {
        uploader: {
          destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
          upload: vi.fn().mockResolvedValue({ secure_url: 'https://mock.cloudinary.com/test.jpg', public_id: 'mock-id' }),
        },
        config: vi.fn(),
      },
    };
  });
}

export function setupAllExternalMocks() {
  setupSmsMocks();
  setupEmailMocks();
  setupWhatsappMocks();
  setupCloudinaryMocks();
}
