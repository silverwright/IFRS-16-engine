import React from 'react';
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
          label="Original End Date"
          type="date"
          value={leaseData.EndDateOriginal || ''}
          onChange={(value) => updateField('EndDateOriginal', value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Non-cancellable Period (years)"
          type="number"
          value={leaseData.NonCancellableYears || ''}
          onChange={(value) => updateField('NonCancellableYears', Number(value))}
          placeholder="5"
          required
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