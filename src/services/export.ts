/**
 * Export-Service
 * Generiert Berichte für Export als Text/PDF
 */

import type { User, Progress } from '../types';
import { getAllBadges, getBadgeById } from '../data/badges';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: '🔢' },
  { id: 'deutsch', name: 'Deutsch', icon: '📚' },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: '🔬' },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: '🎨' },
  { id: 'logik', name: 'Logik & Minispiele', icon: '🧩' },
] as const;

/**
 * Generiert einen Fortschrittsbericht als Text
 */
export function generateProgressReport(
  child: User,
  progress: Progress
): string {
  const date = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let report = `========================================
FORTSCHRITTSBERICHT: ${child.name}
Datum: ${date}
========================================\n\n`;

  // Gesamt-Statistiken
  report += `📊 GESAMT-STATISTIKEN\n`;
  report += `────────────────────────────────────────\n`;
  report += `Quizzes abgeschlossen: ${progress.totalQuizzesCompleted}\n`;
  report += `Gesamt-Punkte: ${progress.totalPoints}\n`;
  report += `Aktueller Lernstreak: ${progress.learningStreak.current} Tage\n`;
  report += `Bester Lernstreak: ${progress.learningStreak.longest} Tage\n`;
  report += `Badges gesammelt: ${progress.badges.length} von ${getAllBadges().length}\n\n`;

  // Fach-Statistiken
  report += `📚 FORTSCHRITT NACH FACH\n`;
  report += `────────────────────────────────────────\n`;
  
  subjects.forEach((subject) => {
    const subjectProgress =
      progress.subjects[subject.id as keyof typeof progress.subjects];
    const progressPercent =
      subjectProgress.totalQuestions > 0
        ? Math.round(
            (subjectProgress.correctAnswers /
              subjectProgress.totalQuestions) *
              100
          )
        : 0;

    report += `\n${subject.name} ${subject.icon}\n`;
    report += `  Quizzes: ${subjectProgress.quizzesCompleted}\n`;
    report += `  Richtige Antworten: ${subjectProgress.correctAnswers}/${subjectProgress.totalQuestions}\n`;
    report += `  Durchschnitt: ${subjectProgress.averageScore}%\n`;
    report += `  Fortschritt: ${progressPercent}%\n`;
    if (subjectProgress.level) {
      report += `  Level: ${subjectProgress.level}\n`;
    }
    if (subjectProgress.topicsMastered.length > 0) {
      report += `  Gemeisterte Themen: ${subjectProgress.topicsMastered.join(', ')}\n`;
    }
    if (subjectProgress.topicsNeedingPractice.length > 0) {
      report += `  Braucht Übung: ${subjectProgress.topicsNeedingPractice.join(', ')}\n`;
    }
  });

  // Badges
  if (progress.badges.length > 0) {
    report += `\n\n🏆 BADGES\n`;
    report += `────────────────────────────────────────\n`;
    progress.badges.forEach((badgeId) => {
      const badge = getBadgeById(badgeId);
      if (badge) {
        report += `${badge.emoji} ${badge.name}: ${badge.description}\n`;
      }
    });
  }

  // Schwierige Aufgaben
  const difficultQuestions = progress.difficultQuestions.filter(
    (dq) => !dq.mastered
  );
  if (difficultQuestions.length > 0) {
    report += `\n\n💪 SCHWIERIGE AUFGABEN\n`;
    report += `────────────────────────────────────────\n`;
    report += `Es gibt ${difficultQuestions.length} Aufgabe${difficultQuestions.length !== 1 ? 'n' : ''}, die noch geübt werden sollten.\n`;
    report += `Nutze die Übungs-Seite, um diese Aufgaben zu meistern!\n`;
  }

  // Letzte Aktivität
  report += `\n\n📅 LETZTE AKTIVITÄT\n`;
  report += `────────────────────────────────────────\n`;
  if (progress.lastActivity) {
    const lastActivityDate = new Date(
      progress.lastActivity
    ).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    report += `Letzte Aktivität: ${lastActivityDate}\n`;
  } else {
    report += `Noch keine Aktivität aufgezeichnet.\n`;
  }

  report += `\n\n========================================\n`;
  report += `Generiert am ${new Date().toLocaleDateString('de-DE')}\n`;
  report += `========================================\n`;

  return report;
}

