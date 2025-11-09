/**
 * TypeScript-Typen für die Lern-Abenteuer-Quiz App
 * Alle wichtigen Datenstrukturen werden hier definiert
 */

// Fragetypen
export type QuestionType = 
  // Bestehend
  | 'multiple-choice' 
  | 'input' 
  | 'drag-drop'
  // Phase 1A - 5 Kern-Typen
  | 'fill-blank'              // Lückentext (Deutsch)
  | 'word-classification'     // Wortarten zuordnen (Deutsch)
  | 'number-input'            // Rechenaufgaben (Mathe)
  | 'number-pyramid'          // Zahlenmauern (Mathe)
  | 'word-problem'            // Textaufgaben (Mathe)
  // Neue Typen für authentische Arbeitsblätter
  | 'text-input'              // Freie Texteingabe (Wörter/Sätze)
  | 'sentence-builder'        // Sätze aus Wortbausteinen bilden
  | 'table-fill'              // Tabellen ausfüllen (z.B. Verb-Konjugation)
  // Phase 1B - 9 weitere Typen (später)
  | 'reading-comprehension'   // Leseproben (Deutsch)
  | 'sentence-parts'          // Satzglieder (Deutsch)
  | 'verb-conjugation'        // Zeitformen (Deutsch)
  | 'word-order'              // Wörter ordnen (Deutsch)
  | 'word-building'           // Wörter bilden (Deutsch)
  | 'number-sequence'         // Zahlenreihen (Mathe)
  | 'number-line'             // Zahlenstrahl (Mathe)
  | 'geometry-shapes'         // Geometrie (Mathe)
  | 'units-conversion';       // Maßeinheiten (Mathe)

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
  // Für drag-drop Fragen
  dragItems?: string[]; // Items die gezogen werden können
  dropTargets?: string[]; // Ziele für Drag & Drop
  // Bonus-Aufgabe (⭐)
  isBonus?: boolean; // ⭐ Sternchen-Aufgabe (optional, fortgeschritten, gibt mehr Punkte)
  bonusMultiplier?: number; // Multiplikator für Punkte bei Bonus-Aufgaben (Standard: 1.5)
  // Hilfe-Feld
  helpText?: string; // Altersgerechte Erklärung der Aufgabe (optional, kann durch KI generiert werden)
  // Bild-Support
  imageUrl?: string; // URL zu einem Bild für die Aufgabe (z.B. Firebase Storage URL)
  imagePrompt?: string; // Prompt für Bild-Generierung (falls Bild noch nicht existiert)
  
  // NEU: Felder für Phase 1A Typen
  // fill-blank (Lückentext)
  blanks?: string[];                    // Richtige Antworten für Lücken
  blankOptions?: string[][];             // Optionen pro Lücke (z.B. [["ä","e"], ["ö","o"]])
  caseSensitive?: boolean;               // Groß-/Kleinschreibung wichtig?
  
  // word-classification (Wortarten)
  words?: string[];                      // Wörter zum Zuordnen
  categories?: string[];                  // Kategorien (z.B. ["Nomen", "Verb", "Adjektiv"])
  correctMapping?: Record<string, string>; // Mapping: Wort → Kategorie
  
  // number-input (Rechenaufgaben)
  problems?: Array<{                     // Mehrere Rechenaufgaben
    question: string;                    // z.B. "5 + 3 = "
    answer: string;                       // z.B. "8"
  }>;
  operation?: 'addition' | 'subtraction' | 'multiplication' | 'division';
  numberRange?: [number, number];        // Zahlenraum z.B. [1, 20]
  
  // number-pyramid (Zahlenmauern)
  levels?: number;                        // Anzahl Ebenen (z.B. 3)
  structure?: Array<Array<{              // Pyramiden-Struktur
    value: number | null;                 // Zahl oder null (leer)
    isBlank: boolean;                     // Ist dieses Feld leer?
  }>>;
  
  // word-problem (Textaufgaben)
  context?: string;                       // Kontext (z.B. "fruits", "shopping")
  calculation?: string;                   // Rechnung (z.B. "5 + 3")
  unit?: string;                          // Einheit (z.B. "Äpfel", "Euro")
  
  // text-input (Freie Texteingabe)
  expectedAnswer?: string;                // Erwartete Antwort (für Vergleich)
  placeholder?: string;                  // Platzhalter-Text im Input-Feld
  maxLength?: number;                     // Maximale Zeichenanzahl
  
  // sentence-builder (Sätze bilden)
  sentenceParts?: string[];               // Wortbausteine zum Sortieren
  correctOrder?: number[];                 // Richtige Reihenfolge (Indizes)
  
  // table-fill (Tabellen ausfüllen)
  tableHeaders?: string[];                // Spaltenüberschriften
  tableRows?: Array<{                     // Tabellenzeilen
    label: string;                         // Zeilenbeschriftung (z.B. "ich", "du")
    cells: Array<{                        // Zellen in dieser Zeile
      value?: string;                      // Vorgefüllter Wert (optional)
      editable: boolean;                   // Ist diese Zelle editierbar?
    }>;
  }>;
  correctValues?: Record<string, string>; // Korrekte Werte: "row-col" → "Wert"
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
  skillLevel?: number; // Adaptives Skill-Level (0.0-1.0) für adaptive Fragen-Auswahl
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
  dailyChallenge?: DailyChallenge; // Aktuelle tägliche Challenge
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

// Tägliche Challenge
export interface DailyChallenge {
  id: string; // Eindeutige ID (z.B. "2024-01-15")
  date: string; // ISO Date String
  type: 'questions' | 'points' | 'perfect' | 'streak'; // Challenge-Typ
  target: number; // Zielwert (z.B. 5 Fragen richtig)
  description: string; // Beschreibung der Challenge
  bonusPoints: number; // Bonus-Punkte bei Erfüllung
  completed: boolean; // Wurde die Challenge erfüllt?
  progress: number; // Aktueller Fortschritt (z.B. 3/5 Fragen)
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
  storageBucket?: string;
}

// Mini-Spiel Typen
export type GameId = 'number-sort' | 'word-match' | 'memory' | 'math-puzzle' | 'sentence-builder' | 'pattern-continue' | 'animal-habitat';

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

