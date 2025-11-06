/**
 * TypeScript-Typen für die Lern-Abenteuer-Quiz App
 * Alle wichtigen Datenstrukturen werden hier definiert
 */

// Storytelling-Charaktere
export type StoryCharacter = 'max' | 'luna';

// Storytelling-Welten pro Fach
export type StoryWorld = 'mathe-land' | 'deutsch-stadt' | 'natur-paradies' | 'kunst-atelier' | 'logik-turm';

// Fragetypen
export type QuestionType = 'multiple-choice' | 'input' | 'drag-drop';

// Quiz-Frage Typ
export interface Question {
  id: string;
  class: 1 | 2 | 3 | 4; // Klasse 1-4
  subject: 'mathematik' | 'deutsch' | 'naturwissenschaften' | 'kunst' | 'logik';
  type?: QuestionType; // Fragetyp, Standard: 'multiple-choice'
  question: string;
  options?: string[]; // Antwort-Optionen (für multiple-choice)
  correctAnswer: number | string; // Index der richtigen Antwort oder direkte Antwort (für input)
  points: number; // Punkte für richtige Antwort
  difficulty?: 'leicht' | 'mittel' | 'schwer'; // Schwierigkeitsgrad
  topic?: string; // Thema (z.B. "addition", "buchstaben")
  explanation?: string; // Kindgerechte Erklärung bei falscher Antwort
  // Storytelling-Felder
  character?: StoryCharacter; // Welcher Charakter ist in dieser Geschichte?
  storyText?: string; // Die Geschichte/Kontext vor der Frage
  world?: StoryWorld; // In welcher Welt spielt diese Geschichte?
  // Für drag-drop Fragen
  dragItems?: string[]; // Items die gezogen werden können
  dropTargets?: string[]; // Ziele für Drag & Drop
  // Bonus-Aufgabe (⭐)
  isBonus?: boolean; // ⭐ Sternchen-Aufgabe (optional, fortgeschritten, gibt mehr Punkte)
  bonusMultiplier?: number; // Multiplikator für Punkte bei Bonus-Aufgaben (Standard: 1.5)
  // Hilfe-Feld
  helpText?: string; // Altersgerechte Erklärung der Aufgabe (optional, kann durch KI generiert werden)
}

// Quiz-Ergebnis Typ
export interface QuizResult {
  questionId: string;
  selectedAnswer: number | string; // Kann jetzt auch String sein (für input)
  isCorrect: boolean;
  points: number;
  timeSpent?: number; // Zeit in Sekunden
}

// Benutzer-Rolle
export type UserRole = 'child' | 'parent';

// Benutzer-Typ
export interface User {
  uid: string;
  email: string;
  name: string;
  role?: UserRole; // Rolle: 'child' oder 'parent' (Standard: 'child')
  class?: 1 | 2 | 3 | 4; // Nur für Kinder relevant
  age?: number; // Alter des Kindes
  avatar?: string; // Avatar-Emoji (z.B. "👦", "👧")
  year?: number; // Jahrgang (z.B. 2024)
  totalPoints: number;
  quizzesCompleted: number;
  progress?: Progress; // Fortschritts-Daten
  createdAt: string; // ISO Date String - wann wurde Account erstellt
  lastLogin?: string; // ISO Date String - letzter Login
  // Eltern-Felder
  children?: string[]; // Array von UIDs der Kinder (nur für Eltern)
  parentId?: string; // UID des Eltern-Kontos (nur für Kinder)
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
  level?: number; // Level im Fach (1-100)
  xp?: number; // Aktuelle XP im aktuellen Level
  xpToNextLevel?: number; // XP benötigt für nächstes Level
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

// Mini-Spiel Typen
export type GameId = 'number-sort' | 'word-match' | 'memory';

export interface GameResult {
  gameId: GameId;
  points: number;
  completed: boolean;
  timeSpent?: number; // Zeit in Sekunden
  score?: number; // Optional: Score-Bewertung
  mistakes?: number; // Anzahl der Fehler
}

export interface BaseGameProps {
  gameId: GameId;
  onComplete: (result: GameResult) => void;
  onExit: () => void;
  classLevel: 1 | 2 | 3 | 4;
  subject?: Question['subject'];
}

