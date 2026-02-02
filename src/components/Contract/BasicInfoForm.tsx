import React, { useEffect } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { FormField } from '../UI/FormField';
import { Select } from '../UI/Select';

const assetClasses = [
  'Buildings',
  'Machinery',
  'Vehicles',
  'Equipment',
  'IT Hardware',
  'Other'
];

export function BasicInfoForm() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;

  const updateField = (field: string, value: any) => {
    dispatch({
      type: 'SET_LEASE_DATA',
      payload: { [field]: value }
    });
  };

  // Auto-calculate non-cancellable period based on commencement and end date
  useEffect(() => {
    if (leaseData.CommencementDate && leaseData.EndDateOriginal) {
      const startDate = new Date(leaseData.CommencementDate);
      const endDate = new Date(leaseData.EndDateOriginal);

      // Calculate difference in years
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years

      // Round to 2 decimal places
      const calculatedYears = Math.round(diffYears * 100) / 100;

      // Only update if the calculated value is different and valid
      if (calculatedYears > 0 && calculatedYears !== leaseData.NonCancellableYears) {
        updateField('NonCancellableYears', calculatedYears);
      }
    }
  }, [leaseData.CommencementDate, leaseData.EndDateOriginal]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Contract ID"
          value={leaseData.ContractID || ''}
          onChange={(value) => updateField('ContractID', value)}
          placeholder="LSE-2025-001"
          required
        />
        
        <FormField
          label="Lessee Entity"
          value={leaseData.LesseeEntity || ''}
          onChange={(value) => updateField('LesseeEntity', value)}
          placeholder="Company Name Ltd"
          required
        />
        
        <FormField
          label="Lessor Name"
          value={leaseData.LessorName || ''}
          onChange={(value) => updateField('LessorName', value)}
          placeholder="Lessor Company Ltd"
          required
        />
        
        <Select
          label="Asset Class"
          value={leaseData.AssetClass || ''}
          options={assetClasses}
          onChange={(value) => updateField('AssetClass', value)}
          required
        />
      </div>

      <FormField
        label="Asset Description"
        value={leaseData.AssetDescription || ''}
        onChange={(value) => updateField('AssetDescription', value)}
        placeholder="100 kW solar array + 400 kWh storage"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Contract Date"
          type="date"
          value={leaseData.ContractDate || ''}
          onChange={(value) => updateField('ContractDate', value)}
          required
        />
        
        <FormField
          label="Commencement Date"
          type="date"
          value={leaseData.CommencementDate || ''}
          onChange={(value) => updateField('CommencementDate', value)}
          required
        />
        
        <FormField
          label="End Date"
          type="date"
          value={leaseData.EndDateOriginal || ''}
          onChange={(value) => updateField('EndDateOriginal', value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Compulsory Extension Period (years)"
          type="number"
          value={leaseData.NonCancellableYears || ''}
          onChange={(value) => updateField('NonCancellableYears', Number(value))}
          placeholder="Auto-calculated"
          required
          disabled
          helperText="Automatically calculated from Commencement and End Date"
        />
        
        <FormField
          label="Useful Life (years)"
          type="number"
          value={leaseData.UsefulLifeYears || ''}
          onChange={(value) => updateField('UsefulLifeYears', Number(value))}
          placeholder="15"
          required
        />
      </div>
    </div>
  );
}