/**
 * Lease Context - Global State Management for IFRS 16 Lease Application
 *
 * This module provides centralized state management for the entire lease application
 * using React's Context API and useReducer hook. It manages:
 *
 * - **Lease Data**: All contract details, terms, payments, and options
 * - **Calculation Results**: IFRS 16 calculations (liability, ROU asset, schedules)
 * - **Contract HTML**: Generated lease agreement documents
 * - **Saved Contracts**: Persistence and version tracking of lease contracts
 * - **Application Mode**: MINIMAL (essential fields) or FULL (comprehensive fields)
 * - **Loading State**: Async operation tracking
 * - **Error State**: Error handling and user feedback
 *
 * ## Architecture
 *
 * The context uses a reducer pattern for predictable state updates:
 * - **State**: Centralized in LeaseState interface
 * - **Actions**: Dispatched via LeaseAction union type
 * - **Reducer**: Pure function that processes actions and returns new state
 *
 * ## Usage
 *
 * Wrap your app with LeaseProvider, then access state and dispatch in any component:
 *
 * ```typescript
 * const { state, dispatch } = useLeaseContext();
 *
 * // Update lease data
 * dispatch({ type: 'SET_LEASE_DATA', payload: { FixedPaymentPerPeriod: 10000 } });
 *
 * // Set calculations
 * dispatch({ type: 'SET_CALCULATIONS', payload: calculationResults });
 * ```
 *
 * @module LeaseContext
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ContractStatus } from '../types/auth';

/* ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================ */

/**
 * LeaseData Interface - Complete lease contract data
 *
 * This interface defines all fields that can be captured for a lease contract.
 * Fields are grouped by category for clarity:
 * - Identifiers (ContractID, entities, asset description)
 * - Dates (contract, commencement, end dates)
 * - Term & Options (non-cancellable period, renewal, termination)
 * - Payments (fixed rent, frequency, timing)
 * - Escalation (CPI-linked or fixed increases)
 * - Variable Payments & Other (usage-based, RVG, purchase option)
 * - Asset Valuation (carrying amount, fair value, sale proceeds)
 * - ROU Adjustments (IDC, prepayments, incentives)
 * - Currency & Rates (currency, IBR, FX policy)
 * - Asset Life (useful life for depreciation)
 * - Policy Flags (exemptions, component separation)
 * - Governance (judgement notes, approval signoff)
 * - Lease Modification (amendment tracking)
 * - Full Mode Extensions (additional party and asset details)
 */
export interface LeaseData {
  /* ----------------------------------------------------------------------------
   * Basic Identifiers
   * ---------------------------------------------------------------------------- */

  /** Unique contract identifier (e.g., "LSE-2024-001") */
  ContractID: string;

  /** Legal name of the lessee entity */
  LesseeEntity: string;

  /** Legal name of the lessor entity */
  LessorName: string;

  /** Detailed description of the leased asset */
  AssetDescription: string;

  /** Asset classification (e.g., "Office Equipment", "Vehicles", "Real Estate") */
  AssetClass: string;

  /* ----------------------------------------------------------------------------
   * Dates
   * ---------------------------------------------------------------------------- */

  /** Date when the contract was signed (YYYY-MM-DD) */
  ContractDate: string;

  /** Date when the lease term begins (IFRS 16 commencement date) */
  CommencementDate: string;

  /** Original expected end date of the lease */
  EndDateOriginal: string;

  /* ----------------------------------------------------------------------------
   * Term & Options
   * ---------------------------------------------------------------------------- */

  /** Non-cancellable lease period in years */
  NonCancellableYears: number;

  /** Renewal option period in years (if applicable) */
  RenewalOptionYears: number;

  /** Likelihood of exercising renewal option (0-100%) */
  RenewalOptionLikelihood: number;

  /** Point at which termination option can be exercised (e.g., "End of Year 3") */
  TerminationOptionPoint: string;

  /** Likelihood of exercising termination option (0-100%) */
  TerminationOptionLikelihood: number;

  /** Expected termination penalty amount */
  TerminationPenaltyExpected: number;

  /** Whether termination is reasonably certain (≥50% likelihood) */
  TerminationReasonablyCertain: boolean;

  /* ----------------------------------------------------------------------------
   * Payments
   * ---------------------------------------------------------------------------- */

