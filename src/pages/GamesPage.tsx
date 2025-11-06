/**
 * Games-Seite - LogicLike-Style
 * Übersicht aller Mini-Spiele
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
      <div className="min-h-screen bg-white">
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
    <div className="min-h-screen bg-white">
      <Header user={user || undefined} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Mini-Spiele
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <Card key={game.id}>
                <div className="flex items-start gap-4 mb-4">
                  <GameIcon className="w-8 h-8 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {game.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {game.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={() => handlePlayGame(game.id, game.subject)}
                  className="w-full"
                >
                  Spielen
                </Button>
              </Card>
            ))}
          </div>

          {games.length === 0 && (
            <Card>
              <div className="text-center py-8 text-gray-500">
                <GameIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Noch keine Spiele verfügbar.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

