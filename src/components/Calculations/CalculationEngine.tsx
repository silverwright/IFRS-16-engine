/**
 * CalculationEngine Component
 *
 * Entry point for triggering IFRS 16 lease calculations.
 *
 * ## Overview
 *
 * This component provides a simple, user-friendly interface for initiating
 * IFRS 16 calculations on the current lease data. It acts as a "Calculate"
 * button with visual feedback during processing.
 *
 * ## Features
 *
 * - **One-Click Calculation**: Single button to run all IFRS 16 calculations
 * - **Loading State**: Visual progress indicator while calculating
 * - **Error Handling**: Catches and displays calculation errors
 * - **Async Processing**: Simulated delay for better UX (shows progress)
 *
 * ## Calculation Process
 *
 * When the user clicks "Run IFRS 16 Calculations":
 * 1. Set loading state (disable button, show progress)
 * 2. Call calculateIFRS16() with current lease data
 * 3. Store results in global state via dispatch
 * 4. Clear any previous errors
 * 5. Navigate to results view (handled by parent component)
 *
 * ## Visual Design
 *
 * - Centered card layout with calculator icon
 * - Primary green action button
 * - Animated loading spinner and progress bar
 * - Clear instructional text
 *
 * ## State Management
 *
 * ### Local State
 * - calculating: Boolean indicating calculation in progress
 *
 * ### Global State (from LeaseContext)
 * - leaseData: Input data for calculations
 * - Dispatches: SET_LOADING, SET_CALCULATIONS, SET_ERROR
 *
 * @module CalculationEngine
 */

import { useState } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { Button } from '../UI/Button';
import { Calculator, Play } from 'lucide-react';
import { calculateIFRS16 } from '../../utils/ifrs16Calculator';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * CalculationEngine - Trigger for IFRS 16 calculations
 *
 * Renders a call-to-action component that initiates lease calculations
 * when the user clicks the button.
 *
 * @returns React component rendering the calculation trigger interface
 *
 * @example
 * ```tsx
 * <CalculationEngine />
 * ```
 */
export function CalculationEngine() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;
  const [calculating, setCalculating] = useState(false);

  /**
   * Run IFRS 16 calculations
   *
   * Executes the complete IFRS 16 calculation process:
   * 1. Validate lease data (implicit in calculator)
   * 2. Calculate lease liability (present value)
   * 3. Calculate ROU asset (liability + adjustments)
   * 4. Generate amortization schedule
   * 5. Generate depreciation schedule
   * 6. Generate journal entries
   * 7. Store results in global state
   *
   * Includes a simulated delay for better UX (shows progress indicator).
   */
  const runCalculations = async () => {
    setCalculating(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Simulate calculation time (provides better UX with progress indicator)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Run the IFRS 16 calculator
      const results = calculateIFRS16(leaseData);

      // Store results in global state
      dispatch({ type: 'SET_CALCULATIONS', payload: results });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      // Handle calculation errors
      dispatch({ type: 'SET_ERROR', payload: 'Calculation failed. Please check your inputs.' });
    } finally {
      setCalculating(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /* ============================================================================
   * RENDER
   * ============================================================================ */

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 p-8 text-center">
      {/* Icon */}
      <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calculator className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>

      {/* Title and Description */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        Ready to Calculate
      </h3>
      <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
        Run IFRS 16 calculations to generate lease liability, ROU asset values, and amortization schedules.
      </p>

      {/* Calculate Button */}
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

      {/* Progress Indicator (shown while calculating) */}
      {calculating && (
        <div className="mt-6 space-y-2">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Processing lease parameters and generating schedules...
          </p>
        </div>
      )}
    </div>
  );
}
