import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenPermissionGuard } from '../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { usersApi } from '../api/users';
import { User, Role } from '../types';
import { AddUserModal } from '../components/users/AddUserModal';
import { EditUserModal } from '../components/users/EditUserModal';
import { ChangePasswordModal } from '../components/users/ChangePasswordModal';

export const UserManagement: React.FC = () => {
  const { t, i18n } = useTranslation('users');
  const { canModify, isReadOnly } = useScreenPermission('userManagement');
  const isRtl = i18n.language === 'ar';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersApi.getAll(page, 20, search || undefined);
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(t('messages.error'));
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeactivate = async (userId: string) => {
    if (!window.confirm(t('confirmDeactivate'))) return;

    try {
      await usersApi.deactivate(userId);
      setSuccessMessage(t('messages.userDeactivated'));
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(t('messages.error'));
    }
  };

  const handleReactivate = async (userId: string) => {
    if (!window.confirm(t('confirmReactivate'))) return;

    try {
      await usersApi.reactivate(userId);
      setSuccessMessage(t('messages.userReactivated'));
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(t('messages.error'));
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleEditSuccess = () => {
    setSuccessMessage(t('messages.userUpdated'));
    loadUsers();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePasswordSuccess = () => {
    setSuccessMessage(t('messages.passwordChanged'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getRoleDisplayName = (role: Role | undefined): string => {
    if (!role) return '-';
    return isRtl ? (role.displayNameAr || role.name) : (role.displayNameEn || role.name);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScreenPermissionGuard screenName="userManagement">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('title')}</h1>
            {isReadOnly && (
              <span className="inline-block mt-2 px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
                {t('readOnly')}
              </span>
            )}
          </div>
          {canModify && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              + {t('addUser')}
            </Button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <Card>
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">{t('loading')}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">{t('noUsers')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('firstName')} / {t('lastName')}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('email')}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('role')}
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('status')}
                      </th>
                      <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('createdAt')}
                      </th>
                      {canModify && (
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500" dir="ltr">
                              {user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" dir="ltr">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getRoleDisplayName(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isActive ? t('active') : t('inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        {canModify && (
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {t('edit')}
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleChangePassword(user)}
                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                              >
                                {t('changePassword')}
                              </button>
                              <span className="text-gray-300">|</span>
                              {user.isActive ? (
                                <button
                                  onClick={() => handleDeactivate(user.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  {t('deactivate')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(user.id)}
                                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                  {t('reactivate')}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRtl ? '→' : '←'}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRtl ? '←' : '→'}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={loadUsers}
        />

        {/* Edit User Modal */}
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditSuccess}
          user={selectedUser}
        />

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={handlePasswordSuccess}
          user={selectedUser}
        />
      </div>
    </ScreenPermissionGuard>
  );
};
