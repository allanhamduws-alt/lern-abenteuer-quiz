/**
 * Prüf-Script für Fragen-Validierung
 * Führt Validierung aller Fragen durch und erstellt einen Report
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Einfache Validierungs-Logik (vereinfachte Version)
function getCorrectAnswerText(question) {
  if (question.type === 'input') {
    return String(question.correctAnswer).toLowerCase().trim();
  }

  if (question.options && typeof question.correctAnswer === 'number') {
    const answerIndex = question.correctAnswer;
    if (answerIndex >= 0 && answerIndex < question.options.length) {
      return question.options[answerIndex].toLowerCase().trim();
    }
  }

  return String(question.correctAnswer).toLowerCase().trim();
}

function getWordVariants(word) {
  const variants = [word.toLowerCase()];
  const lowerWord = word.toLowerCase();

  // Einfache Plural-Regeln
  if (lowerWord.endsWith('en')) {
    variants.push(lowerWord.slice(0, -2)); // Eulen -> Eule
    variants.push(lowerWord.slice(0, -1)); // Rehe -> Reh (falls -he)
  }
  if (lowerWord.endsWith('e')) {
    variants.push(lowerWord.slice(0, -1)); // Rehe -> Reh
  }
  if (!lowerWord.endsWith('e') && !lowerWord.endsWith('n')) {
    variants.push(lowerWord + 'e'); // Reh -> Rehe
    variants.push(lowerWord + 'en'); // Eule -> Eulen
  }

  return [...new Set(variants)];
}

function containsAnswer(text, answer) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const answerVariants = getWordVariants(answer);
  const issues = [];

  // Entferne häufige Stoppwörter
  const answerWords = answer
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2);

  for (const answerWord of answerWords) {
    const variants = getWordVariants(answerWord);
    
    for (const variant of variants) {
      // Verwende Wortgrenzen
      const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = Array.from(lowerText.matchAll(regex));
      
      if (matches.length > 0) {
        for (const match of matches) {
          if (match.index !== undefined) {
            issues.push({
              foundAnswer: variant,
              position: match.index,
              context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + variant.length + 30)),
            });
          }
        }
      }
    }
  }

  // Prüfe auch vollständige Antwort für kurze Antworten
  if (answer.length > 3 && answer.length < 30) {
    const fullAnswerRegex = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const fullMatches = Array.from(lowerText.matchAll(fullAnswerRegex));
    
    if (fullMatches.length > 0) {
      for (const match of fullMatches) {
        if (match.index !== undefined) {
          const alreadyFound = issues.some(issue => 
            Math.abs(issue.position - match.index) < 5
          );
          
          if (!alreadyFound) {
            issues.push({
              foundAnswer: answer,
              position: match.index,
              context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + answer.length + 30)),
            });
          }
        }
      }
    }
  }

  return issues;
}

function validateQuestion(question) {
  const issues = [];
  const correctAnswer = getCorrectAnswerText(question);

  // Prüfe question Text
  if (question.question) {
    const questionIssues = containsAnswer(question.question, correctAnswer);
    questionIssues.forEach(issue => {
      issues.push({ ...issue, field: 'question' });
    });
  }

  // Prüfe helpText
  if (question.helpText) {
    const helpTextIssues = containsAnswer(question.helpText, correctAnswer);
    helpTextIssues.forEach(issue => {
      issues.push({ ...issue, field: 'helpText' });
    });
  }

  // Prüfe explanation
  if (question.explanation) {
    const explanationIssues = containsAnswer(question.explanation, correctAnswer);
    explanationIssues.forEach(issue => {
      issues.push({ ...issue, field: 'explanation' });
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    questionId: question.id,
    question: question.question,
    correctAnswer: correctAnswer,
  };
}

async function main() {
  console.log('🔍 Starte Validierung aller Fragen...\n');
  
  try {
    // Verwende tsx um TypeScript-Datei zu importieren
    const { execSync } = await import('child_process');
    const { writeFileSync: writeFile, readFileSync: readFile, unlinkSync } = await import('fs');
    
    // Verwende tsx um die Fragen zu exportieren
    // Setze Umgebungsvariablen auf Dummy-Werte um Firebase-Import zu umgehen
    const env = {
      ...process.env,
      VITE_FIREBASE_API_KEY: 'dummy',
      VITE_FIREBASE_AUTH_DOMAIN: 'dummy',
      VITE_FIREBASE_PROJECT_ID: 'dummy',
      VITE_FIREBASE_APP_ID: 'dummy',
    };
    
    try {
      // Verwende parseQuestions.mjs um Fragen direkt zu parsen (umgeht Firebase-Import)
      execSync('node scripts/parseQuestions.mjs', { 
        stdio: 'pipe', 
        cwd: process.cwd()
      });
      
      // Lade die exportierten Fragen
      let questionsJson;
      try {
        questionsJson = readFileSync('temp-questions.json', 'utf-8');
      } catch (readError) {
        throw new Error('temp-questions.json wurde nicht erstellt.');
      }
      
      const questions = JSON.parse(questionsJson);
      
      // Aufräumen
      unlinkSync('temp-questions.json');
    
      console.log(`📚 ${questions.length} Fragen geladen\n`);
      
      const results = questions.map(q => validateQuestion(q));
    
    const invalidQuestions = results.filter(r => !r.isValid);
    const validQuestions = results.filter(r => r.isValid);
    
    console.log(`✅ ${validQuestions.length} Fragen sind OK`);
    console.log(`❌ ${invalidQuestions.length} Fragen haben Probleme\n`);
    
    if (invalidQuestions.length > 0) {
      console.log('='.repeat(80));
      console.log('PROBLEMATISCHE FRAGEN:');
      console.log('='.repeat(80));
      
      invalidQuestions.forEach((result, index) => {
        console.log(`\n❌ Problem gefunden in Frage '${result.questionId}':`);
        console.log(`   Frage: "${result.question}"`);
        console.log(`   Antwort: "${result.correctAnswer}"`);
        
        result.issues.forEach((issue, issueIndex) => {
          console.log(`\n   ${issueIndex + 1}. Problem im Feld '${issue.field}':`);
          console.log(`      Gefundene Antwort: "${issue.foundAnswer}"`);
          console.log(`      Kontext: "...${issue.context}..."`);
        });
        
        console.log(`\n   💡 Vorschläge zur Korrektur:`);
        result.issues.forEach((issue) => {
          if (issue.field === 'helpText') {
            console.log(`      - helpText umformulieren ohne "${issue.foundAnswer}" zu nennen`);
            console.log(`        Beispiel: Statt direkter Aussage, Hinweise geben wie "Denke an..."`);
          } else if (issue.field === 'question') {
            console.log(`      - Frage umformulieren ohne "${issue.foundAnswer}" zu nennen`);
          } else if (issue.field === 'explanation') {
            console.log(`      - Erklärung umformulieren ohne "${issue.foundAnswer}" zu nennen`);
          }
        });
        
        if (index < invalidQuestions.length - 1) {
          console.log('\n' + '-'.repeat(80));
        }
      });
      
      console.log('\n' + '='.repeat(80));
      console.log(`\n📊 Zusammenfassung: ${invalidQuestions.length} von ${questions.length} Fragen müssen korrigiert werden`);
      
      // Erstelle Report-Datei
      const reportPath = join(process.cwd(), 'question-validation-report.txt');
      const reportLines = [
        `Fragen-Validierungs-Report`,
        `Erstellt am: ${new Date().toLocaleString('de-DE')}`,
        `\nGesamt: ${questions.length} Fragen`,
        `OK: ${validQuestions.length} Fragen`,
        `Probleme: ${invalidQuestions.length} Fragen`,
        `\n${'='.repeat(80)}`,
        `PROBLEMATISCHE FRAGEN:`,
        `${'='.repeat(80)}`,
      ];
      
      invalidQuestions.forEach((result) => {
        reportLines.push(`\n❌ Frage '${result.questionId}':`);
        reportLines.push(`   Frage: "${result.question}"`);
        reportLines.push(`   Antwort: "${result.correctAnswer}"`);
        result.issues.forEach((issue) => {
          reportLines.push(`\n   Problem im Feld '${issue.field}':`);
          reportLines.push(`      Gefundene Antwort: "${issue.foundAnswer}"`);
          reportLines.push(`      Kontext: "...${issue.context}..."`);
        });
        reportLines.push(`\n   💡 Vorschläge:`);
        result.issues.forEach((issue) => {
          if (issue.field === 'helpText') {
            reportLines.push(`      - helpText umformulieren ohne "${issue.foundAnswer}" zu nennen`);
          } else if (issue.field === 'question') {
            reportLines.push(`      - Frage umformulieren ohne "${issue.foundAnswer}" zu nennen`);
          } else if (issue.field === 'explanation') {
            reportLines.push(`      - Erklärung umformulieren ohne "${issue.foundAnswer}" zu nennen`);
          }
        });
      });
      
      writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
      console.log(`\n📄 Detaillierter Report gespeichert in: ${reportPath}`);
      
      process.exit(1);
      } else {
        console.log('\n🎉 Alle Fragen sind valide! Keine Probleme gefunden.');
        process.exit(0);
      }
    } catch (tsxError) {
      // Aufräumen bei Fehler
      try {
        if (readFileSync('temp-export.mjs', 'utf-8')) unlinkSync('temp-export.mjs');
        if (readFileSync('temp-questions.json', 'utf-8')) unlinkSync('temp-questions.json');
      } catch {}
      
      throw new Error('Konnte Fragen nicht laden. Stelle sicher, dass tsx installiert ist: npm install -D tsx');
    }
  } catch (error) {
    console.error('❌ Fehler beim Validieren:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

