/**
 * Beispiel-Quiz-Fragen
 * Diese Datei können Sie später erweitern mit eigenen Fragen
 */

import type { Question } from '../types';

// Beispiel-Fragen für Klasse 1, Mathematik
export const questions: Question[] = [
  // Mathematik - Klasse 1 (ohne StoryText - Kinder können noch nicht lesen)
  {
    id: 'math-1-1',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 2 + 3?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    points: 10,
    difficulty: 'leicht',
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
    difficulty: 'leicht',
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
    difficulty: 'leicht',
  },
  {
    id: 'math-1-4',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 6 - 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
    points: 10,
    difficulty: 'mittel',
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
    difficulty: 'mittel',
  },
  {
    id: 'math-1-6',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 4 + 1?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 2,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'math-1-7',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 7 - 2?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'math-1-8',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 1 + 6?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 2,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'math-1-9',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 9 - 4?',
    options: ['4', '5', '6', '7'],
    correctAnswer: 1,
    points: 10,
    difficulty: 'mittel',
  },
  {
    id: 'math-1-10',
    class: 1,
    subject: 'mathematik',
    question: 'Wie viel ist 5 + 3?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    points: 10,
    difficulty: 'leicht',
  },
  // Deutsch - Klasse 1 (ohne StoryText)
  {
    id: 'deutsch-1-1',
    class: 1,
    subject: 'deutsch',
    question: 'Welcher Buchstabe fehlt? Apf_l',
    options: ['e', 'a', 'i', 'o'],
    correctAnswer: 0,
    points: 10,
    difficulty: 'leicht',
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
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-3',
    class: 1,
    subject: 'deutsch',
    question: 'Wie viele Silben hat das Wort "Haus"?',
    options: ['1', '2', '3', '4'],
    correctAnswer: 0,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-4',
    class: 1,
    subject: 'deutsch',
    question: 'Welches Wort beginnt mit "M"?',
    options: ['Apfel', 'Banane', 'Maus', 'Kirsche'],
    correctAnswer: 2,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-5',
    class: 1,
    subject: 'deutsch',
    question: 'Welcher Buchstabe fehlt? Hau_',
    options: ['s', 'r', 't', 'n'],
    correctAnswer: 0,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-6',
    class: 1,
    subject: 'deutsch',
    question: 'Wie viele Silben hat das Wort "Baum"?',
    options: ['1', '2', '3', '4'],
    correctAnswer: 0,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-7',
    class: 1,
    subject: 'deutsch',
    question: 'Welches Wort beginnt mit "K"?',
    options: ['Apfel', 'Banane', 'Katze', 'Maus'],
    correctAnswer: 2,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-8',
    class: 1,
    subject: 'deutsch',
    question: 'Welcher Buchstabe fehlt? Sonn_',
    options: ['e', 'a', 'i', 'o'],
    correctAnswer: 0,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-9',
    class: 1,
    subject: 'deutsch',
    question: 'Welches Wort beginnt mit "S"?',
    options: ['Maus', 'Katze', 'Sonnen', 'Baum'],
    correctAnswer: 2,
    points: 10,
    difficulty: 'leicht',
  },
  {
    id: 'deutsch-1-10',
    class: 1,
    subject: 'deutsch',
    question: 'Wie viele Silben hat das Wort "Auto"?',
    options: ['1', '2', '3', '4'],
    correctAnswer: 1,
    points: 10,
    difficulty: 'leicht',
  },
  // Mathematik - Klasse 2 (ohne StoryText)
  {
    id: 'math-2-1',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 10 + 15?',
    options: ['24', '25', '26', '27'],
    correctAnswer: 1,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-2',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 2 × 5?',
    options: ['8', '10', '12', '14'],
    correctAnswer: 1,
    points: 15,
    difficulty: 'mittel',
    explanation: '2 × 5 bedeutet: 2 mal die Zahl 5. Das ist 5 + 5 = 10. Oder du denkst: 2 Fünfer sind 10!',
  },
  {
    id: 'math-2-3',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 12 + 8?',
    options: ['18', '19', '20', '21'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-4',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 3 × 3?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 3,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-5',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 20 - 7?',
    options: ['11', '12', '13', '14'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-6',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 4 × 2?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'leicht',
  },
  {
    id: 'math-2-7',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 15 + 20?',
    options: ['33', '34', '35', '36'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-8',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 5 × 4?',
    options: ['18', '19', '20', '21'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-9',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 30 - 12?',
    options: ['16', '17', '18', '19'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'mittel',
  },
  {
    id: 'math-2-10',
    class: 2,
    subject: 'mathematik',
    question: 'Wie viel ist 6 × 2?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    points: 15,
    difficulty: 'leicht',
  },
  // Mathematik - Klasse 3
  {
    id: 'math-3-1',
    class: 3,
    subject: 'mathematik',
    character: 'max',
    world: 'mathe-land',
    storyText: 'Max backt Kekse mit seiner Mama. Sie haben 3 Bleche mit je 4 Keksen gebacken.',
    question: 'Wie viele Kekse haben sie insgesamt gebacken?',
    options: ['10', '12', '14', '16'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'mittel',
  },
  {
    id: 'math-3-2',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 5 × 6?',
    options: ['28', '30', '32', '34'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'mittel',
  },
  {
    id: 'math-3-3',
    class: 3,
    subject: 'mathematik',
    character: 'luna',
    world: 'mathe-land',
    storyText: 'Luna hat 24 bunte Sticker. Sie möchte sie gerecht an ihre 4 Freunde verteilen.',
    question: 'Wie viele Sticker bekommt jeder Freund?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'schwer',
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
    difficulty: 'mittel',
  },
  {
    id: 'math-3-5',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 50 + 25?',
    options: ['70', '75', '80', '85'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'schwer',
  },
  {
    id: 'math-3-6',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 45 - 18?',
    options: ['25', '27', '29', '31'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'mittel',
  },
  {
    id: 'math-3-7',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 8 × 4?',
    options: ['30', '32', '34', '36'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'mittel',
  },
  {
    id: 'math-3-8',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 36 ÷ 6?',
    options: ['5', '6', '7', '8'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'leicht',
  },
  {
    id: 'math-3-9',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 9 × 2?',
    options: ['16', '18', '20', '22'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'leicht',
  },
  {
    id: 'math-3-10',
    class: 3,
    subject: 'mathematik',
    question: 'Wie viel ist 100 - 35?',
    options: ['63', '65', '67', '69'],
    correctAnswer: 1,
    points: 20,
    difficulty: 'schwer',
  },
  // Mathematik - Klasse 4
  {
    id: 'math-4-1',
    class: 4,
    subject: 'mathematik',
    character: 'max',
    world: 'mathe-land',
    storyText: 'Max sammelt Sammelkarten. Er hat schon 12 Sets mit je 5 Karten gesammelt.',
    question: 'Wie viele Sammelkarten hat Max insgesamt?',
    options: ['55', '60', '65', '70'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'mittel',
  },
  {
    id: 'math-4-2',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 48 ÷ 6?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    points: 25,
    difficulty: 'schwer',
  },
  {
    id: 'math-4-3',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 7 × 8?',
    options: ['54', '56', '58', '60'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'schwer',
  },
  {
    id: 'math-4-4',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 125 + 75?',
    options: ['195', '200', '205', '210'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'mittel',
  },
  {
    id: 'math-4-5',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 200 - 68?',
    options: ['130', '132', '134', '136'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'mittel',
  },
  {
    id: 'math-4-6',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 9 × 6?',
    options: ['52', '54', '56', '58'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'mittel',
  },
  {
    id: 'math-4-7',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 64 ÷ 8?',
    options: ['6', '7', '8', '9'],
    correctAnswer: 2,
    points: 25,
    difficulty: 'schwer',
  },
  {
    id: 'math-4-8',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 11 × 4?',
    options: ['42', '44', '46', '48'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'mittel',
  },
  {
    id: 'math-4-9',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 150 + 250?',
    options: ['390', '400', '410', '420'],
    correctAnswer: 1,
    points: 25,
    difficulty: 'mittel',
  },
  {
    id: 'math-4-10',
    class: 4,
    subject: 'mathematik',
    question: 'Wie viel ist 81 ÷ 9?',
    options: ['7', '8', '9', '10'],
    correctAnswer: 2,
    points: 25,
    difficulty: 'schwer',
  },
  // Beispiel Input-Fragen (Klasse 3) - ohne StoryText für 50/50 Balance
  {
    id: 'math-3-input-1',
    class: 3,
    subject: 'mathematik',
    type: 'input',
    question: 'Wie viel ist 15 + 23? (Tippe die Zahl ein)',
    correctAnswer: '38',
    points: 20,
    difficulty: 'mittel',
    explanation: '15 + 23 = 38. Du kannst rechnen: 15 + 20 = 35, dann noch 3 dazu: 35 + 3 = 38!',
  },
  {
    id: 'math-3-input-2',
    class: 3,
    subject: 'mathematik',
    type: 'input',
    question: 'Wie viele Ecken hat ein Dreieck? (Tippe die Zahl ein)',
    correctAnswer: '3',
    points: 15,
    difficulty: 'leicht',
    explanation: 'Ein Dreieck hat genau 3 Ecken! Das siehst du, wenn du "Drei-eck" langsam sagst.',
  },
  // Beispiel Input-Fragen (Klasse 4) - ohne StoryText für 50/50 Balance
  {
    id: 'math-4-input-1',
    class: 4,
    subject: 'mathematik',
    type: 'input',
    question: 'Wie viel ist 6 × 7? (Tippe die Zahl ein)',
    correctAnswer: '42',
    points: 25,
    difficulty: 'schwer',
    explanation: '6 × 7 = 42. Du kannst rechnen: 6 × 6 = 36, dann noch 6 dazu: 36 + 6 = 42!',
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

/**
 * Adaptive Fragen-Auswahl basierend auf Performance
 * Passt die Schwierigkeit dynamisch an
 */
export function getAdaptiveQuestions(
  classLevel: 1 | 2 | 3 | 4,
  subject: Question['subject'],
  count: number = 8,
  recentResults: Array<{ isCorrect: boolean }> = []
): Question[] {
  const availableQuestions = getQuestionsByClassAndSubject(classLevel, subject);
  
  // Bestimme aktuelle Ziel-Schwierigkeit basierend auf Performance
  let targetDifficulty: 'leicht' | 'mittel' | 'schwer' = 'mittel';
  
  if (recentResults.length >= 3) {
    const lastThree = recentResults.slice(-3);
    const correctCount = lastThree.filter(r => r.isCorrect).length;
    
    if (correctCount === 3) {
      // 3 richtige in Folge → schwierigere Fragen
      targetDifficulty = 'schwer';
    } else if (correctCount === 0) {
      // 3 falsche in Folge → leichtere Fragen
      targetDifficulty = 'leicht';
    }
    // 1-2 richtige → mittlere Schwierigkeit (bleibt bei 'mittel')
  }
  
  // Sortiere Fragen nach Schwierigkeit
  const easyQuestions = availableQuestions.filter(q => q.difficulty === 'leicht');
  const mediumQuestions = availableQuestions.filter(q => q.difficulty === 'mittel' || !q.difficulty);
  const hardQuestions = availableQuestions.filter(q => q.difficulty === 'schwer');
  
  // Verteile Fragen basierend auf Ziel-Schwierigkeit
  let selectedQuestions: Question[] = [];
  
  if (targetDifficulty === 'schwer') {
    // 50% schwer, 30% mittel, 20% leicht
    selectedQuestions.push(...shuffleArray(hardQuestions).slice(0, Math.floor(count * 0.5)));
    selectedQuestions.push(...shuffleArray(mediumQuestions).slice(0, Math.floor(count * 0.3)));
    selectedQuestions.push(...shuffleArray(easyQuestions).slice(0, Math.floor(count * 0.2)));
  } else if (targetDifficulty === 'leicht') {
    // 50% leicht, 30% mittel, 20% schwer
    selectedQuestions.push(...shuffleArray(easyQuestions).slice(0, Math.floor(count * 0.5)));
    selectedQuestions.push(...shuffleArray(mediumQuestions).slice(0, Math.floor(count * 0.3)));
    selectedQuestions.push(...shuffleArray(hardQuestions).slice(0, Math.floor(count * 0.2)));
  } else {
    // 40% mittel, 30% leicht, 30% schwer (Standard)
    selectedQuestions.push(...shuffleArray(mediumQuestions).slice(0, Math.floor(count * 0.4)));
    selectedQuestions.push(...shuffleArray(easyQuestions).slice(0, Math.floor(count * 0.3)));
    selectedQuestions.push(...shuffleArray(hardQuestions).slice(0, Math.floor(count * 0.3)));
  }
  
  // Fülle auf, falls nicht genug Fragen vorhanden
  const remaining = count - selectedQuestions.length;
  if (remaining > 0) {
    const allRemaining = [...availableQuestions].filter(q => 
      !selectedQuestions.some(sq => sq.id === q.id)
    );
    selectedQuestions.push(...shuffleArray(allRemaining).slice(0, remaining));
  }
  
  // Mische die finale Auswahl
  return shuffleArray(selectedQuestions).slice(0, count);
}

/**
 * Hilfsfunktion zum Mischen eines Arrays
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

