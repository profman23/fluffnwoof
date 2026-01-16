import { Permission } from '@prisma/client';
import prisma from '../lib/prisma';

export const permissionService = {
  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permissionName);
  },

  /**
   * Get all permissions for a user (role-based + custom)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    // 1. Get user and their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) {
      return [];
    }

    // 2. Get role-based permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: user.roleId },
      include: { permission: true },
    });

    const rolePermissionNames = rolePermissions.map((rp) => rp.permission.name);

    // 3. Get custom user permissions
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const userPermissionNames = userPermissions.map((up) => up.permission.name);

    // 4. Merge and deduplicate
    const allPermissions = [...new Set([...rolePermissionNames, ...userPermissionNames])];

    return allPermissions;
  },

  /**
   * Grant custom permission to user
   */
  async grantPermission(
    userId: string,
    permissionName: string,
    grantedBy: string
  ): Promise<void> {
    // Find permission by name
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }

    // Check if user already has this permission
    const existing = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      throw new Error(`User already has permission '${permissionName}'`);
    }

    // Grant permission
    await prisma.userPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        grantedBy,
      },
    });
  },

  /**
   * Revoke custom permission from user
   */
  async revokePermission(userId: string, permissionName: string): Promise<void> {
    // Find permission by name
    const permission = await prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }

    // Delete user permission
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: permission.id,
      },
    });
  },

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { action: 'asc' }],
    });
  },

  /**
   * Get permissions by roleId
   */
  async getRolePermissions(roleId: string): Promise<string[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => rp.permission.name);
  },

  /**
   * Get custom permissions for a user (excluding role-based permissions)
   */
  async getCustomUserPermissions(userId: string): Promise<Permission[]> {
    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    return userPermissions.map((up) => up.permission);
  },

  /**
   * Get permissions grouped by category
   */
  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions();

    const grouped: Record<string, Permission[]> = {};

    for (const perm of permissions) {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    }

    return grouped;
  },
};
