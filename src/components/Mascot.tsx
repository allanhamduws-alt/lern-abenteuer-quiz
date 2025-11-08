/**
 * Maskottchen-Komponente
 * Spielerischer Stil: Seitlicher Begleiter mit Cartoon-Sprechblase
 * Fixed Position rechts unten, z-index niedrig
 */

interface MascotProps {
  mood?: 'friendly' | 'happy' | 'explaining' | 'encouraging' | 'excited' | 'proud';
  text?: string;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function Mascot({ 
  mood = 'friendly', 
  text, 
  className = '',
  position = 'bottom-right'
}: MascotProps) {
  // Detaillierte SVG-Illustration eines freundlichen Maskottchens mit Gradienten
  const getMascotSVG = () => {
    switch (mood) {
      case 'happy':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20 md:w-24 md:h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotHappyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <filter id="mascotHappyShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#fcd34d" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotHappyGradient)" filter="url(#mascotHappyShadow)" stroke="#ca8a04" strokeWidth="2"/>
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
            className="w-20 h-20 md:w-24 md:h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotExcitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#84cc16" />
                <stop offset="100%" stopColor="#a3e635" />
              </linearGradient>
              <filter id="mascotExcitedShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#84cc16" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotExcitedGradient)" filter="url(#mascotExcitedShadow)" stroke="#65a30d" strokeWidth="2"/>
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
            className="w-20 h-20 md:w-24 md:h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotProudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <filter id="mascotProudShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#a855f7" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotProudGradient)" filter="url(#mascotProudShadow)" stroke="#9333ea" strokeWidth="2"/>
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
            className="w-20 h-20 md:w-24 md:h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotExplainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
              <filter id="mascotExplainShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotExplainGradient)" filter="url(#mascotExplainShadow)" stroke="#0284c7" strokeWidth="2"/>
            {/* Augen (normal, nachdenkend) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Mund (neutral) */}
            <line x1="40" y1="60" x2="60" y2="60" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            {/* Hand (erklärend) */}
            <circle cx="75" cy="50" r="8" fill="url(#mascotExplainGradient)" filter="url(#mascotExplainShadow)"/>
          </svg>
        );
      case 'encouraging':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20 md:w-24 md:h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotEncourageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#4ade80" />
              </linearGradient>
              <filter id="mascotEncourageShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotEncourageGradient)" filter="url(#mascotEncourageShadow)" stroke="#16a34a" strokeWidth="2"/>
            {/* Augen (motivierend) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Lächeln (motivierend) */}
            <path d="M 35 62 Q 50 70 65 62" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Daumen hoch */}
            <path d="M 70 40 L 70 50 L 75 55 L 80 50 L 80 40 L 75 35 Z" fill="url(#mascotEncourageGradient)" filter="url(#mascotEncourageShadow)"/>
          </svg>
        );
      default: // friendly
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20 md:w-24 md:h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="mascotFriendlyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcd34d" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
              <filter id="mascotFriendlyShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#fcd34d" floodOpacity="0.4"/>
              </filter>
            </defs>
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="url(#mascotFriendlyGradient)" filter="url(#mascotFriendlyShadow)" stroke="#ca8a04" strokeWidth="2"/>
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

  // Position-Klassen basierend auf position prop
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Sprechblasen-Position basierend auf Maskottchen-Position
  const speechBubblePosition = {
    'bottom-right': 'bottom-24 right-0',
    'bottom-left': 'bottom-24 left-0',
    'top-right': 'top-24 right-0',
    'top-left': 'top-24 left-0',
  };

  // Sprechblasen-Schwanz Position (zeigt zum Maskottchen)
  const getSpeechBubbleTail = () => {
    if (position === 'bottom-right' || position === 'bottom-left') {
      // Schwanz zeigt nach unten zum Maskottchen
      return (
        <>
          {/* Border-Schwanz (äußerer Rand) */}
          <div className={`absolute ${position === 'bottom-right' ? 'right-6' : 'left-6'} -bottom-3 w-0 h-0 border-l-[13px] border-r-[13px] border-t-[17px] border-l-transparent border-r-transparent border-t-gray-300`} />
          {/* Weißer Schwanz (innerer Teil) */}
          <div className={`absolute ${position === 'bottom-right' ? 'right-6' : 'left-6'} -bottom-2 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-white`} />
        </>
      );
    } else {
      // Schwanz zeigt nach oben zum Maskottchen
      return (
        <>
          {/* Border-Schwanz (äußerer Rand) */}
          <div className={`absolute ${position === 'top-right' ? 'right-6' : 'left-6'} -top-3 w-0 h-0 border-l-[13px] border-r-[13px] border-b-[17px] border-l-transparent border-r-transparent border-b-gray-300`} />
          {/* Weißer Schwanz (innerer Teil) */}
          <div className={`absolute ${position === 'top-right' ? 'right-6' : 'left-6'} -top-2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-l-transparent border-r-transparent border-b-white`} />
        </>
      );
    }
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-10 pointer-events-none ${className} animate-fade-in`}
      style={{ zIndex: 10 }}
    >
      {/* Sprechblase (wenn Text vorhanden) */}
      {text && (
        <div className={`absolute ${speechBubblePosition[position]} mb-2 max-w-xs md:max-w-sm animate-fade-in`}>
          {/* Sprechblase */}
          <div className="relative bg-white rounded-2xl px-4 py-3 shadow-lg border-2 border-gray-300 pointer-events-auto">
            {/* Cartoon-Schwanz zur Sprechblase */}
            {getSpeechBubbleTail()}
            
            {/* Text */}
            <p className="text-gray-800 text-sm md:text-base font-semibold leading-relaxed relative z-10">
              {text}
            </p>
          </div>
        </div>
      )}

      {/* Maskottchen */}
      <div className="transform transition-transform duration-300 hover:scale-110 pointer-events-auto">
        {getMascotSVG()}
      </div>
    </div>
  );
}
