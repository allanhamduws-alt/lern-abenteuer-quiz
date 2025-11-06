/**
 * Fortschritts-Seite
 * Zeigt detaillierte Fortschritts-Statistiken mit verbesserter Visualisierung
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
import { getAllBadges, getBadgeById } from '../data/badges';
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
      <div className="min-h-screen bg-gradient-to-br from-pastel-purple-100 via-pastel-pink-100 to-pastel-purple-50 flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Fortschritt..." />
        </Card>
      </div>
    );
  }

  // Berechne Gesamt-Fortschritt
  const totalSubjects = subjects.length;
  const masteredSubjects = subjects.filter((subject) => {
    const subjectProgress = progress.subjects[subject.id as keyof typeof progress.subjects];
    const progressPercent = subjectProgress.totalQuestions > 0
      ? Math.round((subjectProgress.correctAnswers / subjectProgress.totalQuestions) * 100)
      : 0;
    return progressPercent >= 80;
  }).length;

  const overallProgress = totalSubjects > 0 ? Math.round((masteredSubjects / totalSubjects) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-purple-100 via-pastel-pink-100 to-pastel-purple-50">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                Dein Fortschritt 📊
              </h2>
              <p className="text-gray-600">
                Schau dir an, wie weit du schon gekommen bist!
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/home')}>
              ← Zurück
            </Button>
          </div>

          {/* Hero-Statistik Card */}
          <Card className="mb-6 bg-gradient-to-br from-pastel-purple-400 to-pastel-pink-400 text-white border-0 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl mb-3">🎯</div>
                <div className="text-4xl font-bold mb-1">
                  {overallProgress}%
                </div>
                <div className="text-primary-100">Gesamt-Fortschritt</div>
                <div className="mt-3 w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full transition-all shadow-lg"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <div className="text-center border-l border-r border-white/20">
                <div className="text-5xl mb-3">🏆</div>
                <div className="text-4xl font-bold mb-1">
                  {progress.badges.length}
                </div>
                <div className="text-primary-100">Badges</div>
                <div className="text-sm text-primary-100 mt-2">
                  von {getAllBadges().length} verfügbar
                </div>
              </div>
              <div className="text-center">
                <div className="text-5xl mb-3">🔥</div>
                <div className="text-4xl font-bold mb-1">
                  {progress.learningStreak.current}
                </div>
                <div className="text-primary-100">Tage Streak</div>
                {progress.learningStreak.longest > 0 && (
                  <div className="text-sm text-primary-100 mt-2">
                    Beste: {progress.learningStreak.longest} Tage
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Gesamt-Statistiken */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-2 animate-bounce">📚</div>
                <div className="text-3xl font-bold text-primary-600">
                  {progress.totalQuizzesCompleted}
                </div>
                <div className="text-sm text-gray-600">Quizzes</div>
              </div>
            </Card>
            <Card className="hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-2 animate-pulse">⭐</div>
                <div className="text-3xl font-bold text-warning-600">
                  {progress.totalPoints}
                </div>
                <div className="text-sm text-gray-600">Punkte</div>
              </div>
            </Card>
            <Card className="hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-3xl font-bold text-error-600">
                  {progress.learningStreak.current}
                </div>
                <div className="text-sm text-gray-600">Tage Streak</div>
              </div>
            </Card>
            <Card className="hover:shadow-lg transition-all transform hover:scale-105">
              <div className="text-center">
                <div className="text-4xl mb-2">💪</div>
                <div className="text-3xl font-bold text-warning-600">
                  {progress.difficultQuestions.filter((dq) => !dq.mastered).length}
                </div>
                <div className="text-sm text-gray-600">Zu üben</div>
              </div>
            </Card>
          </div>

          {/* Badges Galerie */}
          {progress.badges.length > 0 && (
            <Card className="mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                🏆 Deine Badges
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {progress.badges.map((badgeId) => {
                  const badge = getBadgeById(badgeId);
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="bg-white rounded-lg p-4 text-center border-2 border-yellow-400 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      <div className="text-5xl mb-2">{badge.emoji}</div>
                      <div className="font-bold text-sm">{badge.name}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Detaillierte Fach-Statistiken */}
          <Card className="mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              📚 Fortschritt nach Fach
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
                    className="border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{subject.icon}</span>
                        <div>
                          <div className="font-bold text-xl">{subject.name}</div>
                          <div className="text-sm text-gray-600">
                            {subjectProgress.quizzesCompleted} Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''} abgeschlossen
                            {subjectProgress.level && (
                              <> • Level {subjectProgress.level}</>
                            )}
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

                    {/* Level XP-Balken */}
                    {subjectProgress.level && subjectProgress.xp !== undefined && subjectProgress.xpToNextLevel && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-700 mb-1 font-semibold">
                          <span>XP: {subjectProgress.xp} / {subjectProgress.xpToNextLevel}</span>
                          <span>→ Level {subjectProgress.level + 1}</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3 shadow-inner">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all shadow-md"
                            style={{
                              width: `${Math.min(100, (subjectProgress.xp / subjectProgress.xpToNextLevel) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Fortschrittsbalken */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-300 rounded-full h-5 shadow-inner border border-gray-400">
                        <div
                          className={`h-5 rounded-full transition-all shadow-md border ${
                            progressPercent >= 80
                              ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-700'
                              : progressPercent >= 60
                              ? 'bg-gradient-to-r from-orange-400 to-orange-500 border-orange-600'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700'
                          }`}
                          style={{
                            width: `${progressPercent}%`,
                          }}
                        />
                      </div>
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
          <Card className="mb-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              🔥 Dein Lernstreak
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-md">
                <div className="text-sm text-gray-600 mb-2">
                  Aktueller Streak
                </div>
                <div className="text-5xl font-bold text-primary-600 mb-2">
                  {progress.learningStreak.current}
                </div>
                <div className="text-gray-600">Tage</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-md">
                <div className="text-sm text-gray-600 mb-2">
                  Bester Streak
                </div>
                <div className="text-5xl font-bold text-success-600 mb-2">
                  {progress.learningStreak.longest}
                </div>
                <div className="text-gray-600">Tage</div>
              </div>
            </div>
            {progress.learningStreak.current === 0 && (
              <div className="mt-4 p-4 bg-warning-100 rounded-lg text-warning-900 border-2 border-warning-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="font-semibold">Starte heute deinen Lernstreak!</div>
                    <div className="text-sm">Spiele jeden Tag ein Quiz, um deinen Streak aufzubauen!</div>
                  </div>
                </div>
              </div>
            )}
            {progress.learningStreak.current > 0 && (
              <div className="mt-4 p-4 bg-success-100 rounded-lg text-success-900 border-2 border-success-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-pulse">🎉</span>
                  <div>
                    <div className="font-semibold">Super! Du lernst jeden Tag!</div>
                    <div className="text-sm">Mach weiter so! Du bist großartig!</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Nächste Ziele */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              🎯 Deine nächsten Ziele
            </h3>
            <div className="space-y-3">
              {progress.learningStreak.current < 7 && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">🔥</span>
                  <div className="flex-1">
                    <div className="font-semibold">7-Tage Lernstreak erreichen</div>
                    <div className="text-sm text-gray-600">
                      Noch {7 - progress.learningStreak.current} Tag{7 - progress.learningStreak.current !== 1 ? 'e' : ''} bis zum Ziel!
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((progress.learningStreak.current / 7) * 100)}%
                  </div>
                </div>
              )}
              {masteredSubjects < totalSubjects && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">📚</span>
                  <div className="flex-1">
                    <div className="font-semibold">Alle Fächer meistern</div>
                    <div className="text-sm text-gray-600">
                      {masteredSubjects} von {totalSubjects} Fächern gemeistert
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((masteredSubjects / totalSubjects) * 100)}%
                  </div>
                </div>
              )}
              {progress.badges.length < getAllBadges().length && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <span className="text-2xl">🏆</span>
                  <div className="flex-1">
                    <div className="font-semibold">Alle Badges sammeln</div>
                    <div className="text-sm text-gray-600">
                      {progress.badges.length} von {getAllBadges().length} Badges gesammelt
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round((progress.badges.length / getAllBadges().length) * 100)}%
                  </div>
                </div>
              )}
              {masteredSubjects === totalSubjects && progress.learningStreak.current >= 7 && progress.badges.length >= getAllBadges().length && (
                <div className="text-center p-4 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                  <div className="text-4xl mb-2">🌟</div>
                  <div className="font-bold text-lg">Du bist ein wahrer Lern-Meister!</div>
                  <div className="text-sm text-gray-600 mt-1">Alle Ziele erreicht! Weiter so! 🎉</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

