/**
 * Automatische Korrekturen für häufigste Probleme
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const questionsPath = join(process.cwd(), 'src', 'data', 'questions.ts');
let content = readFileSync(questionsPath, 'utf-8');

const fixes = [
  // Futur
  {
    pattern: /helpText:\s*['"`]Das Futur beschreibt[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Das Futur beschreibt[^'"`]*/, 'Überlege, welche Zeitform eine Handlung in der Zukunft beschreibt. Welches Verb passt dazu?');
    }
  },
  {
    pattern: /helpText:\s*['"`][^'"`]*Überlege, welches Verb im Futur steht[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Überlege, welches Verb im Futur steht[^'"`]*/, 'Überlege, welche Zeitform eine Handlung in der Zukunft beschreibt. Welches Verb passt dazu?');
    }
  },
  
  // Perfekt
  {
    pattern: /helpText:\s*['"`]Das Perfekt beschreibt[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Das Perfekt beschreibt[^'"`]*/, 'Überlege, welche Zeitform eine abgeschlossene Handlung beschreibt. Welches Verb passt dazu?');
    }
  },
  {
    pattern: /helpText:\s*['"`][^'"`]*Überlege, welches Verb im Perfekt steht[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Überlege, welches Verb im Perfekt steht[^'"`]*/, 'Überlege, welche Zeitform eine abgeschlossene Handlung beschreibt. Welches Verb passt dazu?');
    }
  },
  
  // Adjektiv
  {
    pattern: /helpText:\s*['"`][^'"`]*Überlege, welches Wort ein Adjektiv ist[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Überlege, welches Wort ein Adjektiv ist[^'"`]*/, 'Überlege, welche Wortart beschreibt, wie etwas ist. Welches Wort passt dazu?');
    }
  },
  {
    pattern: /helpText:\s*['"`]Adjektive beschreiben[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Adjektive beschreiben[^'"`]*/, 'Überlege, welche Wortart beschreibt, wie etwas ist. Welches Wort passt dazu?');
    }
  },
  
  // Objekt
  {
    pattern: /helpText:\s*['"`]Das Objekt ist[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Das Objekt ist[^'"`]*/, 'Überlege, welches Satzglied die Person oder Sache ist, auf die sich die Handlung bezieht. Welches Wort passt dazu?');
    }
  },
  {
    pattern: /helpText:\s*['"`][^'"`]*Überlege, welches Wort das Objekt ist[^'"`]*['"`]/g,
    replacement: (match) => {
      return match.replace(/Überlege, welches Wort das Objekt ist[^'"`]*/, 'Überlege, welches Satzglied die Person oder Sache ist, auf die sich die Handlung bezieht. Welches Wort passt dazu?');
    }
  },
];

let fixCount = 0;

fixes.forEach((fix, index) => {
  const matches = content.match(fix.pattern);
  if (matches) {
    console.log(`Fix ${index + 1}: ${matches.length} Treffer gefunden`);
    content = content.replace(fix.pattern, (match) => {
      fixCount++;
      return fix.replacement(match);
    });
  }
});

if (fixCount > 0) {
  writeFileSync(questionsPath, content, 'utf-8');
  console.log(`\n✅ ${fixCount} automatische Korrekturen durchgeführt`);
} else {
  console.log('\n⚠️  Keine automatischen Korrekturen möglich');
}

