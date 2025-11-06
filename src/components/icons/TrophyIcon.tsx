/**
 * Trophy-Icon für Erfolge
 * Spielerischer Stil: Goldener Gradient, Schatten, 3D-Effekt
 */

export function TrophyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="trophyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <filter id="trophyShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#fcd34d" floodOpacity="0.4"/>
        </filter>
      </defs>
      <path
        d="M6 4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V6C18 7.65685 16.6569 9 15 9H14V11H17C17.5523 11 18 11.4477 18 12V13C18 14.6569 16.6569 16 15 16H9C7.34315 16 6 14.6569 6 13V12C6 11.4477 6.44772 11 7 11H10V9H9C7.34315 9 6 7.65685 6 6V4Z"
        fill="url(#trophyGradient)"
        filter="url(#trophyShadow)"
        stroke="#ca8a04"
        strokeWidth="1"
      />
      <rect x="10" y="16" width="4" height="5" rx="1" fill="url(#trophyGradient)" filter="url(#trophyShadow)"/>
    </svg>
  );
}

