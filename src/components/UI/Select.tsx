import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function Select({ label, value, options, onChange, required, placeholder }: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-200 mb-2">
        {label}
        {required && <span className="text-emerald-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="
            w-full px-3 py-2 border border-slate-600/50 rounded-lg appearance-none bg-slate-800/50 text-white
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
            transition-colors backdrop-blur-sm
          "
        >
          {placeholder && <option value="" className="bg-slate-800">{placeholder}</option>}
          {options.map((option) => (
            <option key={option} value={option} className="bg-slate-800">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}