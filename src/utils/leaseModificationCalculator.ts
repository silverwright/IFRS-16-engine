import { LeaseData, CalculationResults } from '../context/LeaseContext';
import { calculateIFRS16 } from './ifrs16Calculator';

/**
 * Calculate lease modification following IFRS 16 requirements
 * This function creates a new version of the contract that preserves historical calculations
 * and applies new values only from the modification date forward
 */

interface ModificationParams {
  originalLeaseData: Partial<LeaseData>;
  originalCalculations: CalculationResults;
  modificationDate: string;
  newValues: Partial<LeaseData>;
}

interface ModificationResult {
  modifiedLeaseData: Partial<LeaseData>;
  modifiedCalculations: CalculationResults;
  preservedPeriods: number;
  modificationPeriod: number;
}

export function calculateLeaseModification(params: ModificationParams): ModificationResult {
  const { originalLeaseData, originalCalculations, modificationDate, newValues } = params;

  // 1. Calculate which period the modification occurs in
  const commencementDate = new Date(originalLeaseData.CommencementDate || new Date());
  const modDate = new Date(modificationDate);

  const paymentFrequency = originalLeaseData.PaymentFrequency || 'Monthly';
  const periodsPerYear = paymentFrequency === 'Monthly' ? 12 :
                        paymentFrequency === 'Quarterly' ? 4 :
                        paymentFrequency === 'Semiannual' ? 2 :
                        paymentFrequency === 'Annual' ? 1 : 12;

  // Calculate years elapsed from commencement to modification
  const yearsElapsed = (modDate.getTime() - commencementDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const periodsElapsed = Math.floor(yearsElapsed * periodsPerYear);

  // The modification starts at the beginning of the next period
  const modificationPeriod = periodsElapsed + 1;
  const preservedPeriods = periodsElapsed;

  // 2. Get the ending balances from the last preserved period
  let startingLiability = originalCalculations.initialLiability;
  let startingROUAsset = originalCalculations.initialROU;

  if (preservedPeriods > 0 && originalCalculations.amortizationSchedule.length > 0) {
    const lastPreservedPeriodIndex = Math.min(preservedPeriods - 1, originalCalculations.amortizationSchedule.length - 1);
    const lastPeriod = originalCalculations.amortizationSchedule[lastPreservedPeriodIndex];

    startingLiability = lastPeriod?.remainingLiability || 0;
    startingROUAsset = lastPeriod?.remainingAsset || 0;
  }

  // 3. Create modified lease data
  // Merge original data with new values
  const modifiedLeaseData: Partial<LeaseData> = {
    ...originalLeaseData,
    ...newValues,
    // These fields should not be changed in a modification
    ContractID: originalLeaseData.ContractID,
    CommencementDate: originalLeaseData.CommencementDate,
    ContractDate: originalLeaseData.ContractDate,
  };

  // 4. Calculate the remaining lease term from modification date
  const totalLeaseYears = originalCalculations.leaseTermYears;
  const remainingYears = totalLeaseYears - yearsElapsed;

  // Create a temporary lease data object for calculating the forward portion
  const forwardCalculationData: Partial<LeaseData> = {
    ...modifiedLeaseData,
    NonCancellableYears: remainingYears > 0 ? remainingYears : 0,
    // Reset renewal and termination options - these are re-evaluated at modification
    RenewalOptionYears: newValues.RenewalOptionYears !== undefined ? newValues.RenewalOptionYears : 0,
    TerminationOptionPoint: newValues.TerminationOptionPoint || '0',
    TerminationOptionLikelihood: newValues.TerminationOptionLikelihood || 0,
    // Use the new payment and IBR values
    FixedPaymentPerPeriod: newValues.FixedPaymentPerPeriod || originalLeaseData.FixedPaymentPerPeriod,
    IBR_Annual: newValues.IBR_Annual || originalLeaseData.IBR_Annual,
    // For modification, we don't include initial direct costs again
    InitialDirectCosts: 0,
    PrepaymentsBeforeCommencement: 0,
    LeaseIncentives: 0,
    // Set a temporary commencement date at the modification point
    CommencementDate: modificationDate,
  };

  // 5. Calculate the forward portion using the new values
  const forwardCalculations = calculateIFRS16(forwardCalculationData);

  // 6. Merge preserved periods with new calculations
  const preservedSchedule = originalCalculations.amortizationSchedule.slice(0, preservedPeriods);
  const newSchedule = forwardCalculations.amortizationSchedule.map((row, index) => ({
    ...row,
    month: preservedPeriods + index + 1, // Continue period numbering
  }));

  const mergedAmortizationSchedule = [...preservedSchedule, ...newSchedule];

  // 7. Recalculate totals
  const totalInterest = mergedAmortizationSchedule.reduce((sum, row) => sum + (row.interest || 0), 0);
  const totalDepreciation = mergedAmortizationSchedule.reduce((sum, row) => sum + (row.depreciation || 0), 0);

  // 8. Create merged cashflow schedule
  const preservedCashflow = originalCalculations.cashflowSchedule.slice(0, preservedPeriods);
  const newCashflow = forwardCalculations.cashflowSchedule.map((row, index) => ({
    ...row,
    period: preservedPeriods + index + 1,
  }));
  const mergedCashflowSchedule = [...preservedCashflow, ...newCashflow];

  // 9. Create final calculation results
  const modifiedCalculations: CalculationResults = {
    initialLiability: originalCalculations.initialLiability,
    initialROU: originalCalculations.initialROU,
    totalInterest,
    totalDepreciation,
    cashflowSchedule: mergedCashflowSchedule,
    amortizationSchedule: mergedAmortizationSchedule,
    depreciationSchedule: forwardCalculations.depreciationSchedule,
    journalEntries: forwardCalculations.journalEntries,
    leaseTermYears: totalLeaseYears,
    nonCancellableYears: originalCalculations.nonCancellableYears,
    renewalYears: forwardCalculations.renewalYears,
    terminationYears: forwardCalculations.terminationYears,
  };

  return {
    modifiedLeaseData,
    modifiedCalculations,
    preservedPeriods,
    modificationPeriod,
  };
}

/**
 * Generate version ID from base contract ID and version number
 * Example: contract-123 + version 2 = contract-123-v2
 */
export function generateVersionId(baseContractId: string, version: number): string {
  if (version === 1) {
    return baseContractId;
  }
  return `${baseContractId}-v${version}`;
}

/**
 * Extract base contract ID from a versioned contract ID
 * Example: contract-123-v2 => contract-123
 */
export function extractBaseContractId(contractId: string): string {
  const versionPattern = /-v\d+$/;
  return contractId.replace(versionPattern, '');
}

/**
 * Extract version number from a versioned contract ID
 * Example: contract-123-v2 => 2
 */
export function extractVersion(contractId: string): number {
  const match = contractId.match(/-v(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}
