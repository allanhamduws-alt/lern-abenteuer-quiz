/**
 * Fortschritts-Seite
 * Zeigt detaillierte Fortschritts-Statistiken
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { User, Progress } from '../types';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: '🔢' },
  { id: 'deutsch', name: 'Deutsch', icon: '📚' },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: '🔬' },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: '🎨' },
  { id: 'logik', name: 'Logik & Minispiele', icon: '🧩' },
] as const;

export function ProgressPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    getCurrentUser().then(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userProgress = await loadProgress(currentUser.uid);
        setProgress(userProgress);
      }
    });
  }, []);

  if (!progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Fortschritt..." />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
              Dein Fortschritt 📊
            </h2>
            <Button variant="secondary" onClick={() => navigate('/home')}>
              ← Zurück
            </Button>
          </div>

          {/* Gesamt-Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-center">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-primary-600">
                  {progress.totalQuizzesCompleted}
                </div>
                <div className="text-sm text-gray-600">Quizzes</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-warning-600">
                  {progress.totalPoints}
                </div>
                <div className="text-sm text-gray-600">Punkte</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-2xl font-bold text-error-600">
                  {progress.learningStreak.current}
                </div>
                <div className="text-sm text-gray-600">Tage Streak</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl mb-2">💪</div>
                <div className="text-2xl font-bold text-warning-600">
                  {progress.difficultQuestions.filter((dq) => !dq.mastered).length}
                </div>
                <div className="text-sm text-gray-600">Zu üben</div>
              </div>
            </Card>
          </div>

          {/* Detaillierte Fach-Statistiken */}
          <Card className="mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Fortschritt nach Fach
            </h3>
            <div className="space-y-4">
              {subjects.map((subject) => {
                const subjectProgress =
                  progress.subjects[
                    subject.id as keyof typeof progress.subjects
                  ];
                const progressPercent =
                  subjectProgress.totalQuestions > 0
                    ? Math.round(
                        (subjectProgress.correctAnswers /
                          subjectProgress.totalQuestions) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={subject.id}
                    className="border-2 border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{subject.icon}</span>
                        <div>
                          <div className="font-bold text-lg">{subject.name}</div>
                          <div className="text-sm text-gray-600">
                            {subjectProgress.quizzesCompleted} Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''} abgeschlossen
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          progressPercent >= 80
                            ? 'success'
                            : progressPercent >= 60
                            ? 'warning'
                            : 'info'
                        }
                        size="lg"
                      >
                        {progressPercent}%
                      </Badge>
                    </div>

                    <div className="w-full bg-gray-400 rounded-full h-4 mb-2 shadow-inner border border-gray-500">
                      <div
                        className={`h-4 rounded-full transition-all shadow-md border ${
                          progressPercent >= 80
                            ? 'bg-green-600 border-green-700'
                            : progressPercent >= 60
                            ? 'bg-orange-500 border-orange-600'
                            : 'bg-blue-600 border-blue-700'
                        }`}
                        style={{
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Richtig: </span>
                        <span className="font-semibold text-success-600">
                          {subjectProgress.correctAnswers}/
                          {subjectProgress.totalQuestions}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Durchschnitt: </span>
                        <span className="font-semibold">
                          {subjectProgress.averageScore}%
                        </span>
                      </div>
                    </div>

                    {/* Themen-Mastery */}
                    {subjectProgress.topicsMastered.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">
                          Gemeisterte Themen:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {subjectProgress.topicsMastered.map((topic) => (
                            <Badge key={topic} variant="success" size="sm">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Themen die Übung brauchen */}
                    {subjectProgress.topicsNeedingPractice.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-1">
                          Braucht noch Übung:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {subjectProgress.topicsNeedingPractice.map((topic) => (
                            <Badge key={topic} variant="warning" size="sm">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Lernstreak Details */}
          <Card>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              🔥 Dein Lernstreak
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Aktueller Streak
                </div>
                <div className="text-3xl font-bold text-primary-600">
                  {progress.learningStreak.current} Tage
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Bester Streak
                </div>
                <div className="text-3xl font-bold text-success-600">
                  {progress.learningStreak.longest} Tage
                </div>
              </div>
            </div>
            {progress.learningStreak.current === 0 && (
              <div className="mt-4 p-3 bg-warning-50 rounded-lg text-warning-800 text-sm">
                💡 Starte heute deinen Lernstreak! Spiele jeden Tag ein Quiz, um deinen Streak aufzubauen!
              </div>
            )}
            {progress.learningStreak.current > 0 && (
              <div className="mt-4 p-3 bg-success-50 rounded-lg text-success-800 text-sm">
                🎉 Super! Du lernst jeden Tag! Mach weiter so!
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

