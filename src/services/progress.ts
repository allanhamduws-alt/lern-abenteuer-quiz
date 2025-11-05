/**
 * Fortschritts-Tracking Service
 * Verwaltet Fortschritt, schwierige Aufgaben und Lernstreaks
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  Progress,
  SubjectProgress,
  DifficultQuestion,
  QuizResult,
  Question,
} from '../types';

/**
 * Initialisiert leeren Fortschritt für neuen Benutzer
 */
export function createEmptyProgress(): Progress {
  const subjects: Progress['subjects'] = {
    mathematik: createEmptySubjectProgress('mathematik'),
    deutsch: createEmptySubjectProgress('deutsch'),
    naturwissenschaften: createEmptySubjectProgress('naturwissenschaften'),
    kunst: createEmptySubjectProgress('kunst'),
    logik: createEmptySubjectProgress('logik'),
  };

  return {
    totalQuizzesCompleted: 0,
    totalPoints: 0,
    subjects,
    difficultQuestions: [],
    badges: [],
    learningStreak: {
      current: 0,
      longest: 0,
      lastActivity: new Date().toISOString(),
    },
    lastActivity: new Date().toISOString(),
  };
}

/**
 * Erstellt leeren Fach-Fortschritt
 */
function createEmptySubjectProgress(
  subject: SubjectProgress['subject']
): SubjectProgress {
  return {
    subject,
    quizzesCompleted: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    topicsMastered: [],
    topicsNeedingPractice: [],
  };
}

/**
 * Lädt Fortschritt aus Firestore
 */
export async function loadProgress(userId: string): Promise<Progress> {
  try {
    const progressRef = doc(db, 'progress', userId);
    const progressDoc = await getDoc(progressRef);

    if (progressDoc.exists()) {
      return progressDoc.data() as Progress;
    }

    // Neuen Fortschritt erstellen
    const newProgress = createEmptyProgress();
    await setDoc(progressRef, newProgress);
    return newProgress;
  } catch (error) {
    console.error('Fehler beim Laden des Fortschritts:', error);
    return createEmptyProgress();
  }
}

/**
 * Speichert Fortschritt in Firestore
 */
