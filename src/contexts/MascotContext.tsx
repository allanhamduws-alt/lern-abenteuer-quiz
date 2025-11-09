/**
 * MascotContext - Globales Event-System für das Maskottchen
 * Ermöglicht es Komponenten, Events an das Maskottchen zu senden
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type MascotState = 'idle' | 'speaking' | 'happy' | 'thinking' | 'sad' | 'excited' | 'proud';

interface MascotContextType {
  state: MascotState;
  setState: (state: MascotState) => void;
  onAudioStart: () => void;
  onAudioEnd: () => void;
  onSuccess: () => void;
  onError: () => void;
  onThinking: () => void;
  onHappy: () => void;
  onExcited: () => void;
  onProud: () => void;
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

export function MascotProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MascotState>('idle');

  const onAudioStart = useCallback(() => {
    setState('speaking');
  }, []);

  const onAudioEnd = useCallback(() => {
    // Nach dem Sprechen zurück zu idle, aber mit kurzer Verzögerung für natürlichen Übergang
    setTimeout(() => {
      setState('idle');
    }, 300);
  }, []);

  const onSuccess = useCallback(() => {
    setState('happy');
    // Nach 2 Sekunden zurück zu idle
    setTimeout(() => {
      setState('idle');
    }, 2000);
  }, []);

  const onError = useCallback(() => {
    setState('sad');
    // Nach 2 Sekunden zurück zu idle
    setTimeout(() => {
      setState('idle');
    }, 2000);
  }, []);

  const onThinking = useCallback(() => {
    setState('thinking');
    // Nach 3 Sekunden zurück zu idle
    setTimeout(() => {
      setState('idle');
    }, 3000);
  }, []);

  const onHappy = useCallback(() => {
    setState('happy');
    setTimeout(() => {
      setState('idle');
    }, 2000);
  }, []);

  const onExcited = useCallback(() => {
    setState('excited');
    setTimeout(() => {
      setState('idle');
    }, 2000);
  }, []);

  const onProud = useCallback(() => {
    setState('proud');
    setTimeout(() => {
      setState('idle');
    }, 2000);
  }, []);

  return (
    <MascotContext.Provider
      value={{
        state,
        setState,
        onAudioStart,
        onAudioEnd,
        onSuccess,
        onError,
        onThinking,
        onHappy,
        onExcited,
        onProud,
      }}
    >
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
}

