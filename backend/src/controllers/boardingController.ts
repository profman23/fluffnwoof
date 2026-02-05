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
    const { type, species, totalSlots, pricePerDay, notes } = req.body;

    // Validate required fields
    if (!type || !species || totalSlots === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Type, species, and totalSlots are required',
        errorAr: 'النوع والفصيلة وعدد الأماكن مطلوبة',
      });
    }

    // Check if config already exists for this type+species combination
    const existing = await prisma.boardingSlotConfig.findUnique({
      where: {
        type_species: {
          type: type as BoardingType,
          species: species as Species,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Configuration already exists for this type and species',
        errorAr: 'الإعدادات موجودة بالفعل لهذا النوع والفصيلة',
      });
    }

    const config = await prisma.boardingSlotConfig.create({
      data: {
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
    res.status(500).json({
      success: false,
      error: 'Failed to create boarding configuration',
      errorAr: 'فشل في إنشاء إعدادات الإقامة',
    });
  }
};

/**
 * Update boarding slot configuration
 */
export const updateConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { totalSlots, pricePerDay, notes, isActive } = req.body;

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
