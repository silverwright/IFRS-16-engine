import React, { useEffect, useState } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { FormField } from '../UI/FormField';
import { Select } from '../UI/Select';
import { Switch } from '../UI/Switch';
import { Modal } from '../UI/Modal';

const paymentFrequencies = ['Monthly', 'Quarterly', 'Semiannual', 'Annual'];
const paymentTimings = ['Arrears', 'Advance'];
const escalationTypes = ['None', 'CPI', 'Fixed%'];
const currencies = ['NGN', 'USD', 'EUR', 'GBP'];

export function PaymentDetailsForm() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;
  const [showModal, setShowModal] = useState(false);
  const [showPrepaymentError, setShowPrepaymentError] = useState(false);

  const updateField = (field: string, value: any) => {
    dispatch({
      type: 'SET_LEASE_DATA',
      payload: { [field]: value }
    });
  };

  // Initialize default values if not set
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

    if (Object.keys(defaults).length > 0) {
      dispatch({
        type: 'SET_LEASE_DATA',
        payload: defaults
      });
    }
  }, []);

  // Automatically check/uncheck "Prepaid First Payment" based on Payment Timing
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

  // Clear prepayment error when user enters a value
  useEffect(() => {
    if (leaseData.PrepaymentsBeforeCommencement && leaseData.PrepaymentsBeforeCommencement > 0) {
      setShowPrepaymentError(false);
    }
  }, [leaseData.PrepaymentsBeforeCommencement]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Details</h3>
      
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
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Escalation</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Escalation Type"
            value={leaseData.EscalationType || 'None'}
            options={escalationTypes}
            onChange={(value) => updateField('EscalationType', value)}
          />
          
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
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Financial Details</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.PrepaidFirstPayment || false}
              onChange={(checked) => updateField('PrepaidFirstPayment', checked)}
              disabled={leaseData.PaymentTiming === 'Advance'}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">Prepaid First Payment</label>
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
        <h4 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Bank Payment Details</h4>

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