/**
 * i18next Configuration
 * Uses react-i18next with HTTP backend for dynamic translations
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import English translations as fallback
import enTranslations from './translations/en.json';
import hiTranslations from './translations/hi.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

i18n
  // Load translations using HTTP backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language
    fallbackLng: 'en',
    
    // Default language (always English)
    lng: 'en',
    
    // Supported languages
    supportedLngs: SUPPORTED_LANGUAGES.map(lang => lang.code),
    
    // Default namespace
    defaultNS: 'translation',
    ns: 'translation',
    
    // Resources for offline support (English and Hindi only)
    resources: {
      en: {
        translation: enTranslations,
      },
      hi: {
        translation: hiTranslations,
      },
    },
    
    // Backend configuration
    backend: {
      // Load path for translations
      loadPath: '/api/translations/{{lng}}',
      // Parse response
      parse: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          return parsed.translations || parsed;
        } catch (e) {
          console.error('Failed to parse translation response:', e);
          return {};
        }
      },
      // Request options
      requestOptions: {
        cache: 'default',
      },
    },
    
    // Detection options
    detection: {
      // Order of language detection
      order: ['localStorage', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: 'arogya_vault_language',
      // Cache user language
      caches: ['localStorage'],
      // Don't detect from browser - always default to English
      checkWhitelist: true,
    },
    
    // React i18next options
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Key separator for nested keys (use dot notation)
    keySeparator: '.',
    nsSeparator: ':',
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;

