/**
 * Mischlogik für Aufgaben-Auswahl
 * Kombiniert globale Tasks mit Eltern-Uploads basierend auf Einstellungen
 */

import { getGlobalTasks, getParentTasks, getKidSettings, type GlobalTask, type ParentTask } from './tasks';

export interface TaskCandidate {
  source: 'global' | 'parent';
  task: GlobalTask | ParentTask;
}

/**
 * Aufgaben-Kandidaten für ein Kind abrufen (gemischt)
 */
export async function getMixedTasks(
  userId: string,
  kidId: string,
  subject: string,
  grade: 1 | 2 | 3 | 4,
  difficulty?: 'easy' | 'medium' | 'hard',
  count: number = 10
): Promise<TaskCandidate[]> {
  // Einstellungen laden
  const settings = await getKidSettings(userId, kidId);
  const mixMode = settings?.mixMode ?? 'interval';
  const mixRatio = settings?.mixRatio ?? 0.2;
  const intervalN = settings?.intervalN ?? 5;
  
  // Beide Pools laden
  const [globalCandidates, parentCandidates] = await Promise.all([
    getGlobalTasks(subject, grade, difficulty, count * 2),
    getParentTasks(userId, kidId, subject, grade, 'approved'),
  ]);
  
  const candidates: TaskCandidate[] = [];
  
  if (mixMode === 'ratio') {
    // Ratio-Modus: Zufällige Mischung basierend auf mixRatio
    const totalNeeded = count;
    const parentCount = Math.floor(totalNeeded * mixRatio);
    const globalCount = totalNeeded - parentCount;
    
    // Zufällig auswählen
    const shuffledGlobal = [...globalCandidates].sort(() => Math.random() - 0.5);
    const shuffledParent = [...parentCandidates].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < globalCount && i < shuffledGlobal.length; i++) {
      candidates.push({ source: 'global', task: shuffledGlobal[i] });
    }
    
    for (let i = 0; i < parentCount && i < shuffledParent.length; i++) {
      candidates.push({ source: 'parent', task: shuffledParent[i] });
    }
    
    // Zufällig mischen
    return candidates.sort(() => Math.random() - 0.5);
  } else {
    // Interval-Modus: Nach N globalen Tasks → 1 Eltern-Task
    let globalIndex = 0;
    let parentIndex = 0;
    let sinceLastParent = 0;
    
    while (candidates.length < count) {
      if (sinceLastParent >= intervalN && parentIndex < parentCandidates.length) {
        // Eltern-Task einfügen
        candidates.push({
          source: 'parent',
          task: parentCandidates[parentIndex],
        });
        parentIndex++;
        sinceLastParent = 0;
      } else if (globalIndex < globalCandidates.length) {
        // Global-Task einfügen
        candidates.push({
          source: 'global',
          task: globalCandidates[globalIndex],
        });
        globalIndex++;
        sinceLastParent++;
      } else {
        // Keine Tasks mehr verfügbar
        break;
      }
    }
    
    return candidates;
  }
}

/**
 * Nächste Aufgabe für ein Kind abrufen
 */
export async function getNextTask(
  userId: string,
  kidId: string,
  subject: string,
  grade: 1 | 2 | 3 | 4,
  difficulty?: 'easy' | 'medium' | 'hard'
): Promise<TaskCandidate | null> {
  const candidates = await getMixedTasks(userId, kidId, subject, grade, difficulty, 1);
  return candidates[0] ?? null;
}

