// User roles
export type UserRole = 'creator' | 'approver' | 'admin';

// User profile extending Supabase auth.users
export interface UserProfile {
  id: string; // UUID from auth.users
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Contract status
export type ContractStatus = 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected';

// Approval history action types
export type ApprovalAction = 'created' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'revised';

// Approval history entry
export interface ApprovalHistoryEntry {
  id: string;
  contract_id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: ApprovalAction;
  from_status?: ContractStatus;
  to_status?: ContractStatus;
  comments?: string;
  created_at: string;
}

// Extended contract interface with approval fields
export interface ContractWithApproval {
  id: string;
  status: ContractStatus;

  // Existing contract fields
  contract_number: string;
  lessor_name: string;
  lessee_name: string;
  asset_description: string;
  lease_term_months: number;
  commencement_date: string;
  payment_frequency: string;
  payment_amount: number;
  incremental_borrowing_rate: number;

  // Approval workflow fields
  created_by?: string;
  submitted_by?: string;
  submitted_at?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  approver_id?: string;
  approver_email?: string;
  approver_name?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  approval_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}
