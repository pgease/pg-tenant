import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateToDDMMYYYY } from '../../utils/dateUtils';

export interface NativeDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

/**
 * Reusable Native Date Picker Component.
 * - Displays "dd/mm/yyyy" placeholder when empty.
 * - Formats chosen date as "dd/mm/yyyy" using Asia/Kolkata timezone.
 * - Triggers native browser / OS date picker on tap/click.
 * - Enforces min and max constraints (e.g. blocking past dates or enforcing notice periods).
 * - Emits standard YYYY-MM-DD string to the parent form for API compatibility.
 */
export const NativeDatePicker: React.FC<NativeDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  min,
  max,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayDate = value ? formatDateToDDMMYYYY(value) : '';

  const handleClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex items-center justify-between cursor-pointer select-none transition-all ${
        disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''
      } ${className}`}
    >
      {/* Formatted Text Display */}
      <span
        className={`truncate text-xs ${
          displayDate
            ? 'text-brandText font-medium'
            : 'text-gray-400 font-normal'
        }`}
      >
        {displayDate || placeholder}
      </span>

      <Calendar className="h-4 w-4 shrink-0 text-gray-400 ml-2 pointer-events-none" />

      {/* Hidden Native Date Input overlay for full OS / Browser picker triggers */}
      <input
        ref={inputRef}
        type="date"
        id={id}
        name={name}
        aria-label={ariaLabel || placeholder}
        value={value || ''}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        tabIndex={disabled ? -1 : 0}
      />
    </div>
  );
};
