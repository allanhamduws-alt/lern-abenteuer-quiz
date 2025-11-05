/**
 * Sterne-Animation für 100% Erfolge
 */

interface StarsProps {
  show: boolean;
}

export function Stars({ show }: StarsProps) {
  if (!show) return null;

  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 0.5,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 10 + Math.random() * 20,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute animate-star-burst"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        >
          <div className="text-3xl">⭐</div>
        </div>
      ))}
    </div>
  );
}

