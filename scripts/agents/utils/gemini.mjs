/**
 * Gemini API Utilities
 * Für OCR/Vision und Image Generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from './env.mjs';
import fetch from 'node-fetch';

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY || '');

/**
 * PDF-Extraktion mit Gemini 2.5 Pro
 * Direkte PDF-Verarbeitung ohne JPEG-Konvertierung
 */
async function performOCRWithGemini(fileUrl) {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nicht gesetzt');
  }

  try {
    console.log(`🔍 Starte PDF-Extraktion mit Gemini 2.5 Pro für ${fileUrl}...`);

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Fehler beim Laden der Datei: ${fileResponse.statusText}`);
    }

    const contentType = fileResponse.headers.get('content-type') || '';
    const isPDF = contentType.includes('pdf') || fileUrl.toLowerCase().endsWith('.pdf');
    
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBase64 = Buffer.from(fileBuffer).toString('base64');
    
    // Versuche Gemini 2.5 Pro, fallback auf 1.5 Pro Vision
    const modelsToTry = [
      'gemini-2.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
    ];

    let extractedText = '';
    let pages = 1;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`📄 Versuche Modell: ${modelName}...`);
        
        const model = genAI.getGenerativeModel({ 
          model: modelName,
        });

        const mimeType = isPDF ? 'application/pdf' : contentType || 'image/jpeg';
        
        const prompt = `Analysiere dieses Dokument vollständig und extrahiere ALLEN Text, alle Aufgaben, Fragen, Antworten und Zahlen.

WICHTIG:
- Extrahiere den Text genau so, wie er im Dokument erscheint
- Behalte die Struktur bei (Überschriften, Absätze, Listen)
- Erkenne alle Lernaufgaben und Übungen
- Erkenne die Art des Arbeitsblatts (z.B. Mathematik-Übungen, Deutsch-Aufgaben, etc.)
- Erkenne die Aufgabenformate (Multiple-Choice, Lückentext, Zuordnung, etc.)
- Erkenne Lösungen und Antworten wenn vorhanden

Gib den vollständigen Text zurück, strukturiert und vollständig.`;

        const result = await model.generateContent([
          {
            inlineData: {
              data: fileBase64,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ]);

        const response = await result.response;
        extractedText = response.text();
        
        // Schätze Seitenzahl basierend auf Textlänge
        pages = Math.max(1, Math.ceil(extractedText.length / 2000));
        
        console.log(`✅ Gemini ${modelName} Text extrahiert: ${extractedText.length} Zeichen, geschätzt ${pages} Seiten`);
        break; // Erfolg, breche ab
      } catch (modelError) {
        console.warn(`⚠️ Modell ${modelName} nicht verfügbar:`, modelError.message);
        lastError = modelError;
        continue;
      }
    }

    if (!extractedText) {
      throw lastError || new Error('Alle Gemini-Modelle fehlgeschlagen');
    }

    // Confidence basierend auf Textlänge und Qualität
    const confidence = extractedText.length > 200 ? 0.95 : extractedText.length > 50 ? 0.85 : 0.7;

    console.log(`✅ Gemini OCR abgeschlossen: ${extractedText.length} Zeichen extrahiert, ${pages} Seiten`);

    return {
      text: extractedText,
      confidence,
      pages,
      mimeType: isPDF ? 'application/pdf' : contentType,
      method: 'gemini',
    };
  } catch (error) {
    console.error('❌ Fehler bei Gemini OCR:', error);
    throw new Error(`Gemini OCR-Fehler: ${error.message}`);
  }
}

/**
 * OCR mit Gemini 2.5 Pro oder GPT-5 für bessere PDF-Verarbeitung
 * Analysiert PDF direkt ohne JPEG-Konvertierung
 * Verwendet Gemini 2.5 Pro als primäres Modell (kostenlos/kostengünstig mit Google)
 * Fallback auf GPT-5 oder GPT-4o falls Gemini nicht verfügbar
 */
export async function performOCR(fileUrl) {
  // Versuche zuerst Gemini 2.5 Pro (kostenlos/kostengünstig, gute PDF-Unterstützung)
  if (ENV.GEMINI_API_KEY) {
    try {
      return await performOCRWithGemini(fileUrl);
    } catch (geminiError) {
      console.warn('⚠️ Gemini OCR fehlgeschlagen, versuche Fallback:', geminiError.message);
      // Fallback auf OpenAI
    }
  }

  // Fallback: OpenAI GPT-5 oder GPT-4o
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: ENV.OPENAI_API_KEY || '',
  });

  if (!ENV.OPENAI_API_KEY) {
    throw new Error('Weder GEMINI_API_KEY noch OPENAI_API_KEY gesetzt');
  }

  try {
    console.log(`🔍 Starte OCR mit GPT-4 Vision für ${fileUrl}...`);

    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Fehler beim Laden der Datei: ${fileResponse.statusText}`);
    }

    const contentType = fileResponse.headers.get('content-type') || '';
    const isPDF = contentType.includes('pdf') || fileUrl.toLowerCase().endsWith('.pdf');
    
    let extractedText = '';
    let pages = 1;

    if (isPDF) {
      // Für PDFs: Verwende pdf-parse für Text-PDFs, GPT-4 Vision für Bild-PDFs
      console.log('📄 PDF erkannt - versuche Text-Extraktion...');
      
      try {
        const pdf = (await import('pdf-parse')).default;
        const pdfBuffer = await fileResponse.arrayBuffer();
        const pdfData = await pdf(Buffer.from(pdfBuffer));
        
        extractedText = pdfData.text;
        pages = pdfData.numpages;
        
        console.log(`✅ PDF-Text extrahiert: ${extractedText.length} Zeichen, ${pages} Seiten`);
        
        // Falls wenig Text extrahiert wurde, könnte es ein Bild-PDF sein
        if (extractedText.length < 200 && pages > 0) {
          console.log('⚠️ Wenig Text extrahiert - könnte ein Bild-PDF sein. Verwende GPT-4 Vision für erste Seite...');
          // Verwende GPT-4 Vision für erste Seite
          const imageBuffer = await fileResponse.arrayBuffer();
          const imageBase64 = Buffer.from(imageBuffer).toString('base64');
          
          const visionResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Extrahiere ALLEN Text aus diesem PDF-Dokument. Gib den kompletten Text zurück, so wie er auf dem Dokument erscheint. Erhalte die Struktur und alle Details.`,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:application/pdf;base64,${imageBase64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 4000,
          });
          
          const visionText = visionResponse.choices[0]?.message?.content || '';
          if (visionText.length > extractedText.length) {
            extractedText = visionText;
            console.log(`✅ GPT-4 Vision Text extrahiert: ${extractedText.length} Zeichen`);
          }
        }
      } catch (pdfError) {
        console.warn('⚠️ pdf-parse fehlgeschlagen, verwende GPT-4 Vision...', pdfError.message);
        // Fallback: Verwende GPT-4 Vision direkt
        const imageBuffer = await fileResponse.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString('base64');
        
        const visionResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extrahiere ALLEN Text aus diesem PDF-Dokument. Gib den kompletten Text zurück, so wie er auf dem Dokument erscheint. Erhalte die Struktur, alle Aufgaben, Fragen, Antworten und Zahlen.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
        });
        
        extractedText = visionResponse.choices[0]?.message?.content || '';
        pages = 1; // Schätzung
      }
    } else {
      // Für Bilder: Verwende GPT-4 Vision
      const imageBuffer = await fileResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = contentType || 'image/jpeg';

      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extrahiere ALLEN Text aus diesem Bild. Gib den kompletten Text zurück, so wie er auf dem Dokument erscheint. Erhalte die Struktur, alle Aufgaben, Fragen, Antworten und Zahlen.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4000,
      });

      extractedText = visionResponse.choices[0]?.message?.content || '';
    }

    // Confidence basierend auf Textlänge schätzen
    const confidence = extractedText.length > 200 ? 0.9 : extractedText.length > 50 ? 0.8 : 0.6;

    console.log(`✅ OCR abgeschlossen: ${extractedText.length} Zeichen extrahiert, ${pages} Seiten`);

    return {
      text: extractedText,
      confidence,
      pages,
      mimeType: isPDF ? 'application/pdf' : contentType,
    };
  } catch (error) {
    console.error('❌ Fehler bei OCR:', error);
    throw new Error(`OCR-Fehler: ${error.message}`);
  }
}

/**
 * Bild mit Gemini Image Generation erstellen
 * Generiert ein Bild basierend auf einem Prompt
 */
export async function generateImage(prompt, subject, grade) {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nicht gesetzt');
  }

  try {
    console.log(`🎨 Generiere Bild: ${prompt.substring(0, 50)}...`);

    // Gemini kann aktuell keine Bilder generieren, aber wir können die Imagen API verwenden
    // Für jetzt: Verwende einen Placeholder-Service oder speichere den Prompt
    // Später: Integration mit Gemini Imagen oder alternativem Service

    // TODO: Wenn Gemini Imagen verfügbar ist, hier implementieren
    // Für jetzt: Return null und speichere nur den Prompt
    // Der Prompt kann später verwendet werden, wenn Image Generation verfügbar ist

    console.log(`⚠️ Bild-Generierung noch nicht vollständig implementiert. Prompt gespeichert.`);

    return {
      imageUrl: null, // Wird später generiert
      prompt: prompt,
      needsGeneration: true,
    };
  } catch (error) {
    console.error('❌ Fehler bei Bild-Generierung:', error);
    return {
      imageUrl: null,
      prompt: prompt,
      needsGeneration: true,
      error: error.message,
    };
  }
}

/**
 * Bild analysieren und beschreiben
 * Erkennt Objekte, Struktur, etc.
 */
export async function analyzeImage(fileUrl) {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nicht gesetzt');
  }

  try {
    console.log(`🔍 Analysiere Bild: ${fileUrl}...`);

    const imageResponse = await fetch(fileUrl);
    if (!imageResponse.ok) {
      throw new Error(`Fehler beim Laden des Bildes: ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-vision' });

    const prompt = `Analysiere dieses Bild detailliert für eine Lernaufgabe für Kinder der Klasse 1-4.

Beschreibe:
1. Was ist auf dem Bild zu sehen? (Objekte, Personen, Tiere, Zahlen, etc.)
2. Welche Farben sind dominant?
3. Welche mathematischen Elemente sind sichtbar? (Zahlen, Formen, Mengen)
4. Welche Lernaufgaben könnten daraus entstehen?
5. Ist das Bild kindgerecht und für Grundschüler geeignet?

Gib eine strukturierte Beschreibung zurück.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: contentType,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const analysis = response.text();

    console.log(`✅ Bild-Analyse abgeschlossen`);

    return {
      description: analysis,
      hasMathElements: analysis.toLowerCase().includes('zahl') || analysis.toLowerCase().includes('rechnen'),
      hasObjects: analysis.toLowerCase().includes('objekt') || analysis.toLowerCase().includes('tier'),
      isChildFriendly: !analysis.toLowerCase().includes('nicht geeignet'),
    };
  } catch (error) {
    console.error('❌ Fehler bei Bild-Analyse:', error);
    throw new Error(`Bild-Analyse Fehler: ${error.message}`);
  }
}

