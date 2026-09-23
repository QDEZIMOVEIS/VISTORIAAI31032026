import React from 'react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e?: any) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  className?: string;
  disabled?: boolean;
  icon?: any;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false, 
  icon: Icon, 
  size = 'md',
  type = 'button',
  title
}) => {
  const variants: Record<string, string> = {
    primary: 'bg-red-700 text-white hover:bg-red-800',
    secondary: 'bg-white text-red-700 border border-red-700 hover:bg-red-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs sm:text-sm min-h-[36px]',
    md: 'px-4 py-2.5 sm:py-2 text-sm sm:text-base min-h-[44px] sm:min-h-[40px]',
    lg: 'px-6 py-3.5 sm:py-3 text-base sm:text-lg min-h-[48px]',
  };

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {Icon && <Icon className={`mr-2 shrink-0 ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`} />}
      {children}
    </button>
  );
};

export default Button;