/**
 * Exportiert einen Bericht als Text-Datei
 */
export function exportReportAsText(
  child: User,
  progress: Progress
): void {
  const report = generateProgressReport(child, progress);
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Fortschrittsbericht_${child.name}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generiert HTML-Bericht für Druck/PDF
 */
export function generateHTMLReport(
  child: User,
  progress: Progress
): string {
  const date = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fortschrittsbericht: ${child.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 2px solid #93c5fd;
      padding-bottom: 5px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .subject-card {
      background: #f9fafb;
      padding: 15px;
      margin: 10px 0;
      border-radius: 8px;
      border-left: 4px solid #10b981;
    }
    .progress-bar {
      background: #e5e7eb;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      height: 100%;
      transition: width 0.3s;
    }
    .badge-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 10px 0;
    }
    .badge {
      background: #fef3c7;
      padding: 8px 12px;
      border-radius: 6px;
      border: 2px solid #fbbf24;
    }
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
    }
    @media print {
      body { margin: 0; padding: 15px; }
    }
  </style>
</head>
<body>
  <h1>📊 Fortschrittsbericht: ${child.name}</h1>
  <p><strong>Datum:</strong> ${date}</p>
  ${child.class ? `<p><strong>Klasse:</strong> ${child.class}</p>` : ''}
  
  <h2>Gesamt-Statistiken</h2>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-value">${progress.totalQuizzesCompleted}</div>
      <div>Quizzes abgeschlossen</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${progress.totalPoints}</div>
      <div>Gesamt-Punkte</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${progress.learningStreak.current}</div>
      <div>Tage Lernstreak</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${progress.badges.length}</div>
      <div>Badges gesammelt</div>
    </div>
  </div>

  <h2>Fortschritt nach Fach</h2>
`;

  subjects.forEach((subject) => {
    const subjectProgress =
      progress.subjects[subject.id as keyof typeof progress.subjects];
    const progressPercent =
      subjectProgress.totalQuestions > 0
        ? Math.round(
            (subjectProgress.correctAnswers /
              subjectProgress.totalQuestions) *
              100
          )
        : 0;

    html += `
    <div class="subject-card">
      <h3>${subject.icon} ${subject.name}</h3>
      <p><strong>Quizzes:</strong> ${subjectProgress.quizzesCompleted}</p>
      <p><strong>Richtige Antworten:</strong> ${subjectProgress.correctAnswers}/${subjectProgress.totalQuestions}</p>
      <p><strong>Durchschnitt:</strong> ${subjectProgress.averageScore}%</p>
      ${subjectProgress.level ? `<p><strong>Level:</strong> ${subjectProgress.level}</p>` : ''}
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <p><strong>Fortschritt:</strong> ${progressPercent}%</p>
    </div>
    `;
  });

  if (progress.badges.length > 0) {
    html += `
    <h2>🏆 Badges</h2>
    <div class="badge-list">
    `;
    progress.badges.forEach((badgeId) => {
      const badge = getBadgeById(badgeId);
      if (badge) {
        html += `<div class="badge">${badge.emoji} ${badge.name}</div>`;
      }
    });
    html += `</div>`;
  }

  html += `
  <footer>
    <p>Generiert am ${new Date().toLocaleDateString('de-DE')}</p>
    <p>Lern-Abenteuer-Quiz</p>
  </footer>
</body>
</html>
`;

  return html;
}

/**
 * Exportiert einen Bericht als HTML-Datei (zum Drucken/PDF)
 */
export function exportReportAsHTML(
  child: User,
  progress: Progress
): void {
  const html = generateHTMLReport(child, progress);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Fortschrittsbericht_${child.name}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

