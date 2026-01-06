import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enDashboard from '@/locales/en/dashboard.json';
import enForms from '@/locales/en/forms.json';
import enMarketing from '@/locales/en/marketing.json';

// Import German translations
import deCommon from '@/locales/de/common.json';
import deAuth from '@/locales/de/auth.json';
import deDashboard from '@/locales/de/dashboard.json';
import deForms from '@/locales/de/forms.json';
import deMarketing from '@/locales/de/marketing.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    forms: enForms,
    marketing: enMarketing,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    dashboard: deDashboard,
    forms: deForms,
    marketing: deMarketing,
  }
};

i18n
  .use(LanguageDetector) // Detects user language from browser
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Use English if detected language is not available
    defaultNS: 'common', // Default namespace
    ns: ['common', 'auth', 'dashboard', 'forms', 'marketing'], // Available namespaces

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
