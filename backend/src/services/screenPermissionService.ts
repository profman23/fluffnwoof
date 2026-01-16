import { permissionService } from './permissionService';

export enum PermissionLevel {
  NONE = 'none',
  READ = 'read',
  FULL = 'full',
}

export const screenPermissionService = {
  /**
   * Get user's permission level for a specific screen
   * Returns: 'none' | 'read' | 'full'
   */
  async getScreenPermission(userId: string, screenName: string): Promise<PermissionLevel> {
    const permissions = await permissionService.getUserPermissions(userId);

    // Check for FULL control first (highest priority)
    if (permissions.includes(`screens.${screenName}.full`)) {
      return PermissionLevel.FULL;
    }

    // Then check for READ only
    if (permissions.includes(`screens.${screenName}.read`)) {
      return PermissionLevel.READ;
    }

    // Default: no access
    return PermissionLevel.NONE;
  },

  /**
   * Check if user has at least read access to screen
   */
  async canAccessScreen(userId: string, screenName: string): Promise<boolean> {
    const level = await this.getScreenPermission(userId, screenName);
    return level !== PermissionLevel.NONE;
  },

  /**
   * Check if user has full control over screen
   */
  async canModifyScreen(userId: string, screenName: string): Promise<boolean> {
    const level = await this.getScreenPermission(userId, screenName);
    return level === PermissionLevel.FULL;
  },
};
