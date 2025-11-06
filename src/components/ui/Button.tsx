/**
 * Wiederverwendbare Button-Komponente
 * Gradient-Buttons mit Pastell-Farben für bessere Sichtbarkeit
 */

import clsx from 'clsx';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className,
}: ButtonProps) {
  const baseStyles =
    'font-bold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 active:scale-95 shadow-lg';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-pastel-blue-400 to-pastel-purple-400 text-white hover:from-pastel-blue-500 hover:to-pastel-purple-500 hover:shadow-xl focus:ring-pastel-purple-300',
    secondary:
      'bg-gradient-to-r from-pastel-gray-300 to-pastel-blue-300 text-gray-800 hover:from-pastel-gray-400 hover:to-pastel-blue-400 hover:shadow-xl focus:ring-pastel-blue-300 border-2 border-pastel-blue-200',
    success:
      'bg-gradient-to-r from-pastel-green-400 to-pastel-green-300 text-white hover:from-pastel-green-500 hover:to-pastel-green-400 hover:shadow-xl focus:ring-pastel-green-300',
    danger: 
      'bg-gradient-to-r from-pastel-pink-400 to-pastel-purple-400 text-white hover:from-pastel-pink-500 hover:to-pastel-purple-500 hover:shadow-xl focus:ring-pastel-pink-300',
    warning: 
      'bg-gradient-to-r from-pastel-orange-400 to-pastel-yellow-400 text-white hover:from-pastel-orange-500 hover:to-pastel-yellow-500 hover:shadow-xl focus:ring-pastel-orange-300',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
    >
      {children}
    </button>
  );
}