export async function saveProgress(
  userId: string,
  progress: Progress
): Promise<void> {
  try {
    const progressRef = doc(db, 'progress', userId);
    console.log('📝 Speichere Progress in Firebase:', {
      userId,
      totalQuizzesCompleted: progress.totalQuizzesCompleted,
      totalPoints: progress.totalPoints,
      mathematik: {
        quizzesCompleted: progress.subjects.mathematik.quizzesCompleted,
        totalQuestions: progress.subjects.mathematik.totalQuestions,
        correctAnswers: progress.subjects.mathematik.correctAnswers,
      },
    });
    
    await setDoc(progressRef, progress, { merge: true });
    
    // Verifiziere dass es gespeichert wurde
    const verificationDoc = await getDoc(progressRef);
    if (verificationDoc.exists()) {
      const savedData = verificationDoc.data();
      console.log('✅ Progress erfolgreich gespeichert und verifiziert!', {
        totalQuizzesCompleted: savedData.totalQuizzesCompleted,
        totalPoints: savedData.totalPoints,
      });
    } else {
      throw new Error('Progress wurde nicht gespeichert - Dokument existiert nicht');
    }
  } catch (error: any) {
    console.error('❌ Fehler beim Speichern des Fortschritts:', error);
    console.error('Fehler-Details:', {
      code: error?.code,
      message: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
}

/**
 * Aktualisiert Fortschritt nach Quiz-Abschluss
 */
export async function updateProgressAfterQuiz(
  userId: string,
  subject: SubjectProgress['subject'],
  results: QuizResult[],
  questions: Question[]
): Promise<Progress> {
  console.log('🔄 Aktualisiere Progress nach Quiz:', {
    userId,
    subject,
    resultsCount: results.length,
    questionsCount: questions.length,
  });

  let progress: Progress;
  try {
    progress = await loadProgress(userId);
    console.log('📖 Aktueller Progress geladen:', {
      totalQuizzesCompleted: progress.totalQuizzesCompleted,
      totalPoints: progress.totalPoints,
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden des Progress:', error);
    throw new Error(`Konnte Progress nicht laden: ${error}`);
  }

  // Gesamt-Statistiken aktualisieren
  const oldTotalQuizzes = progress.totalQuizzesCompleted;
  const oldTotalPoints = progress.totalPoints;
  
  progress.totalQuizzesCompleted += 1;
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  progress.totalPoints += totalPoints;

  console.log('📊 Gesamt-Statistiken aktualisiert:', {
    alteQuizzes: oldTotalQuizzes,
    neueQuizzes: progress.totalQuizzesCompleted,
    altePunkte: oldTotalPoints,
    neuePunkte: progress.totalPoints,
    hinzugefügtePunkte: totalPoints,
  });

  // Fach-Statistiken aktualisieren
  const subjectProgress = progress.subjects[subject];
  const oldSubjectStats = {
    quizzesCompleted: subjectProgress.quizzesCompleted,
    totalQuestions: subjectProgress.totalQuestions,
    correctAnswers: subjectProgress.correctAnswers,
  };
  
  subjectProgress.quizzesCompleted += 1;
  subjectProgress.totalQuestions += results.length;
  subjectProgress.correctAnswers += results.filter((r) => r.isCorrect).length;
  subjectProgress.averageScore = Math.round(
    (subjectProgress.correctAnswers / subjectProgress.totalQuestions) * 100
  );
  subjectProgress.lastPlayed = new Date().toISOString();

  console.log(`📚 ${subject} Statistiken aktualisiert:`, {
    alt: oldSubjectStats,
    neu: {
      quizzesCompleted: subjectProgress.quizzesCompleted,
      totalQuestions: subjectProgress.totalQuestions,
      correctAnswers: subjectProgress.correctAnswers,
      averageScore: subjectProgress.averageScore,
    },
  });

  // Themen-Tracking (falls vorhanden)
  questions.forEach((question) => {
    if (question.topic) {
      const result = results.find((r) => r.questionId === question.id);
      if (result?.isCorrect) {
        // Thema als gemeistert markieren, wenn nicht bereits drin
        if (!subjectProgress.topicsMastered.includes(question.topic)) {
          subjectProgress.topicsMastered.push(question.topic);
        }
        // Aus "Braucht Übung" entfernen
        const practiceIndex = subjectProgress.topicsNeedingPractice.indexOf(
          question.topic
        );
        if (practiceIndex > -1) {
          subjectProgress.topicsNeedingPractice.splice(practiceIndex, 1);
        }
      }
    }
  });

  // Schwierige Aufgaben tracken
  results.forEach((result) => {
    if (!result.isCorrect) {
      const question = questions.find((q) => q.id === result.questionId);
      if (question) {
        updateDifficultQuestion(progress, question.id);
      }
    } else {
      // Bei richtiger Antwort prüfen, ob es vorher eine schwierige Aufgabe war
      const difficultIndex = progress.difficultQuestions.findIndex(
        (dq) => dq.questionId === result.questionId
      );
      if (difficultIndex > -1) {
        const difficultQ = progress.difficultQuestions[difficultIndex];
        // Wenn bereits 2+ Versuche, jetzt aber richtig → als gemeistert markieren
        if (difficultQ.attempts >= 2) {
          difficultQ.mastered = true;
          difficultQ.nextReview = undefined; // Nicht mehr wiederholen
        }
      }
    }
  });

  // Lernstreak aktualisieren
  updateLearningStreak(progress);

  // Letzte Aktivität aktualisieren
  progress.lastActivity = new Date().toISOString();

  console.log('💾 Speichere aktualisierten Progress...');
  await saveProgress(userId, progress);
  console.log('✅ Progress erfolgreich aktualisiert und gespeichert!');
  
  return progress;
}

/**
 * Aktualisiert oder fügt schwierige Aufgabe hinzu
 */
function updateDifficultQuestion(progress: Progress, questionId: string): void {
  const existingIndex = progress.difficultQuestions.findIndex(
    (dq) => dq.questionId === questionId
  );

  if (existingIndex > -1) {
    // Existierende schwierige Aufgabe aktualisieren
    const difficultQ = progress.difficultQuestions[existingIndex];
    difficultQ.attempts += 1;
    difficultQ.lastAttempt = new Date().toISOString();

    // Nach 3 Versuchen: für Wiederholung in 3 Tagen planen
    if (difficultQ.attempts >= 3 && !difficultQ.nextReview) {
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 3);
      difficultQ.nextReview = nextReview.toISOString();
    }
  } else {
    // Neue schwierige Aufgabe hinzufügen
    const now = new Date().toISOString();
    progress.difficultQuestions.push({
      questionId,
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      mastered: false,
    });
  }
}

/**
 * Aktualisiert Lernstreak
 */
function updateLearningStreak(progress: Progress): void {
  const now = new Date();
  const lastActivity = new Date(progress.learningStreak.lastActivity);

  // Prüfe ob letzte Aktivität heute war
  const isToday =
    now.toDateString() === lastActivity.toDateString();

  // Prüfe ob letzte Aktivität gestern war
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday =
    lastActivity.toDateString() === yesterday.toDateString();

  if (isToday) {
    // Bereits heute aktiv → nichts ändern
    return;
  } else if (wasYesterday) {
    // Gestern aktiv → Streak fortsetzen
    progress.learningStreak.current += 1;
  } else {
    // Mehr als 1 Tag vergangen → Streak zurücksetzen
    progress.learningStreak.current = 1;
  }

  // Längsten Streak aktualisieren
  if (progress.learningStreak.current > progress.learningStreak.longest) {
    progress.learningStreak.longest = progress.learningStreak.current;
  }

  progress.learningStreak.lastActivity = now.toISOString();
}

/**
 * Gibt schwierige Aufgaben zurück, die wiederholt werden sollten
 */
export function getQuestionsForReview(
  progress: Progress,
  maxCount: number = 5
): string[] {
  const now = new Date().toISOString();

  // Finde Aufgaben die:
  // 1. Nicht gemeistert sind
  // 2. Entweder nextReview erreicht wurde oder noch nicht gesetzt ist
  const reviewQuestions = progress.difficultQuestions
    .filter((dq) => {
      if (dq.mastered) return false;
      if (!dq.nextReview) return true; // Noch keine Wiederholung geplant
      return dq.nextReview <= now; // Wiederholungszeitpunkt erreicht
    })
    .sort((a, b) => {
      // Sortiere nach Anzahl Versuche (mehr Versuche = höhere Priorität)
      return b.attempts - a.attempts;
    })
    .slice(0, maxCount)
    .map((dq) => dq.questionId);

  return reviewQuestions;
}

/**
 * Gibt alle schwierigen Aufgaben zurück
 */
export function getAllDifficultQuestions(
  progress: Progress
): DifficultQuestion[] {
  return progress.difficultQuestions.filter((dq) => !dq.mastered);
}

/**
 * Markiert eine Frage als gemeistert
 */
export async function markQuestionAsMastered(
  userId: string,
  questionId: string
): Promise<void> {
  const progress = await loadProgress(userId);
  const difficultQ = progress.difficultQuestions.find(
    (dq) => dq.questionId === questionId
  );

  if (difficultQ) {
    difficultQ.mastered = true;
    difficultQ.nextReview = undefined;
    await saveProgress(userId, progress);
  }
}

