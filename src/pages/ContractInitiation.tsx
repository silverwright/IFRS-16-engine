import React, { useState, useEffect } from 'react';
import { useLeaseContext, SavedContract } from '../context/LeaseContext';
import { useSearchParams } from 'react-router-dom';
import { useContracts } from '../hooks/useContracts';
import { useAuth } from '../context/AuthContext';
import { ModeSelector } from '../components/Contract/ModeSelector';
import { BasicInfoForm } from '../components/Contract/BasicInfoForm';
import { PaymentDetailsForm } from '../components/Contract/PaymentDetailsForm';
import { AdvancedOptionsForm } from '../components/Contract/AdvancedOptionsForm';
import { LegalAdminForm } from '../components/Contract/LegalAdminForm';
import { ContractPreview } from '../components/Contract/ContractPreview';
import { FileImport } from '../components/Contract/FileImport';
import { ContractList } from '../components/Contract/ContractList';
import { ProgressBar } from '../components/UI/ProgressBar';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { ArrowLeft, ArrowRight, FileText, RefreshCw, Save, Upload } from 'lucide-react';

const steps = [
  { id: 1, name: 'Basic Info', component: BasicInfoForm },
  { id: 2, name: 'Payment Details', component: PaymentDetailsForm },
  { id: 3, name: 'Advanced Options', component: AdvancedOptionsForm },
  { id: 4, name: 'Legal & Administrative', component: LegalAdminForm },
  { id: 5, name: 'Preview & Generate', component: ContractPreview },
];

