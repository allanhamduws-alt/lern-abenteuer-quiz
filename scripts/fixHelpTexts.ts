/**
 * Script zum Neugenerieren von problematischen helpText-Einträgen
 * Bearbeitet die TypeScript-Datei direkt ohne JSON-Parsing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lade Umgebungsvariablen aus .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Prüft ob ein helpText eine Lösung verrät
function revealsSolution(helpText: string, options: string[]): boolean {
  if (!helpText) return false;
  
  // Prüfe auf direkte Lösungsangaben
  for (const option of options) {
    if (helpText.includes(`Als Nächstes kommt ${option}`) ||
        helpText.includes(`Die fehlende Zahl ist ${option}`) ||
        helpText.includes(`Das Ergebnis ist ${option}`) ||
        helpText.includes(`Die Antwort ist ${option}`) ||
        helpText.includes(`Die Lösung ist ${option}`)) {
      return true;
    }
  }
  
  // Prüfe auf mathematische Gleichungen mit Lösungen
  if (/\d+\s*(mal|×)\s*\d+\s*(ist gleich|=)\s*\d+/.test(helpText)) {
    return true;
  }
  
  // Prüfe auf "also X+Y=Z" Muster
  if (/also\s+\d+\s*[+\-×÷]\s*\d+\s*=\s*\d+/.test(helpText)) {
    return true;
  }
  
  return false;
}

// OpenAI API Funktion
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

  const prompt = `Du bist ein sehr freundlicher, liebevoller und pädagogisch geschickter Lehrer für Grundschulkinder. Deine Aufgabe ist es, die folgende Quiz-Frage zu erklären - ABER: Formuliere ALLES komplett neu und in eigenen Worten!

KRITISCHE ANFORDERUNGEN - BITTE SEHR GENAU BEACHTEN:

1. KEINE LÖSUNG VORSAGEN - ABSOLUT VERBOTEN:
   - NIEMALS Sätze wie "Als Nächstes kommt X", "Die Antwort ist Y", "Die Lösung ist Z"
   - NIEMALS mathematische Gleichungen die die Lösung zeigen (z.B. "40×2=80")
   - NIEMALS "also X+Y=Z" Muster verwenden
   - Die Erklärung soll helfen, aber das Kind muss selbst auf die Lösung kommen!

2. SEHR LIEB UND PÄDAGOGISCH SPRECHEN:
   - Sei warmherzig, geduldig und ermutigend
   - Verwende freundliche, einfache Sprache
   - Sei wie ein bester Freund, der hilft
   - Zeige echte Freude am Lernen

3. AB UND ZU PERSÖNLICH - NAMEN ERWÄHNEN:
   - Wenn passend, verwende den Namen des Kindes gelegentlich (z.B. "Hey [Name], schau mal...")
   - Aber nicht in jedem Satz - nur gelegentlich für persönliche Note
   - Klinge natürlich, nicht aufgesetzt

4. FRAGE IN EIGENEN WORTEN NOCHMAL ERKLÄREN:
   - Erkläre die Frage nochmal mit anderen Worten, falls das Kind sie nicht verstanden hat
   - Gib einen anderen Ansatz zur Lösung
   - Zeige verschiedene Denkwege auf
   - Mache es einfacher verständlich

5. SEHR LERNEFFEKTIV:
   - Erkläre das WARUM, nicht nur das WAS
   - Zeige Zusammenhänge auf
   - Gib Denkanstöße, die zum Nachdenken anregen
   - Fördere das Verständnis, nicht nur das Auswendiglernen

STIL:
- Verwende natürliche, umgangssprachliche Formulierungen: "Schau mal, ...", "Hey, ...", "Also, ...", "Du weißt doch, ..."
- Sei ermutigend: "Das schaffst du!", "Versuch es einfach!", "Super!", "Du bist auf dem richtigen Weg!"
- Maximal 4-5 kurze, klare Sätze
- Sei lebendig und interessant - NICHT langweilig!
- Verwende mathematische Symbole als Wörter: "×" → "mal", "÷" → "geteilt durch", "=" → "ist gleich"

Quiz-Frage: "${request.question}"
${request.helpText ? `Original-Tipp (NUR als Inspiration - formuliere es komplett neu OHNE Lösung zu verraten!): "${request.helpText}"` : ''}

WICHTIG: Formuliere jetzt eine komplett neue, liebevolle und pädagogische Erklärung in eigenen Worten - hilfreich aber OHNE die Lösung zu verraten!`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein sehr freundlicher, liebevoller, geduldiger und pädagogisch geschickter Lehrer für Grundschulkinder. Du erklärst Dinge in einfacher, natürlicher Sprache mit viel Emotion und Begeisterung, als würdest du direkt mit dem Kind sprechen. Du bist motivierend, warmherzig und zeigst echte Freude am Lernen. Du verrätst NIEMALS die Lösung direkt, sondern hilfst dem Kind dabei, selbst darauf zu kommen. Du erklärst Fragen in eigenen Worten nochmal, falls das Kind sie nicht verstanden hat, und gibst verschiedene Denkansätze. Du bist sehr lerneffektiv und förderst das Verständnis.'
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

async function fixHelpTexts() {
  console.log('🚀 Starte Neugenerierung von problematischen helpText-Einträgen...\n');
  
  const questionsPath = path.join(__dirname, '../src/data/questions.ts');
  const content = fs.readFileSync(questionsPath, 'utf-8');
  
  // Finde alle helpText-Einträge mit Regex
  const helpTextRegex = /helpText:\s*'([^']*)'/g;
  const questionBlocks = content.split(/\},\s*\n\s*\{/);
  
  console.log(`📚 Gefunden: ${questionBlocks.length} Fragen-Blöcke\n`);
  
  let fixed = 0;
  let skipped = 0;
  let errors = 0;
  let newContent = content;
  
  // Gehe durch alle Frage-Blöcke
  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    
    // Extrahiere Informationen aus dem Block
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const questionMatch = block.match(/question:\s*'([^']+)'/);
    const helpTextMatch = block.match(/helpText:\s*'([^']*)'/);
    const explanationMatch = block.match(/explanation:\s*'([^']*)'/);
    const classMatch = block.match(/class:\s*(\d+)/);
    const subjectMatch = block.match(/subject:\s*'([^']+)'/);
    const optionsMatch = block.match(/options:\s*\[([^\]]+)\]/);
    
    if (!idMatch || !questionMatch) continue;
    
    const id = idMatch[1];
    const question = questionMatch[1];
    const helpText = helpTextMatch ? helpTextMatch[1] : '';
    const explanation = explanationMatch ? explanationMatch[1] : '';
    const classLevel = classMatch ? parseInt(classMatch[1]) as 1 | 2 | 3 | 4 : 1;
    const subject = subjectMatch ? subjectMatch[1] : '';
    const options = optionsMatch 
      ? optionsMatch[1].split(',').map(o => o.trim().replace(/['"]/g, ''))
      : [];
    
    // Prüfe ob helpText problematisch ist
    const isProblematic = helpText && revealsSolution(helpText, options);
    
    if (!isProblematic && helpText) {
      skipped++;
      continue;
    }
    
    if (isProblematic) {
      console.log(`⚠️  Problematischer helpText gefunden: ${id}`);
      console.log(`   Alter helpText: ${helpText.substring(0, 80)}...`);
      
      try {
        console.log(`🔄 Generiere neue Erklärung für: ${id}`);
        
        const newHelpText = await explainForChildren({
          question,
          helpText: explanation || undefined,
          classLevel,
          subject: subject as any,
        });
        
        // Ersetze den helpText in der Datei
        const oldHelpTextPattern = new RegExp(`(helpText:\\s*')${helpText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(')`, 'g');
        newContent = newContent.replace(oldHelpTextPattern, `$1${newHelpText.replace(/'/g, "\\'")}$2`);
        
        fixed++;
        console.log(`✅ Erfolg! Neue Erklärung: ${newHelpText.substring(0, 80)}...\n`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`❌ Fehler bei ${id}:`, error.message);
        errors++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // Backup erstellen
  const backupPath = questionsPath + '.backup.' + Date.now();
  fs.copyFileSync(questionsPath, backupPath);
  console.log(`💾 Backup erstellt: ${backupPath}\n`);
  
  // Neue Datei schreiben
  fs.writeFileSync(questionsPath, newContent, 'utf-8');
  
  console.log('✅ Fertig!');
  console.log(`📊 Statistiken:`);
  console.log(`   - Korrigiert: ${fixed}`);
  console.log(`   - Übersprungen (bereits gut): ${skipped}`);
  console.log(`   - Fehler: ${errors}`);
}

fixHelpTexts().catch((error) => {
  console.error('❌ Fataler Fehler:', error);
  process.exit(1);
});

