'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language types supported
export type Language = 'en' | 'hi' | 'ur';

// Language options
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
} as const;

// Translation cache type
type TranslationCache = {
  [key: string]: {
    [language in Language]?: string;
  };
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  translate: (text: string, targetLanguage?: Language) => Promise<string>;
  isTranslating: boolean;
  translationCache: TranslationCache;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && Object.keys(LANGUAGES).includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  };

  const translate = async (text: string, targetLanguage?: Language): Promise<string> => {
    const target = targetLanguage || currentLanguage;
    
    // Return original text if target is English or text is empty
    if (target === 'en' || !text.trim()) {
      return text;
    }

    // Check cache first
    const cacheKey = text.toLowerCase().trim();
    if (translationCache[cacheKey]?.[target]) {
      return translationCache[cacheKey][target]!;
    }

    setIsTranslating(true);
    
    try {
      // Use Google Translate API through our API route
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: target,
          sourceLanguage: 'en'
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translatedText || text;

      // Update cache
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: {
          ...prev[cacheKey],
          [target]: translatedText
        }
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    } finally {
      setIsTranslating(false);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    translate,
    isTranslating,
    translationCache
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
