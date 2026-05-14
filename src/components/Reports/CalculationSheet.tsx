import { useMemo } from 'react';
import { calculateIFRS16 } from '../../utils/ifrs16Calculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSXStyle from 'xlsx-js-style';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../UI/ToastContext';

/* ============================================================================
 * HELPERS
 * ============================================================================ */

function getPeriodsPerYear(frequency: string, customYears?: number): number {
  if (frequency === 'Custom') return customYears && customYears > 0 ? 1 / customYears : 1;
  const map: Record<string, number> = { Monthly: 12, Quarterly: 4, Semiannual: 2, Annual: 1 };
  return map[frequency] || 12;
}

function monthsBetween(d1: Date, d2: Date): number {
  return Math.round(
    (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
  );
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + Math.floor(years));
  const remainingMonths = Math.round((years % 1) * 12);
  d.setMonth(d.getMonth() + remainingMonths);
  return d;
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB');
}

/* ============================================================================
 * TYPES
 * ============================================================================ */

interface CalcRow {
  contractId: string;
  ibr: number;
  extensionIncluded: boolean;
  startDate: string;
  endDate: string;
  extensionEndDate: string;
  periodicAmount: number;
  estimatedExtensionAmount: number;
  prevLiability: number;
  prevROUClosing: number;
  status: string;
  nonCancellableMonths: number;
  extensionMonths: number;
  totalTenorMonths: number;
  tenorAtRepDate: number;
  periodAtPriorYear: number;
  currentPeriod: number;
  pvFutureCashFlows: number;
  openingLiability: number;
  currentFinanceCost: number;
  liabilityAtRepDate: number;
  openingCost: number;
  additional: number;
  closingCost: number;
  openingAccumDep: number;
  depForYear: number;
  totalAccumDep: number;
  carryingAmount: number;
}

/* ============================================================================
 * BUILD CALCULATION ROWS
 * ============================================================================ */

