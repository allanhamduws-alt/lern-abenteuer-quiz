/**
 * NumberPyramidQuestion Komponente
 * Für Zahlenmauern mit CSS Grid Layout
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface NumberPyramidQuestionProps {
  question: Question;
  onAnswer: (answer: Record<string, string>) => void;
  showResult: boolean;
  selectedAnswer: Record<string, string> | null;
}

export function NumberPyramidQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: NumberPyramidQuestionProps) {
  const structure = question.structure || [];
  const levels = question.levels || structure.length || 3;
  
  const [values, setValues] = useState<Record<string, string>>(
    selectedAnswer || {}
  );

  useEffect(() => {
    if (selectedAnswer) {
      setValues(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleInput = (row: number, col: number, value: string) => {
    const key = `${row}-${col}`;
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    
    // Automatisch absenden wenn alle Felder ausgefüllt
    const allFilled = structure.every((rowData, r) => 
      rowData.every((cell, c) => {
        if (cell.isBlank) {
          return newValues[`${r}-${c}`] !== undefined && newValues[`${r}-${c}`] !== '';
        }
        return true;
      })
    );
    
    if (allFilled) {
      onAnswer(newValues);
    }
  };

  const getCellValue = (row: number, col: number): string => {
    const cell = structure[row]?.[col];
    if (!cell) return '';
    if (!cell.isBlank) return String(cell.value || '');
    return values[`${row}-${col}`] || '';
  };

  const isCellCorrect = (row: number, col: number): boolean | null => {
    if (!showResult) return null;
    const cell = structure[row]?.[col];
    if (!cell || !cell.isBlank) return null;
    
    const answer = values[`${row}-${col}`];
    if (!answer) return false;
    
    // Berechne erwarteten Wert (Summe der beiden darunter)
    if (row < structure.length - 1) {
      const leftBelow = structure[row + 1]?.[col];
      const rightBelow = structure[row + 1]?.[col + 1];
      
      if (leftBelow && rightBelow) {
        const leftVal = leftBelow.isBlank ? Number(values[`${row + 1}-${col}`]) : leftBelow.value;
        const rightVal = rightBelow.isBlank ? Number(values[`${row + 1}-${col + 1}`]) : rightBelow.value;
        
        if (leftVal !== null && rightVal !== null) {
          const expected = leftVal + rightVal;
          return Number(answer) === expected;
        }
      }
    }
    
    return null;
  };

  const allCorrect = structure.every((rowData, row) =>
    rowData.every((cell, col) => {
      if (!cell.isBlank) return true;
      const correct = isCellCorrect(row, col);
      return correct === true;
    })
  );

  // CSS Grid für Pyramide
  const getGridColumnSpan = (row: number, totalRows: number): string => {
    const rowFromBottom = totalRows - row - 1;
    const startCol = rowFromBottom;
    const span = rowFromBottom * 2 + 1;
    return `${startCol + 1} / ${startCol + span + 1}`;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Fülle die Zahlenmauer aus:</h3>
      
      <div className="flex justify-center">
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${levels * 2 - 1}, minmax(60px, 1fr))`,
          }}
        >
          {structure.map((rowData, row) => (
            <div
              key={row}
              className="flex justify-center gap-2"
              style={{
                gridColumn: getGridColumnSpan(row, levels),
              }}
            >
              {rowData.map((cell, col) => {
                const value = getCellValue(row, col);
                const isBlank = cell.isBlank;
                const correct = isCellCorrect(row, col);
                
                return (
                  <div key={col} className="flex items-center justify-center">
                    {isBlank ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleInput(row, col, e.target.value)}
                        disabled={showResult}
                        className={`
                          w-16 h-16 text-center text-xl font-bold rounded-lg border-2 transition-all duration-300
                          ${showResult
                            ? correct === true
                              ? 'bg-green-500 text-white border-green-600'
                              : correct === false
                              ? 'bg-red-500 text-white border-red-600'
                              : 'bg-gray-200 border-gray-400'
                            : 'bg-white border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
                          }
                        `}
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center text-xl font-bold bg-gray-100 border-2 border-gray-300 rounded-lg">
                        {cell.value}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Regel-Hinweis */}
      <div className="text-sm text-gray-600 italic text-center">
        Regel: Jedes Feld = Summe der beiden Felder darunter
      </div>
      
      {/* Sofort-Feedback */}
      {Object.keys(values).length > 0 && !showResult && (
        <div className={`p-3 rounded-lg border-2 ${
          allCorrect
            ? 'bg-green-50 border-green-300 text-green-800'
            : 'bg-yellow-50 border-yellow-300 text-yellow-800'
        }`}>
          {allCorrect ? (
            <span className="font-semibold">✓ Zahlenmauer richtig ausgefüllt!</span>
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

