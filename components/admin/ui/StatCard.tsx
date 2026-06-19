import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  valueColor?: string; // Optional override for value color (e.g. for positive/negative impact)
}

export default function StatCard({
  label,
  value,
  sub,
  accent = '#3FAE2A',
  icon,
  valueColor,
}: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative overflow-hidden"
    >
      {/* Accent border top/left depending on design - let's use a subtle top border or left border */}
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: accent }} />
      
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            {icon}
          </div>
        )}
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 font-helvetica truncate">
          {label}
        </div>
      </div>
      
      <div 
        className="text-[28px] font-bold leading-none font-helvetica" 
        style={{ color: valueColor || '#111827' }}
      >
        {value}
      </div>
      
      {sub && (
        <div className="text-[12px] mt-2 font-medium text-gray-400 font-helvetica">
          {sub}
        </div>
      )}
    </div>
  );
}
