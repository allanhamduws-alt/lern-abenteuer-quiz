/**
 * Home-Seite
 * Hier wählt das Kind die Klasse und das Fach aus
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import type { User } from '../types';

const subjects = [
  { id: 'mathematik', name: 'Mathematik', icon: '🔢' },
  { id: 'deutsch', name: 'Deutsch', icon: '📚' },
  { id: 'naturwissenschaften', name: 'Naturwissenschaften', icon: '🔬' },
  { id: 'kunst', name: 'Kunst & Kreativität', icon: '🎨' },
  { id: 'logik', name: 'Logik & Minispiele', icon: '🧩' },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [selectedClass, setSelectedClass] = useState<1 | 2 | 3 | 4 | null>(
    null
  );
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    // Aktuellen Benutzer laden
    getCurrentUser().then(setUser);
  }, []);

  const handleStartQuiz = () => {
    if (selectedClass && selectedSubject) {
      navigate(`/quiz?class=${selectedClass}&subject=${selectedSubject}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Wähle dein Lern-Abenteuer! 🎯
          </h2>

          {/* Klassenauswahl */}
          <Card className="mb-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">
              Welche Klasse besuchst du?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((classLevel) => (
                <button
                  key={classLevel}
                  onClick={() => setSelectedClass(classLevel as 1 | 2 | 3 | 4)}
                  className={`p-6 rounded-lg text-xl font-bold transition-all ${
                    selectedClass === classLevel
                      ? 'bg-primary-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Klasse {classLevel}
                </button>
              ))}
            </div>
          </Card>

          {/* Fachauswahl */}
          {selectedClass && (
            <Card className="mb-6">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Welches Fach möchtest du lernen?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id)}
                    className={`p-6 rounded-lg text-left transition-all ${
                      selectedSubject === subject.id
                        ? 'bg-primary-500 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <div className="text-4xl mb-2">{subject.icon}</div>
                    <div className="font-bold text-lg">{subject.name}</div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Start-Button */}
          {selectedClass && selectedSubject && (
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartQuiz}
                className="text-2xl px-12 py-6"
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

