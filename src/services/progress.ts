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
import { checkEarnedBadges } from '../data/badges';
import { 
  generateDailyChallenge, 
  isChallengeCurrent, 
  calculateChallengeProgress 
} from './dailyChallenge';

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
    dailyChallenge: generateDailyChallenge(),
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
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    skillLevel: 0.0, // Start mit 0.0 (Anfänger) für adaptive Fragen-Auswahl
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
      const progress = progressDoc.data() as Progress;
      
      // Level für alle Fächer berechnen, falls nicht vorhanden
      Object.values(progress.subjects).forEach((subjectProgress) => {
        if (!subjectProgress.level) {
          const levelData = calculateLevel(subjectProgress);
          subjectProgress.level = levelData.level;
          subjectProgress.xp = levelData.xp;
          subjectProgress.xpToNextLevel = levelData.xpToNextLevel;
        }
        
        // Skill-Level initialisieren, falls nicht vorhanden
        if (subjectProgress.skillLevel === undefined) {
          subjectProgress.skillLevel = calculateSkillLevel(subjectProgress);
        }
      });
      
      // Daily Challenge prüfen und aktualisieren
      if (!progress.dailyChallenge || !isChallengeCurrent(progress.dailyChallenge)) {
        progress.dailyChallenge = generateDailyChallenge();
      }
      
      return progress;
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
  questions: Question[],
  quizDurationSeconds?: number
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
    level: subjectProgress.level || 1,
  };
  
  subjectProgress.quizzesCompleted += 1;
  subjectProgress.totalQuestions += results.length;
  subjectProgress.correctAnswers += results.filter((r) => r.isCorrect).length;
  subjectProgress.averageScore = Math.round(
    (subjectProgress.correctAnswers / subjectProgress.totalQuestions) * 100
  );
  subjectProgress.lastPlayed = new Date().toISOString();

  // Level berechnen und aktualisieren
  const levelData = calculateLevel(subjectProgress);
  subjectProgress.level = levelData.level;
  subjectProgress.xp = levelData.xp;
  subjectProgress.xpToNextLevel = levelData.xpToNextLevel;

  // NEUER ADAPTIVER ALGORITHMUS: Skill-Level aktualisieren
  const oldSkillLevel = subjectProgress.skillLevel !== undefined 
    ? subjectProgress.skillLevel 
    : calculateSkillLevel(subjectProgress);
  
  // Berechne Quiz-Performance (0-1)
  const quizPerformance = results.length > 0 
    ? results.filter((r) => r.isCorrect).length / results.length 
    : 0;
  
  // Berechne erwartete Performance basierend auf Fragen-Schwierigkeit
  const expectedPerformance = calculateExpectedPerformance(questions);
  
  // Aktualisiere Skill-Level basierend auf Performance
  const newSkillLevel = updateSkillLevelAfterQuiz(
    oldSkillLevel,
    quizPerformance,
    expectedPerformance
  );
  
  subjectProgress.skillLevel = newSkillLevel;
  
  console.log('📊 Skill-Level aktualisiert:', {
    fach: subject,
    alt: oldSkillLevel,
    neu: newSkillLevel,
    quizPerformance: Math.round(quizPerformance * 100) + '%',
    expectedPerformance: Math.round(expectedPerformance * 100) + '%',
  });

  console.log(`📚 ${subject} Statistiken aktualisiert:`, {
    alt: oldSubjectStats,
    neu: {
      quizzesCompleted: subjectProgress.quizzesCompleted,
      totalQuestions: subjectProgress.totalQuestions,
      correctAnswers: subjectProgress.correctAnswers,
      averageScore: subjectProgress.averageScore,
      level: subjectProgress.level,
      xp: subjectProgress.xp,
      xpToNextLevel: subjectProgress.xpToNextLevel,
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

  // Daily Challenge aktualisieren
  if (progress.dailyChallenge && isChallengeCurrent(progress.dailyChallenge)) {
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    const isPerfect = results.every((r) => r.isCorrect);
    
    // Challenge-Fortschritt aktualisieren
    const updatedChallenge = calculateChallengeProgress(
      progress.dailyChallenge,
      progress,
      {
        correctAnswersToday: correctAnswers,
        pointsToday: totalPoints,
        perfectQuizzesToday: isPerfect ? 1 : 0,
      }
    );
    
    // Prüfe ob Challenge gerade erfüllt wurde (war vorher nicht erfüllt)
    const wasCompletedBefore = progress.dailyChallenge.completed;
    const isCompletedNow = updatedChallenge.completed;
    
    if (!wasCompletedBefore && isCompletedNow) {
      // Bonus-Punkte vergeben
      progress.totalPoints += updatedChallenge.bonusPoints;
      console.log(`🎉 Tägliche Challenge erfüllt! +${updatedChallenge.bonusPoints} Bonus-Punkte!`);
    }
    
    progress.dailyChallenge = updatedChallenge;
  }

  // Badges prüfen und verleihen
  const isPerfect = results.every((r) => r.isCorrect);
  const totalTimeSeconds = quizDurationSeconds || results.reduce((sum, r) => (r.timeSpent || 0) + sum, 0);
  
  const newlyEarnedBadges = checkEarnedBadges(progress, {
    isPerfect,
    totalTimeSeconds,
  });

  if (newlyEarnedBadges.length > 0) {
    newlyEarnedBadges.forEach((badgeId) => {
      if (!progress.badges.includes(badgeId)) {
        progress.badges.push(badgeId);
        console.log(`🏆 Neues Badge verdient: ${badgeId}`);
      }
    });
  }

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
 * Berechnet Level basierend auf Fach-Fortschritt
 * Formel: Level 1-10 basierend auf XP
 * Level 1: 0-99 XP, Level 2: 100-249 XP, Level 3: 250-449 XP, etc.
 */
export function calculateLevel(subjectProgress: SubjectProgress): {
  level: number;
  xp: number;
  xpToNextLevel: number;
} {
  // Basis-XP berechnen
  const baseXP = subjectProgress.quizzesCompleted * 10 + 
                 subjectProgress.correctAnswers * 2 + 
                 Math.floor(subjectProgress.averageScore / 10);
  
  // Level-Berechnung für Level 1-10
  // Level 1: 0-99 XP
  // Level 2: 100-249 XP
  // Level 3: 250-449 XP
  // Level 4: 450-699 XP
  // Level 5: 700-999 XP
  // Level 6: 1000-1349 XP
  // Level 7: 1350-1749 XP
  // Level 8: 1750-2199 XP
  // Level 9: 2200-2699 XP
  // Level 10: 2700+ XP
  
  let level = 1;
  let xpThreshold = 0;
  
  if (baseXP >= 2700) {
    level = 10;
    xpThreshold = 2700;
  } else if (baseXP >= 2200) {
    level = 9;
    xpThreshold = 2200;
  } else if (baseXP >= 1750) {
    level = 8;
    xpThreshold = 1750;
  } else if (baseXP >= 1350) {
    level = 7;
    xpThreshold = 1350;
  } else if (baseXP >= 1000) {
    level = 6;
    xpThreshold = 1000;
  } else if (baseXP >= 700) {
    level = 5;
    xpThreshold = 700;
  } else if (baseXP >= 450) {
    level = 4;
    xpThreshold = 450;
  } else if (baseXP >= 250) {
    level = 3;
    xpThreshold = 250;
  } else if (baseXP >= 100) {
    level = 2;
    xpThreshold = 100;
  }
  
  // XP für aktuelles Level berechnen
  const xp = baseXP - xpThreshold;
  
  // XP für nächstes Level berechnen
  let nextLevelThreshold = 0;
  if (level === 1) nextLevelThreshold = 100;
  else if (level === 2) nextLevelThreshold = 250;
  else if (level === 3) nextLevelThreshold = 450;
  else if (level === 4) nextLevelThreshold = 700;
  else if (level === 5) nextLevelThreshold = 1000;
  else if (level === 6) nextLevelThreshold = 1350;
  else if (level === 7) nextLevelThreshold = 1750;
  else if (level === 8) nextLevelThreshold = 2200;
  else if (level === 9) nextLevelThreshold = 2700;
  else nextLevelThreshold = Infinity; // Level 10 ist Maximum
  
  const xpToNextLevel = nextLevelThreshold - xpThreshold;
  
  return {
    level: Math.min(level, 10), // Max Level 10
    xp: Math.max(0, xp),
    xpToNextLevel: xpToNextLevel === Infinity ? 0 : xpToNextLevel,
  };
}

/**
 * Prüft ob Level-Up aufgetreten ist
 */
export function checkLevelUp(
  oldProgress: SubjectProgress,
  newProgress: SubjectProgress
): boolean {
  const oldLevel = oldProgress.level || 1;
  const newLevel = calculateLevel(newProgress).level;
  
  return newLevel > oldLevel;
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

/**
 * ADAPTIVER LERN-ALGORITHMUS
 * Berechnet Skill-Level eines Schülers für ein Fach
 * Gibt Wert zwischen 0.0 (Anfänger) und 1.0 (Experte) zurück
 * 
 * Berücksichtigt:
 * - Durchschnittliche Erfolgsrate (50% Gewichtung)
 * - Erfahrung/Level (30% Gewichtung)
 * - Konsistenz (20% Gewichtung)
 * 
 * Basierend auf Zone of Proximal Development (ZPD) Prinzipien
 */
export function calculateSkillLevel(subjectProgress: SubjectProgress): number {
  // 1. Basis-Performance (0-1)
  const averageScore = subjectProgress.averageScore / 100; // 0.0 bis 1.0
  
  // 2. Erfahrungs-Level (0-1)
  // Level 1-10 wird zu 0.0-1.0 skaliert
  const level = Math.min(10, subjectProgress.level || 1);
  const experienceLevel = (level - 1) / 9; // 0.0 (Level 1) bis 1.0 (Level 10)
  
  // 3. Konsistenz-Bonus
  // Wenn Schüler viele Quizzes gemacht hat → konsistenter
  const quizCount = subjectProgress.quizzesCompleted;
  const consistency = Math.min(1, quizCount / 10); // Nach 10 Quizzes = konsistent
  
  // 4. Kombiniere Faktoren (gewichtete Summe)
  const skillLevel = (
    averageScore * 0.5 +        // 50%: Gesamt-Performance
    experienceLevel * 0.3 +     // 30%: Erfahrung/Level
    consistency * 0.2            // 20%: Konsistenz
  );
  
  // 5. Sicherheitsgrenzen
  // Neue Schüler (weniger als 3 Quizzes) → starte konservativ
  if (quizCount < 3) {
    return Math.min(0.3, skillLevel); // Max 30% Skill-Level für Anfänger
  }
  
  return Math.max(0, Math.min(1, skillLevel)); // Zwischen 0 und 1
}

/**
 * Bestimmt optimale Schwierigkeits-Verteilung basierend auf Skill-Level
 * Ziel: ~80% Erfolgsrate (Zone of Proximal Development)
 * 
 * Prinzipien:
 * - Anfänger: Viele leichte Fragen zum Aufbauen
 * - Fortgeschritten: Ausgewogene Mischung
 * - Experte: Hauptsächlich schwere Fragen
 */
export function getOptimalDifficultyDistribution(skillLevel: number): {
  easy: number;
  medium: number;
  hard: number;
} {
  // Ziel: Schüler sollte ~80% der Fragen richtig beantworten können
  // Skill-Level 0.0 → 80% leichte Fragen
  // Skill-Level 1.0 → 20% leichte Fragen
  
  // Lineare Interpolation mit Sicherheitsgrenzen
  let easyRatio: number;
  let mediumRatio: number;
  let hardRatio: number;
  
  if (skillLevel < 0.2) {
    // Anfänger: Viele leichte Fragen zum Aufbauen
    easyRatio = 0.7;
    mediumRatio = 0.25;
    hardRatio = 0.05;
  } else if (skillLevel < 0.4) {
    // Leicht fortgeschritten: Mehr leichte, aber auch mittlere
    easyRatio = 0.5;
    mediumRatio = 0.4;
    hardRatio = 0.1;
  } else if (skillLevel < 0.6) {
    // Fortgeschritten: Ausgewogen
    easyRatio = 0.3;
    mediumRatio = 0.5;
    hardRatio = 0.2;
  } else if (skillLevel < 0.8) {
    // Sehr fortgeschritten: Mehr mittlere und schwere
    easyRatio = 0.15;
    mediumRatio = 0.45;
    hardRatio = 0.4;
  } else {
    // Experte: Hauptsächlich schwere Fragen
    easyRatio = 0.1;
    mediumRatio = 0.3;
    hardRatio = 0.6;
  }
  
  // Sicherheitsgrenzen: Mindestens 1 leichte Frage, nie nur schwere
  return {
    easy: Math.max(0.1, easyRatio),   // Mindestens 10% leichte Fragen
    medium: mediumRatio,
    hard: Math.min(0.7, hardRatio),   // Maximal 70% schwere Fragen
  };
}

/**
 * Berechnet erwartete Performance basierend auf Fragen-Schwierigkeit
 * Gibt Wert zwischen 0.0 und 1.0 zurück
 */
export function calculateExpectedPerformance(questions: Question[]): number {
  if (questions.length === 0) return 0.5;
  
  // Schätze erwartete Erfolgsrate basierend auf Schwierigkeit
  let expectedCorrect = 0;
  
  questions.forEach((q) => {
    if (q.difficulty === 'leicht' || !q.difficulty) {
      expectedCorrect += 0.85; // 85% Erfolgsrate bei leichten Fragen
    } else if (q.difficulty === 'mittel') {
      expectedCorrect += 0.70; // 70% Erfolgsrate bei mittleren Fragen
    } else if (q.difficulty === 'schwer') {
      expectedCorrect += 0.55; // 55% Erfolgsrate bei schweren Fragen
    } else {
      expectedCorrect += 0.70; // Standard
    }
  });
  
  return expectedCorrect / questions.length;
}

/**
 * Aktualisiert Skill-Level nach Quiz basierend auf Performance
 * Langsame Anpassung (12% pro Quiz) um Frustration zu vermeiden
 * 
 * Sicherheitsmechanismen:
 * - Maximal 20% Änderung pro Quiz
 * - Langsame Anpassung für Stabilität
 */
export function updateSkillLevelAfterQuiz(
  oldSkillLevel: number,
  quizPerformance: number, // 0-1 (richtige Antworten / Gesamt)
  expectedPerformance: number // 0-1 (erwartete Performance basierend auf Fragen-Schwierigkeit)
): number {
  // Berechne Performance-Gap
  const performanceGap = quizPerformance - expectedPerformance;
  
  // Anpassungsrate: Langsam für Stabilität
  // Wenn Performance besser als erwartet → Skill-Level erhöhen
  // Wenn Performance schlechter als erwartet → Skill-Level leicht senken
  const adjustmentRate = 0.12; // 12% Anpassung pro Quiz (langsam!)
  const adjustment = performanceGap * adjustmentRate;
  
  // Neue Skill-Level berechnen
  let newSkillLevel = oldSkillLevel + adjustment;
  
  // Sicherheitsgrenzen: Nicht zu aggressiv
  // Maximal 20% Änderung pro Quiz
  const maxChange = 0.2;
  if (Math.abs(adjustment) > maxChange) {
    newSkillLevel = oldSkillLevel + (adjustment > 0 ? maxChange : -maxChange);
  }
  
  // Grenzen: Zwischen 0 und 1
  return Math.max(0, Math.min(1, newSkillLevel));
}

