# Translation Feature Setup

## Overview
The Translation feature provides multi-language support for Hindi, Urdu, and English, making the NovaPath application accessible to a broader audience in India.

## Features
- **Real-time Translation**: Text is translated automatically when users switch languages
- **Language Persistence**: User's language preference is saved in localStorage
- **Translation Caching**: Translations are cached to improve performance and reduce API calls
- **Fallback Support**: If translation fails, original text is displayed
- **Loading States**: Visual feedback during translation process

## Supported Languages
- **English (en)** - English (Default)
- **Hindi (hi)** - हिंदी
- **Urdu (ur)** - اردو

## Implementation Details

### Components Created
1. **Language Context** (`src/contexts/language-context.tsx`)
   - Manages global language state
   - Provides translation functionality
   - Handles caching and persistence

2. **Translation Hook** (`src/hooks/use-translation.tsx`)
   - `useTranslation()` - For single text translation
   - `useTranslations()` - For batch text translation
   - `<Translate>` - Component wrapper for easy translation

3. **Language Selector** (`src/components/layout/language-selector.tsx`)
   - Dropdown menu in header for language selection
   - Shows current language indicator
   - Mobile-friendly design

4. **API Route** (`src/app/api/translate/route.ts`)
   - Server-side translation using Google Translate API
   - Error handling and fallback support

### Usage Examples

#### Basic Translation Component
```tsx
import { Translate } from '@/hooks/use-translation';

<Translate text="Welcome to NovaPath" />
```

#### Using Translation Hook
```tsx
import { useTranslation } from '@/hooks/use-translation';

function MyComponent() {
  const { translatedText, isLoading } = useTranslation("Hello World");
  
  return <p>{translatedText}</p>;
}
```

#### Batch Translation
```tsx
import { useTranslations } from '@/hooks/use-translation';

function MyComponent() {
  const texts = ["Hello", "World", "Welcome"];
  const { translatedTexts, isLoading } = useTranslations(texts);
  
  return (
    <div>
      {translatedTexts.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
    </div>
  );
}
```

## File Structure
```
src/
├── contexts/
│   └── language-context.tsx
├── hooks/
│   └── use-translation.tsx
├── components/layout/
│   └── language-selector.tsx
├── app/api/translate/
│   └── route.ts
└── app/
    └── layout.tsx (updated with LanguageProvider)
```

## Key Features
- **Automatic Language Detection**: The browser's language preference is respected
- **Persistent Language Selection**: User's choice is remembered across sessions
- **Performance Optimized**: Translation results are cached to avoid repeated API calls
- **Error Resilient**: Graceful fallback to original text if translation fails
- **Accessibility**: Proper ARIA labels and semantic HTML
- **Mobile Support**: Language selector works on both desktop and mobile

## Translation Service
The implementation uses the `google-translate-api-x` package, which provides free access to Google Translate. For production use, consider upgrading to the official Google Cloud Translation API for better reliability and higher quotas.

## Browser Compatibility
- Modern browsers with ES6+ support
- localStorage support required for language persistence
- Fetch API support required for translations

## Performance Considerations
- Translations are cached in memory during the session
- Debounced translation requests to avoid excessive API calls
- Minimal re-renders through efficient context management
- Lazy loading of translation service

## Accessibility Features
- Screen reader support with proper ARIA labels
- Keyboard navigation support
- High contrast mode compatibility
- Semantic HTML structure
- Clear language indicators

## Future Enhancements
- Offline translation support
- RTL (Right-to-Left) text support for Urdu
- Voice translation features
- Regional dialect support
- Translation quality feedback system
