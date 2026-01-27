import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error';
  confirmText?: string;
}

export function Modal({ isOpen, onClose, title, message, type = 'info', confirmText = 'OK' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`
            p-2 rounded-full
            ${type === 'error' ? 'bg-red-100 text-red-600' : ''}
            ${type === 'warning' ? 'bg-yellow-100 text-yellow-600' : ''}
            ${type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
          `}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-300">
            {message}
          </p>
        </div>

        {/* OK button */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="primary"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
