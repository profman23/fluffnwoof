import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { serviceProductsApi, ServiceProduct, Category } from '../api/serviceProducts';
import { AddEditServiceProductModal } from '../components/serviceProducts/AddEditModal';
import { ImportExcelModal } from '../components/serviceProducts/ImportExcelModal';
import { CategoryModal } from '../components/serviceProducts/CategoryModal';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { DataTable, Column } from '../components/common/DataTable';
import { ReadOnlyBadge } from '../components/common/ReadOnlyBadge';
import { Button } from '../components/common/Button';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

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

  // Selection & delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<ServiceProduct | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  // Clear selection on page/filter/search change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [pagination.page, search, selectedCategory]);

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

  // Delete handlers
  const handleSingleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await serviceProductsApi.bulkDelete([deleteConfirm.id]);
      setSuccessMessage(t('deleteSuccess'));
      setDeleteConfirm(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteConfirm.id);
        return next;
      });
      loadItems();
    } catch {
      setErrorMessage(t('deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const result = await serviceProductsApi.bulkDelete(Array.from(selectedIds));
      setSuccessMessage(t('bulkDeleteSuccess', { count: result.deletedCount }));
      setBulkDeleteConfirm(false);
      setSelectedIds(new Set());
      loadItems();
    } catch {
      setErrorMessage(t('bulkDeleteError'));
    } finally {
      setDeleting(false);
    }
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

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
        <span className="text-sm font-medium text-gray-900 dark:text-[var(--app-text-primary)]">{item.name}</span>
      ),
    },
    {
      id: 'daftraCode',
      header: t('table.daftraCode'),
      render: (item) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{item.daftraCode || '-'}</span>
      ),
    },
    {
      id: 'barcode',
      header: t('table.barcode'),
      render: (item) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{item.barcode || '-'}</span>
      ),
    },
    {
      id: 'category',
      header: t('table.category'),
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
          {item.category?.name || '-'}
        </span>
      ),
    },
    {
      id: 'priceBeforeTax',
      header: t('table.priceBeforeTax'),
      render: (item) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap" dir="ltr">
          {formatPrice(item.priceBeforeTax)} SAR
        </span>
      ),
    },
    {
      id: 'taxRate',
      header: t('table.taxRate'),
      render: (item) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatPrice(item.taxRate)}%
        </span>
      ),
    },
    {
      id: 'priceAfterTax',
      header: t('table.priceAfterTax'),
      render: (item) => (
        <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap" dir="ltr">
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
        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
        title={t('edit')}
      >
        <PencilIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setDeleteConfirm(item)}
        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
        title={t('delete')}
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛒</span>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">{t('title')}</h1>
          {isReadOnly && <ReadOnlyBadge namespace="serviceProducts" />}
        </div>
        {canModify && (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>{t('importBtn')}</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowAddEdit(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('add')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-lg shadow dark:shadow-black/30 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input ps-10"
            />
          </div>
          <div className="sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="select"
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

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert-success mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert-error mb-4">
          {errorMessage}
        </div>
      )}

      {/* Selection Toolbar */}
      {canModify && selectedIds.size > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {t('selectedCount', { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm"
            >
              {t('clearSelection')}
            </Button>
            <Button
              variant="danger"
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm"
            >
              <TrashIcon className="w-4 h-4" />
              {t('deleteSelected', { count: selectedIds.size })}
            </Button>
          </div>
        </div>
      )}

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
        selectable={canModify}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Total Count */}
      {!loading && items.length > 0 && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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

      {/* Single Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleSingleDelete}
        title={t('confirmDeleteTitle')}
        message={t('confirmDelete')}
        confirmText={t('delete')}
        cancelText={t('form.cancel')}
        variant="danger"
        loading={deleting}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmationModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={t('confirmBulkDeleteTitle')}
        message={t('confirmBulkDelete', { count: selectedIds.size })}
        confirmText={t('deleteSelected', { count: selectedIds.size })}
        cancelText={t('form.cancel')}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};
