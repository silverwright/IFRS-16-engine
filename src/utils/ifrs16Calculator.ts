import { LeaseData, CalculationResults } from '../context/LeaseContext';

export function calculateIFRS16(leaseData: Partial<LeaseData>): CalculationResults {
  // Ensure we have valid data with defaults
  const paymentPerPeriod = leaseData.FixedPaymentPerPeriod || 0;
  const nonCancellableYears = leaseData.NonCancellableYears || 0;
  const paymentFrequency = leaseData.PaymentFrequency || 'Monthly';
  const ibrAnnual = leaseData.IBR_Annual || 0.14;
  const paymentTiming = leaseData.PaymentTiming || 'Advance';

  // IFRS 16: Determine lease term based on termination and renewal options
  const renewalYears = leaseData.RenewalOptionYears || 0;
  const renewalLikelihood = leaseData.RenewalOptionLikelihood || 0;

  // Extract termination option point (years) from string field
  const terminationPointStr = leaseData.TerminationOptionPoint || '';
  const terminationYears = parseFloat(terminationPointStr) || 0;
  const terminationLikelihood = leaseData.TerminationOptionLikelihood || 0;

  let totalLeaseYears = nonCancellableYears;

  // Priority 1: If termination is reasonably certain (>0.5) and termination point is valid (>0),
  // use termination point years, ignoring both non-cancellable period and renewal options
  if (terminationYears > 0 && terminationLikelihood > 0.5) {
    totalLeaseYears = terminationYears;
  }
  // Priority 2: Otherwise, include renewal option if reasonably certain
  else if (renewalYears > 0 && renewalLikelihood >= 0.5) {
    totalLeaseYears = nonCancellableYears + renewalYears;
  }

  const periods = Math.round(totalLeaseYears * getPeriodsPerYear(paymentFrequency));
  const ratePerPeriod = Math.pow(1 + ibrAnnual, 1 / getPeriodsPerYear(paymentFrequency)) - 1;

  // Calculate PV of lease payments
  let pv = 0;
  const isAdvance = paymentTiming === 'Advance';
  
  for (let i = 1; i <= periods; i++) {
    const discountFactor = isAdvance ? 
      1 / Math.pow(1 + ratePerPeriod, i - 1) : 
      1 / Math.pow(1 + ratePerPeriod, i);
    pv += paymentPerPeriod * discountFactor;
  }

  const initialLiability = Math.round(pv * 100) / 100;
  const idc = leaseData.InitialDirectCosts || 0;
  const prepayments = leaseData.PrepaymentsBeforeCommencement || 0;
  const incentives = leaseData.LeaseIncentives || 0;
  const initialROU = initialLiability + idc + prepayments - incentives;

  // Generate schedules
  const cashflowSchedule = generateCashflowSchedule(leaseData, periods);
  const amortizationSchedule = generateAmortizationSchedule(initialLiability, paymentPerPeriod, ratePerPeriod, periods, initialROU);
  const depreciationSchedule = generateDepreciationSchedule(initialROU, periods);
  const journalEntries = generateJournalEntries(leaseData, initialLiability, initialROU, amortizationSchedule, depreciationSchedule);

  const totalInterest = amortizationSchedule.reduce((sum, row) => sum + (row.interest || 0), 0);
  const totalDepreciation = depreciationSchedule.reduce((sum, row) => sum + (row.depreciation || 0), 0);

  return {
    initialLiability,
    initialROU,
    totalInterest,
    totalDepreciation,
    cashflowSchedule,
    amortizationSchedule,
    depreciationSchedule,
    journalEntries
  };
}

function getPeriodsPerYear(frequency: string): number {
  const map: { [key: string]: number } = {
    'Monthly': 12,
    'Quarterly': 4,
    'Semiannual': 2,
    'Annual': 1
  };
  return map[frequency] || 12;
}

