import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ContractStatus } from '../types/auth';

export interface LeaseData {
  // Basic identifiers
  ContractID: string;
  LesseeEntity: string;
  LessorName: string;
  AssetDescription: string;
  AssetClass: string;
  
  // Dates
  ContractDate: string;
  CommencementDate: string;
  EndDateOriginal: string;
  
  // Term & Options
  NonCancellableYears: number;
  RenewalOptionYears: number;
  RenewalOptionLikelihood: number;
  TerminationOptionPoint: string;
  TerminationOptionLikelihood: number;
  TerminationPenaltyExpected: number;
  TerminationReasonablyCertain: boolean;
  
  // Payments
  FixedPaymentPerPeriod: number;
  PaymentFrequency: string;
  PaymentTiming: string;
  
  // Escalation
  EscalationType: string;
  BaseCPI: number;
  CPIResetMonth: number;
  FirstResetYearOffset: number;
  FixedEscalationPct: number;
  
  // Variable & Other
  VariablePaymentsInSubstanceFixed: number;
  VariablePaymentsUsageExpected: number;
  RVGExpected: number;
  RVGReasonablyCertain: boolean;
  PurchaseOptionPrice: number;
  PurchaseOptionReasonablyCertain: boolean;

  // Asset Valuation
  CarryingAmount: number;
  FairValue: number;
  SalesProceeds: number;

  // ROU Adjustments
  InitialDirectCosts: number;
  PrepaymentsBeforeCommencement: number;
  LeaseIncentives: number;
  PrepaidFirstPayment: boolean;
  
  // Currency & Rates
  Currency: string;
  IBR_Annual: number;
  FXPolicy: string;
  
  // Asset Life
  UsefulLifeYears: number;
  
  // Policy Flags
  LowValueExemption: boolean;
  ShortTermExemption: boolean;
  SeparateNonLeaseComponents: boolean;
  AllocationBasis: string;
  
  // Governance
  JudgementNotes: string;
  ApprovalSignoff: string;
  
  // Full mode extensions
  LessorJurisdiction?: string;
  LesseeJurisdiction?: string;
  LessorAddress?: string;
  LesseeAddress?: string;
  LessorRCNumber?: string;
  LesseeRCNumber?: string;
  AssetLocation?: string;
  DeliveryDateLatest?: string;
  RiskTransferEvent?: string;
  InsuranceSumInsured?: number;
  InsuranceTPLimit?: number;
  InsurerRatingMin?: string;
  PermittedUse?: string;
  MoveRestriction?: string;
  SoftwareLicense?: string;
  BankName?: string;
  BankAccountName?: string;
  BankAccountNo?: string;
  ArbitrationRules?: string;
  SeatOfArbitration?: string;
  Language?: string;
  GoverningLaw?: string;
  LessorSignatoryTitle?: string;
  LesseeSignatoryTitle?: string;
}

export interface CalculationResults {
  initialLiability: number;
  initialROU: number;
  totalInterest: number;
  totalDepreciation: number;
  cashflowSchedule: any[];
  amortizationSchedule: any[];
  depreciationSchedule: any[];
  journalEntries: any[];
  leaseTermYears: number;
  nonCancellableYears: number;
  renewalYears: number;
  terminationYears: number;
}

interface LeaseState {
  leaseData: Partial<LeaseData>;
  mode: 'MINIMAL' | 'FULL';
  calculations: CalculationResults | null;
  contractHtml: string | null;
  savedContracts: SavedContract[];
  loading: boolean;
  error: string | null;
}

export interface SavedContract {
  id: string;
  contractId: string;
  lessorName: string;
  lesseeName: string;
  assetDescription: string;
  commencementDate: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  data: Partial<LeaseData>;
  mode: 'MINIMAL' | 'FULL';
}

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
  | { type: 'RESET' };

const initialState: LeaseState = {
  leaseData: {},
  mode: 'MINIMAL',
  calculations: null,
  contractHtml: null,
  savedContracts: [],
  loading: false,
  error: null,
};

function leaseReducer(state: LeaseState, action: LeaseAction): LeaseState {
  switch (action.type) {
    case 'SET_LEASE_DATA':
      return { ...state, leaseData: { ...state.leaseData, ...action.payload } };
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    case 'SET_CALCULATIONS':
      return { ...state, calculations: action.payload };
    case 'SET_CONTRACT_HTML':
      return { ...state, contractHtml: action.payload };
    case 'SAVE_CONTRACT':
      return { 
        ...state, 
        savedContracts: [...state.savedContracts, action.payload] 
      };
    case 'UPDATE_CONTRACT':
      return {
        ...state,
        savedContracts: state.savedContracts.map(contract =>
          contract.id === action.payload.id ? action.payload : contract
        )
      };
    case 'DELETE_CONTRACT':
      return {
        ...state,
        savedContracts: state.savedContracts.filter(contract => contract.id !== action.payload)
      };
    case 'LOAD_CONTRACT':
      return { ...state, leaseData: action.payload };
    case 'LOAD_ALL_CONTRACTS':
      return { ...state, savedContracts: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const LeaseContext = createContext<{
  state: LeaseState;
  dispatch: React.Dispatch<LeaseAction>;
} | null>(null);

export function LeaseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(leaseReducer, initialState);

  return (
    <LeaseContext.Provider value={{ state, dispatch }}>
      {children}
    </LeaseContext.Provider>
  );
}

export function useLeaseContext() {
  const context = useContext(LeaseContext);
  if (!context) {
    throw new Error('useLeaseContext must be used within a LeaseProvider');
  }
  return context;
}