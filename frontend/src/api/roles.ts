import api from './client';
import { Role } from '../types';

export interface ScreenPermissions {
  [screenName: string]: 'none' | 'read' | 'full';
}

export interface SpecialPermissions {
  [key: string]: boolean;
}

export interface RolePermissionsData {
  role: Role;
  screens: ScreenPermissions;
  special?: SpecialPermissions;
}

export interface CreateRoleInput {
  name: string;
  displayNameAr: string;
  displayNameEn: string;
  description?: string;
}

export const rolesApi = {
  /**
   * Get all available roles
   */
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data.data;
  },

  /**
   * Get permissions for a specific role by ID
   */
  getRolePermissions: async (roleId: string): Promise<RolePermissionsData> => {
    const response = await api.get(`/roles/${roleId}/permissions`);
    return response.data.data;
  },

  /**
   * Update permissions for a specific role by ID
   */
  updateRolePermissions: async (
    roleId: string,
    screenPermissions: ScreenPermissions,
    specialPermissions?: SpecialPermissions
  ): Promise<void> => {
    await api.put(`/roles/${roleId}/permissions`, { screenPermissions, specialPermissions });
  },

  /**
   * Create a new role
   */
  createRole: async (data: CreateRoleInput): Promise<Role> => {
    const response = await api.post('/roles', data);
    return response.data.data;
  },
};
