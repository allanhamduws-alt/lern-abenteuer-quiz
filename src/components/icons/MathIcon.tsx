/**
 * Mathematik-Icon
 * Flat Design, einfacher Taschenrechner
 */

export function MathIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/>
      <line x1="8" y1="16" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="16" r="2" fill="currentColor"/>
    </svg>
  );
}

