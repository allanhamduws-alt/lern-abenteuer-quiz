/**
 * DragDropQuestion Komponente
 * Für Fragen mit Drag & Drop (z.B. Zahlen sortieren, Wörter zusammenfügen)
 */

import { useState } from 'react';
import type { Question } from '../../types';

interface DragDropQuestionProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
  showResult: boolean;
  selectedAnswer: string[] | null;
}

export function DragDropQuestion({ question, onAnswer, showResult, selectedAnswer }: DragDropQuestionProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTargets, setDropTargets] = useState<string[]>(
    selectedAnswer || Array(question.dropTargets?.length || 0).fill('')
  );

  const dragItems = question.dragItems || [];
  const targetLabels = question.dropTargets || [];

  const handleDragStart = (item: string) => {
    if (!showResult) {
      setDraggedItem(item);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (!showResult && draggedItem) {
      const newTargets = [...dropTargets];
      newTargets[index] = draggedItem;
      setDropTargets(newTargets);
      setDraggedItem(null);
      onAnswer(newTargets);
    }
  };

  const handleRemove = (index: number) => {
    if (!showResult) {
      const newTargets = [...dropTargets];
      newTargets[index] = '';
      setDropTargets(newTargets);
      onAnswer(newTargets);
    }
  };

  // Für Drag & Drop sollte correctAnswer ein Array sein
  const correctAnswerArray = Array.isArray(question.correctAnswer) 
    ? question.correctAnswer 
    : typeof question.correctAnswer === 'string'
    ? question.correctAnswer.split(',')
    : [];
  
  const isCorrect = selectedAnswer !== null && 
    JSON.stringify(selectedAnswer) === JSON.stringify(correctAnswerArray);

  return (
    <div className="space-y-6">
      {/* Drag Items */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Ziehe die Antworten hierher:</h3>
        <div className="flex flex-wrap gap-3">
          {dragItems.map((item, index) => {
            const isUsed = dropTargets.includes(item);
            return (
              <div
                key={index}
                draggable={!showResult && !isUsed}
                onDragStart={() => handleDragStart(item)}
                className={`p-4 rounded-lg cursor-move transition-all duration-300 ${
                  isUsed && !showResult
                    ? 'bg-gray-300 text-gray-500 opacity-60 cursor-not-allowed'
                    : showResult
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-primary-100 text-primary-800 hover:bg-primary-200 shadow-md hover:shadow-lg border border-primary-300'
                }`}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drop Targets */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Lege die Antworten hier ab:</h3>
        <div className="grid grid-cols-2 gap-4">
          {targetLabels.map((label, index) => (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className={`min-h-[80px] p-4 rounded-lg border-2 border-dashed transition-all duration-300 ${
                showResult
                  ? dropTargets[index] === correctAnswerArray[index]
                    ? 'bg-success-100 border-success-400'
                    : 'bg-error-100 border-error-400'
                  : draggedItem
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="text-sm font-semibold text-gray-600 mb-2">{label}</div>
              {dropTargets[index] && (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{dropTargets[index]}</span>
                  {!showResult && (
                    <button
                      onClick={() => handleRemove(index)}
                      className="text-error-500 hover:text-error-700 text-xl"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Erfolgs-Box nur bei falschen Antworten (für Erklärung) */}
      {showResult && selectedAnswer !== null && !isCorrect && (
        <div className="mt-4 p-4 rounded-lg bg-error-50 text-error-800 border-2 border-error-300">
          <div className="text-lg font-bold mb-2">💪 Fast richtig!</div>
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

