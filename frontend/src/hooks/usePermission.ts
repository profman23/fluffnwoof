import { useAuthStore } from '../store/authStore';

export const usePermission = () => {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can: hasPermission, // Alias
    canAny: hasAnyPermission, // Alias
    canAll: hasAllPermissions, // Alias
  };
};
