import { Router } from 'express';
import { visitTypeController } from '../controllers/visitTypeController';
import { authenticate, requirePermission } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all visit types (read permission - needed for appointments)
router.get(
  '/',
  requirePermission('screens.visitTypes.read'),
  visitTypeController.getAll
);

// Get visit type by ID
router.get(
  '/:id',
  requirePermission('screens.visitTypes.read'),
  visitTypeController.getById
);

// Create a new visit type
router.post(
  '/',
  requirePermission('screens.visitTypes.full'),
  visitTypeController.create
);

// Reorder visit types
router.post(
  '/reorder',
  requirePermission('screens.visitTypes.full'),
  visitTypeController.reorder
);

// Seed default visit types
router.post(
  '/seed',
  requirePermission('screens.visitTypes.full'),
  visitTypeController.seedDefaults
);

// Update a visit type
router.put(
  '/:id',
  requirePermission('screens.visitTypes.full'),
  visitTypeController.update
);

// Toggle active status
router.patch(
  '/:id/toggle-active',
  requirePermission('screens.visitTypes.full'),
  visitTypeController.toggleActive
);

// Delete a visit type
router.delete(
  '/:id',
  requirePermission('screens.visitTypes.full'),
  visitTypeController.delete
);

export default router;
