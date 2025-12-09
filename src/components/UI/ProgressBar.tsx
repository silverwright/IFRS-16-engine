import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  name: string;
}

interface ProgressBarProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
              ${step.id < currentStep 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : step.id === currentStep
                ? 'bg-blue-100 border-blue-600 text-blue-600'
                : 'bg-white border-slate-300 text-slate-400'
              }
            `}>
              {step.id < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-2 transition-colors
                ${step.id < currentStep ? 'bg-blue-600' : 'bg-slate-300'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
        {steps.map((step) => (
          <span key={step.id} className="max-w-20 text-center">
            {step.name}
          </span>
        ))}
      </div>
    </div>
  );
}