/**
 * Card-Komponente für Quiz-Fragen und andere Inhalte
 * Sanfte Schatten und bessere Abgrenzung vom Hintergrund
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
        'bg-white rounded-xl shadow-xl border-2 border-pastel-gray-200 backdrop-blur-sm',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

