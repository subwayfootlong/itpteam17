import React from 'react';

export function Badge({ 
  children, 
  colorClass = 'bg-gray-100 text-gray-600',
  dotColor,
  className = ''
}: { 
  children: React.ReactNode; 
  colorClass?: string;
  dotColor?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${colorClass} ${className}`}>
      {dotColor && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}
