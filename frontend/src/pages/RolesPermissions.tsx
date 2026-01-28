import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { rolesApi, ScreenPermissions } from '../api/roles';
import { ScreenPermissionGuard } from '../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LogoLoader } from '../components/common/LogoLoader';
import { Role } from '../types';
import { AddRoleModal } from '../components/roles/AddRoleModal';

interface ScreenItem {
  name: string;
  children?: string[];
}

const SCREEN_GROUPS: ScreenItem[] = [
  { name: 'patients' },
  { name: 'flowBoard' },
  { name: 'medical' },
  { name: 'userManagement' },
  { name: 'rolesPermissions' },
  { name: 'serviceProducts' },
  { name: 'reports' },
  { name: 'crm', children: ['sms', 'reminders'] },
  { name: 'clinicSetup', children: ['shiftsManagement', 'visitTypes'] },
];

// Flatten for API calls
const ALL_SCREEN_NAMES = SCREEN_GROUPS.flatMap(group =>
  group.children ? [group.name, ...group.children] : [group.name]
);

const SPECIAL_PERMISSIONS = [
  { key: 'patients.hidePhone', screen: 'patients', label: 'hidePhone' },
];

export const RolesPermissions: React.FC = () => {
  const { t, i18n } = useTranslation('roles');
  const { canModify, isReadOnly } = useScreenPermission('rolesPermissions');

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<ScreenPermissions>({});
  const [specialPermissions, setSpecialPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['crm', 'clinicSetup']));

  const isRtl = i18n.language === 'ar';

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (selectedRole?.id) {
      loadRolePermissions(selectedRole.id);
    }
  }, [selectedRole?.id]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesApi.getAllRoles();
      setRoles(data);
      if (data.length > 0) {
        setSelectedRole(data[0]);
      }
    } catch (err: any) {
      setError(t('messages.error'));
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      setLoading(true);
      const data = await rolesApi.getRolePermissions(roleId);

      // Initialize all screens with 'none' if not present
      const completePermissions: ScreenPermissions = {};
      ALL_SCREEN_NAMES.forEach((screen: string) => {
        completePermissions[screen] = data.screens[screen] || 'none';
      });

      setPermissions(completePermissions);

      // Load special permissions
      const specialPerms: Record<string, boolean> = {};
      SPECIAL_PERMISSIONS.forEach((perm) => {
        specialPerms[perm.key] = data.special?.[perm.key] || false;
      });
      setSpecialPermissions(specialPerms);

      setError(null);
    } catch (err: any) {
      setError(t('messages.error'));
      console.error('Error loading role permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: Role): string => {
    return isRtl ? (role.displayNameAr || role.name) : (role.displayNameEn || role.name);
  };

  const handlePermissionChange = (screen: string, level: 'none' | 'read' | 'full') => {
    setPermissions((prev) => ({
      ...prev,
      [screen]: level,
    }));
    setSuccess(false);
  };

  const handleSpecialPermissionChange = (key: string, value: boolean) => {
    setSpecialPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!canModify || !selectedRole?.id) return;

    try {
      setSaving(true);
      setError(null);
      await rolesApi.updateRolePermissions(selectedRole.id, permissions, specialPermissions);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(t('messages.error'));
      console.error('Error saving permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (selectedRole?.id) {
      loadRolePermissions(selectedRole.id);
      setSuccess(false);
      setError(null);
    }
  };

  const handleRoleCreated = () => {
    loadRoles();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  if (loading && roles.length === 0) {
    return (
      <ScreenPermissionGuard screenName="rolesPermissions">
        <LogoLoader />
      </ScreenPermissionGuard>
    );
  }

  return (
    <ScreenPermissionGuard screenName="rolesPermissions">
      <div className="container mx-auto p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-7 h-7 text-brand-dark" />
              <h1 className="text-2xl font-bold text-brand-dark">{t('title')}</h1>
            </div>
            {isReadOnly && (
              <span className="inline-block mt-2 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                {t('readOnly')}
              </span>
            )}
          </div>
          {canModify && (
            <Button onClick={() => setIsAddRoleModalOpen(true)}>
              + {t('addRole')}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {t('messages.success')}
          </div>
        )}

        <Card>
          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('selectRole')}
            </label>
            <div className="flex flex-wrap gap-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRole?.id === role.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getRoleDisplayName(role)}
                </button>
              ))}
            </div>
          </div>

          {selectedRole && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  {t('currentlyEditing')}: {getRoleDisplayName(selectedRole)}
                </h2>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('screenName')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('noAuth')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('readOnly')}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('fullControl')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {SCREEN_GROUPS.map((group) => {
                      const hasChildren = group.children && group.children.length > 0;
                      const isExpanded = expandedGroups.has(group.name);
                      const parentLevel = permissions[group.name] || 'none';
                      const ChevronIcon = isExpanded ? ChevronDownIcon : (isRtl ? ChevronLeftIcon : ChevronRightIcon);

                      return (
                        <React.Fragment key={group.name}>
                          {/* Parent Row */}
                          <tr className={`hover:bg-gray-50 ${hasChildren ? 'bg-gray-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                {hasChildren ? (
                                  <button
                                    onClick={() => toggleGroup(group.name)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  >
                                    <ChevronIcon className="w-4 h-4 text-gray-500" />
                                  </button>
                                ) : (
                                  <span className="w-6" />
                                )}
                                <span className={hasChildren ? 'font-semibold' : ''}>
                                  {t(`screens.${group.name}`)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <input
                                type="radio"
                                name={`permission-${group.name}`}
                                checked={parentLevel === 'none'}
                                onChange={() => handlePermissionChange(group.name, 'none')}
                                disabled={!canModify}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <input
                                type="radio"
                                name={`permission-${group.name}`}
                                checked={parentLevel === 'read'}
                                onChange={() => handlePermissionChange(group.name, 'read')}
                                disabled={!canModify}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <input
                                type="radio"
                                name={`permission-${group.name}`}
                                checked={parentLevel === 'full'}
                                onChange={() => handlePermissionChange(group.name, 'full')}
                                disabled={!canModify}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                          </tr>

                          {/* Children Rows */}
                          {hasChildren && isExpanded && group.children!.map((child) => {
                            const childLevel = permissions[child] || 'none';
                            return (
                              <tr key={child} className="hover:bg-gray-50 bg-white">
                                <td className={`px-6 py-3 whitespace-nowrap text-sm text-gray-700 ${isRtl ? 'pr-14' : 'pl-14'}`}>
                                  {t(`screens.${child}`)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-center">
                                  <input
                                    type="radio"
                                    name={`permission-${child}`}
                                    checked={childLevel === 'none'}
                                    onChange={() => handlePermissionChange(child, 'none')}
                                    disabled={!canModify}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-center">
                                  <input
                                    type="radio"
                                    name={`permission-${child}`}
                                    checked={childLevel === 'read'}
                                    onChange={() => handlePermissionChange(child, 'read')}
                                    disabled={!canModify}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-center">
                                  <input
                                    type="radio"
                                    name={`permission-${child}`}
                                    checked={childLevel === 'full'}
                                    onChange={() => handlePermissionChange(child, 'full')}
                                    disabled={!canModify}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Special Permissions Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">
                  {t('specialPermissions.title')}
                </h3>
                <div className="space-y-4">
                  {SPECIAL_PERMISSIONS.map((perm) => (
                    <div key={perm.key} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`special-${perm.key}`}
                        checked={specialPermissions[perm.key] || false}
                        onChange={(e) => handleSpecialPermissionChange(perm.key, e.target.checked)}
                        disabled={!canModify}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label
                        htmlFor={`special-${perm.key}`}
                        className="text-sm font-medium text-gray-700"
                      >
                        {t(`specialPermissions.${perm.label}`)} ({t(`screens.${perm.screen}`)})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {canModify && (
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? t('messages.saving') : t('saveChanges')}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Add Role Modal */}
        <AddRoleModal
          isOpen={isAddRoleModalOpen}
          onClose={() => setIsAddRoleModalOpen(false)}
          onSuccess={handleRoleCreated}
        />
      </div>
    </ScreenPermissionGuard>
  );
};
