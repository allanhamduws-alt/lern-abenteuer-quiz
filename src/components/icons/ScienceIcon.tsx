/**
 * Naturwissenschaften-Icon
 * Flat Design, einfaches Atom-Symbol
 */

export function ScienceIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <ellipse cx="12" cy="12" rx="8" ry="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <ellipse cx="12" cy="12" rx="3" ry="8" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(45 12 12)"/>
      <ellipse cx="12" cy="12" rx="3" ry="8" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(-45 12 12)"/>
    </svg>
  );
}

