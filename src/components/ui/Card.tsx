/**
 * Card-Komponente für Quiz-Fragen und andere Inhalte
 * Spielerischer Stil: Subtile Gradienten, diffuse Schatten, Hover-Effekte
 */

import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Prüfe ob className bereits einen Hintergrund enthält
  const hasCustomBackground = className?.includes('bg-gradient-to') || 
                              (className?.includes('bg-') && !className?.includes('bg-gradient-card'));

  return (
    <div
      className={clsx(
        // Basis-Styles immer setzen
        'rounded-xl shadow-medium border border-gray-100',
        'transition-all duration-300 ease-out',
        'hover:shadow-large hover:scale-[1.01]',
        paddingStyles[padding],
        // Custom className zuerst (damit es bg-gradient-card überschreibt)
        className,
        // Nur bg-gradient-card setzen wenn kein custom background vorhanden ist
        !hasCustomBackground && 'bg-gradient-card'
      )}
    >
      {children}
    </div>
  );
}

