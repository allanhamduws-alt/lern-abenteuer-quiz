/**
 * Erklären-Button für Quiz-Fragen
 * Verwendet die gespeicherten kindgerechten Erklärungen aus helpText und spricht sie vor
 * Die Erklärungen wurden einmalig mit KI generiert und sind jetzt sofort verfügbar
 */

import { useState, useEffect, useRef } from 'react';
import type { Question } from '../../types';
import { textToSpeech } from '../../services/openai';
import { getCurrentUser } from '../../services/auth';

interface HelpButtonProps {
  question: Question;
  className?: string;
}

export function HelpButton({ question, className = '' }: HelpButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Für OpenAI Audio
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Lade User-Namen beim ersten Render (mit Fehlerbehandlung)
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user && user.name) {
          setUserName(user.name);
        }
      })
      .catch((error) => {
        console.warn('⚠️ Konnte Benutzer-Namen nicht laden:', error);
        // App sollte trotzdem funktionieren, auch ohne Benutzer-Namen
      });
  }, []);

  // Lade verfügbare Stimmen beim ersten Render
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    // Einige Browser laden Stimmen asynchron
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Wähle die beste deutsche Stimme für Kinder (KI-Stimmen bevorzugt)
  const getBestVoice = (): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;

    // Bevorzuge deutsche Stimmen
    const germanVoices = availableVoices.filter(voice => 
      voice.lang.startsWith('de')
    );

    if (germanVoices.length === 0) return null;

    // Debug: Zeige alle verfügbaren deutschen Stimmen
    console.log('🎤 Verfügbare deutsche Stimmen:', germanVoices.map(v => v.name));

    // Priorität 1: Neural/KI-Stimmen (beste Qualität für natürliche Stimme)
    const neuralVoices = germanVoices.filter(voice => 
      voice.name.toLowerCase().includes('neural') ||
      voice.name.toLowerCase().includes('premium') ||
      voice.name.toLowerCase().includes('enhanced') ||
      voice.name.toLowerCase().includes('wavenet') ||
      voice.name.toLowerCase().includes('cloud') ||
      voice.name.toLowerCase().includes('natural') ||
      voice.name.toLowerCase().includes('ai')
    );

    if (neuralVoices.length > 0) {
      console.log('✨ Gefundene Neural/KI-Stimmen:', neuralVoices.map(v => v.name));
      // Bevorzuge weibliche Neural-Stimmen (klingen oft freundlicher)
      const femaleNeural = neuralVoices.filter(voice => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('karin') ||
        voice.name.toLowerCase().includes('anna') ||
        voice.name.toLowerCase().includes('maria') ||
        voice.name.toLowerCase().includes('lena') ||
        voice.name.toLowerCase().includes('sarah')
      );
      if (femaleNeural.length > 0) {
        console.log('👩 Ausgewählte weibliche Neural-Stimme:', femaleNeural[0].name);
        return femaleNeural[0];
      }
      console.log('🎤 Ausgewählte Neural-Stimme:', neuralVoices[0].name);
      return neuralVoices[0];
    }

    // Priorität 2: Weibliche Stimmen (oft freundlicher für Kinder)
    const femaleVoices = germanVoices.filter(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('hazel') ||
      voice.name.toLowerCase().includes('karin') ||
      voice.name.toLowerCase().includes('anna') ||
      voice.name.toLowerCase().includes('maria') ||
      voice.name.toLowerCase().includes('katja') ||
      voice.name.toLowerCase().includes('sabine') ||
      voice.name.toLowerCase().includes('lena') ||
      voice.name.toLowerCase().includes('sarah')
    );

    if (femaleVoices.length > 0) {
      console.log('👩 Ausgewählte weibliche Stimme:', femaleVoices[0].name);
      return femaleVoices[0];
    }

    // Fallback: Erste deutsche Stimme
    console.log('🎤 Fallback: Verwende erste deutsche Stimme:', germanVoices[0].name);
    return germanVoices[0];
  };

  // Erklären und Vorlesen-Funktion mit OpenAI (Text-Generierung + TTS)
  const explainAndSpeak = async () => {
    // Verhindere mehrfache gleichzeitige Aufrufe
    if (isLoading) {
      return;
    }

    if (isSpeaking) {
      // Stoppe wenn bereits am Sprechen
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setAudioError(null);
      return;
    }

    setIsLoading(true);
    setAudioError(null);

    try {
      // WICHTIG FÜR MOBILE: Audio-Element sofort beim User-Click initialisieren
      // Mobile Browser blockieren Audio-Autoplay, auch wenn audio.play() nach User-Click aufgerufen wird
      // Lösung: Audio-Element vorbereiten und play() Promise im User-Interaktions-Kontext starten
      let audioElement: HTMLAudioElement | null = null;
      
      try {
        // Erstelle Audio-Element sofort beim User-Click (vor KI-Generierung)
        // Dies stellt sicher, dass der User-Interaktions-Kontext aktiv ist
        audioElement = new Audio();
        audioRef.current = audioElement;
        
        // WICHTIG: Versuche play() sofort zu starten (auch wenn noch kein src gesetzt ist)
        // Mobile Browser benötigen play() im User-Interaktions-Kontext
        // Das wird wahrscheinlich fehlschlagen ohne src, aber das ist OK - wir setzen src später
        audioElement.play().catch((error) => {
          console.warn('⚠️ Audio.play() fehlgeschlagen (erwartet bei Mobile ohne src):', error);
          // Das ist OK - wir setzen src später
        });
        
        console.log('🎤 Audio-Element initialisiert im User-Interaktions-Kontext');
      } catch (error) {
        console.warn('⚠️ Audio-Element konnte nicht initialisiert werden:', error);
      }

      // Verwende gespeicherte Erklärung aus helpText (wurde einmalig generiert)
      // Falls kein helpText vorhanden, verwende explanation als Fallback
      let textToSpeak: string = question.helpText || question.explanation || '';
      
      if (!textToSpeak || textToSpeak.trim().length === 0) {
        console.warn('⚠️ Keine Erklärung vorhanden für Frage:', question.id);
        setAudioError('Für diese Frage ist noch keine Erklärung verfügbar.');
        setIsLoading(false);
        return;
      }
      
      // Entferne "Tipp:" Präfix falls vorhanden (für alte Einträge)
      textToSpeak = textToSpeak.replace(/^💡\s*Tipp:\s*/i, '').replace(/^Tipp:\s*/i, '').trim();
      
      // KRITISCH: Entferne die richtige Antwort aus dem Text BEVOR mathematische Symbole ersetzt werden
      // Dies verhindert, dass die Lösung vorgesagt wird
      const options = question.options || [];
      const correctAnswerIndex = typeof question.correctAnswer === 'number' 
        ? question.correctAnswer 
        : options.indexOf(question.correctAnswer.toString());
      
      if (correctAnswerIndex >= 0 && correctAnswerIndex < options.length) {
        const correctAnswer = options[correctAnswerIndex];
        
        // Entferne die richtige Antwort in verschiedenen Formaten
        // 1. Direkte Nennung der Zahl - ersetze durch natürlichen Platzhalter
        const answerRegex = new RegExp(`\\b${correctAnswer}\\b`, 'gi');
        textToSpeak = textToSpeak.replace(answerRegex, 'die richtige Lösung');
        
        // 2. In Sätzen wie "Die fehlende Zahl ist X", "Als Nächstes kommt X", etc.
        // Ersetze die ganze Phrase durch hilfreiche, aber neutrale Formulierungen
        const sentencePatterns = [
          {
            pattern: new RegExp(`Die fehlende Zahl ist\\s*${correctAnswer}[!.]?`, 'gi'),
            replacement: 'Die fehlende Zahl findest du heraus, wenn du das Muster erkennst!'
          },
          {
            pattern: new RegExp(`Als Nächstes kommt\\s*${correctAnswer}[!.]?`, 'gi'),
            replacement: 'Als Nächstes kommt die Zahl, die dem Muster folgt!'
          },
          {
            pattern: new RegExp(`Das Ergebnis ist\\s*${correctAnswer}[!.]?`, 'gi'),
            replacement: 'Das Ergebnis findest du, wenn du die Rechnung durchführst!'
          },
          {
            pattern: new RegExp(`Die Antwort ist\\s*${correctAnswer}[!.]?`, 'gi'),
            replacement: 'Die Antwort findest du, wenn du genau überlegst!'
          },
          {
            pattern: new RegExp(`Die Lösung ist\\s*${correctAnswer}[!.]?`, 'gi'),
            replacement: 'Die Lösung findest du, wenn du das Muster erkennst!'
          },
          {
            pattern: new RegExp(`${correctAnswer}\\s*(ist|kommt|fehlt|ist die Antwort|ist die Lösung)`, 'gi'),
            replacement: 'die richtige Lösung'
          },
        ];
        
        for (const { pattern, replacement } of sentencePatterns) {
          textToSpeak = textToSpeak.replace(pattern, replacement);
        }
        
        // 3. In mathematischen Gleichungen die die Lösung zeigen
        // Entferne die ganze Gleichung oder ersetze nur das Ergebnis
        // Beispiel: "15×2+1=31" → entferne die ganze Gleichung oder → "15×2+1 ergibt die richtige Lösung"
        const equationRegex = new RegExp(`(\\d+\\s*(?:mal|×|plus|\\+|minus|-|geteilt durch|÷)\\s*\\d+\\s*(?:plus|\\+|minus|-)?\\s*\\d*)\\s*=\\s*${correctAnswer}`, 'gi');
        textToSpeak = textToSpeak.replace(equationRegex, '$1 ergibt die richtige Lösung');
        
        // 4. Ersetze auch "also X+Y=Z" Muster - entferne diese Phrasen komplett
        const alsoRegex = new RegExp(`also\\s+\\d+\\s*(?:mal|×|plus|\\+|minus|-|geteilt durch|÷)\\s*\\d+\\s*(?:plus|\\+|minus|-)?\\s*\\d*\\s*=\\s*${correctAnswer}[!.]?`, 'gi');
        textToSpeak = textToSpeak.replace(alsoRegex, '');
      }
      
      // Ersetze mathematische Symbole für bessere TTS-Aussprache
      // Die KI sollte sie beim Generieren schon als Wörter verwenden, aber sicherheitshalber nochmal ersetzen
      textToSpeak = textToSpeak
        .replace(/×/g, ' mal ')  // × → "mal"
        .replace(/÷/g, ' geteilt durch ')  // ÷ → "geteilt durch"
        .replace(/=/g, ' ist gleich ')  // = → "ist gleich"
        .replace(/\+/g, ' plus ')  // + → "plus"
        .replace(/-/g, ' minus ')  // - → "minus"
        .replace(/\s+/g, ' ')  // Mehrfache Leerzeichen entfernen
        .trim();
      
      // Zusätzliches Sicherheitsnetz: Entferne alle Optionen die noch im Text vorkommen könnten
      for (const option of options) {
        // Nur wenn es nicht die richtige Antwort ist (die wurde schon ersetzt)
        if (option !== options[correctAnswerIndex]) {
          // Entferne Sätze die Optionen direkt nennen
          const regex = new RegExp(`(Als Nächstes kommt|Das Ergebnis ist|Die Antwort ist|Die Lösung ist|Die fehlende Zahl ist)\\s*${option}[!.]?`, 'gi');
          textToSpeak = textToSpeak.replace(regex, '');
        }
      }
      
      // Entferne mathematische Gleichungen die noch Lösungen zeigen könnten
      textToSpeak = textToSpeak.replace(/\d+\s*mal\s*\d+\s*ist gleich\s*\d+/gi, '');
      textToSpeak = textToSpeak.replace(/also\s+\d+\s*(plus|minus|mal|geteilt durch)\s*\d+\s*ist gleich\s*\d+[!.]?/gi, '');
      
      // Prüfe ob der Text nach allen Ersetzungen noch die richtige Antwort enthält
      // Falls ja, stoppe die Sprachausgabe und zeige eine Warnung
      if (correctAnswerIndex >= 0 && correctAnswerIndex < options.length) {
        const correctAnswer = options[correctAnswerIndex];
        const stillContainsAnswer = new RegExp(`\\b${correctAnswer}\\b`, 'i').test(textToSpeak);
        
        if (stillContainsAnswer) {
          console.warn('⚠️ WARNUNG: Text enthält noch die richtige Antwort nach allen Filtern!', {
            questionId: question.id,
            correctAnswer,
            textPreview: textToSpeak.substring(0, 100)
          });
          // Ersetze alle verbleibenden Vorkommen durch natürlichen Platzhalter
          const finalRegex = new RegExp(`\\b${correctAnswer}\\b`, 'gi');
          textToSpeak = textToSpeak.replace(finalRegex, 'die richtige Lösung');
        }
      }
      
      // Wenn es eine technische Erklärung ist (identisch mit explanation), mache sie kindgerechter
      if (textToSpeak === question.explanation && question.explanation) {
        // Füge eine freundliche Einleitung hinzu
        textToSpeak = `Hey, schau mal! ${textToSpeak}`;
      }
      
      // Optional: Namen hinzufügen für Personalisierung (30% Chance)
      if (userName && textToSpeak && Math.random() < 0.3) {
        // Füge Namen natürlich am Anfang hinzu
        textToSpeak = textToSpeak.replace(/^(Schau mal|Hey|Also|Hallo)/i, `Hey ${userName},`);
      }
      
      console.log('📝 Verwende gespeicherte Erklärung:', textToSpeak.substring(0, 80) + '...');

      // WICHTIG: Versuche OpenAI TTS für realistische, kindgerechte Stimme
      try {
        console.log('🎤 Verwende OpenAI TTS für realistische Stimme...');
        setIsSpeaking(true);
        setIsLoading(false);
        setAudioError(null);
        
        // 'nova' ist sehr natürlich und freundlich - perfekt für Kinder
        const audioUrl = await textToSpeech(textToSpeak, 'nova');
        
        // Verwende bereits erstelltes Audio-Element oder erstelle neues
        const audio = audioElement || new Audio();
        audioRef.current = audio;
        
        // Setze src und warte auf canplay
        audio.src = audioUrl;
        audio.load(); // Lade Audio explizit
        
        // Warte bis Audio geladen ist
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio-Ladezeit überschritten'));
          }, 10000); // 10 Sekunden Timeout
          
          audio.oncanplay = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          audio.onerror = (error) => {
            clearTimeout(timeout);
            reject(error);
          };
        });
        
        // Jetzt play() aufrufen (im User-Interaktions-Kontext, wenn möglich)
        try {
          await audio.play();
          console.log('✅ Audio wird abgespielt');
        } catch (playError: any) {
          console.error('❌ audio.play() fehlgeschlagen:', playError);
          setAudioError('Audio konnte nicht abgespielt werden. Bitte versuche es erneut.');
          setIsSpeaking(false);
          
          // Fallback auf Browser SpeechSynthesis
          await fallbackToBrowserSpeech(textToSpeak);
          return;
        }
        
        // Warte auf Ende der Wiedergabe
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl); // Cleanup
            audioRef.current = null;
            setIsSpeaking(false);
            resolve();
          };
          
          audio.onerror = (error) => {
            URL.revokeObjectURL(audioUrl); // Cleanup
            audioRef.current = null;
            setIsSpeaking(false);
            setAudioError('Fehler beim Abspielen der Audio-Datei.');
            reject(error);
          };
        });
        
        console.log('✅ Sprachausgabe beendet');
      } catch (ttsError: any) {
        console.warn('⚠️ OpenAI TTS nicht verfügbar, verwende Browser-Stimme als Fallback:', ttsError);
        setIsLoading(false);
        setAudioError(null); // Reset error für Fallback
        
        // Fallback auf Browser SpeechSynthesis
        await fallbackToBrowserSpeech(textToSpeak);
      }
    } catch (error: any) {
      console.error('❌ Unerwarteter Fehler in explainAndSpeak:', error);
      setIsLoading(false);
      setIsSpeaking(false);
      setAudioError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      
      // Versuche Fallback auf Browser-Stimme
      const textToSpeak = question.helpText || question.explanation || '';
      if (textToSpeak) {
        try {
          await fallbackToBrowserSpeech(textToSpeak);
        } catch (fallbackError) {
          console.error('❌ Auch Fallback fehlgeschlagen:', fallbackError);
        }
      }
    }
  };

  // Fallback-Funktion für Browser SpeechSynthesis mit verbesserter Fehlerbehandlung
  const fallbackToBrowserSpeech = async (textToSpeak: string): Promise<void> => {
    if (!('speechSynthesis' in window)) {
      setAudioError('Dein Browser unterstützt keine Sprachausgabe.');
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 100));

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const bestVoice = getBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log('🎤 Verwende Browser-Stimme:', bestVoice.name);
      } else {
        utterance.lang = 'de-DE';
        console.log('🎤 Verwende Standard-Stimme für de-DE');
      }

      utterance.rate = 0.85;
      utterance.pitch = 1.15;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setAudioError(null);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (error) => {
        console.error('❌ SpeechSynthesis Fehler:', error);
        setAudioError('Fehler bei der Sprachausgabe. Bitte versuche es erneut.');
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } catch (error: any) {
      console.error('❌ Fehler bei Browser SpeechSynthesis:', error);
      setAudioError('Sprachausgabe konnte nicht gestartet werden. Bitte versuche es erneut.');
      setIsSpeaking(false);
    }
  };


  return (
    <div className={`relative ${className}`}>
      {/* Direkter Erklären-Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🖱️ Erklären-Button geklickt!');
          explainAndSpeak();
        }}
        disabled={isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg ${
          isLoading
            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
            : isSpeaking
            ? 'bg-red-100 hover:bg-red-200 text-red-700'
            : 'bg-green-100 hover:bg-green-200 text-green-700'
        }`}
        title={isSpeaking ? 'Erklärung stoppen' : 'Erklärung anhören'}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Erklärung wird erstellt...</span>
          </>
        ) : isSpeaking ? (
          <>
            <span>⏸️</span>
            <span>Stopp</span>
          </>
        ) : (
          <>
            <span>💬</span>
            <span>Erklären</span>
          </>
        )}
      </button>

      {/* Fehlermeldung für Audio (wenn Fehler auftritt) */}
      {audioError && (
        <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-xl z-50 animate-fade-in">
          <div className="font-semibold mb-1 text-red-800">⚠️ Audio-Fehler</div>
          <div className="text-red-700 text-sm">{audioError}</div>
        </div>
      )}
    </div>
  );
}

