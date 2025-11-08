/**
 * OpenAI Service für kindgerechte Erklärungen und Text-to-Speech
 * Alles aus einem Ökosystem für konsistente Qualität
 */

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface ExplainRequest {
  question: string;
  helpText?: string;
  classLevel: 1 | 2 | 3 | 4;
  subject?: string;
  topic?: string;
  userName?: string; // Optional: Für Personalisierung
}

/**
 * Generiert eine kindgerechte Erklärung für eine Quiz-Frage mit OpenAI
 * Nutzt GPT-5-mini für schnelle, kostengünstige und trotzdem hochwertige Erklärungen
 */
export async function explainForChildren(request: ExplainRequest): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  console.log('🔍 OpenAI API aufrufen...', { 
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'KEIN KEY',
    question: request.question.substring(0, 50) + '...',
  });
  
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    console.warn('⚠️ OpenAI API Key nicht gefunden. Verwende Fallback-Erklärung.');
    return request.helpText || generateFallbackExplanation(request);
  }

  try {
    const prompt = buildPrompt(request);
    console.log('📝 Prompt erstellt, sende Anfrage an OpenAI...');
    console.log('📄 Prompt Inhalt:', prompt.substring(0, 200) + '...');
    
    // Versuche verschiedene mögliche Modellnamen für GPT-5 Mini
    // WICHTIG: gpt-5o-mini ist korrekt (nicht gpt-50-mini!)
    const modelsToTry = ['gpt-5o-mini', 'gpt-5-mini'];
    let lastError: Error | null = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Versuche Modell: ${modelName}`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content: 'Du bist ein sehr freundlicher, geduldiger und begeisterter Lehrer für Grundschulkinder. Du erklärst Dinge in einfacher, natürlicher Sprache mit viel Emotion und Begeisterung, als würdest du direkt mit dem Kind sprechen. Du bist motivierend, warmherzig und zeigst echte Freude am Lernen.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 1.0, // Maximale Kreativität für wirklich neue Formulierungen (1.0 statt 0.9)
            max_completion_tokens: 250, // Reduziert, da reasoning_effort das Reasoning begrenzt
            reasoning_effort: "minimal", // WICHTIG: Reduziert Reasoning-Tokens (~100 statt ~300), damit Platz für Completion-Text bleibt!
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Wenn 404, versuche nächstes Modell
          if (response.status === 404) {
            console.warn(`⚠️ Modell ${modelName} nicht gefunden (404), versuche nächstes...`);
            lastError = new Error(`Modell ${modelName} nicht gefunden`);
            continue;
          }
          
          // Bei anderen Fehlern, werfe Fehler
          console.error('❌ OpenAI API Fehler:', response.status, errorText);
          console.error('🔍 Fehler-Details:', {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500)
          });
          throw new Error(`OpenAI API Fehler: ${response.status} - ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        console.log(`✅ OpenAI API Daten empfangen mit Modell ${modelName}:`, data);
        console.log('🔍 Vollständige API-Antwort:', JSON.stringify(data, null, 2));
        
        // GPT-5 Mini könnte eine andere Response-Struktur haben - prüfe verschiedene Möglichkeiten
        let explanation: string | null = null;
        
        // Versuch 1: Standard-Struktur
        if (data.choices && data.choices[0] && data.choices[0].message) {
          explanation = data.choices[0].message.content?.trim() || null;
          console.log('🔍 Versuch 1 (Standard): explanation =', explanation);
        }
        
        // Versuch 2: Prüfe ob content direkt in choices ist
        if (!explanation && data.choices && data.choices[0] && data.choices[0].content) {
          explanation = data.choices[0].content.trim();
          console.log('🔍 Versuch 2 (content direkt): explanation =', explanation);
        }
        
        // Versuch 3: Prüfe ob es eine andere Struktur gibt
        if (!explanation && data.choices && data.choices[0]) {
          console.log('🔍 Versuch 3: Prüfe gesamte choice-Struktur:', JSON.stringify(data.choices[0], null, 2));
        }
        
        if (explanation && explanation.length > 0) {
          console.log('🎉 Erklärung generiert:', explanation);
          console.log('📏 Erklärung Länge:', explanation.length);
          
          console.log('📊 Vergleich: helpText =', request.helpText?.substring(0, 100) || 'KEIN HELPTEXT');
          console.log('📊 Vergleich: explanation =', explanation.substring(0, 100));
          console.log('📊 Vergleich: Sind sie identisch?', explanation === request.helpText);
          console.log('📊 Vergleich: Enthält explanation helpText?', explanation.includes(request.helpText || ''));
          
          // Prüfe ob die Erklärung wirklich neu ist
          if (explanation === request.helpText) {
            console.warn('⚠️ WARNUNG: Erklärung ist EXAKT identisch mit helpText!');
          }
          if (explanation.includes(request.helpText || '')) {
            console.warn('⚠️ WARNUNG: Erklärung enthält den kompletten helpText!');
          }
          
          // Zeige Wort-für-Wort Vergleich der ersten Wörter
          const helpWords = (request.helpText || '').split(' ').slice(0, 10);
          const explWords = explanation.split(' ').slice(0, 10);
          console.log('📊 Erste 10 Wörter helpText:', helpWords);
          console.log('📊 Erste 10 Wörter explanation:', explWords);
          console.log('📊 Stimmen erste Wörter überein?', helpWords.join(' ') === explWords.join(' '));
          
          return explanation;
        }
        
        // Wenn keine Erklärung gefunden wurde
        console.error('❌ FEHLER: Erklärung ist leer!', {
          choices: data.choices,
          firstChoice: data.choices?.[0],
          message: data.choices?.[0]?.message,
          content: data.choices?.[0]?.message?.content,
          fullResponse: data
        });
        throw new Error('Erklärung ist leer - API hat keinen Text zurückgegeben');
      } catch (error: any) {
        // Wenn es ein 404-Fehler war, versuche nächstes Modell (wird schon oben behandelt)
        if (error.message?.includes('404') || error.message?.includes('nicht gefunden')) {
          lastError = error;
          continue;
        }
        // Bei anderen Fehlern, werfe sofort
        throw error;
      }
    }
    
    // Wenn alle Modelle fehlgeschlagen sind
    if (lastError) {
      throw lastError;
    }
    throw new Error('Kein funktionierendes GPT-5 Mini Modell gefunden');
  } catch (error) {
    console.error('❌ Fehler beim Aufruf der OpenAI API:', error);
    // Fallback auf die ursprüngliche Hilfe-Erklärung
    return request.helpText || generateFallbackExplanation(request);
  }
}

