import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContracts } from '../hooks/useContracts';
import { SavedContract } from '../context/LeaseContext';
import { StatusBadge } from '../components/Contract/StatusBadge';
import { approvalApi } from '../services/approvalApi';
import { CheckCircle, XCircle, Clock, Eye, Calendar, Building, User, FileText } from 'lucide-react';
import { Button } from '../components/UI/Button';

export function ApprovalDashboard() {
  const { user, userProfile, hasRole } = useAuth();
  const { contracts, loadContracts } = useContracts();
  const [selectedContract, setSelectedContract] = useState<SavedContract | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  // Filter contracts based on user role
  const getFilteredContracts = () => {
    if (!userProfile) return [];

    // Approvers and admins see contracts pending approval or under review
    if (hasRole(['approver']) || hasRole(['admin'])) {
      return contracts.filter(
        (c) => c.status === 'pending' || c.status === 'under_review'
      );
    }

    // Creators see their own contracts
    return contracts.filter((c) => c.status !== 'draft');
  };

  const handleOpenApprovalModal = (contract: SavedContract, actionType: 'approve' | 'reject') => {
    setSelectedContract(contract);
    setAction(actionType);
    setNotes('');
    setShowApprovalModal(true);
  };

  const handleStartReview = async (contract: SavedContract) => {
    if (!user?.id) {
      alert('You must be logged in to start a review');
      return;
    }

    if (contract.status !== 'pending') {
      alert('Only pending contracts can be moved to review');
      return;
    }

    if (confirm(`Start reviewing contract ${contract.contractId}?`)) {
      try {
        await approvalApi.startReview(contract.id, user.id);
        alert('Contract moved to under review!');

        // Reload contracts to get updated status
        await loadContracts();
      } catch (error: any) {
        console.error('Error starting review:', error);
        alert(error.response?.data?.error || 'Failed to start review');
      }
    }
  };

  const handleSubmitApproval = async () => {
    if (!selectedContract || !action || !user || !userProfile) return;

    if (action === 'reject' && !notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);

      if (action === 'approve') {
        await approvalApi.approveContract(
          selectedContract.id,
          user.id,
          userProfile.email,
          `${userProfile.first_name} ${userProfile.last_name}` || userProfile.email,
          notes
        );
        alert('Contract approved successfully!');
      } else {
        await approvalApi.rejectContract(
          selectedContract.id,
          user.id,
          userProfile.email,
          `${userProfile.first_name} ${userProfile.last_name}` || userProfile.email,
          notes
        );
        alert('Contract rejected successfully!');
      }

      // Reload contracts
      await loadContracts();
      setShowApprovalModal(false);
      setSelectedContract(null);
      setAction(null);
      setNotes('');
    } catch (error: any) {
      console.error('Error processing approval:', error);
      alert(error.response?.data?.error || 'Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  const filteredContracts = getFilteredContracts();

  // Check if user has permission to view this page
  if (!hasRole(['approver']) && !hasRole(['admin'])) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md mx-4 text-center">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-300 dark:border-slate-700">
            <Clock className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Approver Access Required
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              You need Approver or Admin role to access this page.
            </p>
            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                Current user: <span className="font-semibold">{userProfile?.email || 'Unknown'}</span>
              </p>
              <p>
                User ID: <span className="font-semibold font-mono text-xs">{user?.id || 'Not logged in'}</span>
              </p>
              <p>
                Current role: <span className="font-semibold capitalize">{userProfile?.role || 'user'}</span>
              </p>
              <p>
                Profile loaded: <span className="font-semibold">{userProfile ? 'Yes' : 'No'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-700/50 p-6 flex items-center gap-3 shadow-xl">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Approval Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Review and approve contracts pending your action
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-slate-300 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Pending Review
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  {contracts.filter((c) => c.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-slate-300 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Under Review
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {contracts.filter((c) => c.status === 'under_review').length}
                </p>
              </div>
              <Eye className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl p-6 border border-slate-300 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Approved
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {contracts.filter((c) => c.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-slate-300 dark:border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-300 dark:border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Contracts Awaiting Approval
          </h2>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              No contracts are currently awaiting your approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Contract ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Lessee/Lessor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Commencement
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-50 dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-slate-700/50">
                {filteredContracts.map((contract, index) => (
                  <tr
                      key={contract.id}
                      className={`${
                        index % 2 === 0
                          ? 'bg-white dark:bg-slate-800/20'
                          : 'bg-slate-50 dark:bg-slate-700/30'
                      } hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {contract.contractId}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {contract.mode} mode
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-900 dark:text-white">
                            <Building className="w-3 h-3 mr-1 text-slate-500 dark:text-slate-400" />
                            {contract.lessorName || 'N/A'}
                          </div>
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <User className="w-3 h-3 mr-1 text-slate-500 dark:text-slate-400" />
                            {contract.lesseeName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white max-w-xs truncate" title={contract.assetDescription}>
                          {contract.assetDescription}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-900 dark:text-slate-300">
                          <Calendar className="w-3 h-3 mr-1 text-slate-500 dark:text-slate-400" />
                          {formatDate(contract.commencementDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={contract.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Show "Start Review" button only for pending contracts */}
                          {contract.status === 'pending' && (
                            <button
                              onClick={() => handleStartReview(contract)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs font-medium"
                              title="Start Review"
                            >
                              <Eye className="w-3 h-3" />
                              Start Review
                            </button>
                          )}

                          {/* Show Approve/Reject for under_review contracts */}
                          {contract.status === 'under_review' && (
                            <>
                              <button
                                onClick={() => handleOpenApprovalModal(contract, 'approve')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-xs font-medium"
                                title="Approve"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenApprovalModal(contract, 'reject')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs font-medium"
                                title="Reject"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedContract && action && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full border border-slate-300 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-300 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {action === 'approve' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Approve Contract
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    Reject Contract
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedContract(null);
                  setAction(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Contract Details */}
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
                  Contract Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Contract ID:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-white">
                      {selectedContract.contractId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Lessee:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-white">
                      {selectedContract.lesseeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Asset:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-white">
                      {selectedContract.assetDescription}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Commencement:</span>
                    <span className="ml-2 font-medium text-slate-900 dark:text-white">
                      {formatDate(selectedContract.commencementDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes/Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  {action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={
                    action === 'approve'
                      ? 'Add any notes about this approval...'
                      : 'Please provide a reason for rejection...'
                  }
                  required={action === 'reject'}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitApproval}
                  disabled={processing || (action === 'reject' && !notes.trim())}
                  className={`flex items-center gap-2 ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? 'Processing...' : action === 'approve' ? 'Approve Contract' : 'Reject Contract'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedContract(null);
                    setAction(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