  /** Fixed rent payment per period */
  FixedPaymentPerPeriod: number;

  /** Payment frequency: 'Monthly', 'Quarterly', 'Semiannual', or 'Annual' */
  PaymentFrequency: string;

  /** Payment timing: 'Advance' (beginning of period) or 'Arrears' (end of period) */
  PaymentTiming: string;

  /* ----------------------------------------------------------------------------
   * Escalation (Rent Increases)
   * ---------------------------------------------------------------------------- */

  /** Escalation type: 'CPI', 'Fixed', or 'None' */
  EscalationType: string;

  /** Base CPI value at commencement (for CPI-linked escalation) */
  BaseCPI: number;

  /** Month when CPI resets (1-12) */
  CPIResetMonth: number;

  /** Years until first escalation reset */
  FirstResetYearOffset: number;

  /** Fixed escalation percentage (for fixed escalation type) */
  FixedEscalationPct: number;

  /* ----------------------------------------------------------------------------
   * Variable & Other Payments
   * ---------------------------------------------------------------------------- */

  /** Variable payments that are "in-substance fixed" per IFRS 16 */
  VariablePaymentsInSubstanceFixed: number;

  /** Expected usage-based variable payments (not included in liability) */
  VariablePaymentsUsageExpected: number;

  /** Expected residual value guarantee amount */
  RVGExpected: number;

  /** Whether RVG payment is reasonably certain */
  RVGReasonablyCertain: boolean;

  /** Purchase option price (if applicable) */
  PurchaseOptionPrice: number;

  /** Whether purchase option exercise is reasonably certain */
  PurchaseOptionReasonablyCertain: boolean;

  /* ----------------------------------------------------------------------------
   * Asset Valuation
   * ---------------------------------------------------------------------------- */

  /** Asset carrying amount on lessor's books */
  CarryingAmount: number;

  /** Fair value of the asset at commencement */
  FairValue: number;

  /** Proceeds from potential sale-leaseback transaction */
  SalesProceeds: number;

  /* ----------------------------------------------------------------------------
   * ROU Asset Adjustments (IFRS 16.24)
   * ---------------------------------------------------------------------------- */

  /** Initial direct costs incurred by lessee */
  InitialDirectCosts: number;

  /** Prepayments made before commencement date */
  PrepaymentsBeforeCommencement: number;

  /** Lease incentives received from lessor */
  LeaseIncentives: number;

  /** Whether first payment was prepaid (affects amortization start) */
  PrepaidFirstPayment: boolean;

  /* ----------------------------------------------------------------------------
   * Currency & Rates
   * ---------------------------------------------------------------------------- */

  /** Contract currency (e.g., "USD", "NGN", "EUR") */
  Currency: string;

  /** Incremental Borrowing Rate - annual rate as decimal (e.g., 0.14 = 14%) */
  IBR_Annual: number;

  /** FX policy for multi-currency leases */
  FXPolicy: string;

  /* ----------------------------------------------------------------------------
   * Asset Life
   * ---------------------------------------------------------------------------- */

  /** Useful life of the asset in years (for depreciation) */
  UsefulLifeYears: number;

  /* ----------------------------------------------------------------------------
   * Policy Flags (IFRS 16 Recognition Exemptions)
   * ---------------------------------------------------------------------------- */

  /** Apply low-value asset exemption (IFRS 16.5(b)) */
  LowValueExemption: boolean;

  /** Apply short-term lease exemption (IFRS 16.5(a)) */
  ShortTermExemption: boolean;

  /** Whether to separate lease and non-lease components (IFRS 16.12) */
  SeparateNonLeaseComponents: boolean;

  /** Basis for allocating consideration between components */
  AllocationBasis: string;

  /* ----------------------------------------------------------------------------
   * Governance
   * ---------------------------------------------------------------------------- */

  /** Notes documenting key judgements and assumptions */
  JudgementNotes: string;

  /** Name of approver who signed off on the lease */
  ApprovalSignoff: string;

  /* ----------------------------------------------------------------------------
   * Lease Modification (for amendments per IFRS 16.44-46)
   * ---------------------------------------------------------------------------- */

  /** Whether this lease has been modified/amended */
  hasModification?: boolean;

  /** Date when modification took effect */
  modificationDate?: string;

