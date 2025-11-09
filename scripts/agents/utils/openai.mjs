/**
 * OpenAI API Utilities
 * Für Task-Generierung aus extrahiertem Text
 */

import OpenAI from 'openai';
import { ENV } from './env.mjs';
import { generateImage } from './gemini.mjs';

const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY || '',
});

/**
 * Generiert Aufgaben aus extrahiertem Text
 * Verwendet OpenAI GPT-4 für intelligente Task-Generierung
 */
export async function generateTasks(extractedText, subject, grade, ocrResult = {}) {
  if (!ENV.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY nicht gesetzt');
  }

  try {
    console.log(`🤖 Generiere Tasks für ${subject}, Klasse ${grade}...`);

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

    const systemPrompt = `Du bist ein Experte für Grundschulbildung (Klasse 1-4) in Deutschland. 
Deine Aufgabe ist es, aus Arbeitsblättern und Lernmaterialien passende Lernaufgaben für Kinder zu erstellen.

KRITISCH WICHTIG:
1. ANALYSIERE ZUERST DAS ARBEITSBLATT:
   - Welche Art von Arbeitsblatt ist das? (Mathematik-Übungen, Deutsch-Aufgaben, Sachaufgaben, etc.)
   - Welche Aufgabenformate kommen vor? (Multiple-Choice, Lückentext, Zuordnung, Rechenaufgaben, etc.)
   - Wie sind die Aufgaben strukturiert und dargestellt?
   - Welche Lösungsvorgaben gibt es?

2. ERKENNE DIE LERNAUFGABEN:
   - Identifiziere die tatsächlichen Lernaufgaben im Material
   - NICHT Fragen wie "Auf welcher Seite ist Aufgabe X?" oder "Wie viele Unteraufgaben hat Aufgabe Y?"
   - Sondern die ECHTEN Lernaufgaben, die Schüler lösen sollen

3. GENERIERE PASSENDE AUFGABEN:
   - Im GLEICHEN Format wie im Original (nicht alles zu Multiple-Choice machen!)
   - Mit ähnlicher Darstellung und Struktur
   - Mit passenden Lösungsvorgaben
   - Altersgerecht für Klasse ${grade}
   - Schwierigkeit: ${difficultyMap[grade] || 'mittel'}

4. AUFGABENTYPEN ERHALTEN:
   - Wenn das Original Multiple-Choice ist → Multiple-Choice generieren
   - Wenn das Original Lückentext ist → Lückentext generieren
   - Wenn das Original Zuordnung ist → Zuordnung generieren
   - Wenn das Original Rechenaufgaben sind → Rechenaufgaben generieren
   - etc.

Wichtig:
- Aufgaben müssen altersgerecht sein (Klasse ${grade})
- Kindgerechte Sprache verwenden
- Klare, verständliche Fragen
- Realistische Antwort-Optionen`;

    const userPrompt = `Analysiere folgenden Text aus einem Arbeitsblatt/Lernmaterial für ${subjectName}, Klasse ${grade}:

---
${extractedText}
---

SCHRITT 1: ANALYSE
- Welche Art von Arbeitsblatt ist das?
- Welche Aufgabenformate kommen vor?
- Welche Lernaufgaben sind enthalten?
- Wie sind die Aufgaben strukturiert?

SCHRITT 2: AUFGABEN GENERIEREN
Erstelle genau 5 ähnliche Lernaufgaben basierend auf diesem Material. 

WICHTIG:
- Verwende das GLEICHE Format wie im Original
- Wenn das Original Multiple-Choice ist → Multiple-Choice
- Wenn das Original Lückentext ist → Lückentext (type: "input")
- Wenn das Original Zuordnung ist → Zuordnung (type: "matching")
- Wenn das Original Drag-Drop ist → Drag-Drop (type: "drag-drop")
- etc.

Für jede Aufgabe:
1. type: Der Aufgabentyp ("multiple-choice", "input", "matching", "drag-drop")
2. stem: Die eigentliche Frage/Aufgabe
3. options: Antwort-Optionen (nur bei Multiple-Choice, sonst leer)
4. answers: Die richtige Antwort (Index bei Multiple-Choice, String bei Input, Array bei Matching/Drag-Drop)
5. difficulty: Schwierigkeit (leicht/mittel/schwer)
6. explanation: Kindgerechte Erklärung für die richtige Antwort
7. imagePrompt: Optional, falls ein Bild hilfreich wäre

Antworte im folgenden JSON-Format:
{
  "worksheetType": "Beschreibung des Arbeitsblatt-Typs",
  "taskFormats": ["multiple-choice", "input", ...],
  "tasks": [
    {
      "type": "multiple-choice",
      "stem": "Wie viel ist 3 + 5?",
      "options": ["6", "7", "8", "9"],
      "answers": 2,
      "difficulty": "leicht",
      "explanation": "Bei 3 + 5 kannst du zählen: Starte bei 3 und zähle 5 weiter: 3... 4, 5, 6, 7, 8! Das Ergebnis ist 8.",
      "imagePrompt": null
    },
    {
      "type": "input",
      "stem": "Rechne: 4 + 6 = ?",
      "options": [],
      "answers": "10",
      "difficulty": "leicht",
      "explanation": "4 + 6 = 10. Du kannst es dir so vorstellen: 4 Finger und 6 Finger zusammen sind 10 Finger.",
      "imagePrompt": null
    }
  ]
}

Wichtig:
- Nur valides JSON zurückgeben
- Keine Markdown-Formatierung
- Alle Aufgaben müssen zum Fach ${subjectName} passen
- Schwierigkeit an Klasse ${grade} anpassen
- Format muss zum Original passen!`;

    // Beste verfügbare Modelle (in Reihenfolge: neueste zuerst)
    // GPT-4.1 ist neuer als GPT-4o und bietet bessere Qualität
    const modelsToTry = [
      'gpt-4.1',         // Primär - neueste GPT-4 Variante (besser als gpt-4o)
      'gpt-4.1-mini',    // Fallback - kostengünstigere Variante
      'gpt-4o',          // Fallback - aktueller Standard
      'gpt-4o-mini',     // Fallback - kostengünstige Variante
    ];

    let completion = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Versuche Modell ${modelName} für Task-Generierung...`);
        
        completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 3000, // Erhöht für komplexere Aufgaben
          response_format: { type: 'json_object' },
        });
        
        console.log(`✅ Modell ${modelName} erfolgreich verwendet`);
        break; // Erfolg, breche ab
      } catch (modelError) {
        const errorMsg = modelError.message || 'Unbekannter Fehler';
        console.warn(`⚠️ Modell ${modelName} nicht verfügbar:`, errorMsg);
        lastError = modelError;
        continue;
      }
    }

    if (!completion) {
      throw lastError || new Error('Alle OpenAI-Modelle fehlgeschlagen');
    }

    const responseText = completion.choices[0]?.message?.content || '{}';
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
    console.log(`✅ ${tasks.length} Aufgaben generiert`);

    // Für jede Task mit imagePrompt: Bild generieren (optional)
    const tasksWithImages = await Promise.all(
      tasks.map(async (task) => {
        if (task.imagePrompt && ENV.GEMINI_API_KEY) {
          try {
            const imageResult = await generateImage(task.imagePrompt, subject, grade);
            return {
              ...task,
              imagePrompt: task.imagePrompt,
              imageUrl: imageResult.imageUrl,
              needsImageGeneration: imageResult.needsGeneration,
            };
          } catch (imageError) {
            console.warn(`⚠️ Bild-Generierung fehlgeschlagen für Task: ${imageError.message}`);
            return task;
          }
        }
        return task;
      })
    );

    return tasksWithImages.map((task) => {
      // Normalisiere difficulty zu leicht/mittel/schwer (für OpenAI Output)
      // Wird später in processUploads.mjs zu easy/medium/hard konvertiert
      const difficulty = task.difficulty || 'mittel';
      
      // Stelle sicher, dass type gesetzt ist
      const taskType = task.type || 'multiple-choice';
      
      // Normalisiere answers basierend auf Typ
      let normalizedAnswers = task.answers;
      
      // Prüfe auf verschachtelte Arrays und flache sie
      if (Array.isArray(normalizedAnswers) && normalizedAnswers.length > 0) {
        if (Array.isArray(normalizedAnswers[0])) {
          // Verschachteltes Array - konvertiere zu flachem Array
          normalizedAnswers = normalizedAnswers.flat();
          console.warn(`⚠️ Verschachteltes Array in answers gefunden und geflacht`);
        }
      }
      
      if (taskType === 'multiple-choice' && typeof normalizedAnswers === 'number') {
        // Bereits korrekt
      } else if (taskType === 'input' && typeof normalizedAnswers === 'string') {
        // Bereits korrekt
      } else if ((taskType === 'matching' || taskType === 'drag-drop') && Array.isArray(normalizedAnswers)) {
        // Bereits korrekt
      } else {
        // Fallback: Versuche zu konvertieren
        console.warn(`⚠️ Unerwarteter answers-Typ für ${taskType}: ${typeof normalizedAnswers}`);
      }
      
      // Normalisiere options - keine verschachtelten Arrays erlauben
      let normalizedOptions = task.options || [];
      if (Array.isArray(normalizedOptions) && normalizedOptions.length > 0) {
        if (Array.isArray(normalizedOptions[0])) {
          // Verschachteltes Array - konvertiere zu flachem Array
          normalizedOptions = normalizedOptions.flat();
          console.warn(`⚠️ Verschachteltes Array in options gefunden und geflacht`);
        }
      }
      
      return {
        stem: task.stem,
        options: normalizedOptions,
        answers: normalizedAnswers,
        difficulty: difficulty,
        type: taskType,
        explanation: task.explanation,
        imageUrl: task.imageUrl,
        imagePrompt: task.imagePrompt,
        needsImageGeneration: task.needsImageGeneration || false,
        worksheetType: worksheetType, // Metadaten für Evaluierung
        taskFormats: taskFormats, // Metadaten für Evaluierung
      };
    });
  } catch (error) {
    console.error('❌ Fehler bei Task-Generierung:', error);
    
    // Fallback: Erstelle einfache Beispiel-Tasks
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

