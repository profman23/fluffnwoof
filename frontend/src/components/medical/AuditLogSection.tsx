import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { AuditLog } from '../../types';
import { medicalRecordsApi } from '../../api/medicalRecords';

interface AuditLogSectionProps {
  recordId: string;
}

export const AuditLogSection = ({ recordId }: AuditLogSectionProps) => {
  const { t, i18n } = useTranslation('medicalRecords');
  const isRtl = i18n.language === 'ar';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!recordId) return;
      setLoading(true);
      try {
        const data = await medicalRecordsApi.getAuditLog(recordId);
        // Filter only CREATE and UPDATE actions
        const relevantLogs = data.filter(
          (log) => log.action === 'CREATE' || log.action === 'UPDATE'
        );
        setLogs(relevantLogs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [recordId]);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return t('auditLog.created');
      case 'UPDATE':
        return t('auditLog.updated');
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <ArrowPathIcon className="w-4 h-4 animate-spin" />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return null;
  }

  const displayLogs = expanded ? logs : logs.slice(0, 3);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full"
      >
        <ClockIcon className="w-4 h-4" />
        <span>{t('auditLog.title')}</span>
        <span className="text-gray-400 text-xs">({logs.length})</span>
        <span className="ms-auto text-gray-400">{expanded ? '▲' : '▼'}</span>
      </button>

      <div className={`mt-3 space-y-2 ${!expanded && logs.length > 3 ? 'relative' : ''}`}>
        {displayLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-2 text-sm text-gray-600 ps-6"
          >
            <span className="text-gray-400">•</span>
            <span>{formatDateTime(log.createdAt)}</span>
            <span>-</span>
            <span className="font-medium">
              {log.user ? `${log.user.firstName} ${log.user.lastName}` : '-'}
            </span>
            <span
              className={`px-1.5 py-0.5 text-xs rounded ${
                log.action === 'CREATE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {getActionLabel(log.action)}
            </span>
          </div>
        ))}

        {!expanded && logs.length > 3 && (
          <div className="text-center pt-1">
            <button
              onClick={() => setExpanded(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('auditLog.showMore', { count: logs.length - 3 })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
