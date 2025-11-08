/**
 * Validiert ob correctAnswer wirklich zur richtigen Option passt
 * Findet Fehler wo falsche Antworten als richtig markiert sind
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function parseQuestionsFromFile() {
  const questionsPath = join(process.cwd(), 'src', 'data', 'questions.ts');
  const fileContent = readFileSync(questionsPath, 'utf-8');
  
  const questions = [];
  
  // Suche nach allen Frage-Objekten
  // Pattern: { id: '...', ... correctAnswer: X, ... }
  const questionBlocks = fileContent.split(/\{\s*id:\s*['"]/);
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = '{ id: "' + questionBlocks[i];
    
    try {
      // Extrahiere id
      const idMatch = block.match(/id:\s*['"]([^'"]+)['"]/);
      if (!idMatch) continue;
      const id = idMatch[1];
      
      // Extrahiere question
      const questionMatch = block.match(/question:\s*['"`]([^'"`]+)['"`]/);
      if (!questionMatch) continue;
      const question = questionMatch[1];
      
      // Extrahiere options
      const optionsMatch = block.match(/options:\s*\[([^\]]+)\]/);
      if (!optionsMatch) continue;
      const optionsStr = optionsMatch[1];
      const options = optionsStr.split(',').map(opt => {
        const cleaned = opt.trim();
        // Entferne Quotes und Backticks
        return cleaned.replace(/^['"`]|['"`]$/g, '').trim();
      });
      
      // Extrahiere correctAnswer
      const answerMatch = block.match(/correctAnswer:\s*(\d+)/);
      if (!answerMatch) continue;
      const correctAnswerIndex = parseInt(answerMatch[1]);
      
      // Extrahiere explanation
      const explanationMatch = block.match(/explanation:\s*['"`]([^'"`]*)['"`]/);
      const explanation = explanationMatch ? explanationMatch[1] : undefined;
      
      // Extrahiere helpText
      const helpTextMatch = block.match(/helpText:\s*['"`]([^'"`]*)['"`]/);
      const helpText = helpTextMatch ? helpTextMatch[1] : undefined;
      
      questions.push({
        id,
        question,
        options,
        correctAnswerIndex,
        correctAnswerText: options[correctAnswerIndex],
        explanation,
        helpText,
      });
    } catch (error) {
      console.warn(`Fehler beim Parsen von Frage ${i}:`, error.message);
    }
  }
  
  return questions;
}

function validateAnswerConsistency(question) {
  const issues = [];
  
  // Prüfe ob correctAnswerIndex gültig ist
  if (question.correctAnswerIndex < 0 || question.correctAnswerIndex >= question.options.length) {
    issues.push({
      type: 'INVALID_INDEX',
      message: `correctAnswer Index ${question.correctAnswerIndex} ist außerhalb des Options-Arrays (0-${question.options.length - 1})`,
    });
    return issues;
  }
  
  const correctAnswer = question.correctAnswerText;
  
  // Prüfe ob die Erklärung zur richtigen Antwort passt
  if (question.explanation) {
    const explanationLower = question.explanation.toLowerCase();
    const correctAnswerLower = correctAnswer.toLowerCase();
    
    // Prüfe ob die Erklärung die richtige Antwort bestätigt
    // Suche nach Mustern wie "Die richtige Antwort ist X" oder "X ist richtig"
    const confirmsCorrect = explanationLower.includes(`ist ${correctAnswerLower}`) ||
                           explanationLower.includes(`${correctAnswerLower} ist`) ||
                           explanationLower.includes(`richtige antwort ist ${correctAnswerLower}`) ||
                           explanationLower.includes(`${correctAnswerLower} richtig`);
    
    // Prüfe ob die Erklärung eine andere Antwort als richtig bezeichnet
    for (let i = 0; i < question.options.length; i++) {
      if (i === question.correctAnswerIndex) continue;
      
      const optionLower = question.options[i].toLowerCase();
      if (optionLower !== correctAnswerLower) {
        // Prüfe ob diese Option in der Erklärung als richtig bezeichnet wird
        // Aber ignoriere wenn die Option nur als Vergleich erwähnt wird (z.B. "20°C ist wärmer als 0°C")
        const isComparison = explanationLower.includes(`${correctAnswerLower} ist`) && 
                            explanationLower.includes(`als ${optionLower}`) ||
                            explanationLower.includes(`${correctAnswerLower} ist wärmer als ${optionLower}`) ||
                            explanationLower.includes(`${correctAnswerLower} ist größer als ${optionLower}`);
        
        if (!isComparison) {
          if (explanationLower.includes(`ist ${optionLower}`) && !explanationLower.includes(`als ${optionLower}`) ||
              explanationLower.includes(`${optionLower} ist`) && !explanationLower.includes(`${correctAnswerLower} ist`) ||
              explanationLower.includes(`richtige antwort ist ${optionLower}`) ||
              explanationLower.includes(`${optionLower} richtig`)) {
            issues.push({
              type: 'EXPLANATION_MISMATCH',
              message: `Erklärung bezeichnet "${question.options[i]}" als richtig, aber correctAnswer ist "${correctAnswer}"`,
              wrongAnswer: question.options[i],
              correctAnswer: correctAnswer,
            });
          }
        }
      }
    }
  }
  
  // Prüfe auf offensichtliche Rechtschreibfehler in der "richtigen" Antwort
  // Beispiel: "ersheinen" statt "erscheinen"
  if (question.question) {
    const questionLower = question.question.toLowerCase();
    
    // Suche nach Wörtern in Anführungszeichen in der Frage
    const quotedWords = question.question.match(/["']([^"']+)["']/g);
    if (quotedWords) {
      quotedWords.forEach(quoted => {
        const word = quoted.replace(/["']/g, '').toLowerCase();
        // Prüfe ob die richtige Antwort anders geschrieben ist als das Wort in der Frage
        if (correctAnswer.toLowerCase() !== word && 
            correctAnswer.toLowerCase().includes(word.substring(0, 3))) {
          // Möglicher Rechtschreibfehler
          issues.push({
            type: 'SPELLING_MISMATCH',
            message: `Frage enthält "${word}" aber richtige Antwort ist "${correctAnswer}" - möglicher Rechtschreibfehler?`,
            wordInQuestion: word,
            correctAnswer: correctAnswer,
          });
        }
      });
    }
  }
  
  return issues;
}

async function main() {
  console.log('🔍 Starte Validierung aller Antworten...\n');
  
  try {
    const questions = parseQuestionsFromFile();
    console.log(`📚 ${questions.length} Fragen geladen\n`);
    
    const allIssues = [];
    
    questions.forEach((question, index) => {
      const issues = validateAnswerConsistency(question);
      if (issues.length > 0) {
        allIssues.push({
          question,
          issues,
        });
      }
    });
    
    console.log(`✅ ${questions.length - allIssues.length} Fragen sind konsistent`);
    console.log(`❌ ${allIssues.length} Fragen haben Konsistenz-Probleme\n`);
    
    if (allIssues.length > 0) {
      console.log('='.repeat(80));
      console.log('KRITISCHE FEHLER GEFUNDEN:');
      console.log('='.repeat(80));
      
      allIssues.forEach((item, index) => {
        const { question, issues } = item;
        
        console.log(`\n❌ KRITISCHER FEHLER in Frage '${question.id}':`);
        console.log(`   Frage: "${question.question}"`);
        console.log(`   Optionen: ${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join(', ')}`);
        console.log(`   Aktuell als richtig markiert: Option ${String.fromCharCode(65 + question.correctAnswerIndex)} - "${question.correctAnswerText}"`);
        
        issues.forEach((issue, issueIndex) => {
          console.log(`\n   ${issueIndex + 1}. ${issue.type}:`);
          console.log(`      ${issue.message}`);
          if (issue.wrongAnswer) {
            console.log(`      ❌ Falsch markiert: "${issue.wrongAnswer}"`);
            console.log(`      ✅ Sollte sein: "${issue.correctAnswer}"`);
          }
        });
        
        if (index < allIssues.length - 1) {
          console.log('\n' + '-'.repeat(80));
        }
      });
      
      // Erstelle Report
      const reportPath = join(process.cwd(), 'answer-validation-report.txt');
      const reportLines = [
        `Antwort-Konsistenz-Report`,
        `Erstellt am: ${new Date().toLocaleString('de-DE')}`,
        `\nGesamt: ${questions.length} Fragen`,
        `OK: ${questions.length - allIssues.length} Fragen`,
        `KRITISCHE FEHLER: ${allIssues.length} Fragen`,
        `\n${'='.repeat(80)}`,
        `KRITISCHE FEHLER:`,
        `${'='.repeat(80)}`,
      ];
      
      allIssues.forEach((item) => {
        const { question, issues } = item;
        reportLines.push(`\n❌ Frage '${question.id}':`);
        reportLines.push(`   Frage: "${question.question}"`);
        reportLines.push(`   Optionen: ${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join(', ')}`);
        reportLines.push(`   Aktuell markiert: Option ${String.fromCharCode(65 + question.correctAnswerIndex)} - "${question.correctAnswerText}"`);
        issues.forEach((issue) => {
          reportLines.push(`\n   ${issue.type}: ${issue.message}`);
          if (issue.wrongAnswer) {
            reportLines.push(`   ❌ Falsch: "${issue.wrongAnswer}"`);
            reportLines.push(`   ✅ Richtig: "${issue.correctAnswer}"`);
          }
        });
      });
      
      writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
      console.log(`\n📄 Detaillierter Report gespeichert in: ${reportPath}`);
      
      process.exit(1);
    } else {
      console.log('\n🎉 Alle Antworten sind konsistent! Keine Fehler gefunden.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

