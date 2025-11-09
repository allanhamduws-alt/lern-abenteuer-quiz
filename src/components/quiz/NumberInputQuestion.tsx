/**
 * NumberInputQuestion Komponente (erweitert)
 * Für Rechenaufgaben mit mehreren Problemen und sofortigem Feedback
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface NumberInputQuestionProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  showResult: boolean;
  selectedAnswer: string[] | null;
}

export function NumberInputQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: NumberInputQuestionProps) {
  // Unterstützt sowohl alte Format (single answer) als auch neue (problems array)
  const problems = question.problems || [];
  const isLegacyFormat = !problems.length && question.correctAnswer;
  
  const [answers, setAnswers] = useState<string[]>(
    selectedAnswer || (isLegacyFormat ? [''] : new Array(problems.length).fill(''))
  );

  useEffect(() => {
    if (selectedAnswer) {
      setAnswers(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleInput = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    
    // Automatisch absenden wenn alle ausgefüllt
    if (newAnswers.every(a => a.trim() !== '')) {
      onAnswer(newAnswers);
    }
  };

  const getCorrectAnswer = (index: number): string => {
    if (isLegacyFormat) {
      return String(question.correctAnswer);
    }
    return problems[index]?.answer || '';
  };

  const isCorrect = (index: number): boolean => {
    const answer = answers[index]?.trim() || '';
    const correct = getCorrectAnswer(index);
    return answer === correct;
  };

  const allCorrect = answers.every((answer, index) => {
    if (!answer.trim()) return false;
    return isCorrect(index);
  });

  // Legacy Format (eine Aufgabe)
  if (isLegacyFormat) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <input
            type="number"
            value={answers[0] || ''}
            onChange={(e) => handleInput(0, e.target.value)}
            disabled={showResult}
            placeholder="Antwort eingeben..."
            className={`flex-1 p-4 text-2xl rounded-lg border-2 transition-all duration-300 ${
              showResult
                ? isCorrect(0)
                  ? 'bg-green-500 text-white border-green-600'
                  : 'bg-red-500 text-white border-red-600'
                : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
            }`}
            autoFocus
          />
        </div>
        
        {/* Sofort-Feedback */}
        {answers[0] && !showResult && (
          <div className={`p-3 rounded-lg border-2 ${
            isCorrect(0)
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            {isCorrect(0) ? (
              <span className="font-semibold">✓ Richtig!</span>
            ) : (
              <span className="font-semibold">⚠️ Bitte überprüfe deine Antwort</span>
            )}
          </div>
        )}
        
        {/* Ergebnis */}
        {showResult && (
          <div className={`p-4 rounded-lg border-2 ${
            isCorrect(0)
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
          }`}>
            <div className={`text-lg font-bold mb-2 ${
              isCorrect(0) ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCorrect(0) ? '✓ Richtig!' : '✗ Falsch'}
            </div>
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

  // Neues Format (mehrere Probleme)
  return (
    <div className="space-y-4">
      {problems.map((problem, index) => {
        const answer = answers[index] || '';
        const correct = isCorrect(index);
        
        return (
          <div key={index} className="space-y-2">
            <div className="flex gap-3 items-center">
              <span className="text-lg font-semibold text-gray-700 whitespace-nowrap">
                {problem.question}
              </span>
              <input
                type="number"
                value={answer}
                onChange={(e) => handleInput(index, e.target.value)}
                disabled={showResult}
                placeholder="?"
                className={`
                  w-24 p-3 text-xl rounded-lg border-2 transition-all duration-300 text-center font-semibold
                  ${showResult
                    ? correct
                      ? 'bg-green-500 text-white border-green-600'
                      : 'bg-red-500 text-white border-red-600'
                    : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                  }
                `}
              />
            </div>
            
            {/* Sofort-Feedback pro Problem */}
            {answer && !showResult && (
              <div className={`text-sm px-2 ${
                correct ? 'text-green-600 font-semibold' : 'text-yellow-600'
              }`}>
                {correct ? '✓' : '⚠️'}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Gesamt-Feedback */}
      {answers.every(a => a.trim() !== '') && !showResult && (
        <div className={`p-3 rounded-lg border-2 ${
          allCorrect
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          {allCorrect ? (
            <span className="font-semibold">✓ Alle Aufgaben richtig gelöst!</span>
          ) : (
            <span className="font-semibold">⚠️ Bitte überprüfe deine Antworten</span>
          )}
        </div>
      )}
      
      {/* Ergebnis */}
      {showResult && (
        <div className={`p-4 rounded-lg border-2 ${
          allCorrect
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className={`text-lg font-bold mb-2 ${
            allCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {allCorrect ? '✓ Alle richtig!' : '✗ Nicht alle richtig'}
          </div>
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

