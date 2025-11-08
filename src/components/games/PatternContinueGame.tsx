/**
 * PatternContinueGame - Muster fortsetzen Mini-Spiel
 * Spieler müssen logische Reihenfolgen erkennen und fortsetzen
 * Fördert logisches Denken und Mustererkennung
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

interface Pattern {
  id: string;
  sequence: (number | string)[];
  correctAnswer: number | string;
  options: (number | string)[];
  patternType: 'number' | 'shape' | 'color' | 'mixed';
  description: string;
}

export function PatternContinueGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    generatePatterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generatePatterns = () => {
    let patternsList: Pattern[] = [];

    if (classLevel === 1) {
      // Klasse 1: Einfache Zahlenfolgen
      patternsList = [
        {
          id: '1',
          sequence: [1, 2, 3, 4],
          correctAnswer: 5,
          options: [4, 5, 6, 7],
          patternType: 'number',
          description: 'Zahlen der Reihe nach',
        },
        {
          id: '2',
          sequence: [2, 4, 6, 8],
          correctAnswer: 10,
          options: [9, 10, 11, 12],
          patternType: 'number',
          description: 'Gerade Zahlen',
        },
        {
          id: '3',
          sequence: [5, 10, 15, 20],
          correctAnswer: 25,
          options: [22, 24, 25, 26],
          patternType: 'number',
          description: 'Plus 5',
        },
        {
          id: '4',
          sequence: ['🔴', '🔵', '🔴', '🔵'],
          correctAnswer: '🔴',
          options: ['🔴', '🔵', '🟢', '🟡'],
          patternType: 'color',
          description: 'Farben wechseln',
        },
        {
          id: '5',
          sequence: [10, 9, 8, 7],
          correctAnswer: 6,
          options: [5, 6, 7, 8],
          patternType: 'number',
          description: 'Rückwärts zählen',
        },
      ];
    } else if (classLevel === 2) {
      // Klasse 2: Komplexere Muster
      patternsList = [
        {
          id: '1',
          sequence: [1, 3, 5, 7],
          correctAnswer: 9,
          options: [8, 9, 10, 11],
          patternType: 'number',
          description: 'Ungerade Zahlen',
        },
        {
          id: '2',
          sequence: [3, 6, 9, 12],
          correctAnswer: 15,
          options: [13, 14, 15, 16],
          patternType: 'number',
          description: 'Plus 3',
        },
        {
          id: '3',
          sequence: ['🔴', '🔴', '🔵', '🔵', '🟢'],
          correctAnswer: '🟢',
          options: ['🔴', '🔵', '🟢', '🟡'],
          patternType: 'color',
          description: 'Farben wiederholen',
        },
        {
          id: '4',
          sequence: [2, 4, 8, 16],
          correctAnswer: 32,
          options: [24, 28, 32, 36],
          patternType: 'number',
          description: 'Verdoppeln',
        },
        {
          id: '5',
          sequence: [20, 18, 16, 14],
          correctAnswer: 12,
          options: [10, 11, 12, 13],
          patternType: 'number',
          description: 'Minus 2',
        },
        {
          id: '6',
          sequence: ['▲', '●', '▲', '●', '▲'],
          correctAnswer: '●',
          options: ['▲', '●', '■', '◆'],
          patternType: 'shape',
          description: 'Formen wechseln',
        },
      ];
    } else if (classLevel === 3) {
      // Klasse 3: Fortgeschrittene Muster
      patternsList = [
        {
          id: '1',
          sequence: [1, 4, 9, 16],
          correctAnswer: 25,
          options: [20, 23, 25, 28],
          patternType: 'number',
          description: 'Quadratzahlen (1², 2², 3², 4²)',
        },
        {
          id: '2',
          sequence: [1, 1, 2, 3, 5],
          correctAnswer: 8,
          options: [6, 7, 8, 9],
          patternType: 'number',
          description: 'Fibonacci-Folge',
        },
        {
          id: '3',
          sequence: ['🔴', '🔵', '🟢', '🔴', '🔵'],
          correctAnswer: '🟢',
          options: ['🔴', '🔵', '🟢', '🟡'],
          patternType: 'color',
          description: 'Farben im Kreis',
        },
        {
          id: '4',
          sequence: [5, 10, 20, 40],
          correctAnswer: 80,
          options: [60, 70, 80, 90],
          patternType: 'number',
          description: 'Verdoppeln',
        },
        {
          id: '5',
          sequence: [100, 90, 80, 70],
          correctAnswer: 60,
          options: [50, 60, 65, 70],
          patternType: 'number',
          description: 'Minus 10',
        },
        {
          id: '6',
          sequence: ['▲', '▲', '●', '●', '■', '■'],
          correctAnswer: '▲',
          options: ['▲', '●', '■', '◆'],
          patternType: 'shape',
          description: 'Formen wiederholen',
        },
        {
          id: '7',
          sequence: [2, 6, 12, 20],
          correctAnswer: 30,
          options: [24, 28, 30, 32],
          patternType: 'number',
          description: 'Plus 4, 6, 8, 10...',
        },
      ];
    } else {
      // Klasse 4: Sehr komplexe Muster
      patternsList = [
        {
          id: '1',
          sequence: [1, 8, 27, 64],
          correctAnswer: 125,
          options: [100, 110, 125, 130],
          patternType: 'number',
          description: 'Kubikzahlen (1³, 2³, 3³, 4³)',
        },
        {
          id: '2',
          sequence: [1, 2, 4, 7, 11],
          correctAnswer: 16,
          options: [14, 15, 16, 17],
          patternType: 'number',
          description: 'Plus 1, 2, 3, 4, 5...',
        },
        {
          id: '3',
          sequence: ['🔴', '🔵', '🟢', '🟡', '🔴', '🔵'],
          correctAnswer: '🟢',
          options: ['🔴', '🔵', '🟢', '🟡'],
          patternType: 'color',
          description: 'Farben im Kreis',
        },
        {
          id: '4',
          sequence: [3, 9, 27, 81],
          correctAnswer: 243,
          options: [200, 230, 243, 250],
          patternType: 'number',
          description: 'Mal 3',
        },
        {
          id: '5',
          sequence: [50, 45, 40, 35],
          correctAnswer: 30,
          options: [25, 28, 30, 32],
          patternType: 'number',
          description: 'Minus 5',
        },
        {
          id: '6',
          sequence: ['▲', '●', '■', '◆', '▲', '●'],
          correctAnswer: '■',
          options: ['▲', '●', '■', '◆'],
          patternType: 'shape',
          description: 'Formen im Kreis',
        },
        {
          id: '7',
          sequence: [1, 3, 6, 10, 15],
          correctAnswer: 21,
          options: [18, 20, 21, 22],
          patternType: 'number',
          description: 'Dreieckszahlen',
        },
        {
          id: '8',
          sequence: [2, 5, 11, 23],
          correctAnswer: 47,
          options: [40, 44, 47, 50],
          patternType: 'number',
          description: 'Mal 2 plus 1',
        },
      ];
    }

    setPatterns(patternsList);
    setCurrentPatternIndex(0);
    setIsComplete(false);
    setMistakes(0);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answer: number | string) => {
    if (isComplete || currentPatternIndex >= patterns.length) return;

    setSelectedAnswer(answer);
    const currentPattern = patterns[currentPatternIndex];
    const isCorrect = answer === currentPattern.correctAnswer;

    if (isCorrect) {
      // Richtige Antwort!
      if (currentPatternIndex < patterns.length - 1) {
        // Nächster Pattern
        setTimeout(() => {
          setCurrentPatternIndex(currentPatternIndex + 1);
          setSelectedAnswer(null);
        }, 1000);
      } else {
        // Alle Patterns gelöst!
        setIsComplete(true);
        setShowConfetti(true);

        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const basePoints = 40 * classLevel;
        const timeBonus = Math.max(0, 180 - timeSpent);
        const mistakePenalty = mistakes * 5;
        const calculatedPoints = Math.max(0, basePoints + timeBonus - mistakePenalty);

        setPoints(calculatedPoints);

        setTimeout(() => {
          const result: GameResult = {
            gameId,
            points: calculatedPoints,
            completed: true,
            timeSpent,
            score: 100 - mistakes * 6,
            mistakes,
          };
          onComplete(result);
        }, 2000);
      }
    } else {
      // Falsche Antwort
      setMistakes(prev => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const currentPattern = patterns[currentPatternIndex];
  const solvedCount = currentPatternIndex;

  return (
    <BaseGame
      onExit={onExit}
      title="🔍 Muster fortsetzen"
      description="Erkenne das Muster und setze es fort!"
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
              {patterns.length} Muster erkannt • {mistakes} Fehler
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-primary-700 font-semibold">
                Fortschritt: {solvedCount} / {patterns.length} Muster gelöst
              </p>
              {mistakes > 0 && (
                <p className="text-sm text-red-600">Fehler: {mistakes}</p>
              )}
            </div>

            {/* Aktuelles Muster */}
            {currentPattern && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Muster {currentPatternIndex + 1}: {currentPattern.description}
                </h3>
                
                {/* Muster anzeigen */}
                <div className="mb-6 p-6 bg-primary-50 rounded-xl border-2 border-primary-300">
                  <div className="flex items-center justify-center gap-4 flex-wrap text-4xl">
                    {currentPattern.sequence.map((item, index) => (
                      <span key={index} className="font-bold">
                        {item}
                      </span>
                    ))}
                    <span className="text-primary-600 text-3xl">?</span>
                  </div>
                </div>

                {/* Antwort-Optionen */}
                <div>
                  <h4 className="text-sm font-semibold text-primary-700 mb-3">
                    Was kommt als Nächstes?
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currentPattern.options.map((option, index) => {
                      const isSelected = selectedAnswer === option;
                      const isCorrect = option === currentPattern.correctAnswer && isSelected;
                      const isWrong = isSelected && option !== currentPattern.correctAnswer;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={selectedAnswer !== null}
                          className={`p-6 rounded-xl border-2 text-3xl font-bold transition-all ${
                            isCorrect
                              ? 'bg-green-500 text-white border-green-700'
                              : isWrong
                              ? 'bg-red-500 text-white border-red-700'
                              : selectedAnswer !== null
                              ? 'bg-gray-200 text-gray-400 border-gray-300'
                              : 'bg-white border-primary-300 text-primary-900 hover:bg-primary-100 hover:border-primary-400'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Alle Muster Übersicht */}
            <div className="mt-6 pt-6 border-t-2 border-primary-200">
              <h3 className="text-sm font-semibold text-primary-700 mb-3">
                Alle Muster:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patterns.map((pattern, idx) => (
                  <div
                    key={pattern.id}
                    className={`p-3 rounded-lg border-2 ${
                      idx < currentPatternIndex
                        ? 'bg-green-100 border-green-400'
                        : idx === currentPatternIndex
                        ? 'bg-primary-100 border-primary-400'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      Muster {idx + 1}: {pattern.description}
                    </div>
                    <div className="text-xs text-gray-600">
                      {pattern.sequence.join(' ')} ?
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={generatePatterns} variant="secondary">
                Neues Spiel
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

