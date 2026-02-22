/**
 * Boarding & ICU Controller
 * Handles boarding slot configuration and session operations
 */

import { Request, Response } from 'express';
import { BoardingType, Species } from '@prisma/client';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// =====================================================
// Slot Configuration Endpoints
// =====================================================

/**
 * Get all boarding slot configurations
 */
export const getConfigs = async (req: Request, res: Response) => {
  try {
    const { type, species, isActive } = req.query;

    const where: any = {};

    if (type) {
      where.type = type as BoardingType;
    }

    if (species) {
      where.species = species as Species;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const configs = await prisma.boardingSlotConfig.findMany({
      where,
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            slotNumber: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { species: 'asc' },
      ],
    });

    // Add available slots count
    const configsWithAvailability = configs.map(config => ({
      ...config,
      availableSlots: config.totalSlots - config.sessions.length,
      occupiedSlots: config.sessions.length,
    }));

    res.json({
      success: true,
      data: configsWithAvailability,
    });
  } catch (error: any) {
    console.error('Error getting boarding configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get boarding configurations',
      errorAr: 'فشل في جلب إعدادات الإقامة',
    });
  }
};

/**
 * Get single boarding configuration by ID
 */
export const getConfigById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const config = await prisma.boardingSlotConfig.findUnique({
      where: { id },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            pet: {
              select: {
                id: true,
                name: true,
                species: true,
                photoUrl: true,
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
        errorAr: 'الإعدادات غير موجودة',
      });
    }

    res.json({
      success: true,
      data: {
        ...config,
        availableSlots: config.totalSlots - config.sessions.length,
        occupiedSlots: config.sessions.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting boarding config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get boarding configuration',
      errorAr: 'فشل في جلب إعدادات الإقامة',
    });
  }
};

/**
 * Create new boarding slot configuration
 */
export const createConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { nameEn, nameAr, type, species, totalSlots, pricePerDay, notes } = req.body;

    // Validate required fields
    if (!nameEn || !nameAr || !type || !species || totalSlots === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name (English & Arabic), type, species, and totalSlots are required',
        errorAr: 'الاسم (بالإنجليزية والعربية) والنوع والفصيلة وعدد الأماكن مطلوبة',
      });
    }

    // Note: Multiple configs per type+species are now allowed (unique constraint removed)

    const config = await prisma.boardingSlotConfig.create({
      data: {
        nameEn,
        nameAr,
        type: type as BoardingType,
        species: species as Species,
        totalSlots: parseInt(totalSlots),
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        notes,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: config,
      message: 'Configuration created successfully',
      messageAr: 'تم إنشاء الإعدادات بنجاح',
    });
  } catch (error: any) {
    console.error('Error creating boarding config:', error);

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'A configuration with this type and species already exists',
        errorAr: 'يوجد إعداد مسبق لهذا النوع والفصيلة',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create boarding configuration',
      errorAr: 'فشل في إنشاء إعدادات الإقامة',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message }),
    });
  }
};

/**
 * Update boarding slot configuration
 */
export const updateConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nameEn, nameAr, totalSlots, pricePerDay, notes, isActive } = req.body;

    // Check if config exists
    const existing = await prisma.boardingSlotConfig.findUnique({
      where: { id },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
        errorAr: 'الإعدادات غير موجودة',
      });
    }

    // Validate totalSlots is not less than current active sessions
    if (totalSlots !== undefined && totalSlots < existing.sessions.length) {
      return res.status(400).json({
        success: false,
        error: `Cannot reduce slots below current occupancy (${existing.sessions.length} active sessions)`,
        errorAr: `لا يمكن تقليل الأماكن عن الإشغال الحالي (${existing.sessions.length} جلسات نشطة)`,
      });
    }

    const config = await prisma.boardingSlotConfig.update({
      where: { id },
      data: {
        nameEn: nameEn !== undefined ? nameEn : undefined,
        nameAr: nameAr !== undefined ? nameAr : undefined,
        totalSlots: totalSlots !== undefined ? parseInt(totalSlots) : undefined,
        pricePerDay: pricePerDay !== undefined ? (pricePerDay ? parseFloat(pricePerDay) : null) : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res.json({
      success: true,
      data: config,
      message: 'Configuration updated successfully',
      messageAr: 'تم تحديث الإعدادات بنجاح',
    });
  } catch (error: any) {
    console.error('Error updating boarding config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update boarding configuration',
      errorAr: 'فشل في تحديث إعدادات الإقامة',
    });
  }
};

