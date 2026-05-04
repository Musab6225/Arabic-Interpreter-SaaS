import React, { createContext, useContext, useState } from 'react';
import { I18nManager } from 'react-native';

const translations = {
  en: { search: 'Search', glossary: 'Glossary', settings: 'Settings', noResults: 'No results found', searchPlaceholder: 'Search terms...' },
  ar: { search: '[بحث]{dir="rtl"}', glossary: '[المصطلحات]{dir="rtl"}', settings: '[الإعدادات]{dir="rtl"}', noResults: '[لم يتم العثور على نتائج]{dir="rtl"}', searchPlaceholder: '[ابحث عن المصطلحات]{dir="rtl"}...' }
};

const LanguageContext = createContext(undefined);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const t = (key) => translations[language][key] || key;
  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, isRTL, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}