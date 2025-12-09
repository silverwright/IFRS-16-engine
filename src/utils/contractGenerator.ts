import { LeaseData } from '../context/LeaseContext';

export function generateContractHTML(leaseData: Partial<LeaseData>, mode: 'MINIMAL' | 'FULL'): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  if (mode === 'MINIMAL') {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="margin-bottom: 1rem; color: #1e40af;">LEASE AGREEMENT</h1>
        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #ccc;">
          <strong>Contract ID:</strong> ${leaseData.ContractID || 'N/A'} |
          <strong>Date:</strong> ${leaseData.ContractDate ? formatDate(leaseData.ContractDate) : 'N/A'}
        </div>

        <h2 style="color: #1e40af; margin-top: 1.5rem;">Schedule — Key Commercial Terms</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Lessor</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.LessorName || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Lessee</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.LesseeEntity || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Asset</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.AssetDescription || 'N/A'} (${leaseData.AssetClass || 'N/A'})</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Commencement</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.CommencementDate ? formatDate(leaseData.CommencementDate) : 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Term (Firm)</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.NonCancellableYears || 0} years, ending ${leaseData.EndDateOriginal ? formatDate(leaseData.EndDateOriginal) : 'TBD'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Rent</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.Currency} ${formatCurrency(leaseData.FixedPaymentPerPeriod || 0)} / ${leaseData.PaymentFrequency || 'N/A'}, payable in ${leaseData.PaymentTiming || 'advance'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Currency / IBR</td><td style="padding: 8px; border: 1px solid #ddd;">${leaseData.Currency || 'N/A'} / IBR (annual): ${((leaseData.IBR_Annual || 0) * 100).toFixed(2)}%</td></tr>
        </table>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">1. Parties and Definitions</h2>
        <p>This agreement (the "Agreement") is between <strong>${leaseData.LessorName || 'Lessor'}</strong> (the "Lessor") and <strong>${leaseData.LesseeEntity || 'Lessee'}</strong> (the "Lessee").</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">2. Lease and Title</h2>
        <p>2.1 Lessor leases the equipment described in Schedule (the "Asset") to Lessee for the Term. Title to the Asset remains with Lessor at all times.</p>
        <p>2.2 No right, title or interest passes to Lessee other than the leasehold interest. The Asset is a chattel separate from any site.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">3. Delivery, Commissioning and Acceptance</h2>
        <p>3.1 Delivery and commissioning shall occur by ${leaseData.CommencementDate ? formatDate(leaseData.CommencementDate) : 'TBD'} (or as otherwise agreed).</p>
        <p>3.2 Risk Transfer: Risk passes upon Signing of Acceptance Certificate; title remains with Lessor.</p>
        <p>3.3 Acceptance: Upon successful commissioning and Lessee's execution of the Acceptance Certificate, the Asset is deemed accepted. If defects are identified, Lessor shall rectify within a reasonable cure period; acceptance follows re-test.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">4. Rent; Payment Mechanics; Escalation</h2>
        <p>4.1 Lessee shall pay rent of ${leaseData.Currency} ${formatCurrency(leaseData.FixedPaymentPerPeriod || 0)} per ${leaseData.PaymentFrequency || 'period'} in ${leaseData.PaymentTiming || 'advance'} without set-off or counterclaim.</p>
        <p>4.2 Late amounts accrue default interest at the maximum rate permitted by law.</p>
        <p>4.3 Escalation: Rent may be adjusted as specified in the contract terms.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">5. Taxes; Withholding; Gross-Up</h2>
        <p>All amounts are exclusive of taxes. If Lessee is required by law to withhold or deduct taxes from a payment, Lessee shall gross-up so that Lessor receives the amount it would have received absent such withholding, except for taxes on Lessor's net income.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">6. Use; Maintenance; Relocation; Software</h2>
        <p>6.1 Lessee shall use the Asset solely for lawful business purposes and keep it in good working order per manufacturer specs.</p>
        <p>6.2 No relocation without Lessor consent.</p>
        <p>6.3 Embedded software is licensed on a non-exclusive, non-transferable, term-limited basis. Lessee shall not tamper with firmware or controls.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">7. Insurance</h2>
        <p>Lessee shall insure the Asset for its full value and maintain adequate third-party liability insurance with an insurer rated at least "A".</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">8. Compliance Undertakings</h2>
        <p>Lessee shall comply with applicable law, maintain anti-bribery and sanctions controls, and operate the Asset in line with ESG requirements.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">9. Events of Default; Remedies</h2>
        <p>Events include non-payment, breach, insolvency, unlawful use, failure to insure, or unauthorised relocation. On default, Lessor may terminate, demand payment, repossess, and claim damages.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">10. Risk; Loss and Damage</h2>
        <p>From risk transfer, Lessee bears risk of loss or damage (except Lessor's wilful misconduct). Insurance proceeds are applied to repair or settlement.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">11. Assignment and Sub-leasing</h2>
        <p>Lessee may not assign or sub-lease without consent. Lessor may assign or finance rights with notice.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">12. Data; Metering; Audit Rights</h2>
        <p>Where the Asset generates data, Lessee grants Lessor access for maintenance and billing. Lessee shall permit reasonable audits upon notice.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">13. Force Majeure</h2>
        <p>Neither Party is liable for failure or delay caused by events beyond its control, provided mitigation efforts are made.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">14. Dispute Resolution; Governing Law</h2>
        <p>Disputes are referred to arbitration, language English. This Agreement is governed by the laws applicable to the jurisdiction.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">15. Notices</h2>
        <p>Notices shall be delivered to addresses provided by the parties. Email may be used for operational communications but not for service of proceedings unless agreed.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">16. Entire Agreement; Variation; Severability</h2>
        <p>This Agreement is the entire agreement. Amendments must be in writing signed by both Parties. Invalid provisions do not affect the remainder.</p>

        <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">17. Signatures</h2>
        <table style="width: 100%; border: none; margin: 0.5rem 0;">
          <tr><td style="border: none; padding: 4px 0; font-weight: bold;">Lessor:</td><td style="border: none; padding: 4px 0;">${leaseData.LessorName || 'N/A'}</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">By: ____________________</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Name: ____________________</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Title: Director</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Date: ${leaseData.ContractDate ? formatDate(leaseData.ContractDate) : '________'}</td></tr>
        </table>

        <table style="width: 100%; border: none; margin: 1.5rem 0 0.5rem 0;">
          <tr><td style="border: none; padding: 4px 0; font-weight: bold;">Lessee:</td><td style="border: none; padding: 4px 0;">${leaseData.LesseeEntity || 'N/A'}</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">By: ____________________</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Name: ____________________</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Title: Authorized Signatory</td></tr>
          <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Date: ${leaseData.ContractDate ? formatDate(leaseData.ContractDate) : '________'}</td></tr>
        </table>

        <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 0.9em; color: #666;">
          <p><em>This is a system-generated contract preview. Final execution requires legal review and party signatures.</em></p>
        </div>
      </div>
    `;
  }

  // Full mode contract
return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="margin-bottom: 1rem; color: #1e40af;">MASTER EQUIPMENT LEASE AGREEMENT</h1>
    <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #ccc;">
      <strong>Contract ID:</strong> ${leaseData.ContractID || 'N/A'} | 
      <strong>Date:</strong> ${leaseData.ContractDate ? formatDate(leaseData.ContractDate) : 'N/A'}
    </div>

    <h2 style="color: #1e40af; margin-top: 1.5rem;">Schedule 1 — Key Commercial Terms</h2>
   <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Lessor</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.LessorName || 'N/A'} (${leaseData.LessorJurisdiction || 'N/A'})<br>
      RC-${leaseData.LessorRCNumber || 'N/A'}<br>
      ${leaseData.LessorAddress || 'N/A'}
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Lessee</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.LesseeEntity || 'N/A'} (${leaseData.LesseeJurisdiction || 'N/A'})<br>
      RC-${leaseData.LesseeRCNumber || 'N/A'}<br>
      ${leaseData.LesseeAddress || 'N/A'}
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Asset</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.AssetDescription || 'N/A'} (${leaseData.AssetClass || 'N/A'}) at ${leaseData.AssetLocation || 'N/A'}
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Commencement</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.CommencementDate ? formatDate(leaseData.CommencementDate) : 'TBD'}
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Term (Firm)</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.NonCancellableYears || 0}.0 years, ending ${leaseData.EndDateOriginal ? formatDate(leaseData.EndDateOriginal) : 'TBD'}
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Options</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      Renewal: ${leaseData.RenewalYears || 0}.0 years (likelihood for reporting: ${leaseData.RenewalLikelihood || 'N/A'}). 
      Termination option point: End of Year ${leaseData.TerminationYear || 'N/A'} (penalty ${leaseData.TerminationPenalty || 'N/A'}).
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Rent</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.Currency || 'N/A'} ${formatCurrency(leaseData.FixedPaymentPerPeriod || 0)} per ${leaseData.PaymentFrequency || 'period'}; payable in ${leaseData.PaymentTiming || 'advance'}.
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Escalation</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.EscalationType || 'CPI-linked'} (Base ${leaseData.BaseCPI || 0}); reset month 1; first reset +${leaseData.EscalationResetYears || 1} year(s).
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Prepayments / IDC / Incentives</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${formatCurrency(leaseData.PrepaymentsBeforeCommencement || 0)} / ${formatCurrency(leaseData.InitialDirectCosts  || 0)} / ${formatCurrency(leaseData.LeaseIncentives || 0)}
    </td>
  </tr>
  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Purchase Option / RVG</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${formatCurrency(leaseData.PurchaseOptionPrice || 0)} / ${formatCurrency(leaseData.ResidualValueGuarantee || 0)} (RVG reasonably certain? ${leaseData.RVG_Certain || 'No'})
    </td>
  </tr>

  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Currency / IBR</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.Currency || 'N/A'} / IBR (annual): ${((leaseData.IBR_Annual || 0) * 100).toFixed(1)}%
    </td>
  </tr>

  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Bank Details</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.BankName || 'N/A'} – ${leaseData.BankAccountName || 'N/A'} – ${leaseData.BankAccountNo || 'N/A'}
    </td>
  </tr>

  <tr>
    <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Governing Law / Disputes</td>
    <td style="padding: 8px; border: 1px solid #ddd;">
      ${leaseData.GoverningLaw || 'Laws of the Federal Republic of Nigeria'} / ${leaseData.ArbitrationRules || 'Lagos Court of Arbitration Rules'} (Seat ${leaseData.AssetLocation || 'Lagos, Nigeria'})
    </td>
  </tr>
</table>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">1. Parties and Definitions</h2>
    <p>This agreement (the “Agreement”) is between <strong>${leaseData.LessorName || 'Lessor'}</strong> (the “Lessor”) and <strong>${leaseData.LesseeEntity || 'Lessee'}</strong> (the “Lessee”).</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">2. Lease and Title</h2>
    <p>2.1 Lessor leases the equipment described in Schedule 1 (the “Asset”) to Lessee for the Term. Title to the Asset remains with Lessor at all times.</p>
    <p>2.2 No right, title or interest passes to Lessee other than the leasehold interest. The Asset is a chattel separate from any site.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">3. Delivery, Commissioning and Acceptance</h2>
    <p>3.1 Delivery and commissioning shall occur at ${leaseData.AssetLocation || 'Lessee HQ, Lagos'} by ${leaseData.CommencementDate ? formatDate(leaseData.CommencementDate) : 'TBD'} (or as otherwise agreed).</p>
    <p>3.2 Risk Transfer: Risk passes upon Signing of Acceptance Certificate; title remains with Lessor.</p>
    <p>3.3 Acceptance: Upon successful commissioning and Lessee’s execution of the Acceptance Certificate (Schedule 4), the Asset is deemed accepted. If defects are identified, Lessor shall rectify within a reasonable cure period; acceptance follows re-test.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">4. Rent; Payment Mechanics; Escalation</h2>
    <p>4.1 Lessee shall pay rent of ${leaseData.Currency} ${formatCurrency(leaseData.FixedPaymentPerPeriod || 0)} per ${leaseData.PaymentFrequency || 'period'} in ${leaseData.PaymentTiming || 'advance'} without set-off or counterclaim, to the account in Schedule 1.</p>
    <p>4.2 Late amounts accrue default interest at the maximum rate permitted by law.</p>
    <p>4.3 Escalation: Rent is adjusted by reference to ${leaseData.EscalationType || 'CPI'} (Base ${leaseData.BaseCPI || 0}), reset in month 1, first reset ${leaseData.EscalationResetYears || 1} year(s) after commencement. If CPI is discontinued or materially changed, the Parties shall in good faith select a
    successor index that most closely reflects CPI movements.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">5. Taxes; Withholding; Gross-Up</h2>
    <p>All amounts are exclusive of taxes. If Lessee is required by law to withhold or deduct taxes from a
    payment, Lessee shall gross-up so that Lessor receives the amount it would have received absent such
    withholding, except for taxes on Lessor’s net income.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">6. Use; Maintenance; Relocation; Software</h2>
    <p>6.1 Lessee shall use the Asset solely for lawful business purposes and keep it in good working order per manufacturer specs.</p>
    <p>6.2 No relocation without Lessor consent.</p>
    <p>6.3 Embedded software is licensed on a non-exclusive, non-transferable, term-limited basis. Lessee shall not tamper with firmware or controls.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">7. Insurance</h2>
    <p>Lessee shall insure the Asset for not less than ${leaseData.Currency || 'NGN'} ${formatCurrency(leaseData.InsuranceSumInsured || 0)} and maintain third-party liability of at least ${leaseData.Currency || 'NGN'} ${formatCurrency(leaseData.InsuranceTPLimit || 0)} with an insurer rated at least "${leaseData.InsurerRatingMin || 'A'}".</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">8. Compliance Undertakings</h2>
    <p>Lessee shall comply with applicable law, maintain anti-bribery and sanctions controls, and operate the Asset in line with ESG requirements (Schedule 5).</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">9. Events of Default; Remedies</h2>
    <p>Events include non-payment, breach, insolvency, unlawful use, failure to insure, or unauthorised relocation. On default, Lessor may terminate, demand payment, repossess, and claim damages.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">10. Risk; Loss and Damage</h2>
    <p>From risk transfer, Lessee bears risk of loss or damage (except Lessor’s wilful misconduct). Insurance proceeds are applied to repair or settlement.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">11. Assignment and Sub-leasing</h2>
    <p>Lessee may not assign or sub-lease without consent. Lessor may assign or finance rights with notice.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">12. Data; Metering; Audit Rights</h2>
    <p>Where the Asset generates data, Lessee grants Lessor access for maintenance and billing. Lessee shall permit reasonable audits upon notice.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">13. Force Majeure</h2>
    <p>Neither Party is liable for failure or delay caused by events beyond its control, provided mitigation efforts are made.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">14. Dispute Resolution; Governing Law</h2>
    <p>Disputes are referred to arbitration under ${leaseData.ArbitrationRules || 'Lagos Court of Arbitration Rules'}, seat Lagos, Nigeria, language English. This Agreement is governed by ${leaseData.GoverningLaw || 'Laws of the Federal Republic of Nigeria'}.</p>

    <h2 style="color: #black; margin-top: 1.5rem;font-weight: bold;">15. Notices</h2>
    <p>Notices shall be delivered to addresses in Schedule 1. Email may be used for operational communications but not for service of proceedings unless agreed.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">16. Entire Agreement; Variation; Severability</h2>
    <p>This Agreement (including Schedules) is the entire agreement. Amendments must be in writing signed by both Parties. Invalid provisions do not affect the remainder.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">17. Signatures</h2>
    <table style="width: 100%; border: none; margin: 0.5rem 0;">
      <tr><td style="border: none; padding: 4px 0; font-weight: bold;">Lessor:</td><td style="border: none; padding: 4px 0;">${leaseData.LessorName || 'N/A'}</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">By: ____________________</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Name: ____________________</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Title: Director</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Date: ${leaseData.ContractDate ? formatDate(leaseData.ContractDate) : '________'}</td></tr>
    </table>

    <table style="width: 100%; border: none; margin: 1.5rem 0 0.5rem 0;">
      <tr><td style="border: none; padding: 4px 0; font-weight: bold;">Lessee:</td><td style="border: none; padding: 4px 0;">${leaseData.LesseeEntity || 'N/A'}</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">By: ____________________</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Name: ____________________</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Title: Authorized Signatory</td></tr>
      <tr><td style="border: none; padding: 4px 0;"></td><td style="border: none; padding: 4px 0;">Date: ${leaseData.ContractDate ? formatDate(leaseData.ContractDate) : '________'}</td></tr>
    </table>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">Schedule 4 — Acceptance Certificate (Template)</h2>
    <p><strong>Contract ID:</strong> ${leaseData.ContractID || 'N/A'}</p>
    <p><strong>Asset:</strong> ${leaseData.AssetDescription || 'N/A'}</p>
    <p><strong>Site:</strong> ${leaseData.AssetLocation || 'N/A'}</p>
    <p><strong>Commissioning completed on:</strong> _____________</p>
    <p>Lessee confirms the Asset has been installed, tested and is operational in accordance with specifications, save for the punch-list (if any) attached.</p>
    <p><strong>Signed for Lessee:</strong> ____________________ <strong>Date:</strong> __________</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">Schedule 5 — ESG & Compliance Undertakings</h2>
    <ul>
      <li>1. Operate the Asset in accordance with applicable environmental, health and safety laws and manufacturer guidelines; maintain records of inspections and incidents.</li>
      <li>2. Promptly notify Lessor of any material environmental incident or regulatory notice relating to the Asset.</li>
      <li>3. Maintain policies addressing anti-bribery/anti-corruption, sanctions, and AML/CFT; ensure use of the Asset is consistent with such policies.</li>
    </ul>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">Schedule 6 — Purchase Option / Residual Value Guarantee</h2>
    <p>Purchase Option Price: ${leaseData.PurchaseOptionPrice || '0.00'}. Exercise mechanics, timing and conditions precedent to be set out in the implementing notice. RVG (if any) applies as per Schedule 1; calculation methodology to be appended if required.</p>

    <h2 style="color: #black; margin-top: 1.5rem; font-weight: bold;">Schedule 7 — Insurance Details</h2>
    <p><strong>Sum Insured:</strong> ${leaseData.Currency || 'NGN'} ${formatCurrency(leaseData.InsuranceSumInsured || 0)}</p>
    <p><strong>Third Party Liability (TPL):</strong> ${leaseData.Currency || 'NGN'} ${formatCurrency(leaseData.InsuranceTPLimit || 0)}</p>
    <p><strong>Insurer Minimum Rating:</strong> ${leaseData.InsurerRatingMin || 'A'}</p>
    <p>Lessor named as loss payee and additional insured where applicable.</p>

    <p style="margin-bottom: 1rem;"> </p>
    <p>Note: Commercial terms above may be redacted or replaced by a pricing schedule in executed versions.</p>

    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 0.9em; color: #666;">
      <p><em>This is a system-generated contract preview. Final execution requires legal review and party signatures.</em></p>
    </div>
  </div>
`;

}