import React, { useMemo, useState } from 'react';
import { useLeaseContext } from '../context/LeaseContext';
import { calculateIFRS16 } from '../utils/ifrs16Calculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FileText,
  Calculator,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Activity,
  Building,
  Car,
  Wrench,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export function Dashboard() {
  const { state } = useLeaseContext();
  const { savedContracts } = state;
  const [journalYear, setJournalYear] = useState<string>('all');
  const [journalContract, setJournalContract] = useState<string>('all');
  const [journalAccount, setJournalAccount] = useState<string>('all');

  const getFilteredJournal = (journal: any[]) => journal.filter(e =>
    (journalYear === 'all' || new Date(e.date).getFullYear() === parseInt(journalYear)) &&
    (journalContract === 'all' || e.contractId === journalContract) &&
    (journalAccount === 'all' || e.account === journalAccount)
  );

  const exportJournalPDF = () => {
    const filtered = getFilteredJournal(consolidatedJournal);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.text('Consolidated Journal Entries', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}`, 14, 22);
    if (journalYear !== 'all') doc.text(`Year: ${journalYear}`, 14, 28);

    autoTable(doc, {
      startY: journalYear !== 'all' ? 34 : 28,
      head: [['Date', 'Contract ID', 'Account', 'Debit (NGN)', 'Credit (NGN)', 'Memo']],
      body: filtered.map(e => [
        e.date,
        e.contractId,
        e.account,
        e.dr > 0 ? e.dr.toLocaleString() : '',
        e.cr > 0 ? e.cr.toLocaleString() : '',
        e.memo
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
    });

    doc.save(`Consolidated_Journal_${journalYear !== 'all' ? journalYear : 'All'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportJournalExcel = () => {
    const filtered = getFilteredJournal(consolidatedJournal);
    const rows = filtered.map(e => ({
      'Date': e.date,
      'Contract ID': e.contractId,
      'Account': e.account,
      'Debit': e.dr > 0 ? e.dr : '',
      'Credit': e.cr > 0 ? e.cr : '',
      'Memo': e.memo
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidated Journal');
    XLSX.writeFile(wb, `Consolidated_Journal_${journalYear !== 'all' ? journalYear : 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Calculate aggregated totals from all saved contracts
  const aggregatedData = useMemo(() => {
    let totalROU = 0;
    let totalLiability = 0;
    let totalInterest = 0;
    let totalDepreciation = 0;
    let totalLeaseTermYears = 0;
    let totalMonthlyInterest = 0;
    let totalMonthlyDepreciation = 0;
    const validContracts = [];

    for (const contract of savedContracts) {
      const data = contract.data;

      // Check if contract has required data
      const hasRequiredData = !!(
        data.ContractID &&
        data.CommencementDate &&
        data.NonCancellableYears &&
        data.FixedPaymentPerPeriod &&
        data.IBR_Annual
      );

      if (hasRequiredData) {
        try {
          const results = calculateIFRS16(data);
          const contractMonths = (results.leaseTermYears || 1) * 12;
          totalROU += results.initialROU;
          totalLiability += results.initialLiability;
          totalInterest += results.totalInterest;
          totalDepreciation += results.totalDepreciation;
          totalLeaseTermYears += results.leaseTermYears;
          totalMonthlyInterest += results.totalInterest / contractMonths;
          totalMonthlyDepreciation += results.totalDepreciation / contractMonths;
          validContracts.push({ contract, results });
        } catch (error) {
          console.error(`Failed to calculate for contract ${data.ContractID}:`, error);
        }
      }
    }

    const avgLeaseTermYears = validContracts.length > 0 ? totalLeaseTermYears / validContracts.length : 0;

    return {
      totalROU,
      totalLiability,
      totalInterest,
      totalDepreciation,
      avgLeaseTermYears,
      totalMonthlyInterest,
      totalMonthlyDepreciation,
      validContracts,
      totalContracts: savedContracts.length
    };
  }, [savedContracts]);

  // Consolidated journal entries from all contracts
  const consolidatedJournal = useMemo(() => {
    const entries: any[] = [];
    for (const { contract, results } of aggregatedData.validContracts) {
      results.journalEntries.forEach((entry: any) => {
        entries.push({ ...entry, contractId: contract.data.ContractID || contract.contractId });
      });
    }
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [aggregatedData.validContracts]);

  const CLASS_COLORS: Record<string, string> = {
    'Land':         'bg-emerald-500',
    'Buildings':    'bg-blue-500',
    'Machinery':    'bg-orange-500',
    'Vehicles':     'bg-purple-500',
    'Equipment':    'bg-cyan-500',
    'IT Hardware':  'bg-pink-500',
    'Other':        'bg-slate-400',
  };

  const portfolioData = useMemo(() => {
    const grouped: Record<string, { contracts: number; liability: number }> = {};
    let totalLiability = 0;

    for (const { contract, results } of aggregatedData.validContracts) {
      const cls = contract.data.AssetClass || 'Other';
      if (!grouped[cls]) grouped[cls] = { contracts: 0, liability: 0 };
      grouped[cls].contracts += 1;
      grouped[cls].liability += results.initialLiability;
      totalLiability += results.initialLiability;
    }

    return Object.entries(grouped)
      .map(([category, { contracts, liability }]) => ({
        category,
        contracts,
        value: liability,
        percentage: totalLiability > 0 ? Math.round((liability / totalLiability) * 1000) / 10 : 0,
        color: CLASS_COLORS[category] || 'bg-slate-400',
      }))
      .sort((a, b) => b.value - a.value);
  }, [aggregatedData.validContracts]);

  const yearlyTrends = useMemo(() => {
    const yearMap: Record<number, { liability: number; asset: number; depreciation: number }> = {};

    for (const { contract, results } of aggregatedData.validContracts) {
      const d = contract.data;
      const commenceDate = d.CommencementDate;
      if (!commenceDate) continue;

      const frequency = d.PaymentFrequency || 'Monthly';
      const periodsPerYear = { Monthly: 12, Quarterly: 4, Semiannual: 2, Annual: 1 }[frequency] || 12;
      const monthsPerPeriod = Math.round(12 / periodsPerYear);
      const schedule = results.amortizationSchedule;
      const depPerPeriod = schedule.length > 0 ? results.totalDepreciation / schedule.length : 0;

      // Group periods by year
      const periodsByYear: Record<number, typeof schedule> = {};
      for (const period of schedule) {
        const d2 = new Date(commenceDate);
        d2.setMonth(d2.getMonth() + period.month * monthsPerPeriod);
        const yr = d2.getFullYear();
        if (!periodsByYear[yr]) periodsByYear[yr] = [];
        periodsByYear[yr].push(period);
      }

      for (const [yrStr, periods] of Object.entries(periodsByYear)) {
        const yr = parseInt(yrStr);
        if (!yearMap[yr]) yearMap[yr] = { liability: 0, asset: 0, depreciation: 0 };
        const lastPeriod = periods[periods.length - 1];
        yearMap[yr].liability += lastPeriod.remainingLiability;
        yearMap[yr].asset += lastPeriod.remainingAsset;
        yearMap[yr].depreciation += periods.length * depPerPeriod;
      }
    }

    return Object.entries(yearMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, vals]) => ({
        year,
        liability: Math.round(vals.liability * 100) / 100,
        asset: Math.round(vals.asset * 100) / 100,
        depreciation: Math.round(vals.depreciation * 100) / 100,
      }));
  }, [aggregatedData.validContracts]);

  const upcomingMaturities = useMemo(() => {
    const today = new Date();
    const PERIODS_PER_YEAR: Record<string, number> = { Monthly: 12, Quarterly: 4, Semiannual: 2, Annual: 1 };

    return aggregatedData.validContracts
      .map(({ contract, results }) => {
        const d = contract.data;
        const commence = new Date(d.CommencementDate!);
        const termMonths = Math.round((d.NonCancellableYears || 0) * 12);
        const endDate = new Date(commence);
        endDate.setMonth(endDate.getMonth() + termMonths);
        const daysToMaturity = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Estimate current outstanding liability based on elapsed periods
        const monthsPerPeriod = Math.round(12 / (PERIODS_PER_YEAR[d.PaymentFrequency || 'Monthly'] || 12));
        const monthsElapsed = (today.getFullYear() - commence.getFullYear()) * 12 + (today.getMonth() - commence.getMonth());
        const periodsElapsed = Math.floor(monthsElapsed / monthsPerPeriod);
        const schedule = results.amortizationSchedule;
        const idx = Math.min(Math.max(periodsElapsed, 0), schedule.length - 1);
        const currentLiability = schedule[idx]?.remainingLiability ?? results.initialLiability;

        const status = daysToMaturity <= 90 ? 'Urgent' : daysToMaturity <= 365 ? 'Soon' : 'Active';

        return {
          contractId: d.ContractID || contract.contractId,
          assetClass: d.AssetClass || 'Other',
          maturityDate: endDate.toISOString().split('T')[0],
          currentLiability,
          daysToMaturity,
          status,
        };
      })
      .sort((a, b) => a.daysToMaturity - b.daysToMaturity);
  }, [aggregatedData.validContracts]);

  const dataCompleteness = useMemo(() => {
    if (savedContracts.length === 0) return 0;
    const complete = savedContracts.filter(c => {
      const d = c.data;
      return !!(d.ContractID && d.CommencementDate && d.NonCancellableYears && d.FixedPaymentPerPeriod && d.IBR_Annual && d.AssetClass && d.PaymentFrequency);
    }).length;
    return Math.round((complete / savedContracts.length) * 100);
  }, [savedContracts]);

  const exportDashboardPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const today = new Date().toLocaleDateString('en-GB');
    const time = new Date().toLocaleTimeString('en-GB');
    const pageW = doc.internal.pageSize.getWidth();

    const addHeader = (title: string) => {
      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, pageW, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('IFRS 16 Lease Engine — Dashboard Report', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${today} ${time}`, pageW - 14, 13, { align: 'right' });
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, 30);
      doc.setFont('helvetica', 'normal');
    };

    // ── PAGE 1: Portfolio Summary ──────────────────────────────────────
    addHeader('Portfolio Summary');

    // KPI grid
    const kpis = [
      { label: 'Total ROU Assets',        value: pdfFmt(aggregatedData.totalROU) },
      { label: 'Total Lease Liabilities', value: pdfFmt(aggregatedData.totalLiability) },
      { label: 'Total Interest Cost',     value: pdfFmt(aggregatedData.totalInterest) },
      { label: 'Avg Monthly Depreciation',value: pdfFmt(aggregatedData.totalMonthlyDepreciation) },
      { label: 'Avg Monthly Interest',    value: pdfFmt(aggregatedData.totalMonthlyInterest) },
      { label: 'Total Contracts',         value: String(aggregatedData.totalContracts) },
      { label: 'Contracts Calculated',    value: String(aggregatedData.validContracts.length) },
      { label: 'Avg Lease Term',          value: `${aggregatedData.avgLeaseTermYears.toFixed(1)} yrs` },
    ];

    const colW = (pageW - 28) / 4;
    kpis.forEach((k, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 14 + col * colW;
      const y = 36 + row * 22;
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, y, colW - 4, 18, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(k.label, x + 4, y + 6);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text(k.value, x + 4, y + 13);
      doc.setFont('helvetica', 'normal');
    });

    // Portfolio composition table
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('Portfolio Composition by Asset Class', 14, 84);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: 88,
      head: [['Asset Class', 'Contracts', 'Initial Liability', '% of Portfolio']],
      body: portfolioData.map(p => [
        p.category,
        p.contracts,
        pdfFmt(p.value),
        `${p.percentage}%`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    // ── PAGE 2: Yearly Summary ─────────────────────────────────────────
    doc.addPage();
    addHeader('Yearly Summary — Closing Balances Across All Contracts');

    autoTable(doc, {
      startY: 36,
      head: [['Year', 'Closing Lease Liability', 'Closing ROU Asset', 'Depreciation for Year']],
      body: yearlyTrends.slice(0, 15).map(t => [
        t.year,
        pdfFmt(t.liability),
        pdfFmt(t.asset),
        pdfFmt(t.depreciation),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });

    // ── PAGE 3: Contract Maturities ────────────────────────────────────
    doc.addPage();
    addHeader('Contract Maturities');

    autoTable(doc, {
      startY: 36,
      head: [['Contract ID', 'Asset Class', 'End Date', 'Current Liability', 'Days to Maturity', 'Status']],
      body: upcomingMaturities.map(m => [
        m.contractId,
        m.assetClass,
        m.maturityDate,
        pdfFmt(m.currentLiability),
        m.daysToMaturity > 0 ? `${m.daysToMaturity.toLocaleString()} days` : `${Math.abs(m.daysToMaturity).toLocaleString()} days overdue`,
        m.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 118, 110], textColor: 255 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'center' },
      },
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.section === 'body') {
          const status = data.cell.raw as string;
          if (status === 'Urgent') doc.setTextColor(239, 68, 68);
          else if (status === 'Soon') doc.setTextColor(245, 158, 11);
          else doc.setTextColor(34, 197, 94);
        }
      },
    });

    doc.save(`Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportDashboardExcel = () => {
    const wb = XLSX.utils.book_new();
    const today = new Date().toLocaleDateString('en-GB');

    // Sheet 1: Portfolio Summary
    const summaryRows = [
      ['IFRS 16 Dashboard Report', '', `Generated: ${today}`],
      [],
      ['PORTFOLIO SUMMARY'],
      ['Metric', 'Value'],
      ['Total ROU Assets', aggregatedData.totalROU],
      ['Total Lease Liabilities', aggregatedData.totalLiability],
      ['Total Interest Cost', aggregatedData.totalInterest],
      ['Avg Monthly Depreciation', aggregatedData.totalMonthlyDepreciation],
      ['Avg Monthly Interest', aggregatedData.totalMonthlyInterest],
      ['Total Contracts', aggregatedData.totalContracts],
      ['Contracts Calculated', aggregatedData.validContracts.length],
      ['Average Lease Term (yrs)', parseFloat(aggregatedData.avgLeaseTermYears.toFixed(2))],
      [],
      ['PORTFOLIO BY ASSET CLASS'],
      ['Asset Class', 'Contracts', 'Initial Liability (₦)', '% of Portfolio'],
      ...portfolioData.map(p => [p.category, p.contracts, p.value, p.percentage / 100]),
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Yearly Summary
    const wsYearly = XLSX.utils.json_to_sheet(
      yearlyTrends.slice(0, 15).map(t => ({
        'Year': t.year,
        'Closing Lease Liability (₦)': t.liability,
        'Closing ROU Asset (₦)': t.asset,
        'Depreciation for Year (₦)': t.depreciation,
      }))
    );
    wsYearly['!cols'] = [{ wch: 10 }, { wch: 28 }, { wch: 24 }, { wch: 26 }];
    XLSX.utils.book_append_sheet(wb, wsYearly, 'Yearly Summary');

    // Sheet 3: Contract Maturities
    const wsMaturities = XLSX.utils.json_to_sheet(
      upcomingMaturities.map(m => ({
        'Contract ID': m.contractId,
        'Asset Class': m.assetClass,
        'End Date': m.maturityDate,
        'Current Liability (₦)': m.currentLiability,
        'Days to Maturity': m.daysToMaturity,
        'Status': m.status,
      }))
    );
    wsMaturities['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsMaturities, 'Contract Maturities');

    // Sheet 4: Consolidated Journal
    const wsJournal = XLSX.utils.json_to_sheet(
      consolidatedJournal.map(e => ({
        'Date': e.date,
        'Contract ID': e.contractId,
        'Account': e.account,
        'Debit (₦)': e.dr > 0 ? e.dr : '',
        'Credit (₦)': e.cr > 0 ? e.cr : '',
        'Memo': e.memo,
      }))
    );
    wsJournal['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsJournal, 'Journal Entries');

    XLSX.writeFile(wb, `Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const fmt = (value: number) => {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`;
    return `₦${Math.round(value).toLocaleString()}`;
  };

  // PDF-safe formatter — jsPDF built-in fonts don't support ₦
  const pdfFmt = (value: number) => fmt(value).replace(/₦/g, 'NGN ');

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 flex items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">Overview of your IFRS 16 lease portfolio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportDashboardExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={exportDashboardPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total ROU Assets */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total ROU Assets</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-500">
            {aggregatedData.totalROU > 0 ? fmt(aggregatedData.totalROU) : '₦0'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{aggregatedData.validContracts.length} calculated</p>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Liabilities</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-500">
            {aggregatedData.totalLiability > 0 ? fmt(aggregatedData.totalLiability) : '₦0'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{aggregatedData.validContracts.length} calculated</p>
        </div>

        {/* Monthly Depreciation */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Depreciation</span>
            <Activity className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-500">
            {aggregatedData.totalMonthlyDepreciation > 0 ? fmt(aggregatedData.totalMonthlyDepreciation) : '₦0'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Total per month across portfolio</p>
        </div>

        {/* Monthly Interest */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Monthly Interest</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500">
            {aggregatedData.totalMonthlyInterest > 0 ? fmt(aggregatedData.totalMonthlyInterest) : '₦0'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Total per month across portfolio</p>
        </div>

        {/* Active Contracts */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Total Contracts</span>
            <FileText className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-500">
            {aggregatedData.totalContracts}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{aggregatedData.validContracts.length} with calculations</p>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Expiring Soon</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {aggregatedData.validContracts.filter(vc => {
              const endDate = new Date(vc.contract.data.EndDateOriginal || '');
              const monthsToExpiry = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
              return monthsToExpiry <= 6 && monthsToExpiry > 0;
            }).length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Next 6 months</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Composition */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Portfolio Composition</h3>
            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>

          <div className="space-y-4">
            {portfolioData.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No contract data available</p>
            ) : portfolioData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmt(item.value)}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">({item.contracts} contracts)</div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">{item.percentage}% of total portfolio</div>
              </div>
            ))}
          </div>
        </div>

        {/* Yearly Summary Table */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Yearly Summary</h3>
            <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Closing balances per year across all contracts</p>

          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-[660px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
                  <tr className="border-b border-slate-300 dark:border-slate-700">
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Year</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Closing Liability</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Closing ROU Asset</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">Depreciation for Year</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyTrends.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No data available</td>
                    </tr>
                  ) : (
                    yearlyTrends.slice(0, 15).map((trend, index) => (
                      <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="py-3 px-2 text-sm text-slate-700 dark:text-slate-300">{trend.year}</td>
                        <td className="py-3 px-2 text-sm text-blue-600 dark:text-blue-400 text-right font-medium">₦{(trend.liability / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M</td>
                        <td className="py-3 px-2 text-sm text-green-600 dark:text-green-400 text-right font-medium">₦{(trend.asset / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M</td>
                        <td className="py-3 px-2 text-sm text-orange-600 dark:text-orange-400 text-right font-medium">₦{(trend.depreciation / 1_000_000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Expiring Within 12 Months */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Expiring Within 12 Months</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {upcomingMaturities.filter(m => m.daysToMaturity > 0 && m.daysToMaturity <= 365).length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">contracts reaching end of term</div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {upcomingMaturities.filter(m => m.daysToMaturity > 0 && m.daysToMaturity <= 90).length} urgent (≤90 days)
              </span>
            </div>
          </div>
        </div>

        {/* Total Interest Cost */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Total Interest Cost</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {aggregatedData.totalInterest > 0 ? fmt(aggregatedData.totalInterest) : '₦0'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">over full lease term</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">across {aggregatedData.validContracts.length} contracts</span>
            </div>
          </div>
        </div>

        {/* Data Completeness */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Data Completeness</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dataCompleteness}%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${dataCompleteness}%` }}></div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">contracts with all required fields</div>
          </div>
        </div>

        {/* Average Lease Term */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Average Lease Term</h4>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {aggregatedData.avgLeaseTermYears > 0 ? `${aggregatedData.avgLeaseTermYears.toFixed(1)} yrs` : '—'}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">across portfolio</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{aggregatedData.validContracts.length} contracts calculated</span>
            </div>
          </div>
        </div>
      </div>


      {/* Upcoming Contract Maturities */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contract Maturities</h3>
          <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-300 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">CONTRACT ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">ASSET CLASS</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">END DATE</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">CURRENT LIABILITY</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">DAYS TO MATURITY</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {upcomingMaturities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No contracts available</td>
                </tr>
              ) : upcomingMaturities.map((item, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-4 px-4 text-sm text-slate-800 dark:text-slate-200 font-medium">{item.contractId}</td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{item.assetClass}</td>
                  <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{item.maturityDate}</td>
                  <td className="py-4 px-4 text-sm text-slate-800 dark:text-slate-200 text-right font-medium">
                    ₦{item.currentLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-4 px-4 text-sm text-right">
                    {item.daysToMaturity > 0
                      ? <span className="text-slate-600 dark:text-slate-400">{item.daysToMaturity.toLocaleString()} days</span>
                      : <span className="text-red-500">{Math.abs(item.daysToMaturity).toLocaleString()} days overdue</span>
                    }
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'Urgent'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : item.status === 'Soon'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consolidated Journal */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Consolidated Journal</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All journal entries across your lease portfolio</p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Year filter */}
              <select
                value={journalYear}
                onChange={e => setJournalYear(e.target.value)}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {[...new Set(consolidatedJournal.map(e => new Date(e.date).getFullYear()))].sort().map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {/* Contract filter */}
              <select
                value={journalContract}
                onChange={e => setJournalContract(e.target.value)}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Contracts</option>
                {[...new Set(consolidatedJournal.map(e => e.contractId))].sort().map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>

              {/* Account filter */}
              <select
                value={journalAccount}
                onChange={e => setJournalAccount(e.target.value)}
                className="text-sm border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Accounts</option>
                {[...new Set(consolidatedJournal.map(e => e.account))].sort().map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>

              {/* Export buttons */}
              <button
                onClick={exportJournalExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={exportJournalPDF}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {consolidatedJournal.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No journal entries available</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Contracts need commencement date, lease term, payment, and IBR to generate entries</p>
          </div>
        ) : (() => {
          const filtered = getFilteredJournal(consolidatedJournal);

          return (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
                  <thead className="bg-slate-50 dark:bg-slate-700/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Contract ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Account</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Debit</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Credit</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                    {filtered.map((entry, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50 dark:bg-slate-700/10'} hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors`}>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-200 font-medium whitespace-nowrap">{entry.date}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            {entry.contractId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{entry.account}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                          {entry.dr > 0 ? `₦${entry.dr.toLocaleString()}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                          {entry.cr > 0 ? `₦${entry.cr.toLocaleString()}` : ''}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{entry.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                Showing {filtered.length} of {consolidatedJournal.length} total entries across {aggregatedData.validContracts.length} contracts
              </div>
            </>
          );
        })()}
      </div>

      </div>
  );
}