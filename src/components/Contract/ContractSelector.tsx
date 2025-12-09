import React, { useState, useMemo } from 'react';
import { useLeaseContext, SavedContract } from '../../context/LeaseContext';
import { FileText, Search, ChevronRight, Download, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { calculateIFRS16 } from '../../utils/ifrs16Calculator';

interface ContractSelectorProps {
  onSelect: (contract: SavedContract) => void;
  showCalculateButton?: boolean;
}

export function ContractSelector({ onSelect, showCalculateButton = true }: ContractSelectorProps) {
  const { state } = useLeaseContext();
  const contracts = state.savedContracts || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINIMAL' | 'FULL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'pending' | 'approved'>('ALL');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const calculateEndDate = (startDate: string, years: number) => {
    if (!startDate || !years) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + years);
    return end.toLocaleDateString('en-GB');
  };

  const prepareContractData = () => {
    return contracts.map(contract => {
      let calculations = null;
      try {
        calculations = calculateIFRS16(contract.data);
      } catch (error) {
        console.error(`Failed to calculate for contract ${contract.contractId}:`, error);
      }

      const leaseTermYears = calculations?.leaseTermYears || contract.data.NonCancellableYears || 0;
      const endDate = calculateEndDate(contract.commencementDate, leaseTermYears);

      return {
        contractId: contract.contractId || 'N/A',
        assetDescription: contract.assetDescription || 'N/A',
        commencementDate: formatDate(contract.commencementDate),
        endDate: endDate,
        leaseTermYears: leaseTermYears,
        initialDirectCost: contract.data.InitialDirectCosts || 0,
        initialLiability: calculations?.initialLiability || 0,
        initialROU: calculations?.initialROU || 0,
        totalInterest: calculations?.totalInterest || 0,
        totalDepreciation: calculations?.totalDepreciation || 0
      };
    });
  };

  const exportToExcel = () => {
    const data = prepareContractData();

    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'Contract ID': item.contractId,
      'Asset Description': item.assetDescription,
      'Commencement Date': item.commencementDate,
      'End Date': item.endDate,
      'Lease Term (Years)': item.leaseTermYears,
      'Initial Direct Cost': item.initialDirectCost,
      'Initial Liability': item.initialLiability,
      'Initial ROU': item.initialROU,
      'Total Interest': item.totalInterest,
      'Total Depreciation': item.totalDepreciation
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');

    XLSX.writeFile(workbook, `IFRS16_Contracts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const data = prepareContractData();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(16);
    doc.text('IFRS 16 Lease Contracts Summary', 14, 15);

    doc.setFontSize(10);
    const now = new Date();
    const dateTime = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`;
    doc.text(`Generated: ${dateTime}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [[
        'Contract ID',
        'Asset Description',
        'Commencement Date',
        'End Date',
        'Lease Term (Years)',
        'Initial Direct Cost',
        'Initial Liability',
        'Initial ROU',
        'Total Interest',
        'Total Depreciation'
      ]],
      body: data.map(item => [
        item.contractId,
        item.assetDescription,
        item.commencementDate,
        item.endDate,
        item.leaseTermYears,
        item.initialDirectCost.toLocaleString(),
        item.initialLiability.toLocaleString(),
        item.initialROU.toLocaleString(),
        item.totalInterest.toLocaleString(),
        item.totalDepreciation.toLocaleString()
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74], textColor: 255 }
    });

    doc.save(`IFRS16_Contracts_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch =
        contract.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.lesseeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.assetDescription.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMode = filterMode === 'ALL' || contract.mode === filterMode;
      const matchesStatus = filterStatus === 'ALL' || contract.status === filterStatus;

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [contracts, searchTerm, filterMode, filterStatus]);

  if (contracts.length === 0) {
    return (
      <div className="bg-amber-50 dark:bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-300 dark:border-amber-400/30 p-6 flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          <FileText className="w-6 h-6 text-amber-600 dark:text-amber-300" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-lg">No Contracts Available</h4>
          <p className="text-amber-700 dark:text-amber-200 mt-1">
            Please create or import contracts first from the Contract Initiation page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Select a Contract for Calculation</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose a contract to perform IFRS 16 calculations and generate amortization schedules
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
            title="Export all contracts to Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
            title="Export all contracts to PDF"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by contract ID, lessee, or asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as any)}
          className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="ALL">All Modes</option>
          <option value="MINIMAL">Minimal</option>
          <option value="FULL">Full</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="ALL">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredContracts.length} of {contracts.length} contracts
      </div>

      {/* Table View */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Contract ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Lessee</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Asset</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Commencement</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Mode</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                {showCalculateButton && (
                  <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredContracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => onSelect(contract)}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{contract.contractId}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{contract.lesseeName}</td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={contract.assetDescription}>
                    {contract.assetDescription}
                  </td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{formatDate(contract.commencementDate)}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      contract.mode === 'FULL'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300'
                    }`}>
                      {contract.mode}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      contract.status === 'approved'
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  {showCalculateButton && (
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onSelect(contract)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Calculate
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContracts.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No contracts match your filters</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
