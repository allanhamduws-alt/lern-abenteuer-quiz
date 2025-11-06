/**
 * Gemini API Service für kindgerechte Erklärungen
 * Generiert einfache, kindgerechte Erklärungen für Quiz-Fragen
 */

export interface ExplainRequest {
  question: string;
  helpText?: string;
  classLevel: 1 | 2 | 3 | 4;
  subject?: string;
  topic?: string;
}

/**
 * Generiert eine kindgerechte Erklärung für eine Quiz-Frage
 * Nutzt die Gemini API, um den Text in einfacher, kindgerechter Sprache zu erklären
 */
export async function explainForChildren(request: ExplainRequest): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  console.log('🔍 Gemini API aufrufen...', { 
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'KEIN KEY',
    question: request.question.substring(0, 50) + '...',
    allEnvVars: Object.keys(import.meta.env).filter(k => k.includes('GEMINI'))
  });
  
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    console.warn('⚠️ Gemini API Key nicht gefunden oder leer!', {
      apiKey: apiKey,
      envVar: import.meta.env.VITE_GEMINI_API_KEY
    });
    console.warn('⚠️ Verwende Fallback-Erklärung. Bitte Server neu starten, falls Key in .env.local hinzugefügt wurde.');
    return request.helpText || generateFallbackExplanation(request);
  }

  try {
    const prompt = buildPrompt(request);
    console.log('📝 Prompt erstellt, sende Anfrage an Gemini...');
    
    // ZUERST: Liste verfügbare Modelle ab (wie von der API empfohlen!)
    console.log('🔍 Prüfe verfügbare Modelle für diesen API-Key...');
    let availableModels: string[] = [];
    
    try {
      // Versuche v1beta zuerst mit API-Key im Header
      const listModelsUrlV1Beta = `https://generativelanguage.googleapis.com/v1beta/models`;
      console.log('📋 Rufe verfügbare Modelle ab (v1beta)...');
      const modelsResponseV1Beta = await fetch(listModelsUrlV1Beta, {
        headers: {
          'x-goog-api-key': apiKey,
        },
      });
      
      if (modelsResponseV1Beta.ok) {
        const modelsDataV1Beta = await modelsResponseV1Beta.json();
        console.log('✅ Verfügbare Modelle (v1beta):', modelsDataV1Beta);
        
        if (modelsDataV1Beta.models && Array.isArray(modelsDataV1Beta.models)) {
          availableModels = modelsDataV1Beta.models
            .map((m: any) => m.name?.replace('models/', ''))
            .filter((name: string) => name && name.includes('gemini'));
          console.log('📌 Gefundene Gemini-Modelle (v1beta):', availableModels);
        }
      } else {
        const errorText = await modelsResponseV1Beta.text();
        console.warn('⚠️ Konnte Modelle für v1beta nicht abrufen:', modelsResponseV1Beta.status);
        console.warn('Fehler-Details:', errorText);
      }
    } catch (listError) {
      console.warn('⚠️ Fehler beim Abrufen der Modelle (v1beta):', listError);
    }
    
    // Wenn keine Modelle gefunden, versuche v1
    if (availableModels.length === 0) {
      try {
        const listModelsUrlV1 = `https://generativelanguage.googleapis.com/v1/models`;
        console.log('📋 Rufe verfügbare Modelle ab (v1)...');
        const modelsResponseV1 = await fetch(listModelsUrlV1, {
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        
        if (modelsResponseV1.ok) {
          const modelsDataV1 = await modelsResponseV1.json();
          console.log('✅ Verfügbare Modelle (v1):', modelsDataV1);
          
          if (modelsDataV1.models && Array.isArray(modelsDataV1.models)) {
            availableModels = modelsDataV1.models
              .map((m: any) => m.name?.replace('models/', ''))
              .filter((name: string) => name && name.includes('gemini'));
            console.log('📌 Gefundene Gemini-Modelle (v1):', availableModels);
          }
        } else {
          const errorText = await modelsResponseV1.text();
          console.warn('⚠️ Konnte Modelle für v1 nicht abrufen:', modelsResponseV1.status);
          console.warn('Fehler-Details:', errorText);
        }
      } catch (listError) {
        console.warn('⚠️ Fehler beim Abrufen der Modelle (v1):', listError);
      }
    }
    
    // Wenn wir verfügbare Modelle haben, verwende diese, sonst Fallback auf Standard-Liste
    const modelsToTry = availableModels.length > 0 
      ? availableModels 
      : ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    
    const apiVersions = ['v1beta', 'v1']; // Teste beide Versionen
    
    for (const version of apiVersions) {
      for (const modelName of modelsToTry) {
        try {
          // API-Key im Header statt Query-Parameter!
          const apiUrl = `https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent`;
          
          console.log(`🔄 Versuche Modell: ${modelName} mit ${version} API (Header-Auth)...`);
          console.log('🌐 API URL:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey, // WICHTIG: API-Key im Header!
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          });

          console.log(`📡 Gemini API Antwort für ${modelName} (${version}):`, response.status, response.statusText);

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Gemini API Daten empfangen:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              const explanation = data.candidates[0].content.parts[0].text.trim();
              console.log(`🎉 Erklärung mit ${modelName} (${version}) generiert:`, explanation.substring(0, 100) + '...');
              return explanation;
            }
          } else {
            const errorText = await response.text();
            console.warn(`⚠️ ${modelName} (${version}) nicht verfügbar:`, response.status);
            console.warn('📄 Fehler-Details:', errorText);
            
            // Wenn es kein 404 ist, breche ab (z.B. bei Auth-Fehlern)
            if (response.status !== 404) {
              throw new Error(`Gemini API Fehler: ${response.status} ${response.statusText}`);
            }
            // Bei 404: Versuche nächste Konfiguration
            continue;
          }
        } catch (modelError) {
          console.warn(`⚠️ Fehler mit Modell ${modelName} (${version}):`, modelError);
          continue;
        }
      }
    }
    
    // Wenn alle Modelle fehlgeschlagen sind
    throw new Error('Alle Gemini-Modelle sind nicht verfügbar');
  } catch (error) {
    console.error('❌ Fehler beim Aufruf der Gemini API:', error);
    // Fallback auf die ursprüngliche Hilfe-Erklärung
    return request.helpText || generateFallbackExplanation(request);
  }
}

