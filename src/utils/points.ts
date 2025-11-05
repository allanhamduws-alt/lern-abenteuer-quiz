/**
 * Utility-Funktionen für das Punkte-System
 * Speichert Punkte lokal im Browser und synchronisiert mit Firebase
 */

import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { User } from '../types';

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

