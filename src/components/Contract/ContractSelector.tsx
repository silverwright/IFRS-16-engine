import React from 'react';
import { useLeaseContext, SavedContract } from '../../context/LeaseContext';
import { FileText, Calendar, Building2, Package } from 'lucide-react';

interface ContractSelectorProps {
  onSelect: (contract: SavedContract) => void;
}

export function ContractSelector({ onSelect }: ContractSelectorProps) {
  const { state } = useLeaseContext();
  const contracts = state.savedContracts || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  if (contracts.length === 0) {
    return (
      <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-400/30 p-6 flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <FileText className="w-6 h-6 text-amber-300" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-100 text-lg">No Contracts Available</h4>
          <p className="text-amber-200 mt-1">
            Please create or import contracts first from the Contract Initiation page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Select a Contract</h3>
      <p className="text-sm text-white/80">
        Choose a contract to perform calculations and generate reports
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contracts.map((contract) => (
          <button
            key={contract.id}
            onClick={() => onSelect(contract)}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:border-blue-400/50 hover:bg-white/10 hover:shadow-xl transition-all text-left group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">{contract.contractId}</h4>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                  contract.status === 'approved'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {contract.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/60" />
                <span className="truncate">{contract.lesseeName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-white/60" />
                <span className="truncate">{contract.assetDescription}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/60" />
                <span>{formatDate(contract.commencementDate)}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/70">
              Mode: <span className="font-medium text-white/90">{contract.mode}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
