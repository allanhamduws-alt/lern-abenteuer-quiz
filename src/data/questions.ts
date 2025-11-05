/**
 * Beispiel-Quiz-Fragen
 * Diese Datei können Sie später erweitern mit eigenen Fragen
 */

import type { Question } from '../types';

// Beispiel-Fragen für Klasse 1, Mathematik
export const questions: Question[] = [
  // Mathematik - Klasse 1
  {
    id: 'math-1-1',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 2 + 3?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: 'math-1-2',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 5 + 2?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: 'math-1-3',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 3 + 4?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: 'math-1-4',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 6 - 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: 'math-1-5',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 8 - 3?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    points: 10,
  },
  // Deutsch - Klasse 1
  {
    id: 'deutsch-1-1',
    class: 1,
    subject: 'deutsch',
    question: 'Welcher Buchstabe fehlt? Apf_l',
    options: ['e', 'a', 'i', 'o'],
    correctAnswer: 0,
    points: 10,
  },
  {
    id: 'deutsch-1-2',
    class: 1,
    subject: 'deutsch',
    question: 'Welches Wort beginnt mit "B"?',
    options: ['Apfel', 'Banane', 'Kirsche', 'Orange'],
    correctAnswer: 1,
    points: 10,
  },
  {
    id: 'deutsch-1-3',
    class: 1,
    subject: 'deutsch',
    question: 'Wie viele Silben hat das Wort "Haus"?',
    options: ['1', '2', '3', '4'],
    correctAnswer: 0,
    points: 10,
  },
  // Beispiel-Fragen für Klasse 2
  {
    id: 'math-2-1',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 10 + 15?',
    options: ['24', '25', '26', '27'],
    correctAnswer: 1,
    points: 15,
  },
  {
    id: 'math-2-2',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 2 × 5?',
    options: ['8', '10', '12', '14'],
    correctAnswer: 1,
    points: 15,
  },
];

/**
 * Fragen nach Klasse filtern
 */
export function getQuestionsByClass(
  classLevel: 1 | 2 | 3 | 4
): Question[] {
  return questions.filter((q) => q.class === classLevel);
}

/**
 * Fragen nach Klasse und Fach filtern
 */
export function getQuestionsByClassAndSubject(
  classLevel: 1 | 2 | 3 | 4,
  subject: Question['subject']
): Question[] {
  return questions.filter(
    (q) => q.class === classLevel && q.subject === subject
  );
}

/**
 * Zufällige Fragen auswählen
 */
export function getRandomQuestions(
  classLevel: 1 | 2 | 3 | 4,
  subject: Question['subject'],
  count: number = 5
): Question[] {
  const availableQuestions = getQuestionsByClassAndSubject(classLevel, subject);
  const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, availableQuestions.length));
}

