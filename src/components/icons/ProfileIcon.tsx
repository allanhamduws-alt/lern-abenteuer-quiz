/**
 * Profile-Icon
 * Spielerischer Stil: Grüner Gradient, Schatten, 3D-Effekt
 */

export function ProfileIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <filter id="profileShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#22c55e" floodOpacity="0.3"/>
        </filter>
      </defs>
      <circle cx="12" cy="8" r="4" fill="url(#profileGradient)" filter="url(#profileShadow)"/>
      <path
        d="M6 20C6 16.6863 8.68629 14 12 14C15.3137 14 18 16.6863 18 20"
        stroke="url(#profileGradient)"
        strokeWidth="2"
        fill="none"
        filter="url(#profileShadow)"
        strokeLinecap="round"
      />
    </svg>
  );
}

