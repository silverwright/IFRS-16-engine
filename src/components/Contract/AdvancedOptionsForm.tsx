/**
 * AdvancedOptionsForm Component
 *
 * Form component for capturing advanced lease options and policy elections.
 * This form handles optional IFRS 16 features that affect lease term determination
 * and accounting policy choices.
 *
 * ## Fields Captured
 *
 * **Renewal & Termination Options (IFRS 16.18-19)**:
 * - Renewal Option Years: Extension period if option exercised
 * - Renewal Likelihood: Probability of exercising renewal (0-1)
 * - Termination Option Point: When termination can occur
 * - Termination Likelihood: Probability of early termination (0-1)
 * - Termination Penalty: Cost to terminate early
 * - Termination Reasonably Certain: Whether termination is ≥50% likely
 *
 * **Purchase Options & Guarantees**:
 * - Purchase Option Price: Price to buy asset at end of lease
 * - Purchase Option Reasonably Certain: Whether purchase is ≥50% likely
 * - RVG Expected: Residual value guarantee amount
 * - RVG Reasonably Certain: Whether RVG payment is ≥50% likely
 *
 * **Asset Valuation**:
 * - Carrying Amount: Asset's book value on lessor's books
 * - Fair Value: Market value at commencement
 * - Sales Proceeds: Proceeds from sale-leaseback (if applicable)
 *
 * **Policy Elections (IFRS 16.5)**:
 * - Low Value Exemption: Apply practical expedient for low-value assets
 * - Short Term Exemption: Apply expedient for leases ≤12 months
 *
 * **Governance**:
 * - Judgement Notes: Documentation of key judgements and assumptions
 * - Approval Sign-off: CFO or authorized approver sign-off
 *
 * ## IFRS 16 Lease Term Logic
 *
 * The lease term determination follows IFRS 16.18-19:
 * 1. Start with non-cancellable period (always included)
 * 2. If termination is reasonably certain (≥50%), use termination point
 * 3. Otherwise, if renewal is reasonably certain (≥50%), add renewal years
 * 4. Otherwise, use only non-cancellable period
 *
 * @module AdvancedOptionsForm
 */

import { useState } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { FormField } from '../UI/FormField';
import { Switch } from '../UI/Switch';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../UI/Button';

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * AdvancedOptionsForm - Form for advanced lease options and policy elections
 *
 * Renders a comprehensive form for optional IFRS 16 features including:
 * - Lease extension and termination options
 * - Purchase options and residual value guarantees
 * - Asset valuation fields
 * - Accounting policy elections
 * - Governance and approval documentation
 *
 * @returns React component rendering the advanced options form
 *
 * @example
 * ```tsx
 * <AdvancedOptionsForm />
 * ```
 */
