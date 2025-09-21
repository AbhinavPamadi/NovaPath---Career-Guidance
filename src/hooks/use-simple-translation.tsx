'use client';

import { useLanguage } from '@/contexts/language-context';

// Simple translation hook that uses static translations only
export function useSimpleTranslation() {
  const { t, currentLanguage } = useLanguage();
  
  return {
    t,
    currentLanguage,
    isLoading: false // Never loading since it's static
  };
}

// Simple component wrapper for translation
interface SimpleTranslateProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  [key: string]: any;
}

export function SimpleTranslate({ 
  text, 
  as: Component = 'span', 
  className,
  ...props 
}: SimpleTranslateProps) {
  const { t } = useLanguage();
  
  return (
    <Component className={className} {...props}>
      {t(text)}
    </Component>
  );
}
