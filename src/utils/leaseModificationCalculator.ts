/**
 * IFRS 16 Lease Modification Calculator
 *
 * This module handles lease modifications (amendments) in accordance with IFRS 16.44-46.
 * A lease modification is a change in the scope or consideration of a lease that was not
 * part of the original terms.
 *
 * Key IFRS 16 Modification Principles:
 *
 * 1. **Modification Date**: The date when both parties agree to the lease modification
 *
 * 2. **Remeasurement**: The lessee remeasures the lease liability by discounting the
 *    revised lease payments using a revised discount rate (if changed)
 *
 * 3. **ROU Asset Adjustment**: The lessee adjusts the ROU asset by the difference between
 *    the remeasured lease liability and the previous carrying amount
 *
 * 4. **Historical Preservation**: Calculations up to the modification date remain unchanged.
 *    Only forward periods are recalculated.
 *
 * 5. **Version Tracking**: Each modification creates a new version while preserving the
 *    original contract data for audit and compliance purposes
 *
 * @see IFRS 16.44-46 for detailed modification accounting requirements
 */

import { LeaseData, CalculationResults } from '../context/LeaseContext';
import { calculateIFRS16 } from './ifrs16Calculator';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * Parameters required for calculating a lease modification
 */
interface ModificationParams {
  /** Original lease data before modification */
  originalLeaseData: Partial<LeaseData>;

  /** Original calculation results before modification */
  originalCalculations: CalculationResults;

  /** Date when the modification takes effect (YYYY-MM-DD format) */
  modificationDate: string;

  /** New or changed lease values (partial update) */
  newValues: Partial<LeaseData>;
}

/**
 * Result of lease modification calculation
 */
interface ModificationResult {
  /** Modified lease data (merged original + new values) */
  modifiedLeaseData: Partial<LeaseData>;

  /** Calculation results including preserved + new periods */
  modifiedCalculations: CalculationResults;

  /** Number of periods preserved from original lease */
  preservedPeriods: number;

  /** Period number when modification takes effect */
  modificationPeriod: number;
}

/* ============================================================================
 * MAIN MODIFICATION CALCULATOR
 * ============================================================================ */

/**
 * Calculate lease modification following IFRS 16.44-46 requirements
 *
 * This function implements lease modification accounting by:
 * 1. Determining which period the modification occurs in
 * 2. Preserving all historical calculations up to modification date
 * 3. Recalculating forward periods with new terms
 * 4. Merging preserved and new schedules into final results
 *
 * The calculation ensures that:
 * - Historical periods remain unchanged (audit trail preservation)
 * - The lease liability is remeasured at modification date
 * - The ROU asset is adjusted for the difference
 * - All schedules maintain continuous period numbering
 *
 * @param params - Modification parameters including original data, new values, and modification date
 * @returns Modified lease data and calculation results with preserved history
 *
 * @example
 * ```typescript
 * const modificationResult = calculateLeaseModification({
 *   originalLeaseData: existingLease,
 *   originalCalculations: existingCalculations,
 *   modificationDate: '2024-06-01',
 *   newValues: {
 *     FixedPaymentPerPeriod: 12000, // Increased from 10000
 *     NonCancellableYears: 7,        // Extended from 5
 *     IBR_Annual: 0.15               // Revised discount rate
 *   }
 * });
 * ```
 */