export function AdvancedOptionsForm() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;

  // Validation modal state (reserved for future validation logic)
  const [showValidationModal, setShowValidationModal] = useState(false);

  /**
   * Update a single field in the lease data
   *
   * @param field - Field name to update
   * @param value - New value for the field
   */
  const updateField = (field: string, value: any) => {
    dispatch({
      type: 'SET_LEASE_DATA',
      payload: { [field]: value }
    });
  };

  /**
   * Handle termination point change
   *
   * The termination option point represents when the lessee can terminate
   * the lease early (e.g., "End of Year 3" = 3 years).
   *
   * @param value - Termination point in years
   */
  const handleTerminationPointChange = (value: string) => {
    // Termination input will be added to non-cancellable years in the calculation
    // No validation needed here - any positive number is valid
    updateField('TerminationOptionPoint', value);
  };

  /* ============================================================================
   * RENDER
   * ============================================================================ */

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Advanced Options
      </h3>

      {/* Renewal & Termination Section */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-emerald-500 dark:text-emerald-400">
          Renewal & Termination Options
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Renewal Option Fields */}
          <FormField
            label="Renewal Option (years)"
            type="number"
            value={leaseData.RenewalOptionYears || ''}
            onChange={(value) => updateField('RenewalOptionYears', Number(value))}
            placeholder="3"
          />

          <FormField
            label="Renewal Likelihood (0-1)"
            type="number"
            step="0.01"
            value={leaseData.RenewalOptionLikelihood || ''}
            onChange={(value) => updateField('RenewalOptionLikelihood', Number(value))}
            placeholder="0.70"
            min="0"
            max="1"
          />

          {/* Termination Option Fields */}
          <FormField
            label="Termination Option Point (years)"
            type="number"
            value={leaseData.TerminationOptionPoint || ''}
            onChange={handleTerminationPointChange}
            placeholder="4"
          />

          <FormField
            label="Termination Likelihood (0-1)"
            type="number"
            step="0.01"
            value={leaseData.TerminationOptionLikelihood || ''}
            onChange={(value) => updateField('TerminationOptionLikelihood', Number(value))}
            placeholder="0.20"
            min="0"
            max="1"
          />

          <FormField
            label="Termination Penalty"
            type="number"
            value={leaseData.TerminationPenaltyExpected || ''}
            onChange={(value) => updateField('TerminationPenaltyExpected', Number(value))}
            placeholder="1000000"
          />
        </div>

        {/* Termination Reasonably Certain Toggle */}
        <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
          <Switch
            checked={leaseData.TerminationReasonablyCertain || false}
            onChange={(checked) => updateField('TerminationReasonablyCertain', checked)}
          />
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white">
              Termination Reasonably Certain
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Is early termination reasonably certain?
            </p>
          </div>
        </div>
      </div>

      {/* Purchase Options & Guarantees Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">
          Purchase Options & Guarantees
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Purchase Option Price"
            type="number"
            value={leaseData.PurchaseOptionPrice || ''}
            onChange={(value) => updateField('PurchaseOptionPrice', Number(value))}
            placeholder="0"
          />

          <FormField
            label="RVG Expected"
            type="number"
            value={leaseData.RVGExpected || ''}
            onChange={(value) => updateField('RVGExpected', Number(value))}
            placeholder="0"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Purchase Option Reasonably Certain Toggle */}
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.PurchaseOptionReasonablyCertain || false}
              onChange={(checked) => updateField('PurchaseOptionReasonablyCertain', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Purchase Option Reasonably Certain
              </label>
            </div>
          </div>

          {/* RVG Reasonably Certain Toggle */}
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.RVGReasonablyCertain || false}
              onChange={(checked) => updateField('RVGReasonablyCertain', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                RVG Reasonably Certain
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Valuation Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">
          Asset Valuation
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Carrying Amount"
            type="number"
            value={leaseData.CarryingAmount || ''}
            onChange={(value) => updateField('CarryingAmount', Number(value))}
            placeholder="0"
          />

          <FormField
            label="Fair Value"
            type="number"
            value={leaseData.FairValue || ''}
            onChange={(value) => updateField('FairValue', Number(value))}
            placeholder="0"
          />

          <FormField
            label="Sales Proceeds"
            type="number"
            value={leaseData.SalesProceeds || ''}
            onChange={(value) => updateField('SalesProceeds', Number(value))}
            placeholder="0"
          />
        </div>
      </div>

      {/* Policy Elections Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">
          Policy Elections
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Low Value Exemption Toggle */}
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.LowValueExemption || false}
              onChange={(checked) => updateField('LowValueExemption', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Low Value Exemption
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Apply low-value practical expedient
              </p>
            </div>
          </div>

          {/* Short Term Exemption Toggle */}
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.ShortTermExemption || false}
              onChange={(checked) => updateField('ShortTermExemption', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Short Term Exemption
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Apply short-term lease expedient
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Approval Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">
          Governance & Approval
        </h4>

        <FormField
          label="Judgement Notes"
          value={leaseData.JudgementNotes || ''}
          onChange={(value) => updateField('JudgementNotes', value)}
          placeholder="Renewal likely due to site economics"
          multiline
        />

        <FormField
          label="Approval Sign-off"
          value={leaseData.ApprovalSignoff || ''}
          onChange={(value) => updateField('ApprovalSignoff', value)}
          placeholder="CFO – 14-Aug-2025"
        />
      </div>

      {/* Validation Modal (for future validation logic) */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Validation Error</h3>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-700">Validation error occurred. Please check your inputs.</p>
            </div>
            <div className="flex justify-end p-6 border-t border-slate-200">
              <Button
                onClick={() => setShowValidationModal(false)}
                className="bg-red-600 hover:bg-red-700"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
