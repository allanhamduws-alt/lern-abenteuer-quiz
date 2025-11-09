/**
 * Adaptive Schwierigkeits-Anpassung
 * Elo-ähnliches System für Skill-Schätzung pro Fach/Kind
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SkillLevel {
  skill: number; // 0.0 - 1.0 (Elo-ähnlich)
  lastUpdated: string; // ISO Date
}

const K_FACTOR = 32; // Elo K-Faktor (wie stark sich Skill ändert)
const INITIAL_SKILL = 0.5; // Start bei medium

/**
 * Skill-Level aus Firestore laden (oder Standard zurückgeben)
 */
export async function getSkillLevel(
  userId: string,
  subject: string
): Promise<SkillLevel> {
  try {
    const skillDoc = await getDoc(
      doc(db, 'users', userId, 'skills', subject)
    );
    if (skillDoc.exists()) {
      const data = skillDoc.data();
      return {
        skill: data.skill ?? INITIAL_SKILL,
        lastUpdated: data.lastUpdated ?? new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`Fehler beim Laden von Skill für ${subject}:`, error);
  }
  return {
    skill: INITIAL_SKILL,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Skill-Level nach Aufgabe aktualisieren
 * @param userId Benutzer-ID
 * @param subject Fach
 * @param difficulty Schwierigkeit der Aufgabe
 * @param isCorrect War die Antwort richtig?
 */
export async function updateSkillLevel(
  userId: string,
  subject: string,
  difficulty: Difficulty,
  isCorrect: boolean
): Promise<void> {
  try {
    const current = await getSkillLevel(userId, subject);
    
    // Erwartete Erfolgsrate basierend auf Skill und Schwierigkeit
    const expectedWinRate = getExpectedWinRate(current.skill, difficulty);
    
    // Tatsächliches Ergebnis (1.0 = richtig, 0.0 = falsch)
    const actualResult = isCorrect ? 1.0 : 0.0;
    
    // Skill-Update (Elo-Formel vereinfacht)
    const skillChange = K_FACTOR * (actualResult - expectedWinRate);
    const newSkill = Math.max(0.0, Math.min(1.0, current.skill + skillChange / 100));
    
    // In Firestore speichern
    await updateDoc(doc(db, 'users', userId, 'skills', subject), {
      skill: newSkill,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Fehler beim Aktualisieren von Skill für ${subject}:`, error);
  }
}

/**
 * Erwartete Erfolgsrate basierend auf Skill und Schwierigkeit
 */
function getExpectedWinRate(skill: number, difficulty: Difficulty): number {
  // Skill-Mapping zu Schwierigkeit
  const skillToDifficulty: Record<Difficulty, { min: number; max: number }> = {
    easy: { min: 0.0, max: 0.4 },
    medium: { min: 0.3, max: 0.7 },
    hard: { min: 0.6, max: 1.0 },
  };
  
  const range = skillToDifficulty[difficulty];
  
  // Wenn Skill im Bereich liegt, erwartete Erfolgsrate ~70%
  // Wenn außerhalb, niedrigere Erfolgsrate
  if (skill >= range.min && skill <= range.max) {
    return 0.7;
  } else if (skill < range.min) {
    // Zu schwer für aktuellen Skill
    return 0.3;
  } else {
    // Zu leicht für aktuellen Skill
    return 0.9;
  }
}

/**
 * Empfohlene Schwierigkeit basierend auf aktuellem Skill-Level
 */
export function getRecommendedDifficulty(skill: number): Difficulty {
  if (skill < 0.4) {
    return 'easy';
  } else if (skill < 0.7) {
    return 'medium';
  } else {
    return 'hard';
  }
}

/**
 * Skill-Level für alle Fächer eines Kindes laden
 */
export async function getAllSkills(
  userId: string,
  subjects: string[]
): Promise<Record<string, SkillLevel>> {
  const skills: Record<string, SkillLevel> = {};
  for (const subject of subjects) {
    skills[subject] = await getSkillLevel(userId, subject);
  }
  return skills;
}

