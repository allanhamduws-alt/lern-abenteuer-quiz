/**
 * Card-Komponente für Quiz-Fragen und andere Inhalte
 * Bietet eine schöne, abgerundete Karte mit Schatten
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
        'bg-white rounded-xl shadow-lg border border-gray-200',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