/**
 * Delete boarding slot configuration
 */
export const deleteConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if config exists and has active sessions
    const existing = await prisma.boardingSlotConfig.findUnique({
      where: { id },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
        errorAr: 'الإعدادات غير موجودة',
      });
    }

    if (existing.sessions.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete configuration with active sessions',
        errorAr: 'لا يمكن حذف الإعدادات مع وجود جلسات نشطة',
      });
    }

    await prisma.boardingSlotConfig.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Configuration deleted successfully',
      messageAr: 'تم حذف الإعدادات بنجاح',
    });
  } catch (error: any) {
    console.error('Error deleting boarding config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete boarding configuration',
      errorAr: 'فشل في حذف إعدادات الإقامة',
    });
  }
};

// =====================================================
// Session Management Endpoints
// =====================================================

/**
 * Helper function to calculate days remaining until checkout
 */
const calculateDaysRemaining = (expectedCheckOutDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkout = new Date(expectedCheckOutDate);
  checkout.setHours(0, 0, 0, 0);
  const diffTime = checkout.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Helper function to get column based on days remaining
 */
const getColumnForDays = (days: number): 'green' | 'yellow' | 'red' => {
  if (days <= 1) return 'red';
  if (days <= 3) return 'yellow';
  return 'green';
};

/**
 * Get sessions organized by Kanban columns (for Boarding Management page)
 */
export const getKanbanSessions = async (req: Request, res: Response) => {
  try {
    const { type, configId } = req.query;

    const where: any = {
      status: 'ACTIVE',
    };

    // Filter by type through config relation
    if (type) {
      where.config = {
        type: type as BoardingType,
        isActive: true,
      };
    }

    // Filter by specific config
    if (configId) {
      where.configId = configId as string;
    }

    const sessions = await prisma.boardingSession.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            gender: true,
            photoUrl: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        config: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            type: true,
            species: true,
          },
        },
        assignedVet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        expectedCheckOutDate: 'asc',
      },
    });

    // Organize sessions by column
    const kanbanData = {
      green: [] as any[],
      yellow: [] as any[],
      red: [] as any[],
    };

    sessions.forEach(session => {
      if (!session.expectedCheckOutDate) return;

      const daysRemaining = calculateDaysRemaining(session.expectedCheckOutDate);
      const column = getColumnForDays(daysRemaining);

      kanbanData[column].push({
        ...session,
        daysRemaining,
        column,
      });
    });

    res.json({
      success: true,
      data: kanbanData,
      counts: {
        green: kanbanData.green.length,
        yellow: kanbanData.yellow.length,
        red: kanbanData.red.length,
        total: sessions.length,
      },
    });
  } catch (error: any) {
    console.error('Error getting kanban sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get boarding sessions',
      errorAr: 'فشل في جلب جلسات الإقامة',
    });
  }
};

/**
 * Get all active sessions
 */
export const getSessions = async (req: Request, res: Response) => {
  try {
    const { type, configId, status } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      where.status = 'ACTIVE';
    }

    if (type) {
      where.config = {
        type: type as BoardingType,
      };
    }

    if (configId) {
      where.configId = configId as string;
    }

    const sessions = await prisma.boardingSession.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            gender: true,
            photoUrl: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        config: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            type: true,
            species: true,
            pricePerDay: true,
          },
        },
        assignedVet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        checkInDate: 'desc',
      },
    });

    // Add days remaining to each session
    const sessionsWithDays = sessions.map(session => ({
      ...session,
      daysRemaining: session.expectedCheckOutDate
        ? calculateDaysRemaining(session.expectedCheckOutDate)
        : null,
    }));

    res.json({
      success: true,
      data: sessionsWithDays,
    });
  } catch (error: any) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions',
      errorAr: 'فشل في جلب الجلسات',
    });
  }
};

/**
 * Get single session by ID
 */
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.boardingSession.findUnique({
      where: { id },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            breed: true,
            gender: true,
            photoUrl: true,
            birthDate: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        config: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            type: true,
            species: true,
            pricePerDay: true,
          },
        },
        assignedVet: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        errorAr: 'الجلسة غير موجودة',
      });
    }

    res.json({
      success: true,
      data: {
        ...session,
        daysRemaining: session.expectedCheckOutDate
          ? calculateDaysRemaining(session.expectedCheckOutDate)
          : null,
      },
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session',
      errorAr: 'فشل في جلب الجلسة',
    });
  }
};

