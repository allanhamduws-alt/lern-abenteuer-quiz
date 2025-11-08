/**
 * Fox Audio Service
 * Spezielle Audio-Funktionen für das Maskottchen
 * Konsistente Stimme und Soundeffekte
 */

import { textToSpeech, type OpenAIVoice } from './openai';

// Konsistente Stimme für den Fuchs - 'nova' ist freundlich, kindgerecht und realistisch
const FOX_VOICE: OpenAIVoice = 'nova';

/**
 * Text-to-Speech für das Maskottchen mit konsistenter Stimme
 */
export async function foxTextToSpeech(text: string): Promise<string> {
  return textToSpeech(text, FOX_VOICE);
}

/**
 * Soundeffekte für verschiedene States
 */
export type SoundEffect = 'happy' | 'thinking' | 'sad' | 'success' | 'excited' | 'proud';

/**
 * Spielt einen Soundeffekt ab
 * Falls keine Sound-Datei vorhanden ist, wird ein einfacher Browser-Ton generiert
 */
export function playSoundEffect(effect: SoundEffect): void {
  try {
    // Versuche Sound-Datei zu laden
    const soundPath = `/sounds/fox-${effect}.mp3`;
    const audio = new Audio(soundPath);
    
    audio.volume = 0.5; // 50% Lautstärke für Soundeffekte
    audio.play().catch((error) => {
      console.warn(`⚠️ Soundeffekt ${effect} konnte nicht abgespielt werden:`, error);
      // Fallback: Generiere einfachen Browser-Ton
      generateFallbackSound(effect);
    });
  } catch (error) {
    console.warn(`⚠️ Fehler beim Laden des Soundeffekts ${effect}:`, error);
    generateFallbackSound(effect);
  }
}

/**
 * Generiert einen einfachen Fallback-Sound mit Web Audio API
 */
function generateFallbackSound(effect: SoundEffect): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Verschiedene Frequenzen für verschiedene Effekte
    const frequencies: Record<SoundEffect, number> = {
      happy: 440,      // A4 - fröhlich
      thinking: 330,   // E4 - nachdenklich
      sad: 220,        // A3 - tiefer, trauriger
      success: 523,    // C5 - höher, erfolgreich
      excited: 659,    // E5 - sehr hoch, aufgeregt
      proud: 494,      // B4 - stolz
    };
    
    const frequency = frequencies[effect] || 440;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = effect === 'sad' ? 'sine' : 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.warn('⚠️ Fallback-Sound konnte nicht generiert werden:', error);
  }
}

/**
 * Kombiniert Text-to-Speech mit Soundeffekt
 */
export async function foxSpeakWithEffect(
  text: string,
  effect?: SoundEffect
): Promise<string> {
  // Spiel Soundeffekt ab, falls angegeben
  if (effect) {
    playSoundEffect(effect);
  }
  
  // Generiere und gib Audio-URL zurück
  return foxTextToSpeech(text);
}

