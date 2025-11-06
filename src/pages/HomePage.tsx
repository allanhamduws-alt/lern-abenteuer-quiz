/**
 * Home-Seite
 * Hier wählt das Kind die Klasse und das Fach aus
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress, getAllDifficultQuestions } from '../services/progress';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Badge } from '../components/ui/Badge';
import { getAllBadges, getBadgeById } from '../data/badges';
import type { User, Progress } from '../types';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: '🔢' },
  { id: 'deutsch', name: 'Deutsch', icon: '📚' },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: '🔬' },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: '🎨' },
  { id: 'logik', name: 'Logik & Minispiele', icon: '🧩' },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Funktion zum Laden von Benutzer und Progress
  const loadUserAndProgress = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        console.log('Lade Progress für Benutzer:', currentUser.uid);
        const userProgress = await loadProgress(currentUser.uid);
        console.log('Progress geladen:', {
          totalQuizzesCompleted: userProgress.totalQuizzesCompleted,
          totalPoints: userProgress.totalPoints,
          mathematik: userProgress.subjects.mathematik,
        });
        setProgress(userProgress);
      }
    } catch (error) {
      console.error('Fehler beim Laden von Benutzer/Progress:', error);
    }
  };

  useEffect(() => {
    // Beim ersten Laden und wenn von ResultsPage zurückkommt
    loadUserAndProgress();
  }, [location.pathname]); // Lädt neu wenn Route sich ändert

  // Leite Eltern zum Eltern-Dashboard um
  useEffect(() => {
    if (user && user.role === 'parent') {
      navigate('/parent-dashboard');
    }
  }, [user, navigate]);

  // Zusätzlich: Progress neu laden wenn Seite fokussiert wird (z.B. Tab zurück)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Seite fokussiert - lade Progress neu');
        loadProgress(user.uid).then(setProgress);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const difficultQuestionsCount = progress
    ? getAllDifficultQuestions(progress).length
    : 0;

  const handleStartQuiz = () => {
    if (!user) {
      return;
    }
    if (!selectedSubject) {
      return;
    }
    if (!user.class) {
      return;
    }
    
    // Navigiere zur Quiz-Seite
    const quizUrl = `/quiz?class=${user.class}&subject=${selectedSubject}`;
    navigate(quizUrl);
  };

  const handleSubjectSelect = (subjectId: string) => {
    console.log('Fach wird ausgewählt:', subjectId);
    setSelectedSubject(subjectId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue-100 via-pastel-purple-100 to-pastel-blue-50">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Wähle dein Lern-Abenteuer! 🎯
          </h2>

          {/* Lernstreak und Fortschritts-Übersicht */}
          {progress ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Lernstreak */}
              <Card>
                <div className="text-center">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {progress.learningStreak.current} Tage
                  </div>
                  <div className="text-sm text-gray-600">Lernstreak</div>
                  {progress.learningStreak.longest > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Beste: {progress.learningStreak.longest} Tage
                    </div>
                  )}
                </div>
              </Card>

              {/* Gesamt-Quizzes */}
              <Card>
                <div className="text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-2xl font-bold text-success-600">
                    {progress.totalQuizzesCompleted}
                  </div>
                  <div className="text-sm text-gray-600">Quizzes abgeschlossen</div>
                </div>
              </Card>

              {/* Gesamt-Punkte */}
              <Card>
                <div className="text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-2xl font-bold text-warning-600">
                    {progress.totalPoints}
                  </div>
                  <div className="text-sm text-gray-600">Gesamt-Punkte</div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="mb-6">
              <div className="text-center py-4">
                <div className="text-gray-500">Lade Fortschritt...</div>
              </div>
            </Card>
          )}

          {/* Badge-Galerie */}
          {progress && (
            <Card className="mb-6">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                🏆 Deine Badges
              </h3>
              {progress.badges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {progress.badges.map((badgeId) => {
                    const badge = getBadgeById(badgeId);
                    if (!badge) return null;
                    return (
                      <div
                        key={badgeId}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 text-center border-2 border-yellow-300 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="text-4xl mb-2">{badge.emoji}</div>
                        <div className="font-bold text-sm">{badge.name}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>Noch keine Badges verdient!</p>
                  <p className="text-sm mt-2">
                    Spiele Quizzes und sammle Badges für deine Erfolge!
                  </p>
                </div>
              )}
              
              {/* Alle verfügbaren Badges anzeigen (mit Verlauf) */}
              {progress.badges.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Alle verfügbaren Badges anzeigen
                  </summary>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {getAllBadges().map((badge) => {
                      const isEarned = progress.badges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`rounded-lg p-4 text-center border-2 ${
                            isEarned
                              ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                              : 'bg-gray-50 border-gray-200 opacity-50'
                          }`}
                        >
                          <div className="text-4xl mb-2">{badge.emoji}</div>
                          <div className={`font-bold text-sm ${isEarned ? '' : 'text-gray-400'}`}>
                            {badge.name}
                          </div>
                          <div className={`text-xs mt-1 ${isEarned ? 'text-gray-600' : 'text-gray-400'}`}>
                            {badge.description}
                          </div>
                          {!isEarned && (
                            <div className="text-xs text-gray-400 mt-2">🔒 Noch nicht verdient</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </Card>
          )}

          {/* Schwierige Aufgaben */}
          {difficultQuestionsCount > 0 && (
            <Card className="mb-6 bg-warning-50 border-2 border-warning-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    💪 Schwierige Aufgaben zum Üben
                  </h3>
                  <p className="text-gray-600">
                    Du hast {difficultQuestionsCount} Aufgabe{difficultQuestionsCount !== 1 ? 'n' : ''}, die du noch üben kannst!
                  </p>
                </div>
                <Button
                  variant="warning"
                  onClick={() => navigate('/practice')}
                >
                  Jetzt üben →
                </Button>
              </div>
            </Card>
          )}

          {/* Fortschritt pro Fach */}
          {progress ? (
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Dein Fortschritt
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadUserAndProgress()}
                    className="text-xs"
                  >
                    🔄 Aktualisieren
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/progress')}
                  >
                    Details anzeigen →
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {subjects.map((subject) => {
                  const subjectProgress =
                    progress.subjects[subject.id as keyof typeof progress.subjects];
                  const progressPercent = subjectProgress.totalQuestions > 0
                    ? Math.round(
                        (subjectProgress.correctAnswers /
                          subjectProgress.totalQuestions) *
                          100
                      )
                    : 0;

                  return (
                    <div key={subject.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{subject.icon}</span>
                          <span className="font-semibold text-gray-900">{subject.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {subjectProgress.level && (
                            <Badge variant="info" className="text-sm font-bold">
                              Level {subjectProgress.level}
                            </Badge>
                          )}
                          <Badge variant={progressPercent >= 80 ? 'success' : progressPercent >= 60 ? 'warning' : 'info'}>
                            {progressPercent}%
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Level XP-Balken - nur wenn Level vorhanden */}
                      {subjectProgress.level && subjectProgress.xp !== undefined && subjectProgress.xpToNextLevel && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-800 mb-1 font-semibold">
                            <span>XP: {subjectProgress.xp} / {subjectProgress.xpToNextLevel}</span>
                            <span>→ Level {subjectProgress.level + 1}</span>
                          </div>
                          <div className="w-full bg-gray-400 rounded-full h-4 shadow-inner border border-gray-500">
                            <div
                              className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all shadow-md border border-blue-700"
                              style={{
                                width: `${Math.min(100, (subjectProgress.xp / subjectProgress.xpToNextLevel) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Fortschrittsbalken - Quiz-Fortschritt */}
                      <div className="mb-2">
                        <div className="text-xs text-gray-800 mb-1 font-semibold">
                          Richtige Antworten: {subjectProgress.correctAnswers} / {subjectProgress.totalQuestions}
                        </div>
                        <div className="w-full bg-gray-400 rounded-full h-4 shadow-inner border border-gray-500">
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
                      </div>
                      
                      <div className="text-xs text-gray-600 mt-2">
                        {subjectProgress.quizzesCompleted} Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''} gespielt
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="mb-6">
              <div className="text-center py-4">
                <div className="text-gray-500">Lade Fortschritt...</div>
              </div>
            </Card>
          )}

          {/* Mini-Spiele Sektion */}
          {user && (
            <Card className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    🎮 Mini-Spiele
                  </h3>
                  <p className="text-gray-700">
                    Teste dein Wissen spielerisch! Zahlen sortieren und mehr...
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => navigate(`/game?gameId=number-sort&class=${user.class}&subject=mathematik`)}
                  className="text-lg px-6 py-3"
                >
                  🎯 Spielen →
                </Button>
              </div>
            </Card>
          )}

          {/* Profil-Anzeige */}
          {user && (
            <Card className="mb-6 bg-primary-50 border-2 border-primary-200">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{user.avatar || '👦'}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    Hallo {user.name}! 👋
                  </h3>
                  <div className="text-gray-600">
                    <div>Klasse {user.class}</div>
                    {user.age && <div>Alter: {user.age} Jahre</div>}
                    {user.year && <div>Jahrgang: {user.year}</div>}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Fachauswahl */}
          {user && (
            <Card className="mb-6">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Welches Fach möchtest du lernen?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => handleSubjectSelect(subject.id)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSubjectSelect(subject.id);
                    }}
                    className={`p-6 rounded-xl text-left transition-all cursor-pointer relative z-10 w-full shadow-lg transform hover:scale-105 active:scale-95 ${
                      selectedSubject === subject.id
                        ? 'bg-gradient-to-br from-pastel-blue-400 to-pastel-purple-400 text-white shadow-xl scale-105 border-2 border-pastel-purple-300'
                        : 'bg-gradient-to-br from-white to-pastel-gray-50 text-gray-800 hover:from-pastel-blue-50 hover:to-pastel-purple-50 border-2 border-pastel-blue-200'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <span className="text-4xl block mb-2">{subject.icon}</span>
                    <span className="font-bold text-lg block">{subject.name}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Start-Button */}
          {user && selectedSubject && (
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  handleStartQuiz();
                }}
                className="text-2xl px-12 py-6"
                type="button"
              >
                Quiz starten! 🚀
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

