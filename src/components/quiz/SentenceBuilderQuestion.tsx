/**
 * SentenceBuilderQuestion Komponente
 * Sätze aus Wortbausteinen bilden (Wörter in richtige Reihenfolge bringen)
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface SentenceBuilderQuestionProps {
  question: Question;
  onAnswer: (answer: number[]) => void;
  showResult: boolean;
  selectedAnswer: number[] | null;
}

export function SentenceBuilderQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: SentenceBuilderQuestionProps) {
  const sentenceParts = question.sentenceParts || [];
  const correctOrder = question.correctOrder || [];
  
  // Button-Modus als Standard (besser bedienbar auf Desktop)
  const [selectedOrder, setSelectedOrder] = useState<number[]>(
    selectedAnswer || []
  );
  const [availableParts, setAvailableParts] = useState<number[]>(
    Array.from({ length: sentenceParts.length }, (_, i) => i)
  );

  useEffect(() => {
    if (selectedAnswer !== null) {
      setSelectedOrder(selectedAnswer);
      // Berechne verfügbare Teile basierend auf selectedAnswer
      const used = new Set(selectedAnswer);
      setAvailableParts(
        Array.from({ length: sentenceParts.length }, (_, i) => i).filter(
          i => !used.has(i)
        )
      );
    }
  }, [selectedAnswer, sentenceParts.length]);

  const handlePartClick = (index: number) => {
    if (showResult) return;
    
    // Füge Teil zur ausgewählten Reihenfolge hinzu
    const newOrder = [...selectedOrder, index];
    setSelectedOrder(newOrder);
    
    // Entferne aus verfügbaren Teilen
    setAvailableParts(availableParts.filter(i => i !== index));
    
    // Sende Antwort sofort
    onAnswer(newOrder);
  };

  const handleRemovePart = (position: number) => {
    if (showResult) return;
    
    const removedIndex = selectedOrder[position];
    const newOrder = selectedOrder.filter((_, i) => i !== position);
    setSelectedOrder(newOrder);
    
    // Füge zurück zu verfügbaren Teilen
    setAvailableParts([...availableParts, removedIndex].sort((a, b) => a - b));
    
    // Sende aktualisierte Antwort
    onAnswer(newOrder);
  };

  const handleReset = () => {
    if (showResult) return;
    setSelectedOrder([]);
    setAvailableParts(Array.from({ length: sentenceParts.length }, (_, i) => i));
    onAnswer([]);
  };

  // Prüfe ob Antwort korrekt ist
  const isCorrect = showResult && selectedAnswer !== null &&
    JSON.stringify(selectedAnswer) === JSON.stringify(correctOrder);

  return (
    <div className="space-y-6">
      {/* Verfügbare Wortbausteine */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Verfügbare Wörter:
        </h3>
        <div className="flex flex-wrap gap-2">
          {availableParts.map((index) => (
            <button
              key={index}
              onClick={() => handlePartClick(index)}
              disabled={showResult}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold hover:bg-blue-200 border-2 border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sentenceParts[index]}
            </button>
          ))}
          {availableParts.length === 0 && !showResult && (
            <span className="text-gray-500 italic">Alle Wörter verwendet</span>
          )}
        </div>
      </div>

      {/* Gebauter Satz */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Dein Satz:
        </h3>
        <div className="min-h-[80px] p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
          {selectedOrder.length === 0 ? (
            <span className="text-gray-400 italic">Klicke auf die Wörter oben, um einen Satz zu bilden</span>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              {selectedOrder.map((index, position) => {
                const part = sentenceParts[index];
                const isCorrectPosition = showResult && 
                  correctOrder[position] === index;
                
                return (
                  <div
                    key={`${index}-${position}`}
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                      showResult
                        ? isCorrectPosition
                          ? 'bg-green-500 text-white border-green-600'
                          : 'bg-red-500 text-white border-red-600'
                        : 'bg-white text-gray-800 border-gray-400 hover:border-blue-500'
                    }`}
                  >
                    <span>{part}</span>
                    {!showResult && (
                      <button
                        onClick={() => handleRemovePart(position)}
                        className="ml-1 text-red-600 hover:text-red-800 font-bold"
                        aria-label="Entfernen"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ergebnis */}
      {showResult && (
        <div className={`p-4 rounded-lg border-2 ${
          isCorrect 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {isCorrect ? (
            <div className="flex items-center gap-2 text-green-800">
              <span className="text-2xl">✓</span>
              <span className="font-semibold">Richtig! Der Satz ist korrekt.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-2xl">✗</span>
                <span className="font-semibold">Nicht ganz richtig</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Richtige Reihenfolge:</span>{' '}
                {correctOrder.map(i => sentenceParts[i]).join(' ')}
              </div>
            </div>
          )}
          {question.explanation && (
            <div className="mt-3 pt-3 border-t border-gray-300 text-sm text-gray-700">
              <span className="font-semibold">💡 Erklärung:</span> {question.explanation}
            </div>
          )}
        </div>
      )}

      {/* Reset-Button */}
      {!showResult && selectedOrder.length > 0 && (
        <div className="text-right">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            ↻ Zurücksetzen
          </button>
        </div>
      )}
    </div>
  );
}

