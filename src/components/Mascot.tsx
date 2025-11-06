/**
 * Maskottchen-Komponente
 * Konsistentes Maskottchen durch die App
 */

interface MascotProps {
  mood?: 'friendly' | 'happy' | 'explaining' | 'encouraging';
  text?: string;
  className?: string;
}

export function Mascot({ mood = 'friendly', text, className = '' }: MascotProps) {
  // Einfache SVG-Illustration eines freundlichen Maskottchens
  // Flacher Stil, kindgerecht
  const getMascotSVG = () => {
    switch (mood) {
      case 'happy':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="#FFD93D" stroke="#333" strokeWidth="2"/>
            {/* Augen (glücklich) */}
            <ellipse cx="40" cy="45" rx="4" ry="6" fill="#333"/>
            <ellipse cx="60" cy="45" rx="4" ry="6" fill="#333"/>
            {/* Lächeln */}
            <path d="M 35 60 Q 50 70 65 60" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        );
      case 'explaining':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="#FFD93D" stroke="#333" strokeWidth="2"/>
            {/* Augen (normal) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Mund (neutral) */}
            <line x1="40" y1="60" x2="60" y2="60" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'encouraging':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="#FFD93D" stroke="#333" strokeWidth="2"/>
            {/* Augen (motivierend) */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Lächeln (motivierend) */}
            <path d="M 35 60 Q 50 68 65 60" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        );
      default: // friendly
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Kopf */}
            <circle cx="50" cy="50" r="35" fill="#FFD93D" stroke="#333" strokeWidth="2"/>
            {/* Augen */}
            <circle cx="40" cy="45" r="4" fill="#333"/>
            <circle cx="60" cy="45" r="4" fill="#333"/>
            {/* Lächeln */}
            <path d="M 35 60 Q 50 70 65 60" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {getMascotSVG()}
      {text && (
        <div className="bg-white rounded-lg px-4 py-2 shadow-md border border-gray-200 max-w-xs">
          <p className="text-gray-800 text-sm text-center">{text}</p>
        </div>
      )}
    </div>
  );
}

