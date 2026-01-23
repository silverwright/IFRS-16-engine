export interface SavedContract {
  id: string;
  contractId: string;
  lesseeName: string;
  assetDescription: string;
  commencementDate: string;
  mode: 'MINIMAL' | 'FULL';
  status: 'pending' | 'approved';
  data: LeaseData;
  createdAt?: string;
  updatedAt?: string;
  // Version tracking fields
  version?: number;
  baseContractId?: string;
  modificationDate?: string;
  previousVersionId?: string;
  isActive?: boolean;
  modificationReason?: string;
}

export interface LeaseData {
  ContractID?: string;
  LesseeName?: string;
  AssetDescription?: string;
  CommencementDate?: string;
  Currency?: string;
  FixedPaymentPerPeriod?: number;
  PaymentFrequency?: 'Monthly' | 'Quarterly' | 'Semiannual' | 'Annual';
  PaymentTiming?: 'Advance' | 'Arrears';
  NonCancellableYears?: number;
  IBR_Annual?: number;
  InitialDirectCosts?: number;
  PrepaymentsBeforeCommencement?: number;
  LeaseIncentives?: number;
  RenewalOptionYears?: number;
  RenewalOptionLikelihood?: number;
  TerminationOptionPoint?: string;
  TerminationOptionLikelihood?: number;
  RVGExpected?: number;
  RVGReasonablyCertain?: boolean;
  FairValue?: number;
  CarryingAmount?: number;
  SalesProceeds?: number;
  [key: string]: any;
}
