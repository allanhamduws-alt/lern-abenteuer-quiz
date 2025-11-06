/**
 * Mathematik-Icon
 * Spielerischer Stil: Bunte Gradienten, Schatten, 3D-Effekt
 */

export function MathIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#a3e635" />
        </linearGradient>
        <filter id="mathShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#84cc16" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="url(#mathGradient)" filter="url(#mathShadow)" stroke="#65a30d" strokeWidth="1.5"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="16" x2="12" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="16" r="2" fill="white"/>
    </svg>
  );
}

