import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLeaseContext, SavedContract } from '../../context/LeaseContext';
import { Button } from '../UI/Button';
import { FileText, CreditCard as Edit, Eye, Trash2, Plus, Calendar, Building, User, Code, Send, GitBranch, Download, Search, ChevronDown } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { approvalApi } from '../../services/approvalApi';
import { useContracts } from '../../hooks/useContracts';
import { generateContractHTML } from '../../utils/contractGenerator';
import jsPDF from 'jspdf';

interface ContractListProps {
  onEditContract: (contract: SavedContract) => void;
  onNewContract: () => void;
  onModifyContract?: (contract: SavedContract) => void;
}

export function ContractList({ onEditContract, onNewContract, onModifyContract }: ContractListProps) {
  const { state, dispatch } = useLeaseContext();
  const { savedContracts } = state;
  const { user } = useAuth();
  const { loadContracts } = useContracts();
  const [selectedContract, setSelectedContract] = useState<SavedContract | null>(null);
  const [showDataModal, setShowDataModal] = useState(false);
  const [dataToShow, setDataToShow] = useState<any>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINIMAL' | 'FULL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'draft' | 'pending' | 'approved'>('ALL');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteContract = (contractId: string) => {
    if (confirm('Are you sure you want to delete this contract?')) {
      dispatch({ type: 'DELETE_CONTRACT', payload: contractId });
    }
  };

  const handlePreviewContract = (contract: SavedContract) => {
    setSelectedContract(contract);
  };

  const handleViewData = (contract: SavedContract) => {
    setDataToShow(contract.data);
    setShowDataModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const handleSubmitForApproval = async (contract: SavedContract) => {
    if (!user?.id) {
      alert('You must be logged in to submit a contract for approval');
      return;
    }

    if (contract.status !== 'draft') {
      alert('Only draft contracts can be submitted for approval');
      return;
    }

    if (confirm(`Submit contract ${contract.contractId} for approval?`)) {
      try {
        setSubmitting(contract.id);
        await approvalApi.submitContract(contract.id, user.id);

        // Reload contracts to get updated status
        await loadContracts();

        alert('Contract submitted for approval successfully!');
      } catch (error: any) {
        console.error('Error submitting contract:', error);
        alert(error.response?.data?.error || 'Failed to submit contract for approval');
      } finally {
        setSubmitting(null);
      }
    }
  };

  const handleDownloadPDF = (contract: SavedContract) => {
    try {
      // Generate the lease contract HTML
      const contractHtml = generateContractHTML(contract.data, contract.mode);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper to check if we need a new page
      const checkPageBreak = (increment: number) => {
        if (yPosition + increment > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin + 10; // Add 10mm extra spacing at top of new pages
        }
      };

      // Helper to format dates
      const formatDatePDF = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      };

      // Helper to generate changes list
      const generateChangesList = () => {
        if (!contract.data.hasModification || !contract.data.originalTerms || !contract.data.modifiedTerms) {
          return { paymentChanges: [], financialChanges: [], leaseTermChanges: [], otherChanges: [] };
        }

        const paymentChanges: string[] = [];
        const financialChanges: string[] = [];
        const leaseTermChanges: string[] = [];
        const otherChanges: string[] = [];
        const { originalTerms, modifiedTerms } = contract.data;

        // Payment changes
        if (originalTerms.FixedPaymentPerPeriod !== modifiedTerms.FixedPaymentPerPeriod) {
          paymentChanges.push(
            `Fixed Payment: ${contract.data.Currency}${originalTerms.FixedPaymentPerPeriod?.toLocaleString()} → ${contract.data.Currency}${modifiedTerms.FixedPaymentPerPeriod?.toLocaleString()} per period`
          );
        }

        // Payment frequency
        if (modifiedTerms.PaymentFrequency === undefined) {
          if (originalTerms.PaymentFrequency) {
            paymentChanges.push(`Frequency: ${originalTerms.PaymentFrequency} (No Change)`);
          }
        } else if (originalTerms.PaymentFrequency !== modifiedTerms.PaymentFrequency) {
          paymentChanges.push(`Frequency: ${originalTerms.PaymentFrequency} → ${modifiedTerms.PaymentFrequency}`);
        } else if (originalTerms.PaymentFrequency) {
          paymentChanges.push(`Frequency: ${originalTerms.PaymentFrequency} (no change)`);
        }

        // Payment timing
        if (modifiedTerms.PaymentTiming === undefined) {
          if (originalTerms.PaymentTiming) {
            paymentChanges.push(`Timing: ${originalTerms.PaymentTiming} (No Change)`);
          }
        } else if (originalTerms.PaymentTiming !== modifiedTerms.PaymentTiming) {
          paymentChanges.push(`Timing: ${originalTerms.PaymentTiming} → ${modifiedTerms.PaymentTiming}`);
        } else if (originalTerms.PaymentTiming) {
          paymentChanges.push(`Timing: ${originalTerms.PaymentTiming} (no change)`);
        }

        // Discount rate changes
        if (originalTerms.IBR_Annual !== modifiedTerms.IBR_Annual) {
          const origIBR = originalTerms.IBR_Annual || 0;
          const modIBR = modifiedTerms.IBR_Annual || 0;
          financialChanges.push(
            `Discount Rate: ${(origIBR * 100).toFixed(2)}% → ${(modIBR * 100).toFixed(2)}% per annum`
          );
        }

        // Initial direct costs changes
        if (originalTerms.InitialDirectCosts !== modifiedTerms.InitialDirectCosts) {
          financialChanges.push(
            `Initial Direct Costs: ${contract.data.Currency}${(originalTerms.InitialDirectCosts || 0).toLocaleString()} → ${contract.data.Currency}${(modifiedTerms.InitialDirectCosts || 0).toLocaleString()}`
          );
        }

        // Prepayments changes
        if (originalTerms.Prepayments !== modifiedTerms.Prepayments) {
          financialChanges.push(
            `Prepayments: ${contract.data.Currency}${(originalTerms.Prepayments || 0).toLocaleString()} → ${contract.data.Currency}${(modifiedTerms.Prepayments || 0).toLocaleString()}`
          );
        }

        // Lease incentives changes
        if (originalTerms.LeaseIncentives !== modifiedTerms.LeaseIncentives) {
          financialChanges.push(
            `Lease Incentives: ${contract.data.Currency}${(originalTerms.LeaseIncentives || 0).toLocaleString()} → ${contract.data.Currency}${(modifiedTerms.LeaseIncentives || 0).toLocaleString()}`
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
            const formatDate = (dateStr: string) => {
              if (!dateStr) return 'N/A';
              const date = new Date(dateStr);
              return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
            };
            leaseTermChanges.push(
              `End Date: ${formatDate(originalTerms.EndDate)} (No Change)`
            );
          }
        } else if (originalTerms.EndDate !== modifiedTerms.EndDate) {
          const formatDate = (dateStr: string) => {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
          };
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

        // Termination option changes
        if (originalTerms.TerminationPoint !== modifiedTerms.TerminationPoint) {
          leaseTermChanges.push(
            `Termination Point: Year ${originalTerms.TerminationPoint || 0} → Year ${modifiedTerms.TerminationPoint || 0}`
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

      // Add Amendment Notice if contract has modifications
      if (contract.data.hasModification) {
        const changes = generateChangesList();
        const latestModification = contract.data.modificationHistory?.[contract.data.modificationHistory.length - 1];

        // Amendment Notice Header
        pdf.setFillColor(16, 185, 129); // Emerald color
        pdf.rect(margin, yPosition, maxWidth, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LEASE AMENDMENT NOTICE', margin + 5, yPosition + 7);
        yPosition += 12;

        // Reset text color
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);

        // Amendment details
        pdf.setFont('helvetica', 'bold');
        pdf.text('Amendment Date:', margin + 5, yPosition + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatDatePDF(contract.data.agreementDate || contract.data.modificationDate), margin + 50, yPosition + 5);
        yPosition += 7;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Effective Date:', margin + 5, yPosition + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(formatDatePDF(contract.data.modificationDate), margin + 50, yPosition + 5);
        yPosition += 7;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Version:', margin + 5, yPosition + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Version ${contract.version || 2}`, margin + 50, yPosition + 5);
        yPosition += 10;

        // Introductory paragraph 1
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const versionNum = contract.version || 2;
        const lessorName = contract.data.LessorName || contract.lessorName || 'the Lessor';
        const lesseeName = contract.data.LesseeName || contract.lesseeName || 'the Lessee';
        const contractId = contract.data.ContractID || contract.contractId || 'N/A';

        const introText1 = `This Amendment No. ${versionNum} (the "Amendment") modifies the Lease Agreement with Contract ID ${contractId}, entered into between ${lessorName} (the "Lessor") and ${lesseeName} (the "Lessee"). This Amendment shall form an integral part of the original Lease Agreement and shall be binding upon both parties.`;

        const introLines1 = pdf.splitTextToSize(introText1, maxWidth - 15);
        pdf.text(introLines1, margin + 8, yPosition + 5);
        yPosition += introLines1.length * 4 + 5;

        // Paragraph 2 - Original Contract Reference
        const contractDate = contract.data.ContractDate || contract.data.CommencementDate || contract.commencementDate || 'N/A';
        const formattedContractDate = contractDate !== 'N/A'
          ? formatDatePDF(contractDate)
          : 'N/A';

        const introText2 = `The Lessor ("${lessorName}") and The Lessee ("${lesseeName}") had previously entered into a Lease Agreement on ${formattedContractDate} (for details of the contract, refer to the Master Agreement attached hereto), which is now being amended.`;

        const introLines2 = pdf.splitTextToSize(introText2, maxWidth - 15);
        pdf.text(introLines2, margin + 8, yPosition + 5);
        yPosition += introLines2.length * 4 + 5;

        // Paragraph 3 - Amendment Reason
        const amendmentReason = latestModification?.modificationReason || 'commercial and operational considerations';
        const introText3 = `The contract is amended based on ${amendmentReason}.`;

        const introLines3 = pdf.splitTextToSize(introText3, maxWidth - 15);
        pdf.text(introLines3, margin + 8, yPosition + 5);
        yPosition += introLines3.length * 4 + 8;

        // Separator
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 7;

        // Changes made
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('CHANGES MADE:', margin + 5, yPosition + 5);
        yPosition += 8;

        const { paymentChanges, financialChanges, leaseTermChanges, otherChanges } = changes;
        const hasAnyChanges = paymentChanges.length > 0 || financialChanges.length > 0 ||
                              leaseTermChanges.length > 0 || otherChanges.length > 0;

        if (hasAnyChanges) {
          // Helper function to render a section
          const renderSection = (title: string, items: string[]) => {
            if (items.length === 0) return;

            checkPageBreak(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.text(title, margin + 8, yPosition + 5);
            yPosition += 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            items.forEach(item => {
              checkPageBreak(7);
              pdf.text('  • ' + item, margin + 10, yPosition + 5);
              yPosition += 5;
            });

            yPosition += 2; // Extra spacing between sections
          };

          // Render each section
          renderSection('Payment Terms:', paymentChanges);
          renderSection('Financial Terms:', financialChanges);
          renderSection('Lease Term & Options:', leaseTermChanges);
          renderSection('Other Changes:', otherChanges);
        } else {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(9);
          pdf.text('• No specific changes detected', margin + 8, yPosition + 5);
          yPosition += 6;
        }

        yPosition += 8;

        // Amendment Footer - Outside the box at bottom of page
        const footerYPosition = pageHeight - margin - 15; // Position near bottom of page

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);

        const assetDescription = contract.data.AssetDescription || contract.assetDescription || 'the Leased Asset';
        const assetLocation = contract.data.AssetLocation || contract.data.LesseeAddress || '';

        // Construct the full footer text with asset location if available
        let amendmentFooter = `Amendment No. ${versionNum} to the contract for provision of ${assetDescription}`;
        if (assetLocation) {
          amendmentFooter += ` at ${assetLocation}`;
        }
        amendmentFooter += ` - Contract ID: ${contractId}`;

        const footerTitleLines = pdf.splitTextToSize(amendmentFooter, maxWidth);

        // Left-aligned footer text
        let currentFooterY = footerYPosition;
        footerTitleLines.forEach((line: string, index: number) => {
          pdf.text(line, margin, currentFooterY + (index * 5));
        });
        currentFooterY += footerTitleLines.length * 5;

        // Add "All other terms remain unchanged" disclaimer
        pdf.setFontSize(8);
        pdf.text('All other terms remain unchanged from the original lease agreement.', margin, currentFooterY);

        // Add new page for the master agreement
        pdf.addPage();
        yPosition = margin; // Reset position for new page
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
      }

      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = contractHtml;

      // Process all elements
      const processElement = (element: Element) => {
        const tagName = element.tagName.toLowerCase();
        const text = element.textContent?.trim() || '';

        switch (tagName) {
          case 'h1':
            if (!text) return;
            checkPageBreak(15);
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text(text, pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 12;
            break;

          case 'h2':
            if (!text) return;
            // Check if we need a page break for the heading plus some content space (30mm minimum)
            // This ensures the heading and at least 2-3 lines of content stay together
            if (yPosition + 30 > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin + 10; // Add 10mm extra spacing at top of new pages
            }
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            const lines = pdf.splitTextToSize(text, maxWidth);
            pdf.text(lines, margin, yPosition);
            yPosition += lines.length * 7 + 1; // Reduced spacing after header
            break;

          case 'h4':
          case 'h5':
            if (!text) return;
            checkPageBreak(10);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(text, margin, yPosition);
            yPosition += 6;
            break;

          case 'p':
            // Check for margin-bottom style
            const style = element.getAttribute('style') || '';
            const marginMatch = style.match(/margin-bottom:\s*(\d+(?:\.\d+)?)rem/);

            if (!text && marginMatch) {
              // Empty paragraph with margin-bottom - add spacing
              const remValue = parseFloat(marginMatch[1]);
              yPosition += remValue * 5; // Convert rem to approximate mm (1rem ≈ 5mm)
              return;
            }

            if (!text) return;
            checkPageBreak(10);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const pLines = pdf.splitTextToSize(text, maxWidth);
            pdf.text(pLines, margin, yPosition);
            yPosition += pLines.length * 5 + 3;

            // Add extra spacing if paragraph has margin-bottom
            if (marginMatch) {
              const remValue = parseFloat(marginMatch[1]);
              yPosition += remValue * 5; // Convert rem to approximate mm (1rem ≈ 5mm)
            }
            break;

          case 'table':
            checkPageBreak(20);
            pdf.setFontSize(9);
            const rows = Array.from(element.querySelectorAll('tr'));

            // Check if this is a signature table (no borders)
            const tableStyle = element.getAttribute('style') || '';
            const isSignatureTable = tableStyle.includes('border: none');

            rows.forEach((row) => {
              const cells = Array.from(row.querySelectorAll('td'));
              if (cells.length === 2) {
                checkPageBreak(15);
                const label = cells[0].textContent?.trim() || '';
                const valueCell = cells[1];

                if (isSignatureTable) {
                  // Signature table
                  const value = valueCell.textContent?.trim() || '';

                  if (label) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(10);
                    pdf.text(label, margin, yPosition);

                    if (value) {
                      pdf.setFont('helvetica', 'normal');
                      const signatureIndent = 70;
                      pdf.text(value, signatureIndent, yPosition);
                    }
                    yPosition += 5.5;
                  } else if (value) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    const signatureIndent = 70;
                    pdf.text(value, signatureIndent, yPosition);
                    yPosition += 5.5;
                  }
                } else {
                  // Regular data table
                  const valueHTML = valueCell.innerHTML;
                  const hasBreaks = valueHTML.includes('<br>');

                  pdf.setFont('helvetica', 'bold');
                  pdf.text(label, margin, yPosition);

                  pdf.setFont('helvetica', 'normal');

                  if (hasBreaks) {
                    const lines = valueHTML.split(/<br\s*\/?>/i).map(line => {
                      return line.replace(/<[^>]*>/g, '').trim();
                    }).filter(line => line.length > 0);

                    let lineY = yPosition;
                    lines.forEach((line) => {
                      const wrappedLines = pdf.splitTextToSize(line, maxWidth - 50);
                      pdf.text(wrappedLines, margin + 50, lineY);
                      lineY += wrappedLines.length * 4.5;
                    });
                    yPosition = lineY + 2;
                  } else {
                    const value = valueCell.textContent?.trim() || '';
                    const valueLines = pdf.splitTextToSize(value, maxWidth - 50);
                    pdf.text(valueLines, margin + 50, yPosition);
                    yPosition += Math.max(valueLines.length * 4.5, 6);
                  }
                }
              }
            });

            if (!isSignatureTable) {
              yPosition += 5;
            } else {
              yPosition += 2;
            }
            break;

          case 'li':
            if (!text) return;
            checkPageBreak(8);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const liLines = pdf.splitTextToSize('• ' + text, maxWidth - 5);
            pdf.text(liLines, margin + 5, yPosition);
            yPosition += liLines.length * 5 + 2;
            break;

          case 'div':
            // Process child elements
            Array.from(element.children).forEach(child => processElement(child));
            break;
        }
      };

      // Process all children
      Array.from(tempDiv.children).forEach(child => processElement(child));

      // Save the PDF
      pdf.save(`LeaseContract_${contract.mode.toLowerCase()}_${contract.contractId}.pdf`);
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      alert('Failed to generate contract PDF. Please check the contract data.');
    }
  };

  // Filter contracts based on search term, mode, and status
  const filteredContracts = useMemo(() => {
    return savedContracts.filter(contract => {
      const matchesSearch =
        contract.contractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.lesseeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.lessorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.assetDescription.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMode = filterMode === 'ALL' || contract.mode === filterMode;
      const matchesStatus = filterStatus === 'ALL' || contract.status === filterStatus;

      return matchesSearch && matchesMode && matchesStatus;
    });
  }, [savedContracts, searchTerm, filterMode, filterStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Saved Contracts</h3>
        <Button
          onClick={onNewContract}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </Button>
      </div>

      {/* Search and Filters */}
      {savedContracts.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by contract ID, lessor, lessee, or asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as any)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="ALL">All Modes</option>
            <option value="MINIMAL">Minimal</option>
            <option value="FULL">Full</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="ALL">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      )}

      {/* Results Count */}
      {savedContracts.length > 0 && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredContracts.length} of {savedContracts.length} contracts
        </div>
      )}

      {savedContracts.length === 0 ? (
        <div className="text-center py-12 bg-slate-100 dark:bg-slate-700/40 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-600/50">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No contracts saved yet</h4>
          <p className="text-slate-600 dark:text-slate-300 mb-4">Create your first lease contract to get started</p>
          <Button onClick={onNewContract}>Create New Contract</Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-300 dark:border-slate-600/50 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-200">
              <thead className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-600 dark:to-cyan-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Contract ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Lessor/Lessee
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
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Modify
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-50 dark:bg-slate-800/30 divide-y divide-slate-200 dark:divide-slate-700/50">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No contracts match your search</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try adjusting your search criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract, index) => (
                  <tr key={contract.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-800/20' : 'bg-slate-50 dark:bg-slate-700/30'} hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">{contract.contractId}</div>
                            {contract.version && contract.version > 1 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                                <GitBranch className="w-3 h-3" />
                                v{contract.version}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{contract.mode} mode</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-slate-900 dark:text-white">
                          <Building className="w-3 h-3 mr-1 text-slate-500 dark:text-slate-400" />
                          {contract.lessorName}
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
                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <div className="relative" ref={openDropdownId === contract.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === contract.id ? null : contract.id)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            title="View actions"
                          >
                            <span>Actions</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {openDropdownId === contract.id && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handlePreviewContract(contract);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span>Preview Contract</span>
                                </button>
                                <button
                                  onClick={() => {
                                    onEditContract(contract);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <Edit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Edit Contract</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDownloadPDF(contract);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  <span>Download PDF</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleViewData(contract);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  <span>View Raw Data</span>
                                </button>
                                {contract.status === 'draft' && (
                                  <>
                                    <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                                    <button
                                      onClick={() => {
                                        handleSubmitForApproval(contract);
                                        setOpenDropdownId(null);
                                      }}
                                      disabled={submitting === contract.id}
                                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Send className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                      <span>Submit for Approval</span>
                                    </button>
                                  </>
                                )}
                                <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                                <button
                                  onClick={() => {
                                    handleDeleteContract(contract.id);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete Contract</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Modify Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {onModifyContract && (
                        <Button
                          onClick={() => onModifyContract(contract)}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-600 dark:to-teal-600 hover:from-cyan-600 hover:to-teal-600 dark:hover:from-cyan-700 dark:hover:to-teal-700 text-white text-xs px-3 py-2 mx-auto"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          Modify
                        </Button>
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Data Modal */}
      {showDataModal && dataToShow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowDataModal(false);
            setDataToShow(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-300 dark:border-slate-600/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-300 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                All Captured Data Fields
              </h3>
              <button
                onClick={() => {
                  setShowDataModal(false);
                  setDataToShow(null);
                }}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                  This shows ALL data fields captured from your Excel upload.
                  Fields with values are shown below. Empty fields are not displayed.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Total fields captured: <span className="font-bold">{Object.keys(dataToShow).length}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dataToShow).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-600/50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                      {key}
                    </div>
                    <div className="text-sm text-slate-900 dark:text-white font-mono break-words">
                      {value === null || value === undefined || value === ''
                        ? <span className="text-slate-500 dark:text-slate-400 italic">empty</span>
                        : typeof value === 'boolean'
                          ? value.toString()
                          : String(value)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDataModal(false);
                    setDataToShow(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(dataToShow, null, 2));
                    alert('Data copied to clipboard!');
                  }}
                  className="flex items-center gap-2"
                >
                  Copy JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {selectedContract && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedContract(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-300 dark:border-slate-600/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-300 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Contract Preview - {selectedContract.contractId}
              </h3>
              <button
                onClick={() => setSelectedContract(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Contract Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-600 dark:text-slate-400">Contract ID:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedContract.contractId}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Lessor:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedContract.lessorName}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Lessee:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedContract.lesseeName}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Asset:</span> <span className="font-medium text-slate-900 dark:text-white">{selectedContract.assetDescription}</span></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-600 dark:text-slate-400">Commencement:</span> <span className="font-medium text-slate-900 dark:text-white">{formatDate(selectedContract.commencementDate)}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Created:</span> <span className="font-medium text-slate-900 dark:text-white">{formatDate(selectedContract.createdAt)}</span></div>
                    <div><span className="text-slate-600 dark:text-slate-400">Updated:</span> <span className="font-medium text-slate-900 dark:text-white">{formatDate(selectedContract.updatedAt)}</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-600 dark:text-slate-400">Status:</span> <StatusBadge status={selectedContract.status} size="sm" /></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    onEditContract(selectedContract);
                    setSelectedContract(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Contract
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedContract(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}