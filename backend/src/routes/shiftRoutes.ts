import { Router } from 'express';
import { shiftController } from '../controllers/shiftController';
import { authenticate, requirePermission } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all vets with their schedules (for dropdown/selection)
router.get(
  '/vets',
  requirePermission('screens.shiftsManagement.read'),
  shiftController.getAllVetsWithSchedules
);

// ==================== SCHEDULES ====================

// Get schedules for a vet
router.get(
  '/schedules/:vetId',
  requirePermission('screens.shiftsManagement.read'),
  shiftController.getSchedules
);

// Bulk update schedules for a vet
router.put(
  '/schedules/:vetId/bulk',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.updateSchedulesBulk
);

// ==================== DAYS OFF ====================

// Get days off for a vet
router.get(
  '/days-off/:vetId',
  requirePermission('screens.shiftsManagement.read'),
  shiftController.getDaysOff
);

// Add a day off
router.post(
  '/days-off/:vetId',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.addDayOff
);

// Remove a day off
router.delete(
  '/days-off/:id',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.removeDayOff
);

// ==================== BREAKS ====================

// Get breaks for a vet
router.get(
  '/breaks/:vetId',
  requirePermission('screens.shiftsManagement.read'),
  shiftController.getBreaks
);

// Add a break
router.post(
  '/breaks/:vetId',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.addBreak
);

// Update a break
router.put(
  '/breaks/:id',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.updateBreak
);

// Remove a break
router.delete(
  '/breaks/:id',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.removeBreak
);

// ==================== SCHEDULE PERIODS (New System) ====================

// Get all vets with their schedule periods
router.get(
  '/periods/vets',
  requirePermission('screens.shiftsManagement.read'),
  shiftController.getAllVetsWithSchedulePeriods
);

// Get schedule periods for a vet
router.get(
  '/periods/:vetId',
  requirePermission('screens.shiftsManagement.read'),
  shiftController.getSchedulePeriods
);

// Create a new schedule period
router.post(
  '/periods/:vetId',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.createSchedulePeriod
);

// Update a schedule period
router.put(
  '/periods/:id',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.updateSchedulePeriod
);

// Delete a schedule period
router.delete(
  '/periods/:id',
  requirePermission('screens.shiftsManagement.full'),
  shiftController.deleteSchedulePeriod
);

// ==================== AVAILABILITY ====================

// Get available slots for a vet on a date (used by appointment booking)
// This uses read permission since it's needed for booking
router.get(
  '/availability/:vetId',
  requirePermission('screens.appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'),
  shiftController.getAvailability
);

// Get availability using the new period-based system
router.get(
  '/availability-v2/:vetId',
  requirePermission('screens.appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'),
  shiftController.getAvailabilityWithPeriod
);

export default router;
