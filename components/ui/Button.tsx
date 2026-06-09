import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#53A63E] text-white hover:bg-opacity-95',
  secondary: 'bg-stone-50 text-gray-900 border border-stone-300/80 hover:bg-stone-100',
  ghost: 'bg-transparent text-stone-800 hover:bg-stone-50 border border-transparent',
};

const Button: React.FC<ButtonProps> = ({ variant = 'primary', loading = false, fullWidth = true, children, className = '', disabled, ...rest }) => {
  const sizeClass = fullWidth ? 'w-full h-12' : 'inline-flex h-10 px-3';
  const base = `${sizeClass} font-semibold rounded-xl flex justify-center items-center gap-2 shadow-sm transition-all active:scale-[0.99]`;
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
