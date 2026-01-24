import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UsersIcon } from '@heroicons/react/24/outline';
import { ScreenPermissionGuard } from '../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DataTable, Column } from '../components/common/DataTable';
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

  // Define columns for DataTable
  const columns: Column<User>[] = [
    {
      id: 'name',
      header: `${t('firstName')} / ${t('lastName')}`,
      render: (user) => (
        <div>
          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
            {user.firstName} {user.lastName}
          </div>
          {user.phone && (
            <div className="text-sm text-gray-500" dir="ltr">
              {user.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'email',
      header: t('email'),
      render: (user) => (
        <span className="text-sm text-gray-600 whitespace-nowrap" dir="ltr">
          {user.email}
        </span>
      ),
    },
    {
      id: 'role',
      header: t('role'),
      render: (user) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {getRoleDisplayName(user.role)}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('status'),
      render: (user) => (
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
            user.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? t('active') : t('inactive')}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: t('createdAt'),
      render: (user) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
  ];

  // Render actions
  const renderActions = (user: User) => (
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
  );

  return (
    <ScreenPermissionGuard screenName="userManagement">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <UsersIcon className="w-7 h-7 text-brand-dark" />
              <h1 className="text-2xl font-bold text-brand-dark">{t('title')}</h1>
            </div>
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
            <Input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80"
            />
          </div>

          {/* DataTable */}
          <DataTable<User>
            tableId="users"
            columns={columns}
            data={users}
            loading={loading}
            emptyIcon="👤"
            emptyMessage={t('noUsers')}
            rowKey="id"
            renderActions={canModify ? renderActions : undefined}
            actionsHeader={t('actions')}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
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
