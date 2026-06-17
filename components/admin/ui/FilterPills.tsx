import React from 'react';

export function FilterPills({ 
  options, 
  activeValue, 
  onChange 
}: { 
  options: { label: string; value: string }[] | string[];
  activeValue: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 font-helvetica">
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? (opt === 'all' ? 'All' : opt) : opt.label;
        const isActive = activeValue === val;
        
        return (
          <button
            key={val}
            onClick={() => onChange(val)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all ${
              isActive
                ? 'bg-[#3FAE2A] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
