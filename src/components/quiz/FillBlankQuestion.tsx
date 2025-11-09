/**
 * FillBlankQuestion Komponente
 * Für Lückentexte mit Dropdown/Button-Auswahl
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface FillBlankQuestionProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  showResult: boolean;
  selectedAnswer: string[] | null;
}

export function FillBlankQuestion({ question, onAnswer, showResult, selectedAnswer }: FillBlankQuestionProps) {
  const blanks = question.blanks || [];
  const blankOptions = question.blankOptions || [];
  const [answers, setAnswers] = useState<string[]>(selectedAnswer || new Array(blanks.length).fill(''));

  useEffect(() => {
    if (selectedAnswer) {
      setAnswers(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleSelect = (blankIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[blankIndex] = value;
    setAnswers(newAnswers);
    
    // Sofort-Feedback (visuell)
    if (value) {
      const isCorrect = value === blanks[blankIndex];
      // Visuelles Feedback wird durch CSS-Klassen gegeben
    }
    
    // Automatisch absenden wenn alle Lücken gefüllt
    if (newAnswers.every(a => a !== '')) {
      onAnswer(newAnswers);
    }
  };

  // Prüfe ob alle Antworten korrekt sind
  const allCorrect = answers.every((answer, index) => {
    if (!answer) return false;
    const correct = question.caseSensitive 
      ? answer === blanks[index]
      : answer.toLowerCase() === blanks[index].toLowerCase();
    return correct;
  });

  // Parse stem und ersetze __ mit Dropdowns
  const renderStem = () => {
    if (!question.question) return null;
    
    const parts = question.question.split('__');
    const elements: JSX.Element[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      elements.push(
        <span key={`text-${i}`} className="whitespace-pre-wrap">
          {parts[i]}
        </span>
      );
      
      if (i < blanks.length) {
        const options = blankOptions[i] || [];
        const currentAnswer = answers[i] || '';
        const isCorrect = currentAnswer && (
          question.caseSensitive 
            ? currentAnswer === blanks[i]
            : currentAnswer.toLowerCase() === blanks[i].toLowerCase()
        );
        
        elements.push(
          <span key={`blank-${i}`} className="inline-block mx-1">
            {/* Mobile: Buttons, Desktop: Dropdown */}
            <div className="flex flex-wrap gap-1">
              {options.map((option) => {
                const isSelected = currentAnswer === option;
                const isOptionCorrect = option === blanks[i];
                
                return (
                  <button
                    key={option}
                    onClick={() => !showResult && handleSelect(i, option)}
                    disabled={showResult}
                    className={`
                      px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200
                      ${showResult
                        ? isSelected
                          ? isCorrect
                            ? 'bg-green-500 text-white border-2 border-green-600'
                            : 'bg-red-500 text-white border-2 border-red-600'
                          : isOptionCorrect
                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                            : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                        : isSelected
                          ? 'bg-primary-500 text-white border-2 border-primary-600'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </span>
        );
      }
    }
    
    return <div className="text-lg leading-relaxed">{elements}</div>;
  };

  return (
    <div className="space-y-4">
      {renderStem()}
      
      {/* Sofort-Feedback wenn alle ausgefüllt */}
      {answers.every(a => a !== '') && !showResult && (
        <div className={`p-3 rounded-lg border-2 ${
          allCorrect 
            ? 'bg-green-50 border-green-300 text-green-800' 
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          {allCorrect ? (
            <span className="font-semibold">✓ Alle Lücken richtig ausgefüllt!</span>
          ) : (
            <span className="font-semibold">⚠️ Bitte überprüfe deine Antworten</span>
          )}
        </div>
      )}
      
      {/* Ergebnis-Anzeige */}
      {showResult && selectedAnswer && (
        <div className={`p-4 rounded-lg border-2 ${
          allCorrect
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className={`text-lg font-bold mb-2 ${
            allCorrect ? 'text-green-800' : 'text-red-800'
          }`}>
            {allCorrect ? '✓ Richtig!' : '✗ Nicht alle richtig'}
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

