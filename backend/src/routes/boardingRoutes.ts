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
  requirePermission('screens.boardingAndIcu.read'),
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

export default router;
