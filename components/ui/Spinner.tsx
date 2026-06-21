import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  // Mapping sizes to Tailwind classes
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center" aria-label="Loading">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-stone-200 border-t-[#53A63E]`}
      />
    </div>
  );
};

export default Spinner;