/**
 * useAudioSync Hook
 * Synchronisiert Audio-Elemente mit dem Maskottchen-State
 */

import { useEffect, useRef } from 'react';
import { useMascot } from '../contexts/MascotContext';

/**
 * Hook zum Synchronisieren eines Audio-Elements mit dem Maskottchen
 * 
 * @param audioElement - Das HTMLAudioElement, das überwacht werden soll
 * @param enabled - Ob die Synchronisation aktiviert ist
 */
export function useAudioSync(audioElement: HTMLAudioElement | null, enabled: boolean = true) {
  const { onAudioStart, onAudioEnd } = useMascot();

  useEffect(() => {
    if (!enabled || !audioElement) {
      return;
    }

    const handlePlay = () => {
      onAudioStart();
    };

    const handleEnded = () => {
      onAudioEnd();
    };

    const handlePause = () => {
      // Wenn pausiert, zurück zu idle
      onAudioEnd();
    };

    const handleError = () => {
      // Bei Fehler zurück zu idle
      onAudioEnd();
    };

    // Event-Listener hinzufügen
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('error', handleError);

    // Cleanup
    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('error', handleError);
    };
  }, [audioElement, enabled, onAudioStart, onAudioEnd]);
}

/**
 * Hook zum Erstellen und Verwalten eines Audio-Elements für das Maskottchen
 */
export function useFoxAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const createAudio = (audioUrl: string): HTMLAudioElement => {
    // Entferne vorheriges Audio-Element falls vorhanden
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      URL.revokeObjectURL(audioRef.current.src);
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    return audio;
  };

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    audioRef: audioRef.current,
    createAudio,
    cleanup,
  };
}

