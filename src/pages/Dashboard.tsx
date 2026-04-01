import { useMemo, useState, useEffect } from 'react';
import { useToast } from '../components/UI/ToastContext';
import { useLeaseContext } from '../context/LeaseContext';
import { calculateIFRS16 } from '../utils/ifrs16Calculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Activity,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';

export function Dashboard() {
  const { state } = useLeaseContext();
  const { savedContracts } = state;
  const toast = useToast();
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
    toast.success('PDF exported', 'Consolidated journal downloaded successfully.');
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
    toast.success('Excel exported', 'Consolidated journal downloaded successfully.');
  };

  const emptyAggregated = {
    totalROU: 0, totalLiability: 0, totalInterest: 0, totalDepreciation: 0,
    avgLeaseTermYears: 0, totalMonthlyInterest: 0, totalMonthlyDepreciation: 0,
    validContracts: [] as { contract: any; results: any }[],
    totalContracts: 0,
  };

  const [aggregatedData, setAggregatedData] = useState(emptyAggregated);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      let totalROU = 0, totalLiability = 0, totalInterest = 0;
      let totalDepreciation = 0, totalLeaseTermYears = 0;
      let totalMonthlyInterest = 0, totalMonthlyDepreciation = 0;
      const validContracts: { contract: any; results: any }[] = [];

      for (const contract of savedContracts) {
        const data = contract.data;
        const hasRequiredData = !!(
          data.ContractID && data.CommencementDate &&
          data.NonCancellableYears && data.FixedPaymentPerPeriod && data.IBR_Annual
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
      setAggregatedData({
        totalROU, totalLiability, totalInterest, totalDepreciation,
        avgLeaseTermYears, totalMonthlyInterest, totalMonthlyDepreciation,
        validContracts, totalContracts: savedContracts.length,
      });
      setIsCalculating(false);
    }, 0);

    return () => clearTimeout(timer);
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

  const CLASS_HEX: Record<string, string> = {
    'Land':         '#10b981',
    'Buildings':    '#3b82f6',
    'Machinery':    '#f97316',
    'Vehicles':     '#a855f7',
    'Equipment':    '#06b6d4',
    'IT Hardware':  '#ec4899',
    'Other':        '#94a3b8',
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
        hex: CLASS_HEX[category] || '#94a3b8',
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
      const freqMap: Record<string, number> = { Monthly: 12, Quarterly: 4, Semiannual: 2, Annual: 1 };
      const periodsPerYear = freqMap[frequency] || 12;
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
        const totalYears = (Number(d.NonCancellableYears) || 0)
          + (Number(d.RenewalYears) || 0)
          - (Number(d.TerminationYears) || 0);
        const termMonths = Math.round(totalYears * 12);
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
    toast.success('PDF exported', 'Dashboard report downloaded successfully.');
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
    toast.success('Excel exported', 'Dashboard report downloaded successfully.');
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Portfolio Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isCalculating
                ? 'Calculating portfolio data…'
                : `IFRS 16 lease portfolio · As at ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
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

      {/* Empty state when no contracts exist */}
      {savedContracts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-slate-800/50 rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-5">
            <BarChart3 className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Your portfolio is empty</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm">
            Add your first lease contract to start seeing portfolio metrics, trends, and IFRS 16 calculations here.
          </p>
          <a
            href="#/contract"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold shadow-md"
          >
            <FileText className="w-4 h-4" />
            Add your first contract
          </a>
        </div>
      )}

      {savedContracts.length > 0 && <>

      {/* Skeleton loading state */}
      {isCalculating && (
        <div className="space-y-6 animate-pulse">
          {/* Skeleton section label */}
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          {/* Skeleton KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
                <div className="h-1 bg-slate-200 dark:bg-slate-700"></div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                  </div>
                  <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-2.5 w-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton section label */}
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          {/* Skeleton 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl space-y-4">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isCalculating && <>

      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Balance Sheet Snapshot</span>
      </div>

      {/* KPI Cards — 6 in one row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total ROU Assets */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-green-500"></div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">Total ROU Assets</span>
              <div className="w-6 h-6 bg-green-50 dark:bg-green-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-green-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {aggregatedData.totalROU > 0 ? fmt(aggregatedData.totalROU) : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">{aggregatedData.validContracts.length} contracts</p>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-blue-500"></div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">Lease Liability</span>
              <div className="w-6 h-6 bg-blue-50 dark:bg-blue-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3 h-3 text-blue-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {aggregatedData.totalLiability > 0 ? fmt(aggregatedData.totalLiability) : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">{aggregatedData.validContracts.length} contracts</p>
          </div>
        </div>

        {/* Total Interest Cost */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-red-500"></div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">Total Interest</span>
              <div className="w-6 h-6 bg-red-50 dark:bg-red-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-3 h-3 text-red-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {aggregatedData.totalInterest > 0 ? fmt(aggregatedData.totalInterest) : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">Over full term</p>
          </div>
        </div>

        {/* Monthly Depreciation */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-orange-500"></div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">Monthly Depn.</span>
              <div className="w-6 h-6 bg-orange-50 dark:bg-orange-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Activity className="w-3 h-3 text-orange-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {aggregatedData.totalMonthlyDepreciation > 0 ? fmt(aggregatedData.totalMonthlyDepreciation) : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">Per month</p>
          </div>
        </div>

        {/* Monthly Interest */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-purple-500"></div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">Monthly Interest</span>
              <div className="w-6 h-6 bg-purple-50 dark:bg-purple-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3 h-3 text-purple-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {aggregatedData.totalMonthlyInterest > 0 ? fmt(aggregatedData.totalMonthlyInterest) : '—'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">Per month</p>
          </div>
        </div>

        {/* Contracts */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-amber-500"></div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">Total Contracts</span>
              <div className="w-6 h-6 bg-amber-50 dark:bg-amber-500/10 rounded-md flex items-center justify-center flex-shrink-0">
                <FileText className="w-3 h-3 text-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {aggregatedData.totalContracts}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {upcomingMaturities.filter(m => m.daysToMaturity > 0 && m.daysToMaturity <= 180).length} expiring in 6 months
            </p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Portfolio Breakdown</span>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Composition — Donut chart */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Portfolio Composition</h3>
            <BarChart3 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>

          {portfolioData.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No contract data available</p>
          ) : (
            <div className="flex items-center gap-4">
              {/* Donut */}
              <div className="flex-shrink-0 ml-14">
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={78}
                      outerRadius={126}
                      strokeWidth={2}
                      stroke="transparent"
                    >
                      {portfolioData.map((item, i) => (
                        <Cell key={i} fill={item.hex} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(value, name) => [fmt(Number(value)), name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2.5 min-w-0">
                {portfolioData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.hex }} />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.category}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-semibold" style={{ color: item.hex }}>{fmt(item.value)}</div>
                      <div className="text-xs" style={{ color: item.hex }}>{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Yearly Summary Table */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Yearly Summary</h3>
            <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Closing balances per year across all contracts</p>

          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-[264px]">
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

      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-violet-500 rounded-full"></div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Liability & Asset Movement</span>
      </div>

      {/* Bar chart — Liability and ROU by year */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Annual Balance Movement</h3>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500"></span>Lease Liability</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span>ROU Asset</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-orange-400"></span>Depreciation</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Closing balances per year across all contracts (NGN M)</p>

        {yearlyTrends.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No trend data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={yearlyTrends.map(t => ({
                year: t.year,
                'Liability': +(t.liability / 1_000_000).toFixed(2),
                'ROU Asset': +(t.asset / 1_000_000).toFixed(2),
                'Depreciation': +(t.depreciation / 1_000_000).toFixed(2),
              }))}
              margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
            >
              <defs>
                <linearGradient id="gradLiability" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradROU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} width={52} />
              <ReTooltip
                formatter={(value, name) => [`NGN ${Number(value).toLocaleString()}M`, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff' }}
                labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}
              />
              <Area type="monotone" dataKey="Liability" stroke="#3b82f6" strokeWidth={2} fill="url(#gradLiability)" dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="ROU Asset" stroke="#10b981" strokeWidth={2} fill="url(#gradROU)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="Depreciation" stroke="#fb923c" strokeWidth={2} fill="url(#gradDep)" dot={{ r: 3, fill: '#fb923c' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Portfolio Health</span>
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


      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-slate-400 rounded-full"></div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Contract Maturities</span>
      </div>

      {/* Upcoming Contract Maturities */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Contract Maturities</h3>
          <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <div className="overflow-y-auto max-h-[440px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
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
                <div className="overflow-y-auto max-h-[440px]">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
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
              </div>
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                Showing {filtered.length} of {consolidatedJournal.length} total entries across {aggregatedData.validContracts.length} contracts
              </div>
            </>
          );
        })()}
      </div>

      </>}

      </>}
    </div>
  );
}