/**
 * Create new boarding session
 */
export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const {
      configId,
      petId,
      slotNumber: requestedSlotNumber,
      checkInDate,
      expectedCheckOutDate,
      notes,
      assignedVetId,
    } = req.body;

    // Validate required fields
    if (!configId || !petId || !checkInDate || !expectedCheckOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Config, pet, check-in date, and expected check-out date are required',
        errorAr: 'الإعدادات والحيوان وتاريخ الدخول وتاريخ الخروج المتوقع مطلوبة',
      });
    }

    // Get config to check availability
    const config = await prisma.boardingSlotConfig.findUnique({
      where: { id: configId },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found',
        errorAr: 'الإعدادات غير موجودة',
      });
    }

    if (!config.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Configuration is not active',
        errorAr: 'الإعدادات غير نشطة',
      });
    }

    // Check slot availability
    if (config.sessions.length >= config.totalSlots) {
      return res.status(400).json({
        success: false,
        error: 'No available slots in this configuration',
        errorAr: 'لا توجد أماكن متاحة في هذه الإعدادات',
      });
    }

    // Use requested slot number or find next available
    const usedSlots = config.sessions.map(s => s.slotNumber);
    let slotNumber: number;

    if (requestedSlotNumber && typeof requestedSlotNumber === 'number') {
      // Validate the requested slot is within range and available
      if (requestedSlotNumber < 1 || requestedSlotNumber > config.totalSlots) {
        return res.status(400).json({
          success: false,
          error: `Cage number must be between 1 and ${config.totalSlots}`,
          errorAr: `رقم القفص يجب أن يكون بين 1 و ${config.totalSlots}`,
        });
      }
      if (usedSlots.includes(requestedSlotNumber)) {
        return res.status(400).json({
          success: false,
          error: `Cage ${requestedSlotNumber} is already occupied`,
          errorAr: `القفص ${requestedSlotNumber} مشغول بالفعل`,
        });
      }
      slotNumber = requestedSlotNumber;
    } else {
      // Auto-assign next available
      slotNumber = 1;
      while (usedSlots.includes(slotNumber)) {
        slotNumber++;
      }
    }

    // Create session
    const session = await prisma.boardingSession.create({
      data: {
        configId,
        petId,
        slotNumber,
        checkInDate: new Date(checkInDate),
        expectedCheckOutDate: new Date(expectedCheckOutDate),
        notes,
        assignedVetId,
        dailyRate: config.pricePerDay,
        createdById: req.user!.id,
        status: 'ACTIVE',
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        config: {
          select: {
            nameEn: true,
            nameAr: true,
            type: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: session,
      message: 'Boarding session created successfully',
      messageAr: 'تم إنشاء جلسة الإقامة بنجاح',
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create boarding session',
      errorAr: 'فشل في إنشاء جلسة الإقامة',
    });
  }
};

/**
 * Update boarding session
 */
export const updateSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expectedCheckOutDate, notes, assignedVetId } = req.body;

    // Check if session exists
    const existing = await prisma.boardingSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        errorAr: 'الجلسة غير موجودة',
      });
    }

    if (existing.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update non-active session',
        errorAr: 'لا يمكن تحديث جلسة غير نشطة',
      });
    }

    const session = await prisma.boardingSession.update({
      where: { id },
      data: {
        expectedCheckOutDate: expectedCheckOutDate
          ? new Date(expectedCheckOutDate)
          : undefined,
        notes: notes !== undefined ? notes : undefined,
        assignedVetId: assignedVetId !== undefined ? assignedVetId : undefined,
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
          },
        },
        config: {
          select: {
            nameEn: true,
            nameAr: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: session,
      message: 'Session updated successfully',
      messageAr: 'تم تحديث الجلسة بنجاح',
    });
  } catch (error: any) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session',
      errorAr: 'فشل في تحديث الجلسة',
    });
  }
};

/**
 * Checkout (complete) a boarding session
 */
