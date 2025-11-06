/**
 * Home-Seite - LogicLike-Style
 * Fokus auf Fächer-Auswahl
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

  return (
    <div className="min-h-screen bg-white">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Überschrift */}
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Wähle ein Fach
          </h2>

          {/* Optional: Kurze Übersicht (nur wenn Platz) */}
          {progress && (
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
              <Card padding="sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {progress.learningStreak.current}
                  </div>
                  <div className="text-sm text-gray-600">Tage Streak</div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {progress.totalPoints}
                  </div>
                  <div className="text-sm text-gray-600">Punkte</div>
                </div>
              </Card>
            </div>
          )}

          {/* Fächer-Liste */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {subjects.map((subject) => {
              const IconComponent = subject.icon;
              const isSelected = selectedSubject === subject.id;
              
                      return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSubjectSelect(subject.id)}
                  className={`p-6 rounded-lg text-left transition-colors border-2 ${
                    isSelected
                      ? 'bg-green-500 text-white border-green-600'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${isSelected ? 'text-white' : 'text-purple-600'}`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-lg">{subject.name}</span>
                  </div>
                  </button>
              );
            })}
              </div>

          {/* Start-Button */}
          {user && selectedSubject && (
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartQuiz}
                className="text-xl px-12 py-4"
              >
                Quiz starten
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
