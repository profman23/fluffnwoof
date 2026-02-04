import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, DEFAULT_THEME_COLORS, DEFAULT_FLOWBOARD_COLORS } from '../store/themeStore';
import { profileApi } from '../api/profile';
import { uploadApi } from '../api/upload';
import { ColorPicker } from '../components/common/ColorPicker';
import { ImageUpload } from '../components/common/ImageUpload';
import { FlowBoardColorConfig } from '../types';

export const MyProfile = () => {
  const { t } = useTranslation('profile');
  const { user, setAuth } = useAuthStore();
  const { preferences, setPreferences } = useThemeStore();

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Theme form state
  const [headerBgColor, setHeaderBgColor] = useState(preferences?.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor);
  const [sidebarBgColor, setSidebarBgColor] = useState(preferences?.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor);
  const [sidebarHoverColor, setSidebarHoverColor] = useState(preferences?.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor);
  const [flowBoardColors, setFlowBoardColors] = useState<FlowBoardColorConfig>({
    scheduled: preferences?.flowBoardColors?.scheduled || DEFAULT_FLOWBOARD_COLORS.scheduled,
    checkIn: preferences?.flowBoardColors?.checkIn || DEFAULT_FLOWBOARD_COLORS.checkIn,
    inProgress: preferences?.flowBoardColors?.inProgress || DEFAULT_FLOWBOARD_COLORS.inProgress,
    hospitalized: preferences?.flowBoardColors?.hospitalized || DEFAULT_FLOWBOARD_COLORS.hospitalized,
    completed: preferences?.flowBoardColors?.completed || DEFAULT_FLOWBOARD_COLORS.completed,
  });
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeMessage, setThemeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  // Update form when preferences change
  useEffect(() => {
    if (preferences) {
      setHeaderBgColor(preferences.headerBgColor || DEFAULT_THEME_COLORS.headerBgColor);
      setSidebarBgColor(preferences.sidebarBgColor || DEFAULT_THEME_COLORS.sidebarBgColor);
      setSidebarHoverColor(preferences.sidebarHoverColor || DEFAULT_THEME_COLORS.sidebarHoverColor);
      setFlowBoardColors({
        scheduled: preferences.flowBoardColors?.scheduled || DEFAULT_FLOWBOARD_COLORS.scheduled,
        checkIn: preferences.flowBoardColors?.checkIn || DEFAULT_FLOWBOARD_COLORS.checkIn,
        inProgress: preferences.flowBoardColors?.inProgress || DEFAULT_FLOWBOARD_COLORS.inProgress,
        hospitalized: preferences.flowBoardColors?.hospitalized || DEFAULT_FLOWBOARD_COLORS.hospitalized,
        completed: preferences.flowBoardColors?.completed || DEFAULT_FLOWBOARD_COLORS.completed,
      });
    }
  }, [preferences]);

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      const updatedUser = await profileApi.updateProfile({ firstName, lastName });
      // Update auth store with new user data
      const token = localStorage.getItem('token');
      if (token) {
        setAuth(updatedUser, token);
      }
      setIsEditingProfile(false);
      setProfileMessage({ type: 'success', text: t('messages.profileUpdated') });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.message || t('messages.error') });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    setThemeLoading(true);
    setThemeMessage(null);
    try {
      const updatedPreferences = await profileApi.updatePreferences({
        headerBgColor,
        sidebarBgColor,
        sidebarHoverColor,
        flowBoardColors,
      });
      setPreferences(updatedPreferences);
      setThemeMessage({ type: 'success', text: t('messages.themeUpdated') });
    } catch (error: any) {
      setThemeMessage({ type: 'error', text: error.response?.data?.message || t('messages.error') });
    } finally {
      setThemeLoading(false);
    }
  };

  const handleResetTheme = async () => {
    setThemeLoading(true);
    setThemeMessage(null);
    try {
      const defaultPreferences = await profileApi.resetPreferences();
      setPreferences(defaultPreferences);
      // Reset local state
      setHeaderBgColor(DEFAULT_THEME_COLORS.headerBgColor);
      setSidebarBgColor(DEFAULT_THEME_COLORS.sidebarBgColor);
      setSidebarHoverColor(DEFAULT_THEME_COLORS.sidebarHoverColor);
      setFlowBoardColors(DEFAULT_FLOWBOARD_COLORS);
      setThemeMessage({ type: 'success', text: t('messages.themeReset') });
    } catch (error: any) {
      setThemeMessage({ type: 'error', text: error.response?.data?.message || t('messages.error') });
    } finally {
      setThemeLoading(false);
    }
  };

  const handleFlowBoardColorChange = (columnId: keyof FlowBoardColorConfig, color: string) => {
    setFlowBoardColors((prev) => ({
      ...prev,
      [columnId]: color,
    }));
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarLoading(true);
    setProfileMessage(null);
    try {
      const updatedUser = await uploadApi.uploadUserAvatar(file);
      const token = localStorage.getItem('token');
      if (token) {
        setAuth(updatedUser, token);
      }
      setProfileMessage({ type: 'success', text: t('messages.avatarUpdated') });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.message || t('messages.error') });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    setProfileMessage(null);
    try {
      const updatedUser = await uploadApi.removeUserAvatar();
      const token = localStorage.getItem('token');
      if (token) {
        setAuth(updatedUser, token);
      }
      setProfileMessage({ type: 'success', text: t('messages.avatarRemoved') });
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.response?.data?.message || t('messages.error') });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">👤</span>
        <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">{t('title')}</h1>
      </div>

      {/* Profile Section */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">{t('profile.title')}</h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="btn btn-secondary text-sm"
            >
              {t('profile.editProfile')}
            </button>
          )}
        </div>

        {profileMessage && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              profileMessage.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {profileMessage.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <label className="label mb-2">{t('profile.avatar')}</label>
            <ImageUpload
              currentImage={user?.avatarUrl}
              onUpload={handleAvatarUpload}
              onRemove={user?.avatarUrl ? handleAvatarRemove : undefined}
              shape="circle"
              size="lg"
              loading={avatarLoading}
              maxSizeMB={2}
              placeholder={
                <div className="flex flex-col items-center text-gray-400">
                  <UserCircleIcon className="w-12 h-12" />
                </div>
              }
            />
          </div>

          {/* Profile Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('profile.firstName')}</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                />
              ) : (
                <p className="text-brand-dark dark:text-[var(--app-text-primary)] py-2">{user?.firstName}</p>
              )}
            </div>
            <div>
              <label className="label">{t('profile.lastName')}</label>
              {isEditingProfile ? (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                />
              ) : (
                <p className="text-brand-dark dark:text-[var(--app-text-primary)] py-2">{user?.lastName}</p>
              )}
            </div>
            <div>
              <label className="label">{t('profile.email')}</label>
              <p className="text-brand-dark dark:text-[var(--app-text-primary)] py-2">{user?.email}</p>
            </div>
            <div>
              <label className="label">{t('profile.role')}</label>
              <p className="text-brand-dark dark:text-[var(--app-text-primary)] py-2">{user?.role?.displayNameAr || user?.role?.name}</p>
            </div>
          </div>
        </div>

        {isEditingProfile && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveProfile}
              disabled={profileLoading}
              className="btn btn-primary"
            >
              {profileLoading ? '...' : t('profile.saveChanges')}
            </button>
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setFirstName(user?.firstName || '');
                setLastName(user?.lastName || '');
              }}
              className="btn btn-secondary"
            >
              {t('profile.cancel')}
            </button>
          </div>
        )}
      </div>

      {/* Theme Customization Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)] mb-4">{t('theme.title')}</h2>

        {themeMessage && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              themeMessage.type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {themeMessage.text}
          </div>
        )}

        {/* Layout Colors */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-brand-dark dark:text-[var(--app-text-primary)] mb-3">{t('theme.layoutColors')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ColorPicker
              label={t('theme.headerColor')}
              value={headerBgColor}
              onChange={setHeaderBgColor}
            />
            <ColorPicker
              label={t('theme.sidebarColor')}
              value={sidebarBgColor}
              onChange={setSidebarBgColor}
            />
            <ColorPicker
              label={t('theme.sidebarHoverColor')}
              value={sidebarHoverColor}
              onChange={setSidebarHoverColor}
            />
          </div>
        </div>

        {/* FlowBoard Colors */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-brand-dark dark:text-[var(--app-text-primary)] mb-3">{t('theme.flowBoardColors')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <ColorPicker
              label={t('theme.columns.scheduled')}
              value={flowBoardColors.scheduled || ''}
              onChange={(color) => handleFlowBoardColorChange('scheduled', color)}
            />
            <ColorPicker
              label={t('theme.columns.checkIn')}
              value={flowBoardColors.checkIn || ''}
              onChange={(color) => handleFlowBoardColorChange('checkIn', color)}
            />
            <ColorPicker
              label={t('theme.columns.inProgress')}
              value={flowBoardColors.inProgress || ''}
              onChange={(color) => handleFlowBoardColorChange('inProgress', color)}
            />
            <ColorPicker
              label={t('theme.columns.hospitalized')}
              value={flowBoardColors.hospitalized || ''}
              onChange={(color) => handleFlowBoardColorChange('hospitalized', color)}
            />
            <ColorPicker
              label={t('theme.columns.completed')}
              value={flowBoardColors.completed || ''}
              onChange={(color) => handleFlowBoardColorChange('completed', color)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSaveTheme}
            disabled={themeLoading}
            className="btn btn-primary"
          >
            {themeLoading ? '...' : t('theme.saveTheme')}
          </button>
          <button
            onClick={handleResetTheme}
            disabled={themeLoading}
            className="btn btn-secondary"
          >
            {t('theme.resetDefaults')}
          </button>
        </div>
      </div>
    </div>
  );
};
