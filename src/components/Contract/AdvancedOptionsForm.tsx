import React, { useState } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { FormField } from '../UI/FormField';
import { Switch } from '../UI/Switch';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../UI/Button';

export function AdvancedOptionsForm() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const updateField = (field: string, value: any) => {
    dispatch({
      type: 'SET_LEASE_DATA',
      payload: { [field]: value }
    });
  };

  const handleTerminationPointChange = (value: string) => {
    // Termination input will be added to non-cancellable years in the calculation
    // No validation needed here - any positive number is valid
    updateField('TerminationOptionPoint', value);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Options</h3>

      {/* Renewal & Termination */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-emerald-500 dark:text-emerald-400">Renewal & Termination Options</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
          <Switch
            checked={leaseData.TerminationReasonablyCertain || false}
            onChange={(checked) => updateField('TerminationReasonablyCertain', checked)}
          />
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-white">Termination Reasonably Certain</label>
            <p className="text-xs text-slate-600 dark:text-slate-400">Is early termination reasonably certain?</p>
          </div>
        </div>
      </div>

      {/* Purchase Options & Guarantees */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">Purchase Options & Guarantees</h4>
        
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
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.PurchaseOptionReasonablyCertain || false}
              onChange={(checked) => updateField('PurchaseOptionReasonablyCertain', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">Purchase Option Reasonably Certain</label>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.RVGReasonablyCertain || false}
              onChange={(checked) => updateField('RVGReasonablyCertain', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">RVG Reasonably Certain</label>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Valuation */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">Asset Valuation</h4>

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

      {/* Policy Flags */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">Policy Elections</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.LowValueExemption || false}
              onChange={(checked) => updateField('LowValueExemption', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">Low Value Exemption</label>
              <p className="text-xs text-slate-600 dark:text-slate-400">Apply low-value practical expedient</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
            <Switch
              checked={leaseData.ShortTermExemption || false}
              onChange={(checked) => updateField('ShortTermExemption', checked)}
            />
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white">Short Term Exemption</label>
              <p className="text-xs text-slate-600 dark:text-slate-400">Apply short-term lease expedient</p>
            </div>
          </div>
        </div>
      </div>

      

         

      {/* Governance */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
        <h4 className="text-md font-semibold text-slate-900 dark:text-white">Governance & Approval</h4>

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

      {/* Validation Modal */}
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
              <p className="text-slate-700">{validationMessage}</p>
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