/**
 * CharacterMascot Komponente
 * Animierter Charakter mit Rigging-System
 * Verwendet die vorhandenen PNG-Assets für flüssige Animationen
 */

import { useEffect, useState, useRef } from 'react';
import { useMascot, type MascotState } from '../contexts/MascotContext';
import { playSoundEffect } from '../services/foxAudio';

interface CharacterMascotProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

// Bild-Pfade
const CHARACTER_IMAGES = {
  fullBody: '/character-assets/Main Full Body 512px.png',
  head: '/character-assets/Head 512x512.png',
  armsLegs: '/character-assets/arm&legs.png',
};

export function CharacterMascot({ 
  className = '',
  position = 'bottom-right'
}: CharacterMascotProps) {
  const { state } = useMascot();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lade Hauptbild beim Mount
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImagesLoaded(true);
    img.onerror = () => {
      console.warn('⚠️ Character-Bild konnte nicht geladen werden');
      setImagesLoaded(false);
    };
    img.src = CHARACTER_IMAGES.fullBody;
  }, []);


  // Spiel Soundeffekte bei State-Transitions ab
  useEffect(() => {
    if (state === 'happy' || state === 'excited' || state === 'proud') {
      playSoundEffect('happy');
    } else if (state === 'thinking') {
      playSoundEffect('thinking');
    } else if (state === 'sad') {
      playSoundEffect('sad');
    }
  }, [state]);

  // Position-Klassen
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // CSS-Klassen für verschiedene States
  const getStateClasses = (currentState: MascotState): string => {
    const baseClasses = 'transition-all duration-500 ease-in-out';
    const stateClasses = {
      idle: 'character-animate-idle',
      speaking: 'character-animate-speaking',
      happy: 'character-animate-happy',
      sad: 'character-animate-sad',
      thinking: 'character-animate-thinking',
      excited: 'character-animate-excited',
      proud: 'character-animate-proud',
    };
    return `${baseClasses} ${stateClasses[currentState] || stateClasses.idle}`;
  };

  // Bestimme welches Bild verwendet werden soll
  const getMainImageSrc = (): string => {
    // Für jetzt verwenden wir das Full Body Bild
    // Später können wir verschiedene Posen hinzufügen
    return CHARACTER_IMAGES.fullBody;
  };

  // Fallback SVG falls Bilder nicht geladen werden können
  const getFallbackSVG = () => {
    return (
      <svg
        viewBox="0 0 200 200"
        className="w-24 h-24 md:w-32 md:h-32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="80" fill="#4A90E2" opacity="0.3" />
        <text x="100" y="110" textAnchor="middle" fontSize="14" fill="#666">
          Charakter
        </text>
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`fixed ${positionClasses[position]} z-10 pointer-events-none ${className} animate-fade-in`}
      style={{ zIndex: 10 }}
    >
      {/* Maskottchen */}
      <div className="transform transition-transform duration-300 hover:scale-110 pointer-events-auto">
        {imagesLoaded ? (
          <div className="relative character-container">
            {/* Hauptkörper - verwendet das Full Body Bild */}
            <img
              src={getMainImageSrc()}
              alt="Charakter Maskottchen"
              className={`w-24 h-24 md:w-32 md:h-32 object-contain ${getStateClasses(state)}`}
              style={{
                imageRendering: 'auto' as const,
                filter: state === 'speaking' ? 'brightness(1.05) saturate(1.1)' : 
                        state === 'happy' || state === 'excited' ? 'brightness(1.1) saturate(1.15)' :
                        state === 'sad' ? 'brightness(0.95) saturate(0.9)' : 'none',
              }}
              onError={() => {
                console.warn('⚠️ Fehler beim Laden des Character-Bildes');
                setImagesLoaded(false);
              }}
            />
          </div>
        ) : (
          getFallbackSVG()
        )}
      </div>
    </div>
  );
}

