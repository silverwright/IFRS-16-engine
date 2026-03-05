import React, { useRef, useState } from 'react';
import { useLeaseContext } from '../../../context/LeaseContext';
import { Button } from '../../UI/Button';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface CSVUploadProps {
  onUploadComplete: () => void;
  onModeRequired: () => void;
}

export function CSVUpload({ onUploadComplete, onModeRequired }: CSVUploadProps) {
  const { dispatch } = useLeaseContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  const mapCSVToLeaseData = (csvData: any) => {
    const mapping: { [key: string]: string } = {
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
      'Contract Date': 'ContractDate',
      'ContractDate': 'ContractDate',
      'Commencement Date': 'CommencementDate',
      'CommencementDate': 'CommencementDate',
      'End Date': 'EndDateOriginal',
      'EndDateOriginal': 'EndDateOriginal',
      'Original End Date': 'EndDateOriginal',
      'Non-cancellable Years': 'NonCancellableYears',
      'NonCancellableYears': 'NonCancellableYears',
      'Non-cancellable Period': 'NonCancellableYears',
      'Useful Life Years': 'UsefulLifeYears',
      'UsefulLifeYears': 'UsefulLifeYears',
      'Useful Life': 'UsefulLifeYears',
      'Fixed Payment': 'FixedPaymentPerPeriod',
      'FixedPaymentPerPeriod': 'FixedPaymentPerPeriod',
      'Fixed Payment Per Period': 'FixedPaymentPerPeriod',
      'Currency': 'Currency',
      'Payment Frequency': 'PaymentFrequency',
      'PaymentFrequency': 'PaymentFrequency',
      'Payment Timing': 'PaymentTiming',
      'PaymentTiming': 'PaymentTiming',
      'IBR Annual': 'IBR_Annual',
      'IBR_Annual': 'IBR_Annual',
      'IBR': 'IBR_Annual',
    };

    const leaseData: any = {};
    Object.keys(csvData).forEach(csvKey => {
      const leaseKey = mapping[csvKey];
      if (leaseKey && csvData[csvKey]) {
        let value = csvData[csvKey];

        if (['NonCancellableYears', 'FixedPaymentPerPeriod', 'IBR_Annual', 'UsefulLifeYears'].includes(leaseKey)) {
          value = parseFloat(value);
          if (leaseKey === 'IBR_Annual' && value > 1) {
            value = value / 100;
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('error');
      setErrorMessage('Please select a CSV file');
      return;
    }

    setUploading(true);
    setUploadStatus('idle');

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      const leaseData = mapCSVToLeaseData(csvData);

      dispatch({ type: 'SET_LEASE_DATA', payload: leaseData });
      setUploadStatus('success');
      setTimeout(() => {
        onModeRequired();
        onUploadComplete();
      }, 1500);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to parse CSV file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Import from CSV</h3>
      
      <div className="space-y-4">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-slate-900">Upload CSV File</h4>
              <p className="text-sm text-slate-600 mt-1">
                Import lease data from a CSV file to automatically fill the form
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
                  <FileText className="w-4 h-4" />
                  Select CSV File
                </>
              )}
            </Button>
          </div>
        </div>

        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">CSV imported successfully!</span>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{errorMessage}</span>
          </div>
        )}

        <div className="bg-slate-50 rounded-lg p-4">
          <h5 className="font-medium text-slate-900 mb-2">Expected CSV Format:</h5>
          <p className="text-sm text-slate-600 mb-2">
            Your CSV should include these column headers (first row):
          </p>
          <div className="text-xs text-slate-500 font-mono bg-white p-2 rounded border">
            Contract ID, Lessee Entity, Lessor Name, Asset Class, Asset Description,
            Contract Date, Commencement Date, Original End Date, Non-cancellable Period,
            Useful Life, Fixed Payment Per Period, Currency, Payment Frequency,
            Payment Timing, IBR Annual
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}