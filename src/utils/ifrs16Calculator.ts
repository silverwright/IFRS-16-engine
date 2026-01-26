import { LeaseData, CalculationResults } from '../context/LeaseContext';

/**
 * Calculate lease with modification (Amendment)
 * This creates a merged schedule using originalTerms before modification date
 * and modifiedTerms from modification date onwards
 */
function calculateWithModification(leaseData: Partial<LeaseData>): CalculationResults {
  const { originalTerms, modifiedTerms, modificationDate, CommencementDate } = leaseData;

  if (!originalTerms || !modifiedTerms || !modificationDate) {
    throw new Error('Missing modification metadata');
  }

  // Calculate the modification period (when the change takes effect)
  const commenceDate = new Date(CommencementDate || originalTerms.CommencementDate || '2025-01-01');
  const modDate = new Date(modificationDate);

  const paymentFrequency = originalTerms.PaymentFrequency || 'Monthly';
  const periodsPerYear = getPeriodsPerYear(paymentFrequency);

  // Calculate how many periods elapsed from commencement to modification
  const yearsElapsed = (modDate.getTime() - commenceDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const modificationPeriod = Math.floor(yearsElapsed * periodsPerYear);

  // Step 1: Calculate the original lease up to modification date
  const originalCalc = calculateIFRS16WithTerms(originalTerms);

  // Step 2: Extract preserved periods (periods 1 to modificationPeriod)
  const preservedSchedule = originalCalc.amortizationSchedule.slice(0, modificationPeriod);
  const preservedCashflow = originalCalc.cashflowSchedule.slice(0, modificationPeriod);

  // Get the ending balances at modification date
  const lastPreservedPeriod = preservedSchedule[preservedSchedule.length - 1] || {
    remainingLiability: originalCalc.initialLiability,
    remainingAsset: originalCalc.initialROU
  };

  const liabilityAtModification = lastPreservedPeriod.remainingLiability;
  const rouAtModification = lastPreservedPeriod.remainingAsset;

  // Step 3: Calculate remaining lease with modified terms
  // Determine remaining lease term
  const totalOriginalYears = originalCalc.leaseTermYears;
  const remainingYears = Math.max(0, totalOriginalYears - yearsElapsed);
  const remainingPeriods = Math.max(1, Math.round(remainingYears * periodsPerYear));

  // Use modified payment and IBR
  const modifiedPayment = modifiedTerms.FixedPaymentPerPeriod || originalTerms.FixedPaymentPerPeriod || 0;
  const modifiedIBR = modifiedTerms.IBR_Annual || originalTerms.IBR_Annual || 0.14;
  const modifiedRatePerPeriod = Math.pow(1 + modifiedIBR, 1 / periodsPerYear) - 1;
  const isAdvance = (modifiedTerms.PaymentTiming || originalTerms.PaymentTiming) === 'Advance';

  // IFRS 16 Remeasurement: Calculate new lease liability from modification date
  let newLiability = 0;
  for (let i = 1; i <= remainingPeriods; i++) {
    const discountFactor = isAdvance ?
      1 / Math.pow(1 + modifiedRatePerPeriod, i - 1) :
      1 / Math.pow(1 + modifiedRatePerPeriod, i);
    newLiability += modifiedPayment * discountFactor;
  }
  newLiability = Math.round(newLiability * 100) / 100;

  // Adjust ROU Asset by the change in lease liability (IFRS 16.44)
  const liabilityAdjustment = newLiability - liabilityAtModification;
  const newROU = rouAtModification + liabilityAdjustment;

  // Step 4: Generate new amortization schedule for remaining periods
  const newSchedule = generateAmortizationSchedule(
    newLiability,
    modifiedPayment,
    modifiedRatePerPeriod,
    remainingPeriods,
    newROU,
    0, // RVG handled separately if needed
    false,
    0
  );

  // Renumber the new schedule to continue from modification period
  const adjustedNewSchedule = newSchedule.map((row, index) => ({
    ...row,
    month: modificationPeriod + index + 1
  }));

  // Generate new cashflow schedule for remaining periods
  const newCashflow = [];
  const monthsPerPeriod = 12 / periodsPerYear;
  for (let i = 1; i <= remainingPeriods; i++) {
    const paymentDate = new Date(modDate);
    paymentDate.setMonth(modDate.getMonth() + (i - 1) * monthsPerPeriod);

    newCashflow.push({
      period: modificationPeriod + i,
      date: paymentDate.toISOString().split('T')[0],
      rent: modifiedPayment
    });
  }

  // Step 5: Merge preserved and new schedules
  const mergedAmortization = [...preservedSchedule, ...adjustedNewSchedule];
  const mergedCashflow = [...preservedCashflow, ...newCashflow];

  // Calculate totals
  const totalInterest = mergedAmortization.reduce((sum, row) => sum + (row.interest || 0), 0);
  const totalDepreciation = mergedAmortization.reduce((sum, row) => sum + (row.depreciation || 0), 0);

  return {
    initialLiability: originalCalc.initialLiability,
    initialROU: originalCalc.initialROU,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalDepreciation: Math.round(totalDepreciation * 100) / 100,
    cashflowSchedule: mergedCashflow,
    amortizationSchedule: mergedAmortization,
    depreciationSchedule: mergedAmortization.map(row => ({
      period: row.month,
      depreciation: row.depreciation
    })),
    journalEntries: generateJournalEntries(
      leaseData,
      originalCalc.initialLiability,
      originalCalc.initialROU,
      mergedAmortization,
      mergedAmortization
    ),
    leaseTermYears: originalCalc.leaseTermYears,
    nonCancellableYears: originalCalc.nonCancellableYears,
    renewalYears: originalCalc.renewalYears,
    terminationYears: originalCalc.terminationYears
  };
}

/**
 * Helper function to calculate IFRS16 with specific terms
 * Used for calculating original terms in modification scenarios
 */
function calculateIFRS16WithTerms(terms: Partial<LeaseData>): CalculationResults {
  // Call the main calculation function recursively but with the specific terms
  // Make sure to not have modification flags to avoid infinite recursion
  const cleanTerms = { ...terms };
  delete cleanTerms.hasModification;
  delete cleanTerms.modificationDate;
  delete cleanTerms.originalTerms;
  delete cleanTerms.modifiedTerms;
  delete cleanTerms.modificationHistory;

  return calculateIFRS16(cleanTerms);
}

export function calculateIFRS16(leaseData: Partial<LeaseData>): CalculationResults {
  // Check if this contract has a modification (Amendment)
  if (leaseData.hasModification && leaseData.originalTerms && leaseData.modifiedTerms && leaseData.modificationDate) {
    return calculateWithModification(leaseData);
  }

  // Standard calculation (no modification)
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
  const terminationInputYears = parseFloat(terminationPointStr) || 0;
  const terminationLikelihood = leaseData.TerminationOptionLikelihood || 0;

  // Termination years = termination input + non-cancellable years
  const terminationYears = terminationInputYears > 0 ? terminationInputYears + nonCancellableYears : 0;

  let totalLeaseYears = nonCancellableYears;

  // Priority 1: If termination is reasonably certain (>=0.5) and termination input is valid (>0),
  // use termination years (termination input + non-cancellable), ignoring renewal options
  if (terminationInputYears > 0 && terminationLikelihood >= 0.5) {
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
  const prepayments = leaseData.PrepaymentsBeforeCommencement || 0;

  // If payment timing is Advance and there are prepayments, exclude first payment from PV calculation
  const startPeriod = (isAdvance && prepayments > 0) ? 2 : 1;

  for (let i = startPeriod; i <= periods; i++) {
    // Add RVG to the last payment period
    const periodPayment = (i === periods) ? paymentPerPeriod + rvgAmount : paymentPerPeriod;
    const discountFactor = isAdvance ?
      1 / Math.pow(1 + ratePerPeriod, i - 1) :
      1 / Math.pow(1 + ratePerPeriod, i);
    pv += periodPayment * discountFactor;
  }

  let initialLiability = Math.round(pv * 100) / 100;
  const idc = leaseData.InitialDirectCosts || 0;
  const incentives = leaseData.LeaseIncentives || 0;

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
  const amortizationSchedule = generateAmortizationSchedule(
    initialLiability,
    paymentPerPeriod,
    ratePerPeriod,
    periods,
    initialROU,
    rvgAmount,
    isAdvance && prepayments > 0,
    prepayments
  );
  const depreciationSchedule = generateDepreciationSchedule(initialROU, periods);
  const journalEntries = generateJournalEntries(leaseData, initialLiability, initialROU, amortizationSchedule, depreciationSchedule);

  const totalInterest = amortizationSchedule.reduce((sum, row) => sum + (row.interest || 0), 0);
  const totalDepreciation = Math.round(depreciationSchedule.reduce((sum, row) => sum + (row.depreciation || 0), 0) * 100) / 100;

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

function generateAmortizationSchedule(
  initialLiability: number,
  payment: number,
  rate: number,
  periods: number,
  initialROU: number,
  rvgAmount: number,
  hasPrepayment: boolean = false,
  prepaymentAmount: number = 0
) {
  const schedule = [];
  let opening = initialLiability;
  let remainingAsset = initialROU;
  const depreciationPerPeriod = initialROU / periods;

  // For prepayment: amortization starts from cash flow 2, so Year 1 = CF 2, Year 19 = CF 20, Year 20 = no payment
  const cashFlowStart = hasPrepayment ? 2 : 1;

  for (let i = 1; i <= periods; i++) {
    const cashFlowIndex = hasPrepayment ? i + 1 : i;

    // Payment: 0 for Year 20 when prepayment, otherwise normal payment
    // Add RVG to cash flow 20 (which is Year 19 in the table when prepayment)
    let periodPayment: number;
    if (hasPrepayment && i === periods) {
      periodPayment = 0; // Year 20 has no payment
    } else if (hasPrepayment && i === periods - 1) {
      periodPayment = payment + rvgAmount; // Year 19 = CF 20 with RVG
    } else if (!hasPrepayment && i === periods) {
      periodPayment = payment + rvgAmount; // Year 20 = CF 20 with RVG (no prepayment)
    } else {
      periodPayment = payment;
    }

    // Normal calculation for all periods
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