function generateCashflowSchedule(leaseData: Partial<LeaseData>, periods: number) {
  const schedule = [];
  const startDate = new Date(leaseData.CommencementDate || '2025-01-01');
  const paymentAmount = leaseData.FixedPaymentPerPeriod || 0;
  const frequency = leaseData.PaymentFrequency || 'Monthly';
  const monthsPerPeriod = 12 / getPeriodsPerYear(frequency);

  for (let i = 1; i <= periods; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + (i - 1) * monthsPerPeriod);
    
    schedule.push({
      period: i,
      date: paymentDate.toISOString().split('T')[0],
      rent: paymentAmount
    });
  }

  return schedule;
}

function generateAmortizationSchedule(initialLiability: number, payment: number, rate: number, periods: number, initialROU: number) {
  const schedule = [];
  let opening = initialLiability;
  let remainingAsset = initialROU;
  const depreciationPerPeriod = initialROU / periods;

  for (let i = 1; i <= periods; i++) {
    const interest = Math.round(opening * rate * 100) / 100;
    const principal = Math.round((payment - interest) * 100) / 100;
    const closing = Math.round((opening - principal) * 100) / 100;
    const depreciation = Math.round(depreciationPerPeriod * 100) / 100;
    remainingAsset = Math.round((remainingAsset - depreciation) * 100) / 100;

    schedule.push({
      month: i,
      payment: payment,
      interest: interest,
      principal: principal,
      remainingLiability: Math.max(0, closing),
      depreciation: depreciation,
      remainingAsset: Math.max(0, remainingAsset)
    });

    opening = Math.max(0, closing);
  }

  return schedule;
}

function generateDepreciationSchedule(initialROU: number, periods: number) {
  const depreciationPerPeriod = initialROU / periods;
  const schedule = [];

  for (let i = 1; i <= periods; i++) {
    schedule.push({
      period: i,
      depreciation: Math.round(depreciationPerPeriod * 100) / 100
    });
  }

  return schedule;
}

function generateJournalEntries(leaseData: Partial<LeaseData>, liability: number, rou: number, amort: any[], dep: any[]) {
  const entries = [];
  const commenceDate = leaseData.CommencementDate || '2025-01-01';
  const currency = leaseData.Currency || 'NGN';

  // Initial recognition
  entries.push(
    {
      date: commenceDate,
      account: 'Right-of-use asset',
      dr: rou,
      cr: 0,
      memo: 'Initial recognition of ROU asset',
      currency: currency
    },
    {
      date: commenceDate,
      account: 'Lease liability',
      dr: 0,
      cr: liability,
      memo: 'Initial recognition of lease liability',
      currency: currency
    }
  );

  // Add first few periodic entries as examples
  if (amort.length > 0) {
    const firstPeriod = amort[0];
    const secondMonth = new Date(commenceDate);
    secondMonth.setMonth(secondMonth.getMonth() + 1);
    
    entries.push(
      {
        date: secondMonth.toISOString().split('T')[0],
        account: 'Interest expense (lease)',
        dr: firstPeriod.interest || 0,
        cr: 0,
        memo: 'Monthly interest expense',
        currency: currency
      },
      {
        date: secondMonth.toISOString().split('T')[0],
        account: 'Lease liability',
        dr: firstPeriod.principal || 0,
        cr: 0,
        memo: 'Principal reduction',
        currency: currency
      },
      {
        date: secondMonth.toISOString().split('T')[0],
        account: 'Cash',
        dr: 0,
        cr: firstPeriod.payment || 0,
        memo: 'Lease payment',
        currency: currency
      },
      {
        date: secondMonth.toISOString().split('T')[0],
        account: 'Depreciation expense',
        dr: firstPeriod.depreciation || 0,
        cr: 0,
        memo: 'Monthly depreciation',
        currency: currency
      },
      {
        date: secondMonth.toISOString().split('T')[0],
        account: 'Accumulated depreciation - ROU asset',
        dr: 0,
        cr: firstPeriod.depreciation || 0,
        memo: 'Accumulated depreciation',
        currency: currency
      }
    );
  }

  return entries;
}