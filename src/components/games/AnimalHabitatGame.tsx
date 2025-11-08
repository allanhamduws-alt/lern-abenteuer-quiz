/**
 * AnimalHabitatGame - Tier-Lebensräume Mini-Spiel
 * Spieler müssen Tiere ihren Lebensräumen zuordnen
 * Fördert Wissen über Natur und Tiere
 */

import { useState, useEffect } from 'react';
import { BaseGame } from './BaseGame';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import type { BaseGameProps, GameResult } from '../../types';

interface AnimalHabitat {
  id: string;
  animal: string;
  emoji: string;
  habitat: string;
  habitatEmoji: string;
  description: string;
}

export function AnimalHabitatGame({
  gameId,
  classLevel,
  onComplete,
  onExit,
}: BaseGameProps) {
  const [pairs, setPairs] = useState<AnimalHabitat[]>([]);
  const [animals, setAnimals] = useState<AnimalHabitat[]>([]);
  const [habitats, setHabitats] = useState<string[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalHabitat | null>(null);
  const [selectedHabitat, setSelectedHabitat] = useState<string | null>(null);
  const [matches, setMatches] = useState<Map<string, string>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(Date.now());
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    generatePairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classLevel]);

  const generatePairs = () => {
    let pairsList: AnimalHabitat[] = [];

    if (classLevel === 1) {
      // Klasse 1: Einfache, bekannte Tiere
      pairsList = [
        {
          id: '1',
          animal: 'Hund',
          emoji: '🐕',
          habitat: 'Haus',
          habitatEmoji: '🏠',
          description: 'Hunde leben bei Menschen',
        },
        {
          id: '2',
          animal: 'Katze',
          emoji: '🐱',
          habitat: 'Haus',
          habitatEmoji: '🏠',
          description: 'Katzen leben bei Menschen',
        },
        {
          id: '3',
          animal: 'Fisch',
          emoji: '🐟',
          habitat: 'Wasser',
          habitatEmoji: '🌊',
          description: 'Fische leben im Wasser',
        },
        {
          id: '4',
          animal: 'Vogel',
          emoji: '🐦',
          habitat: 'Himmel',
          habitatEmoji: '☁️',
          description: 'Vögel fliegen im Himmel',
        },
        {
          id: '5',
          animal: 'Bär',
          emoji: '🐻',
          habitat: 'Wald',
          habitatEmoji: '🌲',
          description: 'Bären leben im Wald',
        },
      ];
    } else if (classLevel === 2) {
      // Klasse 2: Mehr Tiere und Lebensräume
      pairsList = [
        {
          id: '1',
          animal: 'Delfin',
          emoji: '🐬',
          habitat: 'Meer',
          habitatEmoji: '🌊',
          description: 'Delfine leben im Meer',
        },
        {
          id: '2',
          animal: 'Eichhörnchen',
          emoji: '🐿️',
          habitat: 'Wald',
          habitatEmoji: '🌲',
          description: 'Eichhörnchen leben im Wald',
        },
        {
          id: '3',
          animal: 'Pinguin',
          emoji: '🐧',
          habitat: 'Eis',
          habitatEmoji: '🧊',
          description: 'Pinguine leben auf dem Eis',
        },
        {
          id: '4',
          animal: 'Löwe',
          emoji: '🦁',
          habitat: 'Savanne',
          habitatEmoji: '🌍',
          description: 'Löwen leben in der Savanne',
        },
        {
          id: '5',
          animal: 'Frosch',
          emoji: '🐸',
          habitat: 'Teich',
          habitatEmoji: '💧',
          description: 'Frösche leben am Teich',
        },
        {
          id: '6',
          animal: 'Biene',
          emoji: '🐝',
          habitat: 'Wiese',
          habitatEmoji: '🌼',
          description: 'Bienen leben auf der Wiese',
        },
      ];
    } else if (classLevel === 3) {
      // Klasse 3: Spezialisierte Lebensräume
      pairsList = [
        {
          id: '1',
          animal: 'Wal',
          emoji: '🐋',
          habitat: 'Ozean',
          habitatEmoji: '🌊',
          description: 'Wale leben im Ozean',
        },
        {
          id: '2',
          animal: 'Kamel',
          emoji: '🐫',
          habitat: 'Wüste',
          habitatEmoji: '🏜️',
          description: 'Kamele leben in der Wüste',
        },
        {
          id: '3',
          animal: 'Eisbär',
          emoji: '🐻‍❄️',
          habitat: 'Arktis',
          habitatEmoji: '🧊',
          description: 'Eisbären leben in der Arktis',
        },
        {
          id: '4',
          animal: 'Affe',
          emoji: '🐵',
          habitat: 'Dschungel',
          habitatEmoji: '🌴',
          description: 'Affen leben im Dschungel',
        },
        {
          id: '5',
          animal: 'Krokodil',
          emoji: '🐊',
          habitat: 'Fluss',
          habitatEmoji: '🌊',
          description: 'Krokodile leben am Fluss',
        },
        {
          id: '6',
          animal: 'Eule',
          emoji: '🦉',
          habitat: 'Wald',
          habitatEmoji: '🌲',
          description: 'Eulen leben im Wald',
        },
        {
          id: '7',
          animal: 'Schmetterling',
          emoji: '🦋',
          habitat: 'Garten',
          habitatEmoji: '🌺',
          description: 'Schmetterlinge leben im Garten',
        },
      ];
    } else {
      // Klasse 4: Komplexe Lebensräume
      pairsList = [
        {
          id: '1',
          animal: 'Seestern',
          emoji: '⭐',
          habitat: 'Korallenriff',
          habitatEmoji: '🐠',
          description: 'Seesterne leben im Korallenriff',
        },
        {
          id: '2',
          animal: 'Giraffe',
          emoji: '🦒',
          habitat: 'Savanne',
          habitatEmoji: '🌍',
          description: 'Giraffen leben in der Savanne',
        },
        {
          id: '3',
          animal: 'Polarfuchs',
          emoji: '🦊',
          habitat: 'Tundra',
          habitatEmoji: '❄️',
          description: 'Polarfüchse leben in der Tundra',
        },
        {
          id: '4',
          animal: 'Tintenfisch',
          emoji: '🦑',
          habitat: 'Tiefsee',
          habitatEmoji: '🌊',
          description: 'Tintenfische leben in der Tiefsee',
        },
        {
          id: '5',
          animal: 'Koala',
          emoji: '🐨',
          habitat: 'Eukalyptuswald',
          habitatEmoji: '🌳',
          description: 'Koalas leben im Eukalyptuswald',
        },
        {
          id: '6',
          animal: 'Schlange',
          emoji: '🐍',
          habitat: 'Wüste',
          habitatEmoji: '🏜️',
          description: 'Schlangen leben in der Wüste',
        },
        {
          id: '7',
          animal: 'Papagei',
          emoji: '🦜',
          habitat: 'Regenwald',
          habitatEmoji: '🌴',
          description: 'Papageien leben im Regenwald',
        },
        {
          id: '8',
          animal: 'Robbe',
          emoji: '🦭',
          habitat: 'Küste',
          habitatEmoji: '🏖️',
          description: 'Robben leben an der Küste',
        },
      ];
    }

    // Mische die Paare
    const shuffled = [...pairsList].sort(() => Math.random() - 0.5);
    setPairs(shuffled);

    // Erstelle separate Listen für Tiere und Lebensräume
    const uniqueHabitats = [...new Set(shuffled.map(p => p.habitat))];
    setAnimals(shuffled);
    setHabitats(uniqueHabitats.sort(() => Math.random() - 0.5));
    setMatches(new Map());
    setIsComplete(false);
    setMistakes(0);
    setSelectedAnimal(null);
    setSelectedHabitat(null);
  };

  const handleAnimalClick = (animal: AnimalHabitat) => {
    if (isComplete || matches.has(animal.id)) return;

    if (selectedAnimal?.id === animal.id) {
      setSelectedAnimal(null);
    } else {
      setSelectedAnimal(animal);
      // Wenn bereits ein Lebensraum ausgewählt ist, prüfe Match
      if (selectedHabitat) {
        checkMatch(animal, selectedHabitat);
      }
    }
  };

  const handleHabitatClick = (habitat: string) => {
    if (isComplete || Array.from(matches.values()).includes(habitat)) return;

    if (selectedHabitat === habitat) {
      setSelectedHabitat(null);
    } else {
      setSelectedHabitat(habitat);
      // Wenn bereits ein Tier ausgewählt ist, prüfe Match
      if (selectedAnimal) {
        checkMatch(selectedAnimal, habitat);
      }
    }
  };

  const checkMatch = (animal: AnimalHabitat, habitat: string) => {
    const isCorrect = animal.habitat === habitat;

    if (isCorrect) {
      // Richtiges Match!
      const newMatches = new Map(matches);
      newMatches.set(animal.id, habitat);
      setMatches(newMatches);
      setSelectedAnimal(null);
      setSelectedHabitat(null);

      // Prüfe ob alle Matches gefunden wurden
      if (newMatches.size === pairs.length) {
        setIsComplete(true);
        setShowConfetti(true);

        // Punkte berechnen
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        const basePoints = 35 * classLevel;
        const timeBonus = Math.max(0, 120 - timeSpent);
        const mistakePenalty = mistakes * 4;
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
      setMistakes(prev => prev + 1);
      setSelectedAnimal(null);
      setSelectedHabitat(null);
    }
  };

  const isAnimalMatched = (animalId: string) => {
    return matches.has(animalId);
  };

  const isHabitatMatched = (habitat: string) => {
    return Array.from(matches.values()).includes(habitat);
  };

  const getAnimalForHabitat = (habitat: string) => {
    for (const [animalId, matchedHabitat] of matches.entries()) {
      if (matchedHabitat === habitat) {
        return pairs.find(p => p.id === animalId);
      }
    }
    return null;
  };

  return (
    <BaseGame
      onExit={onExit}
      title="🌍 Tier-Lebensräume"
      description="Ordne die Tiere ihren Lebensräumen zu!"
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
              {pairs.length} Paare gefunden • {mistakes} Fehler
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-primary-700 font-semibold">
                Fortschritt: {matches.size} / {pairs.length} Paare gefunden
              </p>
              {mistakes > 0 && (
                <p className="text-sm text-red-600">Fehler: {mistakes}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tiere */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Tiere 🐾
                </h3>
                <div className="space-y-2">
                  {animals.map((animal) => {
                    const matched = isAnimalMatched(animal.id);
                    const selected = selectedAnimal?.id === animal.id;
                    const matchedHabitat = matches.get(animal.id);
                    
                    return (
                      <button
                        key={animal.id}
                        onClick={() => handleAnimalClick(animal)}
                        disabled={matched}
                        className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                          matched
                            ? 'bg-green-500 text-white border-2 border-green-700'
                            : selected
                            ? 'bg-primary-500 text-white border-2 border-primary-700'
                            : 'bg-primary-50 border-2 border-primary-300 text-primary-900 hover:bg-primary-100 hover:border-primary-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{animal.emoji}</span>
                          <div className="flex-1">
                            <div className="font-bold text-lg">{animal.animal}</div>
                            {matched && matchedHabitat && (
                              <div className="text-sm opacity-90">
                                → {matchedHabitat}
                              </div>
                            )}
                          </div>
                          {matched && <span className="text-xl">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lebensräume */}
              <div>
                <h3 className="text-lg font-semibold text-primary-900 mb-3">
                  Lebensräume 🌍
                </h3>
                <div className="space-y-2">
                  {habitats.map((habitat) => {
                    const matched = isHabitatMatched(habitat);
                    const selected = selectedHabitat === habitat;
                    const matchedAnimal = getAnimalForHabitat(habitat);
                    const habitatData = pairs.find(p => p.habitat === habitat);
                    
                    return (
                      <button
                        key={habitat}
                        onClick={() => handleHabitatClick(habitat)}
                        disabled={matched}
                        className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                          matched
                            ? 'bg-green-500 text-white border-2 border-green-700'
                            : selected
                            ? 'bg-primary-500 text-white border-2 border-primary-700'
                            : 'bg-primary-50 border-2 border-primary-300 text-primary-900 hover:bg-primary-100 hover:border-primary-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {habitatData?.habitatEmoji || '🌍'}
                          </span>
                          <div className="flex-1">
                            <div className="font-bold text-lg">{habitat}</div>
                            {matched && matchedAnimal && (
                              <div className="text-sm opacity-90">
                                ← {matchedAnimal.animal}
                              </div>
                            )}
                          </div>
                          {matched && <span className="text-xl">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hinweis */}
            <div className="mt-6 p-4 bg-primary-100 rounded-xl border-2 border-primary-300">
              <p className="text-sm text-primary-700">
                💡 <strong>Tipp:</strong> Klicke zuerst auf ein Tier, dann auf den passenden Lebensraum!
              </p>
            </div>

            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={generatePairs} variant="secondary">
                Neues Spiel
              </Button>
            </div>
          </>
        )}
      </div>
    </BaseGame>
  );
}

