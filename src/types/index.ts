/**
 * TypeScript-Typen für die Lern-Abenteuer-Quiz App
 * Alle wichtigen Datenstrukturen werden hier definiert
 */

// Quiz-Frage Typ
export interface Question {
  id: string;
  class: 1 | 2 | 3 | 4; // Klasse 1-4
  subject: 'mathematik' | 'deutsch' | 'naturwissenschaften' | 'kunst' | 'logik';
  question: string;
  options: string[]; // Antwort-Optionen
  correctAnswer: number; // Index der richtigen Antwort
  points: number; // Punkte für richtige Antwort
}

// Quiz-Ergebnis Typ
export interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  points: number;
}

// Benutzer-Typ
export interface User {
  uid: string;
  email: string;
  name: string;
  class: 1 | 2 | 3 | 4;
  totalPoints: number;
  quizzesCompleted: number;
}

// Firebase-Konfiguration Typ
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

