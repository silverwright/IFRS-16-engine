import React, { useRef, useState } from 'react';
import { useLeaseContext, SavedContract } from '../../context/LeaseContext';
import { Button } from '../UI/Button';
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FileImportProps {
  onUploadComplete: () => void;
  onModeRequired: () => void;
}

type ImportType = 'csv' | 'excel' | null;

export function FileImport({ onUploadComplete, onModeRequired }: FileImportProps) {
  const { dispatch } = useLeaseContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<ImportType>(null);
  const [selectedMode, setSelectedMode] = useState<'MINIMAL' | 'FULL'>('MINIMAL');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleTypeSelect = (type: ImportType) => {
    setSelectedType(type);
    setUploadStatus('idle');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRow = lines[1].split(',').map(d => d.trim().replace(/"/g, ''));

    const csvData: any = {};
    headers.forEach((header, index) => {
      if (dataRow[index]) {
        csvData[header] = dataRow[index];
      }
    });

    return csvData;
  };

  const mapDataToLeaseData = (data: any) => {
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
      'Renewal Option Likelihood': 'RenewalOptionLikelihood',
      'RenewalOptionLikelihood': 'RenewalOptionLikelihood',
      'Termination Option Point': 'TerminationOptionPoint',
      'TerminationOptionPoint': 'TerminationOptionPoint',
      'Termination Option Likelihood': 'TerminationOptionLikelihood',
      'TerminationOptionLikelihood': 'TerminationOptionLikelihood',
      'Termination Penalty Expected': 'TerminationPenaltyExpected',
      'TerminationPenaltyExpected': 'TerminationPenaltyExpected',
      'Termination Reasonably Certain': 'TerminationReasonablyCertain',
      'TerminationReasonablyCertain': 'TerminationReasonablyCertain',

      // Payments
      'Fixed Payment': 'FixedPaymentPerPeriod',
      'FixedPaymentPerPeriod': 'FixedPaymentPerPeriod',
      'Fixed Payment Per Period': 'FixedPaymentPerPeriod',
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
      'Currency': 'Currency',
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

      // Full mode extensions - Legal and Administrative
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

    // Numeric fields that need parsing
    const numericFields = [
      'NonCancellableYears', 'RenewalOptionYears', 'RenewalOptionLikelihood',
      'TerminationOptionLikelihood', 'TerminationPenaltyExpected',
      'FixedPaymentPerPeriod', 'BaseCPI', 'CPIResetMonth', 'FirstResetYearOffset',
      'FixedEscalationPct', 'VariablePaymentsInSubstanceFixed', 'VariablePaymentsUsageExpected',
      'RVGExpected', 'PurchaseOptionPrice', 'CarryingAmount', 'FairValue', 'SalesProceeds',
      'InitialDirectCosts', 'PrepaymentsBeforeCommencement', 'LeaseIncentives',
      'IBR_Annual', 'UsefulLifeYears', 'InsuranceSumInsured', 'InsuranceTPLimit'
    ];

    // Boolean fields that need parsing
    const booleanFields = [
      'TerminationReasonablyCertain', 'RVGReasonablyCertain', 'PurchaseOptionReasonablyCertain',
      'PrepaidFirstPayment', 'LowValueExemption', 'ShortTermExemption', 'SeparateNonLeaseComponents'
    ];

    // Date fields that need parsing
    const dateFields = ['ContractDate', 'CommencementDate', 'EndDateOriginal', 'DeliveryDateLatest'];

    Object.keys(data).forEach(key => {
      const leaseKey = mapping[key];
      if (leaseKey && data[key] !== undefined && data[key] !== null && data[key] !== '') {
        let value = data[key];

        // Parse numeric fields
        if (numericFields.includes(leaseKey)) {
          value = parseFloat(value);
          if (leaseKey === 'IBR_Annual' && value > 1) {
            value = value / 100;
          }
        }

        // Parse boolean fields
        if (booleanFields.includes(leaseKey)) {
          if (typeof value === 'string') {
            value = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
          } else {
            value = Boolean(value);
          }
        }

        // Parse date fields
        if (dateFields.includes(leaseKey)) {
          if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          }
        }

        leaseData[leaseKey] = value;
      }
    });

    if (!leaseData.PaymentFrequency) leaseData.PaymentFrequency = 'Monthly';
    if (!leaseData.PaymentTiming) leaseData.PaymentTiming = 'Advance';
    if (!leaseData.Currency) leaseData.Currency = 'NGN';

    return leaseData;
  };

  const handleCSVUpload = async (file: File) => {
    const text = await file.text();
    const csvData = parseCSV(text);
    const leaseData = mapDataToLeaseData(csvData);

    dispatch({ type: 'SET_LEASE_DATA', payload: leaseData });
    setUploadStatus('success');
    setTimeout(() => {
      onModeRequired();
      onUploadComplete();
    }, 1500);
  };

  const handleExcelUpload = async (file: File) => {
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
      const leaseData = mapDataToLeaseData(row);

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
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');

    try {
      if (selectedType === 'csv') {
        if (!file.name.toLowerCase().endsWith('.csv')) {
          throw new Error('Please select a CSV file');
        }
        await handleCSVUpload(file);
      } else if (selectedType === 'excel') {
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (!['xlsx', 'xls'].includes(fileExtension || '')) {
          throw new Error('Please select an Excel file (.xlsx or .xls)');
        }
        await handleExcelUpload(file);
      }
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!selectedType) {
    return (
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Import Contracts</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Choose how you would like to import your contract data</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleTypeSelect('csv')}
            className="group border-2 border-slate-300 dark:border-slate-600/50 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-500/30 transition-colors">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">CSV Import</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Import a single contract from a CSV file
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleTypeSelect('excel')}
            className="group border-2 border-slate-300 dark:border-slate-600/50 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-500/30 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Excel Import</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Import multiple contracts from an Excel file
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {selectedType === 'csv' ? 'CSV Import' : 'Excel Bulk Import'}
        </h3>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedType(null);
            setUploadStatus('idle');
          }}
          className="text-sm border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100"
        >
          Change Import Type
        </Button>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-300 dark:border-blue-500/30 p-4">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Select Default Mode</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Choose the default mode for imported contracts. This will be used unless a "Mode" column specifies otherwise.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedMode('MINIMAL')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedMode === 'MINIMAL'
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500/50'
              }`}
            >
              <div className="font-semibold">MINIMAL</div>
              <div className="text-xs mt-1">Basic fields only</div>
            </button>
            <button
              onClick={() => setSelectedMode('FULL')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedMode === 'FULL'
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500/50'
              }`}
            >
              <div className="font-semibold">FULL</div>
              <div className="text-xs mt-1">All fields including legal</div>
            </button>
          </div>
        </div>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600/50 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors">
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              selectedType === 'csv' ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-green-100 dark:bg-green-500/20'
            }`}>
              {selectedType === 'csv' ? (
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
              )}
            </div>

            <div>
              <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Upload {selectedType === 'csv' ? 'CSV' : 'Excel'} File
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedType === 'csv'
                  ? 'Import lease data from a CSV file to automatically fill the form'
                  : 'Import multiple lease contracts from an Excel file (.xlsx or .xls)'}
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
                  Select {selectedType === 'csv' ? 'CSV' : 'Excel'} File
                </>
              )}
            </Button>
          </div>
        </div>

        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/20 border border-green-300 dark:border-green-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-green-700 dark:text-green-300 font-medium">
              {selectedType === 'csv'
                ? 'CSV imported successfully!'
                : `Successfully imported ${uploadedCount} contract${uploadedCount !== 1 ? 's' : ''}!`}
            </span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300 font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="bg-slate-100 dark:bg-slate-700/40 rounded-lg p-4 border border-slate-300 dark:border-slate-600/50">
          <h5 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Expected Format:</h5>
          {selectedType === 'csv' ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Your CSV should include these column headers (first row):
              </p>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-200 dark:bg-slate-900/50 p-2 rounded border border-slate-300 dark:border-slate-600/50">
                Contract ID, Lessee Entity, Lessor Name, Asset Class, Asset Description,
                Contract Date, Commencement Date, Original End Date, Non-cancellable Period,
                Useful Life, Fixed Payment Per Period, Currency, Payment Frequency,
                Payment Timing, IBR Annual
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Your Excel file should have column headers in the first row. Each subsequent row represents one contract.
                All contracts will use the selected default mode above, unless a "Mode" column is included with "MINIMAL" or "FULL" values.
              </p>
              <div className="bg-slate-200 dark:bg-slate-900/50 rounded border border-slate-300 dark:border-slate-600/50 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-300 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Contract ID</th>
                      <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Lessee Entity</th>
                      <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Lessor Name</th>
                      <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Asset Description</th>
                      <th className="px-2 py-2 text-left font-medium text-slate-700 dark:text-slate-300">...</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-300 dark:border-slate-700">
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">LC-2024-001</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">ABC Corp</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">XYZ Leasing</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">Office Equipment</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">...</td>
                    </tr>
                    <tr className="border-t border-slate-300 dark:border-slate-700">
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">LC-2024-002</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">DEF Ltd</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">XYZ Leasing</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">Warehouse Space</td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-400">...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-500 mt-3">
                <strong>Required columns:</strong> Contract ID, Lessee Entity, Lessor Name, Asset Class,
                Asset Description, Contract Date, Commencement Date, Original End Date,
                Non-cancellable Period, Useful Life, Fixed Payment Per Period, Currency,
                Payment Frequency, Payment Timing, IBR Annual
                <br />
                <strong>Optional:</strong> Mode (MINIMAL or FULL, overrides the default mode selected above)
              </p>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={selectedType === 'csv' ? '.csv' : '.xlsx,.xls'}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
