/**
 * Game-Seite
 * Zeigt Mini-Spiele basierend auf gameId Parameter
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { NumberSortGame } from '../components/games/NumberSortGame';
import { syncPoints } from '../utils/points';
import { getCurrentUser } from '../services/auth';
import type { GameId, GameResult } from '../types';

const gameComponents: Record<GameId, React.ComponentType<any>> = {
  'number-sort': NumberSortGame,
  'word-match': () => null, // Später implementieren
  'memory': () => null, // Später implementieren
};

export function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('gameId') as GameId | null;
  const classLevel = parseInt(searchParams.get('class') || '1') as 1 | 2 | 3 | 4;
  const subject = searchParams.get('subject') || undefined;

  if (!gameId || !gameComponents[gameId]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-900 mb-4">
            Spiel nicht gefunden
          </h1>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Zurück zur Startseite
          </button>
        </div>
      </div>
    );
  }

  const handleGameComplete = async (result: GameResult) => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser && result.points > 0) {
        await syncPoints(currentUser, result.points);
      }

      // Zur Results-Seite mit Spiel-Ergebnis navigieren
      navigate('/results', {
        state: {
          gameResult: result,
          totalPoints: result.points,
        },
      });
    } catch (error) {
      console.error('Fehler beim Speichern der Spiel-Ergebnisse:', error);
      // Trotzdem zur Results-Seite navigieren
      navigate('/results', {
        state: {
          gameResult: result,
          totalPoints: result.points,
        },
      });
    }
  };

  const handleExit = () => {
    navigate('/home');
  };

  const GameComponent = gameComponents[gameId];

  return (
    <GameComponent
      gameId={gameId}
      classLevel={classLevel}
      subject={subject}
      onComplete={handleGameComplete}
      onExit={handleExit}
    />
  );
}

