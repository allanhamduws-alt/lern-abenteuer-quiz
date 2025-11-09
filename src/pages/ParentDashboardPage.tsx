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
import { getAllDifficultQuestions } from '../services/progress';
import { questions } from '../data/questions';
import type { Question } from '../types';

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
        } else if (childrenData.length === 0) {
          setSelectedChild(null);
        }
      } else if (currentUser?.role !== 'parent') {
        // Nicht-Eltern umleiten
        navigate('/dashboard');
        return;
      }
      
      setLoading(false);
    };

    loadData();
  }, [navigate]);

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
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                Zur Startseite
              </Button>
            </div>
          </div>

          {/* Kinder-Auswahl */}
          {children.length > 0 && (
            <Card className="mb-6 bg-gradient-card shadow-large animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Wähle ein Kind aus
                </h3>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/settings')}
                  className="shadow-medium"
                >
                  👨‍👩‍👧‍👦 Kinder verwalten
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {children.map(({ child, progress }) => (
                  <div
                    key={child.uid}
                    className={`relative p-5 rounded-xl transition-all shadow-medium transform hover:scale-105 ${
                      selectedChild === child.uid
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-colored-purple scale-105 border-2 border-white'
                        : 'bg-gradient-card text-gray-800 hover:shadow-large border-2 border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedChild(child.uid)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-5xl transform hover:scale-110 transition-transform">{child.avatar || '👦'}</span>
                        <div className="flex-1">
                          <div className="font-bold text-lg">{child.name}</div>
                          <div className={`text-sm ${selectedChild === child.uid ? 'opacity-90' : 'opacity-80'}`}>
                            Klasse {child.class} • {progress.totalPoints} Punkte
                          </div>
                          <div className={`text-sm ${selectedChild === child.uid ? 'opacity-90' : 'opacity-80'}`}>
                            🔥 {progress.learningStreak.current} Tage Streak
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Vergleich zwischen Kindern */}
          {children.length > 1 && (
            <Card className="mb-6 bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-300 shadow-large animate-fade-in">
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📊 Vergleich zwischen Kindern
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Punkte-Vergleich */}
                <div className="bg-white rounded-xl p-4 shadow-medium">
                  <div className="text-sm font-semibold text-gray-600 mb-2">⭐ Gesamt-Punkte</div>
                  <div className="space-y-2">
                    {children
                      .sort((a, b) => b.progress.totalPoints - a.progress.totalPoints)
                      .map(({ child, progress }, index) => (
                        <div key={child.uid} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{child.avatar || '👦'}</span>
                            <span className="text-sm font-semibold">{child.name}</span>
                            {index === 0 && <span className="text-yellow-500">🥇</span>}
                          </div>
                          <span className="font-bold text-purple-600">{progress.totalPoints}</span>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Streak-Vergleich */}
                <div className="bg-white rounded-xl p-4 shadow-medium">
                  <div className="text-sm font-semibold text-gray-600 mb-2">🔥 Lernstreak</div>
                  <div className="space-y-2">
                    {children
                      .sort((a, b) => b.progress.learningStreak.current - a.progress.learningStreak.current)
                      .map(({ child, progress }, index) => (
                        <div key={child.uid} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{child.avatar || '👦'}</span>
                            <span className="text-sm font-semibold">{child.name}</span>
                            {index === 0 && <span className="text-orange-500">🔥</span>}
                          </div>
                          <span className="font-bold text-orange-600">{progress.learningStreak.current} Tage</span>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Quiz-Vergleich */}
                <div className="bg-white rounded-xl p-4 shadow-medium">
                  <div className="text-sm font-semibold text-gray-600 mb-2">📚 Quizzes</div>
                  <div className="space-y-2">
                    {children
                      .sort((a, b) => b.progress.totalQuizzesCompleted - a.progress.totalQuizzesCompleted)
                      .map(({ child, progress }, index) => (
                        <div key={child.uid} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{child.avatar || '👦'}</span>
                            <span className="text-sm font-semibold">{child.name}</span>
                            {index === 0 && <span className="text-green-500">📚</span>}
                          </div>
                          <span className="font-bold text-green-600">{progress.totalQuizzesCompleted}</span>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Badges-Vergleich */}
                <div className="bg-white rounded-xl p-4 shadow-medium">
                  <div className="text-sm font-semibold text-gray-600 mb-2">🏆 Badges</div>
                  <div className="space-y-2">
                    {children
                      .sort((a, b) => b.progress.badges.length - a.progress.badges.length)
                      .map(({ child, progress }, index) => (
                        <div key={child.uid} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{child.avatar || '👦'}</span>
                            <span className="text-sm font-semibold">{child.name}</span>
                            {index === 0 && <span className="text-yellow-500">🏆</span>}
                          </div>
                          <span className="font-bold text-yellow-600">{progress.badges.length}</span>
                        </div>
                      ))}
                  </div>
                </div>
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

              {/* Schwierige Aufgaben - Detailliert */}
              {(() => {
                const difficultQuestions = getAllDifficultQuestions(currentProgress).filter((dq) => !dq.mastered);
                const getQuestionById = (questionId: string): Question | undefined => {
                  return questions.find((q) => q.id === questionId);
                };
                
                if (difficultQuestions.length > 0) {
                  return (
                    <Card className="mb-6 bg-gradient-to-r from-yellow-200 to-orange-200 border-2 border-yellow-400 shadow-large">
                      <h3 className="text-xl font-bold mb-4 text-yellow-900">
                        💪 Schwierige Aufgaben ({difficultQuestions.length})
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {difficultQuestions.slice(0, 10).map((dq) => {
                          const question = getQuestionById(dq.questionId);
                          const subjectName = subjects.find(s => s.id === question?.subject)?.name || question?.subject || 'Unbekannt';
                          const subjectIcon = subjects.find(s => s.id === question?.subject)?.icon || '❓';
                          
                          return (
                            <div
                              key={dq.questionId}
                              className="bg-white rounded-xl p-4 shadow-medium border-2 border-yellow-300"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{subjectIcon}</span>
                                    <span className="font-semibold text-gray-800">{subjectName}</span>
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                      {dq.attempts} Versuch{dq.attempts !== 1 ? 'e' : ''}
                                    </span>
                                  </div>
                                  {question && (
                                    <p className="text-sm text-gray-700 line-clamp-2">
                                      {question.question}
                                    </p>
                                  )}
                                  <div className="text-xs text-gray-500 mt-2">
                                    Erste Versuche: {new Date(dq.firstAttempt).toLocaleDateString('de-DE')} • 
                                    Letzter Versuch: {new Date(dq.lastAttempt).toLocaleDateString('de-DE')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {difficultQuestions.length > 10 && (
                          <div className="text-center text-sm text-yellow-800 font-semibold pt-2">
                            ... und {difficultQuestions.length - 10} weitere Aufgaben
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                }
                return null;
              })()}

              {/* Aktivitäts-Timeline */}
              <Card className="mb-6 shadow-medium">
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  📅 Aktivitäts-Timeline
                </h3>
                <div className="space-y-4">
                  {/* Letzte Aktivität */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">📚</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">Letzte Aktivität</div>
                        {currentProgress.lastActivity ? (
                          <div className="text-sm text-gray-600">
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
                          <div className="text-sm text-gray-500">Noch keine Aktivität</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lernstreak Timeline */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🔥</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">Lernstreak</div>
                        <div className="text-sm text-gray-600">
                          {currentProgress.learningStreak.current} Tage in Folge • 
                          Bester Streak: {currentProgress.learningStreak.longest} Tage
                        </div>
                        {currentProgress.learningStreak.lastActivity && (
                          <div className="text-xs text-gray-500 mt-1">
                            Letzter Streak-Tag: {new Date(
                              currentProgress.learningStreak.lastActivity
                            ).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Gesamt-Statistiken Timeline */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                      <div className="text-2xl mb-1">📚</div>
                      <div className="text-sm font-semibold text-gray-600">Quizzes gesamt</div>
                      <div className="text-2xl font-bold text-green-600">{currentProgress.totalQuizzesCompleted}</div>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                      <div className="text-2xl mb-1">⭐</div>
                      <div className="text-sm font-semibold text-gray-600">Punkte gesamt</div>
                      <div className="text-2xl font-bold text-yellow-600">{currentProgress.totalPoints}</div>
                    </div>
                  </div>
                  
                  {/* Fach-Statistiken Timeline */}
                  <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 mb-3">Aktivität nach Fach</div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {subjects.map((subject) => {
                        const subjectProgress = currentProgress.subjects[subject.id as keyof typeof currentProgress.subjects];
                        return (
                          <div key={subject.id} className="text-center">
                            <div className="text-2xl mb-1">{subject.icon}</div>
                            <div className="text-xs font-semibold text-gray-600">{subjectProgress.quizzesCompleted}</div>
                            <div className="text-xs text-gray-500">Quiz{subjectProgress.quizzesCompleted !== 1 ? 's' : ''}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
                  Verknüpfen Sie Kinder-Konten in den Einstellungen
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/settings')}
                  className="shadow-colored-lime"
                >
                  Kinder verwalten →
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

