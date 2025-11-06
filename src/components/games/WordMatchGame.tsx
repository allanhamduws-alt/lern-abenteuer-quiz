/**
 * WordMatchGame - Wort-Zuordnung Mini-Spiel
 * Spieler müssen Wörter zuordnen (Nomen/Verb, Reime, Synonyme)
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

interface WordPair {
  word: string;
  match: string;
  category: string;
}

export function WordMatchGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [wordPairs, setWordPairs] = useState<WordPair[]>([]);
  const [leftWords, setLeftWords] = useState<string[]>([]);
  const [rightWords, setRightWords] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matches, setMatches] = useState<Map<string, string>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Generiere Wort-Paare basierend auf Klassenstufe
  useEffect(() => {
    generateWordPairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generateWordPairs = () => {
    let pairs: WordPair[] = [];

    if (classLevel === 1) {
      // Klasse 1: Einfache Reime
      pairs = [
        { word: 'Haus', match: 'Maus', category: 'Reim' },
        { word: 'Baum', match: 'Raum', category: 'Reim' },
        { word: 'Sonne', match: 'Wonne', category: 'Reim' },
        { word: 'Ball', match: 'Fall', category: 'Reim' },
        { word: 'Fisch', match: 'Tisch', category: 'Reim' },
      ];
    } else if (classLevel === 2) {
      // Klasse 2: Nomen/Verb Zuordnung
      pairs = [
        { word: 'Hund', match: 'bellt', category: 'Nomen-Verb' },
        { word: 'Katze', match: 'miaut', category: 'Nomen-Verb' },
        { word: 'Vogel', match: 'singt', category: 'Nomen-Verb' },
        { word: 'Kind', match: 'spielt', category: 'Nomen-Verb' },
        { word: 'Blume', match: 'blüht', category: 'Nomen-Verb' },
        { word: 'Auto', match: 'fährt', category: 'Nomen-Verb' },
      ];
    } else if (classLevel === 3) {
      // Klasse 3: Synonyme und Antonyme
      pairs = [
        { word: 'groß', match: 'riesig', category: 'Synonym' },
        { word: 'klein', match: 'winzig', category: 'Synonym' },
        { word: 'schnell', match: 'rasch', category: 'Synonym' },
        { word: 'hell', match: 'dunkel', category: 'Antonym' },
        { word: 'kalt', match: 'warm', category: 'Antonym' },
        { word: 'laut', match: 'leise', category: 'Antonym' },
        { word: 'fröhlich', match: 'traurig', category: 'Antonym' },
      ];
    } else {
      // Klasse 4: Komplexere Zuordnungen
      pairs = [
        { word: 'Buchstabe', match: 'A', category: 'Beispiel' },
        { word: 'Farbe', match: 'Rot', category: 'Beispiel' },
        { word: 'Tier', match: 'Löwe', category: 'Beispiel' },
        { word: 'Obst', match: 'Apfel', category: 'Beispiel' },
        { word: 'Gefühl', match: 'Freude', category: 'Beispiel' },
        { word: 'Beruf', match: 'Lehrer', category: 'Beispiel' },
        { word: 'Sport', match: 'Fußball', category: 'Beispiel' },
        { word: 'Instrument', match: 'Klavier', category: 'Beispiel' },
      ];
    }

    // Mische die Paare
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setWordPairs(shuffled);

    // Erstelle linke und rechte Listen
    const left = shuffled.map((p) => p.word);
    const right = shuffled.map((p) => p.match).sort(() => Math.random() - 0.5);

    setLeftWords(left);
    setRightWords(right);
    setMatches(new Map());
    setIsComplete(false);
    setMistakes(0);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const handleLeftClick = (word: string) => {
    if (isComplete || matches.has(word)) return;

    if (selectedLeft === word) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(word);
      // Wenn rechts bereits ausgewählt, prüfe Match
      if (selectedRight) {
        checkMatch(word, selectedRight);
      }
    }
  };

  const handleRightClick = (word: string) => {
    if (isComplete || Array.from(matches.values()).includes(word)) return;

    if (selectedRight === word) {
      setSelectedRight(null);
    } else {
      setSelectedRight(word);
      // Wenn links bereits ausgewählt, prüfe Match
      if (selectedLeft) {
        checkMatch(selectedLeft, word);
      }
    }
  };

  const checkMatch = (leftWord: string, rightWord: string) => {
    const pair = wordPairs.find((p) => p.word === leftWord);
    const isCorrect = pair?.match === rightWord;

    if (isCorrect) {
      // Richtiges Match!
      const newMatches = new Map(matches);
      newMatches.set(leftWord, rightWord);
      setMatches(newMatches);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Prüfe ob alle Matches gefunden wurden
      if (newMatches.size === wordPairs.length) {
        setIsComplete(true);
        setShowConfetti(true);

        // Punkte berechnen
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const basePoints = 25 * classLevel;
        const timeBonus = Math.max(0, 90 - timeSpent);
        const mistakePenalty = mistakes * 3;
        const calculatedPoints = Math.max(0, basePoints + timeBonus - mistakePenalty);

        setPoints(calculatedPoints);

        setTimeout(() => {
          const result: GameResult = {
            gameId,
            points: calculatedPoints,
            completed: true,
            timeSpent,
            score: 100 - mistakes * 5,
            mistakes,
          };
          onComplete(result);
        }, 2000);
      }
    } else {
      // Falsches Match
      setMistakes((prev) => prev + 1);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const isMatched = (word: string, side: 'left' | 'right') => {
    if (side === 'left') {
      return matches.has(word);
    } else {
      return Array.from(matches.values()).includes(word);
    }
  };

  const getMatchedWord = (word: string) => {
    return matches.get(word);
  };

  const getMatchForRight = (rightWord: string) => {
    for (const [left, right] of matches.entries()) {
      if (right === rightWord) return left;
    }
    return null;
  };

  return (
    <BaseGame
      onExit={onExit}
      title="📚 Wörter zuordnen"
      description={
        classLevel === 1
          ? 'Finde die Reime!'
          : classLevel === 2
          ? 'Ordne Nomen und Verben zu!'
          : classLevel === 3
          ? 'Finde Synonyme und Antonyme!'
          : 'Ordne die Wörter zu!'
      }
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
              {matches.size} Paare gefunden • {mistakes} Fehler
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-primary-700 font-semibold">
                Fortschritt: {matches.size} / {wordPairs.length} Paare gefunden
              </p>
              {mistakes > 0 && (
                <p className="text-sm text-red-600">Fehler: {mistakes}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Linke Seite */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Wörter
                </h3>
                <div className="space-y-2">
                  {leftWords.map((word) => {
                    const matched = isMatched(word, 'left');
                    const selected = selectedLeft === word;
                    return (
                      <button
                        key={word}
                        onClick={() => handleLeftClick(word)}
                        disabled={matched}
                        className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                          matched
                            ? 'bg-green-500 text-white border-2 border-green-700'
                            : selected
                            ? 'bg-primary-500 text-white border-2 border-primary-700'
                            : 'bg-primary-50 border-2 border-primary-300 text-primary-900 hover:bg-primary-100 hover:border-primary-400'
                        }`}
                      >
                        {word}
                        {matched && (
                          <span className="ml-2 text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rechte Seite */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Zuordnungen
                </h3>
                <div className="space-y-2">
                  {rightWords.map((word) => {
                    const matched = isMatched(word, 'right');
                    const selected = selectedRight === word;
                    return (
                      <button
                        key={word}
                        onClick={() => handleRightClick(word)}
                        disabled={matched}
                        className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                          matched
                            ? 'bg-green-500 text-white border-2 border-green-700'
                            : selected
                            ? 'bg-primary-500 text-white border-2 border-primary-700'
                            : 'bg-primary-50 border-2 border-primary-300 text-primary-900 hover:bg-primary-100 hover:border-primary-400'
                        }`}
                      >
                        {word}
                        {matched && (
                          <span className="ml-2 text-sm">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={generateWordPairs} variant="secondary">
                Neue Wörter
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

