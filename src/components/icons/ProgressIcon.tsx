/**
 * Progress-Icon
 * Spielerischer Stil: Bunte Gradienten, Schatten, 3D-Effekt
 */

export function ProgressIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="progressGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="progressGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="progressGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="progressShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.3"/>
        </filter>
      </defs>
      <rect x="3" y="18" width="4" height="4" rx="1" fill="url(#progressGradient1)" filter="url(#progressShadow)"/>
      <rect x="9" y="14" width="4" height="8" rx="1" fill="url(#progressGradient2)" filter="url(#progressShadow)"/>
      <rect x="15" y="10" width="4" height="12" rx="1" fill="url(#progressGradient3)" filter="url(#progressShadow)"/>
      <line x1="5" y1="18" x2="11" y2="14" stroke="#0284c7" strokeWidth="2" strokeLinecap="round"/>
      <line x1="11" y1="14" x2="17" y2="10" stroke="#9333ea" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

