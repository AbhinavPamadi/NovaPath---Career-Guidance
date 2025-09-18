'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';

// Custom hook for translating text with automatic updates when language changes
export function useTranslation(text: string, dependencies: any[] = []) {
  const { currentLanguage, translate, isTranslating } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const performTranslation = async () => {
      if (!text.trim()) {
        setTranslatedText(text);
        return;
      }

      setIsLoading(true);
      
      try {
        const result = await translate(text, currentLanguage);
        if (!isCancelled) {
          setTranslatedText(result);
        }
      } catch (error) {
        console.error('Translation error in hook:', error);
        if (!isCancelled) {
          setTranslatedText(text); // Fallback to original text
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    performTranslation();

    return () => {
      isCancelled = true;
    };
  }, [text, currentLanguage, translate, ...dependencies]);

  return {
    translatedText,
    isLoading: isLoading || isTranslating,
    originalText: text
  };
}

// Hook for translating multiple texts at once
export function useTranslations(texts: string[], dependencies: any[] = []) {
  const { currentLanguage, translate, isTranslating } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const performTranslations = async () => {
      if (texts.length === 0) {
        setTranslatedTexts([]);
        return;
      }

      setIsLoading(true);
      
      try {
        const results = await Promise.all(
          texts.map(text => translate(text, currentLanguage))
        );
        
        if (!isCancelled) {
          setTranslatedTexts(results);
        }
      } catch (error) {
        console.error('Batch translation error:', error);
        if (!isCancelled) {
          setTranslatedTexts(texts); // Fallback to original texts
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    performTranslations();

    return () => {
      isCancelled = true;
    };
  }, [texts.join('|'), currentLanguage, translate, ...dependencies]);

  return {
    translatedTexts,
    isLoading: isLoading || isTranslating,
    originalTexts: texts
  };
}

// Component wrapper for easy translation
interface TranslateProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  dependencies?: any[];
  fallback?: string;
}

export function Translate({ 
  text, 
  as: Component = 'span', 
  className,
  dependencies = [],
  fallback,
  ...props 
}: TranslateProps) {
  const { translatedText, isLoading } = useTranslation(text, dependencies);
  
  const displayText = isLoading && fallback ? fallback : translatedText;
  
  return (
    <Component className={className} {...props}>
      {displayText}
    </Component>
  );
}
