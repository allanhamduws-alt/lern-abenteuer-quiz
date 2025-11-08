/**
 * Game-Seite
 * Zeigt Mini-Spiele basierend auf gameId Parameter
 */

import { useSearchParams, useNavigate } from 'react-router-dom';
import { NumberSortGame } from '../components/games/NumberSortGame';
import { WordMatchGame } from '../components/games/WordMatchGame';
import { MemoryGame } from '../components/games/MemoryGame';
import { MathPuzzleGame } from '../components/games/MathPuzzleGame';
import { SentenceBuilderGame } from '../components/games/SentenceBuilderGame';
import { PatternContinueGame } from '../components/games/PatternContinueGame';
import { AnimalHabitatGame } from '../components/games/AnimalHabitatGame';
import { syncPoints } from '../utils/points';
import { getCurrentUser } from '../services/auth';
import type { GameId, GameResult } from '../types';

const gameComponents: Record<GameId, React.ComponentType<any>> = {
  'number-sort': NumberSortGame,
  'word-match': WordMatchGame,
  'memory': MemoryGame,
  'math-puzzle': MathPuzzleGame,
  'sentence-builder': SentenceBuilderGame,
  'pattern-continue': PatternContinueGame,
  'animal-habitat': AnimalHabitatGame,
};

export function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameId = searchParams.get('gameId') as GameId | null;
  const classLevel = parseInt(searchParams.get('class') || '1') as 1 | 2 | 3 | 4;
  const subject = searchParams.get('subject') || undefined;

  if (!gameId || !gameComponents[gameId]) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="text-center bg-gradient-card p-8 rounded-xl shadow-large border-2 border-purple-400">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-4">
            Spiel nicht gefunden
          </h1>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transform hover:scale-105 transition-all shadow-md hover:shadow-lg"
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

