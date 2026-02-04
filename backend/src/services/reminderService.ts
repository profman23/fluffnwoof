import { ReminderEventType, NotificationChannel, ReminderLogStatus, Prisma } from '@prisma/client';
import { sendSms } from './smsService';
import { sendWhatsapp } from './whatsappService';
import { sendAppointmentEmail } from './emailService';
import prisma from '../lib/prisma';

// Default templates for each event type
const defaultTemplates: Record<string, { ar: string; en: string }> = {
  APPOINTMENT_BOOKED: {
    ar: 'مرحباً {{ownerName}}، تم حجز موعد لـ {{petName}} يوم {{appointmentDate}} الساعة {{appointmentTime}}. عيادة Fluff N\' Woof',
    en: 'Hello {{ownerName}}, an appointment for {{petName}} has been booked on {{appointmentDate}} at {{appointmentTime}}. Fluff N\' Woof Clinic',
  },
  APPOINTMENT_CONFIRMED: {
    ar: 'مرحباً {{ownerName}}، تم تأكيد موعد {{petName}} يوم {{appointmentDate}} الساعة {{appointmentTime}}. نراكم قريباً!',
    en: 'Hello {{ownerName}}, your appointment for {{petName}} on {{appointmentDate}} at {{appointmentTime}} is confirmed. See you soon!',
  },
  APPOINTMENT_CANCELLED: {
    ar: 'مرحباً {{ownerName}}، تم إلغاء موعد {{petName}} المحدد يوم {{appointmentDate}}. للحجز من جديد يرجى التواصل معنا.',
    en: 'Hello {{ownerName}}, the appointment for {{petName}} on {{appointmentDate}} has been cancelled. Please contact us to reschedule.',
  },
  PRE_APPOINTMENT: {
    ar: 'تذكير: موعد {{petName}} غداً {{appointmentDate}} الساعة {{appointmentTime}}. عيادة Fluff N\' Woof',
    en: 'Reminder: {{petName}}\'s appointment is tomorrow {{appointmentDate}} at {{appointmentTime}}. Fluff N\' Woof Clinic',
  },
  FOLLOW_UP: {
    ar: 'مرحباً {{ownerName}}، حان موعد {{visitType}} لـ {{petName}} يوم {{appointmentDate}}. نتطلع لرؤيتكم!',
    en: 'Hello {{ownerName}}, {{petName}}\'s {{visitType}} is due on {{appointmentDate}}. We look forward to seeing you!',
  },
  OWNER_CREATED: {
    ar: 'مرحباً {{ownerName}}! نحن سعداء بانضمامك وانضمام {{petName}} لعائلة Fluff N\' Woof. نتطلع لخدمتكم! للتواصل: {{clinicPhone}}',
    en: 'Welcome {{ownerName}}! We\'re delighted to have you and {{petName}} join the Fluff N\' Woof family. Contact us: {{clinicPhone}}',
  },
};

export interface ReminderSettingInput {
  isEnabled?: boolean;
  sendBeforeHours?: number | null;
  smsEnabled?: boolean;
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  templateAr?: string | null;
  templateEn?: string | null;
}

export interface GetLogsParams {
  page?: number;
  limit?: number;
  status?: ReminderLogStatus;
  channel?: NotificationChannel;
}

