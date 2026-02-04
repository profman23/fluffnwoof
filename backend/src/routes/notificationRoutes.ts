import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middlewares/auth';
import { sendBookingApprovedEmail, sendBookingRejectedEmail } from '../services/emailService';
import { AuthRequest } from '../types';

const router = express.Router();

/**
 * GET /api/notifications
 * Get staff notifications (customer bookings, cancellations)
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { unreadOnly, limit = '20' } = req.query;

    const whereClause: any = {};
    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await prisma.staffNotification.findMany({
      where: whereClause,
      include: {
        appointment: {
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
            vet: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    // Count unread
    const unreadCount = await prisma.staffNotification.count({
      where: { isRead: false },
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/notifications/count
 * Get unread notifications count
 */
router.get('/count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.staffNotification.count({
      where: { isRead: false },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.staffNotification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.staffNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:id/approve
 * Approve a customer booking request
 */
router.put('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req as AuthRequest).user!.id;

    // Find notification with appointment details
    const notification = await prisma.staffNotification.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود',
      });
    }

    if (notification.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'تم اتخاذ إجراء على هذا الطلب بالفعل',
      });
    }

    // Update notification and appointment in transaction
    await prisma.$transaction([
      // Update notification
      prisma.staffNotification.update({
        where: { id },
        data: {
          status: 'APPROVED',
          actionBy: userId,
          actionAt: new Date(),
          isRead: true,
        },
      }),
      // Update appointment
      prisma.appointment.update({
        where: { id: notification.appointmentId },
        data: {
          status: 'CONFIRMED',
          isConfirmed: true,
        },
      }),
    ]);

    // Send approval email to customer
    const { appointment } = notification;
    if (appointment.pet.owner.email) {
      await sendBookingApprovedEmail({
        to: appointment.pet.owner.email,
        recipientName: `${appointment.pet.owner.firstName} ${appointment.pet.owner.lastName}`,
        petName: appointment.pet.name,
        appointmentDate: appointment.appointmentDate.toLocaleDateString('ar-EG'),
        appointmentTime: appointment.appointmentTime,
      });
    }

    res.json({
      success: true,
      message: 'تم قبول الحجز بنجاح',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/notifications/:id/reject
 * Reject a customer booking request
 */
router.put('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as AuthRequest).user!.id;

    // Find notification with appointment details
    const notification = await prisma.staffNotification.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            pet: {
              include: {
                owner: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود',
      });
    }

    if (notification.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'تم اتخاذ إجراء على هذا الطلب بالفعل',
      });
    }

    // Update notification and appointment in transaction
    await prisma.$transaction([
      // Update notification
      prisma.staffNotification.update({
        where: { id },
        data: {
          status: 'REJECTED',
          actionBy: userId,
          actionAt: new Date(),
          rejectReason: reason || null,
          isRead: true,
        },
      }),
      // Update appointment
      prisma.appointment.update({
        where: { id: notification.appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledBy: 'STAFF',
          cancelledAt: new Date(),
        },
      }),
    ]);

    // Send rejection email to customer
    const { appointment } = notification;
    if (appointment.pet.owner.email) {
      await sendBookingRejectedEmail({
        to: appointment.pet.owner.email,
        recipientName: `${appointment.pet.owner.firstName} ${appointment.pet.owner.lastName}`,
        petName: appointment.pet.name,
        appointmentDate: appointment.appointmentDate.toLocaleDateString('ar-EG'),
        appointmentTime: appointment.appointmentTime,
        rejectReason: reason,
      });
    }

    res.json({
      success: true,
      message: 'تم رفض الحجز',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
