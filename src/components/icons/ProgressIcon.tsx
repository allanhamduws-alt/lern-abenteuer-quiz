/**
 * Progress-Icon
 * Flat Design, einfaches Diagramm
 */

export function ProgressIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="18" width="4" height="4" fill="currentColor"/>
      <rect x="9" y="14" width="4" height="8" fill="currentColor"/>
      <rect x="15" y="10" width="4" height="12" fill="currentColor"/>
      <line x1="5" y1="18" x2="11" y2="14" stroke="currentColor" strokeWidth="2"/>
      <line x1="11" y1="14" x2="17" y2="10" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

