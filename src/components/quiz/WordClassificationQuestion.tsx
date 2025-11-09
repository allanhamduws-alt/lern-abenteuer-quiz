/**
 * WordClassificationQuestion Komponente
 * Für Wortarten-Zuordnung mit Drag & Drop (dnd-kit) oder Touch-Buttons
 */

import { useState, useEffect } from 'react';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Question } from '../../types';

interface WordClassificationQuestionProps {
  question: Question;
  onAnswer: (answer: Record<string, string>) => void;
  showResult: boolean;
  selectedAnswer: Record<string, string> | null;
}

function SortableWord({ word, category, onDrop, isCorrect }: { 
  word: string; 
  category: string | null;
  onDrop: (word: string, category: string) => void;
  isCorrect: boolean | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: word });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        px-4 py-3 rounded-lg font-semibold cursor-move touch-none
        ${isCorrect === true ? 'bg-green-100 border-2 border-green-400' : 
          isCorrect === false ? 'bg-red-100 border-2 border-red-400' :
          'bg-white border-2 border-gray-300 hover:border-primary-400'}
        shadow-md hover:shadow-lg transition-all duration-200
      `}
    >
      {word}
    </div>
  );
}

export function WordClassificationQuestion({ 
  question, 
  onAnswer, 
  showResult, 
  selectedAnswer 
}: WordClassificationQuestionProps) {
  const words = question.words || [];
  const categories = question.categories || [];
  const correctMapping = question.correctMapping || {};
  
  const [mapping, setMapping] = useState<Record<string, string>>(
    selectedAnswer || {}
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  // Button-Modus als Standard (besser bedienbar auf Desktop)
  const [touchMode, setTouchMode] = useState(true);

  useEffect(() => {
    if (selectedAnswer) {
      setMapping(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const word = active.id as string;
      const category = over.id as string;
      
      if (categories.includes(category)) {
        const newMapping = { ...mapping, [word]: category };
        setMapping(newMapping);
        onAnswer(newMapping);
      }
    }
  };

  const handleTouchSelect = (word: string, category: string) => {
    if (showResult) return;
    
    const newMapping = { ...mapping, [word]: category };
    setMapping(newMapping);
    onAnswer(newMapping);
  };

  const isComplete = words.every(word => mapping[word]);

  // Prüfe Korrektheit
  const getWordCorrectness = (word: string): boolean | null => {
    if (!showResult || !mapping[word]) return null;
    return mapping[word] === correctMapping[word];
  };

  const allCorrect = words.every(word => mapping[word] === correctMapping[word]);

  if (touchMode) {
    // Button-Modus für Touch
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ordne die Wörter zu:</h3>
          <button
            onClick={() => setTouchMode(false)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Drag & Drop Modus
          </button>
        </div>
        
        <div className="space-y-4">
          {words.map((word) => {
            const currentCategory = mapping[word];
            const isCorrect = getWordCorrectness(word);
            
            return (
              <div key={word} className="space-y-2">
                <div className="font-semibold text-gray-700">{word}</div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const isSelected = currentCategory === category;
                    const shouldBeCorrect = correctMapping[word] === category;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => handleTouchSelect(word, category)}
                        disabled={showResult}
                        className={`
                          px-4 py-2 rounded-lg font-semibold transition-all duration-200
                          ${showResult
                            ? isSelected
                              ? isCorrect
                                ? 'bg-green-500 text-white border-2 border-green-600'
                                : 'bg-red-500 text-white border-2 border-red-600'
                              : shouldBeCorrect
                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                            : isSelected
                              ? 'bg-primary-500 text-white border-2 border-primary-600'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Sofort-Feedback */}
        {isComplete && !showResult && (
          <div className={`p-3 rounded-lg border-2 ${
            allCorrect 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            {allCorrect ? (
              <span className="font-semibold">✓ Alle Wörter richtig zugeordnet!</span>
            ) : (
              <span className="font-semibold">⚠️ Bitte überprüfe deine Zuordnungen</span>
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

  // Drag & Drop Modus
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ordne die Wörter zu:</h3>
          <button
            onClick={() => setTouchMode(true)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Button-Modus
          </button>
        </div>
        
        {/* Wörter */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Wörter:</h4>
          <SortableContext items={words}>
            <div className="flex flex-wrap gap-3">
              {words.map((word) => {
                const category = mapping[word];
                const isCorrect = getWordCorrectness(word);
                
                return (
                  <SortableWord
                    key={word}
                    word={word}
                    category={category}
                    onDrop={(w, c) => handleTouchSelect(w, c)}
                    isCorrect={isCorrect}
                  />
                );
              })}
            </div>
          </SortableContext>
        </div>
        
        {/* Kategorien */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Kategorien:</h4>
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <div
                key={category}
                id={category}
                className="min-w-[150px] min-h-[80px] p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center font-semibold text-gray-700"
              >
                {category}
              </div>
            ))}
          </div>
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="px-4 py-3 rounded-lg font-semibold bg-primary-500 text-white shadow-lg">
              {activeId}
            </div>
          ) : null}
        </DragOverlay>
        
        {/* Sofort-Feedback */}
        {isComplete && !showResult && (
          <div className={`p-3 rounded-lg border-2 ${
            allCorrect 
              ? 'bg-green-50 border-green-300 text-green-800' 
              : 'bg-yellow-50 border-yellow-300 text-yellow-800'
          }`}>
            {allCorrect ? (
              <span className="font-semibold">✓ Alle Wörter richtig zugeordnet!</span>
            ) : (
              <span className="font-semibold">⚠️ Bitte überprüfe deine Zuordnungen</span>
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
    </DndContext>
  );
}

