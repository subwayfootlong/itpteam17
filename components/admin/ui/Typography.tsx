import React from 'react';

export function AdminPageTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[22px] font-bold font-butler text-[#1a2e1a] ${className}`}>
      {children}
    </h2>
  );
}

export function AdminSectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-[16px] font-bold font-butler text-[#1a2e1a] ${className}`}>
      {children}
    </h3>
  );
}
