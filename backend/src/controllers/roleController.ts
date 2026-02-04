import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../lib/prisma';
import { permissionService } from '../services/permissionService';
import { auditService } from '../services/auditService';

// Helper function to group permissions by screen
function groupPermissionsByScreen(permissions: string[]): Record<string, string> {
  const screenPermissions: Record<string, string> = {};

  for (const perm of permissions) {
    // Format: screens.{screenName}.{level}
    const match = perm.match(/^screens\.([^.]+)\.(\w+)$/);
    if (match) {
      const [, screenName, level] = match;
      screenPermissions[screenName] = level; // 'read' or 'full'
    }
  }

  return screenPermissions;
}

// Helper function to extract special permissions
function extractSpecialPermissions(permissions: string[]): Record<string, boolean> {
  const special: Record<string, boolean> = {};

  for (const perm of permissions) {
    // Format: {category}.{action} e.g., patients.hidePhone
    if (!perm.startsWith('screens.')) {
      special[perm] = true;
    }
  }

  return special;
}

export const roleController = {
  /**
   * Get all available roles
   */
  async getAllRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Return roles from database
      const roles = await prisma.role.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          displayNameEn: true,
          displayNameAr: true,
          description: true,
          isSystem: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;

      // Validate role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'دور غير صالح',
        });
      }

      const permissions = await permissionService.getRolePermissions(roleId);

      // Group permissions by screen
      const screenPermissions = groupPermissionsByScreen(permissions);

      // Extract special permissions
      const specialPermissions = extractSpecialPermissions(permissions);

      res.json({
        success: true,
        data: {
          role,
          screens: screenPermissions,
          special: specialPermissions,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update permissions for a specific role
   */
  async updateRolePermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roleId } = req.params;
      const { screenPermissions, specialPermissions } = req.body;

      console.log('[RoleController] updateRolePermissions called');
      console.log('[RoleController] roleId:', roleId);
      console.log('[RoleController] screenPermissions:', JSON.stringify(screenPermissions, null, 2));

      // Validate role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'دور غير صالح',
        });
      }

      // Example screenPermissions:
      // {
      //   "userManagement": "full",
      //   "owners": "read",
      //   "pets": "none",
      //   ...
      // }

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Delete existing role permissions
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        // Create new screen permissions
        for (const [screen, level] of Object.entries(screenPermissions)) {
          if (level === 'none') continue; // Skip 'none' - no permission needed

          const permissionName = `screens.${screen}.${level}`;

          let permission = await tx.permission.findUnique({
            where: { name: permissionName },
          });

          // Create the permission if it doesn't exist (for new screens)
          if (!permission) {
            permission = await tx.permission.create({
              data: {
                name: permissionName,
                description: `${screen} - ${level === 'read' ? 'Read Only' : 'Full Control'}`,
                category: 'screens',
                action: level as string,
              },
            });
          }

          await tx.rolePermission.create({
            data: {
              roleId,
              permissionId: permission.id,
            },
          });
        }

        // Create new special permissions
        if (specialPermissions) {
          for (const [permKey, enabled] of Object.entries(specialPermissions)) {
            if (!enabled) continue; // Skip disabled permissions

            // Find or create the special permission
            let permission = await tx.permission.findUnique({
              where: { name: permKey },
            });

            if (!permission) {
              // Create the permission if it doesn't exist
              const parts = permKey.split('.');
              permission = await tx.permission.create({
                data: {
                  name: permKey,
                  description: `Special permission: ${permKey}`,
                  category: parts[0],
                  action: parts[1] || 'custom',
                },
              });
            }

            await tx.rolePermission.create({
              data: {
                roleId,
                permissionId: permission.id,
              },
            });
          }
        }
      });

      // Log the change
      await auditService.log({
        userId: req.user!.id,
        action: 'UPDATE',
        resource: 'RolePermissions',
        resourceId: roleId,
        details: { screenPermissions, specialPermissions },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      console.log('[RoleController] Permissions saved successfully for role:', roleId);

      res.json({
        success: true,
        message: 'تم تحديث صلاحيات الدور بنجاح',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new role
   */
  async createRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, displayNameAr, displayNameEn, description } = req.body;

      // Validate required fields
      if (!name || !displayNameAr || !displayNameEn) {
        return res.status(400).json({
          success: false,
          message: 'الاسم والاسم العربي والاسم الإنجليزي مطلوبون',
        });
      }

      // Validate name format (English letters, numbers, underscores only)
      if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
        return res.status(400).json({
          success: false,
          message: 'اسم الدور يجب أن يكون بالإنجليزية الكبيرة بدون مسافات (مثال: CUSTOM_ROLE)',
        });
      }

      // Check if role name already exists
      const existingRole = await prisma.role.findUnique({
        where: { name },
      });

      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'اسم الدور موجود مسبقاً',
        });
      }

      // Create the role
      let role;
      try {
        role = await prisma.role.create({
          data: {
            name,
            displayNameAr,
            displayNameEn,
            description: description || null,
            isSystem: false,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            displayNameAr: true,
            displayNameEn: true,
            description: true,
            isSystem: true,
          },
        });
      } catch (error: any) {
        // Handle unique constraint violation (race condition)
        if (error.code === 'P2002') {
          return res.status(409).json({
            success: false,
            message: 'اسم الدور موجود مسبقاً',
          });
        }
        throw error;
      }

      // Log the change
      await auditService.log({
        userId: req.user!.id,
        action: 'CREATE',
        resource: 'Role',
        resourceId: role.id,
        details: { name, displayNameAr, displayNameEn },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الدور بنجاح',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  },
};
