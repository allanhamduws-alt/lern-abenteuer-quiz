/**
 * Games-Seite - Spielerischer Stil
 * Bunte Gradienten, animierte Spiel-Karten, spielerisches Design
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { loadProgress } from '../services/progress';
import { isGameUnlocked, getGameLevelRequirement } from '../utils/levelUnlock';
import { Card } from '../components/ui/Card';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { GameIcon } from '../components/icons';
import type { User } from '../types';

const games = [
  {
    id: 'number-sort',
    name: 'Zahlen sortieren',
    description: 'Sortiere die Zahlen von klein nach groß',
    subject: 'mathematik',
    difficulty: 'einfach',
  },
  {
    id: 'word-match',
    name: 'Wörter zuordnen',
    description: 'Finde die passenden Wort-Paare (Reime, Nomen-Verb, Synonyme)',
    subject: 'deutsch',
    difficulty: 'einfach',
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Finde die passenden Paare - klassisches Memory-Spiel',
    subject: 'logik',
    difficulty: 'einfach',
  },
  {
    id: 'math-puzzle',
    name: 'Rechen-Puzzle',
    description: 'Löse Gleichungen durch Drag & Drop von Zahlen',
    subject: 'mathematik',
    difficulty: 'anspruchsvoll',
  },
  {
    id: 'sentence-builder',
    name: 'Satz-Bau',
    description: 'Baue Sätze in der richtigen Reihenfolge',
    subject: 'deutsch',
    difficulty: 'anspruchsvoll',
  },
  {
    id: 'pattern-continue',
    name: 'Muster fortsetzen',
    description: 'Erkenne logische Muster und setze sie fort',
    subject: 'logik',
    difficulty: 'anspruchsvoll',
  },
  {
    id: 'animal-habitat',
    name: 'Tier-Lebensräume',
    description: 'Ordne Tiere ihren Lebensräumen zu',
    subject: 'naturwissenschaften',
    difficulty: 'anspruchsvoll',
  },
];

export function GamesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.role === 'parent') {
          navigate('/parent-dashboard');
        } else if (currentUser) {
          const userProgress = await loadProgress(currentUser.uid);
          setProgress(userProgress);
        }
      } catch (error) {
        console.error('Fehler beim Laden:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handlePlayGame = (gameId: string, subject: string) => {
    if (!user?.class) return;
    navigate(`/game?gameId=${gameId}&class=${user.class}&subject=${subject}`);
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
          <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent animate-fade-in">
            Mini-Spiele 🎮
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => {
              const subjectProgress = progress?.subjects[game.subject as keyof typeof progress.subjects];
              const unlocked = subjectProgress ? isGameUnlocked(game.id, game.subject as any, subjectProgress) : true;
              const requirement = getGameLevelRequirement(game.id, game.subject as any);
              
              return (
                <Card key={game.id} className={`bg-gradient-card shadow-medium transform hover:scale-105 transition-all duration-300 animate-fade-in ${!unlocked ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="transform transition-transform duration-300 hover:scale-110">
                      <GameIcon className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {game.name}
                        {!unlocked && <span className="ml-2 text-lg">🔒</span>}
                      </h3>
                      <p className="text-gray-600 text-base mb-2">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          game.difficulty === 'einfach'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {game.difficulty === 'einfach' ? '⭐ Einfach' : '⭐⭐ Anspruchsvoll'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {game.subject}
                        </span>
                        {requirement && (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            unlocked
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {requirement.description}
                          </span>
                        )}
                      </div>
                      {!unlocked && subjectProgress && (
                        <p className="text-sm text-red-600 mt-2">
                          Du benötigst Level {requirement?.level || '?'} in {game.subject}. Aktuell: Level {subjectProgress.level || 1}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handlePlayGame(game.id, game.subject)}
                    disabled={!unlocked}
                    className="w-full shadow-colored-lime"
                  >
                    {unlocked ? 'Spielen 🚀' : '🔒 Gesperrt'}
                  </Button>
                </Card>
              );
            })}
          </div>

          {games.length === 0 && (
            <Card className="bg-gradient-to-br from-purple-200 to-pink-200 border-purple-400 shadow-large">
              <div className="text-center py-8">
                <GameIcon className="w-16 h-16 mx-auto mb-3 text-purple-600 opacity-50" />
                <p className="text-lg font-semibold text-gray-800">Noch keine Spiele verfügbar.</p>
                <p className="text-sm text-gray-600 mt-2">Bald kommen neue spannende Spiele! 🎉</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

