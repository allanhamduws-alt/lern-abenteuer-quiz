/**
 * Logik-Icon
 * Spielerischer Stil: Oranger Gradient, Schatten, 3D-Effekt
 */

export function LogicIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={`${className} drop-shadow-md transition-transform duration-300 hover:scale-110`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logicGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="logicGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="logicShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#fb923c" floodOpacity="0.3"/>
        </filter>
      </defs>
      <path
        d="M8 4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V8C17.1046 8 18 8.89543 18 10V14C18 15.1046 17.1046 16 16 16H12C10.8954 16 10 15.1046 10 14V10C8.89543 10 8 9.10457 8 8V4Z"
        fill="url(#logicGradient1)"
        filter="url(#logicShadow)"
      />
      <path
        d="M6 8C6 6.89543 6.89543 6 8 6H12C13.1046 6 14 6.89543 14 8V12C15.1046 12 16 12.8954 16 14V18C16 19.1046 15.1046 20 14 20H10C8.89543 20 8 19.1046 8 18V14C6.89543 14 6 13.1046 6 12V8Z"
        fill="url(#logicGradient2)"
        filter="url(#logicShadow)"
        opacity="0.7"
      />
    </svg>
  );
}

