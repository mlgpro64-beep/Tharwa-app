import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

const resources = {
  ar: {
    translation: arTranslations
  },
  en: {
    translation: enTranslations
  }
};

// Initialize i18n synchronously to prevent null errors
const initPromise = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    react: {
      useSuspense: false // Disable suspense to prevent null errors
    }
  });

// Ensure i18n is ready before exporting
if (!i18n.isInitialized) {
  initPromise.catch(console.error);
}

export const isRTL = () => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(i18n.language);
};

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
};

const updateDirection = () => {
  document.documentElement.lang = i18n.language;
  document.documentElement.dir = isRTL() ? 'rtl' : 'ltr';
};

i18n.on('languageChanged', () => {
  updateDirection();
});

updateDirection();

export default i18n;
