/**
 * Loading-Spinner Komponente
 * Interessante, kindgerechte Loading-Animation
 */

export function LoadingSpinner({ text = 'Lade...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-4 h-4 bg-primary-500 rounded-full animate-bounce-dot"></div>
        <div className="absolute top-0 right-0 w-4 h-4 bg-primary-500 rounded-full animate-bounce-dot-delay-1"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 bg-primary-500 rounded-full animate-bounce-dot-delay-2"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0.6s' }}></div>
      </div>
      <p className="text-xl text-gray-600 font-semibold animate-pulse">{text}</p>
    </div>
  );
}

