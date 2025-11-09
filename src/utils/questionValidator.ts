/**
 * Fragen-Validierung gegen Lösungsspoiler
 * Prüft ob die richtige Antwort im Fragetext, helpText oder explanation vorkommt
 */

import type { Question } from '../types';

export interface ValidationIssue {
  field: 'question' | 'helpText' | 'explanation';
  text: string;
  foundAnswer: string;
  position: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  questionId: string;
}

// Stoppwörter die ignoriert werden sollen
// Diese Wörter sind grammatisch notwendig und verraten keine Lösung
// Siehe VALIDATION_RULES.md für Details
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

// Einfache Plural-Regeln für deutsche Wörter
const PLURAL_RULES = [
  { singular: /e$/, plural: (word: string) => word + 'n' }, // Eule -> Eulen
  { singular: /h$/, plural: (word: string) => word + 'e' }, // Reh -> Rehe
  { singular: /er$/, plural: (word: string) => word + 'n' }, // Lehrer -> Lehrern
  { singular: /el$/, plural: (word: string) => word + 'n' }, // Vogel -> Vögeln
  { singular: /en$/, plural: (word: string) => word }, // bereits Plural
];

/**
 * Generiert Varianten eines Wortes (Singular/Plural)
 */
function getWordVariants(word: string): string[] {
  const variants = [word.toLowerCase()];
  const lowerWord = word.toLowerCase();

  // Prüfe ob es bereits Plural ist (endet auf -en, -e, etc.)
  if (lowerWord.endsWith('en') || lowerWord.endsWith('e')) {
    // Versuche Singular zu bilden
    if (lowerWord.endsWith('en')) {
      variants.push(lowerWord.slice(0, -2)); // Eulen -> Eule
      variants.push(lowerWord.slice(0, -1)); // Rehe -> Reh (falls -he)
    }
    if (lowerWord.endsWith('e')) {
      variants.push(lowerWord.slice(0, -1)); // Rehe -> Reh
    }
  } else {
    // Versuche Plural zu bilden
    for (const rule of PLURAL_RULES) {
      if (rule.singular.test(lowerWord)) {
        const plural = rule.plural(lowerWord);
        if (plural !== lowerWord) {
          variants.push(plural);
        }
      }
    }
    // Fallback: füge -e oder -en hinzu
    if (!lowerWord.endsWith('e') && !lowerWord.endsWith('n')) {
      variants.push(lowerWord + 'e');
      variants.push(lowerWord + 'en');
    }
  }

  return [...new Set(variants)]; // Entferne Duplikate
}

/**
 * Extrahiert die richtige Antwort aus einer Question
 */
function getCorrectAnswerText(question: Question): string {
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

/**
 * Prüft ob ein Text eine Antwort enthält
 */
function containsAnswer(text: string, answer: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const lowerText = text.toLowerCase();
  // const answerVariants = getWordVariants(answer); // Für zukünftige Verwendung

  // Entferne Stoppwörter aus der Antwort
  const answerWords = answer
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  // Prüfe jedes Wort der Antwort
  for (const answerWord of answerWords) {
    const variants = getWordVariants(answerWord);
    
    for (const variant of variants) {
      // Verwende Wortgrenzen um ganze Wörter zu finden
      const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = Array.from(lowerText.matchAll(regex));
      
      if (matches.length > 0) {
        for (const match of matches) {
          if (match.index !== undefined) {
            issues.push({
              field: 'question', // Wird später korrekt gesetzt
              text: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + variant.length + 20)),
              foundAnswer: variant,
              position: match.index,
            });
          }
        }
      }
    }
  }

  // Prüfe auch die vollständige Antwort (für kurze Antworten)
  if (answer.length > 3 && answer.length < 30) {
    const fullAnswerRegex = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const fullMatches = Array.from(lowerText.matchAll(fullAnswerRegex));
    
    if (fullMatches.length > 0) {
      for (const match of fullMatches) {
        if (match.index !== undefined) {
          // Prüfe ob es nicht schon als einzelnes Wort gefunden wurde
          const alreadyFound = issues.some(issue => 
            Math.abs(issue.position - match.index) < 5
          );
          
          if (!alreadyFound) {
            issues.push({
              field: 'question',
              text: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + answer.length + 20)),
              foundAnswer: answer,
              position: match.index,
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Validiert eine einzelne Frage
 */
export function validateQuestion(question: Question): ValidationResult {
  const issues: ValidationIssue[] = [];
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

  // Prüfe explanation (optional, da nur bei falschen Antworten sichtbar)
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
  };
}

/**
 * Validiert mehrere Fragen
 */
export function validateQuestions(questions: Question[]): ValidationResult[] {
  return questions.map(question => validateQuestion(question));
}

