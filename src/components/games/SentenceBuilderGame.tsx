/**
 * SentenceBuilderGame - Satz-Bau Mini-Spiel
 * Spieler müssen Wörter zu grammatikalisch korrekten Sätzen sortieren
 * Anspruchsvoller als WordMatchGame, fördert Sprachverständnis
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

interface Sentence {
  id: string;
  words: string[];
  correctOrder: string[];
  userOrder: string[];
  category: string;
}

export function SentenceBuilderGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    generateSentences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generateSentences = () => {
    let sentencesList: Sentence[] = [];

    if (classLevel === 1) {
      // Klasse 1: Einfache Sätze mit 4-5 Wörtern
      sentencesList = [
        {
          id: '1',
          words: ['Der', 'Hund', 'spielt', 'im', 'Garten'],
          correctOrder: ['Der', 'Hund', 'spielt', 'im', 'Garten'],
          userOrder: [],
          category: 'Einfacher Satz',
        },
        {
          id: '2',
          words: ['Die', 'Katze', 'schläft', 'auf', 'dem', 'Sofa'],
          correctOrder: ['Die', 'Katze', 'schläft', 'auf', 'dem', 'Sofa'],
          userOrder: [],
          category: 'Einfacher Satz',
        },
        {
          id: '3',
          words: ['Ich', 'gehe', 'zur', 'Schule'],
          correctOrder: ['Ich', 'gehe', 'zur', 'Schule'],
          userOrder: [],
          category: 'Einfacher Satz',
        },
        {
          id: '4',
          words: ['Mama', 'kocht', 'das', 'Essen'],
          correctOrder: ['Mama', 'kocht', 'das', 'Essen'],
          userOrder: [],
          category: 'Einfacher Satz',
        },
        {
          id: '5',
          words: ['Wir', 'spielen', 'Fußball', 'im', 'Park'],
          correctOrder: ['Wir', 'spielen', 'Fußball', 'im', 'Park'],
          userOrder: [],
          category: 'Einfacher Satz',
        },
      ];
    } else if (classLevel === 2) {
      // Klasse 2: Etwas komplexere Sätze
      sentencesList = [
        {
          id: '1',
          words: ['Am', 'Morgen', 'gehe', 'ich', 'zur', 'Schule'],
          correctOrder: ['Am', 'Morgen', 'gehe', 'ich', 'zur', 'Schule'],
          userOrder: [],
          category: 'Zeitangabe',
        },
        {
          id: '2',
          words: ['Der', 'große', 'Hund', 'bellt', 'laut'],
          correctOrder: ['Der', 'große', 'Hund', 'bellt', 'laut'],
          userOrder: [],
          category: 'Adjektiv',
        },
        {
          id: '3',
          words: ['Ich', 'lese', 'ein', 'spannendes', 'Buch'],
          correctOrder: ['Ich', 'lese', 'ein', 'spannendes', 'Buch'],
          userOrder: [],
          category: 'Adjektiv',
        },
        {
          id: '4',
          words: ['Heute', 'ist', 'das', 'Wetter', 'sehr', 'schön'],
          correctOrder: ['Heute', 'ist', 'das', 'Wetter', 'sehr', 'schön'],
          userOrder: [],
          category: 'Wetter',
        },
        {
          id: '5',
          words: ['Die', 'Kinder', 'spielen', 'gerne', 'im', 'Garten'],
          correctOrder: ['Die', 'Kinder', 'spielen', 'gerne', 'im', 'Garten'],
          userOrder: [],
          category: 'Adverb',
        },
        {
          id: '6',
          words: ['Meine', 'Schwester', 'malt', 'ein', 'buntes', 'Bild'],
          correctOrder: ['Meine', 'Schwester', 'malt', 'ein', 'buntes', 'Bild'],
          userOrder: [],
          category: 'Adjektiv',
        },
      ];
    } else if (classLevel === 3) {
      // Klasse 3: Komplexere Sätze mit Nebensätzen
      sentencesList = [
        {
          id: '1',
          words: ['Wenn', 'es', 'regnet', ',', 'bleiben', 'wir', 'zu', 'Hause'],
          correctOrder: ['Wenn', 'es', 'regnet', ',', 'bleiben', 'wir', 'zu', 'Hause'],
          userOrder: [],
          category: 'Nebensatz',
        },
        {
          id: '2',
          words: ['Der', 'Lehrer', 'erklärt', 'die', 'Aufgabe', 'sehr', 'gut'],
          correctOrder: ['Der', 'Lehrer', 'erklärt', 'die', 'Aufgabe', 'sehr', 'gut'],
          userOrder: [],
          category: 'Adverb',
        },
        {
          id: '3',
          words: ['Ich', 'gehe', 'nach', 'der', 'Schule', 'zum', 'Fußball'],
          correctOrder: ['Ich', 'gehe', 'nach', 'der', 'Schule', 'zum', 'Fußball'],
          userOrder: [],
          category: 'Zeitangabe',
        },
        {
          id: '4',
          words: ['Das', 'Buch', ',', 'das', 'ich', 'lese', ',', 'ist', 'spannend'],
          correctOrder: ['Das', 'Buch', ',', 'das', 'ich', 'lese', ',', 'ist', 'spannend'],
          userOrder: [],
          category: 'Relativsatz',
        },
        {
          id: '5',
          words: ['Am', 'Wochenende', 'besuchen', 'wir', 'unsere', 'Großeltern'],
          correctOrder: ['Am', 'Wochenende', 'besuchen', 'wir', 'unsere', 'Großeltern'],
          userOrder: [],
          category: 'Zeitangabe',
        },
        {
          id: '6',
          words: ['Die', 'Blumen', 'im', 'Garten', 'blühen', 'wunderschön'],
          correctOrder: ['Die', 'Blumen', 'im', 'Garten', 'blühen', 'wunderschön'],
          userOrder: [],
          category: 'Adjektiv',
        },
        {
          id: '7',
          words: ['Ich', 'helfe', 'meiner', 'Mutter', 'beim', 'Kochen'],
          correctOrder: ['Ich', 'helfe', 'meiner', 'Mutter', 'beim', 'Kochen'],
          userOrder: [],
          category: 'Präposition',
        },
      ];
    } else {
      // Klasse 4: Komplexe Sätze mit verschiedenen Strukturen
      sentencesList = [
        {
          id: '1',
          words: ['Obwohl', 'es', 'kalt', 'war', ',', 'gingen', 'wir', 'spazieren'],
          correctOrder: ['Obwohl', 'es', 'kalt', 'war', ',', 'gingen', 'wir', 'spazieren'],
          userOrder: [],
          category: 'Konzessivsatz',
        },
        {
          id: '2',
          words: ['Der', 'Schüler', ',', 'der', 'fleißig', 'lernt', ',', 'bekommt', 'gute', 'Noten'],
          correctOrder: ['Der', 'Schüler', ',', 'der', 'fleißig', 'lernt', ',', 'bekommt', 'gute', 'Noten'],
          userOrder: [],
          category: 'Relativsatz',
        },
        {
          id: '3',
          words: ['Nachdem', 'wir', 'gegessen', 'haben', ',', 'räumen', 'wir', 'auf'],
          correctOrder: ['Nachdem', 'wir', 'gegessen', 'haben', ',', 'räumen', 'wir', 'auf'],
          userOrder: [],
          category: 'Temporalsatz',
        },
        {
          id: '4',
          words: ['Das', 'Buch', ',', 'das', 'auf', 'dem', 'Tisch', 'liegt', ',', 'gehört', 'mir'],
          correctOrder: ['Das', 'Buch', ',', 'das', 'auf', 'dem', 'Tisch', 'liegt', ',', 'gehört', 'mir'],
          userOrder: [],
          category: 'Relativsatz',
        },
        {
          id: '5',
          words: ['Ich', 'freue', 'mich', 'darauf', ',', 'dass', 'wir', 'in', 'den', 'Urlaub', 'fahren'],
          correctOrder: ['Ich', 'freue', 'mich', 'darauf', ',', 'dass', 'wir', 'in', 'den', 'Urlaub', 'fahren'],
          userOrder: [],
          category: 'dass-Satz',
        },
        {
          id: '6',
          words: ['Die', 'Kinder', 'spielen', 'im', 'Garten', ',', 'während', 'die', 'Eltern', 'kochen'],
          correctOrder: ['Die', 'Kinder', 'spielen', 'im', 'Garten', ',', 'während', 'die', 'Eltern', 'kochen'],
          userOrder: [],
          category: 'Temporalsatz',
        },
        {
          id: '7',
          words: ['Weil', 'es', 'regnet', ',', 'bleiben', 'wir', 'zu', 'Hause'],
          correctOrder: ['Weil', 'es', 'regnet', ',', 'bleiben', 'wir', 'zu', 'Hause'],
          userOrder: [],
          category: 'Kausalsatz',
        },
        {
          id: '8',
          words: ['Der', 'Mann', ',', 'den', 'ich', 'gestern', 'getroffen', 'habe', ',', 'ist', 'mein', 'Onkel'],
          correctOrder: ['Der', 'Mann', ',', 'den', 'ich', 'gestern', 'getroffen', 'habe', ',', 'ist', 'mein', 'Onkel'],
          userOrder: [],
          category: 'Relativsatz',
        },
      ];
    }

    // Mische die Wörter für jeden Satz
    const shuffledSentences = sentencesList.map(sentence => ({
      ...sentence,
      words: [...sentence.words].sort(() => Math.random() - 0.5),
    }));

    setSentences(shuffledSentences);
    setCurrentSentenceIndex(0);
    setIsComplete(false);
    setMistakes(0);
  };

  const handleWordClick = (word: string) => {
    if (isComplete || currentSentenceIndex >= sentences.length) return;

    const currentSentence = sentences[currentSentenceIndex];
    if (currentSentence.userOrder.includes(word)) return;

    const newUserOrder = [...currentSentence.userOrder, word];
    const updatedSentences = sentences.map((s, idx) =>
      idx === currentSentenceIndex
        ? { ...s, userOrder: newUserOrder }
        : s
    );
    setSentences(updatedSentences);

    // Prüfe ob Satz vollständig ist
    if (newUserOrder.length === currentSentence.correctOrder.length) {
      checkSentence(currentSentenceIndex);
    }
  };

  const handleRemoveWord = (index: number) => {
    if (isComplete || currentSentenceIndex >= sentences.length) return;

    const currentSentence = sentences[currentSentenceIndex];
    const newUserOrder = currentSentence.userOrder.filter((_, i) => i !== index);
    const updatedSentences = sentences.map((s, idx) =>
      idx === currentSentenceIndex
        ? { ...s, userOrder: newUserOrder }
        : s
    );
    setSentences(updatedSentences);
  };

  const checkSentence = (sentenceIndex: number) => {
    const sentence = sentences[sentenceIndex];
    const isCorrect = JSON.stringify(sentence.userOrder) === JSON.stringify(sentence.correctOrder);

    if (isCorrect) {
      // Richtiger Satz!
      if (sentenceIndex < sentences.length - 1) {
        // Nächster Satz
        setCurrentSentenceIndex(sentenceIndex + 1);
      } else {
        // Alle Sätze gelöst!
        setIsComplete(true);
        setShowConfetti(true);

        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const basePoints = 35 * classLevel;
        const timeBonus = Math.max(0, 150 - timeSpent);
        const mistakePenalty = mistakes * 3;
        const calculatedPoints = Math.max(0, basePoints + timeBonus - mistakePenalty);

        setPoints(calculatedPoints);

        setTimeout(() => {
          const result: GameResult = {
            gameId,
            points: calculatedPoints,
            completed: true,
            timeSpent,
            score: 100 - mistakes * 4,
            mistakes,
          };
          onComplete(result);
        }, 2000);
      }
    } else {
      // Falscher Satz
      setMistakes(prev => prev + 1);
      // Zeige richtige Antwort kurz an, dann reset
      setTimeout(() => {
        const resetSentences = sentences.map((s, idx) =>
          idx === sentenceIndex
            ? { ...s, userOrder: [] }
            : s
        );
        setSentences(resetSentences);
      }, 2000);
    }
  };

  const currentSentence = sentences[currentSentenceIndex];
  const solvedCount = sentences.filter(s => s.userOrder.length === s.correctOrder.length).length;
  const availableWords = currentSentence
    ? currentSentence.words.filter(
        word => !currentSentence.userOrder.includes(word) ||
        currentSentence.userOrder.filter(w => w === word).length <
        currentSentence.words.filter(w => w === word).length
      )
    : [];

  return (
    <BaseGame
      onExit={onExit}
      title="📝 Satz-Bau"
      description="Baue die Sätze in der richtigen Reihenfolge!"
    >
      {showConfetti && <Confetti show={showConfetti} />}

      <div className="space-y-6">
        {isComplete ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-primary-900 mb-2">
              Super gemacht!
            </h2>
            <p className="text-lg text-primary-700 mb-4">
              Du hast {points} Punkte verdient!
            </p>
            <p className="text-sm text-primary-600">
              {sentences.length} Sätze gebaut • {mistakes} Fehler
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-primary-700 font-semibold">
                Fortschritt: {solvedCount} / {sentences.length} Sätze gebaut
              </p>
              {mistakes > 0 && (
                <p className="text-sm text-red-600">Fehler: {mistakes}</p>
              )}
            </div>

            {/* Aktueller Satz */}
            {currentSentence && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Baue diesen Satz: <span className="text-primary-600">({currentSentence.category})</span>
                </h3>
                
                {/* Gebauter Satz */}
                <div className="min-h-[80px] p-4 bg-primary-50 rounded-xl border-2 border-primary-300 mb-4">
                  {currentSentence.userOrder.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">Klicke auf die Wörter, um den Satz zu bauen</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentSentence.userOrder.map((word, index) => (
                        <button
                          key={`${word}-${index}`}
                          onClick={() => handleRemoveWord(index)}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all"
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Verfügbare Wörter */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-700 mb-2">
                    Verfügbare Wörter:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableWords.map((word, index) => (
                      <button
                        key={`${word}-${index}`}
                        onClick={() => handleWordClick(word)}
                        className="px-4 py-2 bg-white border-2 border-primary-300 text-primary-900 rounded-lg font-semibold hover:bg-primary-100 hover:border-primary-400 transition-all"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Alle Sätze Übersicht */}
            <div className="mt-6 pt-6 border-t-2 border-primary-200">
              <h3 className="text-sm font-semibold text-primary-700 mb-3">
                Alle Sätze:
              </h3>
              <div className="space-y-2">
                {sentences.map((sentence, idx) => (
                  <div
                    key={sentence.id}
                    className={`p-3 rounded-lg border-2 ${
                      sentence.userOrder.length === sentence.correctOrder.length
                        ? JSON.stringify(sentence.userOrder) === JSON.stringify(sentence.correctOrder)
                          ? 'bg-green-100 border-green-400'
                          : 'bg-red-100 border-red-400'
                        : idx === currentSentenceIndex
                        ? 'bg-primary-100 border-primary-400'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="text-sm">
                      {idx + 1}. {sentence.userOrder.length > 0 
                        ? sentence.userOrder.join(' ') 
                        : 'Noch nicht gebaut'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={generateSentences} variant="secondary">
                Neues Spiel
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

