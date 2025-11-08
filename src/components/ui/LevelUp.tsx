/**
 * LevelUp-Komponente
 * Spielerischer Stil: Feierliche Animation mit bunten Gradienten
 */

import { useEffect, useState } from 'react';
import { Confetti } from './Confetti';
import { Stars } from './Stars';
import { Card } from './Card';
import { Button } from './Button';
import { getLevelRewards } from '../../utils/levelUnlock';

interface LevelUpProps {
  oldLevel: number;
  newLevel: number;
  subject: string;
  onClose: () => void;
}

export function LevelUp({ oldLevel, newLevel, subject, onClose }: LevelUpProps) {
  const [showAnimation, setShowAnimation] = useState(true);
  const rewards = getLevelRewards(newLevel);

  useEffect(() => {
    // Animation nach 4 Sekunden ausblenden
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!showAnimation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {showAnimation && <Confetti show={showAnimation} />}
      {showAnimation && <Stars show={showAnimation} />}
      
      <Card className="relative z-10 max-w-md mx-4 p-8 text-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 border-0 shadow-large animate-bounce">
        <div className="text-9xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-5xl font-bold text-white mb-3 drop-shadow-md">
          Level Up!
        </h2>
        <div className="text-3xl text-white mb-4 font-bold">
          <span className="bg-white/30 px-4 py-2 rounded-xl">{oldLevel}</span>
          <span className="mx-3">→</span>
          <span className="bg-white/30 px-4 py-2 rounded-xl">{newLevel}</span>
        </div>
        <p className="text-xl text-white mb-4 font-semibold drop-shadow-sm">
          Du bist jetzt Level {newLevel} in {subject}! 🌟
        </p>
        {rewards.length > 0 && (
          <div className="mb-4 p-3 bg-white/20 rounded-xl">
            <p className="text-sm text-white font-bold mb-2">Neue Belohnungen:</p>
            {rewards.map((reward, index) => (
              <p key={index} className="text-sm text-white">✨ {reward}</p>
            ))}
          </div>
        )}
        <Button variant="primary" onClick={onClose} className="bg-white text-purple-600 hover:bg-gray-100 shadow-colored-lime text-lg px-8 py-4">
          Weiter
        </Button>
      </Card>
    </div>
  );
}

