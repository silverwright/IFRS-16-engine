import React from 'react';
import { ContractStatus } from '../../types/auth';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ContractStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<ContractStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}> = {
  draft: {
    label: 'Draft',
    color: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-600',
    icon: FileText,
  },
  pending: {
    label: 'Pending Review',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-300 dark:border-yellow-600',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-300 dark:border-blue-600',
    icon: AlertCircle,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-300 dark:border-green-600',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-300 dark:border-red-600',
    icon: XCircle,
  },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md'
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.color} ${config.bgColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
