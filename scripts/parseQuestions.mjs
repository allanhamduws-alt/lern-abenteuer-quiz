/**
 * Parst Fragen direkt aus der TypeScript-Datei
 * Umgeht Import-Probleme mit Firebase
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function parseQuestionsFromFile() {
  const questionsPath = join(process.cwd(), 'src', 'data', 'questions.ts');
  const fileContent = readFileSync(questionsPath, 'utf-8');
  
  // Finde das questions Array
  // Suche nach "export const questions: Question[] = ["
  const startMarker = 'export const questions: Question[] = [';
  const startIndex = fileContent.indexOf(startMarker);
  
  if (startIndex === -1) {
    throw new Error('Konnte questions Array nicht finden');
  }
  
  // Finde das Ende des Arrays (matching brackets)
  let bracketCount = 0;
  let inString = false;
  let stringChar = null;
  let endIndex = startIndex + startMarker.length;
  
  for (let i = startIndex + startMarker.length; i < fileContent.length; i++) {
    const char = fileContent[i];
    const prevChar = i > 0 ? fileContent[i - 1] : '';
    
    // Handle Strings
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
      continue;
    }
    
    if (inString) continue;
    
    // Count brackets
    if (char === '[') bracketCount++;
    if (char === ']') {
      bracketCount--;
      if (bracketCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  const arrayContent = fileContent.substring(startIndex + startMarker.length, endIndex - 1);
  
  // Parse das Array als JSON-ähnliche Struktur
  // Das ist komplex, also verwenden wir einen einfacheren Ansatz:
  // Wir evaluieren nur den Array-Teil in einem sicheren Kontext
  
  // Für jetzt: Exportiere den rohen Array-Content
  // Der Validator kann dann die Fragen direkt parsen
  return arrayContent;
}

// Einfacherer Ansatz: Extrahiere nur die Frage-Objekte mit Regex
function extractQuestionObjects(fileContent) {
  const questions = [];
  
  // Suche nach Frage-Objekten mit Regex
  // Pattern: { id: '...', class: ..., question: '...', ... }
  const questionPattern = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*class:\s*(\d+)\s*,\s*subject:\s*['"]([^'"]+)['"]\s*,\s*question:\s*['"`]([^'"`]+)['"`]\s*,\s*options:\s*\[([^\]]+)\]\s*,\s*correctAnswer:\s*(\d+)\s*,[^}]*helpText:\s*['"`]([^'"`]*)['"`]?[^}]*\}/gs;
  
  // Einfacherer Ansatz: Verwende einen Parser der TypeScript versteht
  // Für jetzt: Manuell parsen mit einfachen Regex-Patterns
  
  // Split bei jedem Frage-Objekt (beginnt mit { id:)
  const questionBlocks = fileContent.split(/\{\s*id:\s*['"]/);
  
  for (let i = 1; i < questionBlocks.length; i++) {
    const block = '{ id: "' + questionBlocks[i];
    
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
    const options = optionsStr.split(',').map(opt => opt.trim().replace(/^['"]|['"]$/g, ''));
    
    // Extrahiere correctAnswer
    const answerMatch = block.match(/correctAnswer:\s*(\d+)/);
    if (!answerMatch) continue;
    
    const correctAnswer = parseInt(answerMatch[1]);
    
    // Extrahiere helpText (optional)
    const helpTextMatch = block.match(/helpText:\s*['"`]([^'"`]*)['"`]/);
    const helpText = helpTextMatch ? helpTextMatch[1] : undefined;
    
    // Extrahiere explanation (optional)
    const explanationMatch = block.match(/explanation:\s*['"`]([^'"`]*)['"`]/);
    const explanation = explanationMatch ? explanationMatch[1] : undefined;
    
    questions.push({
      id,
      question,
      options,
      correctAnswer,
      helpText,
      explanation,
    });
  }
  
  return questions;
}

try {
  const questionsPath = join(process.cwd(), 'src', 'data', 'questions.ts');
  const fileContent = readFileSync(questionsPath, 'utf-8');
  
  // Versuche Fragen zu extrahieren
  const questions = extractQuestionObjects(fileContent);
  
  if (questions.length === 0) {
    throw new Error('Konnte keine Fragen extrahieren');
  }
  
  writeFileSync('temp-questions.json', JSON.stringify(questions, null, 2));
  console.log(`Extracted ${questions.length} questions`);
} catch (error) {
  console.error('Fehler:', error.message);
  process.exit(1);
}