/**
 * Erstellt einen Prompt für die Gemini API
 */
function buildPrompt(request: ExplainRequest): string {
  const { question, helpText, classLevel, subject, topic } = request;
  
  const ageGroup = classLevel === 1 || classLevel === 2 ? '6-8 Jahre' : '9-11 Jahre';
  
  // WICHTIG: Wir wollen, dass Gemini den Text komplett neu formuliert, nicht einfach den helpText vorliest
  let prompt = `Du bist ein sehr freundlicher Lehrer für Kinder in Klasse ${classLevel} (${ageGroup}). Du erklärst Dinge so, als würdest du direkt mit dem Kind sprechen - natürlich, warmherzig und ermutigend.

AUFGABE: Erkläre die folgende Quiz-Frage in einfacher, kindgerechter Sprache.

WICHTIGE REGELN:
- Formuliere ALLES komplett neu! Verwende NICHT die Basis-Information Wort für Wort!
- Klinge wie ein echter Mensch, der mit dem Kind spricht
- Verwende umgangssprachliche, einfache Wörter: "Schau mal", "Also", "Du weißt doch", "Einfach so"
- Sei ermutigend: "Das schaffst du!", "Versuch es einfach!", "Das ist gar nicht schwer!"
- Maximal 3-4 kurze Sätze
- Sei lebendig und interessant, nicht langweilig!

Fach: ${subject || 'Allgemein'}
Thema: ${topic || 'Allgemein'}
Quiz-Frage: "${question}"

${helpText ? `Hintergrund (NUR als Inspiration - formuliere es komplett neu!): "${helpText}"\n\n` : ''}

Jetzt erkläre diese Aufgabe direkt und persönlich. Beginne z.B. mit "Schau mal, ..." oder "Also, ..." oder "Hey, ...". Verwende KEINE Anführungszeichen. Schreibe nur die Erklärung direkt, ohne zusätzlichen Text.`;

  return prompt;
}

/**
 * Fallback-Erklärung falls die API nicht verfügbar ist
 */
function generateFallbackExplanation(request: ExplainRequest): string {
  const { classLevel } = request;
  
  if (classLevel === 1 || classLevel === 2) {
    return `Lies die Frage genau durch. Überlege dir, was die Frage meint. Wenn du dir nicht sicher bist, versuche es einfach!`;
  }
  
  return `Lies die Frage genau durch. Achte auf die wichtigen Wörter. Überlege dir Schritt für Schritt, was zu tun ist.`;
}

