/**
 * Script zum Generieren von kindgerechten Erklärungen für alle Quiz-Fragen
 * Führt einmalig API-Calls durch und speichert die Erklärungen in helpText
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  const prompt = `Du bist ein sehr freundlicher Lehrer für Grundschulkinder. Deine Aufgabe ist es, die folgende Quiz-Frage zu erklären - ABER: Formuliere ALLES komplett neu und in eigenen Worten!

KRITISCHE ANFORDERUNGEN:
- Verwende NIEMALS den Original-Tipp Wort für Wort!
- Erfinde eine komplett neue, eigene Erklärung!
- Verwende andere Wörter, andere Formulierungen, andere Sätze!
- Die Erklärung soll helfen, aber NICHT die Lösung verraten!
- Klinge wie ein echter Mensch mit viel Emotion: "Schau mal, ...", "Hey, ...", "Also, ..."
- Sei ermutigend: "Das schaffst du!", "Versuch es einfach!", "Super!"
- Maximal 3-4 kurze Sätze
- Sei lebendig und interessant - NICHT langweilig!
- Sei super freundlich und lieb - wie ein bester Freund!

Quiz-Frage: "${request.question}"
${request.helpText ? `Original-Tipp (NUR als Inspiration - formuliere es komplett neu!): "${request.helpText}"` : ''}

WICHTIG: Formuliere jetzt eine komplett neue Erklärung in eigenen Worten - nicht den Tipp ablesen, sondern neu erklären!`;

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
            content: 'Du bist ein sehr freundlicher, geduldiger und begeisterter Lehrer für Grundschulkinder. Du erklärst Dinge in einfacher, natürlicher Sprache mit viel Emotion und Begeisterung, als würdest du direkt mit dem Kind sprechen. Du bist motivierend, warmherzig und zeigst echte Freude am Lernen.'
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
    
    // Überspringe wenn bereits helpText vorhanden
    if (question.helpText && question.helpText.trim().length > 0) {
      updatedQuestions.push(question);
      skipped++;
      console.log(`⏭️  Übersprungen (${i + 1}/${questions.length}): ${question.id} - bereits helpText vorhanden`);
      continue;
    }
    
    try {
      console.log(`🔄 Generiere Erklärung für: ${question.id} (${i + 1}/${questions.length})`);
      console.log(`   Frage: ${question.question.substring(0, 60)}...`);
      
      const explanation = await explainForChildren({
        question: question.question,
        helpText: question.explanation || undefined,
        classLevel: question.class,
        subject: question.subject,
        topic: question.topic,
      });
      
      updatedQuestions.push({
        ...question,
        helpText: explanation
      });
      
      processed++;
      console.log(`✅ Erfolg! Erklärung: ${explanation.substring(0, 80)}...\n`);
      
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
  console.log(`   - Verarbeitet: ${processed}`);
  console.log(`   - Übersprungen: ${skipped}`);
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

