import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';
import msTranslation from './locales/ms/translation.json';
import taTranslation from './locales/ta/translation.json';

const resources = {
  en: {
    translation: enTranslation
  },
  zh: {
    translation: zhTranslation
  },
  ms: {
    translation: msTranslation
  },
  ta: {
    translation: taTranslation
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'elderlyUI_language'
    },

    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;