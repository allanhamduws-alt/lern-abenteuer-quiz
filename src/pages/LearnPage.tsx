/**
 * LearnPage - Lernen Sektion
 * Fächer-Auswahl und Aufgabenfeed für Kinder
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { MathIcon, GermanIcon, ScienceIcon, ArtIcon, LogicIcon } from '../components/icons';
import type { User, Progress } from '../types';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: MathIcon },
  { id: 'deutsch', name: 'Deutsch', icon: GermanIcon },
  { id: 'sachunterricht', name: 'Sachunterricht', icon: ScienceIcon },
  { id: 'englisch', name: 'Englisch', icon: ScienceIcon },
  { id: 'musik', name: 'Musik', icon: ArtIcon },
  { id: 'logik', name: 'Logik', icon: LogicIcon },
] as const;

export function LearnPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.role === 'parent') {
          navigate('/parent-dashboard');
          return;
        }
        
        if (currentUser) {
          const userProgress = await loadProgress(currentUser.uid);
          setProgress(userProgress);
        }
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleSubjectClick = (subjectId: string) => {
    if (!user || !user.class) {
      return;
    }
    // TODO: Navigiere zu Aufgaben-Feed für dieses Fach
    // navigate(`/learn/${subjectId}`);
    setSelectedSubject(subjectId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background">
        <Header user={user || undefined} />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8 text-gray-500">Lädt...</div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header user={user || undefined} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent animate-fade-in">
            Lernen 📚
          </h2>

          {!selectedSubject ? (
            <>
              <p className="text-center text-gray-600 mb-8">
                Wähle ein Fach aus, um mit dem Lernen zu beginnen
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => {
                  const IconComponent = subject.icon;
                  const subjectProgress = progress?.subjects[subject.id as keyof typeof progress.subjects];
                  
                  return (
                    <div
                      key={subject.id}
                      className="bg-gradient-card shadow-medium transform hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6"
                      onClick={() => handleSubjectClick(subject.id)}
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <IconComponent className="w-10 h-10 text-blue-600" />
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{subject.name}</h3>
                          {subjectProgress && (
                            <div className="text-sm text-gray-600 mt-1">
                              Level {subjectProgress.level || 1}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="primary" className="w-full">
                        Starten →
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
              <div className="text-center py-8">
                <p className="text-lg text-gray-700 mb-4">
                  Aufgaben-Feed für <strong>{subjects.find(s => s.id === selectedSubject)?.name}</strong> wird geladen...
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  (Wird in nächstem Schritt implementiert)
                </p>
                <Button variant="secondary" onClick={() => setSelectedSubject(null)}>
                  ← Zurück zur Fächer-Auswahl
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

