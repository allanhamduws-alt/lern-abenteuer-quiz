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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
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
                    <div key={subject.id} className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{subject.icon}</span>
                          <span className="font-semibold">{subject.name}</span>
                        </div>
                        <Badge variant={progressPercent >= 80 ? 'success' : progressPercent >= 60 ? 'warning' : 'info'}>
                          {progressPercent}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progressPercent >= 80
                              ? 'bg-success-500'
                              : progressPercent >= 60
                              ? 'bg-warning-500'
                              : 'bg-primary-500'
                          }`}
                          style={{
                            width: `${progressPercent}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {subjectProgress.quizzesCompleted} Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''} •{' '}
                        {subjectProgress.correctAnswers}/{subjectProgress.totalQuestions} richtig
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
                    className={`p-6 rounded-lg text-left transition-all cursor-pointer relative z-10 w-full ${
                      selectedSubject === subject.id
                        ? 'bg-primary-500 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
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

