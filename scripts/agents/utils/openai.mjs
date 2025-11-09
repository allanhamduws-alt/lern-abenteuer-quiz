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
Deine Aufgabe ist es, aus Arbeitsblättern und Lernmaterialien ähnliche Aufgaben für Kinder zu erstellen.

Wichtig:
- Aufgaben müssen altersgerecht sein (Klasse ${grade})
- Schwierigkeit: ${difficultyMap[grade] || 'mittel'}
- Aufgaben sollen ähnlich zum Original sein, aber Varianten bieten
- Kindgerechte Sprache verwenden
- Klare, verständliche Fragen
- Realistische Antwort-Optionen`;

    const userPrompt = `Analysiere folgenden Text aus einem Arbeitsblatt/Lernmaterial für ${subjectName}, Klasse ${grade}:

---
${extractedText}
---

Erstelle genau 5 ähnliche Aufgaben basierend auf diesem Material. 

Für jede Aufgabe:
1. Frage-Stem (die eigentliche Frage)
2. 4 Antwort-Optionen (bei Multiple-Choice)
3. Index der richtigen Antwort (0-3)
4. Schwierigkeit (leicht/mittel/schwer)
5. Kindgerechte Erklärung für die richtige Antwort
6. Optional: Bild-Prompt falls ein Bild hilfreich wäre (z.B. "5 rote Äpfel auf weißem Hintergrund")

Antworte im folgenden JSON-Format:
{
  "tasks": [
    {
      "stem": "Wie viel ist 3 + 5?",
      "options": ["6", "7", "8", "9"],
      "answers": 2,
      "difficulty": "leicht",
      "explanation": "Bei 3 + 5 kannst du zählen: Starte bei 3 und zähle 5 weiter: 3... 4, 5, 6, 7, 8! Das Ergebnis ist 8.",
      "imagePrompt": "5 rote Äpfel auf weißem Hintergrund, kindgerecht, bunt"
    }
  ]
}

Wichtig:
- Nur valides JSON zurückgeben
- Keine Markdown-Formatierung
- Alle Aufgaben müssen zum Fach ${subjectName} passen
- Schwierigkeit an Klasse ${grade} anpassen`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Kostengünstiger, aber gut für diese Aufgabe
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

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

    console.log(`✅ ${tasksWithImages.length} Tasks generiert`);

    return tasksWithImages.map((task) => {
      // Normalisiere difficulty zu leicht/mittel/schwer (für OpenAI Output)
      // Wird später in processUploads.mjs zu easy/medium/hard konvertiert
      const difficulty = task.difficulty || 'mittel';
      
      return {
        stem: task.stem,
        options: task.options || [],
        answers: task.answers,
        difficulty: difficulty,
        type: 'multiple-choice',
        explanation: task.explanation,
        imageUrl: task.imageUrl,
        imagePrompt: task.imagePrompt,
        needsImageGeneration: task.needsImageGeneration || false,
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

