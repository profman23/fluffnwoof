import fs from 'fs';
import path from 'path';

interface Translations {
  [key: string]: any;
}

const translations: Record<string, Translations> = {
  ar: JSON.parse(
    fs.readFileSync(path.join(__dirname, '../locales/ar.json'), 'utf-8')
  ),
  en: JSON.parse(
    fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf-8')
  ),
};

export const t = (
  key: string,
  lang: string = 'ar',
  params?: Record<string, any>
): string => {
  const keys = key.split('.');
  let translation: any = translations[lang] || translations.ar;

  // Navigate through nested keys
  for (const k of keys) {
    translation = translation?.[k];
    if (!translation) break;
  }

  // Fallback to Arabic if translation not found
  if (!translation) {
    translation = getNestedValue(translations.ar, keys);
  }

  // If still not found, return the key itself
  if (typeof translation !== 'string') {
    return key;
  }

  // Simple interpolation for dynamic values
  if (params) {
    Object.keys(params).forEach((param) => {
      translation = translation.replace(
        new RegExp(`{{${param}}}`, 'g'),
        params[param]
      );
    });
  }

  return translation;
};

const getNestedValue = (obj: any, keys: string[]): any => {
  return keys.reduce((current, key) => current?.[key], obj);
};
