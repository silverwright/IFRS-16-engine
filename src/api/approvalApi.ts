import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const approvalApi = {
  // Submit contract for approval (draft -> pending)
  submitContract: async (contractId: string, submittedBy: string) => {
    const response = await axios.patch(
      `${API_BASE_URL}/contracts/${contractId}/submit`,
      { submittedBy }
    );
    return response.data;
  },

  // Start review (pending -> under_review)
  startReview: async (contractId: string, reviewerId: string) => {
    const response = await axios.patch(
      `${API_BASE_URL}/contracts/${contractId}/review`,
      { reviewerId }
    );
    return response.data;
  },

  // Approve contract (under_review/pending -> approved)
  approveContract: async (
    contractId: string,
    approverId: string,
    approverEmail: string,
    approverName: string,
    notes?: string
  ) => {
    const response = await axios.patch(
      `${API_BASE_URL}/contracts/${contractId}/approve`,
      { approverId, approverEmail, approverName, notes }
    );
    return response.data;
  },

  // Reject contract (under_review/pending -> rejected)
  rejectContract: async (
    contractId: string,
    approverId: string,
    approverEmail: string,
    approverName: string,
    reason: string
  ) => {
    const response = await axios.patch(
      `${API_BASE_URL}/contracts/${contractId}/reject`,
      { approverId, approverEmail, approverName, reason }
    );
    return response.data;
  },

  // Get approval history for a contract
  getApprovalHistory: async (contractId: string) => {
    const response = await axios.get(
      `${API_BASE_URL}/contracts/${contractId}/history`
    );
    return response.data;
  },
};
