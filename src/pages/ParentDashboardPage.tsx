/**
 * Eltern-Dashboard-Seite
 * Übersicht über Fortschritt und Statistiken der Kinder
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <LoadingSpinner text="Lade Dashboard..." />
        </Card>
      </div>
    );
  }

  const selectedChildData = children.find((c) => c.child.uid === selectedChild);
  const currentProgress = selectedChildData?.progress;

  return (
    <div className="min-h-screen bg-white">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
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
            <Card className="mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Wähle ein Kind aus
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {children.map(({ child, progress }) => (
                  <button
                    key={child.uid}
                    onClick={() => setSelectedChild(child.uid)}
                    className={`p-4 rounded-xl text-left transition-all shadow-lg transform hover:scale-105 active:scale-95 ${
                      selectedChild === child.uid
                        ? 'bg-purple-600 text-white shadow-xl scale-105 border-2 border-purple-700'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{child.avatar || '👦'}</span>
                      <div>
                        <div className="font-bold text-lg">{child.name}</div>
                        <div className="text-sm opacity-80">
                          Klasse {child.class} • {progress.totalPoints} Punkte
                        </div>
                        <div className="text-sm opacity-80">
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
                <Card>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📚</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {currentProgress.totalQuizzesCompleted}
                    </div>
                    <div className="text-sm text-gray-600">Quizzes</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="text-2xl font-bold text-warning-600">
                      {currentProgress.totalPoints}
                    </div>
                    <div className="text-sm text-gray-600">Punkte</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="text-2xl font-bold text-error-600">
                      {currentProgress.learningStreak.current}
                    </div>
                    <div className="text-sm text-gray-600">Tage Streak</div>
                  </div>
                </Card>
                <Card>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-2xl font-bold text-success-600">
                      {currentProgress.badges.length}
                    </div>
                    <div className="text-sm text-gray-600">Badges</div>
                  </div>
                </Card>
              </div>

              {/* Fach-Statistiken */}
              <Card className="mb-6">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
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
                        className="border-2 border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{subject.icon}</span>
                            <div>
                              <div className="font-bold text-lg">
                                {subject.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {subjectProgress.quizzesCompleted} Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''} • 
                                Level {subjectProgress.level || 1}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">
                              {progressPercent}%
                            </div>
                            <div className="text-xs text-gray-600">
                              {subjectProgress.correctAnswers}/
                              {subjectProgress.totalQuestions} richtig
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-300 rounded-full h-4 mb-2">
                          <div
                            className={`h-4 rounded-full transition-all ${
                              progressPercent >= 80
                                ? 'bg-green-600'
                                : progressPercent >= 60
                                ? 'bg-orange-500'
                                : 'bg-blue-600'
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
              <Card className="mb-6">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  🔥 Lernstreak Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Aktueller Streak
                    </div>
                    <div className="text-3xl font-bold text-primary-600">
                      {currentProgress.learningStreak.current} Tage
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      Bester Streak
                    </div>
                    <div className="text-3xl font-bold text-success-600">
                      {currentProgress.learningStreak.longest} Tage
                    </div>
                  </div>
                </div>
                {currentProgress.learningStreak.current > 0 && (
                  <div className="mt-4 p-3 bg-success-50 rounded-lg text-success-800 text-sm">
                    🎉 Großartig! {selectedChildData.child.name} lernt regelmäßig!
                  </div>
                )}
              </Card>

              {/* Schwierige Aufgaben */}
              {currentProgress.difficultQuestions.filter((dq) => !dq.mastered)
                .length > 0 && (
                <Card className="mb-6 bg-warning-50 border-2 border-warning-200">
                  <h3 className="text-xl font-bold mb-2 text-gray-800">
                    💪 Schwierige Aufgaben
                  </h3>
                  <p className="text-gray-700 mb-2">
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
              <Card className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  📅 Letzte Aktivität
                </h3>
                <div className="text-gray-700">
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
              <Card className="bg-blue-50 border-2 border-blue-200">
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  📄 Bericht exportieren
                </h3>
                <p className="text-gray-600 mb-4">
                  Laden Sie einen detaillierten Fortschrittsbericht herunter.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    onClick={() => exportReportAsText(selectedChildData.child, currentProgress)}
                  >
                    📄 Als Text exportieren
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportReportAsHTML(selectedChildData.child, currentProgress)}
                  >
                    🖨️ Als HTML exportieren
                  </Button>
                </div>
              </Card>
            </>
          )}

          {children.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  Noch keine Kinder verknüpft
                </h3>
                <p className="text-gray-600 mb-4">
                  Verknüpfen Sie Kinder-Konten in der Verwaltung
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/admin')}
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

