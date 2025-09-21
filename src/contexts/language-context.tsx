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

// Simple translation cache for static content
type StaticTranslations = {
  [language in Language]: {
    [key: string]: string;
  };
};

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string; // Simple translation function
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Static translations - no API calls needed for these
const STATIC_TRANSLATIONS: StaticTranslations = {
  en: {
    // Navigation & UI
    'start_assessment': 'Start Assessment',
    'enhanced_career_discovery': 'Enhanced Career Discovery Quiz',
    'career_discovery_quiz': 'Career Discovery Quiz',
    'level_1_general': 'Level 1: General Assessment',
    'level_2_personalized': 'Level 2: Personalized Assessment', 
    'level_3_subject': 'Level 3: Subject-Specific Assessment',
    'continue_to_personalized': 'Continue to Personalized Assessment',
    'continue_to_subject': 'Continue to Subject Selection',
    'start_subject_quiz': 'Start Subject Quiz',
    'next_question': 'Next Question',
    'complete_quiz': 'Complete Quiz',
    'discover_your_path': 'Discover Your Path',
    'quiz_description': 'Take our advanced three-tier career assessment to get personalized recommendations based on your interests, subjects, and demonstrated skills.',
    
    // Subject names
    'arts': 'Arts',
    'biology': 'Biology', 
    'chemistry': 'Chemistry',
    'cs': 'CS',
    'economics': 'Economics',
    'physics': 'Physics',
    
    // Common UI text
    'loading': 'Loading...',
    'translating': 'Translating...',
    'question': 'Question',
    'complete': 'Complete',
    'estimated_time': 'Estimated time: 20-25 minutes'
  },
  hi: {
    // Navigation & UI
    'start_assessment': 'मूल्यांकन शुरू करें',
    'enhanced_career_discovery': 'उन्नत करियर खोज क्विज़',
    'career_discovery_quiz': 'करियर खोज क्विज़',
    'level_1_general': 'स्तर 1: सामान्य मूल्यांकन',
    'level_2_personalized': 'स्तर 2: व्यक्तिगत मूल्यांकन',
    'level_3_subject': 'स्तर 3: विषय-विशिष्ट मूल्यांकन',
    'continue_to_personalized': 'व्यक्तिगत मूल्यांकन के लिए जारी रखें',
    'continue_to_subject': 'विषय चयन के लिए जारी रखें',
    'start_subject_quiz': 'विषय क्विज़ शुरू करें',
    'next_question': 'अगला प्रश्न',
    'complete_quiz': 'क्विज़ पूरा करें',
    'discover_your_path': 'अपना रास्ता खोजें',
    'quiz_description': 'अपनी रुचियों, विषयों और प्रदर्शित कौशल के आधार पर व्यक्तिगत सिफारिशें प्राप्त करने के लिए हमारा उन्नत तीन-स्तरीय करियर मूल्यांकन लें।',
    
    // Subject names
    'arts': 'कला',
    'biology': 'जीवविज्ञान',
    'chemistry': 'रसायन शास्त्र',
    'cs': 'कंप्यूटर साइंस',
    'economics': 'अर्थशास्त्र',
    'physics': 'भौतिक विज्ञान',
    
    // Common UI text
    'loading': 'लोड हो रहा है...',
    'translating': 'अनुवाद हो रहा है...',
    'question': 'प्रश्न',
    'complete': 'पूर्ण',
    'estimated_time': 'अनुमानित समय: 20-25 मिनट'
  },
  ur: {
    // Navigation & UI
    'start_assessment': 'تشخیص شروع کریں',
    'enhanced_career_discovery': 'بہتر کیریئر دریافت کوز',
    'career_discovery_quiz': 'کیریئر دریافت کوز',
    'level_1_general': 'سطح 1: عمومی تشخیص',
    'level_2_personalized': 'سطح 2: ذاتی تشخیص',
    'level_3_subject': 'سطح 3: مضمون کی خصوصی تشخیص',
    'continue_to_personalized': 'ذاتی تشخیص کے لیے جاری رکھیں',
    'continue_to_subject': 'مضمون کے انتخاب کے لیے جاری رکھیں',
    'start_subject_quiz': 'مضمون کوز شروع کریں',
    'next_question': 'اگلا سوال',
    'complete_quiz': 'کوز مکمل کریں',
    'discover_your_path': 'اپنا راستہ دریافت کریں',
    'quiz_description': 'اپنی دلچسپیوں، مضامین اور ظاہر شدہ مہارت کی بنیاد پر ذاتی سفارشات حاصل کرنے کے لیے ہمارا جدید تین درجہ کیریئر تشخیص لیں۔',
    
    // Subject names
    'arts': 'فنون',
    'biology': 'حیاتیات',
    'chemistry': 'کیمسٹری',
    'cs': 'کمپیوٹر سائنس',
    'economics': 'اقتصادیات',
    'physics': 'طبیعیات',
    
    // Common UI text
    'loading': 'لوڈ ہو رہا ہے...',
    'translating': 'ترجمہ ہو رہا ہے...',
    'question': 'سوال',
    'complete': 'مکمل',
    'estimated_time': 'تخمینی وقت: 20-25 منٹ'
  }
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isTranslating, setIsTranslating] = useState(false);

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

  // Simple static translation function - no API calls
  const t = (key: string): string => {
    const translation = STATIC_TRANSLATIONS[currentLanguage]?.[key];
    return translation || key; // Fallback to key if translation not found
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isTranslating
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
