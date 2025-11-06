/**
 * Kunst-Icon
 * Flat Design, einfacher Pinsel
 */

export function ArtIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3L5 7L8 10L12 6L9 3Z"
        fill="currentColor"
      />
      <path
        d="M12 6L16 10L19 7L15 3L12 6Z"
        fill="currentColor"
      />
      <path
        d="M8 10L11 13L15 9L12 6L8 10Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M11 13L8 16L12 20L15 17L11 13Z"
        fill="currentColor"
      />
      <path
        d="M15 9L19 13L16 16L12 12L15 9Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

