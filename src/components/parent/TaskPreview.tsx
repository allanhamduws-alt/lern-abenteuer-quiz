/**
 * TaskPreview Komponente
 * Zeigt Aufgaben genau so wie Kinder sie sehen würden - für Eltern zur Validierung
 */

import { useState } from 'react';
import { InputQuestion } from '../quiz/InputQuestion';
import { DragDropQuestion } from '../quiz/DragDropQuestion';
import { FillBlankQuestion } from '../quiz/FillBlankQuestion';
import { WordClassificationQuestion } from '../quiz/WordClassificationQuestion';
import { NumberInputQuestion } from '../quiz/NumberInputQuestion';
import { NumberPyramidQuestion } from '../quiz/NumberPyramidQuestion';
import { WordProblemQuestion } from '../quiz/WordProblemQuestion';
import { TextInputQuestion } from '../quiz/TextInputQuestion';
import { SentenceBuilderQuestion } from '../quiz/SentenceBuilderQuestion';
import { TableFillQuestion } from '../quiz/TableFillQuestion';
import type { Question } from '../../types';

interface TaskPreviewProps {
  task: any; // Task-Daten aus UploadReview
  grade: number;
  subject: string;
}

export function TaskPreview({ task, grade, subject }: TaskPreviewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // Validiere und normalisiere Typ
  const validTypes = ['word-classification', 'fill-blank', 'number-input', 
                      'multiple-choice', 'word-problem', 'number-pyramid',
                      'text-input', 'sentence-builder', 'table-fill'];
  
  let normalizedType = task.type || 'multiple-choice';
  let showTypeWarning = false;
  
  if (!validTypes.includes(normalizedType)) {
    console.warn(`⚠️ TaskPreview: Unbekannter Typ "${normalizedType}" → zeige als multiple-choice`);
    showTypeWarning = true;
    normalizedType = 'multiple-choice';
  }

  // Konvertiere Task zu Question-Format
  const convertTaskToQuestion = (task: any): Question => {
    const baseQuestion: Question = {
      id: 'preview',
      class: grade as 1 | 2 | 3 | 4,
      subject: subject as 'mathematik' | 'deutsch' | 'naturwissenschaften' | 'kunst' | 'logik',
      type: normalizedType as any,
      question: task.stem || task.question || '',
      options: task.options || [],
      correctAnswer: task.answers || 0,
      points: 10,
      difficulty: task.difficulty || 'mittel',
      explanation: task.explanation || '',
    };

    // Füge typ-spezifische Felder hinzu
    if (normalizedType === 'fill-blank') {
      baseQuestion.blanks = task.blanks || [];
      baseQuestion.blankOptions = task.blankOptions || [];
      baseQuestion.caseSensitive = task.caseSensitive || false;
      // Für fill-blank: correctAnswer sollte ein Array sein
      baseQuestion.correctAnswer = task.blanks || [];
    } else if (normalizedType === 'word-classification') {
      baseQuestion.words = task.words || [];
      baseQuestion.categories = task.categories || [];
      baseQuestion.correctMapping = task.correctMapping || {};
      // Für word-classification: correctAnswer sollte ein Record sein
      baseQuestion.correctAnswer = task.correctMapping || {};
    } else if (normalizedType === 'number-input') {
      baseQuestion.problems = task.problems || [];
      baseQuestion.operation = task.operation;
      baseQuestion.numberRange = task.numberRange;
      // Für number-input: correctAnswer sollte ein Array sein
      baseQuestion.correctAnswer = task.problems?.map((p: any) => p.answer || '') || [];
    } else if (normalizedType === 'number-pyramid') {
      baseQuestion.levels = task.levels;
      baseQuestion.structure = task.structure;
      // Für number-pyramid: correctAnswer sollte ein Record sein
      baseQuestion.correctAnswer = task.structure || {};
    } else if (normalizedType === 'word-problem') {
      baseQuestion.context = task.context;
      baseQuestion.calculation = task.calculation;
      baseQuestion.unit = task.unit;
      baseQuestion.correctAnswer = task.correctAnswer || '';
    } else if (normalizedType === 'text-input') {
      baseQuestion.expectedAnswer = task.expectedAnswer || task.answers || '';
      baseQuestion.placeholder = task.placeholder;
      baseQuestion.maxLength = task.maxLength;
      baseQuestion.correctAnswer = task.expectedAnswer || task.answers || '';
    } else if (normalizedType === 'sentence-builder') {
      baseQuestion.sentenceParts = task.sentenceParts || [];
      baseQuestion.correctOrder = task.correctOrder || [];
      baseQuestion.correctAnswer = task.correctOrder || [];
    } else if (normalizedType === 'table-fill') {
      baseQuestion.tableHeaders = task.tableHeaders || [];
      baseQuestion.tableRows = task.tableRows || [];
      baseQuestion.correctValues = task.correctValues || {};
      baseQuestion.correctAnswer = task.correctValues || {};
    }

    return baseQuestion;
  };

  const question = convertTaskToQuestion(task);

  const handleAnswer = (answer: any) => {
    setSelectedAnswer(answer);
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  // Prüfe ob Antwort korrekt ist
  const isCorrect = () => {
    if (!selectedAnswer) return false;

    if (question.type === 'fill-blank' || question.type === 'number-input') {
      const correct = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
      const user = Array.isArray(selectedAnswer) ? selectedAnswer : [selectedAnswer];
      return JSON.stringify(correct) === JSON.stringify(user);
    } else if (question.type === 'word-classification' || question.type === 'number-pyramid') {
      return JSON.stringify(question.correctAnswer) === JSON.stringify(selectedAnswer);
    } else if (question.type === 'multiple-choice') {
      return selectedAnswer === question.correctAnswer;
    } else {
      return String(selectedAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border-2 border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Vorschau: So sieht das Kind die Aufgabe</h3>
        {showResult && (
          <button
            onClick={handleReset}
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
          >
            ↻ Erneut testen
          </button>
        )}
      </div>
      
      {/* Warnung bei unbekanntem Typ */}
      {showTypeWarning && (
        <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
          <div className="text-sm font-semibold text-yellow-800">
            ⚠️ Typ "{task.type}" nicht unterstützt
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            Zeige Aufgabe als Multiple-Choice. Bitte prüfe die Aufgabengenerierung.
          </div>
        </div>
      )}

      {/* Frage */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          {question.question}
        </h2>
      </div>

      {/* Rendere verschiedene Fragetypen */}
      {question.type === 'fill-blank' ? (
        <FillBlankQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : question.type === 'word-classification' ? (
        <WordClassificationQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : question.type === 'number-input' ? (
        <NumberInputQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : question.type === 'number-pyramid' ? (
        <NumberPyramidQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : question.type === 'word-problem' ? (
        <WordProblemQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
        />
      ) : question.type === 'input' ? (
        <InputQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
        />
      ) : question.type === 'drag-drop' ? (
        <DragDropQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : question.type === 'text-input' ? (
        <TextInputQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={typeof selectedAnswer === 'string' ? selectedAnswer : null}
        />
      ) : question.type === 'sentence-builder' ? (
        <SentenceBuilderQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : question.type === 'table-fill' ? (
        <TableFillQuestion
          question={question}
          onAnswer={handleAnswer}
          showResult={showResult}
          selectedAnswer={selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer) ? selectedAnswer : null}
        />
      ) : (
        /* Multiple-Choice (Standard) */
        <div className="space-y-3">
          {(question.options || []).map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrectAnswer = index === question.correctAnswer;
            const isWrong = isSelected && !isCorrectAnswer;
            
            let buttonClasses = 'w-full p-5 rounded-xl text-left transition-all duration-300 transform font-semibold text-lg ';
            
            if (showResult) {
              if (isCorrectAnswer) {
                buttonClasses += 'bg-green-500 text-white shadow-lg border-2 border-green-700 scale-105 font-bold';
              } else if (isWrong) {
                buttonClasses += 'bg-red-500 text-white shadow-lg border-2 border-red-700 font-bold';
              } else {
                buttonClasses += 'bg-gray-200 text-gray-500 opacity-60';
              }
            } else {
              buttonClasses += 'bg-gradient-card text-gray-800 hover:bg-white hover:shadow-large hover:scale-[1.02] border-2 border-gray-200 cursor-pointer';
            }
            
            return (
              <button
                key={index}
                onClick={() => !showResult && handleAnswer(index)}
                disabled={showResult}
                className={buttonClasses}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* Ergebnis-Anzeige */}
      {showResult && (
        <div className={`mt-4 p-4 rounded-lg border-2 ${
          isCorrect()
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className={`text-lg font-bold mb-2 ${
            isCorrect() ? 'text-green-800' : 'text-red-800'
          }`}>
            {isCorrect() ? '✓ Richtig!' : '✗ Falsch'}
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

