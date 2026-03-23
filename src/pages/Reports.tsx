import React, { useState, useMemo } from 'react';
import { useLeaseContext } from '../context/LeaseContext';
import { calculateIFRS16 } from '../utils/ifrs16Calculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react';

const ASSET_CLASSES = ['Land', 'Buildings', 'Machinery', 'Vehicles', 'Equipment', 'IT Hardware', 'Other'];

function getPeriodsPerYear(frequency: string): number {
  const map: Record<string, number> = { Monthly: 12, Quarterly: 4, Semiannual: 2, Annual: 1 };
  return map[frequency] || 12;
}

function getPeriodDate(commenceDate: string, periodMonth: number, monthsPerPeriod: number): Date {
  const d = new Date(commenceDate);
  d.setMonth(d.getMonth() + periodMonth * monthsPerPeriod);
  return d;
}

function buildDisclosureData(contracts: any[], year: number) {
  const empty = () => ({
    rouOpening: 0,
    rouLiabilityComponent: 0,
    rouIDC: 0,
    rouPrepayments: 0,
    rouIncentives: 0,
    rouClosing: 0,
    accumDepOpening: 0, accumDepCharge: 0, accumDepClosing: 0,
    liabilityOpening: 0, liabilityAdditions: 0,
    interestExpense: 0, paymentsMade: 0, liabilityClosing: 0,
  });

  const data: Record<string, ReturnType<typeof empty>> = {};
  for (const cls of ASSET_CLASSES) data[cls] = empty();

  for (const contract of contracts) {
    const d = contract.data;
    const cls = d.AssetClass || 'Other';
    if (!data[cls]) continue;

    const hasRequired = d.ContractID && d.CommencementDate && d.NonCancellableYears && d.FixedPaymentPerPeriod && d.IBR_Annual;
    if (!hasRequired) continue;

    try {
      const calc = calculateIFRS16(d);
      const commenceYear = new Date(d.CommencementDate).getFullYear();
      const monthsPerPeriod = Math.round(12 / getPeriodsPerYear(d.PaymentFrequency || 'Monthly'));
      const schedule = calc.amortizationSchedule;

      // Split schedule into periods before / during / after reporting year
      const beforeYear = schedule.filter((p: any) => getPeriodDate(d.CommencementDate, p.month, monthsPerPeriod).getFullYear() < year);
      const inYear = schedule.filter((p: any) => getPeriodDate(d.CommencementDate, p.month, monthsPerPeriod).getFullYear() === year);

      /* ---- ROU Asset ---- */
      const idc        = d.InitialDirectCosts || 0;
      const prepay     = d.PrepaymentsBeforeCommencement || 0;
      const incentives = d.LeaseIncentives || 0;

      if (commenceYear < year) {
        data[cls].rouOpening += calc.initialROU;
        data[cls].rouClosing += calc.initialROU;
      } else if (commenceYear === year) {
        data[cls].rouLiabilityComponent += calc.initialLiability;
        data[cls].rouIDC               += idc;
        data[cls].rouPrepayments       += prepay;
        data[cls].rouIncentives        += incentives;
        data[cls].rouClosing           += calc.initialROU;
      }

      /* ---- Accumulated Depreciation ---- */
      const depPerPeriod = schedule.length > 0 ? calc.totalDepreciation / schedule.length : 0;
      data[cls].accumDepOpening += Math.round(beforeYear.length * depPerPeriod * 100) / 100;
      data[cls].accumDepCharge += Math.round(inYear.length * depPerPeriod * 100) / 100;
      data[cls].accumDepClosing += Math.round((beforeYear.length + inYear.length) * depPerPeriod * 100) / 100;

      /* ---- Lease Liability ---- */
      if (commenceYear < year) {
        // Opening = remaining liability after last period before this year
        const lastBefore = beforeYear[beforeYear.length - 1];
        data[cls].liabilityOpening += lastBefore ? lastBefore.remainingLiability : calc.initialLiability;
      } else if (commenceYear === year) {
        // New lease this year
        data[cls].liabilityAdditions += calc.initialLiability;
      }

      // Interest and payments during the year
      data[cls].interestExpense += inYear.reduce((s: number, p: any) => s + p.interest, 0);
      data[cls].paymentsMade += inYear.reduce((s: number, p: any) => s + p.payment, 0);

      // Closing = remaining liability after last period in this year
      if (inYear.length > 0) {
        data[cls].liabilityClosing += inYear[inYear.length - 1].remainingLiability;
      } else if (commenceYear < year && beforeYear.length > 0) {
        data[cls].liabilityClosing += beforeYear[beforeYear.length - 1].remainingLiability;
      }

    } catch (e) {
      console.error('Disclosure calc failed for', d.ContractID, e);
    }
  }

  return data;
}

