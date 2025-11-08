/**
 * Level-basierte Feature-Freischaltung
 * Definiert welche Features/Spiele bei welchem Level freigeschaltet werden
 */

import type { SubjectProgress } from '../types';

export interface LevelRequirement {
  level: number;
  description: string;
}

/**
 * Definiert Level-Anforderungen für Spiele pro Fach
 */
export const GAME_LEVEL_REQUIREMENTS: Record<string, Record<string, LevelRequirement>> = {
  mathematik: {
    'number-sort': { level: 1, description: 'Ab Level 1' },
    'math-puzzle': { level: 3, description: 'Ab Level 3' },
  },
  deutsch: {
    'word-match': { level: 1, description: 'Ab Level 1' },
    'sentence-builder': { level: 4, description: 'Ab Level 4' },
  },
  logik: {
    'memory': { level: 1, description: 'Ab Level 1' },
    'pattern-continue': { level: 5, description: 'Ab Level 5' },
  },
  naturwissenschaften: {
    'animal-habitat': { level: 2, description: 'Ab Level 2' },
  },
};

/**
 * Prüft ob ein Spiel für ein Fach freigeschaltet ist
 */
export function isGameUnlocked(
  gameId: string,
  subject: SubjectProgress['subject'],
  subjectProgress: SubjectProgress
): boolean {
  const requirements = GAME_LEVEL_REQUIREMENTS[subject]?.[gameId];
  if (!requirements) {
    // Wenn keine Anforderung definiert ist, ist das Spiel freigeschaltet
    return true;
  }
  
  const currentLevel = subjectProgress.level || 1;
  return currentLevel >= requirements.level;
}

/**
 * Gibt alle freigeschalteten Spiele für ein Fach zurück
 */
export function getUnlockedGames(
  subject: SubjectProgress['subject'],
  subjectProgress: SubjectProgress
): string[] {
  const requirements = GAME_LEVEL_REQUIREMENTS[subject];
  if (!requirements) return [];
  
  const currentLevel = subjectProgress.level || 1;
  
  return Object.entries(requirements)
    .filter(([_, req]) => currentLevel >= req.level)
    .map(([gameId, _]) => gameId);
}

/**
 * Gibt alle gesperrten Spiele für ein Fach zurück
 */
export function getLockedGames(
  subject: SubjectProgress['subject'],
  subjectProgress: SubjectProgress
): Array<{ gameId: string; requirement: LevelRequirement }> {
  const requirements = GAME_LEVEL_REQUIREMENTS[subject];
  if (!requirements) return [];
  
  const currentLevel = subjectProgress.level || 1;
  
  return Object.entries(requirements)
    .filter(([_, req]) => currentLevel < req.level)
    .map(([gameId, req]) => ({ gameId, requirement: req }));
}

/**
 * Gibt Level-Anforderung für ein Spiel zurück
 */
export function getGameLevelRequirement(
  gameId: string,
  subject: SubjectProgress['subject']
): LevelRequirement | null {
  return GAME_LEVEL_REQUIREMENTS[subject]?.[gameId] || null;
}

/**
 * Gibt Level-Belohnungen zurück (was bei Level-Up freigeschaltet wird)
 */
export function getLevelRewards(level: number): string[] {
  const rewards: string[] = [];
  
  if (level === 2) {
    rewards.push('Tier-Lebensräume Spiel freigeschaltet');
  } else if (level === 3) {
    rewards.push('Rechen-Puzzle Spiel freigeschaltet');
  } else if (level === 4) {
    rewards.push('Satz-Bau Spiel freigeschaltet');
  } else if (level === 5) {
    rewards.push('Muster fortsetzen Spiel freigeschaltet');
  }
  
  return rewards;
}