export const reminderService = {
  // Get all reminder settings
  async getSettings() {
    // First, ensure all event types have settings
    await this.initializeDefaultSettings();

    return prisma.reminderSetting.findMany({
      orderBy: [
        { eventType: 'asc' },
        { reminderOrder: 'asc' },
      ],
    });
  },

  // Initialize default settings for all event types
  async initializeDefaultSettings() {
    const eventTypes: ReminderEventType[] = [
      'APPOINTMENT_BOOKED',
      'APPOINTMENT_CONFIRMED',
      'APPOINTMENT_CANCELLED',
      'PRE_APPOINTMENT',
      'FOLLOW_UP',
      'OWNER_CREATED',
    ];

    for (const eventType of eventTypes) {
      const existing = await prisma.reminderSetting.findUnique({
        where: {
          eventType_reminderOrder: {
            eventType,
            reminderOrder: 1,
          },
        },
      });

      if (!existing) {
        await prisma.reminderSetting.create({
          data: {
            eventType,
            isEnabled: false,
            smsEnabled: true,
            whatsappEnabled: false,
            emailEnabled: false,
            pushEnabled: false,
            templateAr: defaultTemplates[eventType]?.ar || null,
            templateEn: defaultTemplates[eventType]?.en || null,
            reminderOrder: 1,
            sendBeforeHours: eventType === 'PRE_APPOINTMENT' ? 24 : eventType === 'FOLLOW_UP' ? 48 : null,
          },
        });
      }
    }
  },

  // Get a specific setting
  async getSetting(eventType: ReminderEventType, reminderOrder: number = 1) {
    return prisma.reminderSetting.findUnique({
      where: {
        eventType_reminderOrder: {
          eventType,
          reminderOrder,
        },
      },
    });
  },

  // Update a setting
  async updateSetting(eventType: ReminderEventType, data: ReminderSettingInput, reminderOrder: number = 1) {
    return prisma.reminderSetting.upsert({
      where: {
        eventType_reminderOrder: {
          eventType,
          reminderOrder,
        },
      },
      update: data,
      create: {
        eventType,
        reminderOrder,
        isEnabled: data.isEnabled ?? false,
        sendBeforeHours: data.sendBeforeHours ?? null,
        smsEnabled: data.smsEnabled ?? false,
        whatsappEnabled: data.whatsappEnabled ?? false,
        emailEnabled: data.emailEnabled ?? false,
        pushEnabled: data.pushEnabled ?? false,
        templateAr: data.templateAr ?? defaultTemplates[eventType]?.ar ?? null,
        templateEn: data.templateEn ?? defaultTemplates[eventType]?.en ?? null,
      },
    });
  },

  // Toggle a setting
  async toggleSetting(eventType: ReminderEventType, isEnabled: boolean, reminderOrder: number = 1) {
    return prisma.reminderSetting.update({
      where: {
        eventType_reminderOrder: {
          eventType,
          reminderOrder,
        },
      },
      data: { isEnabled },
    });
  },

  // Get reminder logs with pagination
  async getLogs(params: GetLogsParams = {}) {
    const { page = 1, limit = 20, status, channel } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ReminderLogWhereInput = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const [data, total] = await Promise.all([
      prisma.reminderLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          setting: true,
          appointment: {
            include: {
              pet: {
                include: {
                  owner: true,
                },
              },
            },
          },
        },
      }),
      prisma.reminderLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get stats
  async getStats() {
    const [totalSent, delivered, failed, pending] = await Promise.all([
      prisma.reminderLog.count({ where: { status: { in: ['SENT', 'DELIVERED'] } } }),
      prisma.reminderLog.count({ where: { status: 'DELIVERED' } }),
      prisma.reminderLog.count({ where: { status: 'FAILED' } }),
      prisma.reminderLog.count({ where: { status: 'PENDING' } }),
    ]);

    return { totalSent, delivered, failed, pending };
  },

  // Send a reminder for an appointment
  async sendReminder(
    appointmentId: string,
    eventType: ReminderEventType,
    reminderOrder: number = 1
  ) {
    // Get the setting
    const setting = await this.getSetting(eventType, reminderOrder);
    if (!setting || !setting.isEnabled) {
      return null;
    }

    // Get appointment with pet and owner
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        vet: true,
      },
    });

    if (!appointment || !appointment.pet.owner) {
      return null;
    }

    const owner = appointment.pet.owner;
    const pet = appointment.pet;

    // Prepare template variables
    const variables = {
      ownerName: `${owner.firstName} ${owner.lastName}`,
      petName: pet.name,
      appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
      appointmentTime: appointment.appointmentTime,
      visitType: appointment.visitType,
      vetName: appointment.vet ? `${appointment.vet.firstName} ${appointment.vet.lastName}` : '',
      clinicName: 'Fluff N\' Woof',
      clinicPhone: '+966XXXXXXXXX',
    };

    // Replace variables in template
    const replaceVariables = (template: string) => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
      return result;
    };

    const results = [];

    // Send via SMS if enabled
    if (setting.smsEnabled && owner.phone) {
      const messageBody = replaceVariables(setting.templateAr || defaultTemplates[eventType].ar);

      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          settingId: setting.id,
          appointmentId,
          channel: 'SMS',
          status: 'PENDING',
          recipientPhone: owner.phone,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          messageBody,
        },
      });

      try {
        // Send SMS
        const smsResult = await sendSms({
          phone: owner.phone,
          message: messageBody,
          recipientName: `${owner.firstName} ${owner.lastName}`,
        });

        // Update log
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: smsResult.status === 'SENT' ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            externalId: smsResult.messageId || null,
            errorMessage: smsResult.errorMessage || null,
          },
        });

        results.push({ channel: 'SMS', success: smsResult.status === 'SENT' });
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        results.push({ channel: 'SMS', success: false, error: error.message });
      }
    }

    // Send via WhatsApp if enabled
    if (setting.whatsappEnabled && owner.phone) {
      const messageBody = replaceVariables(setting.templateAr || defaultTemplates[eventType].ar);

      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          settingId: setting.id,
          appointmentId,
          channel: 'WHATSAPP',
          status: 'PENDING',
          recipientPhone: owner.phone,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          messageBody,
        },
      });

      try {
        // Send WhatsApp
        const whatsappResult = await sendWhatsapp({
          phone: owner.phone,
          message: messageBody,
          recipientName: `${owner.firstName} ${owner.lastName}`,
        });

        // Update log
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: whatsappResult.success ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            externalId: whatsappResult.messageId || null,
            errorMessage: whatsappResult.errorMessage || null,
          },
        });

        results.push({ channel: 'WHATSAPP', success: whatsappResult.success });
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        results.push({ channel: 'WHATSAPP', success: false, error: error.message });
      }
    }

    // Send via Email if enabled
    if (setting.emailEnabled && owner.email) {
      // Map event type to email type
      const emailTypeMap: Record<ReminderEventType, 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'REMINDER' | 'FOLLOWUP' | 'WELCOME'> = {
        APPOINTMENT_BOOKED: 'BOOKED',
        APPOINTMENT_CONFIRMED: 'CONFIRMED',
        APPOINTMENT_CANCELLED: 'CANCELLED',
        PRE_APPOINTMENT: 'REMINDER',
        FOLLOW_UP: 'FOLLOWUP',
        OWNER_CREATED: 'WELCOME',
      };

      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          settingId: setting.id,
          appointmentId,
          channel: 'EMAIL',
          status: 'PENDING',
          recipientPhone: owner.email, // Using recipientPhone field for email
          recipientName: `${owner.firstName} ${owner.lastName}`,
          messageBody: `Email notification for ${eventType}`,
        },
      });

      try {
        // Send Email
        const emailResult = await sendAppointmentEmail({
          to: owner.email,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          petName: pet.name,
          appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
          appointmentTime: appointment.appointmentTime,
          type: emailTypeMap[eventType],
        });

        // Update log
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: emailResult.success ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            externalId: emailResult.messageId || null,
            errorMessage: emailResult.errorMessage || null,
          },
        });

        results.push({ channel: 'EMAIL', success: emailResult.success });
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        results.push({ channel: 'EMAIL', success: false, error: error.message });
      }
    }

    // TODO: Add Push notification support

    return results;
  },

  // Process scheduled reminders (called by cron job)
  async processScheduledReminders() {
    const now = new Date();

    // Find pending reminders that are due
    const pendingLogs = await prisma.reminderLog.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        setting: true,
        appointment: {
          include: {
            pet: {
              include: {
                owner: true,
              },
            },
          },
        },
      },
    });

    for (const log of pendingLogs) {
      if (!log.appointment || !log.appointment.pet.owner) continue;

      try {
        if (log.channel === 'SMS' && log.recipientPhone && log.messageBody) {
          const smsResult = await sendSms({
            phone: log.recipientPhone,
            message: log.messageBody,
            recipientName: log.recipientName || undefined,
          });

          await prisma.reminderLog.update({
            where: { id: log.id },
            data: {
              status: smsResult.status === 'SENT' ? 'SENT' : 'FAILED',
              sentAt: new Date(),
              externalId: smsResult.messageId || null,
              errorMessage: smsResult.errorMessage || null,
            },
          });
        }

        // Handle WhatsApp channel
        if (log.channel === 'WHATSAPP' && log.recipientPhone && log.messageBody) {
          const whatsappResult = await sendWhatsapp({
            phone: log.recipientPhone,
            message: log.messageBody,
            recipientName: log.recipientName || undefined,
          });

          await prisma.reminderLog.update({
            where: { id: log.id },
            data: {
              status: whatsappResult.success ? 'SENT' : 'FAILED',
              sentAt: new Date(),
              externalId: whatsappResult.messageId || null,
              errorMessage: whatsappResult.errorMessage || null,
            },
          });
        }

        // Handle Email channel
        if (log.channel === 'EMAIL' && log.recipientPhone && log.appointment) {
          const owner = log.appointment.pet.owner;
          const pet = log.appointment.pet;
          const eventType = log.setting.eventType;

          const emailTypeMap: Record<ReminderEventType, 'BOOKED' | 'CONFIRMED' | 'CANCELLED' | 'REMINDER' | 'FOLLOWUP' | 'WELCOME'> = {
            APPOINTMENT_BOOKED: 'BOOKED',
            APPOINTMENT_CONFIRMED: 'CONFIRMED',
            APPOINTMENT_CANCELLED: 'CANCELLED',
            PRE_APPOINTMENT: 'REMINDER',
            FOLLOW_UP: 'FOLLOWUP',
            OWNER_CREATED: 'WELCOME',
          };

          const emailResult = await sendAppointmentEmail({
            to: log.recipientPhone, // email stored in recipientPhone field
            recipientName: log.recipientName || `${owner?.firstName} ${owner?.lastName}`,
            petName: pet.name,
            appointmentDate: new Date(log.appointment.appointmentDate).toLocaleDateString('ar-SA'),
            appointmentTime: log.appointment.appointmentTime,
            type: emailTypeMap[eventType],
          });

          await prisma.reminderLog.update({
            where: { id: log.id },
            data: {
              status: emailResult.success ? 'SENT' : 'FAILED',
              sentAt: new Date(),
              externalId: emailResult.messageId || null,
              errorMessage: emailResult.errorMessage || null,
            },
          });
        }
        // TODO: Handle Push channel
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      }
    }

    return pendingLogs.length;
  },

  // Schedule pre-appointment reminders for upcoming appointments
  async schedulePreAppointmentReminders() {
    const setting = await this.getSetting('PRE_APPOINTMENT', 1);
    if (!setting || !setting.isEnabled || !setting.sendBeforeHours) {
      return 0;
    }

    const hoursAhead = setting.sendBeforeHours;
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: now,
          lte: targetTime,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        // Check if reminder already exists
        reminderLogs: {
          none: {
            setting: {
              eventType: 'PRE_APPOINTMENT',
              reminderOrder: 1,
            },
          },
        },
      },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        vet: true,
      },
    });

    let scheduled = 0;
    for (const appointment of appointments) {
      if (!appointment.pet.owner?.phone) continue;

      const owner = appointment.pet.owner;
      const pet = appointment.pet;

      const variables = {
        ownerName: `${owner.firstName} ${owner.lastName}`,
        petName: pet.name,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
        appointmentTime: appointment.appointmentTime,
        visitType: appointment.visitType,
        vetName: appointment.vet ? `${appointment.vet.firstName} ${appointment.vet.lastName}` : '',
        clinicName: 'Fluff N\' Woof',
        clinicPhone: '+966XXXXXXXXX',
      };

      let messageBody = setting.templateAr || defaultTemplates.PRE_APPOINTMENT.ar;
      for (const [key, value] of Object.entries(variables)) {
        messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      // Calculate when to send (appointment time minus hours)
      const appointmentDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.appointmentTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const scheduledFor = new Date(appointmentDateTime.getTime() - hoursAhead * 60 * 60 * 1000);

      if (setting.smsEnabled) {
        await prisma.reminderLog.create({
          data: {
            settingId: setting.id,
            appointmentId: appointment.id,
            channel: 'SMS',
            status: 'PENDING',
            recipientPhone: owner.phone,
            recipientName: `${owner.firstName} ${owner.lastName}`,
            messageBody,
            scheduledFor,
          },
        });
        scheduled++;
      }
    }

    return scheduled;
  },

  // Schedule follow-up reminders for scheduled follow-up appointments
  async scheduleFollowUpReminders() {
    const setting = await this.getSetting('FOLLOW_UP', 1);
    if (!setting || !setting.isEnabled || !setting.sendBeforeHours) {
      return 0;
    }

    const hoursAhead = setting.sendBeforeHours;
    const now = new Date();
    const targetDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // Find follow-up appointments that need reminders
    // These are appointments scheduled from a medical record
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: now,
          lte: targetDate,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        scheduledFromRecordId: {
          not: null, // Only follow-up appointments
        },
        // Check if reminder already exists
        reminderLogs: {
          none: {
            setting: {
              eventType: 'FOLLOW_UP',
              reminderOrder: 1,
            },
          },
        },
      },
      include: {
        pet: {
          include: {
            owner: true,
          },
        },
        vet: true,
      },
    });

    let scheduled = 0;
    for (const appointment of appointments) {
      if (!appointment.pet.owner?.phone) continue;

      const owner = appointment.pet.owner;
      const pet = appointment.pet;

      const visitTypeMap: Record<string, string> = {
        GENERAL_CHECKUP: 'الفحص الدوري',
        VACCINATION: 'التطعيم',
        GROOMING: 'العناية',
        SURGERY: 'الجراحة',
        EMERGENCY: 'الطوارئ',
      };

      const variables = {
        ownerName: `${owner.firstName} ${owner.lastName}`,
        petName: pet.name,
        appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('ar-SA'),
        appointmentTime: appointment.appointmentTime,
        visitType: visitTypeMap[appointment.visitType] || appointment.visitType,
        vetName: appointment.vet ? `${appointment.vet.firstName} ${appointment.vet.lastName}` : '',
        clinicName: 'Fluff N\' Woof',
        clinicPhone: '+966XXXXXXXXX',
      };

      let messageBody = setting.templateAr || defaultTemplates.FOLLOW_UP.ar;
      for (const [key, value] of Object.entries(variables)) {
        messageBody = messageBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      // Schedule for now (will be sent in next process cycle)
      if (setting.smsEnabled) {
        await prisma.reminderLog.create({
          data: {
            settingId: setting.id,
            appointmentId: appointment.id,
            channel: 'SMS',
            status: 'PENDING',
            recipientPhone: owner.phone,
            recipientName: `${owner.firstName} ${owner.lastName}`,
            messageBody,
            scheduledFor: now,
          },
        });
        scheduled++;
      }
    }

    return scheduled;
  },

  // Get message templates
  async getTemplates() {
    return prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  // Send welcome reminder for a new owner (with pet name)
  async sendOwnerWelcomeReminder(ownerId: string, petName?: string) {
    // Get the setting
    const setting = await this.getSetting('OWNER_CREATED', 1);
    if (!setting || !setting.isEnabled) {
      return null;
    }

    // Get owner
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return null;
    }

    // Prepare template variables
    const variables = {
      ownerName: `${owner.firstName} ${owner.lastName}`,
      petName: petName || '',
      clinicName: "Fluff N' Woof",
      clinicPhone: '+966XXXXXXXXX',
    };

    // Replace variables in template
    const replaceVariables = (template: string) => {
      let result = template;
      for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
      return result;
    };

    const results = [];

    // Send via SMS if enabled
    if (setting.smsEnabled && owner.phone) {
      const messageBody = replaceVariables(setting.templateAr || defaultTemplates.OWNER_CREATED.ar);

      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          settingId: setting.id,
          ownerId,
          channel: 'SMS',
          status: 'PENDING',
          recipientPhone: owner.phone,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          messageBody,
        },
      });

      try {
        // Send SMS
        const smsResult = await sendSms({
          phone: owner.phone,
          message: messageBody,
          recipientName: `${owner.firstName} ${owner.lastName}`,
        });

        // Update log
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: smsResult.status === 'SENT' ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            externalId: smsResult.messageId || null,
            errorMessage: smsResult.errorMessage || null,
          },
        });

        results.push({ channel: 'SMS', success: smsResult.status === 'SENT' });
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        results.push({ channel: 'SMS', success: false, error: error.message });
      }
    }

    // Send via WhatsApp if enabled
    if (setting.whatsappEnabled && owner.phone) {
      const messageBody = replaceVariables(setting.templateAr || defaultTemplates.OWNER_CREATED.ar);

      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          settingId: setting.id,
          ownerId,
          channel: 'WHATSAPP',
          status: 'PENDING',
          recipientPhone: owner.phone,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          messageBody,
        },
      });

      try {
        // Send WhatsApp
        const whatsappResult = await sendWhatsapp({
          phone: owner.phone,
          message: messageBody,
          recipientName: `${owner.firstName} ${owner.lastName}`,
        });

        // Update log
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: whatsappResult.success ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            externalId: whatsappResult.messageId || null,
            errorMessage: whatsappResult.errorMessage || null,
          },
        });

        results.push({ channel: 'WHATSAPP', success: whatsappResult.success });
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        results.push({ channel: 'WHATSAPP', success: false, error: error.message });
      }
    }

    // Send via Email if enabled
    if (setting.emailEnabled && owner.email) {
      // Create log entry
      const log = await prisma.reminderLog.create({
        data: {
          settingId: setting.id,
          ownerId,
          channel: 'EMAIL',
          status: 'PENDING',
          recipientEmail: owner.email,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          messageBody: `Welcome email for new owner`,
        },
      });

      try {
        // Send Email
        const emailResult = await sendAppointmentEmail({
          to: owner.email,
          recipientName: `${owner.firstName} ${owner.lastName}`,
          petName: petName,
          type: 'WELCOME',
        });

        // Update log
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: emailResult.success ? 'SENT' : 'FAILED',
            sentAt: new Date(),
            externalId: emailResult.messageId || null,
            errorMessage: emailResult.errorMessage || null,
          },
        });

        results.push({ channel: 'EMAIL', success: emailResult.success });
      } catch (error: any) {
        await prisma.reminderLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
        results.push({ channel: 'EMAIL', success: false, error: error.message });
      }
    }

    return results;
  },
};
