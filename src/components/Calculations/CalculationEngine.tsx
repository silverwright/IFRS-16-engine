import React, { useState } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { Button } from '../UI/Button';
import { Calculator, Play } from 'lucide-react';
import { calculateIFRS16 } from '../../utils/ifrs16Calculator';

export function CalculationEngine() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;
  const [calculating, setCalculating] = useState(false);

  const runCalculations = async () => {
    setCalculating(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate calculation time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const results = calculateIFRS16(leaseData);
      dispatch({ type: 'SET_CALCULATIONS', payload: results });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Calculation failed. Please check your inputs.' });
    } finally {
      setCalculating(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 p-8 text-center">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calculator className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Ready to Calculate</h3>
      <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
        Run IFRS 16 calculations to generate lease liability, ROU asset values, and amortization schedules.
      </p>

      <Button
        onClick={runCalculations}
        disabled={calculating}
        size="lg"
        className="flex items-center gap-2 mx-auto"
      >
        {calculating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Calculating...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Run IFRS 16 Calculations
          </>
        )}
      </Button>

      {calculating && (
        <div className="mt-6 space-y-2">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">Processing lease parameters and generating schedules...</p>
        </div>
      )}
    </div>
  );
}