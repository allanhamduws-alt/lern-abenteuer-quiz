/**
 * Deutsch-Icon
 * Flat Design, einfaches Buch
 */

export function GermanIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 19.5C4 18.6716 4.67157 18 5.5 18H19.5C20.3284 18 21 18.6716 21 19.5C21 20.3284 20.3284 21 19.5 21H5.5C4.67157 21 4 20.3284 4 19.5Z"
        fill="currentColor"
      />
      <path
        d="M5.5 3C4.67157 3 4 3.67157 4 4.5V18C4 18.8284 4.67157 19.5 5.5 19.5H19.5C20.3284 19.5 21 18.8284 21 18V4.5C21 3.67157 20.3284 3 19.5 3H5.5Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="2"/>
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="2"/>
      <line x1="8" y1="13" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

