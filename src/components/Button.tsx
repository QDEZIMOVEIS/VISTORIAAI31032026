import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon, size = 'md' }: any) => {
  const variants: any = {
    primary: 'bg-[#C1272D] text-white hover:bg-[#A11F25]',
    secondary: 'bg-stone-800 text-white hover:bg-stone-900',
    outline: 'border-2 border-[#C1272D] text-[#C1272D] hover:bg-red-50',
    ghost: 'text-stone-600 hover:bg-stone-100',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizes: any = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`
        ${variants[variant]} 
        ${sizes[size]}
        rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 20} />}
      {children}
    </button>
  );
};

export default Button;
