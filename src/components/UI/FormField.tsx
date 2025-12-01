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
  step
}: FormFieldProps) {
  const baseClasses = `
    w-full px-3 py-2 border border-slate-600/50 rounded-lg bg-slate-800/50 text-white
    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
    transition-colors placeholder:text-slate-500 backdrop-blur-sm
  `;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-2">
        {label}
        {required && <span className="text-emerald-400 ml-1">*</span>}
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
    </div>
  );
}