/**
 * LevelUp-Komponente
 * Zeigt Level-Up Animation und Erfolgsmeldung
 */

import { useEffect, useState } from 'react';
import { Confetti } from './Confetti';
import { Stars } from './Stars';
import { Card } from './Card';
import { Button } from './Button';

interface LevelUpProps {
  oldLevel: number;
  newLevel: number;
  subject: string;
  onClose: () => void;
}

export function LevelUp({ oldLevel, newLevel, subject, onClose }: LevelUpProps) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Animation nach 3 Sekunden ausblenden
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!showAnimation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {showAnimation && <Confetti show={showAnimation} />}
      {showAnimation && <Stars show={showAnimation} />}
      
      <Card className="relative z-10 max-w-md mx-4 p-8 text-center animate-bounce">
        <div className="text-8xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold text-primary-900 mb-2">
          Level Up!
        </h2>
        <div className="text-2xl text-primary-700 mb-4">
          <span className="text-primary-600">{oldLevel}</span>
          <span className="mx-2">→</span>
          <span className="text-primary-600 font-bold">{newLevel}</span>
        </div>
        <p className="text-lg text-primary-600 mb-6">
          Du bist jetzt Level {newLevel} in {subject}!
        </p>
        <Button variant="primary" onClick={onClose}>
          Weiter
        </Button>
      </Card>
    </div>
  );
}

