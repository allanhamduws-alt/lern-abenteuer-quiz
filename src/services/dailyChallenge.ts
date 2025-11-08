/**
 * Daily Challenge Service
 * Generiert und verwaltet tägliche Challenges
 */

import type { DailyChallenge, Progress } from '../types';

/**
 * Generiert eine neue tägliche Challenge basierend auf dem aktuellen Tag
 */
export function generateDailyChallenge(date: Date = new Date()): DailyChallenge {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Verschiedene Challenge-Typen rotieren
  const challengeTypes: DailyChallenge['type'][] = ['questions', 'points', 'perfect', 'streak'];
  const type = challengeTypes[dayOfYear % challengeTypes.length];
  
  // Challenge basierend auf Typ generieren
  switch (type) {
    case 'questions':
      return {
        id: `daily-${dateStr}`,
        date: date.toISOString(),
        type: 'questions',
        target: 5,
        description: 'Beantworte heute 5 Fragen richtig! 🎯',
        bonusPoints: 50,
        completed: false,
        progress: 0,
      };
    
    case 'points':
      return {
        id: `daily-${dateStr}`,
        date: date.toISOString(),
        type: 'points',
        target: 100,
        description: 'Sammle heute 100 Punkte! ⭐',
        bonusPoints: 75,
        completed: false,
        progress: 0,
      };
    
    case 'perfect':
      return {
        id: `daily-${dateStr}`,
        date: date.toISOString(),
        type: 'perfect',
        target: 1,
        description: 'Schaffe heute ein perfektes Quiz (100%)! 🏆',
        bonusPoints: 100,
        completed: false,
        progress: 0,
      };
    
    case 'streak':
      return {
        id: `daily-${dateStr}`,
        date: date.toISOString(),
        type: 'streak',
        target: 1,
        description: 'Halte deinen Lernstreak am Laufen! 🔥',
        bonusPoints: 25,
        completed: false,
        progress: 0,
      };
    
    default:
      return {
        id: `daily-${dateStr}`,
        date: date.toISOString(),
        type: 'questions',
        target: 5,
        description: 'Beantworte heute 5 Fragen richtig! 🎯',
        bonusPoints: 50,
        completed: false,
        progress: 0,
      };
  }
}

/**
 * Prüft ob die aktuelle Challenge noch gültig ist (heute)
 */
export function isChallengeCurrent(challenge: DailyChallenge | undefined): boolean {
  if (!challenge) return false;
  
  const today = new Date().toISOString().split('T')[0];
  const challengeDate = challenge.date.split('T')[0];
  
  return today === challengeDate;
}

/**
 * Aktualisiert den Fortschritt einer Challenge basierend auf Quiz-Ergebnissen
 */
export function updateChallengeProgress(
  challenge: DailyChallenge,
  progress: Progress,
  quizResults?: {
    correctAnswers: number;
    totalPoints: number;
    isPerfect: boolean;
  }
): DailyChallenge {
  const updatedChallenge = { ...challenge };
  
  switch (challenge.type) {
    case 'questions':
      // Zähle richtige Antworten heute
      // Wir müssen das aus dem Progress ableiten - für jetzt nehmen wir die letzten Quiz-Ergebnisse
      if (quizResults) {
        updatedChallenge.progress = Math.min(challenge.progress + quizResults.correctAnswers, challenge.target);
      }
      break;
    
    case 'points':
      // Zähle Punkte heute
      if (quizResults) {
        updatedChallenge.progress = Math.min(challenge.progress + quizResults.totalPoints, challenge.target);
      }
      break;
    
    case 'perfect':
      // Perfektes Quiz geschafft?
      if (quizResults?.isPerfect) {
        updatedChallenge.progress = challenge.target;
      }
      break;
    
    case 'streak':
      // Streak wird durch tägliche Aktivität automatisch aktualisiert
      if (progress.learningStreak.current > 0) {
        updatedChallenge.progress = 1;
      }
      break;
  }
  
  // Prüfe ob Challenge erfüllt wurde
  if (updatedChallenge.progress >= updatedChallenge.target) {
    updatedChallenge.completed = true;
  }
  
  return updatedChallenge;
}

/**
 * Berechnet den Fortschritt einer Challenge aus dem Progress
 * WICHTIG: Diese Funktion sollte nur für die Anzeige verwendet werden
 * Der tatsächliche Fortschritt wird in updateProgressAfterQuiz aktualisiert
 */
export function calculateChallengeProgress(
  challenge: DailyChallenge,
  progress: Progress,
  todayStats?: {
    correctAnswersToday: number;
    pointsToday: number;
    perfectQuizzesToday: number;
  }
): DailyChallenge {
  const updatedChallenge = { ...challenge };
  
  // Wenn Challenge bereits erfüllt wurde, nichts ändern
  if (challenge.completed) {
    return updatedChallenge;
  }
  
  switch (challenge.type) {
    case 'questions':
      // Akkumuliere richtige Antworten
      if (todayStats) {
        updatedChallenge.progress = Math.min(
          challenge.progress + todayStats.correctAnswersToday,
          challenge.target
        );
      }
      break;
    
    case 'points':
      // Akkumuliere Punkte
      if (todayStats) {
        updatedChallenge.progress = Math.min(
          challenge.progress + todayStats.pointsToday,
          challenge.target
        );
      }
      break;
    
    case 'perfect':
      // Perfektes Quiz geschafft?
      if (todayStats?.perfectQuizzesToday && todayStats.perfectQuizzesToday > 0) {
        updatedChallenge.progress = challenge.target;
      }
      break;
    
    case 'streak':
      // Streak wird durch tägliche Aktivität automatisch aktualisiert
      updatedChallenge.progress = progress.learningStreak.current > 0 ? 1 : 0;
      break;
  }
  
  // Prüfe ob Challenge erfüllt wurde
  if (updatedChallenge.progress >= updatedChallenge.target) {
    updatedChallenge.completed = true;
  }
  
  return updatedChallenge;
}

