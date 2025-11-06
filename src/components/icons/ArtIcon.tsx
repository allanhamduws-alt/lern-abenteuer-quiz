/**
 * Kunst-Icon
 * Spielerischer Stil: Pinker Gradient, Schatten, 3D-Effekt
 */

export function ArtIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="artGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="artGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <filter id="artShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f472b6" floodOpacity="0.3"/>
        </filter>
      </defs>
      <path
        d="M9 3L5 7L8 10L12 6L9 3Z"
        fill="url(#artGradient1)"
        filter="url(#artShadow)"
      />
      <path
        d="M12 6L16 10L19 7L15 3L12 6Z"
        fill="url(#artGradient2)"
        filter="url(#artShadow)"
      />
      <path
        d="M8 10L11 13L15 9L12 6L8 10Z"
        fill="url(#artGradient1)"
        filter="url(#artShadow)"
        opacity="0.7"
      />
      <path
        d="M11 13L8 16L12 20L15 17L11 13Z"
        fill="url(#artGradient2)"
        filter="url(#artShadow)"
      />
      <path
        d="M15 9L19 13L16 16L12 12L15 9Z"
        fill="url(#artGradient1)"
        filter="url(#artShadow)"
        opacity="0.7"
      />
    </svg>
  );
}

