import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from '../../public/locales/en/translation.json';
import translationSI from '../../public/locales/si/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  si: {
    translation: translationSI,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
