/**
 * Badge-Komponente für Erfolge und Punkte
 * Spielerischer Stil: Gradient-Hintergründe, Schatten, 3D-Effekte
 */

import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-gradient-card text-gray-800 border-2 border-gray-300 shadow-soft',
    success: 'bg-gradient-success text-white shadow-colored-lime',
    warning: 'bg-gradient-warning text-gray-800 shadow-lg',
    info: 'bg-gradient-secondary text-white shadow-colored-blue',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs rounded-lg',
    md: 'px-4 py-1.5 text-sm rounded-xl',
    lg: 'px-5 py-2 text-base rounded-xl',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold transition-all duration-300 transform hover:scale-105',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

