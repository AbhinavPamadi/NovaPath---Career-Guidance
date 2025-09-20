import { NextRequest, NextResponse } from 'next/server';

// In a production environment, you would use the official Google Translate API
// For now, we'll implement a simple translation service using google-translate-api-x
const translate = require('google-translate-api-x');

export async function POST(request: NextRequest) {
  let requestBody: { text?: string; targetLanguage?: string; sourceLanguage?: string } = {};
  
  try {
    requestBody = await request.json();
    const { text, targetLanguage, sourceLanguage = 'en' } = requestBody;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // If target is English, return the original text
    if (targetLanguage === 'en') {
      return NextResponse.json({ translatedText: text });
    }

    // Perform translation
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
    
    // Return original text if translation fails
    // Use the text from the already parsed requestBody instead of trying to parse again
    const fallbackText = requestBody.text || '';
    return NextResponse.json(
      { 
        translatedText: fallbackText,
        error: 'Translation service temporarily unavailable'
      },
      { status: 200 } // Return 200 with original text instead of error
    );
  }
}
