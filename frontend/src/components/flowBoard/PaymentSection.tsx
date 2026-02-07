import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon, BanknotesIcon, CreditCardIcon, ArrowPathIcon, DocumentTextIcon, CheckCircleIcon, BuildingLibraryIcon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import { PaymentMethod } from '../../types';
import { SarSymbol } from '../common/SarSymbol';

export interface PaymentEntry {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

interface PaymentSectionProps {
  totalAmount: number;
  payments: PaymentEntry[];
  onPaymentsChange: (payments: PaymentEntry[]) => void;
  onRemovePayment?: (paymentId: string) => void;
  onGenerateInvoice?: () => void;
  generatingInvoice?: boolean;
  isFinalized?: boolean;
  invoiceNumber?: string;
  disabled?: boolean;
}

const paymentMethodIcons: Record<PaymentMethod, React.ReactNode> = {
  [PaymentMethod.CASH]: <BanknotesIcon className="w-4 h-4" />,
  [PaymentMethod.CARD]: <CreditCardIcon className="w-4 h-4" />,
  [PaymentMethod.MADA]: <CreditCardIcon className="w-4 h-4" />,
  [PaymentMethod.TABBY]: <CreditCardIcon className="w-4 h-4" />,
  [PaymentMethod.TAMARA]: <CreditCardIcon className="w-4 h-4" />,
  [PaymentMethod.BANK_TRANSFER]: <BuildingLibraryIcon className="w-4 h-4" />,
  [PaymentMethod.OTHER]: <EllipsisHorizontalCircleIcon className="w-4 h-4" />,
};

const paymentMethodColors: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'bg-green-100 text-green-700 border-green-200',
  [PaymentMethod.CARD]: 'bg-blue-100 text-blue-700 border-blue-200',
  [PaymentMethod.MADA]: 'bg-purple-100 text-purple-700 border-purple-200',
  [PaymentMethod.TABBY]: 'bg-orange-100 text-orange-700 border-orange-200',
  [PaymentMethod.TAMARA]: 'bg-pink-100 text-pink-700 border-pink-200',
  [PaymentMethod.BANK_TRANSFER]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [PaymentMethod.OTHER]: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const PaymentSection = ({
  totalAmount,
  payments,
  onPaymentsChange,
  onRemovePayment,
  onGenerateInvoice,
  generatingInvoice = false,
  isFinalized = false,
  invoiceNumber,
  disabled = false,
}: PaymentSectionProps) => {
  const { t } = useTranslation('flowBoard');
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = totalAmount - paidAmount;

  // تحديث حقل المبلغ تلقائياً عند تغيير المتبقي (سواء بإضافة أصناف أو دفعات)
  useEffect(() => {
    if (remainingAmount > 0) {
      setNewAmount(remainingAmount.toFixed(2));
    } else {
      setNewAmount('');
    }
  }, [remainingAmount]);

  const handleAddPayment = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;
    // إضافة tolerance للـ floating point للسماح بالدفع الكامل
    if (amount > remainingAmount + 0.01) return;

    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      amount,
      paymentMethod: newMethod,
    };

    onPaymentsChange([...payments, newPayment]);
    setNewAmount('');
  };

  const handleRemovePayment = (id: string) => {
    // If we have an API callback for removing payments, use it
    if (onRemovePayment) {
      onRemovePayment(id);
    } else {
      // Fallback to local state update
      onPaymentsChange(payments.filter((p) => p.id !== id));
    }
  };

  const handlePayFullAmount = () => {
    if (remainingAmount <= 0) return;

    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      amount: remainingAmount,
      paymentMethod: newMethod,
    };

    onPaymentsChange([...payments, newPayment]);
    setNewAmount('');
  };

  const paymentMethods: PaymentMethod[] = [
    PaymentMethod.MADA,
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.TABBY,
    PaymentMethod.TAMARA,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.OTHER,
  ];

  const isDisabled = disabled || isFinalized;

  return (
    <div className="space-y-4">
      {/* Finalized Banner */}
      {isFinalized && invoiceNumber && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">{t('invoice.finalized')}</span>
          </div>
          <div className="flex items-center gap-2 text-green-800 font-semibold">
            <DocumentTextIcon className="w-4 h-4" />
            {invoiceNumber}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-lg p-3 text-center ${isFinalized ? 'bg-gray-100' : 'bg-gray-50'}`}>
          <div className="text-xs text-gray-500 mb-1">{t('totalAmount')}</div>
          <div className="text-lg font-bold text-gray-900 inline-flex items-center justify-center gap-1">{totalAmount.toFixed(2)} <SarSymbol className="w-4 h-4" /></div>
        </div>
        <div className={`rounded-lg p-3 text-center ${isFinalized ? 'bg-gray-100' : 'bg-green-50'}`}>
          <div className={`text-xs mb-1 ${isFinalized ? 'text-gray-500' : 'text-green-600'}`}>{t('paidAmount')}</div>
          <div className={`text-lg font-bold ${isFinalized ? 'text-gray-700' : 'text-green-600'} inline-flex items-center justify-center gap-1`}>{paidAmount.toFixed(2)} <SarSymbol className="w-4 h-4" /></div>
        </div>
        <div className={`rounded-lg p-3 text-center ${isFinalized ? 'bg-gray-100' : remainingAmount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className={`text-xs mb-1 ${isFinalized ? 'text-gray-500' : remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {t('remainingAmount')}
          </div>
          <div className={`text-lg font-bold ${isFinalized ? 'text-gray-700' : remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span className="inline-flex items-center justify-center gap-1">{remainingAmount.toFixed(2)} <SarSymbol className="w-4 h-4" /></span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('paymentMethod')}
        </label>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => setNewMethod(method)}
              disabled={isDisabled}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                newMethod === method
                  ? paymentMethodColors[method]
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {paymentMethodIcons[method]}
              <span className="text-sm font-medium">{t(`paymentMethods.${method}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add Payment Form */}
      {remainingAmount > 0 && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder={t('enterAmount')}
              disabled={isDisabled}
              max={remainingAmount}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SarSymbol className="w-4 h-4" />
            </span>
          </div>
          <button
            onClick={handleAddPayment}
            disabled={disabled || !newAmount || parseFloat(newAmount) <= 0}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            {t('addPayment')}
          </button>
          <button
            onClick={handlePayFullAmount}
            disabled={isDisabled}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('payFull')}
          </button>
        </div>
      )}

      {/* Payments List */}
      {payments.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('paymentMethod')}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  {t('amount')}
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm ${paymentMethodColors[payment.paymentMethod]}`}
                    >
                      {paymentMethodIcons[payment.paymentMethod]}
                      {t(`paymentMethods.${payment.paymentMethod}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center gap-1">{payment.amount.toFixed(2)} <SarSymbol className="w-3.5 h-3.5" /></span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRemovePayment(payment.id)}
                      disabled={isDisabled}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status Badge */}
      {remainingAmount <= 0 && paidAmount > 0 && !isFinalized && (
        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-lg">
          <span className="text-green-600 font-medium">{t('fullyPaid')}</span>
        </div>
      )}

      {/* Generate Invoice Button */}
      {onGenerateInvoice && !isFinalized && (
        <div className="flex justify-end pt-2 border-t border-gray-200 mt-4">
          <button
            onClick={onGenerateInvoice}
            disabled={generatingInvoice || isDisabled || totalAmount <= 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors"
          >
            {generatingInvoice ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {t('invoice.generating')}
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-4 h-4" />
                {t('invoice.generate')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
