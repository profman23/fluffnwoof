import express from 'express';
import { authenticate, requirePermission } from '../middlewares/auth';
import { auditController } from '../controllers/auditController';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// All audit routes require audit.read permission
router.get('/', requirePermission('audit.read'), auditController.getAuditLogs);
router.get('/recent', requirePermission('audit.read'), auditController.getRecentActivity);
router.get('/statistics', requirePermission('audit.read'), auditController.getStatistics);
router.get(
  '/resource/:resource/:id',
  requirePermission('audit.read'),
  auditController.getResourceHistory
);
router.get('/user/:userId', requirePermission('audit.read'), auditController.getUserActivity);

export default router;
