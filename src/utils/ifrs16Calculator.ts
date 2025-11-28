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

  // Get RVG if reasonably certain
  const rvgExpected = leaseData.RVGExpected || 0;
  const rvgReasonablyCertain = leaseData.RVGReasonablyCertain || false;
  const rvgAmount = rvgReasonablyCertain ? rvgExpected : 0;

  // Calculate PV of lease payments
  let pv = 0;
  const isAdvance = paymentTiming === 'Advance';

  for (let i = 1; i <= periods; i++) {
    // Add RVG to the last payment period
    const periodPayment = (i === periods) ? paymentPerPeriod + rvgAmount : paymentPerPeriod;
    const discountFactor = isAdvance ?
      1 / Math.pow(1 + ratePerPeriod, i - 1) :
      1 / Math.pow(1 + ratePerPeriod, i);
    pv += periodPayment * discountFactor;
  }

  let initialLiability = Math.round(pv * 100) / 100;
  const idc = leaseData.InitialDirectCosts || 0;
  const prepayments = leaseData.PrepaymentsBeforeCommencement || 0;
  const incentives = leaseData.LeaseIncentives || 0;

  // If payment timing is Advance and there are prepayments, subtract prepayments from liability
  if (isAdvance && prepayments > 0) {
    initialLiability = Math.round((initialLiability - prepayments) * 100) / 100;
  }

  // Get asset valuation fields
  const fairValue = leaseData.FairValue || 0;
  const carryingAmount = leaseData.CarryingAmount || 0;
  const salesProceeds = leaseData.SalesProceeds || 0;

  // Logic 2 & 3: Adjust lease liability based on sales proceeds vs fair value
  if (fairValue > 0 && salesProceeds > 0) {
    if (salesProceeds < fairValue) {
      // Logic 2: Sales proceeds < Fair value -> deduct difference from liability
      const difference = fairValue - salesProceeds;
      initialLiability = Math.round((initialLiability - difference) * 100) / 100;
    } else if (salesProceeds > fairValue) {
      // Logic 3: Sales proceeds > Fair value -> add difference to liability
      const difference = salesProceeds - fairValue;
      initialLiability = Math.round((initialLiability + difference) * 100) / 100;
    }
  }

  // Calculate initial ROU
  let initialROU = initialLiability + idc + prepayments - incentives;

  // Logic 1: If fair value and carrying amount are set, recalculate ROU
  if (fairValue > 0 && carryingAmount > 0) {
    initialROU = Math.round((initialLiability / fairValue * carryingAmount) * 100) / 100;
  }

  // Generate schedules
  const cashflowSchedule = generateCashflowSchedule(leaseData, periods, rvgAmount);
  const amortizationSchedule = generateAmortizationSchedule(initialLiability, paymentPerPeriod, ratePerPeriod, periods, initialROU, rvgAmount);
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
    journalEntries,
    leaseTermYears: totalLeaseYears,
    nonCancellableYears: nonCancellableYears,
    renewalYears: renewalYears,
    terminationYears: terminationYears
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

function generateCashflowSchedule(leaseData: Partial<LeaseData>, periods: number, rvgAmount: number) {
  const schedule = [];
  const startDate = new Date(leaseData.CommencementDate || '2025-01-01');
  const paymentAmount = leaseData.FixedPaymentPerPeriod || 0;
  const frequency = leaseData.PaymentFrequency || 'Monthly';
  const monthsPerPeriod = 12 / getPeriodsPerYear(frequency);

  for (let i = 1; i <= periods; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + (i - 1) * monthsPerPeriod);

    // Add RVG to the last payment period
    const periodRent = (i === periods) ? paymentAmount + rvgAmount : paymentAmount;

    schedule.push({
      period: i,
      date: paymentDate.toISOString().split('T')[0],
      rent: periodRent
    });
  }

  return schedule;
}

function generateAmortizationSchedule(initialLiability: number, payment: number, rate: number, periods: number, initialROU: number, rvgAmount: number) {
  const schedule = [];
  let opening = initialLiability;
  let remainingAsset = initialROU;
  const depreciationPerPeriod = initialROU / periods;

  for (let i = 1; i <= periods; i++) {
    // Add RVG to the last payment period
    const periodPayment = (i === periods) ? payment + rvgAmount : payment;

    const interest = Math.round(opening * rate * 100) / 100;
    const principal = Math.round((periodPayment - interest) * 100) / 100;
    const closing = Math.round((opening - principal) * 100) / 100;
    const depreciation = Math.round(depreciationPerPeriod * 100) / 100;
    remainingAsset = Math.round((remainingAsset - depreciation) * 100) / 100;

    schedule.push({
      month: i,
      payment: periodPayment,
      interest: interest,
      principal: principal,
      remainingLiability: Math.max(0, closing),
      depreciation: depreciation,
      remainingAsset: Math.max(0, remainingAsset),
      sofpCurrLiab: 0,
      sofpNonCurrLiab: 0
    });

    opening = Math.max(0, closing);
  }

  // Calculate SOFP Current Liability (consecutive subtraction of remaining liability)
  // Y2-Y1, Y3-Y2, Y4-Y3, etc.
  for (let i = 0; i < schedule.length; i++) {
    if (i < schedule.length - 1) {
      const currentRemaining = schedule[i].remainingLiability;
      const nextRemaining = schedule[i + 1].remainingLiability;
      schedule[i].sofpCurrLiab = Math.round((currentRemaining - nextRemaining) * 100) / 100;
    } else {
      // For the last period, current liability is the remaining liability itself
      schedule[i].sofpCurrLiab = schedule[i].remainingLiability;
    }
  }

  // Calculate SOFP Non-Current Liability (next year's remaining liability)
  // Y1 = Y2, Y2 = Y3, Y3 = Y4, etc.
  for (let i = 0; i < schedule.length; i++) {
    if (i < schedule.length - 1) {
      schedule[i].sofpNonCurrLiab = schedule[i + 1].remainingLiability;
    } else {
      // For the last period, non-current liability is 0
      schedule[i].sofpNonCurrLiab = 0;
    }
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