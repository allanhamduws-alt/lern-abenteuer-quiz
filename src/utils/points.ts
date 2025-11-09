/**
 * Utility-Funktionen für das Punkte-System
 * Speichert Punkte lokal im Browser und synchronisiert mit Firebase
 */

import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { User, GameId } from '../types';

/**
 * Punkte lokal im Browser speichern (für sofortiges Feedback)
 */
export function savePointsLocal(points: number): void {
  const currentPoints = getLocalPoints();
  localStorage.setItem('quizPoints', String(currentPoints + points));
}

/**
. * Lokale Punkte abrufen
 */
export function getLocalPoints(): number {
  const points = localStorage.getItem('quizPoints');
  return points ? parseInt(points, 10) : 0;
}

/**
 * Lokale Punkte zurücksetzen
 */
export function resetLocalPoints(): void {
  localStorage.removeItem('quizPoints');
}

/**
 * Punkte zu Firebase hinzufügen
 */
export async function addPointsToFirebase(
  userId: string,
  points: number
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalPoints: increment(points),
      quizzesCompleted: increment(1),
    });
  } catch (error) {
    console.error('Fehler beim Speichern der Punkte:', error);
    throw error;
  }
}

/**
 * Punkte vom Benutzerkonto abziehen (z. B. für Spielstart)
 */
export async function spendPointsInFirebase(
  userId: string,
  pointsToSpend: number
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalPoints: increment(-Math.abs(pointsToSpend)),
    });
  } catch (error) {
    console.error('Fehler beim Abziehen der Punkte:', error);
    throw error;
  }
}

/**
 * Punkte synchronisieren (lokal + Firebase)
 */
export async function syncPoints(user: User, quizPoints: number): Promise<void> {
  try {
    // Zu Firebase hinzufügen
    await addPointsToFirebase(user.uid, quizPoints);
    
    // Lokale Punkte zurücksetzen
    resetLocalPoints();
  } catch (error) {
    console.error('Fehler bei der Punkte-Synchronisation:', error);
    // Falls Firebase fehlschlägt, bleiben die Punkte lokal gespeichert
    savePointsLocal(quizPoints);
  }
}

/**
 * Standard-Kosten/Tickets pro Spiel
 * Kann später durch Firestore pro Kind überschrieben werden
 */
export type GameCost =
  | { costType: 'points'; costValue: number }
  | { costType: 'time'; costValue: number }; // Minuten

const DEFAULT_GAME_COSTS: Record<GameId, GameCost> = {
  'number-sort': { costType: 'points', costValue: 10 },
  'word-match': { costType: 'points', costValue: 10 },
  'memory': { costType: 'time', costValue: 5 },
  'math-puzzle': { costType: 'points', costValue: 15 },
  'sentence-builder': { costType: 'points', costValue: 12 },
  'pattern-continue': { costType: 'points', costValue: 12 },
  'animal-habitat': { costType: 'time', costValue: 5 },
};

export function getGameCost(gameId: GameId): GameCost {
  return DEFAULT_GAME_COSTS[gameId] ?? { costType: 'points', costValue: 10 };
}

export function hasEnoughPoints(user: User | null, gameId: GameId): boolean {
  const cost = getGameCost(gameId);
  if (!user) return false;
  if (cost.costType === 'time') return true; // Zeit-Ticket wird separat gehandhabt
  return (user.totalPoints || 0) >= cost.costValue;
}

