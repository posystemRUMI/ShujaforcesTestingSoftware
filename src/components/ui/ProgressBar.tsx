import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'navy' | 'slate' | 'brass' | 'status' | 'success' | 'default' | 'warning' | 'gold';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  size = 'md',
  variant = 'navy',
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const getFillColor = () => {
    switch (variant) {
      case 'slate':
        return 'bg-[#455D4A]';
      case 'brass':
      case 'gold':
        return 'bg-[#C6A75E]';
      case 'success':
        return 'bg-[#234E35]';
      case 'warning':
        return 'bg-[#B45309]';
      case 'status':
        return percentage >= 60 ? 'bg-[#234E35]' : 'bg-[#782525]';
      case 'default':
      case 'navy':
      default:
        return 'bg-[#0E1B2A]';
    }
  };

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3.5' : 'h-2';

  return (
    <div className={cn('w-full space-y-1', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center text-[11px] font-mono font-medium text-[#64748B]">
          <span>Progress</span>
          <span className="tabular-nums text-[#0E1B2A] font-bold">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn('w-full bg-[#EDF1F5] rounded-xs overflow-hidden border border-[#D4D9DF]', heightClass)}
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-xs', getFillColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
