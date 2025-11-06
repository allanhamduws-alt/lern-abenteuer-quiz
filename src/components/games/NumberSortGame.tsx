/**
 * NumberSortGame - Zahlen-Sortierung Mini-Spiel
 * Spieler müssen Zahlen in aufsteigender Reihenfolge sortieren
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

export function NumberSortGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [isAttemptIncorrect, setIsAttemptIncorrect] = useState(false);
  const [mistakes, setMistakes] = useState(0); // Fehlerzähler

  // Generiere Zahlen basierend auf Klassenstufe
  useEffect(() => {
    generateNumbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generateNumbers = () => {
    let min = 1;
    let max = 20;
    let count = 5;

    if (classLevel === 1) {
      min = 1;
      max = 20;
      count = 5;
    } else if (classLevel === 2) {
      min = 10;
      max = 50;
      count = 6;
    } else if (classLevel === 3) {
      min = 1;
      max = 100;
      count = 7;
    } else {
      min = 10;
      max = 200;
      count = 8;
    }

    const generated: number[] = [];
    while (generated.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!generated.includes(num)) {
        generated.push(num);
      }
    }

    setNumbers(generated);
    setSelectedNumbers([]);
    setIsComplete(false);
    setIsAttemptIncorrect(false);
    setMistakes(0); // Fehlerzähler zurücksetzen
  };

  const handleNumberClick = (num: number) => {
    if (isComplete) return;

    if (selectedNumbers.includes(num)) {
      // Zahl wieder entfernen
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      // Zahl hinzufügen
      const newSelected = [...selectedNumbers, num];
      setSelectedNumbers(newSelected);
      
      // Prüfe ob diese Zahl an der falschen Position ist (Fehler zählen)
      const allNumbersSorted = [...numbers].sort((a, b) => a - b);
      const expectedIndex = newSelected.length - 1;
      const expectedNumber = allNumbersSorted[expectedIndex];
      
      if (num !== expectedNumber) {
        // Falsche Zahl an falscher Position - Fehler zählen
        setMistakes(prev => prev + 1);
      }
    }
  };

  const checkOrder = () => {
    const sorted = [...selectedNumbers].sort((a, b) => a - b);
    const isCorrect = JSON.stringify(selectedNumbers) === JSON.stringify(sorted);

    if (isCorrect && selectedNumbers.length === numbers.length) {
      setIsComplete(true);
      setShowConfetti(true);
      setIsAttemptIncorrect(false);

      // Punkte berechnen mit Fehlerabzug
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const basePoints = 20 * classLevel;
      const timeBonus = Math.max(0, 60 - timeSpent); // Bonus für schnelles Lösen
      const mistakePenalty = mistakes * 5; // 5 Punkte Abzug pro Fehler
      const calculatedPoints = Math.max(0, basePoints + timeBonus - mistakePenalty);

      setPoints(calculatedPoints);

      // Nach kurzer Pause Ergebnis übergeben
      setTimeout(() => {
        const result: GameResult = {
          gameId,
          points: calculatedPoints,
          completed: true,
          timeSpent,
          score: 100 - (mistakes * 10), // Score reduziert sich mit Fehlern
          mistakes: mistakes, // Fehleranzahl übergeben
        };
        onComplete(result);
      }, 2000);
    } else if (selectedNumbers.length === numbers.length) {
      // Falsche Reihenfolge - zeige rotes Feedback
      setMistakes(prev => prev + 1); // Zusätzlicher Fehler für falsche Prüfung
      setIsAttemptIncorrect(true);
      setTimeout(() => {
        setIsAttemptIncorrect(false);
      }, 1500);
    } else {
      setIsAttemptIncorrect(false);
    }
  };

  const remainingNumbers = numbers.filter((n) => !selectedNumbers.includes(n));

  // Prüfe ob eine bestimmte Zahl an der richtigen Position ist
  const isNumberAtCorrectPosition = (num: number, index: number) => {
    // Alle Zahlen sortieren (die richtige Reihenfolge)
    const allNumbersSorted = [...numbers].sort((a, b) => a - b);
    
    // Erwartete Zahl an dieser Position
    const expectedNumber = allNumbersSorted[index];
    
    return num === expectedNumber;
  };

  const getSelectedButtonStyle = (num: number, index: number) => {
    // Spiel beendet - immer grün
    if (isComplete) {
      return 'px-6 py-3 bg-green-500 border-2 border-green-700 text-white text-xl font-bold rounded-lg shadow-lg min-w-[60px] relative z-10';
    }
    
    // Falscher Versuch nach Prüfen - rot (nur wenn was falsch ist)
    if (isAttemptIncorrect) {
      // Prüfe ob diese spezifische Zahl falsch ist
      if (!isNumberAtCorrectPosition(num, index)) {
        return 'px-6 py-3 bg-red-500 border-2 border-red-700 text-white text-xl font-bold rounded-lg shadow-lg min-w-[60px] relative z-10';
      }
    }
    
    // Prüfe ob diese spezifische Zahl an der richtigen Position ist
    if (selectedNumbers.length > 1) {
      if (isNumberAtCorrectPosition(num, index)) {
        // Diese Zahl ist richtig - grün
        return 'px-6 py-3 bg-green-500 border-2 border-green-700 text-white text-xl font-bold rounded-lg shadow-lg min-w-[60px] relative z-10';
      } else {
        // Diese Zahl ist falsch - rot
        return 'px-6 py-3 bg-red-500 border-2 border-red-700 text-white text-xl font-bold rounded-lg shadow-lg min-w-[60px] relative z-10';
      }
    }
    
    // Standard - weiß wie verfügbare Zahlen (1 Zahl oder keine)
    return 'px-6 py-3 bg-primary-50 border-2 border-primary-500 text-primary-900 text-xl font-bold rounded-lg hover:border-primary-600 hover:bg-primary-100 hover:shadow-md transition-all min-w-[60px] relative z-10';
  };

  return (
    <BaseGame
      onExit={onExit}
      title="🔢 Zahlen sortieren"
      description="Sortiere die Zahlen von klein nach groß!"
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
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-4">
                Wähle die Zahlen in der richtigen Reihenfolge (von klein nach groß):
              </h3>

              {/* Ausgewählte Zahlen */}
              {selectedNumbers.length > 0 && (
                <div className="mb-6 p-4 bg-primary-100 rounded-lg border-2 border-primary-400">
                  <p className="text-sm text-primary-800 mb-3 font-bold">Deine Reihenfolge:</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedNumbers.map((num, index) => (
                      <button
                        key={`selected-${num}-${index}`}
                        onClick={() => handleNumberClick(num)}
                        className={getSelectedButtonStyle(num, index)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Verfügbare Zahlen */}
              <div>
                <p className="text-sm text-primary-700 mb-2 font-semibold">
                  Verfügbare Zahlen ({remainingNumbers.length} übrig):
                </p>
                <div className="flex flex-wrap gap-2">
                  {remainingNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className="px-6 py-3 bg-primary-50 border-2 border-primary-500 text-primary-900 text-xl font-bold rounded-lg hover:border-primary-600 hover:bg-primary-100 hover:shadow-md transition-all"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={checkOrder}
                disabled={selectedNumbers.length !== numbers.length}
                variant="primary"
              >
                Prüfen
              </Button>
              <Button onClick={generateNumbers} variant="secondary">
                Neue Zahlen
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

