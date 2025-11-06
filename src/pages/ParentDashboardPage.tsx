/**
 * Eltern-Dashboard-Seite
 * Spielerischer Stil: Bunte Gradienten, animierte Karten
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { User, Progress } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { exportReportAsText, exportReportAsHTML } from '../services/export';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: '🔢' },
  { id: 'deutsch', name: 'Deutsch', icon: '📚' },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: '🔬' },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: '🎨' },
  { id: 'logik', name: 'Logik & Minispiele', icon: '🧩' },
] as const;

interface ChildWithProgress {
  child: User;
  progress: Progress;
}

export function ParentDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<ChildWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser?.role === 'parent' && currentUser.children) {
        // Lade alle Kinder
        const childrenData: ChildWithProgress[] = [];
        
        for (const childId of currentUser.children) {
          try {
            const childDoc = await getDoc(doc(db, 'users', childId));
            
            if (childDoc.exists()) {
              const childData = childDoc.data() as User;
              const progress = await loadProgress(childId);
              childrenData.push({ child: childData, progress });
            }
          } catch (error) {
            console.error(`Fehler beim Laden von Kind ${childId}:`, error);
          }
        }
        
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0].child.uid);
        }
      } else if (currentUser?.role !== 'parent') {
        // Nicht-Eltern umleiten
        navigate('/home');
        return;
      }
      
      setLoading(false);
    };

    loadData();
  }, [navigate, selectedChild]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Dashboard..." />
        </Card>
      </div>
    );
  }

  const selectedChildData = children.find((c) => c.child.uid === selectedChild);
  const currentProgress = selectedChildData?.progress;

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Eltern-Dashboard 👨‍👩‍👧‍👦
            </h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/admin')}
              >
                Verwaltung ⚙️
              </Button>
              <Button variant="secondary" onClick={() => navigate('/home')}>
                Zur Startseite
              </Button>
            </div>
          </div>

          {/* Kinder-Auswahl */}
          {children.length > 0 && (
            <Card className="mb-6 bg-gradient-card shadow-large animate-fade-in">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Wähle ein Kind aus
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {children.map(({ child, progress }) => (
                  <button
                    key={child.uid}
                    onClick={() => setSelectedChild(child.uid)}
                    className={`p-5 rounded-xl text-left transition-all shadow-medium transform hover:scale-105 ${
                      selectedChild === child.uid
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-colored-purple scale-105 border-2 border-white'
                        : 'bg-gradient-card text-gray-800 hover:shadow-large border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-5xl transform hover:scale-110 transition-transform">{child.avatar || '👦'}</span>
                      <div>
                        <div className="font-bold text-lg">{child.name}</div>
                        <div className="text-sm opacity-90">
                          Klasse {child.class} • {progress.totalPoints} Punkte
                        </div>
                        <div className="text-sm opacity-90">
                          🔥 {progress.learningStreak.current} Tage Streak
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Fortschritts-Übersicht für ausgewähltes Kind */}
          {selectedChildData && currentProgress && (
            <>
              {/* Gesamt-Statistiken */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300 shadow-medium transform hover:scale-105 transition-all">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {currentProgress.totalQuizzesCompleted}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Quizzes</div>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300 shadow-medium transform hover:scale-105 transition-all">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      {currentProgress.totalPoints}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Punkte</div>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-orange-100 to-red-100 border-orange-300 shadow-medium transform hover:scale-105 transition-all">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔥</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {currentProgress.learningStreak.current}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Tage Streak</div>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-lime-100 to-green-100 border-lime-300 shadow-medium transform hover:scale-105 transition-all">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏆</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                      {currentProgress.badges.length}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Badges</div>
                  </div>
                </Card>
              </div>

              {/* Fach-Statistiken */}
              <Card className="mb-6 shadow-large">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Fortschritt nach Fach
                </h3>
                <div className="space-y-4">
                  {subjects.map((subject) => {
                    const subjectProgress =
                      currentProgress.subjects[
                        subject.id as keyof typeof currentProgress.subjects
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
                        className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-card shadow-soft transform hover:scale-[1.01] transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{subject.icon}</span>
                            <div>
                              <div className="font-bold text-lg text-gray-800">
                                {subject.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {subjectProgress.quizzesCompleted} Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''} • 
                                Level {subjectProgress.level || 1}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {progressPercent}%
                            </div>
                            <div className="text-xs text-gray-600">
                              {subjectProgress.correctAnswers}/
                              {subjectProgress.totalQuestions} richtig
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-white/60 rounded-full h-5 shadow-inner">
                          <div
                            className={`h-5 rounded-full transition-all duration-500 ${
                              progressPercent >= 80
                                ? 'bg-gradient-success shadow-colored-lime'
                                : progressPercent >= 60
                                ? 'bg-gradient-warning shadow-lg'
                                : 'bg-gradient-secondary shadow-colored-blue'
                            }`}
                            style={{
                              width: `${progressPercent}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Lernstreak Details */}
              <Card className="mb-6 bg-gradient-to-r from-orange-200 to-red-200 border-2 border-orange-400 shadow-large">
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text text-transparent">
                  🔥 Lernstreak Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-medium">
                    <div className="text-sm text-gray-600 mb-1 font-semibold">
                      Aktueller Streak
                    </div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {currentProgress.learningStreak.current} Tage
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-medium">
                    <div className="text-sm text-gray-600 mb-1 font-semibold">
                      Bester Streak
                    </div>
                    <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {currentProgress.learningStreak.longest} Tage
                    </div>
                  </div>
                </div>
                {currentProgress.learningStreak.current > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-xl text-green-900 border-2 border-green-400 shadow-medium">
                    🎉 Großartig! {selectedChildData.child.name} lernt regelmäßig!
                  </div>
                )}
              </Card>

              {/* Schwierige Aufgaben */}
              {currentProgress.difficultQuestions.filter((dq) => !dq.mastered)
                .length > 0 && (
                <Card className="mb-6 bg-gradient-to-r from-yellow-200 to-orange-200 border-2 border-yellow-400 shadow-large">
                  <h3 className="text-xl font-bold mb-2 text-yellow-900">
                    💪 Schwierige Aufgaben
                  </h3>
                  <p className="text-yellow-800">
                    {currentProgress.difficultQuestions.filter(
                      (dq) => !dq.mastered
                    ).length}{' '}
                    Aufgabe
                    {currentProgress.difficultQuestions.filter(
                      (dq) => !dq.mastered
                    ).length !== 1
                      ? 'n'
                      : ''}{' '}
                    benötigen noch Übung
                  </p>
                </Card>
              )}

              {/* Aktuelle Aktivität */}
              <Card className="mb-6 shadow-medium">
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  📅 Letzte Aktivität
                </h3>
                <div className="text-gray-700 text-lg">
                  {currentProgress.lastActivity ? (
                    <div>
                      Letzte Aktivität:{' '}
                      {new Date(
                        currentProgress.lastActivity
                      ).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500">Noch keine Aktivität</div>
                  )}
                </div>
              </Card>

              {/* Export-Bereich */}
              <Card className="bg-gradient-to-br from-blue-200 to-purple-200 border-2 border-blue-400 shadow-large">
                <h3 className="text-xl font-bold mb-4 text-blue-900">
                  📄 Bericht exportieren
                </h3>
                <p className="text-blue-800 mb-4">
                  Laden Sie einen detaillierten Fortschrittsbericht herunter.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    onClick={() => exportReportAsText(selectedChildData.child, currentProgress)}
                    className="shadow-colored-lime"
                  >
                    📄 Als Text exportieren
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportReportAsHTML(selectedChildData.child, currentProgress)}
                    className="shadow-colored-blue"
                  >
                    🖨️ Als HTML exportieren
                  </Button>
                </div>
              </Card>
            </>
          )}

          {children.length === 0 && (
            <Card className="bg-gradient-to-br from-purple-200 to-pink-200 border-purple-400 shadow-large">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-2xl font-bold mb-2 text-gray-800">
                  Noch keine Kinder verknüpft
                </h3>
                <p className="text-gray-700 mb-4 text-lg">
                  Verknüpfen Sie Kinder-Konten in der Verwaltung
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/admin')}
                  className="shadow-colored-lime"
                >
                  Zur Verwaltung →
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

