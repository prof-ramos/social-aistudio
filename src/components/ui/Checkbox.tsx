import React from 'react';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="h-5 w-5 accent-navy cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
      <label
        htmlFor={id}
        className="min-h-[44px] flex items-center text-base text-slate leading-relaxed cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
};