/**
 * Home-Seite - Spielerischer Stil
 * Bunte Fächer-Karten mit Gradienten und 3D-Effekten
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Mascot } from '../components/Mascot';
import { DailyChallengeCard } from '../components/ui/DailyChallengeCard';
import { MathIcon, GermanIcon, ScienceIcon, ArtIcon, LogicIcon } from '../components/icons';
import type { User, Progress } from '../types';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: MathIcon },
  { id: 'deutsch', name: 'Deutsch', icon: GermanIcon },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: ScienceIcon },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: ArtIcon },
  { id: 'logik', name: 'Logik & Minispiele', icon: LogicIcon },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const loadUserAndProgress = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const userProgress = await loadProgress(currentUser.uid);
        setProgress(userProgress);
      }
    } catch (error) {
      console.error('Fehler beim Laden von Benutzer/Progress:', error);
    }
  };

  useEffect(() => {
    loadUserAndProgress();
  }, [location.pathname]);

  useEffect(() => {
    if (user && user.role === 'parent') {
      navigate('/parent-dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadProgress(user.uid).then(setProgress);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const handleSubjectClick = (subjectId: string) => {
    if (!user || !user.class) {
      return;
    }
    const quizUrl = `/quiz?class=${user.class}&subject=${subjectId}`;
    navigate(quizUrl);
  };

  // Farbzuordnung für Fächer
  const subjectColors: Record<string, { gradient: string; shadow: string; hoverGradient: string }> = {
    mathematik: { 
      gradient: 'from-lime-400 to-lime-500', 
      shadow: 'shadow-colored-lime',
      hoverGradient: 'linear-gradient(135deg, #a3e635 0%, #84cc16 100%)'
    },
    deutsch: { 
      gradient: 'from-sky-400 to-sky-500', 
      shadow: 'shadow-colored-blue',
      hoverGradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'
    },
    naturwissenschaften: { 
      gradient: 'from-purple-400 to-purple-500', 
      shadow: 'shadow-colored-purple',
      hoverGradient: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
    },
    kunst: { 
      gradient: 'from-pink-400 to-pink-500', 
      shadow: 'shadow-lg',
      hoverGradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)'
    },
    logik: { 
      gradient: 'from-orange-400 to-orange-500', 
      shadow: 'shadow-lg',
      hoverGradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
    },
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />
      
      {/* Maskottchen als fixed Begleiter */}
      <Mascot mood="friendly" text="Hallo! Wähle ein Fach aus und lass uns gemeinsam lernen! 🎓" position="bottom-right" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Überschrift */}
          <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent animate-fade-in">
            Wähle ein Fach
          </h2>

          {/* Tägliche Challenge */}
          {progress?.dailyChallenge && (
            <div className="mb-8 animate-fade-in">
              <DailyChallengeCard challenge={progress.dailyChallenge} />
            </div>
          )}

          {/* Optional: Kurze Übersicht (nur wenn Platz) */}
          {progress && (
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto animate-fade-in">
              <Card padding="sm" className="bg-gradient-to-br from-purple-400 to-pink-400 border-purple-300">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white drop-shadow-md">
                    {progress.learningStreak.current}
                  </div>
                  <div className="text-sm text-white/90 font-semibold">Tage Streak</div>
                </div>
              </Card>
              <Card padding="sm" className="bg-gradient-to-br from-lime-400 to-green-400 border-lime-300">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white drop-shadow-md">
                    {progress.totalPoints}
                  </div>
                  <div className="text-sm text-white/90 font-semibold">Punkte</div>
                </div>
              </Card>
            </div>
          )}

          {/* Fächer-Liste */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {subjects.map((subject, index) => {
              const IconComponent = subject.icon;
              const colors = subjectColors[subject.id] || { 
                gradient: 'from-gray-400 to-gray-500', 
                shadow: 'shadow-lg',
                hoverGradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
              };
              const subjectProgress = progress?.subjects[subject.id as keyof typeof progress.subjects];
              const level = subjectProgress?.level || 1;
              const xp = subjectProgress?.xp || 0;
              const xpToNextLevel = subjectProgress?.xpToNextLevel || 100;
              const progressPercentage = level >= 10 ? 100 : Math.round((xp / xpToNextLevel) * 100);
              
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSubjectClick(subject.id)}
                  className="p-6 rounded-xl text-left transition-all duration-300 transform hover:scale-105 border-2 animate-fade-in cursor-pointer group bg-gradient-card text-gray-800 border-gray-200 hover:border-white hover:shadow-large"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.hoverGradient;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="transform transition-transform duration-300 group-hover:scale-110">
                      <IconComponent className="w-10 h-10 transition-colors duration-300" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-lg transition-colors duration-300">{subject.name}</span>
                      {progress && (
                        <div className="mt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary-600 group-hover:text-white transition-colors duration-300">
                              Level {level}
                            </span>
                            {level < 10 && (
                              <span className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300">
                                ({xp}/{xpToNextLevel} XP)
                              </span>
                            )}
                          </div>
                          {level < 10 && (
                            <div className="mt-1 h-1.5 rounded-full overflow-hidden bg-gray-200 group-hover:bg-white/30 transition-colors duration-300">
                              <div
                                className="h-full transition-all duration-300 bg-primary-500 group-hover:bg-white"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
