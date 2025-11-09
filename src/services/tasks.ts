/**
 * Tasks Service - Verwaltung von Aufgaben (global + Eltern-Uploads)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface GlobalTask {
  id: string;
  subject: string;
  grade: 1 | 2 | 3 | 4;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'input' | 'drag-drop' | 'matching';
  stem: string;
  options?: string[];
  answers: number | string | string[];
  explanation?: string;
  assets?: string[]; // Storage-URLs
  curriculumRefs?: string[]; // Referenzen zu Curriculum-Dokumenten
  createdBy: 'admin' | string; // 'admin' für globale Tasks
  createdAt: string;
}

export interface ParentTask {
  id: string;
  uploadId: string; // Referenz zu users/{uid}/uploads/{uploadId}
  subject: string;
  grade: 1 | 2 | 3 | 4;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'multiple-choice' | 'input' | 'drag-drop' | 'matching';
  stem: string;
  options?: string[];
  answers: number | string | string[];
  explanation?: string;
  assets?: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/**
 * Globale Aufgabe abrufen
 */
export async function getGlobalTask(taskId: string): Promise<GlobalTask | null> {
  try {
    const taskDoc = await getDoc(doc(db, 'globalTasks', taskId));
    if (taskDoc.exists()) {
      return { id: taskDoc.id, ...taskDoc.data() } as GlobalTask;
    }
  } catch (error) {
    console.error(`Fehler beim Laden von Task ${taskId}:`, error);
  }
  return null;
}

/**
 * Globale Aufgaben nach Fach/Klasse/Schwierigkeit abrufen
 */
export async function getGlobalTasks(
  subject: string,
  grade: 1 | 2 | 3 | 4,
  difficulty?: 'easy' | 'medium' | 'hard',
  limit: number = 50
): Promise<GlobalTask[]> {
  try {
    let q = query(
      collection(db, 'globalTasks'),
      where('subject', '==', subject),
      where('grade', '==', grade)
    );
    
    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }
    
    const snapshot = await getDocs(q);
    const tasks: GlobalTask[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as GlobalTask);
    });
    
    // Zufällig mischen und limitieren
    return tasks.sort(() => Math.random() - 0.5).slice(0, limit);
  } catch (error) {
    console.error(`Fehler beim Laden von Tasks für ${subject}/${grade}:`, error);
    return [];
  }
}

/**
 * Eltern-Aufgabe abrufen
 */
export async function getParentTask(
  userId: string,
  kidId: string,
  taskId: string
): Promise<ParentTask | null> {
  try {
    const taskDoc = await getDoc(
      doc(db, 'users', userId, 'kids', kidId, 'tasks', taskId)
    );
    if (taskDoc.exists()) {
      return { id: taskDoc.id, ...taskDoc.data() } as ParentTask;
    }
  } catch (error) {
    console.error(`Fehler beim Laden von Parent-Task ${taskId}:`, error);
  }
  return null;
}

/**
 * Eltern-Aufgaben für ein Kind abrufen
 */
export async function getParentTasks(
  userId: string,
  kidId: string,
  subject?: string,
  grade?: 1 | 2 | 3 | 4,
  status: 'approved' | 'pending' | 'rejected' = 'approved'
): Promise<ParentTask[]> {
  try {
    let q = query(
      collection(db, 'users', userId, 'kids', kidId, 'tasks'),
      where('status', '==', status)
    );
    
    if (subject) {
      q = query(q, where('subject', '==', subject));
    }
    
    if (grade) {
      q = query(q, where('grade', '==', grade));
    }
    
    const snapshot = await getDocs(q);
    const tasks: ParentTask[] = [];
    snapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() } as ParentTask);
    });
    
    return tasks;
  } catch (error) {
    console.error(`Fehler beim Laden von Parent-Tasks für ${kidId}:`, error);
    return [];
  }
}

/**
 * Kind-Einstellungen abrufen/speichern
 */
export interface KidSettings {
  grade: 1 | 2 | 3 | 4;
  mixMode: 'ratio' | 'interval';
  mixRatio: number; // 0.0 - 1.0 (bei ratio)
  intervalN: number; // Nach N globalen Tasks → 1 Eltern-Task (bei interval)
  gameCostsOverride?: Record<string, { costType: 'points' | 'time'; costValue: number }>;
}

export async function getKidSettings(
  userId: string,
  kidId: string
): Promise<KidSettings | null> {
  try {
    const settingsDoc = await getDoc(
      doc(db, 'users', userId, 'kids', kidId, 'settings', 'main')
    );
    if (settingsDoc.exists()) {
      return settingsDoc.data() as KidSettings;
    }
  } catch (error) {
    console.error(`Fehler beim Laden von Settings für ${kidId}:`, error);
  }
  return null;
}

export async function setKidSettings(
  userId: string,
  kidId: string,
  settings: Partial<KidSettings>
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', userId, 'kids', kidId, 'settings', 'main'),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Fehler beim Speichern von Settings für ${kidId}:`, error);
    throw error;
  }
}

