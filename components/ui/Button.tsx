import React from 'react';
import LoadingSpinner from './LoadingSpinner';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#53A63E] text-white hover:bg-opacity-95',
  secondary: 'bg-stone-50 member-dark:bg-neutral-900 text-gray-900 member-dark:text-neutral-100 border border-stone-300/80 member-dark:border-neutral-700/80 hover:bg-stone-100 member-dark:hover:bg-neutral-800',
  ghost: 'bg-transparent text-stone-800 member-dark:text-neutral-100 hover:bg-stone-50 member-dark:hover:bg-neutral-900 border border-transparent',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', loading = false, fullWidth = true, children, className = '', disabled, ...rest }) => {
  const sizeClass = fullWidth ? 'w-full h-12' : 'inline-flex h-10 px-3';
  const base = `${sizeClass} rounded-xl font-helvetica text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]`;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <LoadingSpinner label="" size="sm" light={variant === 'primary'} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
