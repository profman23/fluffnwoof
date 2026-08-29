import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { creditNotesApi, CreditableInvoice, CreditNote } from '../../api/creditNotes';
import { InvoiceStatus } from '../../types';
import { LogoLoader } from '../../components/common/LogoLoader';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { ReadOnlyBadge } from '../../components/common/ReadOnlyBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { SarSymbol } from '../../components/common/SarSymbol';
import { useScreenPermission } from '../../hooks/useScreenPermission';

type Tab = 'invoices' | 'issued';

export const CreditNotesPage = () => {
  const { t, i18n } = useTranslation('creditNotes');
  const { isReadOnly, isFullControl } = useScreenPermission('creditNotes');

  const [tab, setTab] = useState<Tab>('invoices');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<CreditableInvoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  // Confirm modal state
  const [selected, setSelected] = useState<CreditableInvoice | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  const fmtMoney = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'invoices') {
        const res = await creditNotesApi.listCreditableInvoices({ search: search || undefined, limit: 100 });
        setInvoices(res.data);
      } else {
        const res = await creditNotesApi.list({ search: search || undefined, limit: 100 });
        setCreditNotes(res.data);
      }
    } catch (err) {
      console.error('Failed to load credit notes data:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const id = setTimeout(loadData, search ? 350 : 0); // debounce search
    return () => clearTimeout(id);
  }, [loadData, search]);

  const openConfirm = (inv: CreditableInvoice) => {
    setSelected(inv);
    setReason('');
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await creditNotesApi.create(selected.id, reason.trim() || undefined);
      setSelected(null);
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || t('errors.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenPermissionGuard screenName="creditNotes">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
              🧾 {t('title')}
            </h1>
            {isReadOnly && <ReadOnlyBadge namespace="creditNotes" />}
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
            aria-label={t('refresh')}
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-[var(--app-border-default)]">
          {(['invoices', 'issued'] as Tab[]).map((tk) => (
            <button
              key={tk}
              onClick={() => setTab(tk)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tk
                  ? 'border-secondary-400 text-brand-dark dark:text-[var(--app-text-primary)]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {t(`tabs.${tk}`)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <MagnifyingGlassIcon className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full ps-10 pe-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
          />
        </div>

        {loading ? (
          <LogoLoader />
        ) : tab === 'invoices' ? (
          /* ── Creditable Invoices ── */
          invoices.length === 0 ? (
            <EmptyState icon="🧾" text={t('empty.invoices')} />
          ) : (
            <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--app-border-default)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[var(--app-bg-tertiary)]">
                      <Th>{t('table.invoiceNumber')}</Th>
                      <Th>{t('table.date')}</Th>
                      <Th>{t('table.customer')}</Th>
                      <Th className="text-end">{t('table.total')}</Th>
                      <Th>{t('table.status')}</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[var(--app-border-default)]">
                    {invoices.map((inv) => {
                      const credited = inv.status === InvoiceStatus.CREDITED;
                      return (
                        <tr
                          key={inv.id}
                          className={credited ? 'bg-red-50/60 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-[var(--app-bg-elevated)]'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm dark:text-[var(--app-text-primary)]" dir="ltr">{inv.invoiceNumber}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{fmtDate(inv.issueDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium dark:text-[var(--app-text-primary)]">{inv.owner.firstName} {inv.owner.lastName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-end font-medium dark:text-[var(--app-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            <span className="inline-flex items-center gap-1" dir="ltr">{fmtMoney(inv.totalAmount)} <SarSymbol className="w-3.5 h-3.5" /></span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusPill status={inv.status} t={t} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-end">
                            {credited ? (
                              <span className="text-xs text-gray-400 dark:text-gray-500">{t('alreadyCredited')}</span>
                            ) : isFullControl ? (
                              <button
                                onClick={() => openConfirm(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              >
                                <ArrowUturnLeftIcon className="w-4 h-4" />
                                {t('createButton')}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* ── Issued Credit Notes ── */
          creditNotes.length === 0 ? (
            <EmptyState icon="↩️" text={t('empty.issued')} />
          ) : (
            <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--app-border-default)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[var(--app-bg-tertiary)]">
                      <Th>{t('table.creditNoteNumber')}</Th>
                      <Th>{t('table.originalInvoice')}</Th>
                      <Th>{t('table.customer')}</Th>
                      <Th className="text-end">{t('table.amount')}</Th>
                      <Th className="text-end">{t('table.refunded')}</Th>
                      <Th>{t('table.date')}</Th>
                      <Th>{t('table.createdBy')}</Th>
                      <Th>{t('table.reason')}</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[var(--app-border-default)]">
                    {creditNotes.map((cn) => (
                      <tr key={cn.id} className="hover:bg-gray-50 dark:hover:bg-[var(--app-bg-elevated)]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400" dir="ltr">{cn.creditNoteNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-300" dir="ltr">{cn.invoice.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium dark:text-[var(--app-text-primary)]">{cn.owner.firstName} {cn.owner.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-end font-semibold text-red-600 dark:text-red-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          <span className="inline-flex items-center gap-1" dir="ltr">− {fmtMoney(cn.amount)} <SarSymbol className="w-3.5 h-3.5" /></span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-end dark:text-[var(--app-text-primary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {cn.refundedAmount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400" dir="ltr">💸 {fmtMoney(cn.refundedAmount)} <SarSymbol className="w-3.5 h-3.5" /></span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{fmtDate(cn.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {cn.createdBy ? `${cn.createdBy.firstName} ${cn.createdBy.lastName}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{cn.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!selected}
          onClose={() => !submitting && setSelected(null)}
          onConfirm={handleConfirm}
          title={t('confirm.title')}
          confirmText={t('confirm.confirmButton')}
          cancelText={t('confirm.cancelButton')}
          variant="danger"
          loading={submitting}
          message={
            selected ? (
              <div className="space-y-3 text-start">
                <p className="text-sm">{t('confirm.warning')}</p>
                <div className="rounded-lg bg-gray-50 dark:bg-[var(--app-bg-elevated)] p-3 space-y-2 text-sm">
                  <Row label={t('confirm.invoice')}><span dir="ltr" className="font-mono">{selected.invoiceNumber}</span></Row>
                  <Row label={t('confirm.customer')}>{selected.owner.firstName} {selected.owner.lastName}</Row>
                  <Row label={t('confirm.amount')}>
                    <span className="font-semibold text-red-600 dark:text-red-400" dir="ltr">− {fmtMoney(selected.totalAmount)} ﷼</span>
                  </Row>
                  {selected.paidAmount > 0 && (
                    <Row label={t('confirm.refundAmount')}>
                      <span className="font-semibold text-orange-600 dark:text-orange-400" dir="ltr">💸 − {fmtMoney(selected.paidAmount)} ﷼</span>
                    </Row>
                  )}
                </div>
                {selected.paidAmount > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">{t('confirm.refundNote')}</p>
                )}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('confirm.reasonLabel')}</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder={t('confirm.reasonPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-card)] dark:text-[var(--app-text-primary)]"
                  />
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>}
              </div>
            ) : null
          }
        />
      </div>
    </ScreenPermissionGuard>
  );
};

// ── Small presentational helpers ──
const Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase ${className}`}>{children}</th>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-3">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="font-medium dark:text-[var(--app-text-primary)]">{children}</span>
  </div>
);

const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
  <div className="text-center py-16">
    <span className="text-5xl block mb-4">{icon}</span>
    <p className="text-gray-500 dark:text-gray-400 text-lg">{text}</p>
  </div>
);

const StatusPill = ({ status, t }: { status: InvoiceStatus; t: (k: string) => string }) => {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    PARTIALLY_PAID: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    PENDING: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    OVERDUE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    CREDITED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || map.PENDING}`}>
      {t(`status.${status}`)}
    </span>
  );
};

export default CreditNotesPage;
