import React, { useState } from 'react';
import { X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../UI/Button';
import { LeaseData } from '../../context/LeaseContext';

interface ModifyContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (modificationDate: string, newValues: Partial<LeaseData>, reason: string, modificationType: 'amendment' | 'termination', agreementDate: string) => void;
  currentValues: Partial<LeaseData>;
  commencementDate: string;
  currentVersion?: number;
}

// Move SectionHeader outside of the component
const SectionHeader = ({
  title,
  isOpen,
  toggle
}: {
  title: string;
  isOpen: boolean;
  toggle: () => void;
}) => (
  <button
    type="button"
    onClick={toggle}
    className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
  >
    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </button>
);

// Move ComparisonField outside of the component
const ComparisonField = ({
  label,
  currentValue,
  newValue,
  onChange,
  type = 'text',
  min,
  max,
  step,
  options,
}: {
  label: string;
  currentValue: string | number;
  newValue: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  options?: { value: string; label: string }[];
}) => (
  <div className="grid grid-cols-2 gap-4">
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
        Current {label}
      </label>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {currentValue || 'Not set'}
      </p>
    </div>
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
        New {label}
      </label>
      {options ? (
        <select
          value={newValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Keep current</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={newValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter new ${label.toLowerCase()}`}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  </div>
);

export function ModifyContractModal({
  isOpen,
  onClose,
  onSubmit,
  currentValues,
  commencementDate,
  currentVersion = 1,
}: ModifyContractModalProps) {
  const [modificationType, setModificationType] = useState<'amendment' | 'termination'>('amendment');
  const [agreementDate, setAgreementDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [modificationReason, setModificationReason] = useState('');
  const [error, setError] = useState('');

  // Collapsible sections
  const [showPaymentFields, setShowPaymentFields] = useState(true);
  const [showTermFields, setShowTermFields] = useState(false);
  const [showRatesFields, setShowRatesFields] = useState(false);
  const [showOptionsFields, setShowOptionsFields] = useState(false);
  const [showOtherFields, setShowOtherFields] = useState(false);

  // Payment & Timing fields - START EMPTY
  const [newPayment, setNewPayment] = useState('');
  const [newPaymentFrequency, setNewPaymentFrequency] = useState('');
  const [newPaymentTiming, setNewPaymentTiming] = useState('');

  // Term fields - START EMPTY
  const [newNonCancellableYears, setNewNonCancellableYears] = useState('');
  const [newEndDateOriginal, setNewEndDateOriginal] = useState('');

  // Rates fields - START EMPTY
  const [newIBR, setNewIBR] = useState('');

  // Options fields - START EMPTY
  const [newRenewalYears, setNewRenewalYears] = useState('');
  const [newRenewalLikelihood, setNewRenewalLikelihood] = useState('');
  const [newTerminationPoint, setNewTerminationPoint] = useState('');
  const [newTerminationLikelihood, setNewTerminationLikelihood] = useState('');

  // Other fields - START EMPTY
  const [newInitialDirectCosts, setNewInitialDirectCosts] = useState('');
  const [newPrepayments, setNewPrepayments] = useState('');
  const [newLeaseIncentives, setNewLeaseIncentives] = useState('');
  const [newEscalationType, setNewEscalationType] = useState('');
  const [newFixedEscalationPct, setNewFixedEscalationPct] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!agreementDate) {
      setError('Please select an agreement date');
      return;
    }

    if (!effectiveDate) {
      setError('Please select an effective date');
      return;
    }

    if (!modificationReason || modificationReason.trim() === '') {
      setError('Please provide a reason for modification');
      return;
    }

    const agreeDate = new Date(agreementDate);
    const effDate = new Date(effectiveDate);
    const commDate = new Date(commencementDate);
    const today = new Date();

    // Agreement date cannot be in the future
    if (agreeDate > today) {
      setError('Agreement date cannot be in the future');
      return;
    }

    // Effective date cannot be before commencement date
    if (effDate < commDate) {
      setError('Effective date cannot be before commencement date');
      return;
    }

    // Effective date should be on or after agreement date
    if (effDate < agreeDate) {
      setError('Effective date cannot be before agreement date');
      return;
    }

    // Build the new values object - only include fields that user actually filled in
    const newValues: Partial<LeaseData> = {};

    // Payment & Timing - only add if user entered a new value
    if (newPayment && newPayment.trim() !== '') {
      newValues.FixedPaymentPerPeriod = parseFloat(newPayment);
    }
    if (newPaymentFrequency && newPaymentFrequency.trim() !== '') {
      newValues.PaymentFrequency = newPaymentFrequency as 'Monthly' | 'Quarterly' | 'Semiannual' | 'Annual';
    }
    if (newPaymentTiming && newPaymentTiming.trim() !== '') {
      newValues.PaymentTiming = newPaymentTiming as 'Advance' | 'Arrears';
    }

    // Term - only add if user entered a new value
    if (newNonCancellableYears && newNonCancellableYears.trim() !== '') {
      newValues.NonCancellableYears = parseFloat(newNonCancellableYears);
    }
    if (newEndDateOriginal && newEndDateOriginal.trim() !== '') {
      newValues.EndDateOriginal = newEndDateOriginal;
    }

    // Rates - only add if user entered a new value
    if (newIBR && newIBR.trim() !== '') {
      newValues.IBR_Annual = parseFloat(newIBR);
    }

    // Options - only add if user entered a new value
    if (newRenewalYears && newRenewalYears.trim() !== '') {
      newValues.RenewalOptionYears = parseFloat(newRenewalYears);
    }
    if (newRenewalLikelihood && newRenewalLikelihood.trim() !== '') {
      newValues.RenewalOptionLikelihood = parseFloat(newRenewalLikelihood);
    }
    if (newTerminationPoint && newTerminationPoint.trim() !== '') {
      newValues.TerminationOptionPoint = newTerminationPoint;
    }
    if (newTerminationLikelihood && newTerminationLikelihood.trim() !== '') {
      newValues.TerminationOptionLikelihood = parseFloat(newTerminationLikelihood);
    }

    // Other - only add if user entered a new value
    if (newInitialDirectCosts && newInitialDirectCosts.trim() !== '') {
      newValues.InitialDirectCosts = parseFloat(newInitialDirectCosts);
    }
    if (newPrepayments && newPrepayments.trim() !== '') {
      newValues.PrepaymentsBeforeCommencement = parseFloat(newPrepayments);
    }
    if (newLeaseIncentives && newLeaseIncentives.trim() !== '') {
      newValues.LeaseIncentives = parseFloat(newLeaseIncentives);
    }
    if (newEscalationType && newEscalationType.trim() !== '') {
      newValues.EscalationType = newEscalationType;
    }
    if (newFixedEscalationPct && newFixedEscalationPct.trim() !== '') {
      newValues.FixedEscalationPct = parseFloat(newFixedEscalationPct);
    }

    if (Object.keys(newValues).length === 0) {
      setError('No changes detected. Please modify at least one value.');
      return;
    }

    onSubmit(effectiveDate, newValues, modificationReason, modificationType, agreementDate);
    handleClose();
  };

  const handleClose = () => {
    setModificationType('amendment');
    setAgreementDate('');
    setEffectiveDate('');
    setModificationReason('');
    setError('');
    // Reset all fields to EMPTY
    setNewPayment('');
    setNewPaymentFrequency('');
    setNewPaymentTiming('');
    setNewNonCancellableYears('');
    setNewEndDateOriginal('');
    setNewIBR('');
    setNewRenewalYears('');
    setNewRenewalLikelihood('');
    setNewTerminationPoint('');
    setNewTerminationLikelihood('');
    setNewInitialDirectCosts('');
    setNewPrepayments('');
    setNewLeaseIncentives('');
    setNewEscalationType('');
    setNewFixedEscalationPct('');
    onClose();
  };

  const nextVersion = currentVersion + 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
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
            {/* Modification Type Selector */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-300 dark:border-slate-600">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
                Modification Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModificationType('amendment')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    modificationType === 'amendment'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      modificationType === 'amendment'
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-400 dark:border-slate-500'
                    }`}>
                      {modificationType === 'amendment' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">Amendment</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Change terms mid-lease (e.g., rent increase). Lease continues with modified terms from effective date.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModificationType('termination')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    modificationType === 'termination'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-orange-300 dark:hover:border-orange-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      modificationType === 'termination'
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-slate-400 dark:border-slate-500'
                    }`}>
                      {modificationType === 'termination' && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">Termination & New Lease</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        End current lease early and start a new one. Two separate independent contracts.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Alert - Dynamic based on modification type */}
            <div className={`${
              modificationType === 'amendment'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            } border rounded-lg p-4 flex gap-3`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                modificationType === 'amendment'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`} />
              <div className={`text-sm ${
                modificationType === 'amendment'
                  ? 'text-blue-800 dark:text-blue-200'
                  : 'text-orange-800 dark:text-orange-200'
              }`}>
                <p className="font-semibold mb-1">
                  {modificationType === 'amendment' ? 'Lease Amendment (IFRS 16.44-46)' : 'Lease Termination & Replacement'}
                </p>
                <p>
                  {modificationType === 'amendment' ? (
                    <>
                      This creates version {nextVersion} with modified terms from the effective date. The original lease continues but with updated payment amounts, rates, or other terms. Historical calculations remain unchanged; new terms apply from the effective date forward. The lease liability will be remeasured at the modification date.
                    </>
                  ) : (
                    <>
                      This terminates the current lease at the effective date and creates a new independent lease starting from that date. Version 1 ends at the effective date (years 1-{Math.ceil((new Date(effectiveDate || new Date()).getTime() - new Date(commencementDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) || '?'}), and Version 2 begins as a new lease with its own term and calculations.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Agreement Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Agreement Date <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                The date when the modification was agreed upon (typically today or earlier)
              </p>
              <input
                type="date"
                value={agreementDate}
                onChange={(e) => setAgreementDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                {modificationType === 'amendment'
                  ? 'The date when the modified terms take effect (can be in the future)'
                  : 'The termination date for the original lease AND the start date for the new lease'}
              </p>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                min={commencementDate}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Modification Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Reason for Modification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={modificationReason}
                onChange={(e) => setModificationReason(e.target.value)}
                placeholder="e.g., Annual rent increase, Term extension, IBR adjustment, etc."
                rows={2}
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Collapsible Sections */}
            <div className="space-y-3">
              {/* Payment & Timing Section */}
              <div>
                <SectionHeader
                  title="Payment & Timing"
                  isOpen={showPaymentFields}
                  toggle={() => setShowPaymentFields(!showPaymentFields)}
                />
                {showPaymentFields && (
                  <div className="mt-3 space-y-3 pl-4">
                    <ComparisonField
                      label="Fixed Payment"
                      currentValue={`${currentValues.Currency || 'NGN'} ${currentValues.FixedPaymentPerPeriod?.toLocaleString() || '0'}`}
                      newValue={newPayment}
                      onChange={setNewPayment}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                    <ComparisonField
                      label="Payment Frequency"
                      currentValue={currentValues.PaymentFrequency || 'Not set'}
                      newValue={newPaymentFrequency}
                      onChange={setNewPaymentFrequency}
                      options={[
                        { value: 'Monthly', label: 'Monthly' },
                        { value: 'Quarterly', label: 'Quarterly' },
                        { value: 'Semiannual', label: 'Semiannual' },
                        { value: 'Annual', label: 'Annual' },
                      ]}
                    />
                    <ComparisonField
                      label="Payment Timing"
                      currentValue={currentValues.PaymentTiming || 'Not set'}
                      newValue={newPaymentTiming}
                      onChange={setNewPaymentTiming}
                      options={[
                        { value: 'Advance', label: 'In Advance' },
                        { value: 'Arrears', label: 'In Arrears' },
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Term Section */}
              <div>
                <SectionHeader
                  title="Lease Term"
                  isOpen={showTermFields}
                  toggle={() => setShowTermFields(!showTermFields)}
                />
                {showTermFields && (
                  <div className="mt-3 space-y-3 pl-4">
                    {modificationType === 'termination' && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          <strong>Important:</strong> For termination & new lease, these values represent the NEW lease term starting from the effective date. The original lease will be terminated at the effective date.
                        </p>
                      </div>
                    )}
                    <ComparisonField
                      label="Non-Cancellable Years"
                      currentValue={currentValues.NonCancellableYears || 0}
                      newValue={newNonCancellableYears}
                      onChange={setNewNonCancellableYears}
                      type="number"
                      min="0"
                      step="0.1"
                    />
                    <ComparisonField
                      label="End Date"
                      currentValue={currentValues.EndDateOriginal ? new Date(currentValues.EndDateOriginal).toLocaleDateString() : 'Not set'}
                      newValue={newEndDateOriginal}
                      onChange={setNewEndDateOriginal}
                      type="date"
                    />
                  </div>
                )}
              </div>

              {/* Rates Section */}
              <div>
                <SectionHeader
                  title="Discount Rate"
                  isOpen={showRatesFields}
                  toggle={() => setShowRatesFields(!showRatesFields)}
                />
                {showRatesFields && (
                  <div className="mt-3 space-y-3 pl-4">
                    <ComparisonField
                      label="IBR (%)"
                      currentValue={`${currentValues.IBR_Annual?.toFixed(2) || '0.00'}%`}
                      newValue={newIBR}
                      onChange={setNewIBR}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Options Section */}
              <div>
                <SectionHeader
                  title="Renewal & Termination Options"
                  isOpen={showOptionsFields}
                  toggle={() => setShowOptionsFields(!showOptionsFields)}
                />
                {showOptionsFields && (
                  <div className="mt-3 space-y-3 pl-4">
                    <ComparisonField
                      label="Renewal Option (Years)"
                      currentValue={currentValues.RenewalOptionYears || 0}
                      newValue={newRenewalYears}
                      onChange={setNewRenewalYears}
                      type="number"
                      min="0"
                      step="0.1"
                    />
                    <ComparisonField
                      label="Renewal Likelihood (0-1)"
                      currentValue={currentValues.RenewalOptionLikelihood || 0}
                      newValue={newRenewalLikelihood}
                      onChange={setNewRenewalLikelihood}
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                    <ComparisonField
                      label="Termination Point (Years)"
                      currentValue={currentValues.TerminationOptionPoint || '0'}
                      newValue={newTerminationPoint}
                      onChange={setNewTerminationPoint}
                      type="number"
                      min="0"
                      step="0.1"
                    />
                    <ComparisonField
                      label="Termination Likelihood (0-1)"
                      currentValue={currentValues.TerminationOptionLikelihood || 0}
                      newValue={newTerminationLikelihood}
                      onChange={setNewTerminationLikelihood}
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Other Fields Section */}
              <div>
                <SectionHeader
                  title="Other Modifications"
                  isOpen={showOtherFields}
                  toggle={() => setShowOtherFields(!showOtherFields)}
                />
                {showOtherFields && (
                  <div className="mt-3 space-y-3 pl-4">
                    <ComparisonField
                      label="Initial Direct Costs"
                      currentValue={`${currentValues.Currency || 'NGN'} ${currentValues.InitialDirectCosts?.toLocaleString() || '0'}`}
                      newValue={newInitialDirectCosts}
                      onChange={setNewInitialDirectCosts}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                    <ComparisonField
                      label="Prepayments"
                      currentValue={`${currentValues.Currency || 'NGN'} ${currentValues.PrepaymentsBeforeCommencement?.toLocaleString() || '0'}`}
                      newValue={newPrepayments}
                      onChange={setNewPrepayments}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                    <ComparisonField
                      label="Lease Incentives"
                      currentValue={`${currentValues.Currency || 'NGN'} ${currentValues.LeaseIncentives?.toLocaleString() || '0'}`}
                      newValue={newLeaseIncentives}
                      onChange={setNewLeaseIncentives}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                    <ComparisonField
                      label="Escalation Type"
                      currentValue={currentValues.EscalationType || 'None'}
                      newValue={newEscalationType}
                      onChange={setNewEscalationType}
                      options={[
                        { value: 'None', label: 'None' },
                        { value: 'Fixed', label: 'Fixed %' },
                        { value: 'CPI', label: 'CPI-Linked' },
                      ]}
                    />
                    {(newEscalationType === 'Fixed' || currentValues.EscalationType === 'Fixed') && (
                      <ComparisonField
                        label="Fixed Escalation (%)"
                        currentValue={`${currentValues.FixedEscalationPct || 0}%`}
                        newValue={newFixedEscalationPct}
                        onChange={setNewFixedEscalationPct}
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
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
