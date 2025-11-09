/**
 * Pädagogischer Validierungs-Agent für Lernfragen
 * Prüft Fragen auf pädagogische Korrektheit, logische Konsistenz und didaktische Sauberkeit
 * Besonderes Augenmerk liegt auf dem helpText, das als gesprochene Hilfestimme dient
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Stoppwörter die ignoriert werden sollen
// Diese Wörter sind grammatisch notwendig und verraten keine Lösung
// Siehe VALIDATION_RULES.md für Details
// MUSS identisch mit src/utils/questionValidator.ts sein!
const STOP_WORDS = new Set([
  // Artikel
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einer', 'einem', 'eines',
  
  // Pronomen
  'es', 'sie', 'er', 'ihr', 'ihm', 'ihn', 'ihnen', 'uns', 'euch',
  
  // Verben (Hilfsverben & Modalverben)
  'ist', 'sind', 'war', 'waren', 'wird', 'werden', 'wurde', 'wurden',
  'hat', 'haben', 'hatte', 'hatten',
  'kann', 'können', 'muss', 'müssen',
  'soll', 'sollen', 'will', 'wollen',
  
  // Präpositionen
  'mit', 'von', 'zu', 'für', 'auf', 'in', 'an', 'bei', 'über', 'unter', 'durch',
  
  // Konjunktionen
  'und', 'oder', 'aber', 'dass', 'wenn', 'weil', 'obwohl', 'damit',
  
  // Adverbien & Partikel
  'nicht', 'kein', 'keine', 'keinen', 'keinem',
  'auch', 'noch', 'schon', 'immer', 'nie', 'manchmal',
  'sehr', 'viel', 'wenig', 'mehr', 'meist', 'oft',
  
  // Fragewörter
  'wie', 'was', 'wo', 'wann', 'warum', 'wer',
]);

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
  const issues = [];

  // Entferne Stoppwörter aus der Antwort
  // Nur Kernantwort-Wörter werden geprüft, nicht grammatische Wörter
  const answerWords = answer
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

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
  // Aber nur wenn die Antwort nicht nur aus Stoppwörtern besteht
  if (answer.length > 3 && answer.length < 30) {
    const answerWordsCheck = answer.toLowerCase().split(/\s+/);
    const hasOnlyStopWords = answerWordsCheck.every(word => STOP_WORDS.has(word) || word.length <= 2);
    
    // Nur prüfen wenn echte Kernantwort-Wörter enthalten sind
    if (!hasOnlyStopWords) {
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
  }

  return issues;
}

/**
 * Prüft die pädagogische Qualität eines Textes
 * Bewertet Ton, Freundlichkeit und Denkanregung
 */
function evaluatePedagogicalQuality(text, field) {
  if (!text || text.trim().length === 0) {
    return { ok: false, reason: `${field} ist leer` };
  }

  const lowerText = text.toLowerCase();
  const issues = [];

  // Prüfe auf freundliche, pädagogische Sprache
  const friendlyIndicators = [
    'denk', 'überleg', 'schau', 'versuch', 'probier',
    'hilfreich', 'gemeinsam', 'zusammen', 'gut gemacht',
    'super', 'toll', 'prima'
  ];
  const hasFriendlyTone = friendlyIndicators.some(indicator => 
    lowerText.includes(indicator)
  );

  // Prüfe auf zu direkte, unfreundliche Formulierungen
  const unfriendlyPatterns = [
    /\b(du musst|du sollst|du musst|falsch|schlecht|dumm)\b/gi,
    /\b(sofort|jetzt sofort|gleich)\b/gi
  ];
  const hasUnfriendlyTone = unfriendlyPatterns.some(pattern => 
    pattern.test(text)
  );

  // Prüfe auf Denkanregung (Fragen, Hinweise statt direkter Aussagen)
  const thinkingPrompts = [
    'was', 'wie', 'wo', 'wann', 'warum',
    'denk daran', 'überlege', 'schau dir an',
    'erinnere dich', 'weißt du noch'
  ];
  const encouragesThinking = thinkingPrompts.some(prompt => 
    lowerText.includes(prompt)
  );

  // Für helpText: sollte Denkanregung enthalten
  if (field === 'helpText' && !encouragesThinking && !hasFriendlyTone) {
    issues.push('Der helpText sollte das Kind zum Nachdenken anregen, z.B. mit "Denk daran..." oder "Überlege..."');
  }

  if (hasUnfriendlyTone) {
    issues.push('Der Ton wirkt unfreundlich oder zu direktiv');
  }

  return {
    ok: issues.length === 0,
    issues: issues.length > 0 ? issues.join('; ') : null
  };
}

