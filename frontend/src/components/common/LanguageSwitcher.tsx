import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
    changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
      aria-label="Switch Language"
    >
      {currentLanguage === 'ar' ? 'EN' : 'AR'}
    </button>
  );
};
