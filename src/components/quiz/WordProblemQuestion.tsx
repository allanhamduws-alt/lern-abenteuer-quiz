/**
 * WordProblemQuestion Komponente
 * Für Textaufgaben mit Zahlen-Eingabe
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface WordProblemQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult: boolean;
  selectedAnswer: string | null;
}

export function WordProblemQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: WordProblemQuestionProps) {
  const [answer, setAnswer] = useState<string>(selectedAnswer || '');
  const correctAnswer = question.correctAnswer || question.unit ? '' : '';

  useEffect(() => {
    if (selectedAnswer) {
      setAnswer(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleInput = (value: string) => {
    setAnswer(value);
    
    // Automatisch absenden wenn ausgefüllt
    if (value.trim() !== '') {
      onAnswer(value);
    }
  };

  const isCorrect = answer.trim() === String(correctAnswer);

  return (
    <div className="space-y-4">
      {/* Aufgaben-Text */}
      <div className="text-lg leading-relaxed p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        {question.question}
      </div>
      
      {/* Eingabe */}
      <div className="flex gap-3 items-center">
        <input
          type="number"
          value={answer}
          onChange={(e) => handleInput(e.target.value)}
          disabled={showResult}
          placeholder="Antwort eingeben..."
          className={`
            flex-1 p-4 text-2xl rounded-lg border-2 transition-all duration-300 text-center font-semibold
            ${showResult
              ? isCorrect
                ? 'bg-green-500 text-white border-green-600'
                : 'bg-red-500 text-white border-red-600'
              : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
            }
          `}
          autoFocus
        />
        {question.unit && (
          <span className="text-xl font-semibold text-gray-700 whitespace-nowrap">
            {question.unit}
          </span>
        )}
      </div>
      
      {/* Optional: Rechnung anzeigen */}
      {question.calculation && (
        <div className="text-sm text-gray-600 italic">
          Rechnung: {question.calculation}
        </div>
      )}
      
      {/* Sofort-Feedback */}
      {answer && !showResult && (
        <div className={`p-3 rounded-lg border-2 ${
          isCorrect
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          {isCorrect ? (
            <span className="font-semibold">✓ Richtig!</span>
          ) : (
            <span className="font-semibold">⚠️ Bitte überprüfe deine Antwort</span>
          )}
        </div>
      )}
      
      {/* Ergebnis */}
      {showResult && (
        <div className={`p-4 rounded-lg border-2 ${
          isCorrect
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className={`text-lg font-bold mb-2 ${
            isCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect ? '✓ Richtig!' : '✗ Falsch'}
          </div>
          {!isCorrect && (
            <div className="mb-2 text-gray-700">
              Deine Antwort: <strong>{answer}</strong><br />
              Richtige Antwort: <strong>{correctAnswer} {question.unit}</strong>
            </div>
          )}
          {question.explanation && (
            <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-lg border-l-4 border-primary-400">
              <div className="text-sm font-semibold text-gray-700 mb-1">
                💡 Erklärung:
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