  /** Original lease terms before modification */
  originalTerms?: Partial<LeaseData>;

  /** Modified lease terms after amendment */
  modifiedTerms?: Partial<LeaseData>;

  /** History of all modifications to this lease */
  modificationHistory?: Array<{
    /** Modification version number */
    version: number;

    /** Date of modification */
    date: string;

    /** Reason for modification */
    reason: string;

    /** Changed fields */
    changes: Partial<LeaseData>;
  }>;

  /* ----------------------------------------------------------------------------
   * Full Mode Extensions (optional detailed fields)
   * ---------------------------------------------------------------------------- */

  /** Lessor's legal jurisdiction */
  LessorJurisdiction?: string;

  /** Lessee's legal jurisdiction */
  LesseeJurisdiction?: string;

  /** Lessor's physical address */
  LessorAddress?: string;

  /** Lessee's physical address */
  LesseeAddress?: string;

  /** Lessor's registration/company number */
  LessorRCNumber?: string;

  /** Lessee's registration/company number */
  LesseeRCNumber?: string;

  /** Asset location/site address */
  AssetLocation?: string;

  /** Latest delivery date for asset */
  DeliveryDateLatest?: string;

  /** Event triggering risk transfer */
  RiskTransferEvent?: string;

  /** Insurance sum insured amount */
  InsuranceSumInsured?: number;

  /** Insurance third-party liability limit */
  InsuranceTPLimit?: number;

  /** Minimum insurer credit rating */
  InsurerRatingMin?: string;

  /** Permitted use of the asset */
  PermittedUse?: string;

  /** Restrictions on moving the asset */
  MoveRestriction?: string;

  /** Embedded software license terms */
  SoftwareLicense?: string;

  /** Bank name for payments */
  BankName?: string;

  /** Bank account holder name */
  BankAccountName?: string;

  /** Bank account number */
  BankAccountNo?: string;

  /** Arbitration rules for disputes */
  ArbitrationRules?: string;

  /** Seat/location of arbitration */
  SeatOfArbitration?: string;

  /** Contract language */
  Language?: string;

  /** Governing law jurisdiction */
  GoverningLaw?: string;

  /** Lessor signatory title */
  LessorSignatoryTitle?: string;

  /** Lessee signatory title */
  LesseeSignatoryTitle?: string;
}

/**
 * CalculationResults Interface - IFRS 16 calculation outputs
 *
 * Contains all results from the IFRS 16 calculator including:
 * - Initial recognition amounts (liability and ROU asset)
 * - Total expenses (interest and depreciation)
 * - Detailed schedules (cashflow, amortization, depreciation)
 * - Journal entries for accounting system integration
 * - Lease term breakdown (non-cancellable, renewal, termination)
 */
export interface CalculationResults {
  /** Initial lease liability at commencement (present value of payments) */
  initialLiability: number;

  /** Initial Right-of-Use asset at commencement */
  initialROU: number;

  /** Total interest expense over full lease term */
  totalInterest: number;

  /** Total depreciation expense over full lease term */
  totalDepreciation: number;

  /** Cashflow schedule showing all payments */
  cashflowSchedule: any[];

  /** Amortization schedule for liability and ROU asset */
  amortizationSchedule: any[];

  /** Depreciation schedule for ROU asset */
  depreciationSchedule: any[];

  /** Journal entries for initial recognition and ongoing periods */
  journalEntries: any[];

  /** Total lease term in years (including options if reasonably certain) */
  leaseTermYears: number;

  /** Non-cancellable portion of lease term */
  nonCancellableYears: number;

  /** Renewal years included (if reasonably certain) */
  renewalYears: number;

  /** Termination point years (if reasonably certain NOT to terminate) */
  terminationYears: number;
}

/**
 * LeaseState Interface - Global application state
 *
 * Centralized state containing:
 * - Current lease data being edited
 * - Application mode (MINIMAL or FULL)
 * - Calculation results from IFRS 16 calculator
 * - Generated contract HTML
 * - All saved contracts for this user
 * - Loading and error states
 */
interface LeaseState {
  /** Current lease data (partial to allow gradual form filling) */
  leaseData: Partial<LeaseData>;

  /** Application mode: MINIMAL (essential fields) or FULL (all fields) */
  mode: 'MINIMAL' | 'FULL';

