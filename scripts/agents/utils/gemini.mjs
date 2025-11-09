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
        
        const prompt = `Analysiere dieses Arbeitsblatt VISUELL und INHALTLICH vollständig.

VISUELLE ANALYSE (WICHTIG - beachte Layout und Struktur!):
1. Welche STRUKTUR hat das Arbeitsblatt?
   - Tabellen? Spalten? Zeilen?
   - Pyramiden/Diagramme? (z.B. Zahlenmauern)
   - Verbindungslinien zwischen Elementen?
   - Leere Felder/Kästchen für Antworten?
   - Lücken im Text (__ oder [ ])?

2. Welche AUFGABENTYPEN erkennst du VISUELL?
   - Lückentexte (leere Felder im Text)
   - Zuordnungen (Wörter ↔ Kategorien mit Linien)
   - Zahlenmauern (Pyramiden-Struktur mit Zahlen)
   - Rechenaufgaben (= Zeichen, Zahlen)
   - Tabellen mit Einträgen
   - Multiple-Choice (Kreise/Kästchen zum Ankreuzen)

3. Wo sind die LÜCKEN/ANTWORT-FELDER?
   - Position im Layout
   - Wie viele?
   - Was soll eingetragen werden?

INHALTLICHE ANALYSE:
- Extrahiere ALLEN Text genau so wie er erscheint
- Behalte Struktur bei (Überschriften, Absätze, Listen)
- Erkenne alle Lernaufgaben und Übungen
- Erkenne Lösungen und Antworten wenn vorhanden
- Fach/Thema erkennen

Gib zurück:
1. Vollständiger Text (strukturiert)
2. Erkannte Struktur (Tabellen, Pyramiden, etc.)
3. Aufgabentypen die du siehst
4. Layout-Beschreibung (wo sind Lücken, Verbindungen, etc.)`;

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

/**
 * Generiert Aufgaben mit Gemini (kostenlos)
 * Alternative zu OpenAI für Task-Generierung
 */
