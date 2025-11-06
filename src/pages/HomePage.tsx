/**
 * Home-Seite - Spielerischer Stil
 * Bunte Fächer-Karten mit Gradienten und 3D-Effekten
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
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
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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

  const handleStartQuiz = () => {
    if (!user || !selectedSubject || !user.class) {
      return;
    }
    const quizUrl = `/quiz?class=${user.class}&subject=${selectedSubject}`;
    navigate(quizUrl);
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubject(subjectId);
  };

  // Farbzuordnung für Fächer
  const subjectColors: Record<string, { gradient: string; shadow: string }> = {
    mathematik: { gradient: 'from-lime-400 to-lime-500', shadow: 'shadow-colored-lime' },
    deutsch: { gradient: 'from-sky-400 to-sky-500', shadow: 'shadow-colored-blue' },
    naturwissenschaften: { gradient: 'from-purple-400 to-purple-500', shadow: 'shadow-colored-purple' },
    kunst: { gradient: 'from-pink-400 to-pink-500', shadow: 'shadow-lg' },
    logik: { gradient: 'from-orange-400 to-orange-500', shadow: 'shadow-lg' },
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Überschrift */}
          <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent animate-fade-in">
            Wähle ein Fach
          </h2>

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
              const isSelected = selectedSubject === subject.id;
              const colors = subjectColors[subject.id] || { gradient: 'from-gray-400 to-gray-500', shadow: 'shadow-lg' };
              
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSubjectSelect(subject.id)}
                  className={`p-6 rounded-xl text-left transition-all duration-300 transform hover:scale-105 border-2 animate-fade-in ${
                    isSelected
                      ? `bg-gradient-to-br ${colors.gradient} text-white border-white shadow-large scale-105`
                      : `bg-gradient-card text-gray-800 border-gray-200 hover:border-gray-300 hover:shadow-large ${colors.shadow}`
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`transform transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                      <IconComponent className="w-10 h-10" />
                    </div>
                    <span className="font-bold text-lg">{subject.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start-Button */}
          {user && selectedSubject && (
            <div className="text-center animate-fade-in">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartQuiz}
                className="text-xl px-12 py-4 shadow-colored-lime"
              >
                Quiz starten 🚀
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
