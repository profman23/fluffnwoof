import { useAuthStore } from '../store/authStore';

export type PermissionLevel = 'none' | 'read' | 'full';

// Hook for checking phone visibility permission
export const usePhonePermission = () => {
  const { permissions } = useAuthStore();
  const canViewPhone = !permissions.includes('patients.hidePhone');
  return { canViewPhone };
};

// Utility function to mask phone number
export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return '-';
  // Keep last 4 digits visible, mask the rest
  const visiblePart = phone.slice(-4);
  const maskedPart = phone.slice(0, -4).replace(/./g, '*');
  return maskedPart + visiblePart;
};

export const useScreenPermission = (screenName: string) => {
  const { permissions } = useAuthStore();

  const getPermissionLevel = (): PermissionLevel => {
    // Check for FULL control first (highest priority)
    if (permissions.includes(`screens.${screenName}.full`)) {
      return 'full';
    }

    // Then check for READ only
    if (permissions.includes(`screens.${screenName}.read`)) {
      return 'read';
    }

    // Default: no access
    return 'none';
  };

  const level = getPermissionLevel();

  return {
    level,
    canAccess: level !== 'none',
    canRead: level === 'read' || level === 'full',
    canModify: level === 'full',
    isReadOnly: level === 'read',
    isFullControl: level === 'full',
    hasNoAccess: level === 'none',
  };
};