/**
 * Prüft explanation nur auf grobe Qualitätsfehler
 * (NICHT auf Spoiler, da explanation die Antwort enthalten darf)
 */
function validateExplanation(explanation) {
  if (!explanation) {
    return { ok: true, reason: 'explanation ist optional' };
  }

  const lowerText = explanation.toLowerCase();
  const issues = [];

  // Prüfe auf Unverständlichkeit (zu kurz oder zu technisch)
  if (explanation.trim().length < 10) {
    issues.push('explanation ist zu kurz und möglicherweise unverständlich');
  }

  // Prüfe auf widersprüchliche oder feindliche Sprache
  const problematicPatterns = [
    /\b(falsch|schlecht|dumm|blöd)\b/gi
  ];
  if (problematicPatterns.some(pattern => pattern.test(explanation))) {
    issues.push('explanation enthält möglicherweise feindliche oder abwertende Sprache');
  }

  return {
    ok: issues.length === 0,
    reason: issues.length > 0 ? issues.join('; ') : 'explanation ist in Ordnung'
  };
}

/**
 * Validiert eine Frage nach pädagogischen Regeln
 * Gibt JSON-Format zurück wie im Prompt spezifiziert
 */
function validateQuestion(question) {
  const correctAnswer = getCorrectAnswerText(question);
  const result = {
    question_ok: true,
    helpText_ok: true,
    explanation_ignored: true,
    reason: ''
  };

  const reasons = [];

  // 1. Prüfe question Text
  if (question.question) {
    const questionIssues = containsAnswer(question.question, correctAnswer);
    const questionQuality = evaluatePedagogicalQuality(question.question, 'question');

    if (questionIssues.length > 0) {
      result.question_ok = false;
      reasons.push(`question enthält das Antwortwort "${questionIssues[0].foundAnswer}". Bitte umformulieren ohne die Antwort zu verraten.`);
    } else if (!questionQuality.ok) {
      result.question_ok = false;
      reasons.push(`question: ${questionQuality.issues}`);
    } else if (question.question.trim().length < 5) {
      result.question_ok = false;
      reasons.push('question ist zu kurz oder unvollständig');
    }
  } else {
    result.question_ok = false;
    reasons.push('question fehlt');
  }

  // 2. Prüfe helpText (KRITISCH)
  if (question.helpText) {
    const helpTextIssues = containsAnswer(question.helpText, correctAnswer);
    const helpTextQuality = evaluatePedagogicalQuality(question.helpText, 'helpText');

    if (helpTextIssues.length > 0) {
      result.helpText_ok = false;
      const foundWord = helpTextIssues[0].foundAnswer;
      reasons.push(`helpText enthält das exakte Wort der Antwort "${foundWord}". Bitte umformulieren, z.B.: "Denk daran, was mit Wasser passiert, wenn es draußen friert." (statt direkter Nennung)`);
    } else if (!helpTextQuality.ok) {
      result.helpText_ok = false;
      reasons.push(`helpText: ${helpTextQuality.issues}`);
    } else if (question.helpText.trim().length < 10) {
      result.helpText_ok = false;
      reasons.push('helpText ist zu kurz und bietet keine ausreichende Hilfestellung');
    }
  } else {
    // helpText ist optional, aber wenn vorhanden muss es korrekt sein
    // Hier behandeln wir fehlendes helpText als OK
  }

  // 3. Prüfe explanation (NUR auf Qualität, NICHT auf Spoiler)
  if (question.explanation) {
    const explanationCheck = validateExplanation(question.explanation);
    // explanation wird nicht auf Spoiler geprüft, daher explanation_ignored: true
    // Aber wir können Qualitätsprobleme dokumentieren
    if (!explanationCheck.ok) {
      reasons.push(`explanation: ${explanationCheck.reason} (Hinweis: explanation darf die Antwort enthalten)`);
    }
  }

  // Setze Gesamtbewertung
  if (reasons.length === 0) {
    result.reason = 'Alle Regeln erfüllt. Der helpText ist pädagogisch und verrät die Antwort nicht.';
  } else {
    result.reason = reasons.join(' ');
  }

  return {
    ...result,
    questionId: question.id,
    question: question.question,
    answer: correctAnswer,
    helpText: question.helpText,
    explanation: question.explanation,
    isValid: result.question_ok && result.helpText_ok
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
      
      // Validiere alle Fragen
      const results = questions.map(q => validateQuestion(q));
    
      const invalidQuestions = results.filter(r => !r.isValid);
      const validQuestions = results.filter(r => r.isValid);
      
      console.log(`✅ ${validQuestions.length} Fragen sind OK`);
      console.log(`❌ ${invalidQuestions.length} Fragen haben Probleme\n`);
      
      // Erstelle JSON-Report für alle Fragen
      const jsonReport = {
        timestamp: new Date().toISOString(),
        total: questions.length,
        valid: validQuestions.length,
        invalid: invalidQuestions.length,
        results: results.map(r => ({
          questionId: r.questionId,
          question: r.question,
          answer: r.answer,
          validation: {
            question_ok: r.question_ok,
            helpText_ok: r.helpText_ok,
            explanation_ignored: r.explanation_ignored,
            reason: r.reason
          }
        }))
      };
      
      // Speichere JSON-Report
      const jsonReportPath = join(process.cwd(), 'question-validation-report.json');
      writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2), 'utf-8');
      console.log(`📄 JSON-Report gespeichert in: ${jsonReportPath}\n`);
      
      if (invalidQuestions.length > 0) {
        console.log('='.repeat(80));
        console.log('PROBLEMATISCHE FRAGEN:');
        console.log('='.repeat(80));
        
        invalidQuestions.forEach((result, index) => {
          console.log(`\n❌ Problem gefunden in Frage '${result.questionId}':`);
          console.log(`   Frage: "${result.question}"`);
          console.log(`   Antwort: "${result.answer}"`);
          if (result.helpText) {
            console.log(`   helpText: "${result.helpText}"`);
          }
          
          console.log(`\n   📋 Validierungsergebnis (JSON-Format):`);
          console.log(JSON.stringify({
            question_ok: result.question_ok,
            helpText_ok: result.helpText_ok,
            explanation_ignored: result.explanation_ignored,
            reason: result.reason
          }, null, 2));
          
          console.log(`\n   💡 Empfehlung:`);
          if (!result.question_ok) {
            console.log(`      - Frage überarbeiten: ${result.reason.includes('question') ? result.reason.split('question')[1]?.trim() : 'Frage ist unklar oder enthält die Antwort'}`);
          }
          if (!result.helpText_ok) {
            console.log(`      - helpText überarbeiten: ${result.reason.includes('helpText') ? result.reason.split('helpText')[1]?.trim() : 'helpText verrät die Antwort oder ist nicht pädagogisch'}`);
            console.log(`        Beispiel für guten helpText: "Denk daran, was mit Wasser passiert, wenn es draußen friert."`);
            console.log(`        (statt: "Überlege, ob Wasser zu Eis wird, wenn es kalt ist.")`);
          }
          
          if (index < invalidQuestions.length - 1) {
            console.log('\n' + '-'.repeat(80));
          }
        });
        
        console.log('\n' + '='.repeat(80));
        console.log(`\n📊 Zusammenfassung: ${invalidQuestions.length} von ${questions.length} Fragen müssen korrigiert werden`);
        
        // Erstelle auch Text-Report für bessere Lesbarkeit
        const reportPath = join(process.cwd(), 'question-validation-report.txt');
        const reportLines = [
          `Pädagogischer Fragen-Validierungs-Report`,
          `Erstellt am: ${new Date().toLocaleString('de-DE')}`,
          `\nGesamt: ${questions.length} Fragen`,
          `✅ OK: ${validQuestions.length} Fragen`,
          `❌ Probleme: ${invalidQuestions.length} Fragen`,
          `\n${'='.repeat(80)}`,
          `PROBLEMATISCHE FRAGEN:`,
          `${'='.repeat(80)}`,
        ];
        
        invalidQuestions.forEach((result) => {
          reportLines.push(`\n❌ Frage '${result.questionId}':`);
          reportLines.push(`   Frage: "${result.question}"`);
          reportLines.push(`   Antwort: "${result.answer}"`);
          if (result.helpText) {
            reportLines.push(`   helpText: "${result.helpText}"`);
          }
          reportLines.push(`\n   Validierung:`);
          reportLines.push(`   - question_ok: ${result.question_ok}`);
          reportLines.push(`   - helpText_ok: ${result.helpText_ok}`);
          reportLines.push(`   - explanation_ignored: ${result.explanation_ignored}`);
          reportLines.push(`   - Grund: ${result.reason}`);
        });
        
        writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
        console.log(`📄 Text-Report gespeichert in: ${reportPath}`);
        
        process.exit(1);
      } else {
        console.log('\n🎉 Alle Fragen sind valide! Keine Probleme gefunden.');
        console.log('\n📋 Beispiel-Validierung (JSON-Format):');
        if (results.length > 0) {
          const example = results[0];
          console.log(JSON.stringify({
            question_ok: example.question_ok,
            helpText_ok: example.helpText_ok,
            explanation_ignored: example.explanation_ignored,
            reason: example.reason
          }, null, 2));
        }
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

