/**
 * Evaluierung und Qualitätssicherung für generierte Aufgaben
 * Prüft Qualität, Relevanz und Korrektheit der generierten Tasks
 */

/**
 * Evaluiert eine generierte Aufgabe
 * @param {Object} task - Die generierte Aufgabe
 * @param {string} originalText - Der ursprüngliche Text aus dem PDF
 * @param {string} subject - Das Fach
 * @param {number} grade - Die Klassenstufe
 * @returns {Object} Evaluationsergebnis mit Score und Feedback
 */
export function evaluateTask(task, originalText, subject, grade) {
  const issues = [];
  let score = 100;

  // 1. Prüfe ob stem vorhanden und nicht leer
  if (!task.stem || task.stem.trim().length === 0) {
    issues.push('Aufgabe hat keinen Text (stem)');
    score -= 30;
  } else if (task.stem.length < 10) {
    issues.push('Aufgabe ist zu kurz');
    score -= 10;
  }

  // 2. Prüfe ob answers vorhanden
  if (task.answers === undefined || task.answers === null) {
    issues.push('Aufgabe hat keine Antwort');
    score -= 25;
  }

  // 3. Prüfe Format-Konsistenz
  if (task.type === 'multiple-choice') {
    if (!Array.isArray(task.options) || task.options.length === 0) {
      issues.push('Multiple-Choice Aufgabe hat keine Optionen');
      score -= 20;
    } else if (task.options.length < 2) {
      issues.push('Multiple-Choice Aufgabe hat zu wenige Optionen');
      score -= 10;
    }
    if (typeof task.answers !== 'number') {
      issues.push('Multiple-Choice Antwort sollte ein Index (Zahl) sein');
      score -= 15;
    } else if (task.answers < 0 || task.answers >= task.options.length) {
      issues.push('Multiple-Choice Antwort-Index ist außerhalb des gültigen Bereichs');
      score -= 20;
    }
  } else if (task.type === 'input') {
    if (typeof task.answers !== 'string' || task.answers.trim().length === 0) {
      issues.push('Input-Aufgabe hat keine gültige Text-Antwort');
      score -= 20;
    }
  } else if (task.type === 'matching' || task.type === 'drag-drop') {
    if (!Array.isArray(task.answers)) {
      issues.push(`${task.type} Aufgabe hat keine Array-Antwort`);
      score -= 20;
    }
  } else if (task.type === 'fill-blank') {
    // fill-blank Validierung
    if (!Array.isArray(task.blanks) || task.blanks.length === 0) {
      issues.push('fill-blank Aufgabe hat keine blanks (Lösungen)');
      score -= 25;
    }
    if (!Array.isArray(task.blankOptions) || task.blankOptions.length === 0) {
      issues.push('fill-blank Aufgabe hat keine blankOptions');
      score -= 25;
    }
    if (task.blanks && task.blankOptions && task.blanks.length !== task.blankOptions.length) {
      issues.push('Anzahl blanks stimmt nicht mit blankOptions überein');
      score -= 15;
    }
    // Prüfe ob jede richtige Antwort in den Optionen ist
    if (task.blanks && task.blankOptions) {
      for (let i = 0; i < task.blanks.length; i++) {
        if (!task.blankOptions[i] || !task.blankOptions[i].includes(task.blanks[i])) {
          issues.push(`Lücke ${i + 1}: Richtige Antwort "${task.blanks[i]}" nicht in Optionen`);
          score -= 10;
        }
      }
    }
    if (!task.stem || !task.stem.includes('__')) {
      issues.push('fill-blank stem sollte "__" als Platzhalter enthalten');
      score -= 10;
    }
  } else if (task.type === 'word-classification') {
    // word-classification Validierung
    if (!Array.isArray(task.words) || task.words.length === 0) {
      issues.push('word-classification Aufgabe hat keine Wörter');
      score -= 25;
    }
    if (!Array.isArray(task.categories) || task.categories.length === 0) {
      issues.push('word-classification Aufgabe hat keine Kategorien');
      score -= 25;
    }
    if (!task.correctMapping || typeof task.correctMapping !== 'object') {
      issues.push('word-classification Aufgabe hat kein correctMapping');
      score -= 25;
    } else {
      // Prüfe ob alle Wörter eine Zuordnung haben
      if (task.words) {
        for (const word of task.words) {
          if (!task.correctMapping[word]) {
            issues.push(`Wort "${word}" hat keine Zuordnung`);
            score -= 10;
          } else if (!task.categories.includes(task.correctMapping[word])) {
            issues.push(`Wort "${word}" ist ungültiger Kategorie zugeordnet`);
            score -= 10;
          }
        }
      }
    }
    if (task.words && task.words.length < 3) {
      issues.push('word-classification sollte mindestens 3 Wörter haben');
      score -= 10;
    }
  } else if (task.type === 'number-input') {
    // number-input Validierung
    if (!Array.isArray(task.problems) || task.problems.length === 0) {
      issues.push('number-input Aufgabe hat keine problems');
      score -= 25;
    } else {
      for (let i = 0; i < task.problems.length; i++) {
        const problem = task.problems[i];
        if (!problem.question || !problem.answer) {
          issues.push(`Problem ${i + 1} ist unvollständig`);
          score -= 10;
        }
        if (problem.answer && isNaN(Number(problem.answer))) {
          issues.push(`Problem ${i + 1}: Antwort sollte eine Zahl sein`);
          score -= 10;
        }
      }
    }
    if (task.numberRange && (!Array.isArray(task.numberRange) || task.numberRange.length !== 2)) {
      issues.push('numberRange sollte ein Array mit 2 Zahlen sein [min, max]');
      score -= 5;
    }
    // Prüfe Zahlenraum je Klassenstufe
    if (task.numberRange && grade) {
      const [min, max] = task.numberRange;
      if (grade === 1 && max > 20) {
        issues.push('Klasse 1: Zahlenraum sollte max 20 sein');
        score -= 5;
      } else if (grade === 2 && max > 100) {
        issues.push('Klasse 2: Zahlenraum sollte max 100 sein');
        score -= 5;
      } else if (grade === 3 && max > 1000) {
        issues.push('Klasse 3: Zahlenraum sollte max 1000 sein');
        score -= 5;
      }
    }
  } else if (task.type === 'number-pyramid') {
    // number-pyramid Validierung
    if (!task.levels || task.levels < 2) {
      issues.push('number-pyramid sollte mindestens 2 Ebenen haben');
      score -= 15;
    }
    if (!Array.isArray(task.structure) || task.structure.length === 0) {
      issues.push('number-pyramid Aufgabe hat keine structure');
      score -= 25;
    } else {
      // Prüfe Pyramiden-Struktur
      if (task.structure.length !== task.levels) {
        issues.push(`Anzahl Ebenen (${task.levels}) stimmt nicht mit structure Länge (${task.structure.length}) überein`);
        score -= 15;
      }
      // Prüfe ob mindestens ein Feld leer ist
      let hasBlanks = false;
      for (const row of task.structure) {
        if (Array.isArray(row)) {
          for (const cell of row) {
            if (cell && cell.isBlank) {
              hasBlanks = true;
              break;
            }
          }
        }
        if (hasBlanks) break;
      }
      if (!hasBlanks) {
        issues.push('number-pyramid sollte mindestens ein leeres Feld haben');
        score -= 10;
      }
    }
  } else if (task.type === 'word-problem') {
    // word-problem Validierung
    if (!task.correctAnswer || task.correctAnswer.trim().length === 0) {
      issues.push('word-problem Aufgabe hat keine correctAnswer');
      score -= 25;
    }
    if (task.correctAnswer && isNaN(Number(task.correctAnswer))) {
      issues.push('word-problem Antwort sollte eine Zahl sein');
      score -= 15;
    }
    if (!task.calculation || task.calculation.trim().length === 0) {
      issues.push('word-problem Aufgabe hat keine calculation');
      score -= 10;
    }
    if (!task.context) {
      issues.push('word-problem Aufgabe hat keinen context');
      score -= 5;
    }
    if (!task.unit) {
      issues.push('word-problem Aufgabe hat keine unit');
      score -= 5;
    }
  }

  // 4. Prüfe Erklärung
  if (!task.explanation || task.explanation.trim().length === 0) {
    issues.push('Aufgabe hat keine Erklärung');
    score -= 10;
  } else if (task.explanation.length < 20) {
    issues.push('Erklärung ist zu kurz');
    score -= 5;
  }

  // 5. Prüfe Schwierigkeit
  if (!task.difficulty || !['leicht', 'mittel', 'schwer'].includes(task.difficulty)) {
    issues.push('Schwierigkeit fehlt oder ist ungültig');
    score -= 5;
  }

  // 6. Prüfe Relevanz zum Original (einfache Heuristik)
  const originalLower = originalText.toLowerCase();
  const stemLower = task.stem.toLowerCase();
  
  // Prüfe ob wichtige Begriffe aus dem Original in der Aufgabe vorkommen
  const originalWords = originalLower.split(/\s+/).filter(w => w.length > 4);
  const matchingWords = originalWords.filter(word => stemLower.includes(word));
  const relevanceScore = originalWords.length > 0 
    ? (matchingWords.length / originalWords.length) * 100 
    : 50;
  
  if (relevanceScore < 20) {
    issues.push('Aufgabe scheint nicht zum Original-Material zu passen');
    score -= 15;
  }

  // 7. Prüfe Altersgerechtheit (einfache Heuristik)
  const stemLength = task.stem.length;
  const avgWordLength = task.stem.split(/\s+/).reduce((sum, w) => sum + w.length, 0) / task.stem.split(/\s+/).length;
  
  if (grade <= 2) {
    // Klasse 1-2: Kurze, einfache Sätze
    if (stemLength > 100) {
      issues.push('Aufgabe ist zu lang für Klasse 1-2');
      score -= 5;
    }
    if (avgWordLength > 6) {
      issues.push('Aufgabe verwendet zu komplexe Wörter für Klasse 1-2');
      score -= 5;
    }
  }

  // Score darf nicht negativ sein
  score = Math.max(0, score);

  return {
    score,
    issues,
    passed: score >= 70, // Mindest-Score für Akzeptanz
    relevanceScore,
  };
}

