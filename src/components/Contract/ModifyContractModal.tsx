import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { LeaseData } from '../../context/LeaseContext';

interface ModifyContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (modificationDate: string, newValues: Partial<LeaseData>, reason: string) => void;
  currentValues: Partial<LeaseData>;
  commencementDate: string;
  currentVersion?: number;
}

export function ModifyContractModal({
  isOpen,
  onClose,
  onSubmit,
  currentValues,
  commencementDate,
  currentVersion = 1,
}: ModifyContractModalProps) {
  const [modificationDate, setModificationDate] = useState('');
  const [modificationReason, setModificationReason] = useState('');
  const [newPayment, setNewPayment] = useState(currentValues.FixedPaymentPerPeriod?.toString() || '');
  const [newIBR, setNewIBR] = useState(currentValues.IBR_Annual?.toString() || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!modificationDate) {
      setError('Please select a modification date');
      return;
    }

    const modDate = new Date(modificationDate);
    const commDate = new Date(commencementDate);
    const today = new Date();

    if (modDate < commDate) {
      setError('Modification date cannot be before commencement date');
      return;
    }

    if (modDate > today) {
      setError('Modification date cannot be in the future');
      return;
    }

    if (!newPayment && !newIBR) {
      setError('Please enter at least one value to modify (Payment or IBR)');
      return;
    }

    // Build the new values object
    const newValues: Partial<LeaseData> = {};

    if (newPayment && parseFloat(newPayment) !== currentValues.FixedPaymentPerPeriod) {
      newValues.FixedPaymentPerPeriod = parseFloat(newPayment);
    }

    if (newIBR && parseFloat(newIBR) !== currentValues.IBR_Annual) {
      newValues.IBR_Annual = parseFloat(newIBR);
    }

    if (Object.keys(newValues).length === 0) {
      setError('No changes detected. Please modify at least one value.');
      return;
    }

    onSubmit(modificationDate, newValues, modificationReason);
    handleClose();
  };

  const handleClose = () => {
    setModificationDate('');
    setModificationReason('');
    setNewPayment(currentValues.FixedPaymentPerPeriod?.toString() || '');
    setNewIBR(currentValues.IBR_Annual?.toString() || '');
    setError('');
    onClose();
  };

  const nextVersion = currentVersion + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Modify Contract
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Create Version {nextVersion} (v{nextVersion})
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">About Contract Modifications</p>
                <p>
                  This will create a new version (v{nextVersion}) of the contract. Historical calculations
                  before the modification date will be preserved, and new values will apply only from
                  the modification date forward.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Modification Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Modification Date <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                The date when the new terms take effect
              </p>
              <input
                type="date"
                value={modificationDate}
                onChange={(e) => setModificationDate(e.target.value)}
                min={commencementDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Modification Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Reason for Modification
              </label>
              <textarea
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                placeholder="e.g., Annual rent increase, IBR adjustment, etc."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Values to Modify */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Values to Modify
              </h3>

              {/* Payment Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Current Payment
                  </label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {currentValues.Currency || 'NGN'} {currentValues.FixedPaymentPerPeriod?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">
                    New Payment
                  </label>
                  <input
                    type="number"
                    value={newPayment}
                    onChange={(e) => setNewPayment(e.target.value)}
                    placeholder={currentValues.FixedPaymentPerPeriod?.toString()}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* IBR Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Current IBR (%)
                  </label>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {currentValues.IBR_Annual?.toFixed(2) || '0.00'}%
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-2">
                    New IBR (%)
                  </label>
                  <input
                    type="number"
                    value={newIBR}
                    onChange={(e) => setNewIBR(e.target.value)}
                    placeholder={currentValues.IBR_Annual?.toString()}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Create Version {nextVersion}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