function buildCalcRows(contracts: any[], selectedYear: number): CalcRow[] {
  const reportingDate = new Date(selectedYear, 11, 31);
  const priorDate = new Date(selectedYear - 1, 11, 31);

  const rows: CalcRow[] = [];

  for (const contract of contracts) {
    const d = contract.data;
    if (!d.CommencementDate || !d.NonCancellableYears || !d.IBR_Annual) continue;

    const ibr = d.IBR_Annual;
    const startDate = new Date(d.CommencementDate);
    const originalTermYears = d.NonCancellableYears || 0;
    const endDate = addYears(startDate, originalTermYears);

    const renewalYears = d.RenewalOptionYears || 0;
    const renewalLikelihood = d.RenewalOptionLikelihood || 0;
    const extensionIncluded = renewalYears > 0 && renewalLikelihood >= 0.5;

    const extensionMonths = extensionIncluded ? Math.round(renewalYears * 12) : 0;
    const extensionEndDate = extensionIncluded
      ? addYears(endDate, renewalYears).toISOString().split('T')[0]
      : '';

    const nonCancellableMonths = Math.round(originalTermYears * 12);
    const totalTenorMonths = nonCancellableMonths + extensionMonths;

    // Status
    let status: string;
    if (startDate > reportingDate) {
      status = 'Not yet Commenced';
    } else if (startDate > priorDate) {
      status = 'NEW';
    } else {
      status = 'ONGOING';
    }

    // Run IFRS 16 calculation using the contract's own data (engine already handles renewal)
    let calc: any = null;
    try {
      calc = calculateIFRS16(d);
    } catch {
      // skip failed calculations
    }

    if (!calc) {
      rows.push({
        contractId: d.ContractID || '-',
        ibr, extensionIncluded,
        startDate: d.CommencementDate,
        endDate: endDate.toISOString().split('T')[0],
        extensionEndDate,
        periodicAmount: d.FixedPaymentPerPeriod || 0,
        estimatedExtensionAmount: d.RenewalOptionPayment || 0,
        prevLiability: 0, prevROUClosing: 0,
        status, nonCancellableMonths, extensionMonths, totalTenorMonths,
        tenorAtRepDate: Math.max(0, monthsBetween(startDate, reportingDate)),
        periodAtPriorYear: 0, currentPeriod: 0,
        pvFutureCashFlows: 0, openingLiability: 0, currentFinanceCost: 0,
        liabilityAtRepDate: 0, openingCost: 0, additional: 0, closingCost: 0,
        openingAccumDep: 0, depForYear: 0, totalAccumDep: 0, carryingAmount: 0,
      });
      continue;
    }

    const monthsPerPeriod = 12 / getPeriodsPerYear(
      d.PaymentFrequency || 'Monthly',
      d.CustomPaymentIntervalYears
    );
    const schedule = calc.amortizationSchedule;

    const getRowDate = (row: any): Date => {
      const dt = new Date(startDate);
      dt.setMonth(dt.getMonth() + (row.month - 1) * monthsPerPeriod);
      return dt;
    };

    const priorRows = schedule.filter((row: any) => getRowDate(row) <= priorDate);
    const currentRows = schedule.filter((row: any) => {
      const dt = getRowDate(row);
      return dt > priorDate && dt <= reportingDate;
    });

    // Period metrics
    const tenorAtRepDate = Math.max(0, monthsBetween(startDate, reportingDate));
    const periodAtPriorYear = status === 'ONGOING'
      ? Math.max(0, monthsBetween(startDate, priorDate))
      : 0;
    const currentPeriod = tenorAtRepDate - periodAtPriorYear;

    // Opening values at prior year-end
    const lastPriorRow = priorRows[priorRows.length - 1];
    const openingLiability = status === 'ONGOING'
      ? (lastPriorRow ? lastPriorRow.remainingLiability : calc.initialLiability)
      : 0;
    const openingROU = status === 'ONGOING'
      ? (lastPriorRow ? lastPriorRow.remainingAsset : calc.initialROU)
      : 0;
    const openingAccumDep = status === 'ONGOING'
      ? Math.max(0, calc.initialROU - openingROU)
      : 0;

    // Current year values
    const currentFinanceCost = currentRows.reduce(
      (s: number, r: any) => s + (r.interest || 0), 0
    );
    const depForYear = currentRows.reduce(
      (s: number, r: any) => s + (r.depreciation || 0), 0
    );
    const lastCurrentRow = currentRows[currentRows.length - 1];
    const liabilityAtRepDate = lastCurrentRow
      ? lastCurrentRow.remainingLiability
      : status === 'NEW' ? calc.initialLiability : openingLiability;

    // Cost movement
    const openingCost = status === 'ONGOING' ? calc.initialROU : 0;
    const additional = status === 'NEW' ? calc.initialROU : 0;
    const closingCost = openingCost + additional;

    // Depreciation totals
    const totalAccumDep = openingAccumDep + depForYear;
    const carryingAmount = closingCost - totalAccumDep;

    rows.push({
      contractId: d.ContractID || '-',
      ibr,
      extensionIncluded,
      startDate: d.CommencementDate,
      endDate: endDate.toISOString().split('T')[0],
      extensionEndDate,
      periodicAmount: d.FixedPaymentPerPeriod || 0,
      estimatedExtensionAmount: d.RenewalOptionPayment || 0,
      prevLiability: openingLiability,
      prevROUClosing: openingROU,
      status,
      nonCancellableMonths,
      extensionMonths,
      totalTenorMonths,
      tenorAtRepDate,
      periodAtPriorYear,
      currentPeriod,
      pvFutureCashFlows: liabilityAtRepDate,
      openingLiability,
      currentFinanceCost,
      liabilityAtRepDate,
      openingCost,
      additional,
      closingCost,
      openingAccumDep,
      depForYear,
      totalAccumDep,
      carryingAmount,
    });
  }

  return rows;
}

function sumCol(rows: CalcRow[], key: keyof CalcRow): number {
  return rows.reduce((s, r) => s + (typeof r[key] === 'number' ? (r[key] as number) : 0), 0);
}

/* ============================================================================
 * COMPONENT
 * ============================================================================ */

