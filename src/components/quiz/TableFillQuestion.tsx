/**
 * TableFillQuestion Komponente
 * Tabellen ausfüllen (z.B. Verb-Konjugation, Wortarten-Tabellen)
 */

import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface TableFillQuestionProps {
  question: Question;
  onAnswer: (answer: Record<string, string>) => void;
  showResult: boolean;
  selectedAnswer: Record<string, string> | null;
}

export function TableFillQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: TableFillQuestionProps) {
  const tableHeaders = question.tableHeaders || [];
  const tableRows = question.tableRows || [];
  const correctValues = question.correctValues || {};
  
  const [cellValues, setCellValues] = useState<Record<string, string>>(
    selectedAnswer || {}
  );

  useEffect(() => {
    if (selectedAnswer !== null) {
      setCellValues(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (showResult) return;
    
    const key = `${rowIndex}-${colIndex}`;
    const newValues = { ...cellValues, [key]: value };
    setCellValues(newValues);
    onAnswer(newValues);
  };

  const getCellKey = (rowIndex: number, colIndex: number) => {
    return `${rowIndex}-${colIndex}`;
  };

  const isCellCorrect = (rowIndex: number, colIndex: number) => {
    if (!showResult) return null;
    const key = getCellKey(rowIndex, colIndex);
    const userValue = cellValues[key] || '';
    const correctValue = correctValues[key] || '';
    return userValue.toLowerCase().trim() === correctValue.toLowerCase().trim();
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border-2 border-gray-300 bg-white">
          {/* Header */}
          <thead>
            <tr>
              <th className="border-2 border-gray-300 bg-gray-100 p-3 text-left font-semibold text-gray-700">
                {/* Erste Spalte leer für Zeilenbeschriftungen */}
              </th>
              {tableHeaders.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="border-2 border-gray-300 bg-gray-100 p-3 text-center font-semibold text-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Zeilenbeschriftung */}
                <td className="border-2 border-gray-300 bg-gray-50 p-3 font-semibold text-gray-700">
                  {row.label}
                </td>
                
                {/* Zellen */}
                {row.cells.map((cell, colIndex) => {
                  const key = getCellKey(rowIndex, colIndex);
                  const value = cellValues[key] || cell.value || '';
                  const isCorrect = isCellCorrect(rowIndex, colIndex);
                  
                  return (
                    <td
                      key={colIndex}
                      className={`border-2 border-gray-300 p-2 ${
                        showResult
                          ? isCorrect === true
                            ? 'bg-green-100'
                            : isCorrect === false
                            ? 'bg-red-100'
                            : 'bg-gray-50'
                          : 'bg-white'
                      }`}
                    >
                      {cell.editable ? (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          disabled={showResult}
                          className={`w-full p-2 text-center border-2 rounded transition-all duration-200 ${
                            showResult
                              ? isCorrect === true
                                ? 'bg-green-200 border-green-400 text-green-900 font-semibold'
                                : isCorrect === false
                                ? 'bg-red-200 border-red-400 text-red-900 font-semibold'
                                : 'bg-gray-100 border-gray-300 text-gray-600'
                              : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          }`}
                          placeholder="..."
                        />
                      ) : (
                        <div className="p-2 text-center text-gray-600 font-semibold">
                          {cell.value || '-'}
                        </div>
                      )}
                      {showResult && isCorrect === false && correctValues[key] && (
                        <div className="text-xs text-red-600 mt-1">
                          ✓ {correctValues[key]}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ergebnis-Zusammenfassung */}
      {showResult && (
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">💡 Tipp:</span> Grüne Felder sind richtig, 
            rote Felder zeigen die richtige Antwort an.
          </div>
          {question.explanation && (
            <div className="mt-2 pt-2 border-t border-blue-300 text-sm text-gray-700">
              <span className="font-semibold">Erklärung:</span> {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

