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
    explanation: 'Bei 2 + 3 kannst du zählen: Starte bei 2 und zähle 3 weiter: 2... 3, 4, 5! Das Ergebnis ist 5.',
  },
  {
    id: 'math-1-2',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 5 + 2?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 1,
    points: 10,
    explanation: 'Bei 5 + 2 startest du bei 5 und zählst 2 weiter: 5... 6, 7! Das Ergebnis ist 7.',
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
    explanation: 'Bei 6 - 2 nimmst du von 6 etwas weg. Zähle rückwärts: 6... 5, 4! Du hast 2 weggenommen, also bleibt 4 übrig.',
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
    explanation: 'Das Wort ist "Apfel"! Sprich es langsam: Ap-fel. Der fehlende Buchstabe ist "e".',
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
    explanation: '2 × 5 bedeutet: 2 mal die Zahl 5. Das ist 5 + 5 = 10. Oder du denkst: 2 Fünfer sind 10!',
  },
  // Mathematik - Klasse 3
  {
    id: 'math-3-1',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 3 × 4?',
    options: ['10', '12', '14', '16'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-2',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 5 × 6?',
    options: ['28', '30', '32', '34'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-3',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 24 ÷ 4?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    points: 20,
    explanation: '24 ÷ 4 bedeutet: Wie oft passt 4 in 24? Du kannst rechnen: 4 + 4 + 4 + 4 + 4 + 4 = 24. Das sind 6 mal die 4, also ist das Ergebnis 6!',
  },
  {
    id: 'math-3-4',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 7 × 3?',
    options: ['19', '21', '23', '25'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-5',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 50 + 25?',
    options: ['70', '75', '80', '85'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-6',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 45 - 18?',
    options: ['25', '27', '29', '31'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-7',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 8 × 4?',
    options: ['30', '32', '34', '36'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-8',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 36 ÷ 6?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-9',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 9 × 2?',
    options: ['16', '18', '20', '22'],
    correctAnswer: 1,
    points: 20,
  },
  {
    id: 'math-3-10',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 100 - 35?',
    options: ['63', '65', '67', '69'],
    correctAnswer: 1,
    points: 20,
  },
  // Mathematik - Klasse 4
  {
    id: 'math-4-1',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 12 × 5?',
    options: ['55', '60', '65', '70'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-2',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 48 ÷ 6?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    points: 25,
  },
  {
    id: 'math-4-3',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 7 × 8?',
    options: ['54', '56', '58', '60'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-4',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 125 + 75?',
    options: ['195', '200', '205', '210'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-5',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 200 - 68?',
    options: ['130', '132', '134', '136'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-6',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 9 × 6?',
    options: ['52', '54', '56', '58'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-7',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 64 ÷ 8?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    points: 25,
  },
  {
    id: 'math-4-8',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 11 × 4?',
    options: ['42', '44', '46', '48'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-9',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 150 + 250?',
    options: ['390', '400', '410', '420'],
    correctAnswer: 1,
    points: 25,
  },
  {
    id: 'math-4-10',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 81 ÷ 9?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 2,
    points: 25,
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