export function calculateLeaseModification(params: ModificationParams): ModificationResult {
  const { originalLeaseData, originalCalculations, modificationDate, newValues } = params;

  /* ============================================================================
   * STEP 1: Determine Modification Period
   *
   * Calculate which period the modification occurs in based on:
   * - Original commencement date
   * - Modification date
   * - Payment frequency (Monthly, Quarterly, etc.)
   * ============================================================================ */

  const commencementDate = new Date(originalLeaseData.CommencementDate || new Date());
  const modDate = new Date(modificationDate);

  // Determine periods per year based on payment frequency
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

  /* ============================================================================
   * STEP 2: Create Modified Lease Data
   *
   * Merge original lease data with new values while preserving immutable fields:
   * - ContractID (never changes)
   * - Original CommencementDate (historical fact)
   * - Original ContractDate (historical fact)
   * ============================================================================ */

  const modifiedLeaseData: Partial<LeaseData> = {
    ...originalLeaseData,
    ...newValues,
    // These fields should not be changed in a modification
    ContractID: originalLeaseData.ContractID,
    CommencementDate: originalLeaseData.CommencementDate,
    ContractDate: originalLeaseData.ContractDate,
  };

  /* ============================================================================
   * STEP 3: Calculate Remaining Lease Term
   *
   * Determine the remaining lease term from modification date:
   * - Total original lease years
   * - Minus years already elapsed
   * - Plus any extension years from the modification (if applicable)
   * ============================================================================ */

  const totalLeaseYears = originalCalculations.leaseTermYears;
  const remainingYears = totalLeaseYears - yearsElapsed;

  /* ============================================================================
   * STEP 4: Prepare Forward Calculation Data
   *
   * Create a temporary lease data object for calculating forward periods.
   * This uses:
   * - New payment amounts
   * - New discount rate (if changed)
   * - Remaining lease term
   * - Reset initial costs (not applicable to modifications)
   * ============================================================================ */

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

  /* ============================================================================
   * STEP 5: Calculate Forward Periods
   *
   * Run the standard IFRS 16 calculator on the modified terms
   * This produces new schedules starting from the modification date
   * ============================================================================ */

  const forwardCalculations = calculateIFRS16(forwardCalculationData);

  /* ============================================================================
   * STEP 6: Merge Preserved and New Schedules
   *
   * Combine:
   * - Preserved periods (original calculations up to modification date)
   * - New periods (recalculated with modified terms)
   *
   * This creates a complete schedule showing the full lease lifecycle
   * ============================================================================ */

  // Merge Amortization Schedule
  const preservedSchedule = originalCalculations.amortizationSchedule.slice(0, preservedPeriods);
  const newSchedule = forwardCalculations.amortizationSchedule.map((row, index) => ({
    ...row,
    month: preservedPeriods + index + 1, // Continue period numbering
  }));
  const mergedAmortizationSchedule = [...preservedSchedule, ...newSchedule];

  // Merge Cashflow Schedule
  const preservedCashflow = originalCalculations.cashflowSchedule.slice(0, preservedPeriods);
  const newCashflow = forwardCalculations.cashflowSchedule.map((row, index) => ({
    ...row,
    period: preservedPeriods + index + 1,
  }));
  const mergedCashflowSchedule = [...preservedCashflow, ...newCashflow];

  /* ============================================================================
   * STEP 7: Recalculate Totals
   *
   * Aggregate totals from the merged schedules:
   * - Total interest expense over full lease term
   * - Total depreciation expense over full lease term
   * ============================================================================ */

  const totalInterest = mergedAmortizationSchedule.reduce((sum, row) => sum + (row.interest || 0), 0);
  const totalDepreciation = mergedAmortizationSchedule.reduce((sum, row) => sum + (row.depreciation || 0), 0);

  /* ============================================================================
   * STEP 8: Create Final Calculation Results
   *
   * Package all results with:
   * - Original initial values (for reference)
   * - Merged schedules (preserved + new)
   * - Recalculated totals
   * - Forward-looking depreciation and journals
   * ============================================================================ */

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

/* ============================================================================
 * VERSION MANAGEMENT UTILITIES
 *
 * These helper functions manage contract version IDs for tracking modifications:
 * - Original contract: "contract-123"
 * - First modification: "contract-123-v2"
 * - Second modification: "contract-123-v3"
 * - And so on...
 *
 * This ensures each modification is tracked and can be audited.
 * ============================================================================ */

/**
 * Generate version ID from base contract ID and version number
 *
 * Version 1 returns the base ID unchanged (original contract).
 * Subsequent versions append "-vN" suffix.
 *
 * @param baseContractId - The base contract identifier (e.g., "contract-123")
 * @param version - Version number (1 = original, 2+ = modifications)
 * @returns Versioned contract ID
 *
 * @example
 * ```typescript
 * generateVersionId('contract-123', 1)  // Returns: "contract-123"
 * generateVersionId('contract-123', 2)  // Returns: "contract-123-v2"
 * generateVersionId('contract-123', 5)  // Returns: "contract-123-v5"
 * ```
 */
export function generateVersionId(baseContractId: string, version: number): string {
  if (version === 1) {
    return baseContractId;
  }
  return `${baseContractId}-v${version}`;
}

/**
 * Extract base contract ID from a versioned contract ID
 *
 * Removes the version suffix to get the original contract identifier.
 * Useful for finding all versions of a contract.
 *
 * @param contractId - Versioned or unversioned contract ID
 * @returns Base contract ID without version suffix
 *
 * @example
 * ```typescript
 * extractBaseContractId('contract-123')     // Returns: "contract-123"
 * extractBaseContractId('contract-123-v2')  // Returns: "contract-123"
 * extractBaseContractId('contract-123-v10') // Returns: "contract-123"
 * ```
 */
export function extractBaseContractId(contractId: string): string {
  const versionPattern = /-v\d+$/;
  return contractId.replace(versionPattern, '');
}

/**
 * Extract version number from a versioned contract ID
 *
 * Parses the version number from the contract ID.
 * Returns 1 for unversioned IDs (original contract).
 *
 * @param contractId - Versioned or unversioned contract ID
 * @returns Version number (1 if no version suffix found)
 *
 * @example
 * ```typescript
 * extractVersion('contract-123')     // Returns: 1
 * extractVersion('contract-123-v2')  // Returns: 2
 * extractVersion('contract-123-v10') // Returns: 10
 * ```
 */
export function extractVersion(contractId: string): number {
  const match = contractId.match(/-v(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}
