/**
 * Games-Seite - Spielerischer Stil
 * Bunte Gradienten, animierte Spiel-Karten
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
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
  },
  // Weitere Spiele können hier hinzugefügt werden
];

export function GamesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser?.role === 'parent') {
          navigate('/parent-dashboard');
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
            {games.map((game, index) => (
              <Card key={game.id} className="bg-gradient-card shadow-medium transform hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="transform transition-transform duration-300 hover:scale-110">
                    <GameIcon className="w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 text-base">
                      {game.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handlePlayGame(game.id, game.subject)}
                  className="w-full shadow-colored-lime"
                >
                  Spielen 🚀
                </Button>
              </Card>
            ))}
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

