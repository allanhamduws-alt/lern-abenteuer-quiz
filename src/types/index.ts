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
  difficulty?: 'leicht' | 'mittel' | 'schwer'; // Schwierigkeitsgrad
  topic?: string; // Thema (z.B. "addition", "buchstaben")
  explanation?: string; // Kindgerechte Erklärung bei falscher Antwort
}

// Quiz-Ergebnis Typ
export interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  points: number;
  timeSpent?: number; // Zeit in Sekunden
}

// Benutzer-Typ
export interface User {
  uid: string;
  email: string;
  name: string;
  class: 1 | 2 | 3 | 4;
  age?: number; // Alter des Kindes
  avatar?: string; // Avatar-Emoji (z.B. "👦", "👧")
  year?: number; // Jahrgang (z.B. 2024)
  totalPoints: number;
  quizzesCompleted: number;
  progress?: Progress; // Fortschritts-Daten
  createdAt: string; // ISO Date String - wann wurde Account erstellt
  lastLogin?: string; // ISO Date String - letzter Login
}

// Fortschritts-Typ
export interface SubjectProgress {
  subject: 'mathematik' | 'deutsch' | 'naturwissenschaften' | 'kunst' | 'logik';
  quizzesCompleted: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number; // Prozent
  topicsMastered: string[]; // Themen die gemeistert wurden
  topicsNeedingPractice: string[]; // Themen die Übung brauchen
  lastPlayed?: string; // ISO Date String
}

// Gesamt-Fortschritt
export interface Progress {
  totalQuizzesCompleted: number;
  totalPoints: number;
  subjects: {
    mathematik: SubjectProgress;
    deutsch: SubjectProgress;
    naturwissenschaften: SubjectProgress;
    kunst: SubjectProgress;
    logik: SubjectProgress;
  };
  difficultQuestions: DifficultQuestion[];
  badges: string[]; // Badge-IDs
  learningStreak: LearningStreak;
  lastActivity: string; // ISO Date String
}

// Schwierige Aufgabe
export interface DifficultQuestion {
  questionId: string;
  attempts: number;
  firstAttempt: string; // ISO Date String
  lastAttempt: string; // ISO Date String
  mastered: boolean;
  nextReview?: string; // ISO Date String für Spaced Repetition
}

// Lernstreak
export interface LearningStreak {
  current: number; // Aktuelle Tage in Folge
  longest: number; // Längster Streak
  lastActivity: string; // ISO Date String
}

// Badge-Typ
export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: 'progress' | 'subject' | 'performance' | 'class' | 'special';
  unlockedAt?: string; // ISO Date String
}

// Firebase-Konfiguration Typ
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

