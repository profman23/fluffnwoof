import express from 'express';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';
import { userController } from '../controllers/userController';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply audit logging
router.use(auditMiddleware('User'));

// Read operations - requireScreenAccess allows both 'read' and 'full' levels
router.get('/', requireScreenAccess('userManagement'), userController.findAll);
router.get('/statistics', requireScreenAccess('userManagement'), userController.getStatistics);
router.get('/permissions/all', requireScreenAccess('userManagement'), userController.getAllPermissions);
router.get('/permissions/by-category', requireScreenAccess('userManagement'), userController.getPermissionsByCategory);
router.get('/:id', requireScreenAccess('userManagement'), userController.findById);
router.get('/:id/permissions', requireScreenAccess('userManagement'), userController.getUserPermissions);

// Write operations - requireScreenModify requires 'full' level only
router.post('/', requireScreenModify('userManagement'), userController.create);
router.put('/:id', requireScreenModify('userManagement'), userController.update);
router.patch('/:id/deactivate', requireScreenModify('userManagement'), userController.deactivate);
router.patch('/:id/reactivate', requireScreenModify('userManagement'), userController.reactivate);
router.patch('/:id/password', requireScreenModify('userManagement'), userController.changePassword);
router.post('/:id/permissions', requireScreenModify('userManagement'), userController.grantPermission);
router.delete('/:id/permissions/:permissionName', requireScreenModify('userManagement'), userController.revokePermission);

export default router;
