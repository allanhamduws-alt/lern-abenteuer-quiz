/**
 * MathPuzzleGame - Rechen-Puzzle Mini-Spiel
 * Spieler müssen Gleichungen lösen durch Drag & Drop von Zahlen
 * Anspruchsvoller als NumberSortGame, fördert Rechenfähigkeiten
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

interface Equation {
  id: string;
  left: number;
  operator: '+' | '-' | '×' | '÷';
  right: number;
  answer: number;
  userAnswer: number | null;
}

export function MathPuzzleGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [equations, setEquations] = useState<Equation[]>([]);
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [currentEquationIndex, setCurrentEquationIndex] = useState(0);

  useEffect(() => {
    generateEquations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generateEquations = () => {
    let equationsList: Equation[] = [];
    let numbers: number[] = [];

    if (classLevel === 1) {
      // Klasse 1: Einfache Addition und Subtraktion bis 20
      equationsList = [
        { id: '1', left: 5, operator: '+', right: 3, answer: 8, userAnswer: null },
        { id: '2', left: 10, operator: '-', right: 4, answer: 6, userAnswer: null },
        { id: '3', left: 7, operator: '+', right: 5, answer: 12, userAnswer: null },
        { id: '4', left: 15, operator: '-', right: 6, answer: 9, userAnswer: null },
        { id: '5', left: 9, operator: '+', right: 8, answer: 17, userAnswer: null },
      ];
      numbers = [6, 8, 9, 12, 17, 4, 5, 7, 10, 11];
    } else if (classLevel === 2) {
      // Klasse 2: Addition/Subtraktion bis 50, einfache Multiplikation
      equationsList = [
        { id: '1', left: 12, operator: '+', right: 15, answer: 27, userAnswer: null },
        { id: '2', left: 30, operator: '-', right: 12, answer: 18, userAnswer: null },
        { id: '3', left: 4, operator: '×', right: 5, answer: 20, userAnswer: null },
        { id: '4', left: 25, operator: '+', right: 18, answer: 43, userAnswer: null },
        { id: '5', left: 40, operator: '-', right: 15, answer: 25, userAnswer: null },
        { id: '6', left: 6, operator: '×', right: 4, answer: 24, userAnswer: null },
      ];
      numbers = [18, 20, 24, 25, 27, 43, 15, 16, 22, 28, 30, 35];
    } else if (classLevel === 3) {
      // Klasse 3: Größere Zahlen, Multiplikation, einfache Division
      equationsList = [
        { id: '1', left: 45, operator: '+', right: 28, answer: 73, userAnswer: null },
        { id: '2', left: 60, operator: '-', right: 24, answer: 36, userAnswer: null },
        { id: '3', left: 7, operator: '×', right: 8, answer: 56, userAnswer: null },
        { id: '4', left: 24, operator: '÷', right: 4, answer: 6, userAnswer: null },
        { id: '5', left: 35, operator: '+', right: 42, answer: 77, userAnswer: null },
        { id: '6', left: 9, operator: '×', right: 6, answer: 54, userAnswer: null },
        { id: '7', left: 48, operator: '÷', right: 6, answer: 8, userAnswer: null },
      ];
      numbers = [6, 8, 36, 54, 56, 73, 77, 12, 15, 20, 28, 30, 40, 45];
    } else {
      // Klasse 4: Größere Zahlen, alle Operationen
      equationsList = [
        { id: '1', left: 125, operator: '+', right: 87, answer: 212, userAnswer: null },
        { id: '2', left: 200, operator: '-', right: 65, answer: 135, userAnswer: null },
        { id: '3', left: 12, operator: '×', right: 9, answer: 108, userAnswer: null },
        { id: '4', left: 72, operator: '÷', right: 8, answer: 9, userAnswer: null },
        { id: '5', left: 156, operator: '+', right: 94, answer: 250, userAnswer: null },
        { id: '6', left: 11, operator: '×', right: 11, answer: 121, userAnswer: null },
        { id: '7', left: 90, operator: '÷', right: 6, answer: 15, userAnswer: null },
        { id: '8', left: 180, operator: '-', right: 95, answer: 85, userAnswer: null },
      ];
      numbers = [9, 15, 85, 108, 121, 135, 212, 250, 50, 60, 70, 80, 100, 110, 120, 140];
    }

    // Mische die Zahlen
    const shuffledNumbers = [...numbers].sort(() => Math.random() - 0.5);
    setAvailableNumbers(shuffledNumbers);
    setEquations(equationsList);
    setCurrentEquationIndex(0);
    setIsComplete(false);
    setMistakes(0);
    setSelectedNumber(null);
  };

  const handleNumberClick = (num: number) => {
    if (isComplete || currentEquationIndex >= equations.length) return;
    if (!currentEquation || currentEquation.userAnswer !== null) return;
    
    // Setze ausgewählte Zahl
    setSelectedNumber(num);
    
    // Automatisch prüfen nach kurzer Verzögerung (für visuelles Feedback)
    setTimeout(() => {
      handleEquationClick(currentEquation.id, num);
    }, 300);
  };

  const handleEquationClick = (equationId: string, numberToCheck?: number) => {
    const number = numberToCheck || selectedNumber;
    if (!number || isComplete || currentEquationIndex >= equations.length) return;

    const equation = equations.find(eq => eq.id === equationId);
    if (!equation || equation.userAnswer !== null) return;

    const isCorrect = number === equation.answer;
    
    const updatedEquations = equations.map(eq => 
      eq.id === equationId 
        ? { ...eq, userAnswer: number }
        : eq
    );
    setEquations(updatedEquations);

    if (isCorrect) {
      // Richtige Antwort!
      setAvailableNumbers(availableNumbers.filter(n => n !== number));
      setSelectedNumber(null);
      
      // Prüfe ob alle Gleichungen gelöst wurden
      const allSolved = updatedEquations.every(eq => eq.userAnswer !== null);
      if (allSolved) {
        setIsComplete(true);
        setShowConfetti(true);

        // Punkte berechnen
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const basePoints = 30 * classLevel;
        const timeBonus = Math.max(0, 120 - timeSpent);
        const mistakePenalty = mistakes * 4;
        const calculatedPoints = Math.max(0, basePoints + timeBonus - mistakePenalty);

        setPoints(calculatedPoints);

        setTimeout(() => {
          const result: GameResult = {
            gameId,
            points: calculatedPoints,
            completed: true,
            timeSpent,
            score: 100 - mistakes * 5,
            mistakes,
          };
          onComplete(result);
        }, 2000);
      } else {
        // Nächste Gleichung nach kurzer Verzögerung
        setTimeout(() => {
          const nextIndex = updatedEquations.findIndex(eq => eq.userAnswer === null);
          if (nextIndex !== -1) {
            setCurrentEquationIndex(nextIndex);
          }
        }, 1000);
      }
    } else {
      // Falsche Antwort
      setMistakes(prev => prev + 1);
      setSelectedNumber(null);
      // Zeige kurzes rotes Feedback, dann reset
      setTimeout(() => {
        const resetEquations = equations.map(eq => 
          eq.id === equationId 
            ? { ...eq, userAnswer: null }
            : eq
        );
        setEquations(resetEquations);
      }, 1500);
    }
  };

  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '×': return '×';
      case '÷': return '÷';
      default: return op;
    }
  };

  const currentEquation = equations[currentEquationIndex];
  const solvedCount = equations.filter(eq => eq.userAnswer !== null).length;

  return (
    <BaseGame
      onExit={onExit}
      title="🧮 Rechen-Puzzle"
      description="Löse die Gleichungen durch Drag & Drop!"
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
              {equations.length} Gleichungen gelöst • {mistakes} Fehler
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-primary-700 font-semibold">
                Fortschritt: {solvedCount} / {equations.length} Gleichungen gelöst
              </p>
              {mistakes > 0 && (
                <p className="text-sm text-red-600">Fehler: {mistakes}</p>
              )}
            </div>

            {/* Aktuelle Gleichung */}
            {currentEquation && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary-900 mb-4">
                  Löse diese Gleichung:
                </h3>
                <div className="flex items-center justify-center gap-4 text-3xl font-bold">
                  <span className="bg-primary-100 px-6 py-4 rounded-xl border-2 border-primary-400">
                    {currentEquation.left}
                  </span>
                  <span className="text-primary-700">
                    {getOperatorSymbol(currentEquation.operator)}
                  </span>
                  <span className="bg-primary-100 px-6 py-4 rounded-xl border-2 border-primary-400">
                    {currentEquation.right}
                  </span>
                  <span className="text-primary-700">=</span>
                  <div
                    className={`px-8 py-4 rounded-xl border-2 text-3xl font-bold transition-all ${
                      currentEquation.userAnswer !== null
                        ? currentEquation.userAnswer === currentEquation.answer
                          ? 'bg-green-500 text-white border-green-700'
                          : 'bg-red-500 text-white border-red-700'
                        : selectedNumber !== null
                        ? 'bg-primary-500 text-white border-primary-700'
                        : 'bg-gray-200 text-gray-500 border-gray-400'
                    }`}
                  >
                    {currentEquation.userAnswer !== null 
                      ? currentEquation.userAnswer 
                      : selectedNumber !== null 
                      ? selectedNumber 
                      : '?'}
                  </div>
                </div>
                {currentEquation.userAnswer !== null && (
                  <p className={`text-center mt-2 font-semibold ${
                    currentEquation.userAnswer === currentEquation.answer
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {currentEquation.userAnswer === currentEquation.answer ? '✓ Richtig!' : '✗ Falsch'}
                  </p>
                )}
              </div>
            )}

            {/* Verfügbare Zahlen */}
            <div>
              <h3 className="text-lg font-semibold text-primary-900 mb-3">
                Wähle eine Zahl:
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    className={`px-6 py-4 text-2xl font-bold rounded-xl border-2 transition-all ${
                      selectedNumber === num
                        ? 'bg-primary-500 text-white border-primary-700 scale-110'
                        : 'bg-primary-50 border-primary-300 text-primary-900 hover:bg-primary-100 hover:border-primary-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Alle Gleichungen Übersicht */}
            <div className="mt-6 pt-6 border-t-2 border-primary-200">
              <h3 className="text-sm font-semibold text-primary-700 mb-3">
                Alle Gleichungen:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {equations.map((eq) => (
                  <div
                    key={eq.id}
                    className={`p-3 rounded-lg border-2 text-center ${
                      eq.userAnswer !== null
                        ? eq.userAnswer === eq.answer
                          ? 'bg-green-100 border-green-400'
                          : 'bg-red-100 border-red-400'
                        : eq.id === currentEquation?.id
                        ? 'bg-primary-100 border-primary-400'
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-semibold">
                      {eq.left} {getOperatorSymbol(eq.operator)} {eq.right} = {eq.userAnswer !== null ? eq.userAnswer : '?'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={generateEquations} variant="secondary">
                Neues Spiel
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

