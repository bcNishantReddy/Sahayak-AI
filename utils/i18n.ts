import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';
import ar from '../locales/ar.json';

// Available languages
export const languages = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
};

// Resources object
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ja: { translation: ja },
  ar: { translation: ar },
};

// Language detection - simplified without expo-localization
const getDefaultLanguage = () => {
  // Always default to English for now
  return 'en';
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDefaultLanguage(),
    fallbackLng: 'en',
    debug: false, // Set to false to avoid console spam
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // Disable Suspense for React Native
    },
  });

// Language persistence
const LANGUAGE_KEY = '@app_language';

export const setLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error setting language:', error);
  }
};

export const getStoredLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return storedLanguage || getDefaultLanguage();
  } catch (error) {
    console.error('Error getting stored language:', error);
    return getDefaultLanguage();
  }
};

export const initializeLanguage = async () => {
  try {
    const storedLanguage = await getStoredLanguage();
    await i18n.changeLanguage(storedLanguage);
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

export default i18n; 