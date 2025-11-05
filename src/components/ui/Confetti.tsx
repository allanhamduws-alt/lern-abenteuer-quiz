/**
 * Konfetti-Animation für Erfolge
 * CSS-only Implementierung ohne externe Libraries
 */

interface ConfettiProps {
  show: boolean;
}

export function Confetti({ show }: ConfettiProps) {
  if (!show) return null;

  // Erstelle viele Konfetti-Partikel
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random(),
    left: Math.random() * 100,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][
      Math.floor(Math.random() * 7)
    ],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

