/**
 * BasicInfoForm Component
 *
 * Form component for capturing essential lease contract information.
 * This is the first step in the contract creation workflow.
 *
 * ## Fields Captured
 *
 * **Identifiers**:
 * - Contract ID: Unique identifier for the lease contract
 * - Lessee Entity: Legal name of the lessee
 * - Lessor Name: Legal name of the lessor
 * - Asset Class: Type of asset being leased (Buildings, Machinery, etc.)
 * - Asset Description: Detailed description of the asset
 *
 * **Dates**:
 * - Contract Date: When the contract was signed
 * - Commencement Date: When the lease term begins (IFRS 16 commencement)
 * - End Date: Expected end date of the non-cancellable period
 *
 * **Lease Term**:
 * - Non-Cancellation Period: Auto-calculated from dates
 * - Useful Life: Asset's useful life for depreciation
 *
 * ## Auto-Calculation
 *
 * The non-cancellable period is automatically calculated from the
 * commencement date and end date, accounting for leap years.
 *
 * @module BasicInfoForm
 */

import { useEffect } from 'react';
import { useLeaseContext } from '../../../context/LeaseContext';
import { FormField } from '../../UI/FormField';
import { Select } from '../../UI/Select';

/* ============================================================================
 * CONSTANTS
 * ============================================================================ */

/**
 * Asset class options for dropdown
 *
 * Common asset categories for IFRS 16 leases:
 * - Buildings: Real estate, office space
 * - Machinery: Manufacturing equipment, production machinery
 * - Vehicles: Cars, trucks, fleet vehicles
 * - Equipment: Office equipment, tools
 * - IT Hardware: Computers, servers, network equipment
 * - Other: Any asset not fitting the above categories
 */
const assetClasses = [
  'Land',
  'Buildings',
  'Machinery',
  'Vehicles',
  'Equipment',
  'IT Hardware',
  'Other'
];

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

/**
 * BasicInfoForm - Form for capturing basic lease information
 *
 * Renders a form with essential lease contract fields. Automatically
 * calculates the non-cancellable period based on commencement and end dates.
 *
 * Uses the global LeaseContext to store and retrieve form data, ensuring
 * data persists as users navigate between form sections.
 *
 * @returns React component rendering the basic information form
 *
 * @example
 * ```tsx
 * <BasicInfoForm />
 * ```
 */
export function BasicInfoForm() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData } = state;

  /**
   * Update a single field in the lease data
   *
   * Dispatches a SET_LEASE_DATA action to update the global state.
   * Uses partial update to merge with existing data.
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
   * AUTO-CALCULATION: Non-Cancellable Period
   *
   * Effect hook that automatically calculates the non-cancellable period
   * whenever the commencement date or end date changes.
   *
   * Calculation:
   * 1. Get time difference between end date and commencement date
   * 2. Convert to years, accounting for leap years (365.25 days/year)
   * 3. Round to 2 decimal places
   * 4. Update NonCancellableYears field if value changed
   *
   * This ensures the lease term is always accurate and prevents manual entry errors.
   * ============================================================================ */
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

  /* ============================================================================
   * RENDER
   * ============================================================================ */

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        Basic Information
      </h3>

      {/* Party and Asset Identifiers */}
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

      {/* Asset Description (full width) */}
      <FormField
        label="Asset Description"
        value={leaseData.AssetDescription || ''}
        onChange={(value) => updateField('AssetDescription', value)}
        placeholder="100 kW solar array + 400 kWh storage"
        required
      />

      {/* Dates (3 columns) */}
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

      {/* Lease Term and Useful Life */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Non-Cancellation Period (years)"
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
