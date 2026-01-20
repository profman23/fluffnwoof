import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, UserCircleIcon, ChartBarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { Card } from '../common/Card';
import { dashboardApi, VetPerformanceStats as VetPerformanceData } from '../../api/dashboard';
import { VetPerformanceModal } from './VetPerformanceModal';

export const VetPerformanceStats: React.FC = () => {
  const { t, i18n } = useTranslation('dashboard');
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VetPerformanceData[]>([]);
  const [selectedVet, setSelectedVet] = useState<VetPerformanceData | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardApi.getVetPerformance();
      setData(result);
    } catch (err) {
      console.error('Failed to fetch vet performance:', err);
      setError(t('vetPerformance.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (rate: number) => {
    if (rate >= 80) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
    return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
  };

  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return t('vetPerformance.noActivity');

    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('time.today');
    if (diffDays === 1) return t('vetPerformance.yesterday');
    if (diffDays < 7) return t('vetPerformance.daysAgo', { count: diffDays });

    return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewDetails = (vet: VetPerformanceData) => {
    setSelectedVet(vet);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Card title={t('vetPerformance.title')}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title={t('vetPerformance.title')}>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-red-500 mb-3 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {t('retry')}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={t('vetPerformance.title')}
        action={
          <button
            onClick={fetchData}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('refresh')}
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        }
      >
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>{t('vetPerformance.noData')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((vet) => (
              <div
                key={vet.vetId}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{vet.vetName}</h4>
                      <p className="text-xs text-gray-500">
                        {t('vetPerformance.lastActivity')}: {formatLastActivity(vet.lastActivity)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(vet.completionRate)}
                    <button
                      onClick={() => handleViewDetails(vet)}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title={t('vetPerformance.viewDetails')}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">
                      {t('vetPerformance.completionRate')}
                    </span>
                    <span className={`font-medium ${getPerformanceColor(vet.completionRate)}`}>
                      {vet.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(vet.completionRate)}`}
                      style={{ width: `${vet.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>
                      <span className="font-medium text-gray-900">{vet.totalRecords}</span>{' '}
                      {t('vetPerformance.totalRecords')}
                    </span>
                    <span className="text-green-600">
                      <span className="font-medium">{vet.completeRecords}</span>{' '}
                      {t('vetPerformance.complete')}
                    </span>
                    <span className="text-red-600">
                      <span className="font-medium">{vet.incompleteRecords}</span>{' '}
                      {t('vetPerformance.incomplete')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {selectedVet && (
        <VetPerformanceModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedVet(null);
          }}
          vet={selectedVet}
        />
      )}
    </>
  );
};
