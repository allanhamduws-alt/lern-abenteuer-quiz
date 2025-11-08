/**
 * Script zum Generieren von kindgerechten Erklärungen für alle Quiz-Fragen
 * Führt einmalig API-Calls durch und speichert die Erklärungen in helpText
 * 
 * Usage: VITE_OPENAI_API_KEY="..." node scripts/generateExplanations.mjs
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// OpenAI API Funktion
async function explainForChildren(request) {
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    throw new Error('OpenAI API Key nicht gefunden. Setze VITE_OPENAI_API_KEY in .env oder exportiere es');
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

function generateFallback(question) {
  const classLevel = question.class;
  const subject = question.subject;
  
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

// Verbesserter Parser für TypeScript-Fragen-Array
function parseQuestionsFile(content) {
  const questions = [];
  const lines = content.split('\n');
  
  let currentQuestion = null;
  let inQuestion = false;
  let braceCount = 0;
  let questionLines = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Start einer Frage (kann mit oder ohne { beginnen)
    if (trimmed === '{' || (trimmed.startsWith('id:') && !inQuestion)) {
      if (trimmed === '{') {
        i++;
        continue; // Überspringe die { Zeile
      }
      inQuestion = true;
      currentQuestion = {};
      questionLines = [];
      braceCount = 0;
    }
    
    if (inQuestion) {
      questionLines.push(line);
      
      // Zähle geschweifte Klammern
      braceCount += (trimmed.match(/{/g) || []).length;
      braceCount -= (trimmed.match(/}/g) || []).length;
      
      // Parse Felder - unterstützt verschiedene Formate
      const idMatch = trimmed.match(/id:\s*['"]([^'"]+)['"]/);
      if (idMatch) currentQuestion.id = idMatch[1];
      
      const classMatch = trimmed.match(/class:\s*(\d+)/);
      if (classMatch) currentQuestion.class = parseInt(classMatch[1]);
      
      const subjectMatch = trimmed.match(/subject:\s*['"]([^'"]+)['"]/);
      if (subjectMatch) currentQuestion.subject = subjectMatch[1];
      
      // Frage kann über mehrere Zeilen gehen - sammle alles bis zum nächsten Feld
      if (trimmed.startsWith('question:')) {
        let questionText = '';
        let j = i;
        // Sammle die Frage (kann mehrere Zeilen sein)
        while (j < lines.length) {
          const qLine = lines[j];
          questionText += qLine.replace(/question:\s*['"]?/, '').replace(/['"],?\s*$/, '');
          if (qLine.includes("',") || qLine.includes('",')) break;
          j++;
        }
        currentQuestion.question = questionText.replace(/['"]/g, '').trim();
      }
      
      const helpTextMatch = trimmed.match(/helpText:\s*['"]([^'"]+)['"]/);
      if (helpTextMatch) currentQuestion.helpText = helpTextMatch[1];
      
      const explanationMatch = trimmed.match(/explanation:\s*['"]([^'"]+)['"]/);
      if (explanationMatch) currentQuestion.explanation = explanationMatch[1];
      
      const topicMatch = trimmed.match(/topic:\s*['"]([^'"]+)['"]/);
      if (topicMatch) currentQuestion.topic = topicMatch[1];
      
      // Ende einer Frage
      if (trimmed === '},' || trimmed === '}') {
        if (currentQuestion && currentQuestion.id) {
          currentQuestion.originalLines = [...questionLines];
          questions.push(currentQuestion);
        }
        inQuestion = false;
        currentQuestion = null;
        braceCount = 0;
      }
    }
    
    i++;
  }
  
  return questions;
}

// Generiere TypeScript-Code für eine Frage
function generateQuestionCode(question) {
  const lines = question.originalLines || [];
  let hasHelpText = false;
  
  // Füge helpText hinzu oder ersetze es
  const newLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.includes('helpText:')) {
      hasHelpText = true;
      // Ersetze die gesamte helpText-Zeile
      return line.replace(/helpText:\s*['"][^'"]*['"]/, `helpText: '${question.helpText.replace(/'/g, "\\'")}'`);
    }
    return line;
  });
  
  // Füge helpText vor dem schließenden } hinzu, falls nicht vorhanden
  if (!hasHelpText && question.helpText) {
    // Finde die letzte Zeile vor dem schließenden }
    for (let i = newLines.length - 1; i >= 0; i--) {
      if (newLines[i].trim() === '},' || newLines[i].trim() === '}') {
        newLines.splice(i, 0, `    helpText: '${question.helpText.replace(/'/g, "\\'")}',`);
        break;
      }
    }
  }
  
  return newLines.join('\n');
}

async function generateAllExplanations() {
  console.log('🚀 Starte Generierung von Erklärungen...\n');
  
  // Lade Fragen-Datei
  const questionsPath = join(__dirname, '../src/data/questions.ts');
  const questionsContent = readFileSync(questionsPath, 'utf-8');
  
  // Parse Fragen
  const questions = parseQuestionsFile(questionsContent);
  
  console.log(`📚 Gefunden: ${questions.length} Fragen\n`);
  
  if (questions.length === 0) {
    console.error('❌ Keine Fragen gefunden! Bitte prüfe das Format der questions.ts Datei.');
    process.exit(1);
  }
  
  const updatedQuestions = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    
    // Überspringe nur wenn bereits eine kindgerechte Erklärung vorhanden ist
    // Prüfe ob helpText identisch mit explanation ist (alte technische Erklärung)
    // oder ob es die alten Fallback-Texte enthält
    const hasOldExplanation = question.helpText && (
      question.helpText === question.explanation ||
      question.helpText.includes('Lies die Aufgabe genau') ||
      question.helpText.includes('Lies die Frage genau') ||
      question.helpText.includes('Achte auf die wichtigen Wörter') ||
      question.helpText.includes('Zähle mit den Fingern') ||
      question.helpText.includes('Überlege dir Schritt für Schritt')
    );
    
    // Überspringe nur wenn eine kindgerechte Erklärung vorhanden ist (beginnt mit "Hey", "Schau mal", etc.)
    const hasKindExplanation = question.helpText && (
      question.helpText.startsWith('Hey') ||
      question.helpText.startsWith('Schau mal') ||
      question.helpText.startsWith('Also') ||
      question.helpText.startsWith('Hallo')
    );
    
    if (question.helpText && question.helpText.trim().length > 0 && !hasOldExplanation && hasKindExplanation) {
      updatedQuestions.push(question);
      skipped++;
      if (skipped <= 5 || skipped % 50 === 0) {
        console.log(`⏭️  Übersprungen (${i + 1}/${questions.length}): ${question.id} - bereits kindgerechte Erklärung vorhanden`);
      }
      continue;
    }
    
    // Wenn alte Erklärung vorhanden, markiere für Neu-Generierung
    if (hasOldExplanation) {
      console.log(`🔄 Ersetze alte Erklärung für: ${question.id}`);
    }
    
    try {
      if (processed === 0 || (i + 1) % 10 === 0) {
        console.log(`🔄 Generiere Erklärung für: ${question.id} (${i + 1}/${questions.length})`);
        console.log(`   Frage: ${(question.question || '').substring(0, 60)}...`);
      }
      
      const explanation = await explainForChildren({
        question: question.question,
        helpText: question.explanation || question.helpText || undefined,
        classLevel: question.class,
        subject: question.subject,
        topic: question.topic,
      });
      
      question.helpText = explanation;
      updatedQuestions.push(question);
      
      processed++;
      if (processed <= 5 || processed % 10 === 0) {
        console.log(`✅ Erfolg! Erklärung: ${explanation.substring(0, 80)}...\n`);
      }
      
      // Rate limiting: 1 Sekunde Pause zwischen Requests
      if (i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Fehler bei ${question.id}:`, error.message);
      // Fallback: Verwende explanation falls vorhanden
      question.helpText = question.explanation || generateFallback(question);
      updatedQuestions.push(question);
      errors++;
      if (errors <= 5) {
        console.log(`⚠️  Fallback verwendet\n`);
      }
      
      // Auch bei Fehlern kurz pausieren
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Generiere neue TypeScript-Datei
  console.log('\n📝 Schreibe aktualisierte Fragen-Datei...');
  
  // Finde den Start des Arrays und den Header
  const headerEnd = questionsContent.indexOf('export const questions: Question[] = [');
  const beforeArray = questionsContent.substring(0, headerEnd + 'export const questions: Question[] = ['.length);
  
  // Finde das Ende des Arrays
  const arrayEnd = questionsContent.lastIndexOf('];');
  const afterArray = questionsContent.substring(arrayEnd);
  
  // Generiere Code für alle Fragen
  const questionsCode = updatedQuestions.map(q => generateQuestionCode(q)).join('\n');
  
  const newContent = beforeArray + '\n' + questionsCode + '\n' + afterArray;
  
  // Backup der alten Datei
  const backupPath = questionsPath + '.backup.' + Date.now();
  copyFileSync(questionsPath, backupPath);
  console.log(`💾 Backup erstellt: ${backupPath}`);
  
  // Schreibe neue Datei
  writeFileSync(questionsPath, newContent, 'utf-8');
  
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
