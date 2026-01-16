import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { serviceProductsApi, ServiceProduct, Category } from '../api/serviceProducts';
import { AddEditServiceProductModal } from '../components/serviceProducts/AddEditModal';
import { ImportExcelModal } from '../components/serviceProducts/ImportExcelModal';
import { CategoryModal } from '../components/serviceProducts/CategoryModal';
import { useScreenPermission } from '../hooks/useScreenPermission';

export const ServiceProductsPage = () => {
  const { t } = useTranslation('serviceProducts');
  const { canModify, isReadOnly } = useScreenPermission('serviceProducts');

  // State
  const [items, setItems] = useState<ServiceProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modals
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceProduct | null>(null);

  // Load data
  const loadCategories = async () => {
    try {
      const data = await serviceProductsApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const result = await serviceProductsApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        categoryId: selectedCategory || undefined,
      });
      setItems(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems();
  }, [pagination.page, search, selectedCategory]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadItems();
  };

  const handleEdit = (item: ServiceProduct) => {
    setEditingItem(item);
    setShowAddEdit(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await serviceProductsApi.delete(id);
      loadItems();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleModalClose = () => {
    setShowAddEdit(false);
    setEditingItem(null);
    loadItems();
  };

  const handleImportClose = () => {
    setShowImport(false);
    loadItems();
  };

  const handleCategoriesClose = () => {
    setShowCategories(false);
    loadCategories();
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          {isReadOnly && (
            <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              {t('readOnly')}
            </span>
          )}
        </div>
        {canModify && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>{t('import')}</span>
            </button>
            <button
              onClick={() => setShowAddEdit(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('add')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">{t('noData')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {t('table.name')}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {t('table.category')}
                    </th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {t('table.priceBeforeTax')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {t('table.taxRate')}
                    </th>
                    <th className="px-4 py-3 text-end text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {t('table.priceAfterTax')}
                    </th>
                    {canModify && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        {t('table.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-end whitespace-nowrap" dir="ltr">
                        {formatPrice(item.priceBeforeTax)} SAR
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">
                        {formatPrice(item.taxRate)}%
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600 text-end whitespace-nowrap" dir="ltr">
                        {formatPrice(item.priceAfterTax)} SAR
                      </td>
                      {canModify && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title={t('edit')}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title={t('delete')}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {t('total')}: {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  {pagination.page} / {pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddEdit && (
        <AddEditServiceProductModal
          item={editingItem}
          categories={categories}
          onClose={handleModalClose}
        />
      )}

      {showImport && <ImportExcelModal onClose={handleImportClose} />}

      {showCategories && (
        <CategoryModal categories={categories} onClose={handleCategoriesClose} />
      )}
    </div>
  );
};
