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

  return (
    <div
      className={clsx(
        'bg-gradient-card rounded-xl shadow-medium border border-gray-100',
        'transition-all duration-300 ease-out',
        'hover:shadow-large hover:scale-[1.01]',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

