import { useState } from 'react';
import { useToast } from '../components/UI/ToastContext';
import { useLeaseContext, SavedContract } from '../context/LeaseContext';
import { FileText, Download, Calendar, DollarSign, BarChart3, AlertCircle, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/UI/Button';
import { ContractSelector } from '../components/Contract/Selectors/ContractSelector';
import { calculateIFRS16 } from '../utils/ifrs16Calculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function DisclosureJournals() {
  const { state, dispatch } = useLeaseContext();
  const { calculations, leaseData } = state;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('journals');
  const [selectedContract, setSelectedContract] = useState<SavedContract | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('Lease liability');
  const [selectedAccountYear, setSelectedAccountYear] = useState<string>('all');

  const hasCalculations = !!calculations;

  const handleSelectContract = (contract: SavedContract) => {
    setSelectedContract(contract);
    dispatch({ type: 'LOAD_CONTRACT', payload: contract.data });
    dispatch({ type: 'SET_MODE', payload: contract.mode });

    // Trigger calculations if not already present
    if (contract.data.ContractID && contract.data.CommencementDate && contract.data.NonCancellableYears && contract.data.FixedPaymentPerPeriod && contract.data.IBR_Annual) {
      const results = calculateIFRS16(contract.data);
      dispatch({ type: 'SET_CALCULATIONS', payload: results });
    }
  };

  const handleBackToSelection = () => {
    setSelectedContract(null);
    dispatch({ type: 'SET_CALCULATIONS', payload: null });
  };

  const tabs = [
    { id: 'journals', name: 'Journal Entries', icon: FileText },
    { id: 'account-statement', name: 'Account Statement', icon: DollarSign },
    { id: 'disclosures', name: 'Key Disclosures', icon: BarChart3 },
    { id: 'maturity', name: 'Maturity Analysis', icon: Calendar },
  ];

  const formatCurrency = (value: number) => {
    return `${leaseData.Currency || 'NGN'} ${value.toLocaleString()}`;
  };

  const generateMaturityAnalysis = () => {
    if (!calculations || !leaseData.CommencementDate) return [];

    const commenceDate = new Date(leaseData.CommencementDate);
    const now = new Date();

    // Group amortization schedule into IFRS 16 maturity buckets based on payment date
    let year1Undiscounted = 0, year1PV = 0;
    let years2to5Undiscounted = 0, years2to5PV = 0;
    let beyond5Undiscounted = 0, beyond5PV = 0;

    calculations.amortizationSchedule.forEach((row: any) => {
      // Derive payment date from period index
      const paymentDate = new Date(commenceDate);
      paymentDate.setMonth(paymentDate.getMonth() + row.month);
      if (paymentDate <= now) return; // skip past periods

      const yearsFromNow = (paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const undiscounted = row.payment || 0;

      if (yearsFromNow <= 1) {
        year1Undiscounted += undiscounted;
        year1PV += row.principal || 0; // only principal reduces the liability
      } else if (yearsFromNow <= 5) {
        years2to5Undiscounted += undiscounted;
        years2to5PV += row.principal || 0;
      } else {
        beyond5Undiscounted += undiscounted;
        beyond5PV += row.principal || 0;
      }
    });

    // Closing liability = remaining principal not yet paid
    const closingLiability = calculations.amortizationSchedule
      .filter((row: any) => {
        const paymentDate = new Date(commenceDate);
        paymentDate.setMonth(paymentDate.getMonth() + row.month);
        return paymentDate > now;
      })
      .reduce((sum: number, row: any) => sum + (row.principal || 0), 0);

    const rows = [
      { period: 'Within 1 year', undiscountedCashflow: year1Undiscounted, presentValue: year1PV },
      { period: '1 – 5 years', undiscountedCashflow: years2to5Undiscounted, presentValue: years2to5PV },
    ];

    if (beyond5Undiscounted > 0) {
      rows.push({ period: 'More than 5 years', undiscountedCashflow: beyond5Undiscounted, presentValue: beyond5PV });
    }

    rows.push({ period: 'Total', undiscountedCashflow: year1Undiscounted + years2to5Undiscounted + beyond5Undiscounted, presentValue: closingLiability });

    return rows;
  };

  const currency = leaseData.Currency || 'NGN';
  const contractId = leaseData.ContractID || 'Contract';
  const today = new Date().toLocaleDateString('en-GB');
  const filename = (label: string, ext: string) =>
    `${contractId}_${label}_${new Date().toISOString().split('T')[0]}.${ext}`;

  const getJournalEntries = () => {
    if (!calculations) return [];
    const all = calculations.journalEntries;
    return selectedYear === 'all' ? all : all.filter(e => new Date(e.date).getFullYear() === parseInt(selectedYear));
  };

  const getAccountRows = () => {
    if (!calculations) return { rows: [], totalDr: 0, totalCr: 0, closing: 0, availableYears: [] };
    const allForAccount = calculations.journalEntries.filter((e: any) => e.account === selectedAccount);
    const availableYears = [...new Set(allForAccount.map((e: any) => new Date(e.date).getFullYear()))].sort() as number[];

    // Build running balance across ALL entries first (balance is cumulative from inception)
    let runningBalance = 0;
    let filteredTotalDr = 0;
    let filteredTotalCr = 0;
    const rows: any[] = [];

    allForAccount.forEach((e: any) => {
      runningBalance = Math.round((runningBalance + e.dr - e.cr) * 100) / 100;
      const entryYear = new Date(e.date).getFullYear();
      if (selectedAccountYear === 'all' || entryYear === parseInt(selectedAccountYear)) {
        filteredTotalDr += e.dr;
        filteredTotalCr += e.cr;
        rows.push({ ...e, balance: runningBalance });
      }
    });

    return { rows, totalDr: filteredTotalDr, totalCr: filteredTotalCr, closing: runningBalance, availableYears };
  };

  const exportAllExcel = () => {
    if (!calculations) return;
    const wb = XLSX.utils.book_new();

    // Sheet 1: Journal Entries (all)
    const journalRows = calculations.journalEntries.map((e: any) => ({
      'Date': e.date,
      'Account': e.account,
      [`Debit (${currency})`]: e.dr > 0 ? e.dr : '',
      [`Credit (${currency})`]: e.cr > 0 ? e.cr : '',
      'Memo': e.memo,
    }));
    const ws1 = XLSX.utils.json_to_sheet(journalRows);
    ws1['!cols'] = [{ wch: 14 }, { wch: 38 }, { wch: 22 }, { wch: 22 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Journal Entries');

    // Sheet 2: Account Statements (all accounts)
    const accounts = ['Lease liability', 'Right-of-use asset', 'Accumulated depreciation - ROU asset', 'Interest expense (lease)', 'Depreciation expense', 'Cash'];
    accounts.forEach(acct => {
      const entries = calculations.journalEntries.filter((e: any) => e.account === acct);
      if (entries.length === 0) return;
      let balance = 0;
      const rows = entries.map((e: any) => {
        balance = Math.round((balance + e.dr - e.cr) * 100) / 100;
        return {
          'Date': e.date,
          'Memo': e.memo,
          [`Debit (${currency})`]: e.dr > 0 ? e.dr : '',
          [`Credit (${currency})`]: e.cr > 0 ? e.cr : '',
          'Running Balance': Math.abs(balance),
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 14 }, { wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, acct.substring(0, 31)); // Excel tab name max 31 chars
    });

    // Sheet 3: Maturity Analysis
    const maturity = generateMaturityAnalysis();
    const ws3 = XLSX.utils.json_to_sheet(maturity.map(r => ({
      'Period': r.period,
      [`Undiscounted Cashflow (${currency})`]: r.undiscountedCashflow,
      [`Present Value (${currency})`]: r.presentValue,
    })));
    XLSX.utils.book_append_sheet(wb, ws3, 'Maturity Analysis');

    // Sheet 4: Amortization Schedule
    const ws4 = XLSX.utils.json_to_sheet(calculations.amortizationSchedule.map((r: any) => ({
      'Period': r.month,
      'Opening Liability': r.openingLiability,
      'Interest': r.interest,
      'Payment': r.payment,
      'Principal': r.principal,
      'Closing Liability': r.remainingLiability,
      'Depreciation': r.depreciation,
      'Closing ROU Asset': r.remainingAsset,
    })));
    XLSX.utils.book_append_sheet(wb, ws4, 'Amortization Schedule');

    XLSX.writeFile(wb, filename('Full_Disclosure', 'xlsx'));
    toast.success('Excel exported', 'Full disclosure package downloaded successfully.');
  };

  const addPdfHeader = (doc: jsPDF, title: string) => {
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IFRS 16 Lease Engine', 14, 9);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${today}`, pageW - 14, 9, { align: 'right' });
    doc.text(title, 14, 16);
    doc.text(`Contract: ${contractId}`, pageW - 14, 16, { align: 'right' });
    doc.setTextColor(30, 41, 59);
  };

  const exportJournalPDF = () => {
    const entries = getJournalEntries();
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    addPdfHeader(doc, `Journal Entries${selectedYear !== 'all' ? ` — ${selectedYear}` : ' — All Years'}`);

    autoTable(doc, {
      startY: 26,
      head: [['Date', 'Account', `Debit (${currency})`, `Credit (${currency})`, 'Memo']],
      body: entries.map(e => [
        e.date,
        e.account,
        e.dr > 0 ? e.dr.toLocaleString() : '',
        e.cr > 0 ? e.cr.toLocaleString() : '',
        e.memo,
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    doc.save(filename(`Journal_${selectedYear !== 'all' ? selectedYear : 'All'}`, 'pdf'));
    toast.success('PDF exported', 'Journal entries downloaded successfully.');
  };

  const exportJournalExcel = () => {
    const entries = getJournalEntries();
    const ws = XLSX.utils.json_to_sheet(entries.map(e => ({
      'Date': e.date,
      'Account': e.account,
      [`Debit (${currency})`]: e.dr > 0 ? e.dr : '',
      [`Credit (${currency})`]: e.cr > 0 ? e.cr : '',
      'Memo': e.memo,
    })));
    ws['!cols'] = [{ wch: 14 }, { wch: 36 }, { wch: 20 }, { wch: 20 }, { wch: 45 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Journal Entries');
    XLSX.writeFile(wb, filename(`Journal_${selectedYear !== 'all' ? selectedYear : 'All'}`, 'xlsx'));
    toast.success('Excel exported', 'Journal entries downloaded successfully.');
  };

  const exportAccountPDF = () => {
    const { rows, totalDr, totalCr, closing } = getAccountRows();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    addPdfHeader(doc, `Account Statement — ${selectedAccount}`);

    // Summary boxes — separate rows so they don't overlap
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Total Debits', 14, 27);
    doc.text('Total Credits', 74, 27);
    doc.text('Closing Balance', 134, 27);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${currency} ${totalDr.toLocaleString()}`, 14, 33);
    doc.text(`${currency} ${totalCr.toLocaleString()}`, 74, 33);
    doc.text(`${currency} ${Math.abs(closing).toLocaleString()}`, 134, 33);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Description', `Debit (${currency})`, `Credit (${currency})`, 'Balance']],
      body: [
        ...rows.map(r => [
          r.date,
          r.memo,
          r.dr > 0 ? r.dr.toLocaleString() : '',
          r.cr > 0 ? r.cr.toLocaleString() : '',
          Math.abs(r.balance).toLocaleString(),
        ]),
        ['', 'TOTAL', totalDr.toLocaleString(), totalCr.toLocaleString(), Math.abs(closing).toLocaleString()],
      ],
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
    });

    doc.save(filename(`AccountStatement_${selectedAccount.replace(/\s+/g, '_')}`, 'pdf'));
    toast.success('PDF exported', 'Account statement downloaded successfully.');
  };

  const exportAccountExcel = () => {
    const { rows, totalDr, totalCr, closing } = getAccountRows();
    const data = [
      { 'Date': 'Contract', 'Description': contractId, [`Debit (${currency})`]: '', [`Credit (${currency})`]: '', 'Balance': '' },
      { 'Date': 'Account', 'Description': selectedAccount, [`Debit (${currency})`]: '', [`Credit (${currency})`]: '', 'Balance': '' },
      { 'Date': 'Generated', 'Description': today, [`Debit (${currency})`]: '', [`Credit (${currency})`]: '', 'Balance': '' },
      {},
      ...rows.map(r => ({
        'Date': r.date,
        'Description': r.memo,
        [`Debit (${currency})`]: r.dr > 0 ? r.dr : '',
        [`Credit (${currency})`]: r.cr > 0 ? r.cr : '',
        'Balance': Math.abs(r.balance),
      })),
      {},
      {
        'Date': '',
        'Description': 'TOTAL',
        [`Debit (${currency})`]: totalDr,
        [`Credit (${currency})`]: totalCr,
        'Balance': Math.abs(closing),
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Account Statement');
    XLSX.writeFile(wb, filename(`AccountStatement_${selectedAccount.replace(/\s+/g, '_')}`, 'xlsx'));
    toast.success('Excel exported', 'Account statement downloaded successfully.');
  };

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 p-6 flex items-center gap-3 shadow-xl">
        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Disclosure & Journal Entries</h1>
          <p className="text-slate-600 dark:text-white/80">IFRS 16 compliant disclosures and accounting entries</p>
        </div>
        {selectedContract && (
          <Button
            variant="outline"
            onClick={handleBackToSelection}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contract Selection
          </Button>
        )}
      </div>

      {/* Contract Selector */}
      {!selectedContract && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 shadow-xl p-6">
          <ContractSelector onSelect={handleSelectContract} showCalculateButton={false} />
        </div>
      )}

      {/* Missing Calculations Warning */}
      {selectedContract && !hasCalculations && (
        <div className="bg-amber-50 dark:bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-300 dark:border-amber-400/30 p-6 flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-lg">No Calculation Data Available</h4>
            <p className="text-amber-700 dark:text-amber-200 mt-1">
              Please complete the lease calculations first to generate journal entries and disclosures.
            </p>
          </div>
        </div>
      )}

      {selectedContract && hasCalculations && (
        <>
          {/* Contract ID Banner + Export All */}
          {leaseData.ContractID && (
            <div className="flex items-center gap-3 px-5 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl">
              <FileText className="w-4 h-4 text-slate-500 dark:text-white/50 flex-shrink-0" />
              <span className="text-sm text-slate-500 dark:text-white/50 font-medium">Contract ID</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{leaseData.ContractID}</span>
              <div className="ml-auto">
                <Button variant="outline" onClick={exportAllExcel} className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4" />
                  Export All (Excel)
                </Button>
              </div>
            </div>
          )}


          {/* Tabs */}
          <div className="border-b border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-t-lg px-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300'
                      : 'border-transparent text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white/90 hover:border-slate-400 dark:hover:border-white/30'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-sm rounded-b-lg border border-slate-300 dark:border-white/10 p-6 shadow-xl">
            {activeTab === 'journals' && (() => {
              const allEntries = calculations.journalEntries;
              const availableYears = [...new Set(allEntries.map(e => new Date(e.date).getFullYear()))].sort();
              const filteredEntries = selectedYear === 'all'
                ? allEntries
                : allEntries.filter(e => new Date(e.date).getFullYear() === parseInt(selectedYear));

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Journal Entries</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="text-sm font-medium text-slate-700 dark:text-white/80">Filter by Year:</label>
                      <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        className="text-sm border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Years ({allEntries.length} entries)</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            {year} ({allEntries.filter(e => new Date(e.date).getFullYear() === year).length} entries)
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={exportJournalExcel}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                      </button>
                      <button
                        onClick={exportJournalPDF}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-lg shadow-xl">
                    <table className="min-w-full divide-y divide-slate-300 dark:divide-white/10">
                      <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600/30 dark:to-purple-600/30 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Account</th>
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Debit</th>
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Credit</th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Memo</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-white/5 divide-y divide-slate-200 dark:divide-white/10">
                        {filteredEntries.map((entry, index) => (
                          <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-white/5' : 'bg-slate-50 dark:bg-white/10'} hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors`}>
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{entry.date}</td>
                            <td className="px-6 py-4 text-sm text-slate-800 dark:text-white/90 font-medium">{entry.account}</td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                              {entry.dr > 0 ? formatCurrency(entry.dr) : ''}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                              {entry.cr > 0 ? formatCurrency(entry.cr) : ''}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-white/80">{entry.memo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Showing {filteredEntries.length} of {allEntries.length} total entries
                  </p>
                </div>
              );
            })()}

            {activeTab === 'account-statement' && (() => {
              const accounts = [
                { key: 'Lease liability', label: 'Lease Liability' },
                { key: 'Right-of-use asset', label: 'ROU Asset' },
                { key: 'Accumulated depreciation - ROU asset', label: 'Accumulated Depreciation' },
                { key: 'Interest expense (lease)', label: 'Interest Expense' },
                { key: 'Depreciation expense', label: 'Depreciation Expense' },
                { key: 'Cash', label: 'Cash' },
                { key: 'Prepaid lease expense', label: 'Prepaid Lease Expense' },
              ];

              const { rows, totalDr, totalCr, closing, availableYears } = getAccountRows();

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Statement</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="text-sm font-medium text-slate-700 dark:text-white/80">Account:</label>
                      <select
                        value={selectedAccount}
                        onChange={e => { setSelectedAccount(e.target.value); setSelectedAccountYear('all'); }}
                        className="text-sm border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {accounts.map(a => (
                          <option key={a.key} value={a.key}>{a.label}</option>
                        ))}
                      </select>
                      <label className="text-sm font-medium text-slate-700 dark:text-white/80">Year:</label>
                      <select
                        value={selectedAccountYear}
                        onChange={e => setSelectedAccountYear(e.target.value)}
                        className="text-sm border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Years</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <button
                        onClick={exportAccountExcel}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                      </button>
                      <button
                        onClick={exportAccountPDF}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-400/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-green-600 dark:text-green-300 font-medium uppercase tracking-wide">Total Debits</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-200 mt-1">{formatCurrency(totalDr)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-red-600 dark:text-red-300 font-medium uppercase tracking-wide">Total Credits</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-200 mt-1">{formatCurrency(totalCr)}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4 text-center">
                      <p className="text-xs text-slate-600 dark:text-white/60 font-medium uppercase tracking-wide">Closing Balance</p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(Math.abs(closing))}</p>
                    </div>
                  </div>

                  {/* Statement Table */}
                  <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-lg shadow-xl">
                    <table className="min-w-full divide-y divide-slate-300 dark:divide-white/10">
                      <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600/30 dark:to-purple-600/30 text-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Description</th>
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Debit</th>
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Credit</th>
                          <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-white/5 divide-y divide-slate-200 dark:divide-white/10">
                        {rows.map((row, index) => (
                          <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-white/5' : 'bg-slate-50 dark:bg-white/10'} hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors`}>
                            <td className="px-6 py-3 text-sm text-slate-900 dark:text-white font-medium">{row.date}</td>
                            <td className="px-6 py-3 text-sm text-slate-700 dark:text-white/80">{row.memo}</td>
                            <td className="px-6 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                              {row.dr > 0 ? formatCurrency(row.dr) : ''}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                              {row.cr > 0 ? formatCurrency(row.cr) : ''}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-slate-900 dark:text-white">
                              {formatCurrency(Math.abs(row.balance))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 dark:bg-white/10">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">Total</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(totalDr)}</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-red-600 dark:text-red-400">{formatCurrency(totalCr)}</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-slate-900 dark:text-white">{formatCurrency(Math.abs(closing))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-white/50">{rows.length} transactions for {selectedAccount}</p>
                </div>
              );
            })()}

            {activeTab === 'disclosures' && (() => {
              const now = new Date();
              const commenceDate = new Date(leaseData.CommencementDate || '');

              // Current portion = principal repayable within next 12 months
              const currentLiability = calculations.amortizationSchedule.reduce((sum: number, row: any) => {
                const pd = new Date(commenceDate);
                pd.setMonth(pd.getMonth() + row.month);
                const yearsFromNow = (pd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                return yearsFromNow > 0 && yearsFromNow <= 1 ? sum + (row.principal || 0) : sum;
              }, 0);

              // Non-current = total remaining liability minus current portion
              const remainingLiability = calculations.amortizationSchedule.reduce((sum: number, row: any) => {
                const pd = new Date(commenceDate);
                pd.setMonth(pd.getMonth() + row.month);
                return pd > now ? sum + (row.principal || 0) : sum;
              }, 0);
              const nonCurrentLiability = Math.max(0, remainingLiability - currentLiability);

              // Accumulated depreciation = depreciation for all periods up to today
              const accumulatedDepreciation = calculations.depreciationSchedule.reduce((sum: number, row: any) => {
                const pd = new Date(commenceDate);
                pd.setMonth(pd.getMonth() + row.month);
                return pd <= now ? sum + (row.depreciation || 0) : sum;
              }, 0);
              const netROU = calculations.initialROU - accumulatedDepreciation;

              // Annual P&L = current year's interest + depreciation
              const currentYear = now.getFullYear();
              const annualInterest = calculations.amortizationSchedule.reduce((sum: number, row: any) => {
                const pd = new Date(commenceDate);
                pd.setMonth(pd.getMonth() + row.month);
                return pd.getFullYear() === currentYear ? sum + (row.interest || 0) : sum;
              }, 0);
              const annualDepreciation = calculations.depreciationSchedule.reduce((sum: number, row: any) => {
                const pd = new Date(commenceDate);
                pd.setMonth(pd.getMonth() + row.month);
                return pd.getFullYear() === currentYear ? sum + (row.depreciation || 0) : sum;
              }, 0);

              return (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Key Disclosure Figures</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Lease Liabilities */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-600/20 backdrop-blur-sm rounded-lg p-6 border border-blue-300 dark:border-blue-400/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-200 dark:bg-blue-500/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <h4 className="font-semibold text-blue-700 dark:text-blue-100">Lease Liabilities</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-200">Current (within 1 year):</span>
                        <span className="font-bold text-blue-800 dark:text-blue-100">{formatCurrency(currentLiability)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-200">Non-current:</span>
                        <span className="font-bold text-blue-800 dark:text-blue-100">{formatCurrency(nonCurrentLiability)}</span>
                      </div>
                      <div className="border-t border-blue-300 dark:border-blue-400/30 pt-2">
                        <div className="flex justify-between">
                          <span className="text-blue-800 dark:text-blue-100 font-medium">Total:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(remainingLiability)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROU Assets */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/20 dark:to-emerald-600/20 backdrop-blur-sm rounded-lg p-6 border border-emerald-300 dark:border-emerald-400/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-emerald-200 dark:bg-emerald-500/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                      </div>
                      <h4 className="font-semibold text-emerald-700 dark:text-emerald-100">ROU Assets</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-emerald-700 dark:text-emerald-200">Gross carrying amount:</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-100">{formatCurrency(calculations.initialROU)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-700 dark:text-emerald-200">Accumulated depreciation:</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-100">{formatCurrency(accumulatedDepreciation)}</span>
                      </div>
                      <div className="border-t border-emerald-300 dark:border-emerald-400/30 pt-2">
                        <div className="flex justify-between">
                          <span className="text-emerald-800 dark:text-emerald-100 font-medium">Net carrying amount:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(Math.max(0, netROU))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* P&L Impact */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-500/20 dark:to-purple-600/20 backdrop-blur-sm rounded-lg p-6 border border-purple-300 dark:border-purple-400/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-purple-200 dark:bg-purple-500/30 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                      </div>
                      <h4 className="font-semibold text-purple-700 dark:text-purple-100">Current Year P&L Impact ({currentYear})</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-purple-700 dark:text-purple-200">Interest expense:</span>
                        <span className="font-bold text-purple-800 dark:text-purple-100">{formatCurrency(annualInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700 dark:text-purple-200">Depreciation expense:</span>
                        <span className="font-bold text-purple-800 dark:text-purple-100">{formatCurrency(annualDepreciation)}</span>
                      </div>
                      <div className="border-t border-purple-300 dark:border-purple-400/30 pt-2">
                        <div className="flex justify-between">
                          <span className="text-purple-800 dark:text-purple-100 font-medium">Total P&L charge:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(annualInterest + annualDepreciation)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Disclosures */}
                <div className="bg-slate-100 dark:bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-slate-300 dark:border-white/10">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Additional Disclosure Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-white/90 mb-2">Lease Terms</h5>
                      <ul className="space-y-1 text-slate-600 dark:text-white/80">
                        <li>• Weighted average lease term: {leaseData.NonCancellableYears || 0} years</li>
                        <li>• Weighted average discount rate: {((leaseData.IBR_Annual || 0) * 100).toFixed(2)}%</li>
                        <li>• Payment frequency: {leaseData.PaymentFrequency || 'Monthly'}</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-slate-800 dark:text-white/90 mb-2">Cash Flow Information</h5>
                      <ul className="space-y-1 text-slate-600 dark:text-white/80">
                        <li>• Total cash payments for leases: {formatCurrency(calculations.cashflowSchedule.reduce((sum, row) => sum + row.rent, 0))}</li>
                        <li>• Cash paid for amounts included in lease liabilities: {formatCurrency(calculations.initialLiability)}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {activeTab === 'maturity' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Lease Liability Maturity Analysis</h3>

                <div className="overflow-x-auto border border-slate-300 dark:border-white/10 rounded-lg shadow-xl">
                  <table className="min-w-full divide-y divide-slate-300 dark:divide-white/10">
                    <thead className="bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-600/30 dark:to-slate-700/30 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Period</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Undiscounted Cashflow</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Present Value</th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-white/5 divide-y divide-slate-200 dark:divide-white/10">
                      {generateMaturityAnalysis().map((row, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-white/5' : 'bg-slate-50 dark:bg-white/10'} ${row.period === 'Total' ? 'bg-slate-200 dark:bg-white/20 font-bold' : ''} hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors`}>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{row.period}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(row.undiscountedCashflow)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(row.presentValue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium text-slate-800 dark:text-white/90">
                            {((row.presentValue / calculations.initialLiability) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-300 dark:border-blue-400/30">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-100 mb-3">Maturity Analysis Notes</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-2">
                    <li>• The maturity analysis shows undiscounted lease payments and their present values</li>
                    <li>• Current portion (Year 1) represents lease liabilities due within 12 months</li>
                    <li>• Non-current portion represents lease liabilities due after 12 months</li>
                    <li>• This analysis is required under IFRS 16 paragraph 58</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}