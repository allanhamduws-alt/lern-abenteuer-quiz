/**
 * Ergebnis-Seite
 * Zeigt die Quiz-Ergebnisse und Punkte an
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { LevelUp } from '../components/ui/LevelUp';
import { syncPoints } from '../utils/points';
import { getCurrentUser } from '../services/auth';
import { updateProgressAfterQuiz, loadProgress } from '../services/progress';
import { checkEarnedBadges } from '../data/badges';
import { getBadgeById } from '../data/badges';
import type { QuizResult, User, Question } from '../types';

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const results = (location.state?.results || []) as QuizResult[];
  const totalPoints = location.state?.totalPoints || 0;
  const questions = (location.state?.questions || []) as Question[];
  const subject = location.state?.subject as Question['subject'] | undefined;
  const quizDurationSeconds = location.state?.quizDurationSeconds as number | undefined;
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const totalQuestions = results.length;
  const [user, setUser] = useState<User | null>(null);
  const [pointsSynced, setPointsSynced] = useState(false);
  const [progressSynced, setProgressSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(true);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);
  const [levelUp, setLevelUp] = useState<{ oldLevel: number; newLevel: number; subject: string } | null>(null);

  useEffect(() => {
    // Aktuellen Benutzer laden und Punkte synchronisieren
    const syncData = async () => {
      setIsSaving(true);
      setError(null);
      
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setUser(null);
        setIsSaving(false);
        setError('Kein Benutzer eingeloggt');
        return;
      }

      setUser(currentUser);

      try {
        // Fortschritt aktualisieren (wenn Fragen und Subject vorhanden)
        if (questions.length > 0 && subject && results.length > 0 && !progressSynced) {
          console.log('Speichere Fortschritt:', {
            userId: currentUser.uid,
            subject,
            resultsCount: results.length,
            questionsCount: questions.length,
            totalPoints,
          });
          
          try {
            // Alten Progress laden für Level-Up Vergleich
            const oldProgress = await loadProgress(currentUser.uid);
            const oldLevel = oldProgress.subjects[subject].level || 1;
            
            const updatedProgress = await updateProgressAfterQuiz(
              currentUser.uid,
              subject,
              results,
              questions,
              quizDurationSeconds
            );
            
            // Prüfe Level-Up
            const newLevel = updatedProgress.subjects[subject].level || 1;
            
            if (newLevel > oldLevel) {
              setLevelUp({
                oldLevel,
                newLevel,
                subject: subject.charAt(0).toUpperCase() + subject.slice(1),
              });
            }
            
            // Prüfe neu verdiente Badges
            const isPerfect = results.every((r) => r.isCorrect);
            const totalTime = quizDurationSeconds || results.reduce((sum, r) => (r.timeSpent || 0) + sum, 0);
            
            const beforeBadges = updatedProgress.badges.length;
            checkEarnedBadges(updatedProgress, {
              isPerfect,
              totalTimeSeconds: totalTime,
            });
            
            // Lade Progress neu um aktuellen Stand zu haben
            const freshProgress = await loadProgress(currentUser.uid);
            const afterBadges = freshProgress.badges.length;
            
            if (afterBadges > beforeBadges) {
              const newBadges = freshProgress.badges.slice(beforeBadges);
              setNewlyEarnedBadges(newBadges);
            }
            
            setProgressSynced(true);
            console.log('✅ Fortschritt erfolgreich gespeichert!');
          } catch (progressError: any) {
            console.error('❌ Fehler beim Speichern des Fortschritts:', progressError);
            setError(`Fehler beim Speichern: ${progressError?.message || 'Unbekannter Fehler'}`);
            // Weiter machen, Punkte können trotzdem gespeichert werden
          }
        }

        // Punkte synchronisieren (auch wenn 0 Punkte)
        if (!pointsSynced) {
          console.log('Synchronisiere Punkte:', totalPoints);
          try {
            await syncPoints(currentUser, totalPoints);
            setPointsSynced(true);
            console.log('✅ Punkte erfolgreich synchronisiert!');
          } catch (pointsError: any) {
            console.error('❌ Fehler beim Synchronisieren der Punkte:', pointsError);
            setError(`Fehler bei Punkten: ${pointsError?.message || 'Unbekannter Fehler'}`);
          }
        }

        // Benutzer-Daten neu laden für Header-Anzeige
        const updatedUser = await getCurrentUser();
        setUser(updatedUser);
      } catch (error: any) {
        console.error('❌ Fehler bei der Synchronisation:', error);
        setError(`Allgemeiner Fehler: ${error?.message || 'Unbekannter Fehler'}`);
      } finally {
        setIsSaving(false);
      }
    };

    syncData();
  }, []); // Nur einmal beim Mounten ausführen

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header user={user || undefined} />

      {levelUp && (
        <LevelUp
          oldLevel={levelUp.oldLevel}
          newLevel={levelUp.newLevel}
          subject={levelUp.subject}
          onClose={() => setLevelUp(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Ergebnis-Übersicht */}
          <Card className="mb-6 text-center">
            <div className="text-6xl mb-4">
              {correctAnswers === totalQuestions
                ? '🎉'
                : correctAnswers >= totalQuestions / 2
                ? '👍'
                : '💪'}
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-800">
              Quiz beendet!
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-3xl font-bold text-primary-600">
                  {totalPoints}
                </div>
                <div className="text-sm text-gray-600">Punkte</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-success-600">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Richtig</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-warning-600">
                  {Math.round((correctAnswers / totalQuestions) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Prozent</div>
              </div>
            </div>

            {correctAnswers === totalQuestions && (
              <Badge variant="success" size="lg" className="mb-4">
                ⭐ Perfekt! Alle Fragen richtig!
              </Badge>
            )}
          </Card>

          {/* Neu verdiente Badges */}
          {newlyEarnedBadges.length > 0 && (
            <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 animate-fade-in">
              <div className="text-center">
                <div className="text-5xl mb-3">🏆</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Neue Badges verdient!
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {newlyEarnedBadges.map((badgeId) => {
                    const badge = getBadgeById(badgeId);
                    if (!badge) return null;
                    return (
                      <div
                        key={badgeId}
                        className="bg-white rounded-lg p-4 shadow-lg border-2 border-yellow-400 transform hover:scale-105 transition-transform"
                      >
                        <div className="text-5xl mb-2">{badge.emoji}</div>
                        <div className="font-bold text-lg">{badge.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {badge.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Detaillierte Ergebnisse */}
          <Card className="mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Deine Antworten:
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg ${
                    result.isCorrect
                      ? 'bg-success-50 border-2 border-success-200'
                      : 'bg-error-50 border-2 border-error-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Frage {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {result.isCorrect ? (
                        <>
                          <span className="text-success-600">✓ Richtig</span>
                          <Badge variant="success">+{result.points} Punkte</Badge>
                        </>
                      ) : (
                        <>
                          <span className="text-error-600">✗ Falsch</span>
                          <Badge variant="warning">0 Punkte</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Aktions-Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={async () => {
                // Warte bis Speicherung abgeschlossen ist
                if (isSaving) {
                  alert('Bitte warten Sie, bis die Daten gespeichert sind...');
                  return;
                }
                // Kurze Verzögerung, damit Daten gespeichert sind
                await new Promise(resolve => setTimeout(resolve, 500));
                navigate('/home');
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Speichere...' : 'Zurück zur Startseite'}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Quiz wiederholen
            </Button>
          </div>
          
          {/* Status-Anzeige */}
          <div className="mt-4 text-center space-y-2">
            {isSaving && (
              <div className="text-sm text-gray-500">
                ⏳ Speichere Daten...
              </div>
            )}
            {!isSaving && progressSynced && pointsSynced && (
              <div className="text-sm text-green-600 font-semibold">
                ✅ Fortschritt und Punkte gespeichert!
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 font-semibold p-3 bg-red-50 rounded-lg border-2 border-red-200">
                ⚠️ Warnung: {error}
                <br />
                <span className="text-xs text-gray-600">
                  Bitte prüfen Sie die Browser-Konsole (F12) für Details.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

