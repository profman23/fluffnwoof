import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: 'ar' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    updateDocumentAttributes(lang);
  };

  const updateDocumentAttributes = (lang: 'ar' | 'en') => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.style.textAlign = lang === 'ar' ? 'right' : 'left';
  };

  useEffect(() => {
    updateDocumentAttributes(i18n.language as 'ar' | 'en');
  }, [i18n.language]);

  return {
    currentLanguage: i18n.language as 'ar' | 'en',
    changeLanguage,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
    isRTL: i18n.language === 'ar',
  };
};