/**
 * Erstellt einen Prompt für OpenAI
 */
function buildPrompt(request: ExplainRequest): string {
  const { question, helpText, userName } = request;
  
  // Verwende den Namen gelegentlich (30-40% Chance), damit es natürlich wirkt
  const shouldUseName = userName && Math.random() < 0.35; // 35% Chance
  const nameGreeting = shouldUseName ? ` (Wenn passend, verwende den Namen "${userName}" gelegentlich, aber nicht in jedem Satz!)` : '';
  
  let prompt = `Du bist ein sehr freundlicher Lehrer für Grundschulkinder. Deine Aufgabe ist es, die folgende Quiz-Frage zu erklären - ABER: Formuliere ALLES komplett neu und in eigenen Worten!

KRITISCHE ANFORDERUNGEN:
- Verwende NIEMALS den Original-Tipp Wort für Wort!
- Erfinde eine komplett neue, eigene Erklärung!
- Verwende andere Wörter, andere Formulierungen, andere Sätze!
- Die Erklärung soll helfen, aber NICHT die Lösung verraten!
- Klinge wie ein echter Mensch mit viel Emotion: "Schau mal, ...", "Hey, ...", "Also, ..."
- Sei ermutigend: "Das schaffst du!", "Versuch es einfach!", "Super!"
- Maximal 3-4 kurze Sätze
- Sei lebendig und interessant - NICHT langweilig!
${nameGreeting}

Quiz-Frage: "${question}"
Original-Tipp (NUR als Inspiration - formuliere es komplett neu!): "${helpText || 'Kein Tipp vorhanden'}"

WICHTIG: Formuliere jetzt eine komplett neue Erklärung in eigenen Worten - nicht den Tipp ablesen, sondern neu erklären!

NOCHMAL: Der Original-Tipp ist NUR als Inspiration gedacht. Formuliere die Erklärung komplett anders, mit anderen Wörtern, anderen Sätzen, anderer Struktur!`;

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

/**
 * Generiert Audio aus Text mit OpenAI TTS API
 * Nutzt realistische, natürliche Stimmen
 */
export async function textToSpeech(
  text: string,
  voice: OpenAIVoice = 'nova' // 'nova' ist sehr natürlich und freundlich für Kinder
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    console.warn('⚠️ OpenAI API Key nicht gefunden. Verwende Browser-Stimme als Fallback.');
    throw new Error('OpenAI API Key nicht verfügbar');
  }

  // Validiere Text
  if (!text || text.trim().length === 0) {
    throw new Error('Text für Sprachausgabe ist leer');
  }

  // Begrenze Text-Länge (OpenAI TTS hat ein Limit)
  const maxLength = 4096; // OpenAI TTS Limit
  const textToUse = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  try {
    console.log('🎤 OpenAI TTS: Generiere Audio...', { textLength: textToUse.length, voice });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // HD-Modell für deutlich realistischere Stimme
        input: textToUse,
        voice: voice,
        speed: 0.92, // Etwas langsamer für besseres Verständnis, aber mit mehr Betonung (0.92 statt 0.95 für mehr Emotion)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI TTS Fehler:', response.status, errorText);
      
      // Spezifische Fehlermeldungen
      if (response.status === 401) {
        throw new Error('OpenAI API Key ist ungültig oder abgelaufen');
      } else if (response.status === 429) {
        throw new Error('Zu viele Anfragen. Bitte warte einen Moment.');
      } else if (response.status === 500) {
        throw new Error('OpenAI Server-Fehler. Bitte versuche es später erneut.');
      }
      
      throw new Error(`OpenAI TTS Fehler: ${response.status}`);
    }

    const audioBlob = await response.blob();
    
    // Validiere dass es wirklich ein Audio-Blob ist
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('OpenAI hat leeres Audio zurückgegeben');
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    
    console.log('✅ OpenAI TTS: Audio generiert', { blobSize: audioBlob.size });
    return audioUrl;
  } catch (error: any) {
    console.error('❌ Fehler beim OpenAI TTS:', error);
    
    // Wenn es ein Netzwerk-Fehler ist, gebe eine benutzerfreundliche Meldung zurück
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Netzwerk-Fehler. Bitte überprüfe deine Internetverbindung.');
    }
    
    throw error;
  }
}

/**
 * Spielt Audio ab und gibt Promise zurück, das resolved wenn Audio fertig ist
 */
export function playAudio(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl); // Cleanup
      resolve();
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl); // Cleanup
      reject(error);
    };
    
    audio.play().catch(reject);
  });
}

