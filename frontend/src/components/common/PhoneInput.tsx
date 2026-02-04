/**
 * Phone Input Component
 * International phone input with country code selector and flags
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  countries,
  Country,
  defaultCountry,
  searchCountries,
  parsePhoneNumber,
} from '../../data/countryCodes';

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string, dialCode: string, number: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label,
  error,
  required,
  disabled,
  placeholder,
}) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Parse initial value
  const parsed = useMemo(() => parsePhoneNumber(value || ''), [value]);

  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find(c => c.dialCode === parsed.dialCode) || defaultCountry
  );
  const [phoneNumber, setPhoneNumber] = useState(parsed.number);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    return searchCountries(searchQuery);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isDropdownOpen]);

  // Update parent when country or phone changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(newNumber);
    onChange(`${selectedCountry.dialCode}${newNumber}`, selectedCountry.dialCode, newNumber);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery('');
    onChange(`${country.dialCode}${phoneNumber}`, country.dialCode, phoneNumber);
    inputRef.current?.focus();
  };

  const getCountryLabel = (country: Country) => {
    return isRtl ? country.nameAr : country.nameEn;
  };

  // Get flag image URL from flagcdn.com (SVG flags work on all platforms including Windows)
  const getFlagUrl = (countryCode: string) => {
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
          📱 {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex gap-2" dir="ltr">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-3 py-2.5 border rounded-lg bg-white
              dark:bg-[var(--app-bg-elevated)]
              min-w-[130px] justify-between
              transition-all duration-200
              ${disabled
                ? 'bg-gray-100 dark:bg-[var(--app-bg-tertiary)] cursor-not-allowed opacity-60'
                : 'hover:border-primary-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
              }
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-[var(--app-border-default)]'}
              ${isDropdownOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
            `}
          >
            <img
              src={getFlagUrl(selectedCountry.code)}
              alt={selectedCountry.nameEn}
              className="w-6 h-4 object-cover rounded-sm shadow-sm"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)]">{selectedCountry.dialCode}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-[var(--app-bg-card)] border border-gray-200 dark:border-[var(--app-border-default)] rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/50 z-[110] overflow-hidden animate-fadeIn">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-100 dark:border-[var(--app-border-default)]">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRtl ? 'ابحث عن دولة...' : 'Search country...'}
                    className="w-full px-3 py-2 ps-9 border border-gray-200 dark:border-[var(--app-border-default)] rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] dark:placeholder-gray-500"
                    dir={isRtl ? 'rtl' : 'ltr'}
                  />
                  <svg
                    className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Countries List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                    {isRtl ? 'لا توجد نتائج' : 'No results found'}
                  </div>
                ) : (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 text-start
                        transition-colors hover:bg-primary-50 dark:hover:bg-[var(--app-bg-elevated)]
                        ${selectedCountry.code === country.code ? 'bg-primary-50 dark:bg-primary-900/30' : ''}
                      `}
                    >
                      <img
                        src={getFlagUrl(country.code)}
                        alt={country.nameEn}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                      />
                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)]" dir={isRtl ? 'rtl' : 'ltr'}>
                        {getCountryLabel(country)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{country.dialCode}</span>
                      {selectedCountry.code === country.code && (
                        <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Gulf Countries Separator */}
              {!searchQuery && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] border-t border-gray-100 dark:border-[var(--app-border-default)] text-xs text-gray-500 dark:text-gray-400">
                  {isRtl ? '✨ دول الخليج في المقدمة' : '✨ Gulf countries prioritized'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || (isRtl ? '5XXXXXXXX' : '5XXXXXXXX')}
          disabled={disabled}
          className={`
            flex-1 px-4 py-2.5 border rounded-lg
            transition-all duration-200
            dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]
            ${disabled
              ? 'bg-gray-100 dark:bg-[var(--app-bg-tertiary)] cursor-not-allowed opacity-60'
              : 'hover:border-primary-400 dark:hover:border-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            }
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-[var(--app-border-default)]'}
          `}
          dir="ltr"
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