export function Reports() {
  const { state } = useLeaseContext();
  const { savedContracts } = state;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const fmt = (n: number) => n === 0 ? '-' : n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const neg = (n: number) => n === 0 ? '-' : `(${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

  const disclosure = useMemo(() => buildDisclosureData(savedContracts, selectedYear), [savedContracts, selectedYear]);

  type DisclosureRow = { rouOpening: number; rouLiabilityComponent: number; rouIDC: number; rouPrepayments: number; rouIncentives: number; rouClosing: number; accumDepOpening: number; accumDepCharge: number; accumDepClosing: number; liabilityOpening: number; liabilityAdditions: number; interestExpense: number; paymentsMade: number; liabilityClosing: number };
  const total = (key: keyof DisclosureRow) =>
    ASSET_CLASSES.reduce((s, cls) => s + (disclosure[cls]?.[key] || 0), 0);

  // Derive active columns directly from saved contracts' AssetClass — independent of calculation success
  const activeClasses = ASSET_CLASSES.filter(cls =>
    savedContracts.some(c => (c.data?.AssetClass || 'Other') === cls)
  );

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    const cols = [...activeClasses, 'TOTAL'];
    const now = new Date();

    doc.setFontSize(14);
    doc.text('IFRS 16 – Right-of-Use Asset & Lease Liability Movement', 14, 14);
    doc.setFontSize(9);
    doc.text(`For the year ended 31 December ${selectedYear}  |  Generated: ${now.toLocaleDateString('en-GB')}`, 14, 20);

    const mkTable = (title: string, rows: { label: string; values: number[]; negate?: boolean; bold?: boolean }[], startY: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, startY - 2);
      autoTable(doc, {
        startY,
        head: [['', ...cols]],
        body: rows.map(r => [
          r.label,
          ...r.values.map(v => v === 0 ? '-' : r.negate
            ? `(${Math.abs(v).toLocaleString('en-NG', { minimumFractionDigits: 2 })})`
            : v.toLocaleString('en-NG', { minimumFractionDigits: 2 }))
        ]),
        styles: { fontSize: 7, halign: 'right' },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7 },
      });
      return (doc as any).lastAutoTable.finalY + 8;
    };

    let y = 26;
    y = mkTable(`RIGHT-OF-USE ASSET — AT COST`, [
      { label: `At 1 January ${selectedYear}`, values: [...activeClasses.map(c => disclosure[c].rouOpening), total('rouOpening')] },
      { label: '  Lease liability recognised', values: [...activeClasses.map(c => disclosure[c].rouLiabilityComponent), total('rouLiabilityComponent')] },
      { label: '  Initial direct costs (IDC)', values: [...activeClasses.map(c => disclosure[c].rouIDC), total('rouIDC')] },
      { label: '  Prepayments', values: [...activeClasses.map(c => disclosure[c].rouPrepayments), total('rouPrepayments')] },
      { label: '  Less: Lease incentives', values: [...activeClasses.map(c => disclosure[c].rouIncentives), total('rouIncentives')], negate: true },
      { label: `At 31 December ${selectedYear}`, values: [...activeClasses.map(c => disclosure[c].rouClosing), total('rouClosing')], bold: true },
    ], y);

    y = mkTable(`ACCUMULATED DEPRECIATION`, [
      { label: `At 1 January ${selectedYear}`, values: [...activeClasses.map(c => disclosure[c].accumDepOpening), total('accumDepOpening')] },
      { label: 'Charge for the year', values: [...activeClasses.map(c => disclosure[c].accumDepCharge), total('accumDepCharge')] },
      { label: `At 31 December ${selectedYear}`, values: [...activeClasses.map(c => disclosure[c].accumDepClosing), total('accumDepClosing')], bold: true },
    ], y);

    y = mkTable(`NET BOOK VALUE`, [
      { label: `At 31 December ${selectedYear}`, values: [...activeClasses.map(c => c in disclosure ? disclosure[c].rouClosing - disclosure[c].accumDepClosing : 0), total('rouClosing') - total('accumDepClosing')] },
      { label: `At 1 January ${selectedYear}`, values: [...activeClasses.map(c => c in disclosure ? disclosure[c].rouOpening - disclosure[c].accumDepOpening : 0), total('rouOpening') - total('accumDepOpening')] },
    ], y);

    mkTable(`LEASE LIABILITY`, [
      { label: `At 1 January ${selectedYear}`, values: [...activeClasses.map(c => disclosure[c].liabilityOpening), total('liabilityOpening')] },
      { label: 'Additions (new leases)', values: [...activeClasses.map(c => disclosure[c].liabilityAdditions), total('liabilityAdditions')] },
      { label: 'Interest expense', values: [...activeClasses.map(c => disclosure[c].interestExpense), total('interestExpense')] },
      { label: 'Lease payments made', values: [...activeClasses.map(c => disclosure[c].paymentsMade), total('paymentsMade')], negate: true },
      { label: `At 31 December ${selectedYear}`, values: [...activeClasses.map(c => disclosure[c].liabilityClosing), total('liabilityClosing')], bold: true },
    ], y);

    doc.save(`IFRS16_Disclosure_Note_${selectedYear}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const cols = [...activeClasses, 'TOTAL'];
    const rows: any[] = [];

    const addRow = (label: string, values: (number | string)[]) => rows.push([label, ...values]);
    const addBlank = () => rows.push(['']);
    const addHeader = (title: string) => rows.push([title]);

    addHeader(`IFRS 16 Disclosure Note — Year ended 31 December ${selectedYear}`);
    addBlank();
    addRow('', cols);

    addHeader('RIGHT-OF-USE ASSET — AT COST');
    addRow(`At 1 January ${selectedYear}`, [...activeClasses.map(c => disclosure[c].rouOpening), total('rouOpening')]);
    addRow('  Lease liability recognised', [...activeClasses.map(c => disclosure[c].rouLiabilityComponent), total('rouLiabilityComponent')]);
    addRow('  Initial direct costs (IDC)', [...activeClasses.map(c => disclosure[c].rouIDC), total('rouIDC')]);
    addRow('  Prepayments', [...activeClasses.map(c => disclosure[c].rouPrepayments), total('rouPrepayments')]);
    addRow('  Less: Lease incentives', [...activeClasses.map(c => -disclosure[c].rouIncentives), -total('rouIncentives')]);
    addRow(`At 31 December ${selectedYear}`, [...activeClasses.map(c => disclosure[c].rouClosing), total('rouClosing')]);
    addBlank();

    addHeader('ACCUMULATED DEPRECIATION');
    addRow(`At 1 January ${selectedYear}`, [...activeClasses.map(c => disclosure[c].accumDepOpening), total('accumDepOpening')]);
    addRow('Charge for the year', [...activeClasses.map(c => disclosure[c].accumDepCharge), total('accumDepCharge')]);
    addRow(`At 31 December ${selectedYear}`, [...activeClasses.map(c => disclosure[c].accumDepClosing), total('accumDepClosing')]);
    addBlank();

    addHeader('NET BOOK VALUE');
    addRow(`At 31 December ${selectedYear}`, [...activeClasses.map(c => disclosure[c].rouClosing - disclosure[c].accumDepClosing), total('rouClosing') - total('accumDepClosing')]);
    addRow(`At 1 January ${selectedYear}`, [...activeClasses.map(c => disclosure[c].rouOpening - disclosure[c].accumDepOpening), total('rouOpening') - total('accumDepOpening')]);
    addBlank();

    addHeader('LEASE LIABILITY');
    addRow(`At 1 January ${selectedYear}`, [...activeClasses.map(c => disclosure[c].liabilityOpening), total('liabilityOpening')]);
    addRow('Additions (new leases)', [...activeClasses.map(c => disclosure[c].liabilityAdditions), total('liabilityAdditions')]);
    addRow('Interest expense', [...activeClasses.map(c => disclosure[c].interestExpense), total('interestExpense')]);
    addRow('Lease payments made', [...activeClasses.map(c => -disclosure[c].paymentsMade), -total('paymentsMade')]);
    addRow(`At 31 December ${selectedYear}`, [...activeClasses.map(c => disclosure[c].liabilityClosing), total('liabilityClosing')]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Disclosure Note');
    XLSX.writeFile(wb, `IFRS16_Disclosure_Note_${selectedYear}.xlsx`);
  };

  const ThCell = ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap border-r border-emerald-700 last:border-0">{children}</th>
  );
  const TdVal = ({ n, negate }: { n: number; negate?: boolean }) => (
    <td className="px-4 py-2 text-right text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap border-r border-slate-200 dark:border-white/10 last:border-0">
      {n === 0 ? <span className="text-slate-400">-</span> : negate ? neg(n) : fmt(n)}
    </td>
  );
  const TdLabel = ({ children, variant = 'normal' }: { children: React.ReactNode; variant?: 'normal' | 'opening' | 'closing' }) => (
    <td className={`px-4 py-2 text-sm whitespace-nowrap font-medium
      ${variant === 'opening' ? 'text-red-600 dark:text-red-400 font-bold' : ''}
      ${variant === 'closing' ? 'text-slate-900 dark:text-white font-bold' : ''}
      ${variant === 'normal' ? 'text-slate-700 dark:text-slate-300' : ''}
    `}>{children}</td>
  );
  const TotalCell = ({ n, negate, variant = 'normal' }: { n: number; negate?: boolean; variant?: 'normal' | 'opening' | 'closing' }) => (
    <td className={`px-4 py-2 text-right text-sm whitespace-nowrap font-bold
      ${variant === 'opening' ? 'text-red-600 dark:text-red-400' : ''}
      ${variant === 'closing' ? 'text-slate-900 dark:text-white' : ''}
      ${variant === 'normal' ? 'text-slate-800 dark:text-slate-200' : ''}
    `}>
      {n === 0 ? <span className="text-slate-400">-</span> : negate ? neg(n) : fmt(n)}
    </td>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <tr className="bg-emerald-600 dark:bg-emerald-500/40">
      <td colSpan={activeClasses.length + 2} className="px-4 py-2 text-sm font-bold text-white uppercase tracking-wide">{title}</td>
    </tr>
  );

  const DividerRow = () => (
    <tr className="bg-slate-100 dark:bg-white/5"><td colSpan={activeClasses.length + 2} className="py-1"></td></tr>
  );

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">

      {/* Header */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 p-6 flex items-center gap-3 shadow-xl">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-emerald-700 dark:text-emerald-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Disclosures</h1>
          <p className="text-slate-600 dark:text-white/80">IFRS 16 compliant disclosure note by asset class</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-white/80">Reporting Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="text-sm border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Array.from({ length: 10 }, (_, i) => currentYear - 3 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {savedContracts.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-300 dark:border-white/10 p-12 text-center shadow-xl">
          <BarChart3 className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No contracts available</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Create contracts first to generate disclosure notes</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              IFRS 16 Disclosure Note — Year ended 31 December {selectedYear}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-600 dark:bg-emerald-500/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-56 border-r border-emerald-700"></th>
                  {activeClasses.map(cls => <ThCell key={cls}>{cls}</ThCell>)}
                  <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">

                {/* ROU ASSET AT COST */}
                <SectionHeader title="RIGHT OF USE ASSET — At Cost" />
                <tr className="bg-white dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel variant="opening">At 1 January {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouOpening} />)}
                  <TotalCell n={total('rouOpening')} variant="opening" />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>  Lease liability recognised</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouLiabilityComponent} />)}
                  <TotalCell n={total('rouLiabilityComponent')} />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>  Initial direct costs (IDC)</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouIDC} />)}
                  <TotalCell n={total('rouIDC')} />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>  Prepayments</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouPrepayments} />)}
                  <TotalCell n={total('rouPrepayments')} />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>  Less: Lease incentives</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouIncentives} negate />)}
                  <TotalCell n={total('rouIncentives')} negate />
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-500/10 border-b-2 border-emerald-600">
                  <TdLabel variant="closing">At 31 December {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouClosing} />)}
                  <TotalCell n={total('rouClosing')} variant="closing" />
                </tr>

                <DividerRow />

                {/* ACCUMULATED DEPRECIATION */}
                <SectionHeader title="Accumulated Depreciation on ROU" />
                <tr className="bg-white dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel variant="opening">At 1 January {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].accumDepOpening} />)}
                  <TotalCell n={total('accumDepOpening')} variant="opening" />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>Charge for the year</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].accumDepCharge} />)}
                  <TotalCell n={total('accumDepCharge')} />
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-500/10 border-b-2 border-emerald-600">
                  <TdLabel variant="closing">At 31 December {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].accumDepClosing} />)}
                  <TotalCell n={total('accumDepClosing')} variant="closing" />
                </tr>

                <DividerRow />

                {/* NET BOOK VALUE */}
                <SectionHeader title="Net Book Value" />
                <tr className="bg-white dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel variant="closing">At 31 December {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouClosing - disclosure[cls].accumDepClosing} />)}
                  <TotalCell n={total('rouClosing') - total('accumDepClosing')} variant="closing" />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>At 1 January {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].rouOpening - disclosure[cls].accumDepOpening} />)}
                  <TotalCell n={total('rouOpening') - total('accumDepOpening')} />
                </tr>

                <DividerRow />

                {/* LEASE LIABILITY */}
                <SectionHeader title="LEASE LIABILITY" />
                <tr className="bg-white dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel variant="opening">At 1 January {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].liabilityOpening} />)}
                  <TotalCell n={total('liabilityOpening')} variant="opening" />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>Additions (new leases)</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].liabilityAdditions} />)}
                  <TotalCell n={total('liabilityAdditions')} />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>Interest expense</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].interestExpense} />)}
                  <TotalCell n={total('interestExpense')} />
                </tr>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <TdLabel>Lease payments made</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].paymentsMade} negate />)}
                  <TotalCell n={total('paymentsMade')} negate />
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-500/10 border-b-2 border-emerald-600">
                  <TdLabel variant="closing">At 31 December {selectedYear}</TdLabel>
                  {activeClasses.map(cls => <TdVal key={cls} n={disclosure[cls].liabilityClosing} />)}
                  <TotalCell n={total('liabilityClosing')} variant="closing" />
                </tr>

              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
            Values derived from {savedContracts.length} contract(s). Only asset classes with activity in {selectedYear} are shown as columns.
          </div>
        </div>
      )}
    </div>
  );
}
