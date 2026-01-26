import React from 'react';

interface AmendmentNoticeProps {
  leaseData: any;
  version?: number;
}

const AmendmentNotice: React.FC<AmendmentNoticeProps> = ({ leaseData, version }) => {
  // Only show if contract has modifications
  if (!leaseData || !leaseData.hasModification || !leaseData.originalTerms || !leaseData.modifiedTerms) {
    return null;
  }

  try {
    const { originalTerms, modifiedTerms, modificationDate, agreementDate, modificationHistory } = leaseData;

  // Auto-generate list of changes by comparing originalTerms and modifiedTerms
  const generateChangesList = () => {
    const changes: string[] = [];

    // Payment changes
    if (originalTerms.FixedPaymentPerPeriod !== modifiedTerms.FixedPaymentPerPeriod) {
      const currency = leaseData.Currency || '₦';
      changes.push(
        `Fixed Payment: ${currency}${originalTerms.FixedPaymentPerPeriod?.toLocaleString() || 0} → ${currency}${modifiedTerms.FixedPaymentPerPeriod?.toLocaleString() || 0} per ${getFrequencyLabel(modifiedTerms.PaymentFrequency)}`
      );
    }

    // Payment frequency changes
    if (originalTerms.PaymentFrequency !== modifiedTerms.PaymentFrequency) {
      changes.push(
        `Payment Frequency: ${getFrequencyLabel(originalTerms.PaymentFrequency)} → ${getFrequencyLabel(modifiedTerms.PaymentFrequency)}`
      );
    }

    // Payment timing changes
    if (originalTerms.PaymentTiming !== modifiedTerms.PaymentTiming) {
      changes.push(
        `Payment Timing: ${originalTerms.PaymentTiming} → ${modifiedTerms.PaymentTiming}`
      );
    }

    // Discount rate changes
    if (originalTerms.IBR_Annual !== modifiedTerms.IBR_Annual) {
      const origIBR = (originalTerms.IBR_Annual || 0) * 100;
      const modIBR = (modifiedTerms.IBR_Annual || 0) * 100;
      changes.push(
        `Discount Rate: ${origIBR.toFixed(2)}% → ${modIBR.toFixed(2)}% per annum`
      );
    }

    // Lease term changes
    if (originalTerms.NonCancellableYears !== modifiedTerms.NonCancellableYears) {
      changes.push(
        `Non-Cancellable Term: ${originalTerms.NonCancellableYears} years → ${modifiedTerms.NonCancellableYears} years`
      );
    }

    // End date changes
    if (originalTerms.EndDate !== modifiedTerms.EndDate) {
      changes.push(
        `End Date: ${formatDate(originalTerms.EndDate)} → ${formatDate(modifiedTerms.EndDate)}`
      );
    }

    // Renewal option changes
    if (originalTerms.RenewalOptionYears !== modifiedTerms.RenewalOptionYears) {
      changes.push(
        `Renewal Option: ${originalTerms.RenewalOptionYears || 0} years → ${modifiedTerms.RenewalOptionYears || 0} years`
      );
    }

    if (originalTerms.RenewalLikelihood !== modifiedTerms.RenewalLikelihood) {
      changes.push(
        `Renewal Likelihood: ${((originalTerms.RenewalLikelihood || 0) * 100).toFixed(0)}% → ${((modifiedTerms.RenewalLikelihood || 0) * 100).toFixed(0)}%`
      );
    }

    // Termination option changes
    if (originalTerms.TerminationPoint !== modifiedTerms.TerminationPoint) {
      changes.push(
        `Termination Point: Year ${originalTerms.TerminationPoint || 0} → Year ${modifiedTerms.TerminationPoint || 0}`
      );
    }

    if (originalTerms.TerminationLikelihood !== modifiedTerms.TerminationLikelihood) {
      changes.push(
        `Termination Likelihood: ${((originalTerms.TerminationLikelihood || 0) * 100).toFixed(0)}% → ${((modifiedTerms.TerminationLikelihood || 0) * 100).toFixed(0)}%`
      );
    }

    // Initial direct costs changes
    if (originalTerms.InitialDirectCosts !== modifiedTerms.InitialDirectCosts) {
      const currency = leaseData.Currency || '₦';
      changes.push(
        `Initial Direct Costs: ${currency}${(originalTerms.InitialDirectCosts || 0).toLocaleString()} → ${currency}${(modifiedTerms.InitialDirectCosts || 0).toLocaleString()}`
      );
    }

    // Prepayments changes
    if (originalTerms.Prepayments !== modifiedTerms.Prepayments) {
      const currency = leaseData.Currency || '₦';
      changes.push(
        `Prepayments: ${currency}${(originalTerms.Prepayments || 0).toLocaleString()} → ${currency}${(modifiedTerms.Prepayments || 0).toLocaleString()}`
      );
    }

    // Lease incentives changes
    if (originalTerms.LeaseIncentives !== modifiedTerms.LeaseIncentives) {
      const currency = leaseData.Currency || '₦';
      changes.push(
        `Lease Incentives: ${currency}${(originalTerms.LeaseIncentives || 0).toLocaleString()} → ${currency}${(modifiedTerms.LeaseIncentives || 0).toLocaleString()}`
      );
    }

    // Escalation changes
    if (originalTerms.EscalationType !== modifiedTerms.EscalationType) {
      changes.push(
        `Escalation Type: ${originalTerms.EscalationType || 'None'} → ${modifiedTerms.EscalationType || 'None'}`
      );
    }

    if (originalTerms.FixedEscalationPercent !== modifiedTerms.FixedEscalationPercent) {
      changes.push(
        `Fixed Escalation Rate: ${originalTerms.FixedEscalationPercent || 0}% → ${modifiedTerms.FixedEscalationPercent || 0}%`
      );
    }

    return changes;
  };

  const getFrequencyLabel = (freq: string | undefined) => {
    if (!freq) return 'N/A';
    const labels: { [key: string]: string } = {
      'Monthly': 'month',
      'Quarterly': 'quarter',
      'Semi-Annually': 'half year',
      'Annually': 'year'
    };
    return labels[freq] || freq.toLowerCase();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

    const changes = generateChangesList();

    // Get the latest modification reason
    const latestModification = modificationHistory && modificationHistory.length > 0
      ? modificationHistory[modificationHistory.length - 1]
      : null;

    const reason = latestModification?.modificationReason || 'No reason provided';

    return (
      <div className="mb-6 border-2 border-emerald-500 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-md">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>📋</span>
            <span>LEASE AMENDMENT NOTICE</span>
          </h3>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Dates and Version */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-emerald-200">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Amendment Date</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {formatDate(agreementDate || modificationDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Effective Date</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                {formatDate(modificationDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Version</p>
              <p className="text-sm font-medium text-slate-900 mt-1">
                Version {version || leaseData.version || 2}
              </p>
            </div>
          </div>

          {/* Changes List */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
              Changes Made:
            </h4>
            {changes.length > 0 ? (
              <ul className="space-y-2">
                {changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600 italic">No changes detected</p>
            )}
          </div>

          {/* Reason */}
          <div className="pt-4 border-t border-emerald-200">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">
              Reason:
            </h4>
            <p className="text-sm text-slate-700 italic">
              {reason}
            </p>
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-emerald-200">
            <p className="text-xs text-slate-600 italic">
              All other terms remain unchanged from the original lease agreement.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering AmendmentNotice:', error);
    return null;
  }
};

export default AmendmentNotice;
