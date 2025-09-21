import { NextRequest, NextResponse } from 'next/server';

// In a production environment, you would use the official Google Translate API
// For now, we'll implement a simple translation service using google-translate-api-x
const translate = require('google-translate-api-x');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLanguage, sourceLanguage = 'en' } = body;

    if (!targetLanguage) {
      return NextResponse.json(
        { error: 'Target language is required' },
        { status: 400 }
      );
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      if (texts.length === 0) {
        return NextResponse.json({ translatedTexts: [] });
      }

      // If target is English, return the original texts
      if (targetLanguage === 'en') {
        return NextResponse.json({ translatedTexts: texts });
      }

      try {
        // Translate each text in the batch
        const translatedTexts = await Promise.all(
          texts.map(async (text: string) => {
            if (!text.trim()) return text;
            
            const result = await translate(text, { 
              from: sourceLanguage, 
              to: targetLanguage 
            });
            return result.text;
          })
        );

        return NextResponse.json({ 
          translatedTexts,
          originalTexts: texts,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage
        });
      } catch (error) {
        console.error('Batch translation error:', error);
        // Return original texts as fallback
        return NextResponse.json({ 
          translatedTexts: texts,
          originalTexts: texts,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage
        });
      }
    }

    // Handle single text translation
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for single translation' },
        { status: 400 }
      );
    }

    // If target is English, return the original text
    if (targetLanguage === 'en') {
      return NextResponse.json({ translatedText: text });
    }

    // Perform single translation
    const result = await translate(text, { 
      from: sourceLanguage, 
      to: targetLanguage 
    });

    return NextResponse.json({ 
      translatedText: result.text,
      originalText: text,
      sourceLanguage: result.from.language.iso,
      targetLanguage: targetLanguage
    });

  } catch (error) {
    console.error('Translation API error:', error);
    
    // Return a proper error response
    return NextResponse.json(
      { 
        error: 'Translation service temporarily unavailable',
        translatedText: '',
        translatedTexts: [],
        originalText: '',
        originalTexts: [],
        sourceLanguage: 'en',
        targetLanguage: 'en'
      },
      { status: 500 }
    );
  }
}
