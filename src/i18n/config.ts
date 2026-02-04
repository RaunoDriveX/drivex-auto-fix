import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enForms from '@/locales/en/forms.json';
import enMarketing from '@/locales/en/marketing.json';
import enShop from '@/locales/en/shop.json';
import enInsurer from '@/locales/en/insurer.json';

// Import German translations
import deCommon from '@/locales/de/common.json';
import deAuth from '@/locales/de/auth.json';
import deForms from '@/locales/de/forms.json';
import deMarketing from '@/locales/de/marketing.json';
import deShop from '@/locales/de/shop.json';
import deInsurer from '@/locales/de/insurer.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    forms: enForms,
    marketing: enMarketing,
    shop: enShop,
    insurer: enInsurer,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    forms: deForms,
    marketing: deMarketing,
    shop: deShop,
    insurer: deInsurer,
  }
};

i18n
  .use(LanguageDetector) // Detects user language from browser
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Use English if detected language is not available
    defaultNS: 'common', // Default namespace
    ns: ['common', 'auth', 'forms', 'marketing', 'shop', 'insurer'], // Available namespaces

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // Cache user language preference
    }
  });

export default i18n;
