/**
 * Hilfe-Komponente für Quiz-Fragen
 * Zeigt altersgerechte Erklärungen und unterstützt kindgerechte Erklärungen mit OpenAI
 */

import { useState, useEffect, useRef } from 'react';
import type { Question } from '../../types';
import { explainForChildren, textToSpeech } from '../../services/openai';
import { getCurrentUser } from '../../services/auth';

interface HelpButtonProps {
  question: Question;
  className?: string;
}

export function HelpButton({ question, className = '' }: HelpButtonProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const helpBoxRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Für OpenAI Audio
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Lade User-Namen beim ersten Render
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user && user.name) {
        setUserName(user.name);
      }
    });
  }, []);

  // Generiere altersgerechte Hilfe-Erklärung
  const helpText = question.helpText || generateHelpText(question);

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
      return;
    }

    // IMMER eine neue Erklärung generieren mit OpenAI (für frische, individuelle Erklärungen)
    let textToSpeak: string;
    
    setIsLoading(true);
    console.log('🔄 Starte OpenAI API Anfrage...', {
      question: question.question.substring(0, 50),
      classLevel: question.class,
      subject: question.subject
    });
    
    try {
      textToSpeak = await explainForChildren({
        question: question.question,
        helpText: helpText,
        classLevel: question.class,
        subject: question.subject,
        topic: question.topic,
        userName: userName || undefined, // Personalisierung mit Namen
      });
      console.log('✅ Erklärung erhalten:', textToSpeak);
      console.log('📏 Erklärung Länge:', textToSpeak?.length || 0);
      console.log('🔍 Erklärung vollständig:', textToSpeak);
      
      // Stelle sicher, dass wir wirklich eine neue Erklärung haben
      if (!textToSpeak || textToSpeak.trim().length === 0) {
        console.error('❌ FEHLER: textToSpeak ist leer!');
        console.warn('⚠️ OpenAI hat keinen neuen Text generiert, verwende Fallback');
        textToSpeak = helpText;
      } else if (textToSpeak === helpText) {
        console.warn('⚠️ OpenAI hat identischen Text wie helpText generiert, verwende Fallback');
        textToSpeak = helpText;
      }
      
      // Erklärung wird nur gesprochen, nicht angezeigt - daher nicht in setExplainedText speichern
      // Der Text in der Box bleibt immer der Tipp (helpText)
    } catch (error) {
      console.error('❌ Fehler beim Generieren der Erklärung:', error);
      // Fallback: Verwende ursprüngliche Hilfe
      textToSpeak = helpText;
    } finally {
      setIsLoading(false);
    }

    // Kurze Pause vor der Sprachausgabe
    await new Promise(resolve => setTimeout(resolve, 300));

    // WICHTIG: Versuche OpenAI TTS für realistische, kindgerechte Stimme
    try {
      console.log('🎤 Verwende OpenAI TTS für realistische Stimme...');
      setIsSpeaking(true);
      
      // 'nova' ist sehr natürlich und freundlich - perfekt für Kinder
      const audioUrl = await textToSpeech(textToSpeak, 'nova');
      
      // Erstelle Audio-Element und speichere Referenz für Stopp-Funktion
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl); // Cleanup
          audioRef.current = null;
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl); // Cleanup
          audioRef.current = null;
          reject(error);
        };
        
        audio.play().catch(reject);
      });
      
      console.log('✅ Sprachausgabe beendet');
      setIsSpeaking(false);
    } catch (ttsError) {
      console.warn('⚠️ OpenAI TTS nicht verfügbar, verwende Browser-Stimme als Fallback:', ttsError);
      
      // Fallback auf Browser SpeechSynthesis
      if (!('speechSynthesis' in window)) {
        alert('Dein Browser unterstützt keine Sprachausgabe.');
        setIsSpeaking(false);
        return;
      }

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
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 200);
    }
  };

  const toggleHelp = () => {
    const newShowHelp = !showHelp;
    setShowHelp(newShowHelp);
    
    // Stoppe Speech wenn Hilfe geschlossen wird
    if (!newShowHelp && isSpeaking) {
      // Stoppe OpenAI Audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      // Stoppe Browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
    
  };

  // Click-Outside Handler: Schließe Hilfe-Box wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpBoxRef.current && !helpBoxRef.current.contains(event.target as Node)) {
        setShowHelp(false);
        if (isSpeaking) {
          // Stoppe OpenAI Audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
          }
          // Stoppe Browser SpeechSynthesis
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          setIsSpeaking(false);
        }
      }
    };

    if (showHelp) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showHelp, isSpeaking]);

  return (
    <div className={`relative ${className}`}>
      {/* Hilfe-Button */}
      <button
        onClick={toggleHelp}
        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
        title="Hilfe anzeigen"
      >
        <span className="text-xl">💡</span>
        <span>Hilfe</span>
      </button>

      {/* Hilfe-Box */}
      {showHelp && (
        <div 
          ref={helpBoxRef}
          className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-blue-50 border-2 border-blue-300 rounded-lg p-4 shadow-xl z-50 animate-fade-in"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-blue-800 text-lg flex items-center gap-2">
              <span>💡</span>
              <span>So funktioniert die Aufgabe:</span>
            </h3>
            <button
              onClick={toggleHelp}
              className="text-blue-600 hover:text-blue-800 text-xl font-bold flex-shrink-0"
            >
              ×
            </button>
          </div>
          
          <p className="text-blue-900 mb-4 text-base leading-relaxed">
            {helpText}  {/* IMMER den Tipp anzeigen, nie die Erklärung */}
          </p>

          {/* Erklären-Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🖱️ Erklären-Button geklickt!');
              explainAndSpeak();
            }}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-semibold ${
              isLoading
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : isSpeaking
                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
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
        </div>
      )}
    </div>
  );
}

/**
 * Generiert altersgerechte Hilfe-Erklärung für eine Frage
 * Diese wird als kurzer Tipp unter "So funktioniert die Aufgabe:" angezeigt
 */
function generateHelpText(question: Question): string {
  const { class: classLevel, subject, question: questionText, topic } = question;

  // Basis-Erklärungen je nach Klasse und Fach - kurz und kindgerecht als Tipp
  if (subject === 'deutsch') {
    if (topic?.includes('satzglied') || questionText.includes('Satzglied')) {
      return classLevel === 1 || classLevel === 2 
        ? '💡 Tipp: Frage dich "Wer tut etwas?" - das ist das Subjekt!'
        : '💡 Tipp: Überlege dir, wer etwas tut (Subjekt) und was passiert (Prädikat).';
    }
    if (topic?.includes('fall') || questionText.includes('Fall') || questionText.includes('Dativ') || questionText.includes('Genitiv') || questionText.includes('Akkusativ')) {
      return classLevel === 3
        ? '💡 Tipp: Frage "wer oder was?" = Nominativ, "wen oder was?" = Akkusativ.'
        : '💡 Tipp: Die Fälle zeigen die Rolle im Satz. Frage dich "wer, wen, wem, wessen?".';
    }
    if (topic?.includes('rechtschreibung') || questionText.includes('schreibt man')) {
      return '💡 Tipp: Lies das Wort langsam vor und überlege, welche Buchstaben du hörst!';
    }
    if (topic?.includes('wortart') || questionText.includes('Wortart')) {
      return '💡 Tipp: Überlege dir: Ist es ein Tun-Wort (Verb), ein Ding-Wort (Nomen) oder ein Wie-Wort (Adjektiv)?';
    }
    // Generische Deutsch-Hilfe
    return classLevel === 1 || classLevel === 2 
      ? '💡 Tipp: Lies die Frage genau durch und überlege dir, was sie meint!'
      : '💡 Tipp: Achte auf die wichtigen Wörter in der Frage!';
  }

  if (subject === 'mathematik') {
    if (questionText.includes('+') || questionText.includes('plus')) {
      return classLevel === 1 || classLevel === 2
        ? '💡 Tipp: Zähle die Zahlen zusammen! Du kannst auch mit den Fingern zählen.'
        : '💡 Tipp: Addiere die Zahlen Schritt für Schritt. Bei großen Zahlen rechne zuerst die Zehner, dann die Einer.';
    }
    if (questionText.includes('-') || questionText.includes('minus')) {
      return classLevel === 1 || classLevel === 2
        ? '💡 Tipp: Ziehe die kleinere Zahl von der größeren ab! Zähle rückwärts.'
        : '💡 Tipp: Subtrahiere Schritt für Schritt. Wenn nötig, rechne mit Zehnerübergang.';
    }
    if (questionText.includes('×') || questionText.includes('mal')) {
      return '💡 Tipp: Multipliziere die Zahlen. Du kannst auch mehrfach addieren!';
    }
    if (questionText.includes('÷') || questionText.includes('geteilt')) {
      return '💡 Tipp: Teile die größere Zahl durch die kleinere. Frage dich: Wie oft passt die kleinere Zahl in die größere?';
    }
    if (topic?.includes('geometrie') || questionText.includes('Ecken') || questionText.includes('Seiten')) {
      return '💡 Tipp: Schaue dir die Form genau an und zähle die Ecken oder Seiten langsam!';
    }
    // Generische Mathe-Hilfe
    return classLevel === 1 || classLevel === 2 
      ? '💡 Tipp: Lies die Aufgabe genau. Zähle mit den Fingern oder stelle dir die Zahlen vor!'
      : '💡 Tipp: Überlege dir Schritt für Schritt, was du rechnen musst.';
  }

  if (subject === 'naturwissenschaften') {
    return classLevel === 1 || classLevel === 2 
      ? '💡 Tipp: Denke an das, was du bereits weißt!'
      : '💡 Tipp: Überlege dir, was du in der Schule gelernt hast.';
  }

  // Fallback: Generische Hilfe
  return classLevel === 1 || classLevel === 2 
    ? '💡 Tipp: Lies die Frage genau durch und überlege dir, was sie meint!'
    : '💡 Tipp: Achte auf die wichtigen Wörter in der Frage!';
}
