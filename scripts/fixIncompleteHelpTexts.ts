/**
 * Script zum Reparieren von unvollständigen helpText-Einträgen
 * Ersetzt unvollständige helpText durch explanation (ohne direkte Lösungsangaben)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Entfernt direkte Lösungsangaben aus einem Text
function removeSolution(text: string, options: string[]): string {
  let cleaned = text;
  
  // Entferne direkte Lösungsangaben
  for (const option of options) {
    // Entferne Sätze wie "Die Antwort ist X", "Die Lösung ist X", etc.
    cleaned = cleaned.replace(
      new RegExp(`(Die|Das|Der)\\s+(Antwort|Lösung|Ergebnis|fehlende Zahl|fehlende Buchstabe|richtige Antwort|richtige Lösung)\\s+(ist|kommt|wäre)\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[!.]?`, 'gi'),
      'Die richtige Lösung findest du, wenn du genau überlegst!'
    );
    
    // Entferne "Als Nächstes kommt X"
    cleaned = cleaned.replace(
      new RegExp(`Als\\s+Nächstes\\s+kommt\\s*${option.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[!.]?`, 'gi'),
      'Als Nächstes kommt die richtige Zahl, wenn du das Muster erkennst!'
    );
  }
  
  // Entferne mathematische Gleichungen mit Lösungen
  cleaned = cleaned.replace(/\d+\s*(mal|×)\s*\d+\s*(ist gleich|=)\s*\d+/gi, 'Rechne die Aufgabe Schritt für Schritt!');
  cleaned = cleaned.replace(/also\s+\d+\s*[+\-×÷]\s*\d+\s*=\s*\d+/gi, 'Rechne die Aufgabe Schritt für Schritt!');
  
  return cleaned.trim();
}

// Generiert einen Fallback-Text basierend auf Fach und Klasse
function generateFallback(classLevel: number, subject: string): string {
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

async function fixIncompleteHelpTexts() {
  console.log('🚀 Starte Reparatur von unvollständigen helpText-Einträgen...\n');
  
  const questionsPath = path.join(__dirname, '../src/data/questions.ts');
  let content = fs.readFileSync(questionsPath, 'utf-8');
  
  // Finde alle Frage-Blöcke
  const questionBlocks = content.split(/\},\s*\n\s*\{/);
  console.log(`📚 Gefunden: ${questionBlocks.length} Fragen-Blöcke\n`);
  
  let fixed = 0;
  let skipped = 0;
  
  // Gehe durch alle Frage-Blöcke
  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    
    // Extrahiere Informationen
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const helpTextMatch = block.match(/helpText:\s*'([^']*)'/);
    const explanationMatch = block.match(/explanation:\s*'([^']*)'/);
    const classMatch = block.match(/class:\s*(\d+)/);
    const subjectMatch = block.match(/subject:\s*'([^']+)'/);
    const optionsMatch = block.match(/options:\s*\[([^\]]+)\]/);
    
    if (!idMatch) continue;
    
    const id = idMatch[1];
    const helpText = helpTextMatch ? helpTextMatch[1] : '';
    const explanation = explanationMatch ? explanationMatch[1] : '';
    const classLevel = classMatch ? parseInt(classMatch[1]) : 1;
    const subject = subjectMatch ? subjectMatch[1] : '';
    const options = optionsMatch 
      ? optionsMatch[1].split(',').map(o => o.trim().replace(/['"]/g, ''))
      : [];
    
    // Prüfe ob helpText unvollständig ist (endet mit Leerzeichen oder ist sehr kurz)
    const isIncomplete = helpText && (
      helpText.trim().endsWith(' ') || 
      helpText.trim().length < 20 ||
      helpText.trim().endsWith("'") === false && helpText.match(/^[^']{0,15}$/)
    );
    
    if (!isIncomplete) {
      skipped++;
      continue;
    }
    
    console.log(`⚠️  Unvollständiger helpText gefunden: ${id}`);
    console.log(`   Alter helpText: "${helpText}"`);
    
    // Verwende explanation als Basis, entferne aber Lösungsangaben
    let newHelpText = '';
    
    if (explanation && explanation.trim().length > 0) {
      // Entferne direkte Lösungsangaben
      newHelpText = removeSolution(explanation, options);
      
      // Wenn nach dem Entfernen der Lösung der Text zu kurz ist, verwende Fallback
      if (newHelpText.trim().length < 30) {
        newHelpText = generateFallback(classLevel, subject);
      }
    } else {
      // Keine explanation vorhanden, verwende Fallback
      newHelpText = generateFallback(classLevel, subject);
    }
    
    // Ersetze den helpText in der Datei
    // Escaped den alten helpText für Regex
    const escapedOldHelpText = helpText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldHelpTextPattern = new RegExp(`(helpText:\\s*')${escapedOldHelpText}(')`, 'g');
    const escapedNewHelpText = newHelpText.replace(/'/g, "\\'");
    content = content.replace(oldHelpTextPattern, `$1${escapedNewHelpText}$2`);
    
    fixed++;
    console.log(`✅ Repariert! Neuer helpText: "${newHelpText.substring(0, 80)}..."\n`);
  }
  
  // Backup erstellen
  const backupPath = questionsPath + '.backup.' + Date.now();
  fs.copyFileSync(questionsPath, backupPath);
  console.log(`💾 Backup erstellt: ${backupPath}\n`);
  
  // Neue Datei schreiben
  fs.writeFileSync(questionsPath, content, 'utf-8');
  
  console.log('✅ Fertig!');
  console.log(`📊 Statistiken:`);
  console.log(`   - Repariert: ${fixed}`);
  console.log(`   - Übersprungen (bereits vollständig): ${skipped}`);
}

fixIncompleteHelpTexts().catch((error) => {
  console.error('❌ Fataler Fehler:', error);
  process.exit(1);
});

