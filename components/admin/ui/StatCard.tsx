import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  accent = 'var(--color-pergas-green)',
}: StatCardProps) {
  return (
    <div
      className="bg-white rounded-xl p-5 border shadow-sm"
      style={{ borderColor: 'rgba(0,0,0,0.08)', borderLeft: `3px solid ${accent}` }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 font-helvetica" style={{ color: 'var(--color-pergas-50)' }}>
        {label}
      </div>
      <div className="text-[30px] font-bold leading-none font-helvetica" style={{ color: accent }}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1.5 font-helvetica" style={{ color: 'var(--color-pergas-50)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
