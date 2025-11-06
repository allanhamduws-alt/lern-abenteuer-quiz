/**
 * Naturwissenschaften-Icon
 * Spielerischer Stil: Lila Gradient, Schatten, 3D-Effekt
 */

export function ScienceIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="scienceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <filter id="scienceShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#a855f7" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="2" fill="url(#scienceGradient)" filter="url(#scienceShadow)"/>
      <ellipse cx="12" cy="12" rx="8" ry="3" stroke="url(#scienceGradient)" strokeWidth="2" fill="none" filter="url(#scienceShadow)"/>
      <ellipse cx="12" cy="12" rx="3" ry="8" stroke="url(#scienceGradient)" strokeWidth="2" fill="none" transform="rotate(45 12 12)" filter="url(#scienceShadow)"/>
      <ellipse cx="12" cy="12" rx="3" ry="8" stroke="url(#scienceGradient)" strokeWidth="2" fill="none" transform="rotate(-45 12 12)" filter="url(#scienceShadow)"/>
    </svg>
  );
}

