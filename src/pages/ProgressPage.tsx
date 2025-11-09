/**
 * Fortschritts-Seite
 * Spielerischer Stil: Bunte Gradienten, animierte Progress-Bars, 3D-Effekte
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
import { MathIcon, GermanIcon, ScienceIcon, ArtIcon, LogicIcon } from '../components/icons';
import { getAllBadges, getBadgeById } from '../data/badges';
import type { User, Progress } from '../types';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: MathIcon },
  { id: 'deutsch', name: 'Deutsch', icon: GermanIcon },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: ScienceIcon },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: ArtIcon },
  { id: 'logik', name: 'Logik & Minispiele', icon: LogicIcon },
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
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-2">
                Dein Fortschritt
              </h2>
              <p className="text-gray-600 text-lg">
                Schau dir an, wie weit du schon gekommen bist! 🎉
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              ← Zurück
            </Button>
          </div>

          {/* Hero-Statistik Card */}
          <Card className="mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white border-0 shadow-large animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-6xl mb-3 animate-bounce">🎯</div>
                <div className="text-5xl font-bold mb-2 drop-shadow-md">
                  {overallProgress}%
                </div>
                <div className="text-purple-100 text-lg font-semibold mb-3">Gesamt-Fortschritt</div>
                <div className="mt-3 w-full bg-white/20 rounded-full h-4 shadow-inner">
                  <div
                    className="bg-white h-4 rounded-full transition-all duration-500 shadow-colored-lime"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              <div className="text-center border-l border-r border-white/30">
                <div className="text-6xl mb-3 animate-bounce">🏆</div>
                <div className="text-5xl font-bold mb-2 drop-shadow-md">
                  {progress.badges.length}
                </div>
                <div className="text-purple-100 text-lg font-semibold">Badges</div>
                <div className="text-sm text-purple-100 mt-2">
                  von {getAllBadges().length} verfügbar
                </div>
              </div>
              <div className="text-center">
                <div className="text-6xl mb-3 animate-bounce">🔥</div>
                <div className="text-5xl font-bold mb-2 drop-shadow-md">
                  {progress.learningStreak.current}
                </div>
                <div className="text-purple-100 text-lg font-semibold">Tage Streak</div>
                {progress.learningStreak.longest > 0 && (
                  <div className="text-sm text-purple-100 mt-2">
                    Beste: {progress.learningStreak.longest} Tage
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Gesamt-Statistiken */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-2">📚</div>
                <div className="text-3xl font-bold text-black">
                  {progress.totalQuizzesCompleted}
                </div>
                <div className="text-sm font-medium text-gray-600">Quizzes</div>
              </div>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-3xl font-bold text-black">
                  {progress.totalPoints}
                </div>
                <div className="text-sm font-medium text-gray-600">Punkte</div>
              </div>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-3xl font-bold text-black">
                  {progress.learningStreak.current}
                </div>
                <div className="text-sm font-medium text-gray-600">Tage Streak</div>
              </div>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-4xl mb-2">💪</div>
                <div className="text-3xl font-bold text-black">
                  {progress.difficultQuestions.filter((dq) => !dq.mastered).length}
                </div>
                <div className="text-sm font-medium text-gray-600">Zu üben</div>
              </div>
            </Card>
          </div>

          {/* Badges Galerie */}
          {progress.badges.length > 0 && (
            <Card className="mb-6">
              <h3 className="text-xl font-bold mb-4 text-black">
                🏆 Deine Badges
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {progress.badges.map((badgeId) => {
                  const badge = getBadgeById(badgeId);
                  if (!badge) return null;
                  return (
                    <div
                      key={badgeId}
                      className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="text-5xl mb-2">{badge.emoji}</div>
                      <div className="font-semibold text-sm text-gray-900">{badge.name}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Detaillierte Fach-Statistiken */}
          <Card className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-black">
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
                  <Card
                    key={subject.id}
                    className="hover:shadow-large transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="transform transition-transform duration-300 hover:scale-110">
                          {(() => {
                            const IconComponent = subject.icon;
                            return <IconComponent className="w-10 h-10" />;
                          })()}
                        </div>
                        <div>
                          <div className="font-bold text-xl text-gray-800">{subject.name}</div>
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
                        className="bg-gradient-success text-white shadow-colored-lime"
                      >
                        {progressPercent}%
                      </Badge>
                    </div>

                    {/* Level XP-Balken */}
                    {subjectProgress.level && subjectProgress.xp !== undefined && subjectProgress.xpToNextLevel && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-700 mb-1 font-medium">
                          <span>XP: {subjectProgress.xp} / {subjectProgress.xpToNextLevel}</span>
                          <span>→ Level {subjectProgress.level + 1}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-purple-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (subjectProgress.xp / subjectProgress.xpToNextLevel) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Fortschrittsbalken */}
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full transition-all duration-500 ${
                            progressPercent >= 80
                              ? 'bg-green-500'
                              : progressPercent >= 60
                              ? 'bg-yellow-400'
                              : 'bg-gray-400'
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
                        <span className="font-semibold text-green-600">
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
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* Lernstreak Details */}
          <Card className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-black">
              🔥 Dein Lernstreak
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-5 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2 font-medium">
                  Aktueller Streak
                </div>
                <div className="text-5xl font-bold text-black mb-2">
                  {progress.learningStreak.current}
                </div>
                <div className="text-gray-600 font-medium">Tage</div>
              </div>
              <div className="text-center p-5 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2 font-medium">
                  Bester Streak
                </div>
                <div className="text-5xl font-bold text-black mb-2">
                  {progress.learningStreak.longest}
                </div>
                <div className="text-gray-600 font-medium">Tage</div>
              </div>
            </div>
            {progress.learningStreak.current === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-yellow-900 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="font-semibold text-base">Starte heute deinen Lernstreak!</div>
                    <div className="text-sm">Spiele jeden Tag ein Quiz, um deinen Streak aufzubauen!</div>
                  </div>
                </div>
              </div>
            )}
            {progress.learningStreak.current > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg text-green-900 border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <div className="font-semibold text-base">Super! Du lernst jeden Tag!</div>
                    <div className="text-sm">Mach weiter so! Du bist großartig!</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Nächste Ziele */}
          <Card className="bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400 shadow-large">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
              🎯 Deine nächsten Ziele
            </h3>
            <div className="space-y-3">
              {progress.learningStreak.current < 7 && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-medium transform hover:scale-[1.02] transition-all">
                  <span className="text-3xl">🔥</span>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">7-Tage Lernstreak erreichen</div>
                    <div className="text-sm text-gray-600">
                      Noch {7 - progress.learningStreak.current} Tag{7 - progress.learningStreak.current !== 1 ? 'e' : ''} bis zum Ziel!
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round((progress.learningStreak.current / 7) * 100)}%
                  </div>
                </div>
              )}
              {masteredSubjects < totalSubjects && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-medium transform hover:scale-[1.02] transition-all">
                  <span className="text-3xl">📚</span>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">Alle Fächer meistern</div>
                    <div className="text-sm text-gray-600">
                      {masteredSubjects} von {totalSubjects} Fächern gemeistert
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round((masteredSubjects / totalSubjects) * 100)}%
                  </div>
                </div>
              )}
              {progress.badges.length < getAllBadges().length && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-medium transform hover:scale-[1.02] transition-all">
                  <span className="text-3xl">🏆</span>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-800">Alle Badges sammeln</div>
                    <div className="text-sm text-gray-600">
                      {progress.badges.length} von {getAllBadges().length} Badges gesammelt
                    </div>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round((progress.badges.length / getAllBadges().length) * 100)}%
                  </div>
                </div>
              )}
              {masteredSubjects === totalSubjects && progress.learningStreak.current >= 7 && progress.badges.length >= getAllBadges().length && (
                <div className="text-center p-6 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-xl border-2 border-yellow-500 shadow-large">
                  <div className="text-5xl mb-2 animate-bounce">🌟</div>
                  <div className="font-bold text-xl text-yellow-900">Du bist ein wahrer Lern-Meister!</div>
                  <div className="text-sm text-yellow-800 mt-1 font-semibold">Alle Ziele erreicht! Weiter so! 🎉</div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

