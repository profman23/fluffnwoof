import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { serviceProductsApi, ServiceProduct, Category } from '../../api/serviceProducts';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

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

    if (!formData.name || !formData.categoryId || !formData.priceBeforeTax) {
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? `✏️ ${t('form.editTitle')}` : `🛒 ${t('form.addTitle')}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="label">
            📦 {t('form.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="input"
            placeholder={t('form.name')}
            required
          />
        </div>

        {/* Price Row - Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price Before Tax */}
          <div>
            <label className="label">
              💰 {t('form.priceBeforeTax')} <span className="text-red-500">*</span>
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
              className="input"
              dir="ltr"
              placeholder="0.00"
              required
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label className="label">
              📊 {t('form.taxRate')}
            </label>
            <select
              value={formData.taxRate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, taxRate: e.target.value }))
              }
              className="select"
            >
              <option value="0">0% - {t('form.zeroTax')}</option>
              <option value="15">15% - VAT</option>
            </select>
          </div>
        </div>

        {/* Price After Tax (Read-only) */}
        <div>
          <label className="label">
            💵 {t('form.priceAfterTax')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.priceAfterTax}
              readOnly
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold"
              dir="ltr"
            />
            <span className="absolute end-4 top-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 text-sm font-medium">
              SAR
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            {t('form.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? t('form.saving') : t('form.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
