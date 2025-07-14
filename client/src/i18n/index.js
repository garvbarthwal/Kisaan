import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enTranslations from './translations/en.json';
import hiTranslations from './translations/hi.json';
import bnTranslations from './translations/bn.json';
import teTranslations from './translations/te.json';
import mrTranslations from './translations/mr.json';
import taTranslations from './translations/ta.json';
import guTranslations from './translations/gu.json';
import knTranslations from './translations/kn.json';
import mlTranslations from './translations/ml.json';
import paTranslations from './translations/pa.json';
import orTranslations from './translations/or.json';
import asTranslations from './translations/as.json';
import urTranslations from './translations/ur.json';

// Translation resources
const resources = {
    en: { translation: enTranslations },
    hi: { translation: hiTranslations },
    bn: { translation: bnTranslations },
    te: { translation: teTranslations },
    mr: { translation: mrTranslations },
    ta: { translation: taTranslations },
    gu: { translation: guTranslations },
    kn: { translation: knTranslations },
    ml: { translation: mlTranslations },
    pa: { translation: paTranslations },
    or: { translation: orTranslations },
    as: { translation: asTranslations },
    ur: { translation: urTranslations }
};

// Custom language detector options
const languageDetectorOptions = {
    // Order and from where user language should be detected
    order: ['localStorage', 'navigator', 'htmlTag'],

    // Keys or params to lookup language from
    lookupLocalStorage: 'kisaan_language',

    // Cache user language on
    caches: ['localStorage'],

    // Optional set cookie expiration
    cookieMinutes: 10080, // 7 days

    // Optional htmlTag with lang attribute
    htmlTag: document.documentElement
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,

        // Language detector options
        detection: languageDetectorOptions,

        // Fallback language
        fallbackLng: 'en',

        // Disable debug in production
        debug: import.meta.env?.DEV || false,

        // Interpolation options
        interpolation: {
            escapeValue: false // React already does escaping
        },

        // React i18next options
        react: {
            useSuspense: false // Disable suspense to avoid loading issues
        }
    });

// Sync with Redux language state
export const syncLanguageWithRedux = (currentLanguage) => {
    if (i18n.language !== currentLanguage) {
        i18n.changeLanguage(currentLanguage);
    }
};

export default i18n;
