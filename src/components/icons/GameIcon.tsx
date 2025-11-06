/**
 * Game-Icon
 * Spielerischer Stil: Roter Gradient, Schatten, 3D-Effekt
 */

export function GameIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <filter id="gameShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ef4444" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="4" y="8" width="16" height="10" rx="2" stroke="url(#gameGradient)" strokeWidth="2" fill="url(#gameGradient)" filter="url(#gameShadow)"/>
      <circle cx="9" cy="13" r="1.5" fill="white"/>
      <circle cx="15" cy="13" r="1.5" fill="white"/>
      <rect x="10" y="16" width="4" height="2" rx="1" fill="white"/>
      <path d="M8 6L8 8M16 6L16 8" stroke="url(#gameGradient)" strokeWidth="2" strokeLinecap="round" filter="url(#gameShadow)"/>
    </svg>
  );
}

