/**
 * Maskottchen-Komponente
 * Spielerischer Stil: Detaillierte Illustration mit Gradienten, Animationen, bunten Sprechblasen
 */

interface MascotProps {
  mood?: 'friendly' | 'happy' | 'explaining' | 'encouraging' | 'excited' | 'proud';
  text?: string;
  className?: string;
}

export function Mascot({ mood = 'friendly', text, className = '' }: MascotProps) {
  // Detaillierte SVG-Illustration eines freundlichen Maskottchens mit Gradienten
  const getMascotSVG = () => {
    const baseSize = 100;
    switch (mood) {
      case 'happy':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotHappyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <filter id="mascotShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#fcd34d" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotHappyGradient)" filter="url(#mascotShadow)" stroke="#ca8a04" strokeWidth="2"/>
            {/* Augen (glücklich, geschlossen) */}
            <path d="M 38 45 Q 40 47 42 45" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M 58 45 Q 60 47 62 45" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Lächeln */}
            <path d="M 35 60 Q 50 72 65 60" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Wangen (rosa) */}
            <circle cx="30" cy="58" r="5" fill="#f472b6" opacity="0.6"/>
            <circle cx="70" cy="58" r="5" fill="#f472b6" opacity="0.6"/>
          </svg>
        );
      case 'excited':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotExcitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#a3e635" />
              </linearGradient>
              <filter id="mascotShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#84cc16" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotExcitedGradient)" filter="url(#mascotShadow)" stroke="#65a30d" strokeWidth="2"/>
            {/* Augen (groß, glücklich) */}
            <circle cx="40" cy="45" r="5" fill="#333"/>
            <circle cx="60" cy="45" r="5" fill="#333"/>
            <circle cx="42" cy="43" r="2" fill="white"/>
            <circle cx="62" cy="43" r="2" fill="white"/>
            {/* Großer Lächeln */}
            <path d="M 30 65 Q 50 78 70 65" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </svg>
        );
      case 'proud':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotProudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <filter id="mascotShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotProudGradient)" filter="url(#mascotShadow)" stroke="#9333ea" strokeWidth="2"/>
            {/* Augen (zufrieden) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Lächeln (zufrieden) */}
            <path d="M 35 62 Q 50 70 65 62" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Stern über Kopf */}
            <path d="M 50 15 L 52 20 L 57 20 L 53 23 L 55 28 L 50 25 L 45 28 L 47 23 L 43 20 L 48 20 Z" fill="#fcd34d"/>
          </svg>
        );
      case 'explaining':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotExplainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
              <filter id="mascotShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotExplainGradient)" filter="url(#mascotShadow)" stroke="#0284c7" strokeWidth="2"/>
            {/* Augen (normal, nachdenkend) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Mund (neutral) */}
            <line x1="40" y1="60" x2="60" y2="60" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            {/* Hand (erklärend) */}
            <circle cx="75" cy="50" r="8" fill="url(#mascotExplainGradient)" filter="url(#mascotShadow)"/>
          </svg>
        );
      case 'encouraging':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotEncourageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <filter id="mascotShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotEncourageGradient)" filter="url(#mascotShadow)" stroke="#16a34a" strokeWidth="2"/>
            {/* Augen (motivierend) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Lächeln (motivierend) */}
            <path d="M 35 62 Q 50 70 65 62" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Daumen hoch */}
            <path d="M 70 40 L 70 50 L 75 55 L 80 50 L 80 40 L 75 35 Z" fill="url(#mascotEncourageGradient)" filter="url(#mascotShadow)"/>
          </svg>
        );
      default: // friendly
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotFriendlyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <filter id="mascotShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#fcd34d" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotFriendlyGradient)" filter="url(#mascotShadow)" stroke="#ca8a04" strokeWidth="2"/>
            {/* Augen */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            <circle cx="42" cy="43" r="1.5" fill="white"/>
            <circle cx="62" cy="43" r="1.5" fill="white"/>
            {/* Lächeln */}
            <path d="M 35 60 Q 50 72 65 60" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className} animate-fade-in`}>
      <div className="transform transition-transform duration-300 hover:scale-110">
        {getMascotSVG()}
      </div>
      {text && (
        <div className="bg-gradient-to-r from-pink-400 to-purple-400 rounded-2xl px-6 py-3 shadow-large border-2 border-white/50 max-w-xs animate-fade-in">
          <p className="text-white text-sm font-semibold text-center drop-shadow-sm">{text}</p>
        </div>
      )}
    </div>
  );
}

