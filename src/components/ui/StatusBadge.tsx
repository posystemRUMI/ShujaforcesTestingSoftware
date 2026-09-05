import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle2, XCircle, PauseCircle, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold uppercase tracking-wider border select-none',
  {
    variants: {
      status: {
        pass: 'bg-[#EDF6F0] text-[#234E35] border-[#88BE9B]',
        fail: 'bg-[#FDF2F2] text-[#782525] border-[#E29A9A]',
        paused: 'bg-[#FDF7EC] text-[#7A5312] border-[#DEC088]',
        retake: 'bg-[#EEF2F6] text-[#405364] border-[#9BB0C1]',
        active: 'bg-[#EDF6F0] text-[#234E35] border-[#88BE9B]',
        completed: 'bg-[#EDF1F5] text-[#0E1B2A] border-[#D4D9DF]',
        draft: 'bg-[#F6F8FA] text-[#64748B] border-[#D4D9DF]',
        pending: 'bg-[#FDF7EC] text-[#7A5312] border-[#DEC088]',
        inactive: 'bg-[#FDF2F2] text-[#782525] border-[#E29A9A]',
        upcoming: 'bg-[#EEF2F6] text-[#405364] border-[#9BB0C1]',
        archived: 'bg-[#F6F8FA] text-[#64748B] border-[#D4D9DF]',
        available: 'bg-[#EDF6F0] text-[#234E35] border-[#88BE9B]',
        used: 'bg-[#EDF1F5] text-[#0E1B2A] border-[#D4D9DF]',
        expired: 'bg-[#FDF2F2] text-[#782525] border-[#E29A9A]',
        'connection-issue': 'bg-[#FDF7EC] text-[#7A5312] border-[#DEC088]',
        on_leave: 'bg-[#FDF7EC] text-[#7A5312] border-[#DEC088]',
      },
    },
    defaultVariants: {
      status: 'active',
    },
  },
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status = 'active',
  label,
  showIcon = true,
  className,
  ...props
}) => {
  const getIcon = () => {
    switch (status) {
      case 'pass':
      case 'active':
      case 'available':
      case 'used':
        return <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />;
      case 'fail':
      case 'inactive':
      case 'expired':
        return <XCircle className="w-3.5 h-3.5 flex-shrink-0" />;
      case 'paused':
        return <PauseCircle className="w-3.5 h-3.5 flex-shrink-0" />;
      case 'retake':
        return <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />;
      case 'pending':
      case 'upcoming':
      case 'on_leave':
        return <Clock className="w-3.5 h-3.5 flex-shrink-0" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />;
    }
  };

  const defaultLabel = status?.replace('_', ' ').toUpperCase();

  return (
    <span className={cn(statusBadgeVariants({ status, className }))} {...props}>
      {showIcon && getIcon()}
      <span>{label || defaultLabel}</span>
    </span>
  );
};
