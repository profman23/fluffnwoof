import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellAlertIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card } from '../../components/common/Card';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { remindersApi, ReminderSetting, ReminderEventType } from '../../api/reminders';
import { ReminderSettingModal } from '../../components/crm/ReminderSettingModal';

type TabType = 'overview' | 'appointmentReminders' | 'preAppointment' | 'followUp' | 'templates' | 'logs';

// Channel status component
const ChannelCard: React.FC<{
  title: string;
  icon: string;
  isConnected: boolean;
  status: string;
  provider?: string;
}> = ({ title, icon, isConnected, status, provider }) => (
  <div className={`p-4 rounded-lg border-2 ${isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {provider && <p className="text-xs text-gray-500">{provider}</p>}
        </div>
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}>
        {isConnected ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <ClockIcon className="w-4 h-4" />
        )}
        {status}
      </div>
    </div>
  </div>
);

// Channel toggle component
const ChannelToggle: React.FC<{
  icon: string;
  label: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  colorClass: string;
  disabled?: boolean;
}> = ({ icon, label, enabled, onToggle, colorClass, disabled }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border ${
    enabled ? colorClass : 'bg-gray-50 border-gray-200'
  } ${disabled ? 'opacity-50' : ''}`}>
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <span className={`text-sm font-medium ${enabled ? '' : 'text-gray-500'}`}>{label}</span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={disabled}
      />
      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
    </label>
  </div>
);

