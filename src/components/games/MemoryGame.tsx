/**
 * MemoryGame - Memory Mini-Spiel
 * Klassisches Memory-Spiel mit Zahlen, Formen oder Bildern
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

interface Card {
  id: number;
  value: string | number;
  flipped: boolean;
  matched: boolean;
}

export function MemoryGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [canFlip, setCanFlip] = useState(true);

  // Generiere Karten basierend auf Klassenstufe
  useEffect(() => {
    generateCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generateCards = () => {
    let cardValues: (string | number)[] = [];

    if (classLevel === 1) {
      // Klasse 1: Zahlen 1-4
      cardValues = [1, 2, 3, 4];
    } else if (classLevel === 2) {
      // Klasse 2: Zahlen 1-6
      cardValues = [1, 2, 3, 4, 5, 6];
    } else if (classLevel === 3) {
      // Klasse 3: Formen
      cardValues = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪'];
    } else {
      // Klasse 4: Buchstaben
      cardValues = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    }

    // Erstelle Karten-Paare
    const pairs: (string | number)[] = [];
    cardValues.forEach((value) => {
      pairs.push(value, value); // Jeder Wert kommt zweimal vor
    });

    // Mische die Karten
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);

    // Erstelle Card-Objekte
    const newCards: Card[] = shuffled.map((value, index) => ({
      id: index,
      value,
      flipped: false,
      matched: false,
    }));

    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setIsComplete(false);
    setCanFlip(true);
  };

  const handleCardClick = (cardId: number) => {
    if (!canFlip || isComplete) return;

    const card = cards[cardId];
    if (card.flipped || card.matched || flippedCards.includes(cardId)) return;

    // Maximal 2 Karten gleichzeitig umdrehen
    if (flippedCards.length >= 2) return;

    // Karte umdrehen
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    const newCards = cards.map((c) =>
      c.id === cardId ? { ...c, flipped: true } : c
    );
    setCards(newCards);

    // Wenn 2 Karten umgedreht sind, prüfe Match
    if (newFlippedCards.length === 2) {
      setCanFlip(false);
      setMoves((prev) => prev + 1);

      setTimeout(() => {
        checkMatch(newFlippedCards[0], newFlippedCards[1]);
      }, 1000);
    }
  };

  const checkMatch = (cardId1: number, cardId2: number) => {
    const card1 = cards[cardId1];
    const card2 = cards[cardId2];

    if (card1.value === card2.value) {
      // Match gefunden!
      const newCards = cards.map((c) =>
        c.id === cardId1 || c.id === cardId2
          ? { ...c, matched: true, flipped: true }
          : c
      );
      setCards(newCards);
      setFlippedCards([]);
      setCanFlip(true);

      // Prüfe ob alle Karten gematcht wurden
      const allMatched = newCards.every((c) => c.matched);
      if (allMatched) {
        setIsComplete(true);
        setShowConfetti(true);

        // Punkte berechnen
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const basePoints = 30 * classLevel;
        const moveBonus = Math.max(0, 50 - moves * 2); // Bonus für wenige Züge
        const timeBonus = Math.max(0, 120 - timeSpent);
        const calculatedPoints = Math.max(0, basePoints + moveBonus + timeBonus);

        setPoints(calculatedPoints);

        setTimeout(() => {
          const result: GameResult = {
            gameId,
            points: calculatedPoints,
            completed: true,
            timeSpent,
            score: Math.max(0, 100 - (moves - cards.length / 2) * 5),
            mistakes: Math.max(0, moves - cards.length / 2),
          };
          onComplete(result);
        }, 2000);
      }
    } else {
      // Kein Match - Karten wieder umdrehen
      const newCards = cards.map((c) =>
        c.id === cardId1 || c.id === cardId2
          ? { ...c, flipped: false }
          : c
      );
      setCards(newCards);
      setFlippedCards([]);
      setCanFlip(true);
    }
  };

  return (
    <BaseGame
      onExit={onExit}
      title="🧩 Memory"
      description="Finde die passenden Paare!"
    >
      {showConfetti && <Confetti show={showConfetti} />}

      <div className="space-y-6">
        {isComplete ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-primary-900 mb-2">
              Super gemacht!
            </h2>
            <p className="text-lg text-primary-700 mb-4">
              Du hast {points} Punkte verdient!
            </p>
            <p className="text-sm text-primary-600">
              {moves} Züge • {Math.round((Date.now() - startTime) / 1000)} Sekunden
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-primary-700 font-semibold">
                Züge: {moves}
              </p>
              <p className="text-sm text-primary-700 font-semibold">
                Gefunden: {cards.filter((c) => c.matched).length / 2} / {cards.length / 2} Paare
              </p>
            </div>

            <div
              className={`grid gap-3 ${
                classLevel <= 2
                  ? 'grid-cols-4'
                  : 'grid-cols-4'
              }`}
            >
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.matched || !canFlip}
                  className={`aspect-square rounded-lg font-bold text-2xl transition-all duration-300 ${
                    card.matched
                      ? 'bg-green-500 text-white border-2 border-green-700'
                      : card.flipped
                      ? 'bg-primary-100 border-2 border-primary-500 text-primary-900'
                      : 'bg-primary-200 border-2 border-primary-400 text-primary-900 hover:bg-primary-300 hover:border-primary-500'
                  }`}
                >
                  {card.flipped || card.matched ? (
                    <span>{card.value}</span>
                  ) : (
                    <span className="text-primary-400">?</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={generateCards} variant="secondary">
                Neues Spiel
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

