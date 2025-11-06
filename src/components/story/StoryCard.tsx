/**
 * StoryCard Komponente
 * Zeigt die Geschichte vor einer Frage an
 */

import type { StoryCharacter, StoryWorld } from '../../types';

interface StoryCardProps {
  character?: StoryCharacter;
  storyText?: string;
  world?: StoryWorld;
}

// Charakter-Emojis und Namen
const characterInfo: Record<StoryCharacter, { emoji: string; name: string }> = {
  max: { emoji: '👦', name: 'Max' },
  luna: { emoji: '👧', name: 'Luna' },
};

// Welt-Emojis und Namen
const worldInfo: Record<StoryWorld, { emoji: string; name: string }> = {
  'mathe-land': { emoji: '🔢', name: 'Mathe-Land' },
  'deutsch-stadt': { emoji: '📚', name: 'Deutsch-Stadt' },
  'natur-paradies': { emoji: '🌳', name: 'Natur-Paradies' },
  'kunst-atelier': { emoji: '🎨', name: 'Kunst-Atelier' },
  'logik-turm': { emoji: '🧩', name: 'Logik-Turm' },
};

export function StoryCard({ character, storyText, world }: StoryCardProps) {
  // Wenn keine Story vorhanden ist, nichts anzeigen
  if (!storyText && !character && !world) {
    return null;
  }

  return (
    <div className="mb-6 p-5 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 rounded-xl border-2 border-purple-300 shadow-medium animate-fade-in">
      {/* Charakter und Welt Header */}
      {(character || world) && (
        <div className="flex items-center gap-3 mb-3">
          {character && (
            <div className="flex items-center gap-2">
              <span className="text-3xl transform hover:scale-110 transition-transform duration-300">{characterInfo[character].emoji}</span>
              <span className="text-lg font-bold text-purple-800">
                {characterInfo[character].name}
              </span>
            </div>
          )}
          {world && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-2xl">{worldInfo[world].emoji}</span>
              <span className="text-base font-bold text-purple-700">
                {worldInfo[world].name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Story-Text */}
      {storyText && (
        <div className="text-base text-gray-800 leading-relaxed font-medium">
          {storyText}
        </div>
      )}
    </div>
  );
}

