import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { MagnifyingGlassIcon, XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi, ServiceProduct } from '../../api/serviceProducts';
import { SarSymbol } from '../common/SarSymbol';

export interface SelectedItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  priceBeforeTax: number;
  taxRate: number;
  discount: number; // Percentage discount (0-100)
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
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
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
          limit: 30,
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

  // Calculate dropdown position based on input element
  const updateDropdownPos = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Update position when dropdown opens or window scrolls/resizes
  useEffect(() => {
    if (!showDropdown) return;
    updateDropdownPos();

    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [showDropdown, updateDropdownPos]);

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

  // Prevent modal scroll when scrolling inside dropdown
  useEffect(() => {
    const dropdown = dropdownRef.current;
    if (!dropdown || !showDropdown) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.scrollTop += e.deltaY;
    };

    dropdown.addEventListener('wheel', handleWheel, { passive: false });
    return () => dropdown.removeEventListener('wheel', handleWheel);
  }, [showDropdown, searchResults]);

  const handleSelectProduct = (product: ServiceProduct) => {
    const priceBeforeTax = Number(product.priceBeforeTax) || 0;
    const taxRate = Number(product.taxRate) ?? 15;
    const unitPrice = Number(product.priceAfterTax) || 0;
    const newItem: SelectedItem = {
      id: product.id,
      name: product.name,
      quantity: 1,
      unitPrice,
      priceBeforeTax,
      taxRate,
      discount: 0,
      totalPrice: priceBeforeTax * (1 + taxRate / 100),
    };
    onItemsChange([...selectedItems, newItem]);
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Calculate total price: discount on priceBeforeTax, then apply tax
  const calculateTotalPrice = (priceBeforeTax: number, quantity: number, discount: number, taxRate: number) => {
    const discountedPrice = priceBeforeTax * (1 - discount / 100);
    return quantity * discountedPrice * (1 + taxRate / 100);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedItems = selectedItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, totalPrice: calculateTotalPrice(item.priceBeforeTax, newQuantity, item.discount, item.taxRate) }
        : item
    );
    onItemsChange(updatedItems);
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    // Clamp discount between 0 and 100
    const discount = Math.max(0, Math.min(100, newDiscount));
    const updatedItems = selectedItems.map((item) =>
      item.id === itemId
        ? { ...item, discount, totalPrice: calculateTotalPrice(item.priceBeforeTax, item.quantity, discount, item.taxRate) }
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

        {/* Search Results Dropdown - rendered via portal to avoid modal overflow clipping */}
        {showDropdown && searchResults.length > 0 && createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="bg-white dark:bg-[var(--app-bg-card)] border border-gray-200 dark:border-[var(--app-border-default)] rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center border-b last:border-b-0"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">{product.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>{product.category?.name}</span>
                    {product.daftraCode && <span className="text-blue-500">#{product.daftraCode}</span>}
                    {product.barcode && <span className="text-purple-500">{product.barcode}</span>}
                  </div>
                </div>
                <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                  {Number(product.priceAfterTax || 0).toFixed(2)} <SarSymbol className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>,
          document.body
        )}

        {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            {t('noProductsFound')}
          </div>
        )}
      </div>

      {/* Selected Items List */}
      {selectedItems.length > 0 && (
        <div className="border border-gray-200 dark:border-[var(--app-border-default)] rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-auto" />
              <col style={{ width: '70px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '65px' }} />
              <col style={{ width: '70px' }} />
              <col style={{ width: '85px' }} />
              <col style={{ width: '85px' }} />
              <col style={{ width: '32px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-750 border-b-2 border-slate-200 dark:border-gray-600">
                <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('item')}
                </th>
                <th className="px-1 py-3 text-center text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('quantity')}
                </th>
                <th className="px-1 py-3 text-center text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="px-1 py-3 text-center text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50/60 dark:bg-green-900/10 border-x border-green-200/60 dark:border-green-800/30">
                  {t('discount')}
                </th>
                <th className="px-1 py-3 text-center text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-wider">
                  {t('tax')}
                </th>
                <th className="px-1 py-3 text-center text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider border-l border-slate-200/60 dark:border-gray-600/50">
                  {t('totalBeforeTax')}
                </th>
                <th className="px-1 py-3 text-center text-[11px] font-bold text-emerald-600 dark:text-green-400 uppercase tracking-wider bg-emerald-50/40 dark:bg-green-900/10">
                  {t('totalAfterTax')}
                </th>
                <th className="px-1 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {selectedItems.map((item) => {
                const totalBeforeVat = item.quantity * item.priceBeforeTax * (1 - item.discount / 100);
                const vatAmount = totalBeforeVat * (item.taxRate / 100);
                const totalAfterVat = totalBeforeVat + vatAmount;
                const hasDiscount = item.discount > 0;
                return (
                  <tr key={item.id} className={`transition-colors ${hasDiscount ? 'bg-green-50/40 dark:bg-green-900/5 hover:bg-green-50/70' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-[var(--app-text-primary)] truncate" title={item.name}>{item.name}</td>
                    <td className="px-1 py-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={disabled || item.quantity <= 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={disabled}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-1 py-2 text-sm text-gray-600 dark:text-gray-300 text-center">
                      {Number(item.priceBeforeTax || 0).toFixed(2)}
                    </td>
                    <td className="px-1 py-2 bg-green-50/60 dark:bg-green-900/10 border-x border-green-200/60 dark:border-green-800/30">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount || 0}
                          onChange={(e) => handleDiscountChange(item.id, parseFloat(e.target.value) || 0)}
                          disabled={disabled}
                          className="w-10 px-0.5 py-1 text-center text-sm font-medium text-green-700 dark:text-green-400 border border-green-300 dark:border-green-600 rounded bg-white dark:bg-gray-800 focus:ring-1 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                        />
                        <span className="text-xs text-green-600 dark:text-green-400 ml-0.5 font-medium">%</span>
                      </div>
                    </td>
                    <td className="px-1 py-2 text-sm text-orange-500 dark:text-orange-400 text-center">
                      {vatAmount.toFixed(2)}
                    </td>
                    <td className="px-1 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 text-center border-l border-slate-200/60 dark:border-gray-600/50">
                      {totalBeforeVat.toFixed(2)}
                    </td>
                    <td className="px-1 py-2 text-sm font-bold text-emerald-600 dark:text-green-400 text-center bg-emerald-50/40 dark:bg-green-900/10">
                      {totalAfterVat.toFixed(2)}
                    </td>
                    <td className="px-1 py-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={disabled}
                        className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-750 border-t-2 border-slate-200 dark:border-gray-600">
                <td colSpan={6} className="px-3 py-3 text-right text-sm font-bold text-slate-600 dark:text-gray-300 uppercase tracking-wide">
                  {t('totalAmount')}:
                </td>
                <td className="px-1 py-3 text-center text-sm font-bold text-emerald-600 dark:text-green-400 bg-emerald-50/40 dark:bg-green-900/10">
                  <span className="inline-flex items-center gap-1">{Number(totalAmount || 0).toFixed(2)} <SarSymbol className="w-3.5 h-3.5" /></span>
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
