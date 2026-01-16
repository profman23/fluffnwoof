import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  setAuth: (user: User, token: string) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
  initializeAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  permissions: [],

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  setPermissions: (permissions) => {
    localStorage.setItem('permissions', JSON.stringify(permissions));
    set({ permissions });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
    set({ user: null, token: null, isAuthenticated: false, permissions: [] });
  },

  initializeAuth: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const permissions = localStorage.getItem('permissions');

    if (user && token) {
      set({
        user: JSON.parse(user),
        token,
        isAuthenticated: true,
        permissions: permissions ? JSON.parse(permissions) : [],
      });
    }
  },

  hasPermission: (permission) => {
    return get().permissions.includes(permission);
  },

  hasAnyPermission: (...permissions) => {
    const userPerms = get().permissions;
    return permissions.some((p) => userPerms.includes(p));
  },

  hasAllPermissions: (...permissions) => {
    const userPerms = get().permissions;
    return permissions.every((p) => userPerms.includes(p));
  },
}));
