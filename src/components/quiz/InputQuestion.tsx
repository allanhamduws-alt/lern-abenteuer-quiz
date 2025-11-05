/**
 * InputQuestion Komponente
 * Für Fragen mit direkter Eingabe (z.B. Rechenaufgaben)
 */

import { useState } from 'react';
import type { Question } from '../../types';

interface InputQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult: boolean;
  selectedAnswer: string | null;
}

export function InputQuestion({ question, onAnswer, showResult, selectedAnswer }: InputQuestionProps) {
  const [inputValue, setInputValue] = useState(selectedAnswer || '');

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

  const isCorrect = selectedAnswer !== null && String(selectedAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={showResult}
          placeholder="Antwort eingeben..."
          className={`flex-1 p-4 text-2xl rounded-lg border-2 transition-all duration-300 ${
            showResult
              ? isCorrect
                ? 'bg-success-500 text-white border-success-600'
                : 'bg-error-500 text-white border-error-600'
              : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
          }`}
          autoFocus
        />
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={inputValue.trim() === ''}
            className="px-6 py-4 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Antworten
          </button>
        )}
      </div>
      
      {/* Erfolgs-Box nur bei falschen Antworten (für Erklärung) */}
      {showResult && selectedAnswer !== null && !isCorrect && (
        <div className="mt-4 p-4 rounded-lg bg-error-50 text-error-800 border-2 border-error-300">
          <div className="text-lg font-bold mb-2">💪 Fast richtig!</div>
          <div className="mb-2">
            Deine Antwort: <strong>{selectedAnswer}</strong>
          </div>
          <div className="mb-2">
            Die richtige Antwort ist: <strong>{question.correctAnswer}</strong>
          </div>
          {question.explanation && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3 mt-3 border-l-4 border-primary-400">
              <div className="text-sm font-semibold text-gray-700 mb-1">
                💡 So funktioniert es:
              </div>
              <div className="text-sm text-gray-700">
                {question.explanation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

