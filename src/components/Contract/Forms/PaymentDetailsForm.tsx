/**
 * PaymentDetailsForm Component
 *
 * Form component for capturing lease payment details and financial information.
 * This is a key step in the contract creation workflow as it captures the
 * payment structure that drives the IFRS 16 calculations.
 *
 * ## Fields Captured
 *
 * **Payment Structure**:
 * - Fixed Payment per Period: Regular lease payment amount
 * - Currency: Contract currency (NGN, USD, EUR, GBP)
 * - Payment Frequency: Monthly, Quarterly, Semiannual, or Annual
 * - Payment Timing: Arrears (end of period) or Advance (beginning of period)
 *
 * **Escalation (Rent Increases)**:
 * - Escalation Type: None, CPI-linked, or Fixed %
 * - Base CPI: Starting CPI value (for CPI-linked)
 * - CPI Reset Month: When CPI adjustments occur
 * - Fixed Escalation %: Annual increase percentage (for fixed escalation)
 *
 * **Financial Details**:
 * - IBR (Incremental Borrowing Rate): Discount rate for present value
 * - Initial Direct Costs: Costs incurred to set up the lease
 * - Prepayments: Payments made before commencement
 * - Lease Incentives: Incentives received from lessor
 * - Prepaid First Payment: Whether first payment was made early
 *
 * **Bank Details**:
 * - Bank Name, Account Name, Account Number
 *
 * ## Business Logic
 *
 * ### Payment in Advance Validation
 * When "Payment in Advance" is selected:
 * - Automatically checks "Prepaid First Payment" (cannot be unchecked)
 * - Shows modal notification to enter prepayment amount
 * - Validates that prepayment amount is entered
 * - Shows error if prepayment is missing
 *
 * ### Default Values
 * On first load, sets sensible defaults:
 * - Payment Frequency: Monthly
 * - Payment Timing: Arrears
 * - Currency: NGN (Nigerian Naira)
 *
 * @module PaymentDetailsForm
 */

import { useEffect, useState } from 'react';
import { useLeaseContext } from '../../../context/LeaseContext';
import { FormField } from '../../UI/FormField';
import { Select } from '../../UI/Select';
import { Switch } from '../../UI/Switch';
import { Modal } from '../../UI/Modal';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/** Payment frequency options */
const paymentFrequencies = ['Monthly', 'Quarterly', 'Semiannual', 'Annual'];

/** Payment timing options (when payment occurs relative to period) */
const paymentTimings = ['Arrears', 'Advance'];

/** Escalation types for rent increases */
const escalationTypes = ['None', 'CPI', 'Fixed%'];

/** Supported currencies */
const currencies = ['NGN', 'USD', 'EUR', 'GBP'];

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * PaymentDetailsForm - Form for capturing payment and financial details
 *
 * Renders a comprehensive form for all payment-related fields. Includes
 * automatic validation and business logic for payment timing scenarios.
 *
 * The component handles three main sections:
 * 1. Payment Structure (amount, frequency, timing)
 * 2. Escalation (rent increase mechanism)
 * 3. Financial Details (IBR, prepayments, incentives)
 * 4. Bank Payment Details (for contract generation)
 *
 * @returns React component rendering the payment details form
 *
 * @example
 * ```tsx
 * <PaymentDetailsForm />
 * ```
 */