interface Props {
  contracts: any[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function CalculationSheet({ contracts, selectedYear, onYearChange }: Props) {
  const toast = useToast();
  const currentYear = new Date().getFullYear();

  const rows = useMemo(
    () => buildCalcRows(contracts, selectedYear),
    [contracts, selectedYear]
  );

  const fmt = (n: number) =>
    n === 0 ? '-' : n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

  /* --------------------------------------------------------------------------
   * EXCEL EXPORT — styled with xlsx-js-style
   * -------------------------------------------------------------------------- */
  const exportExcel = () => {
    try {
    // ── Colour palette (ARGB without alpha prefix for xlsx-js-style) ─────────
    const C = {
      inputs:       '1E40AF',
      opening:      '6B21A8',
      period:       '334155',
      liability:    '065F46',
      cost:         '9A3412',
      depreciation: '9F1239',
      carrying:     '3730A3',
      white:        'FFFFFF',
      altRow:       'F1F5F9',
      totals:       'E2E8F0',
      totalsFont:   '0F172A',
    };

    // ── Group definitions: [label, startCol (0-based), endCol, colorKey] ─────
    const groups: [string, number, number, string][] = [
      ['INPUTS',                   0,  7,  C.inputs],
      ['OPENING BALANCE',          8,  9,  C.opening],
      ['PERIOD',                   10, 16, C.period],
      ['LEASE LIABILITY',          17, 20, C.liability],
      ['COST',                     21, 23, C.cost],
      ['ACCUMULATED DEPRECIATION', 24, 26, C.depreciation],
      ['CARRYING AMOUNT',          27, 27, C.carrying],
    ];

    const colGroupColor = (col: number): string => {
      const g = groups.find(([, s, e]) => col >= s && col <= e);
      return g ? g[2] : C.inputs;
    };

    const groupHeaderStyle = (bgColor: string) => ({
      font: { bold: true, color: { rgb: C.white }, sz: 10 },
      fill: { fgColor: { rgb: bgColor }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'medium', color: { rgb: C.white } },
        bottom: { style: 'thin',   color: { rgb: C.white } },
        left:   { style: 'thin',   color: { rgb: C.white } },
        right:  { style: 'medium', color: { rgb: C.white } },
      },
    });

    const colHeaderStyle = (bgColor: string) => ({
      font: { bold: true, color: { rgb: C.white }, sz: 9 },
      fill: { fgColor: { rgb: bgColor }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'thin', color: { rgb: C.white } },
        bottom: { style: 'medium', color: { rgb: C.white } },
        left:   { style: 'hair', color: { rgb: C.white } },
        right:  { style: 'hair', color: { rgb: C.white } },
      },
    });

    const dataStyle = (bgColor: string, align: 'left' | 'right' | 'center' = 'right', numFmt?: string) => ({
      font: { sz: 9, color: { rgb: '0F172A' } },
      fill: { fgColor: { rgb: bgColor }, patternType: 'solid' },
      alignment: { horizontal: align, vertical: 'center' },
      border: {
        bottom: { style: 'hair', color: { rgb: 'E2E8F0' } },
        right:  { style: 'hair', color: { rgb: 'E2E8F0' } },
      },
      numFmt,
    });

    const totalStyle = (align: 'left' | 'right' = 'right', numFmt?: string) => ({
      font: { bold: true, sz: 10, color: { rgb: C.totalsFont } },
      fill: { fgColor: { rgb: C.totals }, patternType: 'solid' },
      alignment: { horizontal: align, vertical: 'center' },
      border: {
        top:    { style: 'medium', color: { rgb: '94A3B8' } },
        bottom: { style: 'medium', color: { rgb: '94A3B8' } },
        right:  { style: 'hair',   color: { rgb: 'CBD5E1' } },
      },
      numFmt,
    });

    const numFmt = '#,##0.00';
    const amountCols = new Set([6, 7, 8, 9, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27]);
    const intCols    = new Set([11, 12, 13, 14, 15, 16]);

    // ── Column headers ────────────────────────────────────────────────────────
    const colHeaders = [
      'Lease Contract ID', 'Discount Rates / IBR', 'Lease Liability Extension',
      'Start Date', 'End Date', 'Date of Extension Lease End',
      'Periodic Lease Amount', 'Estimated Extension Amount',
      `Previous Liability @ ${selectedYear - 1}`, `Previous ROU Closing @ ${selectedYear - 1}`,
      'Status',
      'Non-Cancellable Periods (months)', 'Extension Period (months)',
      'Total Lease Tenor (months)', 'Lease Tenor at Rep Date (months)',
      `Period as at ${selectedYear - 1}`, 'Current Period',
      'PV of Future Cash Flows', 'Opening Lease Liability', 'Current Finance Cost',
      `Lease Liability @ ${selectedYear}`,
      'Opening Cost', 'Additional', 'Closing Cost',
      'Opening Accum Dep', 'Dep for the Year', 'TOTAL Accum Dep',
      'Carrying Amount',
    ];

    const NCOLS = colHeaders.length;

    // ── Build worksheet data array ────────────────────────────────────────────
    const wsData: any[][] = [];

    // Row 0: Title
    const titleRow: any[] = [
      {
        v: `IFRS 16 — Lease Portfolio Summary | Year ended 31 December ${selectedYear}`,
        t: 's',
        s: {
          font: { bold: true, sz: 13, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'DBEAFE' }, patternType: 'solid' },
          alignment: { horizontal: 'left', vertical: 'center' },
        },
      },
      ...Array(NCOLS - 1).fill({ v: '', t: 's' }),
    ];
    wsData.push(titleRow);

    // Row 1: Group headers
    const groupHeaderRow: any[] = Array(NCOLS).fill({ v: '', t: 's' });
    groups.forEach(([label, start, , color]) => {
      groupHeaderRow[start] = {
        v: label, t: 's',
        s: groupHeaderStyle(color),
      };
    });
    // Fill remaining cells in group with same style (no label)
    groups.forEach(([, start, end, color]) => {
      for (let c = start + 1; c <= end; c++) {
        groupHeaderRow[c] = { v: '', t: 's', s: groupHeaderStyle(color) };
      }
    });
    wsData.push(groupHeaderRow);

    // Row 2: Column headers
    const colHeaderRow = colHeaders.map((h, i) => ({
      v: h, t: 's',
      s: colHeaderStyle(colGroupColor(i)),
    }));
    wsData.push(colHeaderRow);

    // Data rows
    rows.forEach((r, idx) => {
      const bg = idx % 2 === 0 ? C.white : C.altRow;
      const row = [
        { v: r.contractId,                         t: 's', s: dataStyle(bg, 'left') },
        { v: `${(r.ibr * 100).toFixed(2)}%`,       t: 's', s: dataStyle(bg, 'right') },
        { v: r.extensionIncluded ? 'YES' : 'NO',   t: 's', s: { ...dataStyle(bg, 'center'), font: { bold: true, sz: 9, color: { rgb: r.extensionIncluded ? '065F46' : '64748B' } } } },
        { v: fmtDate(r.startDate),                 t: 's', s: dataStyle(bg, 'center') },
        { v: fmtDate(r.endDate),                   t: 's', s: dataStyle(bg, 'center') },
        { v: r.extensionEndDate ? fmtDate(r.extensionEndDate) : '-', t: 's', s: dataStyle(bg, 'center') },
        { v: r.periodicAmount,                     t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.estimatedExtensionAmount || 0,      t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.prevLiability,                      t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.prevROUClosing,                     t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.status, t: 's', s: { ...dataStyle(bg, 'center'), font: { bold: true, sz: 9, color: { rgb: r.status === 'ONGOING' ? '065F46' : r.status === 'NEW' ? '1E40AF' : '92400E' } } } },
        { v: r.nonCancellableMonths,               t: 'n', s: dataStyle(bg, 'right') },
        { v: r.extensionMonths || 0,               t: 'n', s: dataStyle(bg, 'right') },
        { v: r.totalTenorMonths,                   t: 'n', s: dataStyle(bg, 'right') },
        { v: r.tenorAtRepDate,                     t: 'n', s: dataStyle(bg, 'right') },
        { v: r.periodAtPriorYear || 0,             t: 'n', s: dataStyle(bg, 'right') },
        { v: r.currentPeriod || 0,                 t: 'n', s: dataStyle(bg, 'right') },
        { v: r.pvFutureCashFlows,                  t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.openingLiability,                   t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.currentFinanceCost,                 t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.liabilityAtRepDate,                 t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.openingCost,                        t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.additional,                         t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.closingCost,                        t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.openingAccumDep,                    t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.depForYear,                         t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.totalAccumDep,                      t: 'n', s: dataStyle(bg, 'right', numFmt) },
        { v: r.carryingAmount,                     t: 'n', s: dataStyle(bg, 'right', numFmt) },
      ];
      wsData.push(row);
    });

    // Totals row
    const totalsData: any[] = [
      { v: 'TOTAL', t: 's', s: totalStyle('left') },
      ...Array(6).fill({ v: '', t: 's', s: totalStyle() }),
      { v: sumCol(rows, 'estimatedExtensionAmount'), t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'prevLiability'),            t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'prevROUClosing'),           t: 'n', s: totalStyle('right', numFmt) },
      { v: '', t: 's', s: totalStyle() },
      ...Array(6).fill({ v: '', t: 's', s: totalStyle() }),
      { v: sumCol(rows, 'pvFutureCashFlows'),        t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'openingLiability'),         t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'currentFinanceCost'),       t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'liabilityAtRepDate'),       t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'openingCost'),              t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'additional'),               t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'closingCost'),              t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'openingAccumDep'),          t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'depForYear'),               t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'totalAccumDep'),            t: 'n', s: totalStyle('right', numFmt) },
      { v: sumCol(rows, 'carryingAmount'),           t: 'n', s: totalStyle('right', numFmt) },
    ];
    wsData.push(totalsData);

    // ── Build workbook ────────────────────────────────────────────────────────
    const ws = XLSXStyle.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
      { wch: 20 }, { wch: 22 }, { wch: 24 }, { wch: 24 }, { wch: 22 }, { wch: 22 },
      { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 20 }, { wch: 16 }, { wch: 24 },
      { wch: 24 }, { wch: 22 }, { wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 18 },
      { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
    ];

    // Row heights
    ws['!rows'] = [
      { hpt: 28 }, // title
      { hpt: 26 }, // group headers
      { hpt: 40 }, // col headers
      ...rows.map(() => ({ hpt: 18 })),
      { hpt: 22 }, // totals
    ];

    // Merge title row across all columns
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: NCOLS - 1 } },
      // Merge group header cells
      ...groups.map(([, start, end]) => ({
        s: { r: 1, c: start }, e: { r: 1, c: end },
      })),
    ];

    // Freeze top 3 rows (title + group header + col header)
    ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4' }];

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Lease Portfolio Summary');

    // Use manual Blob download for reliable browser support
    const wbout: ArrayBuffer = XLSXStyle.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IFRS16_Lease_Portfolio_Summary_${selectedYear}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Excel exported', 'Calculation sheet downloaded successfully.');
    } catch (err: any) {
      console.error('Excel export error:', err);
      toast.error('Export failed', err?.message || 'Could not generate Excel file.');
    }
  };

  /* --------------------------------------------------------------------------
   * PDF EXPORT
   * -------------------------------------------------------------------------- */
  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a2' });
      const now = new Date();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title bar
      doc.setFillColor(219, 234, 254);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('IFRS 16 — Lease Portfolio Summary', 10, 11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `For the year ended 31 December ${selectedYear}  |  Generated: ${now.toLocaleDateString('en-GB')}`,
        10, 17
      );

      // Group colour map (RGB tuples matching the Excel palette)
      type RGB = [number, number, number];
      const groupColor = (col: number): RGB => {
        if (col <= 7)  return [30, 64, 175];    // blue   — INPUTS
        if (col <= 9)  return [107, 33, 168];   // purple — OPENING BALANCE
        if (col <= 16) return [51, 65, 85];     // slate  — PERIOD
        if (col <= 20) return [6, 95, 70];      // green  — LEASE LIABILITY
        if (col <= 23) return [154, 52, 18];    // orange — COST
        if (col <= 26) return [159, 18, 57];    // rose   — ACCUMULATED DEPRECIATION
        return [55, 48, 163];                   // indigo — CARRYING AMOUNT
      };

      // Two-row header: row 0 = group bands, row 1 = column labels
      const NCOLS = 28;
      // Keep group row cells empty — labels are drawn centred via didDrawCell
      const groupRow = Array(NCOLS).fill('');

      // Group definitions: [label, firstCol, lastCol]
      const groupDefs: [string, number, number][] = [
        ['INPUTS',                   0,  7],
        ['OPENING BALANCE',          8,  9],
        ['PERIOD',                   10, 16],
        ['LEASE LIABILITY',          17, 20],
        ['COST',                     21, 23],
        ['ACCUMULATED DEPRECIATION', 24, 26],
        ['CARRYING AMOUNT',          27, 27],
      ];

      const colRow = [
        'Contract ID', 'IBR', 'Extension', 'Start Date', 'End Date', 'Ext. End',
        'Periodic Amt', 'Ext. Amt',
        `Prev Liab\n@${selectedYear - 1}`, `Prev ROU\n@${selectedYear - 1}`,
        'Status', 'Non-Cancel\n(mths)', 'Ext Period\n(mths)', 'Total Tenor\n(mths)',
        'Tenor @\nRep Date', `Period @\n${selectedYear - 1}`, 'Curr\nPeriod',
        'PV Future\nCash Flows', 'Opening\nLiability', 'Finance\nCost', `Liability @\n${selectedYear}`,
        'Opening\nCost', 'Additional', 'Closing\nCost',
        'Opening\nAccum Dep', 'Dep for\nYear', 'TOTAL\nAccum Dep', 'Carrying\nAmount',
      ];

      const head = [groupRow, colRow];

      // Populated by didDrawCell, consumed after autoTable
      const groupBandPositions: { label: string; x: number; y: number; width: number; height: number }[] = [];

      const body = [
        ...rows.map(r => [
          r.contractId,
          pct(r.ibr),
          r.extensionIncluded ? 'YES' : 'NO',
          fmtDate(r.startDate),
          fmtDate(r.endDate),
          r.extensionEndDate ? fmtDate(r.extensionEndDate) : '-',
          fmt(r.periodicAmount),
          r.estimatedExtensionAmount ? fmt(r.estimatedExtensionAmount) : '-',
          fmt(r.prevLiability),
          fmt(r.prevROUClosing),
          r.status,
          r.nonCancellableMonths,
          r.extensionMonths || '-',
          r.totalTenorMonths,
          r.tenorAtRepDate,
          r.periodAtPriorYear || '-',
          r.currentPeriod || '-',
          fmt(r.pvFutureCashFlows),
          fmt(r.openingLiability),
          fmt(r.currentFinanceCost),
          fmt(r.liabilityAtRepDate),
          fmt(r.openingCost),
          fmt(r.additional),
          fmt(r.closingCost),
          fmt(r.openingAccumDep),
          fmt(r.depForYear),
          fmt(r.totalAccumDep),
          fmt(r.carryingAmount),
        ]),
        // Totals row
        [
          'TOTAL', '', '', '', '', '', '',
          fmt(sumCol(rows, 'estimatedExtensionAmount')),
          fmt(sumCol(rows, 'prevLiability')),
          fmt(sumCol(rows, 'prevROUClosing')),
          '', '', '', '', '', '', '',
          fmt(sumCol(rows, 'pvFutureCashFlows')),
          fmt(sumCol(rows, 'openingLiability')),
          fmt(sumCol(rows, 'currentFinanceCost')),
          fmt(sumCol(rows, 'liabilityAtRepDate')),
          fmt(sumCol(rows, 'openingCost')),
          fmt(sumCol(rows, 'additional')),
          fmt(sumCol(rows, 'closingCost')),
          fmt(sumCol(rows, 'openingAccumDep')),
          fmt(sumCol(rows, 'depForYear')),
          fmt(sumCol(rows, 'totalAccumDep')),
          fmt(sumCol(rows, 'carryingAmount')),
        ],
      ];

      autoTable(doc, {
        startY: 23,
        head,
        body,
        styles: {
          fontSize: 5,
          halign: 'right',
          cellPadding: 1.3,
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: [255, 255, 255],
        },
        headStyles: { textColor: [255, 255, 255], halign: 'center', valign: 'middle', fontStyle: 'bold' },
        bodyStyles: { textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        columnStyles: {
          0:  { halign: 'left' },
          2:  { halign: 'center' },
          10: { halign: 'center' },
        },
        didParseCell: (data) => {
          const col = data.column.index;
          const rowIdx = data.row.index;

          if (data.section === 'head') {
            data.cell.styles.fillColor = groupColor(col);
            if (rowIdx === 0) {
              data.cell.styles.lineWidth = 0;
              data.cell.styles.minCellHeight = 7;
            } else {
              data.cell.styles.minCellHeight = 13;
            }
          } else if (data.section === 'body') {
            // Totals row
            if (rowIdx === rows.length) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [226, 232, 240];
            }
            // Status cell colour
            if (col === 10 && rowIdx < rows.length) {
              const st = rows[rowIdx]?.status;
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor =
                st === 'ONGOING' ? [6, 95, 70] :
                st === 'NEW'     ? [30, 64, 175] :
                                   [146, 64, 14];
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section !== 'head' || data.row.index !== 0) return;
          const col = data.column.index;
          const grp = groupDefs.find(([, start]) => start === col);
          if (!grp) return;

          const [label, start, end] = grp;
          const tableCols = (data.table as any).columns as any[];
          let bandWidth = 0;
          for (let c = start; c <= end; c++) {
            bandWidth += tableCols[c]?.width ?? 0;
          }
          // Store position — draw text AFTER autoTable to avoid cell clipping
          groupBandPositions.push({
            label,
            x: data.cell.x,
            y: data.cell.y,
            width: bandWidth,
            height: data.cell.height,
          });
        },
      });

      // Draw group labels centred over each band now that clipping is gone
      groupBandPositions.forEach(({ label, x, y, width, height }) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(255, 255, 255);
        doc.text(label, x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
      });

      // Page footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `IFRS 16 Lease Portfolio Summary — ${selectedYear}  |  Page ${i} of ${pageCount}  |  Confidential`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        );
      }

      doc.save(`IFRS16_Lease_Portfolio_Summary_${selectedYear}.pdf`);
      toast.success('PDF exported', 'Calculation sheet downloaded successfully.');
    } catch (err: any) {
      console.error('PDF export error:', err);
      toast.error('Export failed', err?.message || 'Could not generate PDF file.');
    }
  };

  /* --------------------------------------------------------------------------
   * COLUMN GROUP HEADERS
   * -------------------------------------------------------------------------- */
  const GroupTh = ({
    label, cols, color,
  }: { label: string; cols: number; color: string }) => (
    <th
      colSpan={cols}
      className={`px-3 py-2 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/30 last:border-0 ${color}`}
    >
      {label}
    </th>
  );

  const ColTh = ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2 text-center text-xs font-semibold text-white whitespace-nowrap border-r border-slate-600 last:border-0 bg-slate-700">
      {children}
    </th>
  );

  const Td = ({ children, right = true }: { children: React.ReactNode; right?: boolean }) => (
    <td className={`px-3 py-2 text-xs whitespace-nowrap border-r border-slate-200 dark:border-white/10 last:border-0 ${right ? 'text-right' : 'text-left'} text-slate-800 dark:text-slate-200`}>
      {children}
    </td>
  );

  const TdTotal = ({ children, right = true }: { children: React.ReactNode; right?: boolean }) => (
    <td className={`px-3 py-2 text-xs font-bold whitespace-nowrap border-r border-slate-300 dark:border-white/20 last:border-0 bg-slate-100 dark:bg-white/10 ${right ? 'text-right' : 'text-left'} text-slate-900 dark:text-white`}>
      {children}
    </td>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const color =
      status === 'ONGOING' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' :
      status === 'NEW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' :
      'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{status}</span>;
  };

  if (contracts.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-300 dark:border-white/10 p-16 shadow-xl flex flex-col items-center text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No contracts available. Create and save contracts to generate the calculation sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-300 dark:border-white/10 p-4 flex items-center justify-between flex-wrap gap-3 shadow">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-white/80">Reporting Year:</label>
          <select
            value={selectedYear}
            onChange={e => onYearChange(parseInt(e.target.value))}
            className="text-sm border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 10 }, (_, i) => currentYear - 3 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportExcel()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/5 rounded-lg border border-slate-300 dark:border-white/10 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            IFRS 16 Lease Portfolio Summary — Year ended 31 December {selectedYear}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {rows.length} contract(s) — scroll horizontally to view all columns
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              {/* Group header row */}
              <tr>
                <GroupTh label="INPUTS" cols={8} color="bg-blue-700" />
                <GroupTh label="OPENING BALANCE" cols={2} color="bg-purple-700" />
                <GroupTh label="PERIOD" cols={7} color="bg-slate-600" />
                <GroupTh label="LEASE LIABILITY" cols={4} color="bg-emerald-700" />
                <GroupTh label="COST" cols={3} color="bg-orange-600" />
                <GroupTh label="ACCUMULATED DEPRECIATION" cols={3} color="bg-rose-700" />
                <GroupTh label="CARRYING AMOUNT" cols={1} color="bg-indigo-700" />
              </tr>
              {/* Column header row */}
              <tr>
                <ColTh>Lease Contract ID</ColTh>
                <ColTh>Discount Rates / IBR</ColTh>
                <ColTh>Lease Liability Extension</ColTh>
                <ColTh>Start Date</ColTh>
                <ColTh>End Date</ColTh>
                <ColTh>Date of Extension Lease End</ColTh>
                <ColTh>Periodic Lease Amount</ColTh>
                <ColTh>Estimated Extension Amount</ColTh>
                <ColTh>Previous Liability @ {selectedYear - 1}</ColTh>
                <ColTh>Previous ROU Closing @ {selectedYear - 1}</ColTh>
                <ColTh>Status</ColTh>
                <ColTh>Non-Cancellable Periods (months)</ColTh>
                <ColTh>Extension Period (months)</ColTh>
                <ColTh>Total Lease Tenor (months)</ColTh>
                <ColTh>Lease Tenor at Rep Date (months)</ColTh>
                <ColTh>Period as at {selectedYear - 1}</ColTh>
                <ColTh>Current Period</ColTh>
                <ColTh>PV of Future Cash Flows</ColTh>
                <ColTh>Opening Lease Liability</ColTh>
                <ColTh>Current Finance Cost</ColTh>
                <ColTh>Lease Liability @ {selectedYear}</ColTh>
                <ColTh>Opening Cost</ColTh>
                <ColTh>Additional</ColTh>
                <ColTh>Closing Cost</ColTh>
                <ColTh>Opening Accum Dep</ColTh>
                <ColTh>Dep for the Year</ColTh>
                <ColTh>TOTAL Accum Dep</ColTh>
                <ColTh>Carrying Amount</ColTh>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`${i % 2 === 0 ? 'bg-white dark:bg-white/5' : 'bg-slate-50 dark:bg-white/[0.03]'} hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors`}
                >
                  <Td right={false}>{r.contractId}</Td>
                  <Td>{pct(r.ibr)}</Td>
                  <Td right={false}>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.extensionIncluded ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'}`}>
                      {r.extensionIncluded ? 'YES' : 'NO'}
                    </span>
                  </Td>
                  <Td right={false}>{fmtDate(r.startDate)}</Td>
                  <Td right={false}>{fmtDate(r.endDate)}</Td>
                  <Td right={false}>{r.extensionEndDate ? fmtDate(r.extensionEndDate) : '-'}</Td>
                  <Td>{fmt(r.periodicAmount)}</Td>
                  <Td>{r.estimatedExtensionAmount ? fmt(r.estimatedExtensionAmount) : '-'}</Td>
                  <Td>{fmt(r.prevLiability)}</Td>
                  <Td>{fmt(r.prevROUClosing)}</Td>
                  <Td right={false}><StatusBadge status={r.status} /></Td>
                  <Td>{r.nonCancellableMonths}</Td>
                  <Td>{r.extensionMonths || '-'}</Td>
                  <Td>{r.totalTenorMonths}</Td>
                  <Td>{r.tenorAtRepDate}</Td>
                  <Td>{r.periodAtPriorYear || '-'}</Td>
                  <Td>{r.currentPeriod || '-'}</Td>
                  <Td>{fmt(r.pvFutureCashFlows)}</Td>
                  <Td>{fmt(r.openingLiability)}</Td>
                  <Td>{fmt(r.currentFinanceCost)}</Td>
                  <Td>{fmt(r.liabilityAtRepDate)}</Td>
                  <Td>{fmt(r.openingCost)}</Td>
                  <Td>{fmt(r.additional)}</Td>
                  <Td>{fmt(r.closingCost)}</Td>
                  <Td>{fmt(r.openingAccumDep)}</Td>
                  <Td>{fmt(r.depForYear)}</Td>
                  <Td>{fmt(r.totalAccumDep)}</Td>
                  <Td>{fmt(r.carryingAmount)}</Td>
                </tr>
              ))}

              {/* Totals row */}
              <tr className="border-t-2 border-slate-400 dark:border-white/20">
                <TdTotal right={false}>TOTAL</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{sumCol(rows, 'estimatedExtensionAmount') ? fmt(sumCol(rows, 'estimatedExtensionAmount')) : '-'}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'prevLiability'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'prevROUClosing'))}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{''}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'pvFutureCashFlows'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'openingLiability'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'currentFinanceCost'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'liabilityAtRepDate'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'openingCost'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'additional'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'closingCost'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'openingAccumDep'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'depForYear'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'totalAccumDep'))}</TdTotal>
                <TdTotal>{fmt(sumCol(rows, 'carryingAmount'))}</TdTotal>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
          Values derived from {rows.length} contract(s) with sufficient data for the year ended 31 December {selectedYear}.
        </div>
      </div>
    </div>
  );
}