export const checkoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { checkOutNotes } = req.body;

    // Get session with config for price calculation
    const session = await prisma.boardingSession.findUnique({
      where: { id },
      include: {
        config: true,
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        errorAr: 'الجلسة غير موجودة',
      });
    }

    if (session.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Session is not active',
        errorAr: 'الجلسة غير نشطة',
      });
    }

    // Calculate total amount
    const checkInDate = new Date(session.checkInDate);
    const checkOutDate = new Date();
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dailyRate = session.dailyRate ? parseFloat(session.dailyRate.toString()) : 0;
    const totalAmount = days * dailyRate;

    const updatedSession = await prisma.boardingSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        checkOutDate,
        totalAmount,
        notes: checkOutNotes
          ? (session.notes ? `${session.notes}\n\nCheckout: ${checkOutNotes}` : `Checkout: ${checkOutNotes}`)
          : session.notes,
      },
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            species: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        config: {
          select: {
            nameEn: true,
            nameAr: true,
            type: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: {
        ...updatedSession,
        calculatedDays: days,
      },
      message: 'Pet checked out successfully',
      messageAr: 'تم خروج الحيوان بنجاح',
    });
  } catch (error: any) {
    console.error('Error checking out session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to checkout session',
      errorAr: 'فشل في خروج الجلسة',
    });
  }
};

// =====================================================
// Notification Endpoints
// =====================================================

/**
 * Get boarding notifications
 */
export const getBoardingNotifications = async (req: Request, res: Response) => {
  try {
    const { unreadOnly } = req.query;

    const where: any = {};
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.boardingNotification.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            pet: {
              select: {
                id: true,
                name: true,
                species: true,
                photoUrl: true,
              },
            },
            config: {
              select: {
                type: true,
                nameEn: true,
                nameAr: true,
              },
            },
            expectedCheckOutDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const unreadCount = await prisma.boardingNotification.count({
      where: { isRead: false },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error getting boarding notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      errorAr: 'فشل في جلب الإشعارات',
    });
  }
};

/**
 * Mark all boarding notifications as read
 */
export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    await prisma.boardingNotification.updateMany({
      where: { isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      messageAr: 'تم تحديد جميع الإشعارات كمقروءة',
    });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read',
      errorAr: 'فشل في تحديد الإشعارات كمقروءة',
    });
  }
};

/**
 * Generate notifications for sessions approaching checkout
 * This should be called by a scheduled job
 */
export const generateNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get active sessions
    const sessions = await prisma.boardingSession.findMany({
      where: {
        status: 'ACTIVE',
        expectedCheckOutDate: {
          not: null,
        },
      },
      include: {
        notifications: {
          where: {
            createdAt: {
              gte: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        },
      },
    });

    const notificationsToCreate: { sessionId: string; type: string }[] = [];

    sessions.forEach(session => {
      if (!session.expectedCheckOutDate) return;

      const daysRemaining = calculateDaysRemaining(session.expectedCheckOutDate);
      const existingTypes = session.notifications.map(n => n.type);

      // Create RED_ALERT for sessions with 1 day or less
      if (daysRemaining <= 1 && !existingTypes.includes('RED_ALERT')) {
        notificationsToCreate.push({
          sessionId: session.id,
          type: 'RED_ALERT',
        });
      }
      // Create YELLOW_WARNING for sessions with 3 days or less (but more than 1)
      else if (daysRemaining <= 3 && daysRemaining > 1 && !existingTypes.includes('YELLOW_WARNING')) {
        notificationsToCreate.push({
          sessionId: session.id,
          type: 'YELLOW_WARNING',
        });
      }
    });

    if (notificationsToCreate.length > 0) {
      await prisma.boardingNotification.createMany({
        data: notificationsToCreate,
      });
    }

    return {
      created: notificationsToCreate.length,
      sessions: sessions.length,
    };
  } catch (error) {
    console.error('Error generating boarding notifications:', error);
    throw error;
  }
};

// =====================================================
// Statistics Endpoints
// =====================================================

/**
 * Get boarding statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.boardingSlotConfig.findMany({
      where: {
        isActive: true,
      },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE',
          },
        },
      },
    });

    const stats = {
      boarding: {
        dog: { total: 0, occupied: 0, available: 0 },
        cat: { total: 0, occupied: 0, available: 0 },
      },
      icu: {
        dog: { total: 0, occupied: 0, available: 0 },
        cat: { total: 0, occupied: 0, available: 0 },
      },
    };

    configs.forEach(config => {
      const key = config.type.toLowerCase() as 'boarding' | 'icu';
      const speciesKey = config.species.toLowerCase() as 'dog' | 'cat';

      if (stats[key] && stats[key][speciesKey]) {
        stats[key][speciesKey].total = config.totalSlots;
        stats[key][speciesKey].occupied = config.sessions.length;
        stats[key][speciesKey].available = config.totalSlots - config.sessions.length;
      }
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting boarding stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get boarding statistics',
      errorAr: 'فشل في جلب إحصائيات الإقامة',
    });
  }
};
