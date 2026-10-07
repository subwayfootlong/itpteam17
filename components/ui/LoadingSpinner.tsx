type LoadingSpinnerProps = {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  light?: boolean;
};

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
};

export default function LoadingSpinner({
  label = 'Loading',
  size = 'md',
  className = '',
  light = false,
}: LoadingSpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center justify-center gap-2 ${className}`}>
      <svg
        aria-hidden="true"
        className={`${SIZE_CLASSES[size]} shrink-0 animate-spin ${light ? 'text-white' : 'text-[#3FAE2A]'}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="text-sm font-medium">{label}</span>}
    </span>
  );
}

export function LoadingState({ label = 'Loading…', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex min-h-40 items-center justify-center text-gray-500 ${className}`}>
      <LoadingSpinner label={label} size="lg" />
    </div>
  );
}