/**
 * Evaluiert mehrere generierte Aufgaben
 * @param {Array} tasks - Array von generierten Aufgaben
 * @param {string} originalText - Der ursprüngliche Text aus dem PDF
 * @param {string} subject - Das Fach
 * @param {number} grade - Die Klassenstufe
 * @returns {Object} Gesamt-Evaluationsergebnis
 */
export function evaluateTasks(tasks, originalText, subject, grade) {
  if (!tasks || tasks.length === 0) {
    return {
      overallScore: 0,
      passed: false,
      totalTasks: 0,
      passedTasks: 0,
      evaluations: [],
      issues: ['Keine Aufgaben zum Evaluieren'],
    };
  }

  const evaluations = tasks.map(task => evaluateTask(task, originalText, subject, grade));
  const passedTasks = evaluations.filter(e => e.passed).length;
  const overallScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
  const allIssues = evaluations.flatMap(e => e.issues);

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    passed: overallScore >= 70 && passedTasks >= Math.ceil(tasks.length * 0.8), // 80% müssen passen
    totalTasks: tasks.length,
    passedTasks,
    evaluations,
    issues: [...new Set(allIssues)], // Eindeutige Issues
    averageRelevanceScore: evaluations.reduce((sum, e) => sum + e.relevanceScore, 0) / evaluations.length,
  };
}

/**
 * Validiert ob eine Aufgabe zum erkannten Arbeitsblatt-Typ passt
 * @param {Object} task - Die Aufgabe
 * @param {string} worksheetType - Der erkannte Arbeitsblatt-Typ
 * @param {Array} taskFormats - Die erkannten Aufgabenformate
 * @returns {boolean} Ob die Aufgabe zum Typ passt
 */
export function validateTaskFormat(task, worksheetType, taskFormats) {
  // Wenn kein Typ erkannt wurde, akzeptiere alles
  if (!worksheetType || worksheetType === 'Unbekannt') {
    return true;
  }

  // Prüfe ob der Task-Typ zu den erkannten Formaten passt
  if (taskFormats && taskFormats.length > 0) {
    if (!taskFormats.includes(task.type)) {
      console.warn(`⚠️ Task-Typ ${task.type} passt nicht zu erkannten Formaten: ${taskFormats.join(', ')}`);
      return false;
    }
  }

  return true;
}