  /** Calculation results (null until first calculation) */
  calculations: CalculationResults | null;

  /** Generated contract HTML (null until first generation) */
  contractHtml: string | null;

  /** Array of all saved contracts for this user */
  savedContracts: SavedContract[];

  /** Loading indicator for async operations */
  loading: boolean;

  /** Error message (null if no error) */
  error: string | null;
}

/**
 * SavedContract Interface - Persisted contract with metadata
 *
 * Represents a saved lease contract with:
 * - Unique identifier
 * - Key contract details for list display
 * - Approval workflow status
 * - Timestamps (created, updated)
 * - Full lease data and mode
 * - Version tracking for modifications
 */
export interface SavedContract {
  /** Unique database ID */
  id: string;

  /** Contract ID from lease data */
  contractId: string;

  /** Lessor name for display */
  lessorName: string;

  /** Lessee name for display */
  lesseeName: string;

  /** Asset description for display */
  assetDescription: string;

  /** Commencement date for sorting */
  commencementDate: string;

  /** Approval workflow status */
  status: ContractStatus;

  /** When the contract was created */
  createdAt: string;

  /** When the contract was last updated */
  updatedAt: string;

  /** Full lease data */
  data: Partial<LeaseData>;

  /** Mode used when creating this contract */
  mode: 'MINIMAL' | 'FULL';

  /** Version number (1 = original, 2+ = modifications) */
  version?: number;

  /** Base contract ID for tracking modifications */
  baseContractId?: string;

  /** Date when modification was made */
  modificationDate?: string;

  /** Previous version ID in modification chain */
  previousVersionId?: string;

  /** Whether this is the active version */
  isActive?: boolean;

  /** Reason for modification */
  modificationReason?: string;
}

/**
 * LeaseAction Type - All possible state update actions
 *
 * Union type defining all actions that can be dispatched to update state:
 * - SET_LEASE_DATA: Update lease data (partial merge)
 * - SET_MODE: Switch between MINIMAL and FULL modes
 * - SET_CALCULATIONS: Store IFRS 16 calculation results
 * - SET_CONTRACT_HTML: Store generated contract HTML
 * - SAVE_CONTRACT: Add new contract to saved contracts
 * - UPDATE_CONTRACT: Update existing saved contract
 * - DELETE_CONTRACT: Remove contract from saved contracts
 * - LOAD_CONTRACT: Load contract data into current editing state
 * - LOAD_ALL_CONTRACTS: Load all contracts from backend
 * - SET_LOADING: Update loading indicator
 * - SET_ERROR: Set or clear error message
 * - CREATE_MODIFICATION: Create new version of existing contract
 * - RESET: Reset entire state to initial values
 */
