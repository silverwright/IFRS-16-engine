import React, { useState } from 'react';
import { useLeaseContext, SavedContract } from '../context/LeaseContext';
import { CalculationEngine } from '../components/Calculations/CalculationEngine';
import { ResultsDisplay } from '../components/Calculations/ResultsDisplay';
import { ContractSelector } from '../components/Contract/ContractSelector';
import { Calculator, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/UI/Button';

export function LeaseCalculations() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData, calculations } = state;
  const [selectedContract, setSelectedContract] = useState<SavedContract | null>(null);

  const hasRequiredData = !!(
    leaseData.ContractID &&
    leaseData.CommencementDate &&
    leaseData.NonCancellableYears &&
    leaseData.FixedPaymentPerPeriod &&
    leaseData.IBR_Annual
  );

  const handleSelectContract = (contract: SavedContract) => {
    setSelectedContract(contract);
    // Clear previous calculations first
    dispatch({ type: 'SET_CALCULATIONS', payload: null });
    dispatch({ type: 'LOAD_CONTRACT', payload: contract.data });
    dispatch({ type: 'SET_MODE', payload: contract.mode });
  };

  const handleBackToSelection = () => {
    setSelectedContract(null);
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-slate-100">

      {/* Header Box */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-center gap-3 shadow">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Lease Liability & ROU Engine</h1>
          <p className="text-slate-600">IFRS 16 calculations and amortization schedules</p>
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
        <div className="bg-white rounded-lg border border-slate-200 shadow p-6">
          <ContractSelector onSelect={handleSelectContract} />
        </div>
      )}

      {/* Missing Data Warning Box */}
      {selectedContract && !hasRequiredData && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 shadow p-6 flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-800 text-lg">Missing Required Data</h4>
            <p className="text-amber-700 mt-1">
              This contract is missing required fields. Please update the contract with all required information.
            </p>
          </div>
        </div>
      )}

      {/* Calculation Engine Box */}
      {selectedContract && hasRequiredData && !calculations && (
        <div className="bg-white rounded-lg border border-slate-200 shadow p-6">
          <CalculationEngine />
        </div>
      )}

      {/* Results Display Box */}
      {selectedContract && calculations && (
        <div className="bg-white rounded-lg border border-slate-200 shadow p-6">
          <ResultsDisplay />
        </div>
      )}

    </div>
  );
}
