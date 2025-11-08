/**
 * Wiederverwendbare Button-Komponente
 * Spielerischer Stil: Gradienten, 3D-Effekte, bunte Farben
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
    'font-bold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-offset-2 transform hover:scale-105 active:scale-95 active:shadow-pressed';

  const variantStyles = {
    primary:
      'bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg focus:ring-green-300',
    secondary:
      'bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300 hover:shadow-md focus:ring-gray-400',
    success:
      'bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg focus:ring-green-300',
    danger: 
      'bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg focus:ring-red-300',
    warning: 
      'bg-yellow-400 text-gray-900 shadow-md hover:bg-yellow-500 hover:shadow-lg focus:ring-yellow-300',
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
        disabled && 'opacity-50 cursor-not-allowed transform-none hover:scale-100',
        className
      )}
    >
      {children}
    </button>
  );
}

