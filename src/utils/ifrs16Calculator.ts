/**
 * IFRS 16 Lease Accounting Calculator
 *
 * This module implements the core IFRS 16 lease accounting calculations.
 * It handles initial recognition, amortization schedules, depreciation,
 * and lease modifications (amendments).
 *
 * Key IFRS 16 Concepts:
 * - Initial Recognition: Lease liability and Right-of-Use (ROU) asset at commencement
 * - Lease Liability: Present value of future lease payments
 * - ROU Asset: Lease liability + initial direct costs + prepayments - incentives
 * - Subsequent Measurement: Interest on liability + depreciation of ROU asset
 * - Lease Modifications: Remeasurement of liability and adjustment to ROU asset
 */

import { LeaseData, CalculationResults } from '../context/LeaseContext';

/* ================================================================================
 * MAIN CALCULATION FUNCTIONS
 * ================================================================================ */

/**
 * Main IFRS 16 calculation function
 *
 * This function determines the appropriate calculation method based on whether
 * the lease has been modified (amended) or is a standard lease.
 *
 * @param leaseData - Complete lease data including terms, payments, and options
 * @returns Calculation results including liability, ROU asset, schedules, and journal entries
 *
 * @example
 * const results = calculateIFRS16({
 *   FixedPaymentPerPeriod: 10000,
 *   NonCancellableYears: 5,
 *   PaymentFrequency: 'Monthly',
 *   IBR_Annual: 0.14,
 *   PaymentTiming: 'Advance'
 * });
 */
export function calculateIFRS16(leaseData: Partial<LeaseData>): CalculationResults {
  // Check if this contract has a modification (Amendment per IFRS 16.44)
  if (leaseData.hasModification && leaseData.originalTerms && leaseData.modifiedTerms && leaseData.modificationDate) {
    return calculateWithModification(leaseData);
  }

  // Standard calculation (no modification)
  return calculateStandardLease(leaseData);
}

/**
 * Calculate standard IFRS 16 lease (no modifications)
 *
 * This function performs the complete IFRS 16 calculation for a standard lease:
 * 1. Determine lease term (considering renewal and termination options)
 * 2. Calculate present value of lease payments (lease liability)
 * 3. Calculate initial ROU asset
 * 4. Generate amortization, depreciation, and cashflow schedules
 * 5. Generate journal entries
 *
 * @param leaseData - Lease data with payment terms and options
 * @returns Complete calculation results
 */