export async function generateTasksWithGemini(extractedText, subject, grade, ocrResult = {}) {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nicht gesetzt');
  }

  try {
    console.log(`🤖 Generiere Tasks mit Gemini für ${subject}, Klasse ${grade}...`);

    const subjectName = {
      mathematik: 'Mathematik',
      deutsch: 'Deutsch',
      sachunterricht: 'Sachunterricht',
      englisch: 'Englisch',
      musik: 'Musik',
      logik: 'Logik',
    }[subject] || subject;

    const difficultyMap = {
      1: 'leicht',
      2: 'leicht bis mittel',
      3: 'mittel',
      4: 'mittel bis schwer',
    };

    // Erhöhe Text-Limit auf 50k Zeichen (wie besprochen)
    const textToProcess = extractedText.substring(0, 50000);

    const systemPrompt = `Du bist Experte für deutsche Grundschul-Arbeitsblätter basierend auf lernwolf.de.

WICHTIGE AUFGABENTYPEN (erkenne diese genau):

DEUTSCH:
1. fill-blank: Lückentexte mit Rechtschreibregeln
   - ä/äu vs e/eu
   - ck vs k
   - ie, ei
   - Groß-/Kleinschreibung
   - Format: {"type": "fill-blank", "stem": "Setze ä oder e ein:\\n\\nDie Bl__me ist sch__n.", "blanks": ["ü", "ö"], "blankOptions": [["ä","e"], ["ö","o"]], "caseSensitive": true}
   
2. word-classification: Wortarten zuordnen
   - Nomen, Verben, Adjektive
   - Format: {"type": "word-classification", "words": ["Hund", "laufen", "schnell"], "categories": ["Nomen", "Verb", "Adjektiv"], "correctMapping": {"Hund": "Nomen", "laufen": "Verb", "schnell": "Adjektiv"}}
   
MATHE:
3. number-input: Rechenaufgaben
   - Zahlenraum beachten! Klasse 1: 1-20, Klasse 2: 1-100, Klasse 3: 1-1000, Klasse 4: >1000
   - Format: {"type": "number-input", "problems": [{"question": "5 + 3 = ", "answer": "8"}], "operation": "addition", "numberRange": [1, 20]}
   
4. number-pyramid: Zahlenmauern
   - 3 Ebenen (Basis, Mitte, Spitze)
   - Regel: Jedes Feld = Summe der 2 darunter
   - Format: {"type": "number-pyramid", "levels": 3, "structure": [[{value: null, isBlank: true}, {value: null, isBlank: true}, {value: 10, isBlank: false}], [{value: 3, isBlank: false}, {value: null, isBlank: true}, {value: 5, isBlank: false}], [{value: 1, isBlank: false}, {value: 2, isBlank: false}, {value: 3, isBlank: false}]], "blanks": [{"row": 0, "col": 0, "answer": "7"}]}
   
5. word-problem: Textaufgaben
   - Alltagskontext
   - Format: {"type": "word-problem", "stem": "Max hat 5 Äpfel. Er bekommt 3 dazu. Wie viele Äpfel hat er jetzt?", "context": "fruits", "calculation": "5 + 3", "correctAnswer": "8", "unit": "Äpfel"}

GENERIERE IM GLEICHEN FORMAT WIE ORIGINAL!
Für Klasse ${grade} passend.
`;

    const userPrompt = `Analysiere dieses Arbeitsblatt für ${subjectName}, Klasse ${grade}:

---
${textToProcess}
---

SCHRITT 1: TYP ERKENNEN
Welcher der 5 Typen kommt vor?
- fill-blank
- word-classification  
- number-input
- number-pyramid
- word-problem

SCHRITT 2: 5-10 AUFGABEN GENERIEREN
Im GLEICHEN Format wie Original.
Klasse ${grade}, Fach ${subjectName}.

Antworte NUR als JSON:
{
  "worksheetType": "Beschreibung",
  "taskFormats": ["fill-blank", ...],
  "tasks": [
    {
      "type": "fill-blank",
      "stem": "...",
      "blanks": [...],
      "blankOptions": [...],
      "caseSensitive": true,
      "difficulty": "mittel",
      "explanation": "..."
    }
  ]
}

Wichtig:
- Nur valides JSON
- Keine Markdown
- Format muss zum Original passen!`;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // Schnell und kostenlos
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
      },
    });

    const response = await result.response;
    const responseText = response.text();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // Fallback: Versuche JSON aus Text zu extrahieren
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Kein gültiges JSON in der Antwort');
      }
    }

    const tasks = parsedResponse.tasks || [];
    const worksheetType = parsedResponse.worksheetType || 'Unbekannt';
    const taskFormats = parsedResponse.taskFormats || [];

    console.log(`📋 Arbeitsblatt-Typ erkannt: ${worksheetType}`);
    console.log(`📝 Aufgabenformate: ${taskFormats.join(', ')}`);
    console.log(`✅ ${tasks.length} Aufgaben generiert (Gemini)`);

    return tasks.map((task) => {
      const difficulty = task.difficulty || 'mittel';
      const taskType = task.type || 'multiple-choice';
      
      // Normalisiere answers
      let normalizedAnswers = task.answers;
      if (Array.isArray(normalizedAnswers) && normalizedAnswers.length > 0) {
        if (Array.isArray(normalizedAnswers[0])) {
          normalizedAnswers = normalizedAnswers.flat();
        }
      }
      
      // Normalisiere options
      let normalizedOptions = task.options || [];
      if (Array.isArray(normalizedOptions) && normalizedOptions.length > 0) {
        if (Array.isArray(normalizedOptions[0])) {
          normalizedOptions = normalizedOptions.flat();
        }
      }
      
      return {
        stem: task.stem,
        options: normalizedOptions,
        answers: normalizedAnswers,
        difficulty: difficulty,
        type: taskType,
        explanation: task.explanation,
        // Neue Felder für Phase 1A Typen
        blanks: task.blanks,
        blankOptions: task.blankOptions,
        caseSensitive: task.caseSensitive,
        words: task.words,
        categories: task.categories,
        correctMapping: task.correctMapping,
        problems: task.problems,
        operation: task.operation,
        numberRange: task.numberRange,
        levels: task.levels,
        structure: task.structure,
        context: task.context,
        calculation: task.calculation,
        unit: task.unit,
        worksheetType: worksheetType,
        taskFormats: taskFormats,
      };
    });
  } catch (error) {
    console.error('❌ Fehler bei Gemini Task-Generierung:', error);
    
    // Fallback
    console.log('⚠️ Verwende Fallback-Tasks');
    return [
      {
        stem: `Beispiel-Aufgabe für ${subjectName}`,
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        answers: 0,
        difficulty: 'mittel',
        type: 'multiple-choice',
        explanation: 'Dies ist eine Beispiel-Aufgabe. Die echte Generierung ist fehlgeschlagen.',
      },
    ];
  }
}

