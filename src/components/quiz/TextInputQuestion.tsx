/**
 * TextInputQuestion Komponente
 * Freie Texteingabe für Wörter oder kurze Sätze (z.B. Rechtschreibung)
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface TextInputQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult: boolean;
  selectedAnswer: string | null;
}

export function TextInputQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: TextInputQuestionProps) {
  const [inputValue, setInputValue] = useState(selectedAnswer || '');
  const expectedAnswer = question.expectedAnswer || String(question.correctAnswer || '');
  const placeholder = question.placeholder || 'Deine Antwort...';
  const maxLength = question.maxLength || 50;

  useEffect(() => {
    if (selectedAnswer !== null) {
      setInputValue(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleSubmit = () => {
    if (inputValue.trim() !== '') {
      onAnswer(inputValue.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Vergleich: exakt oder enthält (flexibel für Rechtschreibung)
  const normalizeAnswer = (answer: string) => {
    return answer.trim().toLowerCase();
  };

  const isCorrect = showResult && selectedAnswer !== null && 
    normalizeAnswer(selectedAnswer) === normalizeAnswer(expectedAnswer);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            if (!maxLength || value.length <= maxLength) {
              setInputValue(value);
            }
          }}
          onKeyPress={handleKeyPress}
          disabled={showResult}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`flex-1 p-4 text-xl rounded-lg border-2 transition-all duration-300 ${
            showResult
              ? isCorrect
                ? 'bg-green-500 text-white border-green-600'
                : 'bg-red-500 text-white border-red-600'
              : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
          }`}
          autoFocus
        />
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={inputValue.trim() === ''}
            className="px-6 py-4 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prüfen
          </button>
        )}
      </div>

      {showResult && (
        <div className={`p-4 rounded-lg border-2 ${
          isCorrect 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {isCorrect ? (
            <div className="flex items-center gap-2 text-green-800">
              <span className="text-2xl">✓</span>
              <span className="font-semibold">Richtig!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-2xl">✗</span>
                <span className="font-semibold">Nicht ganz richtig</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Richtige Antwort:</span> {expectedAnswer}
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
    </div>
  );
}

