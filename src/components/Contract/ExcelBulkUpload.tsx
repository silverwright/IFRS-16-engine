import React, { useRef, useState } from 'react';
import { useLeaseContext, SavedContract } from '../../context/LeaseContext';
import { Button } from '../UI/Button';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelBulkUploadProps {
  onUploadComplete: () => void;
}

export function ExcelBulkUpload({ onUploadComplete }: ExcelBulkUploadProps) {
  const { dispatch } = useLeaseContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMode, setSelectedMode] = useState<'MINIMAL' | 'FULL'>('MINIMAL');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const mapExcelRowToLeaseData = (row: any) => {
    const mapping: { [key: string]: string } = {
      // Basic identifiers
      'Contract ID': 'ContractID',
      'ContractID': 'ContractID',
      'Lessee Entity': 'LesseeEntity',
      'LesseeEntity': 'LesseeEntity',
      'Lessor Name': 'LessorName',
      'LessorName': 'LessorName',
      'Asset Class': 'AssetClass',
      'AssetClass': 'AssetClass',
      'Asset Description': 'AssetDescription',
      'AssetDescription': 'AssetDescription',

      // Dates
      'Contract Date': 'ContractDate',
      'ContractDate': 'ContractDate',
      'Commencement Date': 'CommencementDate',
      'CommencementDate': 'CommencementDate',
      'End Date': 'EndDateOriginal',
      'EndDateOriginal': 'EndDateOriginal',
      'Original End Date': 'EndDateOriginal',

      // Term & Options
      'Non-cancellable Years': 'NonCancellableYears',
      'NonCancellableYears': 'NonCancellableYears',
      'Non-cancellable Period': 'NonCancellableYears',
      'Renewal Option Years': 'RenewalOptionYears',
      'RenewalOptionYears': 'RenewalOptionYears',
      'Renewal Likelihood': 'RenewalOptionLikelihood',
      'RenewalOptionLikelihood': 'RenewalOptionLikelihood',
      'Termination Option Point': 'TerminationOptionPoint',
      'TerminationOptionPoint': 'TerminationOptionPoint',
      'Termination Likelihood': 'TerminationOptionLikelihood',
      'TerminationOptionLikelihood': 'TerminationOptionLikelihood',
      'Termination Penalty Expected': 'TerminationPenaltyExpected',
      'TerminationPenaltyExpected': 'TerminationPenaltyExpected',
      'Termination Reasonably Certain': 'TerminationReasonablyCertain',
      'TerminationReasonablyCertain': 'TerminationReasonablyCertain',

      // Payments
      'Fixed Payment': 'FixedPaymentPerPeriod',
      'FixedPaymentPerPeriod': 'FixedPaymentPerPeriod',
      'Fixed Payment Per Period': 'FixedPaymentPerPeriod',
      'Currency': 'Currency',
      'Payment Frequency': 'PaymentFrequency',
      'PaymentFrequency': 'PaymentFrequency',
      'Payment Timing': 'PaymentTiming',
      'PaymentTiming': 'PaymentTiming',

      // Escalation
      'Escalation Type': 'EscalationType',
      'EscalationType': 'EscalationType',
      'Base CPI': 'BaseCPI',
      'BaseCPI': 'BaseCPI',
      'CPI Reset Month': 'CPIResetMonth',
      'CPIResetMonth': 'CPIResetMonth',
      'First Reset Year Offset': 'FirstResetYearOffset',
      'FirstResetYearOffset': 'FirstResetYearOffset',
      'Fixed Escalation Pct': 'FixedEscalationPct',
      'FixedEscalationPct': 'FixedEscalationPct',

      // Variable & Other
      'Variable Payments In Substance Fixed': 'VariablePaymentsInSubstanceFixed',
      'VariablePaymentsInSubstanceFixed': 'VariablePaymentsInSubstanceFixed',
      'Variable Payments Usage Expected': 'VariablePaymentsUsageExpected',
      'VariablePaymentsUsageExpected': 'VariablePaymentsUsageExpected',
      'RVG Expected': 'RVGExpected',
      'RVGExpected': 'RVGExpected',
      'RVG Reasonably Certain': 'RVGReasonablyCertain',
      'RVGReasonablyCertain': 'RVGReasonablyCertain',
      'Purchase Option Price': 'PurchaseOptionPrice',
      'PurchaseOptionPrice': 'PurchaseOptionPrice',
      'Purchase Option Reasonably Certain': 'PurchaseOptionReasonablyCertain',
      'PurchaseOptionReasonablyCertain': 'PurchaseOptionReasonablyCertain',

      // Asset Valuation
      'Carrying Amount': 'CarryingAmount',
      'CarryingAmount': 'CarryingAmount',
      'Fair Value': 'FairValue',
      'FairValue': 'FairValue',
      'Sales Proceeds': 'SalesProceeds',
      'SalesProceeds': 'SalesProceeds',

      // ROU Adjustments
      'Initial Direct Costs': 'InitialDirectCosts',
      'InitialDirectCosts': 'InitialDirectCosts',
      'Prepayments Before Commencement': 'PrepaymentsBeforeCommencement',
      'PrepaymentsBeforeCommencement': 'PrepaymentsBeforeCommencement',
      'Lease Incentives': 'LeaseIncentives',
      'LeaseIncentives': 'LeaseIncentives',
      'Prepaid First Payment': 'PrepaidFirstPayment',
      'PrepaidFirstPayment': 'PrepaidFirstPayment',

      // Currency & Rates
      'IBR Annual': 'IBR_Annual',
      'IBR_Annual': 'IBR_Annual',
      'IBR': 'IBR_Annual',
      'FX Policy': 'FXPolicy',
      'FXPolicy': 'FXPolicy',

      // Asset Life
      'Useful Life Years': 'UsefulLifeYears',
      'UsefulLifeYears': 'UsefulLifeYears',
      'Useful Life': 'UsefulLifeYears',

      // Policy Flags
      'Low Value Exemption': 'LowValueExemption',
      'LowValueExemption': 'LowValueExemption',
      'Short Term Exemption': 'ShortTermExemption',
      'ShortTermExemption': 'ShortTermExemption',
      'Separate Non Lease Components': 'SeparateNonLeaseComponents',
      'SeparateNonLeaseComponents': 'SeparateNonLeaseComponents',
      'Allocation Basis': 'AllocationBasis',
      'AllocationBasis': 'AllocationBasis',

      // Governance
      'Judgement Notes': 'JudgementNotes',
      'JudgementNotes': 'JudgementNotes',
      'Approval Signoff': 'ApprovalSignoff',
      'ApprovalSignoff': 'ApprovalSignoff',

      // Full mode extensions (Legal & Administrative)
      'Lessor Jurisdiction': 'LessorJurisdiction',
      'LessorJurisdiction': 'LessorJurisdiction',
      'Lessee Jurisdiction': 'LesseeJurisdiction',
      'LesseeJurisdiction': 'LesseeJurisdiction',
      'Lessor Address': 'LessorAddress',
      'LessorAddress': 'LessorAddress',
      'Lessee Address': 'LesseeAddress',
      'LesseeAddress': 'LesseeAddress',
      'Lessor RC Number': 'LessorRCNumber',
      'LessorRCNumber': 'LessorRCNumber',
      'Lessee RC Number': 'LesseeRCNumber',
      'LesseeRCNumber': 'LesseeRCNumber',
      'Asset Location': 'AssetLocation',
      'AssetLocation': 'AssetLocation',
      'Delivery Date Latest': 'DeliveryDateLatest',
      'DeliveryDateLatest': 'DeliveryDateLatest',
      'Risk Transfer Event': 'RiskTransferEvent',
      'RiskTransferEvent': 'RiskTransferEvent',
      'Insurance Sum Insured': 'InsuranceSumInsured',
      'InsuranceSumInsured': 'InsuranceSumInsured',
      'Insurance TP Limit': 'InsuranceTPLimit',
      'InsuranceTPLimit': 'InsuranceTPLimit',
      'Insurer Rating Min': 'InsurerRatingMin',
      'InsurerRatingMin': 'InsurerRatingMin',
      'Permitted Use': 'PermittedUse',
      'PermittedUse': 'PermittedUse',
      'Move Restriction': 'MoveRestriction',
      'MoveRestriction': 'MoveRestriction',
      'Software License': 'SoftwareLicense',
      'SoftwareLicense': 'SoftwareLicense',
      'Bank Name': 'BankName',
      'BankName': 'BankName',
      'Bank Account Name': 'BankAccountName',
      'BankAccountName': 'BankAccountName',
      'Bank Account No': 'BankAccountNo',
      'BankAccountNo': 'BankAccountNo',
      'Arbitration Rules': 'ArbitrationRules',
      'ArbitrationRules': 'ArbitrationRules',
      'Seat Of Arbitration': 'SeatOfArbitration',
      'SeatOfArbitration': 'SeatOfArbitration',
      'Language': 'Language',
      'Governing Law': 'GoverningLaw',
      'GoverningLaw': 'GoverningLaw',
      'Lessor Signatory Title': 'LessorSignatoryTitle',
      'LessorSignatoryTitle': 'LessorSignatoryTitle',
      'Lessee Signatory Title': 'LesseeSignatoryTitle',
      'LesseeSignatoryTitle': 'LesseeSignatoryTitle',
    };

    const leaseData: any = {};
    Object.keys(row).forEach(excelKey => {
      // Trim whitespace from header names to handle Excel headers with leading/trailing spaces
      const normalizedKey = excelKey.trim();
      const leaseKey = mapping[normalizedKey];
      if (leaseKey && row[excelKey] !== undefined && row[excelKey] !== null && row[excelKey] !== '') {
        let value = row[excelKey];

        // Handle numeric fields
        const numericFields = [
          'NonCancellableYears', 'RenewalOptionYears', 'RenewalOptionLikelihood',
          'TerminationOptionLikelihood', 'TerminationPenaltyExpected', 'FixedPaymentPerPeriod', 'BaseCPI',
          'CPIResetMonth', 'FirstResetYearOffset', 'FixedEscalationPct',
          'VariablePaymentsInSubstanceFixed', 'VariablePaymentsUsageExpected',
          'RVGExpected', 'PurchaseOptionPrice', 'InitialDirectCosts',
          'PrepaymentsBeforeCommencement', 'LeaseIncentives', 'IBR_Annual',
          'UsefulLifeYears', 'InsuranceSumInsured', 'InsuranceTPLimit',
          'CarryingAmount', 'FairValue', 'SalesProceeds'
        ];

        if (numericFields.includes(leaseKey)) {
          value = parseFloat(value);
          // Convert percentages if greater than 1
          if (['IBR_Annual', 'RenewalOptionLikelihood', 'TerminationOptionLikelihood', 'FixedEscalationPct'].includes(leaseKey) && value > 1) {
            value = value / 100;
          }
        }

        // Handle boolean fields
        const booleanFields = [
          'TerminationReasonablyCertain', 'RVGReasonablyCertain',
          'PurchaseOptionReasonablyCertain', 'PrepaidFirstPayment',
          'LowValueExemption', 'ShortTermExemption', 'SeparateNonLeaseComponents'
        ];

        if (booleanFields.includes(leaseKey)) {
          const strValue = String(value).toLowerCase();
          value = strValue === 'true' || strValue === 'yes' || strValue === '1' || strValue === 'y';
        }

        // Handle date fields
        const dateFields = ['ContractDate', 'CommencementDate', 'EndDateOriginal', 'DeliveryDateLatest'];
        if (dateFields.includes(leaseKey)) {
          if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          }
        }

        // Handle banking/text fields - ensure they're strings
        const textFields = ['BankName', 'BankAccountName', 'BankAccountNo'];
        if (textFields.includes(leaseKey)) {
          value = String(value).trim();
        }

        leaseData[leaseKey] = value;
      }
    });

    if (!leaseData.PaymentFrequency) leaseData.PaymentFrequency = 'Monthly';
    if (!leaseData.PaymentTiming) leaseData.PaymentTiming = 'Advance';
    if (!leaseData.Currency) leaseData.Currency = 'NGN';

    return leaseData;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      setUploadStatus('error');
      setErrorMessage('Please select an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('No data found in the file');
      }

      const contracts: SavedContract[] = [];
      jsonData.forEach((row: any, index: number) => {
        const leaseData = mapExcelRowToLeaseData(row);

        // Debug: Log banking details for first row
        if (index === 0) {
          console.log('First row banking details:', {
            BankName: leaseData.BankName,
            BankAccountName: leaseData.BankAccountName,
            BankAccountNo: leaseData.BankAccountNo,
            rawRow: row
          });
        }

        if (!leaseData.ContractID) {
          console.warn(`Row ${index + 1}: Skipping - missing Contract ID`);
          return;
        }

        const rowMode = row.Mode || row.mode;
        const mode = rowMode ? (rowMode.toUpperCase() === 'FULL' ? 'FULL' : 'MINIMAL') : selectedMode;

        const contract: SavedContract = {
          id: Date.now().toString() + '-' + index,
          contractId: leaseData.ContractID,
          lessorName: leaseData.LessorName || '',
          lesseeName: leaseData.LesseeEntity || '',
          assetDescription: leaseData.AssetDescription || '',
          commencementDate: leaseData.CommencementDate || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: leaseData,
          mode: mode
        };

        contracts.push(contract);
      });

      if (contracts.length === 0) {
        throw new Error('No valid contracts found in the file');
      }

      contracts.forEach(contract => {
        dispatch({ type: 'SAVE_CONTRACT', payload: contract });
      });

      setUploadedCount(contracts.length);
      setUploadStatus('success');
      setTimeout(() => {
        onUploadComplete();
      }, 2000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse Excel file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Bulk Import from Excel</h3>

      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h4 className="font-medium text-slate-900 mb-3">Select Default Mode</h4>
          <p className="text-sm text-slate-600 mb-3">
            Choose the default mode for imported contracts. This will be used unless a "Mode" column specifies otherwise.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedMode('MINIMAL')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedMode === 'MINIMAL'
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">MINIMAL</div>
              <div className="text-xs mt-1">Basic fields only</div>
            </button>
            <button
              onClick={() => setSelectedMode('FULL')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedMode === 'FULL'
                  ? 'border-blue-500 bg-blue-100 text-blue-900'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold">FULL</div>
              <div className="text-xs mt-1">All fields including legal</div>
            </button>
          </div>
        </div>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>

            <div>
              <h4 className="text-lg font-medium text-slate-900">Upload Excel File</h4>
              <p className="text-sm text-slate-600 mt-1">
                Import multiple lease contracts from Excel (.xlsx, .xls) or CSV file
              </p>
            </div>

            <Button
              onClick={handleFileSelect}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Select Excel File
                </>
              )}
            </Button>
          </div>
        </div>

        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Successfully imported {uploadedCount} contract{uploadedCount !== 1 ? 's' : ''}!
            </span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4">
          <h5 className="font-medium text-slate-900 mb-2">Expected Excel Format:</h5>
          <p className="text-sm text-slate-600 mb-3">
            Your Excel file should have column headers in the first row. Each subsequent row represents one contract.
            All contracts will use the selected default mode above, unless a "Mode" column is included with "MINIMAL" or "FULL" values.
          </p>
          <div className="bg-white rounded border border-slate-200 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">Contract ID</th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">Lessee Entity</th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">Lessor Name</th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">Asset Description</th>
                  <th className="px-2 py-2 text-left font-medium text-slate-700">...</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-2 py-2 text-slate-600">LC-2024-001</td>
                  <td className="px-2 py-2 text-slate-600">ABC Corp</td>
                  <td className="px-2 py-2 text-slate-600">XYZ Leasing</td>
                  <td className="px-2 py-2 text-slate-600">Office Equipment</td>
                  <td className="px-2 py-2 text-slate-600">...</td>
                </tr>
                <tr className="border-t">
                  <td className="px-2 py-2 text-slate-600">LC-2024-002</td>
                  <td className="px-2 py-2 text-slate-600">DEF Ltd</td>
                  <td className="px-2 py-2 text-slate-600">XYZ Leasing</td>
                  <td className="px-2 py-2 text-slate-600">Warehouse Space</td>
                  <td className="px-2 py-2 text-slate-600">...</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-slate-600 mt-4 space-y-3">
            <div>
              <p className="font-semibold text-slate-900 mb-2">📋 All Available Columns (Headers for Excel File):</p>
              <p className="text-slate-600 mb-3 italic">Copy these headers exactly as shown below into your Excel file's first row. Order doesn't matter - the system will auto-map them.</p>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-2">✅ Required Columns (Must be present):</p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                <code className="text-xs">
                  Contract ID | Lessee Entity | Lessor Name | Asset Class | Asset Description | Contract Date | Commencement Date | Original End Date | Non-cancellable Years | Useful Life Years | Fixed Payment Per Period | Currency | Payment Frequency | Payment Timing | IBR Annual
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-2">⚙️ Optional Columns - Payment Details:</p>
              <div className="bg-slate-100 border border-slate-300 rounded p-3 mb-2">
                <code className="text-xs break-words">
                  Escalation Type | Base CPI | CPI Reset Month | First Reset Year Offset | Fixed Escalation Pct | Initial Direct Costs | Prepayments Before Commencement | Lease Incentives | Prepaid First Payment | Bank Name | Bank Account Name | Bank Account No
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-2">⚙️ Optional Columns - Advanced Options:</p>
              <div className="bg-slate-100 border border-slate-300 rounded p-3 mb-2">
                <code className="text-xs break-words">
                  Renewal Option Years | Renewal Likelihood | Termination Option Point | Termination Likelihood | Termination Penalty Expected | Termination Reasonably Certain | Purchase Option Price | Purchase Option Reasonably Certain | RVG Expected | RVG Reasonably Certain | Carrying Amount | Fair Value | Sales Proceeds | Variable Payments In Substance Fixed | Variable Payments Usage Expected | Low Value Exemption | Short Term Exemption | Separate Non Lease Components | Allocation Basis | FX Policy | Judgement Notes | Approval Signoff
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-2">⚙️ Optional Columns - Legal & Administrative (FULL mode):</p>
              <div className="bg-slate-100 border border-slate-300 rounded p-3 mb-2">
                <code className="text-xs break-words">
                  Lessor Jurisdiction | Lessee Jurisdiction | Lessor Address | Lessee Address | Lessor RC Number | Lessee RC Number | Asset Location | Delivery Date Latest | Risk Transfer Event | Insurance Sum Insured | Insurance TP Limit | Insurer Rating Min | Permitted Use | Move Restriction | Software License | Arbitration Rules | Seat Of Arbitration | Language | Governing Law | Lessor Signatory Title | Lessee Signatory Title
                </code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-2">🔧 Special Column:</p>
              <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-2">
                <code className="text-xs">
                  Mode
                </code>
                <p className="text-xs text-slate-600 mt-1">Value: MINIMAL or FULL (overrides default mode for specific rows)</p>
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <p className="font-semibold text-slate-900 mb-2">📝 Data Format Notes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                <li><strong>Dates:</strong> Use YYYY-MM-DD format or Excel date numbers</li>
                <li><strong>Numbers:</strong> No currency symbols or commas (e.g., 25000000 not ₦25,000,000)</li>
                <li><strong>Percentages:</strong> Can use decimal (0.14) or whole number (14) - both work</li>
                <li><strong>Booleans:</strong> Use TRUE/FALSE, YES/NO, 1/0, or Y/N</li>
                <li><strong>Text:</strong> Any text value is accepted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