// Event setting row component
const EventSettingRow: React.FC<{
  eventType: ReminderEventType;
  setting?: ReminderSetting;
  onToggle: (eventType: ReminderEventType, enabled: boolean) => void;
  onChannelToggle: (eventType: ReminderEventType, channel: 'sms' | 'whatsapp' | 'email', enabled: boolean) => void;
  onEdit: (eventType: ReminderEventType) => void;
  t: (key: string) => string;
}> = ({ eventType, setting, onToggle, onChannelToggle, onEdit, t }) => {
  const isEnabled = setting?.isEnabled ?? false;

  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-medium text-gray-800">
            {t(`events.${eventType}.title`)}
          </h4>
          <p className="text-sm text-gray-500">
            {t(`events.${eventType}.description`)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(eventType)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {t('settings.enabled') === 'Enabled' ? 'Templates' : 'القوالب'}
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEnabled}
              onChange={(e) => onToggle(eventType, e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
      {/* Channel toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ChannelToggle
          icon="💬"
          label="SMS"
          enabled={setting?.smsEnabled ?? false}
          onToggle={(enabled) => onChannelToggle(eventType, 'sms', enabled)}
          colorClass="bg-blue-50 border-blue-200"
          disabled={!isEnabled}
        />
        <ChannelToggle
          icon="📱"
          label="WhatsApp"
          enabled={setting?.whatsappEnabled ?? false}
          onToggle={(enabled) => onChannelToggle(eventType, 'whatsapp', enabled)}
          colorClass="bg-green-50 border-green-200"
          disabled={!isEnabled}
        />
        <ChannelToggle
          icon="📧"
          label="Email"
          enabled={setting?.emailEnabled ?? false}
          onToggle={(enabled) => onChannelToggle(eventType, 'email', enabled)}
          colorClass="bg-purple-50 border-purple-200"
          disabled={!isEnabled}
        />
      </div>
    </div>
  );
};

export const ReminderManagement: React.FC = () => {
  const { t } = useTranslation('reminders');
  const queryClient = useQueryClient();
  const { canModify, isReadOnly } = useScreenPermission('reminders');
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<ReminderEventType | null>(null);

  // Fetch reminder settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['reminder-settings'],
    queryFn: remindersApi.getSettings,
  });

  // Fetch reminder logs
  const { data: logsData } = useQuery({
    queryKey: ['reminder-logs'],
    queryFn: () => remindersApi.getLogs({ limit: 20 }),
    enabled: activeTab === 'logs',
  });

  // Toggle setting mutation
  const toggleMutation = useMutation({
    mutationFn: ({ eventType, enabled }: { eventType: ReminderEventType; enabled: boolean }) =>
      remindersApi.toggleSetting(eventType, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
    },
  });

  // Channel toggle mutation
  const channelToggleMutation = useMutation({
    mutationFn: ({ eventType, channel, enabled }: { eventType: ReminderEventType; channel: 'sms' | 'whatsapp' | 'email'; enabled: boolean }) => {
      const setting = getSettingByType(eventType);
      const data = {
        smsEnabled: setting?.smsEnabled ?? false,
        whatsappEnabled: setting?.whatsappEnabled ?? false,
        emailEnabled: setting?.emailEnabled ?? false,
      };
      if (channel === 'sms') data.smsEnabled = enabled;
      if (channel === 'whatsapp') data.whatsappEnabled = enabled;
      if (channel === 'email') data.emailEnabled = enabled;
      return remindersApi.updateSetting(eventType, data, setting?.reminderOrder || 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-settings'] });
    },
  });

  const handleToggle = (eventType: ReminderEventType, enabled: boolean) => {
    if (!canModify) return;
    toggleMutation.mutate({ eventType, enabled });
  };

  const handleChannelToggle = (eventType: ReminderEventType, channel: 'sms' | 'whatsapp' | 'email', enabled: boolean) => {
    if (!canModify) return;
    channelToggleMutation.mutate({ eventType, channel, enabled });
  };

  const handleEdit = (eventType: ReminderEventType) => {
    setSelectedEventType(eventType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEventType(null);
  };

  const getSettingByType = (eventType: ReminderEventType): ReminderSetting | undefined => {
    return settings?.find(s => s.eventType === eventType);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'appointmentReminders', label: t('tabs.appointmentReminders') },
    { key: 'preAppointment', label: t('tabs.preAppointment') },
    { key: 'followUp', label: t('tabs.followUp') },
    { key: 'logs', label: t('tabs.logs') },
  ];

  return (
    <ScreenPermissionGuard screenName="reminders">
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="w-7 h-7 text-brand-dark" />
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">{t('title')}</h1>
              <p className="text-sm text-gray-500">{t('description')}</p>
            </div>
          </div>
          {isReadOnly && (
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              {t('settings.enabled') === 'Enabled' ? 'Read Only' : 'للقراءة فقط'}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Channels */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('channels.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ChannelCard
                  title={t('channels.sms.title')}
                  icon="💬"
                  isConnected={true}
                  status={t('channels.sms.status')}
                  provider={t('channels.sms.provider')}
                />
                <ChannelCard
                  title={t('channels.whatsapp.title')}
                  icon="📱"
                  isConnected={true}
                  status={t('channels.whatsapp.status')}
                  provider={t('channels.whatsapp.provider')}
                />
                <ChannelCard
                  title={t('channels.email.title')}
                  icon="📧"
                  isConnected={true}
                  status={t('channels.email.status')}
                  provider={t('channels.email.provider')}
                />
                <ChannelCard
                  title={t('channels.push.title')}
                  icon="🔔"
                  isConnected={false}
                  status={t('channels.push.status')}
                />
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <div className="text-3xl font-bold text-primary-600">0</div>
                <div className="text-sm text-gray-500">{t('stats.totalSent')}</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-500">{t('stats.delivered')}</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-red-600">0</div>
                <div className="text-sm text-gray-500">{t('stats.failed')}</div>
              </Card>
              <Card className="text-center">
                <div className="text-3xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-500">{t('stats.pending')}</div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'appointmentReminders' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('events.title')}</h2>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <EventSettingRow
                  eventType="OWNER_CREATED"
                  setting={getSettingByType('OWNER_CREATED')}
                  onToggle={handleToggle}
                  onChannelToggle={handleChannelToggle}
                  onEdit={handleEdit}
                  t={t}
                />
                <EventSettingRow
                  eventType="APPOINTMENT_BOOKED"
                  setting={getSettingByType('APPOINTMENT_BOOKED')}
                  onToggle={handleToggle}
                  onChannelToggle={handleChannelToggle}
                  onEdit={handleEdit}
                  t={t}
                />
                <EventSettingRow
                  eventType="APPOINTMENT_CONFIRMED"
                  setting={getSettingByType('APPOINTMENT_CONFIRMED')}
                  onToggle={handleToggle}
                  onChannelToggle={handleChannelToggle}
                  onEdit={handleEdit}
                  t={t}
                />
                <EventSettingRow
                  eventType="APPOINTMENT_CANCELLED"
                  setting={getSettingByType('APPOINTMENT_CANCELLED')}
                  onToggle={handleToggle}
                  onChannelToggle={handleChannelToggle}
                  onEdit={handleEdit}
                  t={t}
                />
              </div>
            )}
          </Card>
        )}

        {activeTab === 'preAppointment' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('events.PRE_APPOINTMENT.title')}
            </h2>
            <p className="text-gray-500 mb-4">{t('events.PRE_APPOINTMENT.description')}</p>
            {isLoading ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">{t('reminderOrder.first')}</h4>
                  <EventSettingRow
                    eventType="PRE_APPOINTMENT"
                    setting={getSettingByType('PRE_APPOINTMENT')}
                    onToggle={handleToggle}
                    onChannelToggle={handleChannelToggle}
                    onEdit={handleEdit}
                    t={t}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'followUp' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {t('events.FOLLOW_UP.title')}
            </h2>
            <p className="text-gray-500 mb-4">{t('events.FOLLOW_UP.description')}</p>
            {isLoading ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded-lg"></div>
            ) : (
              <div className="space-y-4">
                <EventSettingRow
                  eventType="FOLLOW_UP"
                  setting={getSettingByType('FOLLOW_UP')}
                  onChannelToggle={handleChannelToggle}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  t={t}
                />
              </div>
            )}
          </Card>
        )}

        {activeTab === 'logs' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('logs.title')}</h2>
            {logsData?.data?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-3 text-sm font-medium text-gray-500">{t('logs.recipient')}</th>
                      <th className="text-start p-3 text-sm font-medium text-gray-500">{t('logs.channel')}</th>
                      <th className="text-start p-3 text-sm font-medium text-gray-500">{t('logs.status')}</th>
                      <th className="text-start p-3 text-sm font-medium text-gray-500">{t('logs.sentAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsData.data.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-gray-800">{log.recipientName || '-'}</div>
                          <div className="text-sm text-gray-500" dir="ltr">{log.recipientPhone || log.recipientEmail}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {log.channel}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            log.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                            log.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                            log.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {t(`logs.statuses.${log.status}`)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BellAlertIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>{t('logs.noLogs')}</p>
              </div>
            )}
          </Card>
        )}

        {/* Setting Modal */}
        {selectedEventType && (
          <ReminderSettingModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            setting={getSettingByType(selectedEventType) || null}
            eventType={selectedEventType}
          />
        )}
      </div>
    </ScreenPermissionGuard>
  );
};
