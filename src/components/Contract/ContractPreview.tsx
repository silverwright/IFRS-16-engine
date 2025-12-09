import React, { useEffect, useState } from 'react';
import { useLeaseContext } from '../../context/LeaseContext';
import { Button } from '../UI/Button';
import { Download, FileText, Eye, ArrowLeft } from 'lucide-react';
import { generateContractHTML } from '../../utils/contractGenerator';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import { ContractPreviewModal } from './ContractPreviewModal';

export function ContractPreview() {
  const { state, dispatch } = useLeaseContext();
  const { leaseData, mode, contractHtml } = state;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Generate contract HTML when component mounts
    if (leaseData.ContractID) {
      let html = generateContractHTML(leaseData, mode);

      // Add custom CSS for signature tables
      const customStyles = `
        <style>
          table[style*="border: none"] {
            border: none !important;
            margin: 0.5rem 0 !important;
          }
          table[style*="border: none"] td {
            border: none !important;
            padding: 4px 0 !important;
          }
          table[style*="border: none"] td:first-child {
            width: auto;
            padding-right: 20px !important;
            white-space: nowrap;
            font-weight: bold;
          }
          table[style*="border: none"] td:last-child {
            padding-left: 0 !important;
          }
        </style>
      `;
      html = customStyles + html;

      dispatch({ type: 'SET_CONTRACT_HTML', payload: html });
    }
  }, [leaseData, mode, dispatch]);

  const downloadContract = () => {
    if (!contractHtml) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contractHtml;

    // Helper to check if we need a new page
    const checkPageBreak = (increment: number) => {
      if (yPosition + increment > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

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
          checkPageBreak(12);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          const lines = pdf.splitTextToSize(text, maxWidth);
          pdf.text(lines, margin, yPosition);
          yPosition += lines.length * 7 + 4;
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
          if (!text) return;
          checkPageBreak(10);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const pLines = pdf.splitTextToSize(text, maxWidth);
          pdf.text(pLines, margin, yPosition);
          yPosition += pLines.length * 5 + 3;
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
                // Signature table - handle label and value
                const value = valueCell.textContent?.trim() || '';

                if (label) {
                  // First row with "Lessor:" or "Lessee:" label
                  pdf.setFont('helvetica', 'bold');
                  pdf.setFontSize(10);
                  pdf.text(label, margin, yPosition);

                  if (value) {
                    pdf.setFont('helvetica', 'normal');
                    const signatureIndent = 70; // Match the indentation
                    pdf.text(value, signatureIndent, yPosition);
                  }
                  yPosition += 5.5;
                } else if (value) {
                  // Subsequent rows - just the value indented
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(10);
                  const signatureIndent = 70;
                  pdf.text(value, signatureIndent, yPosition);
                  yPosition += 5.5;
                }
              } else {
                // Regular data table
                // Check if value cell contains <br> tags for multi-line content
                const valueHTML = valueCell.innerHTML;
                const hasBreaks = valueHTML.includes('<br>');

                pdf.setFont('helvetica', 'bold');
                pdf.text(label, margin, yPosition);

                pdf.setFont('helvetica', 'normal');

                if (hasBreaks) {
                  // Split by <br> tags and process each line
                  const lines = valueHTML.split(/<br\s*\/?>/i).map(line => {
                    // Strip HTML tags and trim
                    return line.replace(/<[^>]*>/g, '').trim();
                  }).filter(line => line.length > 0);

                  let lineY = yPosition;
                  lines.forEach((line, idx) => {
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
    pdf.save(`LeaseContract_${mode.toLowerCase()}_${leaseData.ContractID}.pdf`);
  };

  const handleGenerateContract = () => {
    setShowModal(true);
  };

  const handleSendContract = () => {
    // TODO: Implement email sending functionality
    alert('Contract will be sent via email');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contract Preview</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadContract}
            disabled={!contractHtml}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button
            onClick={handleGenerateContract}
            disabled={!contractHtml}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            <Eye className="w-4 h-4" />
            Generate Contract
          </Button>
        </div>
      </div>

      <ContractPreviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        contractHtml={contractHtml || ''}
        onSend={handleSendContract}
        onDownload={downloadContract}
      />

      {/* Contract Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 space-y-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">Contract Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-600 dark:text-slate-400">Contract ID:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">{leaseData.ContractID || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Mode:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">{mode}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Asset:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">{leaseData.AssetDescription || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Term:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">{leaseData.NonCancellableYears || 0} years</span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">Payment:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">
              {leaseData.Currency} {(leaseData.FixedPaymentPerPeriod || 0).toLocaleString()} / {leaseData.PaymentFrequency}
            </span>
          </div>
          <div>
            <span className="text-slate-600 dark:text-slate-400">IBR:</span>
            <span className="ml-2 font-medium text-slate-900 dark:text-white">{((leaseData.IBR_Annual || 0) * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Contract Preview */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Contract Preview</span>
        </div>
        <div className="max-h-96 overflow-y-auto bg-white dark:bg-slate-800">
          {contractHtml ? (
            <div
              className="p-6 prose prose-sm dark:prose-invert max-w-none [&_h1]:dark:text-white [&_h2]:dark:text-white [&_h3]:dark:text-white [&_h4]:dark:text-white [&_h5]:dark:text-white [&_p]:dark:text-slate-200 [&_li]:dark:text-slate-200 [&_td]:dark:text-slate-200 [&_strong]:dark:text-white"
              dangerouslySetInnerHTML={{ __html: contractHtml }}
            />
          ) : (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
              <p>Complete the form to generate contract preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}