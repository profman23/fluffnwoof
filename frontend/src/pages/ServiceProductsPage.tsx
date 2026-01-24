import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { serviceProductsApi, ServiceProduct, Category } from '../api/serviceProducts';
import { AddEditServiceProductModal } from '../components/serviceProducts/AddEditModal';
import { ImportExcelModal } from '../components/serviceProducts/ImportExcelModal';
import { CategoryModal } from '../components/serviceProducts/CategoryModal';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { DataTable, Column } from '../components/common/DataTable';

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

  // Define columns for DataTable
  const columns: Column<ServiceProduct>[] = [
    {
      id: 'name',
      header: t('table.name'),
      render: (item) => (
        <span className="text-sm font-medium text-gray-900">{item.name}</span>
      ),
    },
    {
      id: 'category',
      header: t('table.category'),
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
          {item.category?.name || '-'}
        </span>
      ),
    },
    {
      id: 'priceBeforeTax',
      header: t('table.priceBeforeTax'),
      render: (item) => (
        <span className="text-sm text-gray-900 whitespace-nowrap" dir="ltr">
          {formatPrice(item.priceBeforeTax)} SAR
        </span>
      ),
    },
    {
      id: 'taxRate',
      header: t('table.taxRate'),
      render: (item) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {formatPrice(item.taxRate)}%
        </span>
      ),
    },
    {
      id: 'priceAfterTax',
      header: t('table.priceAfterTax'),
      render: (item) => (
        <span className="text-sm font-medium text-green-600 whitespace-nowrap" dir="ltr">
          {formatPrice(item.priceAfterTax)} SAR
        </span>
      ),
    },
  ];

  // Render actions
  const renderActions = (item: ServiceProduct) => (
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
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ShoppingBagIcon className="w-7 h-7 text-brand-dark" />
          <h1 className="text-2xl font-bold text-brand-dark">{t('title')}</h1>
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

      {/* DataTable */}
      <DataTable<ServiceProduct>
        tableId="service-products"
        columns={columns}
        data={items}
        loading={loading}
        emptyIcon="🛒"
        emptyMessage={t('noData')}
        rowKey="id"
        renderActions={canModify ? renderActions : undefined}
        actionsHeader={t('table.actions')}
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      {/* Total Count */}
      {!loading && items.length > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          {t('total')}: {pagination.total}
        </div>
      )}

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