export function ContractInitiation() {
  const { state, dispatch } = useLeaseContext();
  const { saveContract, updateContract } = useContracts();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [modeSelected, setModeSelected] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'import' | 'list'>('list');
  const [editingContract, setEditingContract] = useState<SavedContract | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  useEffect(() => {
    const isEditMode = searchParams.get('edit') === 'true';
    const contractId = searchParams.get('contractId');

    if (isEditMode && contractId) {
      const contract = state.savedContracts.find(c => c.id === contractId);
      if (contract && editingContract?.id !== contractId) {
        setEditingContract(contract);
        dispatch({ type: 'SET_MODE', payload: contract.mode });
        dispatch({ type: 'LOAD_CONTRACT', payload: contract.data });
        setModeSelected(true);
        setActiveTab('form');
        setCurrentStep(1);
      }
    } else if (isEditMode && state.leaseData.ContractID && !editingContract) {
      setModeSelected(true);
      setActiveTab('form');
      setCurrentStep(1);
    }
  }, [searchParams, state.savedContracts, dispatch, editingContract, state.leaseData.ContractID]);

  // Filter steps based on mode
  const activeSteps = state.mode === 'FULL'
    ? steps
    : steps.filter(step => step.name !== 'Legal & Administrative');

  const CurrentStepComponent =
    activeSteps.find(step => step.id === currentStep)?.component || BasicInfoForm;

  const nextStep = () => {
    // Find next step ID in activeSteps
    const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
    if (currentIndex >= 0 && currentIndex < activeSteps.length - 1) {
      setCurrentStep(activeSteps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    // Find previous step ID in activeSteps
    const currentIndex = activeSteps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(activeSteps[currentIndex - 1].id);
    }
  };

  const handleModeChange = (mode: 'MINIMAL' | 'FULL') => {
    dispatch({ type: 'SET_MODE', payload: mode });
    setModeSelected(true);
    if (activeTab !== 'import') {
      setActiveTab('form');
    }
  };

  const resetMode = () => {
    setModeSelected(false);
    setCurrentStep(1);
    setActiveTab('form');
    setEditingContract(null);
    dispatch({ type: 'RESET' });
  };

  const handleSaveContract = async () => {
    try {
      // Validate: If Payment in Advance is selected, prepayment amount is required
      if (state.leaseData.PaymentTiming === 'Advance') {
        if (!state.leaseData.PrepaymentsBeforeCommencement || state.leaseData.PrepaymentsBeforeCommencement <= 0) {
          setShowValidationModal(true);
          return;
        }
      }

      const contractData = {
        contractId: state.leaseData.ContractID || '',
        lessorName: state.leaseData.LessorName || '',
        lesseeName: state.leaseData.LesseeEntity || '',
        assetDescription: state.leaseData.AssetDescription || '',
        commencementDate: state.leaseData.CommencementDate || '',
        status: 'draft' as const, // Default status is 'draft'
        data: state.leaseData,
        mode: state.mode,
        createdBy: user?.id // Include user ID
      };

      // Check if this is truly an existing database contract (has UUID format ID)
      // vs an imported contract (has timestamp-based ID like "1765410027849-0")
      // Database UUIDs are formatted like: "550e8400-e29b-41d4-a716-446655440000"
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isExistingDbContract = editingContract &&
        editingContract.id &&
        uuidPattern.test(editingContract.id);

      if (isExistingDbContract) {
        await updateContract(editingContract.id, contractData);
        alert('Contract updated successfully!');
      } else {
        // Treat as new contract (either no editingContract, or imported contract)
        await saveContract(contractData);
        alert('Contract saved successfully!');
      }

      // Reset form after successful save
      setEditingContract(null);
      dispatch({ type: 'RESET' });
      setModeSelected(false);
      setActiveTab('list');
    } catch (error) {
      alert(`Failed to save contract. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Save error:', error);
    }
  };

  const handleEditContract = (contract: SavedContract) => {
    setEditingContract(contract);
    dispatch({ type: 'SET_MODE', payload: contract.mode });
    dispatch({ type: 'LOAD_CONTRACT', payload: contract.data });
    setModeSelected(true);
    setActiveTab('form');
    setCurrentStep(1);
  };

  const handleNewContract = () => {
    setEditingContract(null);
    dispatch({ type: 'RESET' });
    setModeSelected(false);
    setActiveTab('form');
  };

  const handleCSVUploadComplete = () => {
    setModeSelected(true);
    setActiveTab('form');
    setCurrentStep(1);
  };

  const handleModeRequired = () => {
    setModeSelected(false);
    setActiveTab('form');
  };

  if (!modeSelected && activeTab === 'form') {
    return (
      <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-white/10 p-6 flex items-start gap-3 shadow-2xl">
          <div className="w-12 h-12 bg-emerald-500/20 dark:bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Contract Initiation & Approval
            </h1>
            <p className="text-slate-700 dark:text-white/80">
              Select a mode to start creating your lease contract
            </p>
          </div>
        </div>

        <ModeSelector currentMode={state.mode} onModeChange={handleModeChange} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 space-y-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-200/80 to-slate-300/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm rounded-xl border border-slate-400/50 dark:border-slate-600/50 p-6 flex items-start gap-3 shadow-2xl">
        <div className="w-12 h-12 bg-emerald-500/20 dark:bg-emerald-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg">
          <FileText className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Contract Initiation & Approval
          </h1>
          <p className="text-slate-700 dark:text-slate-300">
            {modeSelected ? `Running in ${state.mode} mode` : 'Manage your lease contracts'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-300 dark:border-slate-600/50 shadow-2xl overflow-hidden">
        <div className="border-b border-slate-300 dark:border-slate-600/50">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'list', name: 'Contract List', icon: FileText },
              { id: 'form', name: 'Create/Edit Contract', icon: FileText },
              { id: 'import', name: 'Import Contracts', icon: Upload },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-emerald-500 dark:border-emerald-500 text-emerald-500 dark:text-emerald-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' && (
            <ContractList
              onEditContract={handleEditContract}
              onNewContract={handleNewContract}
            />
          )}

          {activeTab === 'import' && (
            <FileImport
              onUploadComplete={() => setActiveTab('list')}
              onModeRequired={handleModeRequired}
            />
          )}

          {activeTab === 'form' && modeSelected && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <ProgressBar steps={activeSteps} currentStep={currentStep} />

              {/* Form Content */}
              <div className="bg-white dark:bg-slate-700/40 backdrop-blur-sm rounded-xl border border-slate-300 dark:border-slate-600/50 p-6 shadow-lg">
                <CurrentStepComponent />
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetMode}
                  className="flex items-center gap-2 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Mode Selection
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSaveContract}
                    disabled={!state.leaseData.ContractID}
                    className="flex items-center gap-2 border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-cyan-500 dark:hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-700 dark:disabled:hover:text-slate-300"
                  >
                    <Save className="w-4 h-4" />
                    Save Contract
                  </Button>

                  {currentStep < activeSteps[activeSteps.length - 1].id && (
                    <Button onClick={nextStep} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-500 dark:to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 dark:hover:from-emerald-600 dark:hover:to-cyan-600 text-white border-0 shadow-lg shadow-emerald-500/30">
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Modal for Payment in Advance */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validation Error"
        message="Payment in Advance requires a prepayment amount. Please enter the prepayment amount before saving."
        type="error"
      />
    </div>
  );
}