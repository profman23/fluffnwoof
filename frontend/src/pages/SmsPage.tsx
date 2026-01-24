import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { smsApi, SmsLog, SendSmsInput } from '../api/sms';
import { Card } from '../components/common/Card';
import { ScreenPermissionGuard } from '../components/common/ScreenPermissionGuard';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { DataTable, Column } from '../components/common/DataTable';

export const SmsPage: React.FC = () => {
  const { t } = useTranslation('sms');
  const queryClient = useQueryClient();
  const { canModify, isReadOnly } = useScreenPermission('sms');

  // Form state
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Get balance
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['sms-balance'],
    queryFn: smsApi.getBalance,
  });

  // Get logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: () => smsApi.getLogs({ limit: 20 }),
  });

  // Send SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: (data: SendSmsInput) => smsApi.sendSms(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sms-balance'] });
      setPhone('');
      setMessage('');
      setRecipientName('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) return;

    sendSmsMutation.mutate({
      phone,
      message,
      recipientName: recipientName || undefined,
    });
  };

  const getStatusBadge = (status: SmsLog['status']) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-blue-100 text-blue-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {t(`status.${status}`)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  // Define columns for DataTable
  const columns: Column<SmsLog>[] = [
    {
      id: 'recipient',
      header: t('logs.recipient'),
      render: (log) => (
        <div>
          <div className="font-medium text-gray-800" dir="ltr">{log.recipientPhone}</div>
          {log.recipientName && (
            <div className="text-xs text-gray-500">{log.recipientName}</div>
          )}
        </div>
      ),
    },
    {
      id: 'message',
      header: t('logs.message'),
      render: (log) => (
        <div>
          <div className="max-w-xs truncate text-gray-600" title={log.messageBody}>
            {log.messageBody}
          </div>
          {log.errorMessage && (
            <div className="text-xs text-red-500 mt-1">{log.errorMessage}</div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: t('logs.status'),
      render: (log) => getStatusBadge(log.status),
    },
    {
      id: 'date',
      header: t('logs.date'),
      render: (log) => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {formatDate(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <ScreenPermissionGuard screenName="sms">
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
          {isReadOnly && (
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              {t('readOnlyMode')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{t('balance.title')}</h2>
            <button
              onClick={() => refetchBalance()}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {t('balance.refresh')}
            </button>
          </div>
          {balanceLoading ? (
            <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
          ) : (
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600">
                {balance?.balance || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">{t('balance.credits')}</div>
            </div>
          )}
        </Card>

        {/* Send SMS Form - Only show for Full Control */}
        {canModify && (
          <Card className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{t('send.title')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('send.phone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="966xxxxxxxxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    dir="ltr"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('send.recipientName')}
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder={t('send.recipientNamePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('send.message')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder={t('send.messagePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length} {t('send.characters')}
                </div>
              </div>
              <button
                type="submit"
                disabled={sendSmsMutation.isPending || !phone || !message}
                className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sendSmsMutation.isPending ? t('send.sending') : t('send.sendButton')}
              </button>

              {sendSmsMutation.isSuccess && (
                <div className="text-green-600 text-sm mt-2">
                  {sendSmsMutation.data.status === 'SENT' ? t('send.success') : t('send.failed')}
                </div>
              )}

              {sendSmsMutation.isError && (
                <div className="text-red-600 text-sm mt-2">
                  {t('send.error')}
                </div>
              )}
            </form>
          </Card>
        )}
      </div>

      {/* SMS Logs */}
      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">{t('logs.title')}</h2>
        <DataTable<SmsLog>
          tableId="sms-logs"
          columns={columns}
          data={logsData?.data || []}
          loading={logsLoading}
          emptyIcon="📱"
          emptyMessage={t('logs.empty')}
          rowKey="id"
        />
      </Card>
      </div>
    </ScreenPermissionGuard>
  );
};
