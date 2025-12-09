import React from 'react';
import { X, Send, Download } from 'lucide-react';
import { Button } from '../UI/Button';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractHtml: string;
  onSend: () => void;
  onDownload: () => void;
}

export function ContractPreviewModal({
  isOpen,
  onClose,
  contractHtml,
  onSend,
  onDownload
}: ContractPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contract Preview</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              onClick={onSend}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-[210mm] mx-auto">
            <div
              className="prose prose-sm dark:prose-invert max-w-none [&_h1]:dark:text-white [&_h2]:dark:text-white [&_h3]:dark:text-white [&_h4]:dark:text-white [&_h5]:dark:text-white [&_p]:dark:text-slate-200 [&_li]:dark:text-slate-200 [&_td]:dark:text-slate-200 [&_strong]:dark:text-white"
              dangerouslySetInnerHTML={{ __html: contractHtml }}
              style={{
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.6'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
