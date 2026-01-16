import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi, ServiceProduct } from '../../api/serviceProducts';

export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ServiceProductSelectorProps {
  selectedItems: SelectedItem[];
  onItemsChange: (items: SelectedItem[]) => void;
  disabled?: boolean;
}

export const ServiceProductSelector = ({
  selectedItems,
  onItemsChange,
  disabled = false,
}: ServiceProductSelectorProps) => {
  const { t } = useTranslation('flowBoard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search for products
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await serviceProductsApi.getAll({
          search: searchQuery,
          limit: 10,
        });
        // Filter out already selected items
        const filtered = result.data.filter(
          (p) => !selectedItems.some((s) => s.id === p.id)
        );
        setSearchResults(filtered);
        setShowDropdown(true);
      } catch (err) {
        console.error('Failed to search products:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedItems]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: ServiceProduct) => {
    const newItem: SelectedItem = {
      id: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: Number(product.priceAfterTax) || 0,
      totalPrice: Number(product.priceAfterTax) || 0,
    };
    onItemsChange([...selectedItems, newItem]);
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = selectedItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    );
    onItemsChange(updatedItems);
  };

  const handleRemoveItem = (itemId: string) => {
    onItemsChange(selectedItems.filter((item) => item.id !== itemId));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchServiceProduct')}
            disabled={disabled}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center border-b last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.category?.name}</div>
                </div>
                <div className="text-sm font-medium text-green-600">
                  {Number(product.priceAfterTax || 0).toFixed(2)} SAR
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            {t('noProductsFound')}
          </div>
        )}
      </div>

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('item')}
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-24">
                  {t('quantity')}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">
                  {t('price')}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">
                  {t('total')}
                </th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {selectedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={disabled || item.quantity <= 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={disabled}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 text-right">
                    {Number(item.unitPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                    {Number(item.totalPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={disabled}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                  {t('totalAmount')}:
                </td>
                <td className="px-3 py-2 text-right text-sm font-bold text-green-600">
                  {Number(totalAmount || 0).toFixed(2)} SAR
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {selectedItems.length === 0 && (
        <div className="text-center py-6 text-gray-400 border border-dashed border-gray-300 rounded-lg">
          {t('noItemsSelected')}
        </div>
      )}
    </div>
  );
};
