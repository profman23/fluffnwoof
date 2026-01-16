import express from 'express';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';
import { roleController } from '../controllers/roleController';

const router = express.Router();

router.use(authenticate);

// Get all roles with their permissions
router.get('/', requireScreenAccess('rolesPermissions'), roleController.getAllRoles);

// Get specific role permissions by roleId
router.get('/:roleId/permissions', requireScreenAccess('rolesPermissions'), roleController.getRolePermissions);

// Update role permissions by roleId
router.put('/:roleId/permissions', requireScreenModify('rolesPermissions'), roleController.updateRolePermissions);

// Create new role (future feature)
router.post('/', requireScreenModify('rolesPermissions'), roleController.createRole);

export default router;
