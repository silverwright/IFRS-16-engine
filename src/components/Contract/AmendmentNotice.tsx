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

  // Auto-generate grouped list of changes by comparing originalTerms and modifiedTerms
  const generateChangesList = () => {
    const paymentChanges: string[] = [];
    const financialChanges: string[] = [];
    const leaseTermChanges: string[] = [];
    const otherChanges: string[] = [];

    // Payment changes
    if (originalTerms.FixedPaymentPerPeriod !== modifiedTerms.FixedPaymentPerPeriod) {
      const currency = leaseData.Currency || '₦';
      paymentChanges.push(
        `Fixed Payment: ${currency}${originalTerms.FixedPaymentPerPeriod?.toLocaleString() || 0} → ${currency}${modifiedTerms.FixedPaymentPerPeriod?.toLocaleString() || 0} per ${getFrequencyLabel(modifiedTerms.PaymentFrequency)}`
      );
    }

    // Payment frequency
    if (modifiedTerms.PaymentFrequency === undefined) {
      if (originalTerms.PaymentFrequency) {
        paymentChanges.push(
          `Frequency: ${getFrequencyLabel(originalTerms.PaymentFrequency)} (No Change)`
        );
      }
    } else if (originalTerms.PaymentFrequency !== modifiedTerms.PaymentFrequency) {
      paymentChanges.push(
        `Frequency: ${getFrequencyLabel(originalTerms.PaymentFrequency)} → ${getFrequencyLabel(modifiedTerms.PaymentFrequency)}`
      );
    } else if (originalTerms.PaymentFrequency) {
      paymentChanges.push(
        `Frequency: ${getFrequencyLabel(originalTerms.PaymentFrequency)} (no change)`
      );
    }

    // Payment timing
    if (modifiedTerms.PaymentTiming === undefined) {
      if (originalTerms.PaymentTiming) {
        paymentChanges.push(
          `Timing: ${originalTerms.PaymentTiming} (No Change)`
        );
      }
    } else if (originalTerms.PaymentTiming !== modifiedTerms.PaymentTiming) {
      paymentChanges.push(
        `Timing: ${originalTerms.PaymentTiming} → ${modifiedTerms.PaymentTiming}`
      );
    } else if (originalTerms.PaymentTiming) {
      paymentChanges.push(
        `Timing: ${originalTerms.PaymentTiming} (no change)`
      );
    }

    // Discount rate changes
    if (originalTerms.IBR_Annual !== modifiedTerms.IBR_Annual) {
      const origIBR = (originalTerms.IBR_Annual || 0) * 100;
      const modIBR = (modifiedTerms.IBR_Annual || 0) * 100;
      financialChanges.push(
        `Discount Rate: ${origIBR.toFixed(2)}% → ${modIBR.toFixed(2)}% per annum`
      );
    }

    // Initial direct costs changes
    if (originalTerms.InitialDirectCosts !== modifiedTerms.InitialDirectCosts) {
      const currency = leaseData.Currency || '₦';
      financialChanges.push(
        `Initial Direct Costs: ${currency}${(originalTerms.InitialDirectCosts || 0).toLocaleString()} → ${currency}${(modifiedTerms.InitialDirectCosts || 0).toLocaleString()}`
      );
    }

    // Prepayments changes
    if (originalTerms.Prepayments !== modifiedTerms.Prepayments) {
      const currency = leaseData.Currency || '₦';
      financialChanges.push(
        `Prepayments: ${currency}${(originalTerms.Prepayments || 0).toLocaleString()} → ${currency}${(modifiedTerms.Prepayments || 0).toLocaleString()}`
      );
    }

    // Lease incentives changes
    if (originalTerms.LeaseIncentives !== modifiedTerms.LeaseIncentives) {
      const currency = leaseData.Currency || '₦';
      financialChanges.push(
        `Lease Incentives: ${currency}${(originalTerms.LeaseIncentives || 0).toLocaleString()} → ${currency}${(modifiedTerms.LeaseIncentives || 0).toLocaleString()}`
      );
    }

    // Lease term changes
    if (modifiedTerms.NonCancellableYears === undefined) {
      if (originalTerms.NonCancellableYears) {
        leaseTermChanges.push(
          `Non-Cancellable Term: ${originalTerms.NonCancellableYears} years (No Change)`
        );
      }
    } else if (originalTerms.NonCancellableYears !== modifiedTerms.NonCancellableYears) {
      leaseTermChanges.push(
        `Non-Cancellable Term: ${originalTerms.NonCancellableYears} years → ${modifiedTerms.NonCancellableYears} years`
      );
    }

    // End date changes
    if (modifiedTerms.EndDate === undefined) {
      if (originalTerms.EndDate) {
        leaseTermChanges.push(
          `End Date: ${formatDate(originalTerms.EndDate)} (No Change)`
        );
      }
    } else if (originalTerms.EndDate !== modifiedTerms.EndDate) {
      leaseTermChanges.push(
        `End Date: ${formatDate(originalTerms.EndDate)} → ${formatDate(modifiedTerms.EndDate)}`
      );
    }

    // Renewal option changes
    if (originalTerms.RenewalOptionYears !== modifiedTerms.RenewalOptionYears) {
      leaseTermChanges.push(
        `Renewal Option: ${originalTerms.RenewalOptionYears || 0} years → ${modifiedTerms.RenewalOptionYears || 0} years`
      );
    }

    if (originalTerms.RenewalLikelihood !== modifiedTerms.RenewalLikelihood) {
      leaseTermChanges.push(
        `Renewal Likelihood: ${((originalTerms.RenewalLikelihood || 0) * 100).toFixed(0)}% → ${((modifiedTerms.RenewalLikelihood || 0) * 100).toFixed(0)}%`
      );
    }

    // Termination option changes
    if (originalTerms.TerminationPoint !== modifiedTerms.TerminationPoint) {
      leaseTermChanges.push(
        `Termination Point: Year ${originalTerms.TerminationPoint || 0} → Year ${modifiedTerms.TerminationPoint || 0}`
      );
    }

    if (originalTerms.TerminationLikelihood !== modifiedTerms.TerminationLikelihood) {
      leaseTermChanges.push(
        `Termination Likelihood: ${((originalTerms.TerminationLikelihood || 0) * 100).toFixed(0)}% → ${((modifiedTerms.TerminationLikelihood || 0) * 100).toFixed(0)}%`
      );
    }

    // Escalation changes
    if (originalTerms.EscalationType !== modifiedTerms.EscalationType) {
      otherChanges.push(
        `Escalation Type: ${originalTerms.EscalationType || 'None'} → ${modifiedTerms.EscalationType || 'None'}`
      );
    }

    if (originalTerms.FixedEscalationPercent !== modifiedTerms.FixedEscalationPercent) {
      otherChanges.push(
        `Fixed Escalation Rate: ${originalTerms.FixedEscalationPercent || 0}% → ${modifiedTerms.FixedEscalationPercent || 0}%`
      );
    }

    return { paymentChanges, financialChanges, leaseTermChanges, otherChanges };
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
            {(() => {
              const { paymentChanges, financialChanges, leaseTermChanges, otherChanges } = changes;
              const hasAnyChanges = paymentChanges.length > 0 || financialChanges.length > 0 ||
                                    leaseTermChanges.length > 0 || otherChanges.length > 0;

              if (!hasAnyChanges) {
                return <p className="text-sm text-slate-600 italic">No changes detected</p>;
              }

              return (
                <div className="space-y-4">
                  {/* Payment Terms Section */}
                  {paymentChanges.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        Payment Terms:
                      </h5>
                      <ul className="space-y-2 ml-4">
                        {paymentChanges.map((change, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-emerald-600 font-bold mt-0.5 flex-shrink-0">•</span>
                            <span className="leading-relaxed">{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Financial Terms Section */}
                  {financialChanges.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        Financial Terms:
                      </h5>
                      <ul className="space-y-1.5 ml-4">
                        {financialChanges.map((change, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lease Term & Options Section */}
                  {leaseTermChanges.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        Lease Term & Options:
                      </h5>
                      <ul className="space-y-1.5 ml-4">
                        {leaseTermChanges.map((change, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Other Changes Section */}
                  {otherChanges.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                        Other Changes:
                      </h5>
                      <ul className="space-y-1.5 ml-4">
                        {otherChanges.map((change, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
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
