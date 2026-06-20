import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  icon?: boolean | React.ReactNode;
  variant?: 'primary' | 'glass' | 'outline';
  className?: string;
}

const getBaseClass = (variant: string) => {
  let baseClass = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all font-helvetica ";
  
  if (variant === 'primary') {
    baseClass += "text-white bg-[#3FAE2A] hover:brightness-110 shadow-sm ";
  } else if (variant === 'glass') {
    baseClass += "text-white bg-white/15 hover:bg-white/20 ";
  } else if (variant === 'outline') {
    baseClass += "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm ";
  }
  return baseClass;
};

const defaultIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export function ActionLink({ href, children, icon = false, variant = 'primary', className = '' }: ButtonProps & { href: string }) {
  return (
    <Link href={href} className={`${getBaseClass(variant)} ${className}`}>
      {icon === true ? defaultIcon : icon}
      {children}
    </Link>
  );
}

export function ActionButton({ onClick, children, icon = false, variant = 'primary', className = '', ...props }: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button onClick={onClick} className={`${getBaseClass(variant)} ${className}`} {...props}>
      {icon === true ? defaultIcon : icon}
      {children}
    </button>
  );
}
