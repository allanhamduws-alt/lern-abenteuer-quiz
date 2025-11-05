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
import { syncPoints } from '../utils/points';
import { getCurrentUser } from '../services/auth';
import type { QuizResult, User } from '../types';

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const results = (location.state?.results || []) as QuizResult[];
  const totalPoints = location.state?.totalPoints || 0;
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const totalQuestions = results.length;
  const [user, setUser] = useState<User | null>(null);
  const [pointsSynced, setPointsSynced] = useState(false);

  useEffect(() => {
    // Aktuellen Benutzer laden und Punkte synchronisieren
    getCurrentUser().then((currentUser) => {
      if (currentUser && totalPoints > 0 && !pointsSynced) {
        syncPoints(currentUser, totalPoints)
          .then(() => {
            setPointsSynced(true);
            // Benutzer-Daten neu laden für Header-Anzeige
            getCurrentUser().then(setUser);
          })
          .catch((error) => {
            console.error('Fehler bei der Punkte-Synchronisation:', error);
          });
      } else {
        setUser(currentUser);
      }
    });
  }, [totalPoints, pointsSynced]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header user={user || undefined} />

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
              onClick={() => navigate('/home')}
            >
              Zurück zur Startseite
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Quiz wiederholen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

