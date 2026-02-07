/**
 * Boarding & ICU Routes
 * API endpoints for boarding slot configuration and session management
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/auth';
import * as boardingController from '../controllers/boardingController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// SLOT CONFIGURATION - إعدادات الأماكن
// =====================================================

/**
 * GET /api/boarding/config
 * Get all boarding slot configurations
 * Query params: type (BOARDING|ICU), species (DOG|CAT), isActive (true|false)
 */
router.get(
  '/config',
  requirePermission('screens.boardingAndIcu.read', 'screens.boardingManagement.read'),
  boardingController.getConfigs
);

/**
 * GET /api/boarding/config/stats
 * Get boarding statistics (total, occupied, available)
 */
router.get(
  '/config/stats',
  requirePermission('screens.boardingAndIcu.read'),
  boardingController.getStats
);

/**
 * GET /api/boarding/config/:id
 * Get single configuration by ID with active sessions
 */
router.get(
  '/config/:id',
  requirePermission('screens.boardingAndIcu.read'),
  boardingController.getConfigById
);

/**
 * POST /api/boarding/config
 * Create new boarding slot configuration
 * Body: { type, species, totalSlots, pricePerDay?, notes? }
 */
router.post(
  '/config',
  requirePermission('screens.boardingAndIcu.full'),
  boardingController.createConfig
);

/**
 * PUT /api/boarding/config/:id
 * Update boarding slot configuration
 * Body: { totalSlots?, pricePerDay?, notes?, isActive? }
 */
router.put(
  '/config/:id',
  requirePermission('screens.boardingAndIcu.full'),
  boardingController.updateConfig
);

/**
 * DELETE /api/boarding/config/:id
 * Delete boarding slot configuration (only if no active sessions)
 */
router.delete(
  '/config/:id',
  requirePermission('screens.boardingAndIcu.full'),
  boardingController.deleteConfig
);

// =====================================================
// SESSION MANAGEMENT - إدارة الجلسات
// Uses boardingManagement permission (daily operations)
// =====================================================

/**
 * GET /api/boarding/sessions/kanban
 * Get sessions organized by Kanban columns (green/yellow/red)
 * Query params: type (BOARDING|ICU), configId
 */
router.get(
  '/sessions/kanban',
  requirePermission('screens.boardingManagement.read'),
  boardingController.getKanbanSessions
);

/**
 * GET /api/boarding/sessions
 * Get all sessions (active by default)
 * Query params: type (BOARDING|ICU), configId, status (ACTIVE|COMPLETED|CANCELLED)
 */
router.get(
  '/sessions',
  requirePermission('screens.boardingManagement.read'),
  boardingController.getSessions
);

/**
 * GET /api/boarding/sessions/:id
 * Get single session by ID
 */
router.get(
  '/sessions/:id',
  requirePermission('screens.boardingManagement.read'),
  boardingController.getSessionById
);

/**
 * POST /api/boarding/sessions
 * Create new boarding session
 * Body: { configId, petId, checkInDate, expectedCheckOutDate, notes?, assignedVetId? }
 */
router.post(
  '/sessions',
  requirePermission('screens.boardingManagement.full'),
  boardingController.createSession
);

/**
 * PUT /api/boarding/sessions/:id
 * Update boarding session (extend stay, add notes)
 * Body: { expectedCheckOutDate?, notes?, assignedVetId? }
 */
router.put(
  '/sessions/:id',
  requirePermission('screens.boardingManagement.full'),
  boardingController.updateSession
);

/**
 * POST /api/boarding/sessions/:id/checkout
 * Checkout (complete) a boarding session
 * Body: { checkOutNotes? }
 */
router.post(
  '/sessions/:id/checkout',
  requirePermission('screens.boardingManagement.full'),
  boardingController.checkoutSession
);

// =====================================================
// NOTIFICATIONS - الإشعارات
// Uses boardingManagement permission (daily operations)
// =====================================================

/**
 * GET /api/boarding/notifications
 * Get boarding notifications
 * Query params: unreadOnly (true|false)
 */
router.get(
  '/notifications',
  requirePermission('screens.boardingManagement.read'),
  boardingController.getBoardingNotifications
);

/**
 * PUT /api/boarding/notifications/read-all
 * Mark all boarding notifications as read
 */
router.put(
  '/notifications/read-all',
  requirePermission('screens.boardingManagement.read'),
  boardingController.markAllNotificationsRead
);

export default router;
