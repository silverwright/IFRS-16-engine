import React, { useState, useEffect } from 'react';
import { useLeaseContext, SavedContract } from '../context/LeaseContext';
import { ResultsDisplay } from '../components/Calculations/ResultsDisplay';
import { ContractSelector } from '../components/Contract/ContractSelector';
import { Calculator, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { calculateIFRS16 } from '../utils/ifrs16Calculator';

export function LeaseCalculations() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData, calculations } = state;
  const [selectedContract, setSelectedContract] = useState<SavedContract | null>(null);
  const [calculating, setCalculating] = useState(false);

  const hasRequiredData = !!(
    leaseData.ContractID &&
    leaseData.CommencementDate &&
    leaseData.NonCancellableYears &&
    leaseData.FixedPaymentPerPeriod &&
    leaseData.IBR_Annual
  );

  const handleSelectContract = (contract: SavedContract) => {
    setSelectedContract(contract);
    dispatch({ type: 'SET_CALCULATIONS', payload: null });
    dispatch({ type: 'LOAD_CONTRACT', payload: contract.data });
    dispatch({ type: 'SET_MODE', payload: contract.mode });
  };

  const handleBackToSelection = () => {
    setSelectedContract(null);
    dispatch({ type: 'RESET' });
  };

  // Automatically calculate when contract is selected and has required data
  useEffect(() => {
    if (selectedContract && hasRequiredData && !calculations) {
      const runCalculation = async () => {
        setCalculating(true);
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
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

      runCalculation();
    }
  }, [selectedContract, hasRequiredData, leaseData, calculations, dispatch]);

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      {/* Header Box */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 p-6 flex items-center gap-3 shadow-xl">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
          <Calculator className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lease Liability & ROU Engine</h1>
          <p className="text-slate-600 dark:text-white/80">IFRS 16 calculations and amortization schedules</p>
        </div>
        {selectedContract && (
          <Button
            variant="outline"
            onClick={handleBackToSelection}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contract Selection
          </Button>
        )}
      </div>

      {/* Contract Selector */}
      {!selectedContract && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 shadow-xl p-6">
          <ContractSelector onSelect={handleSelectContract} />
        </div>
      )}

      {/* Missing Data Warning Box */}
      {selectedContract && !hasRequiredData && (
        <div className="bg-amber-50 dark:bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-300 dark:border-amber-400/30 shadow-xl p-6 flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-lg">Missing Required Data</h4>
            <p className="text-amber-700 dark:text-amber-200 mt-1">
              This contract is missing required fields. Please update the contract with all required information.
            </p>
          </div>
        </div>
      )}

      {/* Calculating Indicator */}
      {selectedContract && hasRequiredData && calculating && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 shadow-xl p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Calculating IFRS 16 Metrics</h3>
              <p className="text-slate-600 dark:text-white/80">Processing lease parameters and generating schedules...</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Display Box */}
      {selectedContract && calculations && !calculating && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 shadow-xl p-6">
          <ResultsDisplay />
        </div>
      )}

    </div>
  );
}
