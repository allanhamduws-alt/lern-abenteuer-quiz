/**
 * Badge-Definitionen
 * Alle verfügbaren Badges im System
 */

import type { Badge } from '../types';

export const ALL_BADGES: Record<string, Badge> = {
  'erstes-quiz': {
    id: 'erstes-quiz',
    name: 'Erstes Quiz',
    emoji: '🎯',
    description: 'Du hast dein erstes Quiz gespielt!',
    category: 'progress',
  },
  'mathe-meister': {
    id: 'mathe-meister',
    name: 'Mathe-Meister',
    emoji: '🔢',
    description: '10 Mathe-Quizzes erfolgreich abgeschlossen!',
    category: 'subject',
  },
  'perfektionist': {
    id: 'perfektionist',
    name: 'Perfektionist',
    emoji: '⭐',
    description: 'Ein Quiz mit 100% abgeschlossen!',
    category: 'performance',
  },
  'durchhalter': {
    id: 'durchhalter',
    name: 'Durchhalter',
    emoji: '🔥',
    description: '7 Tage in Folge gelernt!',
    category: 'progress',
  },
  'schnelldenker': {
    id: 'schnelldenker',
    name: 'Schnelldenker',
    emoji: '⚡',
    description: 'Ein Quiz in unter 5 Minuten abgeschlossen!',
    category: 'performance',
  },
};

/**
 * Gibt alle Badge-Definitionen zurück
 */
export function getAllBadges(): Badge[] {
  return Object.values(ALL_BADGES);
}

/**
 * Gibt eine Badge-Definition nach ID zurück
 */
export function getBadgeById(id: string): Badge | undefined {
  return ALL_BADGES[id];
}

/**
 * Prüft welche Badges neu verdient wurden basierend auf dem Fortschritt
 */
export function checkEarnedBadges(
  progress: {
    totalQuizzesCompleted: number;
    subjects: {
      mathematik: { quizzesCompleted: number };
    };
    learningStreak: { current: number };
    badges: string[];
  },
  quizStats?: {
    isPerfect: boolean;
    totalTimeSeconds: number;
  }
): string[] {
  const newlyEarned: string[] = [];

  // 1. Erstes Quiz
  if (progress.totalQuizzesCompleted === 1 && !progress.badges.includes('erstes-quiz')) {
    newlyEarned.push('erstes-quiz');
  }

  // 2. Mathe-Meister (10 Mathe-Quizzes)
  if (
    progress.subjects.mathematik.quizzesCompleted >= 10 &&
    !progress.badges.includes('mathe-meister')
  ) {
    newlyEarned.push('mathe-meister');
  }

  // 3. Perfektionist (100% beim Quiz)
  if (quizStats?.isPerfect && !progress.badges.includes('perfektionist')) {
    newlyEarned.push('perfektionist');
  }

  // 4. Durchhalter (7 Tage Streak)
  if (progress.learningStreak.current >= 7 && !progress.badges.includes('durchhalter')) {
    newlyEarned.push('durchhalter');
  }

  // 5. Schnelldenker (Quiz unter 5 Minuten)
  if (
    quizStats &&
    quizStats.totalTimeSeconds < 300 && // 5 Minuten = 300 Sekunden
    !progress.badges.includes('schnelldenker')
  ) {
    newlyEarned.push('schnelldenker');
  }

  return newlyEarned;
}

