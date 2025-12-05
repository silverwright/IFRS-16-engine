import React from 'react';
import { FileText, File } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: 'MINIMAL' | 'FULL';
  onModeChange: (mode: 'MINIMAL' | 'FULL') => void;
}

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 p-8 shadow-2xl">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Select Contract Mode</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => onModeChange('MINIMAL')}
          className={`
            p-8 rounded-lg border-2 text-left transition-all duration-300 hover:shadow-xl hover:scale-105
            ${currentMode === 'MINIMAL'
              ? 'border-blue-400 dark:border-blue-400/50 bg-gradient-to-br from-blue-200/30 to-blue-300/30 dark:from-blue-500/20 dark:to-blue-600/20 shadow-lg shadow-blue-500/20'
              : 'border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10'
            }
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              currentMode === 'MINIMAL' ? 'bg-blue-400/40 dark:bg-blue-500/30 text-blue-600 dark:text-blue-300' : 'bg-slate-300 dark:bg-white/10 text-slate-600 dark:text-white/60'
            }`}>
              <File className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Minimal Mode</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">
            Core IFRS 16 inputs with concise contract generation. Perfect for standard leases.
          </p>
          {currentMode === 'MINIMAL' && (
            <div className="mt-4 pt-4 border-t border-slate-300 dark:border-white/20">
              <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">✓ Selected</span>
            </div>
          )}
        </button>

        <button
          onClick={() => onModeChange('FULL')}
          className={`
            p-8 rounded-lg border-2 text-left transition-all duration-300 hover:shadow-xl hover:scale-105
            ${currentMode === 'FULL'
              ? 'border-blue-400 dark:border-blue-400/50 bg-gradient-to-br from-blue-200/30 to-blue-300/30 dark:from-blue-500/20 dark:to-blue-600/20 shadow-lg shadow-blue-500/20'
              : 'border-slate-300 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10'
            }
          `}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
              currentMode === 'FULL' ? 'bg-blue-400/40 dark:bg-blue-500/30 text-blue-600 dark:text-blue-300' : 'bg-slate-300 dark:bg-white/10 text-slate-600 dark:text-white/60'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Full Mode</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed">
            Comprehensive commercial and legal dataset with robust contract features.
          </p>
          {currentMode === 'FULL' && (
            <div className="mt-4 pt-4 border-t border-slate-300 dark:border-white/20">
              <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">✓ Selected</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}