type LeaseAction =
  | { type: 'SET_LEASE_DATA'; payload: Partial<LeaseData> }
  | { type: 'SET_MODE'; payload: 'MINIMAL' | 'FULL' }
  | { type: 'SET_CALCULATIONS'; payload: CalculationResults }
  | { type: 'SET_CONTRACT_HTML'; payload: string }
  | { type: 'SAVE_CONTRACT'; payload: SavedContract }
  | { type: 'UPDATE_CONTRACT'; payload: SavedContract }
  | { type: 'DELETE_CONTRACT'; payload: string }
  | { type: 'LOAD_CONTRACT'; payload: Partial<LeaseData> }
  | { type: 'LOAD_ALL_CONTRACTS'; payload: SavedContract[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CREATE_MODIFICATION'; payload: SavedContract }
  | { type: 'RESET' };

/* ============================================================================
 * INITIAL STATE
 * ============================================================================ */

/**
 * Initial application state
 *
 * Clean slate with:
 * - Empty lease data (ready for user input)
 * - MINIMAL mode (essential fields only)
 * - No calculations yet
 * - No contract generated yet
 * - Empty saved contracts list
 * - Not loading
 * - No errors
 */
const initialState: LeaseState = {
  leaseData: {},
  mode: 'MINIMAL',
  calculations: null,
  contractHtml: null,
  savedContracts: [],
  loading: false,
  error: null,
};

/* ============================================================================
 * REDUCER FUNCTION
 * ============================================================================ */

/**
 * Lease reducer - Pure function that processes actions and updates state
 *
 * Handles all state updates in a predictable, immutable way. Each action
 * returns a new state object without mutating the previous state.
 *
 * @param state - Current state
 * @param action - Action to process
 * @returns New state after processing action
 */
function leaseReducer(state: LeaseState, action: LeaseAction): LeaseState {
  switch (action.type) {
    case 'SET_LEASE_DATA':
      // Merge new lease data with existing (partial update)
      return { ...state, leaseData: { ...state.leaseData, ...action.payload } };

    case 'SET_MODE':
      // Switch application mode
      return { ...state, mode: action.payload };

    case 'SET_CALCULATIONS':
      // Store calculation results
      return { ...state, calculations: action.payload };

    case 'SET_CONTRACT_HTML':
      // Store generated contract HTML
      return { ...state, contractHtml: action.payload };

    case 'SAVE_CONTRACT':
      // Add new contract to saved contracts
      return {
        ...state,
        savedContracts: [...state.savedContracts, action.payload]
      };

    case 'UPDATE_CONTRACT':
      // Update existing contract in saved contracts
      return {
        ...state,
        savedContracts: state.savedContracts.map(contract =>
          contract.id === action.payload.id ? action.payload : contract
        )
      };

    case 'CREATE_MODIFICATION':
      // Create modification: mark previous versions as inactive, add new version
      const baseContractId = action.payload.baseContractId || action.payload.contractId;
      return {
        ...state,
        savedContracts: [
          ...state.savedContracts.map(contract =>
            contract.baseContractId === baseContractId || contract.contractId === baseContractId
              ? { ...contract, isActive: false }
              : contract
          ),
          action.payload
        ]
      };

    case 'DELETE_CONTRACT':
      // Remove contract from saved contracts
      return {
        ...state,
        savedContracts: state.savedContracts.filter(contract => contract.id !== action.payload)
      };

    case 'LOAD_CONTRACT':
      // Load contract data into editing state
      return { ...state, leaseData: action.payload };

    case 'LOAD_ALL_CONTRACTS':
      // Replace all saved contracts with new list (from backend)
      return { ...state, savedContracts: action.payload };

    case 'SET_LOADING':
      // Update loading indicator
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      // Set or clear error message
      return { ...state, error: action.payload };

    case 'RESET':
      // Reset to initial state
      return initialState;

    default:
      // Unknown action - return state unchanged
      return state;
  }
}

/* ============================================================================
 * CONTEXT CREATION
 * ============================================================================ */

/**
 * LeaseContext - React context for global state
 *
 * Provides access to state and dispatch throughout the component tree.
 * Initially null, populated by LeaseProvider.
 */
const LeaseContext = createContext<{
  state: LeaseState;
  dispatch: React.Dispatch<LeaseAction>;
} | null>(null);

/* ============================================================================
 * PROVIDER COMPONENT
 * ============================================================================ */

/**
 * LeaseProvider - Context provider component
 *
 * Wraps the application to provide global state access to all children.
 * Sets up the reducer and provides state and dispatch through context.
 *
 * @param children - Child components that will have access to context
 *
 * @example
 * ```typescript
 * <LeaseProvider>
 *   <App />
 * </LeaseProvider>
 * ```
 */
export function LeaseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(leaseReducer, initialState);

  return (
    <LeaseContext.Provider value={{ state, dispatch }}>
      {children}
    </LeaseContext.Provider>
  );
}

/* ============================================================================
 * CUSTOM HOOK
 * ============================================================================ */

/**
 * useLeaseContext - Custom hook for accessing lease context
 *
 * Provides type-safe access to state and dispatch. Throws error if used
 * outside of LeaseProvider.
 *
 * @returns Object containing state and dispatch
 * @throws Error if used outside LeaseProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { state, dispatch } = useLeaseContext();
 *
 *   const updatePayment = (amount: number) => {
 *     dispatch({
 *       type: 'SET_LEASE_DATA',
 *       payload: { FixedPaymentPerPeriod: amount }
 *     });
 *   };
 *
 *   return <div>Current payment: {state.leaseData.FixedPaymentPerPeriod}</div>;
 * }
 * ```
 */
export function useLeaseContext() {
  const context = useContext(LeaseContext);
  if (!context) {
    throw new Error('useLeaseContext must be used within a LeaseProvider');
  }
  return context;
}
