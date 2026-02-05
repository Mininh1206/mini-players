import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { en } from './locales/en';
import { es } from './locales/es';

export type Language = 'en' | 'es';
export type TranslationKey = keyof typeof en;

const translations = { en, es };

interface TranslationContextType {
    t: (key: TranslationKey | string) => string;
    lang: Language;
    changeLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLang] = useState<Language>('en');

    useEffect(() => {
        // Safe check for window existence (though this is client-only)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang');
            if (urlLang === 'es' || urlLang === 'en') {
                setLang(urlLang);
            }
        }
    }, []);

    const changeLanguage = useCallback((newLang: Language) => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', newLang);
            window.history.pushState({}, '', url.toString());
        }
        setLang(newLang);
    }, []);

    const t = useCallback((key: TranslationKey | string) => {
        // Handle nested keys or just simple keys
        // The current structure is flat, so simple access is fine.
        const text = (translations[lang] as any)[key];
        return text || key; 
    }, [lang]);

    const value = { t, lang, changeLanguage };

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
