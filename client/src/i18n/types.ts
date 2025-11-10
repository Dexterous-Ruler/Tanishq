/**
 * Supported languages in Arogya Vault
 * All translations are bundled with the app for offline support
 */
export type LanguageCode = 
  | 'en'  // English
  | 'hi'; // Hindi (हिंदी)

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

