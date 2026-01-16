import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi, ServiceProduct, Category } from '../../api/serviceProducts';

interface Props {
  item: ServiceProduct | null;
  categories: Category[];
  onClose: () => void;
}

export const AddEditServiceProductModal = ({ item, categories, onClose }: Props) => {
  const { t } = useTranslation('serviceProducts');
  const isEdit = !!item;

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    priceBeforeTax: '',
    taxRate: '15',
    priceAfterTax: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-select first category (Medical) if available
  useEffect(() => {
    if (!item && categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, item, formData.categoryId]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        categoryId: item.categoryId,
        priceBeforeTax: String(item.priceBeforeTax),
        taxRate: String(item.taxRate),
        priceAfterTax: String(item.priceAfterTax),
      });
    }
  }, [item]);

  // Calculate price after tax when price before tax or tax rate changes
  useEffect(() => {
    const priceBeforeTax = parseFloat(formData.priceBeforeTax) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const priceAfterTax = priceBeforeTax * (1 + taxRate / 100);
    setFormData((prev) => ({
      ...prev,
      priceAfterTax: priceAfterTax.toFixed(2),
    }));
  }, [formData.priceBeforeTax, formData.taxRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.priceBeforeTax) {
      setError(t('form.requiredFields'));
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: formData.name,
        categoryId: formData.categoryId,
        priceBeforeTax: parseFloat(formData.priceBeforeTax),
        taxRate: parseFloat(formData.taxRate),
        priceAfterTax: parseFloat(formData.priceAfterTax),
      };

      if (isEdit) {
        await serviceProductsApi.update(item.id, data);
      } else {
        await serviceProductsApi.create(data);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('form.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {isEdit ? t('form.editTitle') : t('form.addTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('form.name')}
                required
              />
            </div>

{/* Price Row - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Price Before Tax */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.priceBeforeTax')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceBeforeTax}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priceBeforeTax: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  dir="ltr"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('form.taxRate')}
                </label>
                <select
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, taxRate: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">0% - {t('form.zeroTax')}</option>
                  <option value="15">15% - VAT</option>
                </select>
              </div>
            </div>

            {/* Price After Tax (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.priceAfterTax')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.priceAfterTax}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-green-50 text-green-700 font-semibold"
                  dir="ltr"
                />
                <span className="absolute end-4 top-1/2 -translate-y-1/2 text-green-600 text-sm font-medium">
                  SAR
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                {t('form.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
              >
                {loading ? t('form.saving') : t('form.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
