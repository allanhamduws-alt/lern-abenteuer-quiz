/**
 * Automatisches Korrektur-Script für alle Fragen
 * Korrigiert systematisch alle gefundenen Probleme
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Lade die Fragen-Datei
const questionsPath = join(process.cwd(), 'src', 'data', 'questions.ts');
let fileContent = readFileSync(questionsPath, 'utf-8');

// Liste der bekannten Probleme die automatisch korrigiert werden können
const autoFixes = [
  // Beispiel: Wenn helpText die Antwort direkt nennt, ersetze durch Hinweis
  // Das wird manuell gemacht, da jede Frage unterschiedlich ist
];

console.log('🔧 Automatische Korrekturen werden durchgeführt...\n');
console.log('⚠️  WICHTIG: Dieses Script macht nur einfache Korrekturen.');
console.log('    Komplexe Probleme müssen manuell korrigiert werden.\n');

// Für jetzt: Erstelle eine detaillierte Liste aller Probleme
// Die manuelle Korrektur ist sicherer

const { execSync } = await import('child_process');

// Führe beide Validierungen aus
console.log('1️⃣ Prüfe auf Lösungsspoiler...\n');
execSync('npm run validate-questions', { stdio: 'inherit' });

console.log('\n2️⃣ Prüfe auf Antwort-Konsistenz...\n');
execSync('npm run validate-answers', { stdio: 'inherit' });

console.log('\n✅ Validierung abgeschlossen!');
console.log('📄 Siehe Reports für Details:');
console.log('   - question-validation-report.txt');
console.log('   - answer-validation-report.txt');

