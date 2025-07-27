import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { initializeLanguage } from '../utils/i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const initLanguage = async () => {
      try {
        await initializeLanguage();
        setCurrentLanguage(i18n.language);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing language:', error);
        setIsInitialized(true);
      }
    };

    initLanguage();
  }, []);

  useEffect(() => {
    const handleLanguageChange = () => {
      setCurrentLanguage(i18n.language);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const getCurrentLanguage = () => {
    return currentLanguage;
  };

  const isRTL = () => {
    return ['ar', 'he', 'fa', 'ur'].includes(currentLanguage);
  };

  const getTextDirection = () => {
    return isRTL() ? 'rtl' : 'ltr';
  };

  return {
    currentLanguage,
    isInitialized,
    isRTL: isRTL(),
    textDirection: getTextDirection(),
    getCurrentLanguage,
  };
}; 