function calculateStandardLease(leaseData: Partial<LeaseData>): CalculationResults {
  // Extract lease terms with default values
  const paymentPerPeriod = leaseData.FixedPaymentPerPeriod || 0;
  const nonCancellableYears = leaseData.NonCancellableYears || 0;
  const paymentFrequency = leaseData.PaymentFrequency || 'Monthly';
  const ibrAnnual = leaseData.IBR_Annual || 0.14; // Incremental Borrowing Rate
  const paymentTiming = leaseData.PaymentTiming || 'Advance';

  /* ============================================================================
   * STEP 1: Determine Lease Term (IFRS 16.18-19)
   *
   * Lease term includes:
   * - Non-cancellable period (always included)
   * - Renewal periods (if reasonably certain to exercise)
   * - Periods covered by termination option (if reasonably certain NOT to exercise)
   *
   * Priority Logic:
   * 1. If termination is reasonably certain (≥50%), use termination years
   * 2. Otherwise, if renewal is reasonably certain (≥50%), add renewal years
   * 3. Otherwise, use only non-cancellable period
   * ============================================================================ */
  const renewalYears = leaseData.RenewalOptionYears || 0;
  const renewalLikelihood = leaseData.RenewalOptionLikelihood || 0;

  // Extract termination option point (years after non-cancellable period)
  const terminationPointStr = leaseData.TerminationOptionPoint || '';
  const terminationInputYears = parseFloat(terminationPointStr) || 0;
  const terminationLikelihood = leaseData.TerminationOptionLikelihood || 0;

  // Total termination years = non-cancellable + termination point
  const terminationYears = terminationInputYears > 0 ? terminationInputYears + nonCancellableYears : 0;

  let totalLeaseYears = nonCancellableYears;

  // Priority 1: If termination is reasonably certain (≥50%) and termination input is valid (>0),
  // use termination years, ignoring renewal options
  if (terminationInputYears > 0 && terminationLikelihood >= 0.5) {
    totalLeaseYears = terminationYears;
  }
  // Priority 2: Otherwise, include renewal option if reasonably certain
  else if (renewalYears > 0 && renewalLikelihood >= 0.5) {
    totalLeaseYears = nonCancellableYears + renewalYears;
  }

  /* ============================================================================
   * STEP 2: Calculate Lease Liability (IFRS 16.26)
   *
   * Lease liability = Present Value of:
   * - Fixed lease payments (less any lease incentives receivable)
   * - Variable payments based on index/rate (using index/rate at commencement)
   * - Residual value guarantees expected to be payable
   * - Exercise price of purchase option (if reasonably certain)
   * - Termination penalties (if lease term reflects exercising termination)
   *
   * Discount Rate: Incremental Borrowing Rate (IBR)
   * ============================================================================ */
  const periods = Math.round(totalLeaseYears * getPeriodsPerYear(paymentFrequency));
  const ratePerPeriod = Math.pow(1 + ibrAnnual, 1 / getPeriodsPerYear(paymentFrequency)) - 1;

  // Residual Value Guarantee (included if reasonably certain)
  const rvgExpected = leaseData.RVGExpected || 0;
  const rvgReasonablyCertain = leaseData.RVGReasonablyCertain || false;
  const rvgAmount = rvgReasonablyCertain ? rvgExpected : 0;

  // Calculate present value of lease payments
  let pv = 0;
  const isAdvance = paymentTiming === 'Advance';
  const prepayments = leaseData.PrepaymentsBeforeCommencement || 0;

  // If payment timing is Advance and there are prepayments,
  // exclude first payment from PV calculation (it's paid upfront)
  const startPeriod = (isAdvance && prepayments > 0) ? 2 : 1;

  for (let i = startPeriod; i <= periods; i++) {
    // Add RVG to the last payment period
    const periodPayment = (i === periods) ? paymentPerPeriod + rvgAmount : paymentPerPeriod;

    // Discount factor depends on payment timing:
    // - Advance: discounted from period i-1 (payment at start of period)
    // - Arrears: discounted from period i (payment at end of period)
    const discountFactor = isAdvance ?
      1 / Math.pow(1 + ratePerPeriod, i - 1) :
      1 / Math.pow(1 + ratePerPeriod, i);

    pv += periodPayment * discountFactor;
  }

  let initialLiability = Math.round(pv * 100) / 100;

  /* ============================================================================
   * STEP 3: Adjust Lease Liability for Sale-Leaseback Transactions
   *
   * Special logic for sale-leaseback where sales proceeds differ from fair value:
   * - If sales proceeds < fair value: Deduct difference from liability
   * - If sales proceeds > fair value: Add difference to liability
   * ============================================================================ */
  const fairValue = leaseData.FairValue || 0;
  const salesProceeds = leaseData.SalesProceeds || 0;

  if (fairValue > 0 && salesProceeds > 0) {
    if (salesProceeds < fairValue) {
      // Sales proceeds < Fair value -> deduct difference from liability
      const difference = fairValue - salesProceeds;
      initialLiability = Math.round((initialLiability - difference) * 100) / 100;
    } else if (salesProceeds > fairValue) {
      // Sales proceeds > Fair value -> add difference to liability
      const difference = salesProceeds - fairValue;
      initialLiability = Math.round((initialLiability + difference) * 100) / 100;
    }
  }

  /* ============================================================================
   * STEP 4: Calculate Initial ROU Asset (IFRS 16.24)
   *
   * ROU Asset = Lease Liability
   *           + Initial Direct Costs
   *           + Prepayments made before commencement
   *           - Lease Incentives received
   *
   * Special case: Sale-leaseback with carrying amount
   * ROU Asset = (Lease Liability / Fair Value) × Carrying Amount
   * ============================================================================ */
  const idc = leaseData.InitialDirectCosts || 0;
  const incentives = leaseData.LeaseIncentives || 0;
  const carryingAmount = leaseData.CarryingAmount || 0;

  // Standard ROU calculation
  let initialROU = initialLiability + idc + prepayments - incentives;

  // Special case: Sale-leaseback with carrying amount
  // This proportionally allocates the carrying amount based on lease liability
  if (fairValue > 0 && carryingAmount > 0) {
    initialROU = Math.round((initialLiability / fairValue * carryingAmount) * 100) / 100;
  }

  /* ============================================================================
   * STEP 5: Generate Schedules and Journal Entries
   * ============================================================================ */
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
  const journalEntries = generateJournalEntries(
    leaseData,
    initialLiability,
    initialROU,
    amortizationSchedule,
    depreciationSchedule
  );

  // Calculate totals
  const totalInterest = amortizationSchedule.reduce((sum, row) => sum + (row.interest || 0), 0);
  const totalDepreciation = Math.round(
    depreciationSchedule.reduce((sum, row) => sum + (row.depreciation || 0), 0) * 100
  ) / 100;

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

/* ================================================================================
 * LEASE MODIFICATION (AMENDMENT) FUNCTIONS
 * ================================================================================ */

/**
 * Calculate lease with modification (IFRS 16.44-46)
 *
 * When a lease is modified (terms change), IFRS 16 requires:
 * 1. Preserve the original schedule up to the modification date
 * 2. Remeasure the lease liability using modified terms and revised discount rate
 * 3. Adjust the ROU asset by the change in lease liability
 * 4. Continue with new amortization schedule for remaining periods
 *
 * This creates a merged schedule:
 * - Periods 1 to N: Original terms (preserved)
 * - Periods N+1 to end: Modified terms (remeasured)
 *
 * @param leaseData - Lease data including original terms, modified terms, and modification date
 * @returns Merged calculation results reflecting the modification
 */
function calculateWithModification(leaseData: Partial<LeaseData>): CalculationResults {
  const { originalTerms, modifiedTerms, modificationDate, CommencementDate } = leaseData;

  if (!originalTerms || !modifiedTerms || !modificationDate) {
    throw new Error('Missing modification metadata');
  }

  /* ============================================================================
   * STEP 1: Calculate Modification Period
   * Determine how many periods elapsed from commencement to modification
   * ============================================================================ */
  const commenceDate = new Date(CommencementDate || originalTerms.CommencementDate || '2025-01-01');
  const modDate = new Date(modificationDate);

  const paymentFrequency = originalTerms.PaymentFrequency || 'Monthly';
  const periodsPerYear = getPeriodsPerYear(paymentFrequency);

  // Calculate periods elapsed = (years elapsed) × (periods per year)
  const yearsElapsed = (modDate.getTime() - commenceDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const modificationPeriod = Math.floor(yearsElapsed * periodsPerYear);

  /* ============================================================================
   * STEP 2: Calculate Original Lease and Extract Preserved Periods
   * ============================================================================ */
  const originalCalc = calculateIFRS16WithTerms(originalTerms);

  // Preserve periods 1 to modificationPeriod (these don't change)
  const preservedSchedule = originalCalc.amortizationSchedule.slice(0, modificationPeriod);
  const preservedCashflow = originalCalc.cashflowSchedule.slice(0, modificationPeriod);

  // Get ending balances at modification date
  const lastPreservedPeriod = preservedSchedule[preservedSchedule.length - 1] || {
    remainingLiability: originalCalc.initialLiability,
    remainingAsset: originalCalc.initialROU
  };

  const liabilityAtModification = lastPreservedPeriod.remainingLiability;
  const rouAtModification = lastPreservedPeriod.remainingAsset;

  /* ============================================================================
   * STEP 3: Remeasure Lease Liability with Modified Terms (IFRS 16.44)
   *
   * Calculate new lease liability for remaining periods using:
   * - Modified payment amount
   * - Modified discount rate (IBR)
   * - Remaining lease term
   * ============================================================================ */
  const totalOriginalYears = originalCalc.leaseTermYears;
  const remainingYears = Math.max(0, totalOriginalYears - yearsElapsed);
  const remainingPeriods = Math.max(1, Math.round(remainingYears * periodsPerYear));

  const modifiedPayment = modifiedTerms.FixedPaymentPerPeriod || originalTerms.FixedPaymentPerPeriod || 0;
  const modifiedIBR = modifiedTerms.IBR_Annual || originalTerms.IBR_Annual || 0.14;
  const modifiedRatePerPeriod = Math.pow(1 + modifiedIBR, 1 / periodsPerYear) - 1;
  const isAdvance = (modifiedTerms.PaymentTiming || originalTerms.PaymentTiming) === 'Advance';

  // Calculate remeasured lease liability
  let newLiability = 0;
  for (let i = 1; i <= remainingPeriods; i++) {
    const discountFactor = isAdvance ?
      1 / Math.pow(1 + modifiedRatePerPeriod, i - 1) :
      1 / Math.pow(1 + modifiedRatePerPeriod, i);
    newLiability += modifiedPayment * discountFactor;
  }
  newLiability = Math.round(newLiability * 100) / 100;

  /* ============================================================================
   * STEP 4: Adjust ROU Asset (IFRS 16.44(a))
   *
   * ROU Asset adjustment = Change in lease liability
   * New ROU = Old ROU at modification + (New Liability - Old Liability)
   * ============================================================================ */
  const liabilityAdjustment = newLiability - liabilityAtModification;
  const newROU = rouAtModification + liabilityAdjustment;

  /* ============================================================================
   * STEP 5: Generate New Amortization Schedule for Remaining Periods
   * ============================================================================ */
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

  // Renumber periods to continue from modification period
  const adjustedNewSchedule = newSchedule.map((row, index) => ({
    ...row,
    month: modificationPeriod + index + 1
  }));

  /* ============================================================================
   * STEP 6: Generate New Cashflow Schedule for Remaining Periods
   * ============================================================================ */
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

  /* ============================================================================
   * STEP 7: Merge Preserved and New Schedules
   * ============================================================================ */
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
 * Helper function to calculate IFRS 16 with specific terms
 *
 * Used internally for calculating original terms in modification scenarios.
 * Strips out modification flags to avoid infinite recursion.
 *
 * @param terms - Lease terms to calculate
 * @returns Calculation results for the given terms
 */
function calculateIFRS16WithTerms(terms: Partial<LeaseData>): CalculationResults {
  // Create a clean copy without modification flags
  const cleanTerms = { ...terms };
  delete cleanTerms.hasModification;
  delete cleanTerms.modificationDate;
  delete cleanTerms.originalTerms;
  delete cleanTerms.modifiedTerms;
  delete cleanTerms.modificationHistory;

  return calculateIFRS16(cleanTerms);
}

/* ================================================================================
 * HELPER FUNCTIONS
 * ================================================================================ */

/**
 * Convert payment frequency to periods per year
 *
 * @param frequency - Payment frequency (Monthly, Quarterly, Semiannual, Annual)
 * @returns Number of periods per year
 *
 * @example
 * getPeriodsPerYear('Monthly') // Returns 12
 * getPeriodsPerYear('Quarterly') // Returns 4
 */
function getPeriodsPerYear(frequency: string): number {
  const map: { [key: string]: number } = {
    'Monthly': 12,
    'Quarterly': 4,
    'Semiannual': 2,
    'Annual': 1
  };
  return map[frequency] || 12; // Default to monthly
}

/* ================================================================================
 * SCHEDULE GENERATION FUNCTIONS
 * ================================================================================ */

/**
 * Generate cashflow schedule showing payment dates and amounts
 *
 * Creates a schedule of all lease payments throughout the lease term,
 * including the residual value guarantee in the final payment.
 *
 * @param leaseData - Lease data with payment details
 * @param periods - Total number of payment periods
 * @param rvgAmount - Residual value guarantee amount (added to last payment)
 * @returns Array of cashflow entries with period, date, and rent amount
 */
function generateCashflowSchedule(
  leaseData: Partial<LeaseData>,
  periods: number,
  rvgAmount: number
) {
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

/**
 * Generate amortization schedule for lease liability and ROU asset
 *
 * This is the core schedule showing how the lease liability decreases and
 * ROU asset depreciates over time. Each period shows:
 * - Payment amount
 * - Interest expense (liability × rate)
 * - Principal reduction (payment - interest)
 * - Remaining lease liability
 * - Depreciation expense (straight-line)
 * - Remaining ROU asset
 * - Statement of Financial Position (SOFP) current and non-current liability split
 *
 * @param initialLiability - Initial lease liability
 * @param payment - Fixed payment per period
 * @param rate - Discount rate per period
 * @param periods - Total number of periods
 * @param initialROU - Initial ROU asset value
 * @param rvgAmount - Residual value guarantee (added to last payment)
 * @param hasPrepayment - Whether lease has prepayment (affects amortization start)
 * @param prepaymentAmount - Amount of prepayment
 * @returns Amortization schedule array
 */
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

  // ROU asset depreciated straight-line over lease term
  const depreciationPerPeriod = initialROU / periods;

  for (let i = 1; i <= periods; i++) {
    /* ========================================================================
     * Payment Calculation
     *
     * Special handling for prepayments:
     * - When prepayment exists, first payment is already paid
     * - Amortization table shows years 1-20 but cashflows 2-21
     * - Year 20 has $0 payment (cashflow 21 doesn't exist)
     * - Year 19 gets the RVG (corresponds to cashflow 20)
     * ======================================================================== */
    let periodPayment: number;

    if (hasPrepayment && i === periods) {
      // Last period with prepayment: no payment
      periodPayment = 0;
    } else if (hasPrepayment && i === periods - 1) {
      // Second-to-last period with prepayment: normal payment + RVG
      periodPayment = payment + rvgAmount;
    } else if (!hasPrepayment && i === periods) {
      // Last period without prepayment: normal payment + RVG
      periodPayment = payment + rvgAmount;
    } else {
      // All other periods: normal payment
      periodPayment = payment;
    }

    /* ========================================================================
     * Interest and Principal Calculation (Effective Interest Method)
     *
     * Interest Expense = Opening Liability × Periodic Rate
     * Principal Reduction = Payment - Interest
     * Closing Liability = Opening Liability - Principal
     * ======================================================================== */
    const interest = Math.round(opening * rate * 100) / 100;
    const principal = Math.round((periodPayment - interest) * 100) / 100;
    const closing = Math.round((opening - principal) * 100) / 100;

    /* ========================================================================
     * Depreciation Calculation (Straight-line Method)
     *
     * ROU asset is depreciated on a straight-line basis over the lease term
     * unless another systematic basis is more representative.
     * ======================================================================== */
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
      sofpCurrLiab: 0, // Calculated below
      sofpNonCurrLiab: 0 // Calculated below
    });

    opening = Math.max(0, closing);
  }

  /* ==========================================================================
   * Calculate Statement of Financial Position (SOFP) Liability Split
   *
   * IFRS 16 requires splitting lease liability into:
   * - Current Liability: Portion due within 12 months
   * - Non-Current Liability: Portion due after 12 months
   *
   * Current Liability = This Year's Remaining - Next Year's Remaining
   * Non-Current Liability = Next Year's Remaining Liability
   * ========================================================================== */
  for (let i = 0; i < schedule.length; i++) {
    if (i < schedule.length - 1) {
      // Current liability = principal paid in next 12 months
      const currentRemaining = schedule[i].remainingLiability;
      const nextRemaining = schedule[i + 1].remainingLiability;
      schedule[i].sofpCurrLiab = Math.round((currentRemaining - nextRemaining) * 100) / 100;

      // Non-current liability = remaining after next 12 months
      schedule[i].sofpNonCurrLiab = schedule[i + 1].remainingLiability;
    } else {
      // Last period: all remaining liability is current
      schedule[i].sofpCurrLiab = schedule[i].remainingLiability;
      schedule[i].sofpNonCurrLiab = 0;
    }
  }

  return schedule;
}

/**
 * Generate depreciation schedule for ROU asset
 *
 * Creates a simple schedule showing straight-line depreciation
 * of the ROU asset over the lease term.
 *
 * @param initialROU - Initial ROU asset value
 * @param periods - Total number of periods
 * @returns Depreciation schedule array
 */
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

/**
 * Generate journal entries for lease accounting
 *
 * Creates sample journal entries showing:
 * 1. Initial recognition (ROU asset and lease liability)
 * 2. First period's subsequent measurement (interest, payment, depreciation)
 *
 * Note: This generates sample entries for the first period.
 * In practice, these entries repeat monthly/quarterly throughout the lease term.
 *
 * @param leaseData - Lease data
 * @param liability - Initial lease liability
 * @param rou - Initial ROU asset
 * @param amort - Amortization schedule
 * @param dep - Depreciation schedule
 * @returns Array of journal entries
 */
function generateJournalEntries(
  leaseData: Partial<LeaseData>,
  liability: number,
  rou: number,
  amort: any[],
  dep: any[]
) {
  const entries = [];
  const commenceDate = leaseData.CommencementDate || '2025-01-01';
  const currency = leaseData.Currency || 'NGN';
  const monthsPerPeriod = Math.round(12 / getPeriodsPerYear(leaseData.PaymentFrequency || 'Monthly'));

  const idc = leaseData.InitialDirectCosts || 0;
  const prepayments = leaseData.PrepaymentsBeforeCommencement || 0;
  const incentives = leaseData.LeaseIncentivesReceived || 0;

  // Derive a date one day before commencement for pre-commencement entries
  const preDateObj = new Date(commenceDate);
  preDateObj.setDate(preDateObj.getDate() - 1);
  const preDate = preDateObj.toISOString().split('T')[0];

  /* ==========================================================================
   * PRE-COMMENCEMENT ENTRIES (only when values are non-zero)
   * ========================================================================== */

  // If prepayment was made before commencement:
  // Dr. Prepaid lease expense   XXX
  //   Cr. Cash                      XXX
  if (prepayments > 0) {
    entries.push(
      {
        date: preDate,
        account: 'Prepaid lease expense',
        dr: prepayments,
        cr: 0,
        memo: 'Prepayment made before lease commencement',
        currency
      },
      {
        date: preDate,
        account: 'Cash',
        dr: 0,
        cr: prepayments,
        memo: 'Cash paid for lease prepayment',
        currency
      }
    );
  }

  // If initial direct costs were incurred:
  // Dr. Right-of-use asset (IDC)   XXX
  //   Cr. Cash / Accrued expenses      XXX
  if (idc > 0) {
    entries.push(
      {
        date: preDate,
        account: 'Right-of-use asset',
        dr: idc,
        cr: 0,
        memo: 'Initial direct costs capitalised into ROU asset',
        currency
      },
      {
        date: preDate,
        account: 'Cash',
        dr: 0,
        cr: idc,
        memo: 'Cash paid for initial direct costs',
        currency
      }
    );
  }

  /* ==========================================================================
   * JOURNAL ENTRY: Initial Recognition at Commencement Date
   *
   * Dr. Right-of-use asset          [liability + prepayment - incentives]
   *     Cr. Lease liability              [PV of payments]
   *     Cr. Prepaid lease expense        [reclassified if prepayment exists]
   *
   * If lease incentive received:
   * Dr. Cash / Incentive receivable  XXX
   *     Cr. Right-of-use asset           XXX  (reduces carrying amount)
   * ========================================================================== */

  // Core recognition: ROU asset vs lease liability
  // ROU at commencement = liability + prepayments (reclassified) - incentives
  // IDC already pushed above as a separate entry
  const rouAtCommencement = liability + prepayments - incentives;

  entries.push(
    {
      date: commenceDate,
      account: 'Right-of-use asset',
      dr: rouAtCommencement,
      cr: 0,
      memo: 'Initial recognition of ROU asset at commencement',
      currency
    },
    {
      date: commenceDate,
      account: 'Lease liability',
      dr: 0,
      cr: liability,
      memo: 'Initial recognition of lease liability',
      currency
    }
  );

  // Reclassify prepayment from Prepaid lease into ROU asset
  if (prepayments > 0) {
    entries.push(
      {
        date: commenceDate,
        account: 'Prepaid lease expense',
        dr: 0,
        cr: prepayments,
        memo: 'Reclassify prepayment into ROU asset at commencement',
        currency
      }
    );
  }

  // Lease incentive received reduces ROU asset carrying amount
  if (incentives > 0) {
    entries.push(
      {
        date: commenceDate,
        account: 'Cash',
        dr: incentives,
        cr: 0,
        memo: 'Lease incentive received from lessor',
        currency
      },
      {
        date: commenceDate,
        account: 'Right-of-use asset',
        dr: 0,
        cr: incentives,
        memo: 'Lease incentive deducted from ROU asset carrying amount',
        currency
      }
    );
  }

  /* ==========================================================================
   * JOURNAL ENTRIES 2+: Subsequent Measurement for Every Period
   *
   * For each period in the amortization schedule:
   *
   * Dr. Interest expense (lease)             XXX
   * Dr. Lease liability (principal)          XXX
   *     Cr. Cash                                  XXX
   *
   * Dr. Depreciation expense                 XXX
   *     Cr. Accumulated depreciation - ROU        XXX
   *
   * ========================================================================== */
  amort.forEach((period, index) => {
    const periodDate = new Date(commenceDate);
    periodDate.setMonth(periodDate.getMonth() + (index + 1) * monthsPerPeriod);
    const dateStr = periodDate.toISOString().split('T')[0];
    const periodLabel = `Period ${period.month}`;

    entries.push(
      {
        date: dateStr,
        account: 'Interest expense (lease)',
        dr: period.interest || 0,
        cr: 0,
        memo: `${periodLabel} - Interest expense`,
        currency: currency
      },
      {
        date: dateStr,
        account: 'Lease liability',
        dr: period.principal || 0,
        cr: 0,
        memo: `${periodLabel} - Principal reduction`,
        currency: currency
      },
      {
        date: dateStr,
        account: 'Cash',
        dr: 0,
        cr: period.payment || 0,
        memo: `${periodLabel} - Lease payment`,
        currency: currency
      },
      {
        date: dateStr,
        account: 'Depreciation expense',
        dr: period.depreciation || 0,
        cr: 0,
        memo: `${periodLabel} - Depreciation`,
        currency: currency
      },
      {
        date: dateStr,
        account: 'Accumulated depreciation - ROU asset',
        dr: 0,
        cr: period.depreciation || 0,
        memo: `${periodLabel} - Accumulated depreciation`,
        currency: currency
      }
    );
  });

  return entries;
}
