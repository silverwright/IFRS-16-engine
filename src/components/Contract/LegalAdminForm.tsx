import React from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { FormField } from '../UI/FormField';

export function LegalAdminForm() {
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
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Legal & Administrative</h3>

      {/* Jurisdiction & Registration */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-emerald-500 dark:text-emerald-400">Jurisdiction & Registration</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Lessor Jurisdiction"
            value={leaseData.LessorJurisdiction || ''}
            onChange={(value) => updateField('LessorJurisdiction', value)}
            placeholder="Federal Republic of Nigeria"
          />

          <FormField
            label="Lessee Jurisdiction"
            value={leaseData.LesseeJurisdiction || ''}
            onChange={(v) => updateField('LesseeJurisdiction', v)}
            placeholder="State of Delaware, USA"
          />

          <FormField
            label="Lessor Registered Address"
            value={leaseData.LessorAddress || ''}
            onChange={(v) => updateField('LessorAddress', v)}
            placeholder="12 Marina Road, Lagos"
          />

          <FormField
            label="Lessee Registered Address"
            value={leaseData.LesseeAddress || ''}
            onChange={(v) => updateField('LesseeAddress', v)}
            placeholder="42 Broad Street, London"
          />

          <FormField
            label="Lessor RC/Registration Number"
            value={leaseData.LessorRCNumber || ''}
            onChange={(v) => updateField('LessorRCNumber', v)}
            placeholder="RC123456"
          />

          <FormField
            label="Lessee RC/Registration Number"
            value={leaseData.LesseeRCNumber || ''}
            onChange={(v) => updateField('LesseeRCNumber', v)}
            placeholder="RC789101"
          />

          <FormField
            label="Asset Location"
            value={leaseData.AssetLocation || ''}
            onChange={(value) => updateField('AssetLocation', value)}
            placeholder="Lagos, Nigeria"
          />

          <FormField
            label="Governing Law"
            value={leaseData.GoverningLaw || ''}
            onChange={(value) => updateField('GoverningLaw', value)}
            placeholder="Laws of the Federal Republic of Nigeria"
          />

          <FormField
            label="Arbitration Rules"
            value={leaseData.ArbitrationRules || ''}
            onChange={(value) => updateField('ArbitrationRules', value)}
            placeholder="Lagos Court of Arbitration Rules"
          />
        </div>
      </div>

      {/* Insurance */}
      <div className="border-t pt-6 space-y-4">
        <h4 className="text-md font-semibold text-emerald-400">Insurance</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Insurance Sum Insured"
            type="number"
            value={leaseData.InsuranceSumInsured || ''}
            onChange={(v) => updateField('InsuranceSumInsured', Number(v))}
            placeholder="200000000"
          />

          <FormField
            label="Third-party Liability Limit"
            type="number"
            value={leaseData.InsuranceTPLimit || ''}
            onChange={(v) => updateField('InsuranceTPLimit', Number(v))}
            placeholder="50000000"
          />

          <FormField
            label="Minimum Insurer Rating"
            value={leaseData.InsurerRatingMin || ''}
            onChange={(v) => updateField('InsurerRatingMin', v)}
            placeholder="A"
          />
        </div>
      </div>

      {/* Use & Restrictions */}
      <div className="border-t pt-6 space-y-4">
        <h4 className="text-md font-semibold text-emerald-400">Use & Restrictions</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Permitted Use"
            value={leaseData.PermittedUse || ''}
            onChange={(v) => updateField('PermittedUse', v)}
            placeholder="Commercial aviation operations"
          />

          <FormField
            label="Move/Relocation Restriction"
            value={leaseData.MoveRestriction || ''}
            onChange={(v) => updateField('MoveRestriction', v)}
            placeholder="Asset may not be relocated without consent"
          />

          <FormField
            label="Software License Statement"
            value={leaseData.SoftwareLicense || ''}
            onChange={(v) => updateField('SoftwareLicense', v)}
            placeholder="Licensed software included with asset"
          />
        </div>
      </div>
    </div>
  );
}
