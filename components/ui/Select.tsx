import React, { useId } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  id?: string;
  options: readonly SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  id,
  options,
  placeholder,
  className = '',
  ...rest
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label
          htmlFor={selectId}
          className="member-text-sm text-sm font-semibold tracking-tight text-gray-900"
        >
          {label}
        </label>
      ) : null}

      <div className="relative w-full rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all">
        <select
          id={selectId}
          {...rest}
          className="member-text-sm w-full h-12 cursor-pointer appearance-none bg-transparent px-4 text-sm font-normal text-gray-900 outline-none"
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-stone-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default Select;
