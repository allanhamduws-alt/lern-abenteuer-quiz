/**
 * Script zum Generieren von kindgerechten Erklärungen für alle Quiz-Fragen
 * Führt einmalig API-Calls durch und speichert die Erklärungen in helpText
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prüft ob ein helpText eine Lösung verrät
function revealsSolution(helpText: string, question: any): boolean {
  if (!helpText) return false;
  
  const options = question.options || [];
  
  // Prüfe auf direkte Lösungsangaben
  for (const option of options) {
    if (helpText.includes(`Als Nächstes kommt ${option}`) ||
        helpText.includes(`Die fehlende Zahl ist ${option}`) ||
        helpText.includes(`Das Ergebnis ist ${option}`) ||
        helpText.includes(`Die Antwort ist ${option}`) ||
        helpText.includes(`Die Lösung ist ${option}`)) {
      return true;
    }
  }
  
  // Prüfe auf mathematische Gleichungen mit Lösungen
  if (/\d+\s*(mal|×)\s*\d+\s*(ist gleich|=)\s*\d+/.test(helpText)) {
    return true;
  }
  
  // Prüfe auf "also X+Y=Z" Muster
  if (/also\s+\d+\s*[+\-×÷]\s*\d+\s*=\s*\d+/.test(helpText)) {
    return true;
  }
  
  // Prüfe ob helpText identisch mit explanation ist (explanation enthält oft Lösungen)
  if (question.explanation && helpText === question.explanation) {
    return true;
  }
  
  return false;
}

// OpenAI API Funktion (vereinfacht für Script)
async function explainForChildren(request: {
  question: string;
  helpText?: string;
  classLevel: 1 | 2 | 3 | 4;
  subject?: string;
  topic?: string;
}): Promise<string> {
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    throw new Error('OpenAI API Key nicht gefunden. Setze VITE_OPENAI_API_KEY in .env');
  }

  const prompt = `Du bist ein sehr freundlicher, liebevoller und pädagogisch geschickter Lehrer für Grundschulkinder. Deine Aufgabe ist es, die folgende Quiz-Frage zu erklären - ABER: Formuliere ALLES komplett neu und in eigenen Worten!

KRITISCHE ANFORDERUNGEN - BITTE SEHR GENAU BEACHTEN:

1. KEINE LÖSUNG VORSAGEN - ABSOLUT VERBOTEN:
   - NIEMALS Sätze wie "Als Nächstes kommt X", "Die Antwort ist Y", "Die Lösung ist Z"
   - NIEMALS mathematische Gleichungen die die Lösung zeigen (z.B. "40×2=80")
   - NIEMALS "also X+Y=Z" Muster verwenden
   - Die Erklärung soll helfen, aber das Kind muss selbst auf die Lösung kommen!

2. SEHR LIEB UND PÄDAGOGISCH SPRECHEN:
   - Sei warmherzig, geduldig und ermutigend
   - Verwende freundliche, einfache Sprache
   - Sei wie ein bester Freund, der hilft
   - Zeige echte Freude am Lernen

3. AB UND ZU PERSÖNLICH - NAMEN ERWÄHNEN:
   - Wenn passend, verwende den Namen des Kindes (z.B. "Hey [Name], schau mal...")
   - Aber nicht in jedem Satz - nur gelegentlich für persönliche Note
   - Klinge natürlich, nicht aufgesetzt

4. FRAGE IN EIGENEN WORTEN NOCHMAL ERKLÄREN:
   - Erkläre die Frage nochmal mit anderen Worten, falls das Kind sie nicht verstanden hat
   - Gib einen anderen Ansatz zur Lösung
   - Zeige verschiedene Denkwege auf
   - Mache es einfacher verständlich

5. SEHR LERNEFFEKTIV:
   - Erkläre das WARUM, nicht nur das WAS
   - Zeige Zusammenhänge auf
   - Gib Denkanstöße, die zum Nachdenken anregen
   - Fördere das Verständnis, nicht nur das Auswendiglernen

STIL:
- Verwende natürliche, umgangssprachliche Formulierungen: "Schau mal, ...", "Hey, ...", "Also, ...", "Du weißt doch, ..."
- Sei ermutigend: "Das schaffst du!", "Versuch es einfach!", "Super!", "Du bist auf dem richtigen Weg!"
- Maximal 4-5 kurze, klare Sätze
- Sei lebendig und interessant - NICHT langweilig!
- Verwende mathematische Symbole als Wörter: "×" → "mal", "÷" → "geteilt durch", "=" → "ist gleich"

Quiz-Frage: "${request.question}"
${request.helpText ? `Original-Tipp (NUR als Inspiration - formuliere es komplett neu OHNE Lösung zu verraten!): "${request.helpText}"` : ''}

WICHTIG: Formuliere jetzt eine komplett neue, liebevolle und pädagogische Erklärung in eigenen Worten - hilfreich aber OHNE die Lösung zu verraten!`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Schnelles, gutes Modell
        messages: [
        {
          role: 'system',
          content: 'Du bist ein sehr freundlicher, liebevoller, geduldiger und pädagogisch geschickter Lehrer für Grundschulkinder. Du erklärst Dinge in einfacher, natürlicher Sprache mit viel Emotion und Begeisterung, als würdest du direkt mit dem Kind sprechen. Du bist motivierend, warmherzig und zeigst echte Freude am Lernen. Du verrätst NIEMALS die Lösung direkt, sondern hilfst dem Kind dabei, selbst darauf zu kommen. Du erklärst Fragen in eigenen Worten nochmal, falls das Kind sie nicht verstanden hat, und gibst verschiedene Denkansätze. Du bist sehr lerneffektiv und förderst das Verständnis.'
        },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1.0,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API Fehler: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content?.trim();

    if (!explanation || explanation.length === 0) {
      throw new Error('Erklärung ist leer');
    }

    return explanation;
  } catch (error) {
    console.error('Fehler bei OpenAI API:', error);
    throw error;
  }
}

function generateFallback(question: any): string {
  const { class: classLevel, subject } = question;
  
  if (subject === 'mathematik') {
    return classLevel === 1 || classLevel === 2 
      ? 'Lies die Aufgabe genau. Zähle mit den Fingern oder stelle dir die Zahlen vor!'
      : 'Überlege dir Schritt für Schritt, was du rechnen musst.';
  }
  
  if (subject === 'deutsch') {
    return classLevel === 1 || classLevel === 2 
      ? 'Lies die Frage genau durch und überlege dir, was sie meint!'
      : 'Achte auf die wichtigen Wörter in der Frage!';
  }
  
  return classLevel === 1 || classLevel === 2 
    ? 'Lies die Frage genau durch und überlege dir, was sie meint!'
    : 'Achte auf die wichtigen Wörter in der Frage!';
}

async function generateAllExplanations() {
  console.log('🚀 Starte Generierung von Erklärungen...\n');
  
  // Lade Fragen-Datei
  const questionsPath = path.join(__dirname, '../src/data/questions.ts');
  const questionsContent = fs.readFileSync(questionsPath, 'utf-8');
  
  // Extrahiere Fragen-Array (einfache Regex-basierte Lösung)
  const questionsMatch = questionsContent.match(/export const questions: Question\[\] = (\[[\s\S]*\]);/);
  if (!questionsMatch) {
    throw new Error('Konnte Fragen-Array nicht finden');
  }
  
  // Parse JSON (ersetzt TypeScript-Syntax temporär)
  let questionsJson = questionsMatch[1]
    .replace(/(\w+):/g, '"$1":') // Keys in Anführungszeichen
    .replace(/'/g, '"') // Einfache Anführungszeichen zu doppelten
    .replace(/,\s*}/g, '}') // Trailing commas entfernen
    .replace(/,\s*]/g, ']'); // Trailing commas entfernen
  
  const questions = JSON.parse(questionsJson);
  
  console.log(`📚 Gefunden: ${questions.length} Fragen\n`);
  
  const updatedQuestions = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    // Prüfe ob helpText vorhanden ist und ob er problematisch ist
    const hasHelpText = question.helpText && question.helpText.trim().length > 0;
    const isProblematic = hasHelpText && revealsSolution(question.helpText, question);
    
    // Überspringe nur wenn helpText vorhanden UND nicht problematisch ist
    if (hasHelpText && !isProblematic) {
      updatedQuestions.push(question);
      skipped++;
      console.log(`⏭️  Übersprungen (${i + 1}/${questions.length}): ${question.id} - bereits guter helpText vorhanden`);
      continue;
    }
    
    // Wenn problematisch, markiere für Neugenerierung
    if (isProblematic) {
      console.log(`⚠️  Problematischer helpText gefunden (${i + 1}/${questions.length}): ${question.id}`);
      console.log(`   Alter helpText: ${question.helpText.substring(0, 80)}...`);
    }
    
    try {
      console.log(`🔄 Generiere Erklärung für: ${question.id} (${i + 1}/${questions.length})`);
      console.log(`   Frage: ${question.question.substring(0, 60)}...`);
      
      // Verwende explanation als Inspiration, aber nicht den alten helpText (der könnte Lösungen enthalten)
      const explanation = await explainForChildren({
        question: question.question,
        helpText: question.explanation || undefined, // Verwende explanation, nicht den alten helpText
        classLevel: question.class,
        subject: question.subject,
        topic: question.topic,
      });
      
      updatedQuestions.push({
        ...question,
        helpText: explanation
      });
      
      processed++;
      const wasProblematic = isProblematic ? ' (war problematisch)' : '';
      console.log(`✅ Erfolg!${wasProblematic} Neue Erklärung: ${explanation.substring(0, 80)}...\n`);
      
      // Rate limiting: 1 Sekunde Pause zwischen Requests
      if (i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error: any) {
      console.error(`❌ Fehler bei ${question.id}:`, error.message);
      // Fallback: Verwende explanation falls vorhanden
      updatedQuestions.push({
        ...question,
        helpText: question.explanation || generateFallback(question)
      });
      errors++;
      console.log(`⚠️  Fallback verwendet\n`);
      
      // Auch bei Fehlern kurz pausieren
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generiere neue TypeScript-Datei
  console.log('\n📝 Schreibe aktualisierte Fragen-Datei...');
  
  // Konvertiere zurück zu TypeScript-Format
  const questionsTs = updatedQuestions.map((q: any) => {
    const lines = [
      '  {',
      `    id: '${q.id}',`,
      `    class: ${q.class},`,
      `    subject: '${q.subject}',`,
    ];
    
    if (q.type) lines.push(`    type: '${q.type}',`);
    if (q.question) lines.push(`    question: '${q.question.replace(/'/g, "\\'")}',`);
    if (q.options) lines.push(`    options: [${q.options.map((o: string) => `'${o.replace(/'/g, "\\'")}'`).join(', ')}],`);
    if (q.correctAnswer !== undefined) {
      if (typeof q.correctAnswer === 'string') {
        lines.push(`    correctAnswer: '${q.correctAnswer}',`);
      } else {
        lines.push(`    correctAnswer: ${q.correctAnswer},`);
      }
    }
    if (q.points) lines.push(`    points: ${q.points},`);
    if (q.difficulty) lines.push(`    difficulty: '${q.difficulty}',`);
    if (q.topic) lines.push(`    topic: '${q.topic}',`);
    if (q.explanation) lines.push(`    explanation: '${q.explanation.replace(/'/g, "\\'")}',`);
    if (q.helpText) lines.push(`    helpText: '${q.helpText.replace(/'/g, "\\'")}',`);
    if (q.isBonus) lines.push(`    isBonus: ${q.isBonus},`);
    if (q.bonusMultiplier) lines.push(`    bonusMultiplier: ${q.bonusMultiplier},`);
    if (q.dragItems) lines.push(`    dragItems: [${q.dragItems.map((d: string) => `'${d}'`).join(', ')}],`);
    if (q.dropTargets) lines.push(`    dropTargets: [${q.dropTargets.map((d: string) => `'${d}'`).join(', ')}],`);
    
    lines.push('  },');
    return lines.join('\n');
  }).join('\n');
  
  const newContent = `/**
 * Beispiel-Quiz-Fragen
 * Diese Datei können Sie später erweitern mit eigenen Fragen
 */

import type { Question } from '../types';

// Beispiel-Fragen für Klasse 1, Mathematik
export const questions: Question[] = [
${questionsTs}
];
`;
  
  // Backup der alten Datei
  const backupPath = questionsPath + '.backup';
  fs.copyFileSync(questionsPath, backupPath);
  console.log(`💾 Backup erstellt: ${backupPath}`);
  
  // Schreibe neue Datei
  fs.writeFileSync(questionsPath, newContent, 'utf-8');
  
  console.log('\n✅ Fertig!');
  console.log(`📊 Statistiken:`);
  console.log(`   - Neu generiert: ${processed}`);
  console.log(`   - Übersprungen (bereits gut): ${skipped}`);
  console.log(`   - Fehler: ${errors}`);
  console.log(`   - Gesamt: ${questions.length}`);
  console.log(`\n💡 Die Erklärungen wurden in helpText gespeichert.`);
  console.log(`💡 Du kannst jetzt die HelpButton-Komponente anpassen, um diese zu verwenden.`);
}

// Führe Script aus
generateAllExplanations().catch((error) => {
  console.error('❌ Fataler Fehler:', error);
  process.exit(1);
});

