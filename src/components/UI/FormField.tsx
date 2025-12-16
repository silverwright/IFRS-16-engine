import React from 'react';

interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'date' | 'email';
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  error?: string;
  showError?: boolean;
}

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  multiline,
  min,
  max,
  step,
  error,
  showError
}: FormFieldProps) {
  const hasError = showError && error;

  const baseClasses = `
    w-full px-3 py-2 border rounded-lg
    bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white
    focus:outline-none focus:ring-2 transition-colors
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    ${hasError
      ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-slate-300 dark:border-slate-600/50 focus:ring-emerald-500 focus:border-emerald-500'
    }
  `;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
        {label}
        {required && <span className="text-emerald-500 dark:text-emerald-400 ml-1">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={3}
          className={baseClasses}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={baseClasses}
        />
      )}
      {hasError && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}