export function PaymentDetailsForm() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;

  // Modal visibility state
  const [showModal, setShowModal] = useState(false);

  // Prepayment error tracking
  const [showPrepaymentError, setShowPrepaymentError] = useState(false);

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

  /* ============================================================================
   * EFFECT: Initialize Default Values
   *
   * On component mount, set sensible default values for key fields if not
   * already set. This improves UX by pre-populating common selections.
   *
   * Defaults:
   * - Payment Frequency: Monthly (most common)
   * - Payment Timing: Arrears (standard accounting practice)
   * - Currency: NGN (Nigerian Naira - local default)
   * ============================================================================ */
  useEffect(() => {
    const defaults: any = {};

    if (!leaseData.PaymentFrequency) {
      defaults.PaymentFrequency = 'Monthly';
    }
    if (!leaseData.PaymentTiming) {
      defaults.PaymentTiming = 'Arrears';
    }
    if (!leaseData.Currency) {
      defaults.Currency = 'NGN';
    }

    // Only dispatch if there are defaults to set
    if (Object.keys(defaults).length > 0) {
      dispatch({
        type: 'SET_LEASE_DATA',
        payload: defaults
      });
    }
  }, []);

  /* ============================================================================
   * EFFECT: Auto-Check Prepaid First Payment for Advance Timing
   *
   * Business rule: When payment is "in Advance", the first payment is always
   * prepaid (occurs at commencement, not at end of first period).
   *
   * Actions:
   * - Advance selected → Auto-check PrepaidFirstPayment + show modal
   * - Arrears selected → Auto-uncheck PrepaidFirstPayment
   *
   * This ensures the IFRS 16 calculator receives correct payment timing data.
   * ============================================================================ */
  useEffect(() => {
    if (leaseData.PaymentTiming === 'Advance') {
      if (!leaseData.PrepaidFirstPayment) {
        updateField('PrepaidFirstPayment', true);
        setShowModal(true);
        setShowPrepaymentError(true);
      }
    } else if (leaseData.PaymentTiming === 'Arrears') {
      if (leaseData.PrepaidFirstPayment) {
        updateField('PrepaidFirstPayment', false);
      }
      setShowPrepaymentError(false);
    }
  }, [leaseData.PaymentTiming]);

  /* ============================================================================
   * EFFECT: Clear Prepayment Error When Amount Entered
   *
   * Once user enters a prepayment amount (for Payment in Advance), clear the
   * error indicator. This provides immediate positive feedback.
   * ============================================================================ */
  useEffect(() => {
    if (leaseData.PrepaymentsBeforeCommencement && leaseData.PrepaymentsBeforeCommencement > 0) {
      setShowPrepaymentError(false);
    }
  }, [leaseData.PrepaymentsBeforeCommencement]);

  /* ============================================================================
   * RENDER
   * ============================================================================ */

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Payment Details
      </h3>

      {/* Payment Structure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Fixed Payment per Period"
          type="number"
          value={leaseData.FixedPaymentPerPeriod || ''}
          onChange={(value) => updateField('FixedPaymentPerPeriod', Number(value))}
          placeholder="25000000"
          required
        />

        <Select
          label="Currency"
          value={leaseData.Currency || 'NGN'}
          options={currencies}
          onChange={(value) => updateField('Currency', value)}
          required
        />

        <Select
          label="Payment Frequency"
          value={leaseData.PaymentFrequency || 'Monthly'}
          options={paymentFrequencies}
          onChange={(value) => updateField('PaymentFrequency', value)}
          required
        />

        <Select
          label="Payment Timing"
          value={leaseData.PaymentTiming || 'Arrears'}
          options={paymentTimings}
          onChange={(value) => updateField('PaymentTiming', value)}
          required
        />
      </div>

      {/* Escalation Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
          Escalation
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Escalation Type"
            value={leaseData.EscalationType || 'None'}
            options={escalationTypes}
            onChange={(value) => updateField('EscalationType', value)}
          />

          {/* CPI-Linked Escalation Fields */}
          {leaseData.EscalationType === 'CPI' && (
            <>
              <FormField
                label="Base CPI"
                type="number"
                value={leaseData.BaseCPI || ''}
                onChange={(value) => updateField('BaseCPI', Number(value))}
                placeholder="250.0"
              />
              <FormField
                label="CPI Reset Month (1-12)"
                type="number"
                value={leaseData.CPIResetMonth || ''}
                onChange={(value) => updateField('CPIResetMonth', Number(value))}
                placeholder="1"
                min="1"
                max="12"
              />
            </>
          )}

          {/* Fixed Percentage Escalation Field */}
          {leaseData.EscalationType === 'Fixed%' && (
            <FormField
              label="Fixed Escalation % (decimal)"
              type="number"
              step="0.01"
              value={leaseData.FixedEscalationPct || ''}
              onChange={(value) => updateField('FixedEscalationPct', Number(value))}
              placeholder="0.05"
            />
          )}
        </div>
      </div>

      {/* Rate & Financial Details */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
          Financial Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* IBR Input: Display as percentage, store as decimal */}
          <FormField
            label="IBR (Annual %)"
            type="number"
            step="0.01"
            value={leaseData.IBR_Annual ? (Math.round(leaseData.IBR_Annual * 10000) / 100).toString() : ''}
            onChange={(value) => updateField('IBR_Annual', Math.round(Number(value) * 100) / 10000)}
            placeholder="14"
            required
          />

          <FormField
            label="Initial Direct Costs"
            type="number"
            value={leaseData.InitialDirectCosts || ''}
            onChange={(value) => updateField('InitialDirectCosts', Number(value))}
            placeholder="5000000"
          />

          {/* Prepayments: Required for Payment in Advance */}
          <FormField
            label="Prepayments"
            type="number"
            value={leaseData.PrepaymentsBeforeCommencement || ''}
            onChange={(value) => updateField('PrepaymentsBeforeCommencement', Number(value))}
            placeholder="2500000"
            required={leaseData.PaymentTiming === 'Advance'}
            error="Please enter the prepayment amount for Payment in Advance"
            showError={showPrepaymentError && leaseData.PaymentTiming === 'Advance' && (!leaseData.PrepaymentsBeforeCommencement || leaseData.PrepaymentsBeforeCommencement <= 0)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormField
            label="Lease Incentives"
            type="number"
            value={leaseData.LeaseIncentives || ''}
            onChange={(value) => updateField('LeaseIncentives', Number(value))}
            placeholder="100000"
          />

          {/* Prepaid First Payment Toggle */}
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.PrepaidFirstPayment || false}
              onChange={(checked) => updateField('PrepaidFirstPayment', checked)}
              disabled={leaseData.PaymentTiming === 'Advance'}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">
                Prepaid First Payment
              </label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {leaseData.PaymentTiming === 'Advance'
                  ? 'Required for Payment in Advance'
                  : 'First payment made before commencement'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Payment Details */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">
          Bank Payment Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Bank Name"
            type="text"
            value={leaseData.BankName || ''}
            onChange={(value) => updateField('BankName', value)}
            placeholder="First Bank of Nigeria"
          />

          <FormField
            label="Account Name"
            type="text"
            value={leaseData.BankAccountName || ''}
            onChange={(value) => updateField('BankAccountName', value)}
            placeholder="XYZ Leasing Limited"
          />

          <FormField
            label="Account Number"
            type="text"
            value={leaseData.BankAccountNo || ''}
            onChange={(value) => updateField('BankAccountNo', value)}
            placeholder="1234567890"
          />
        </div>
      </div>

      {/* Modal for Payment in Advance notification */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Payment in Advance"
        message="Payment in Advance selected. Please enter the prepayment amount in the Prepayments field above."
        type="info"
      />
    </div>
  );
}
