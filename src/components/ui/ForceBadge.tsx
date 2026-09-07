import React from 'react';
import { MilitaryBranch } from '@/types';
import { FORCES_CONFIG } from '@/constants/tokens';
import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export interface ForceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  branch: MilitaryBranch | 'TRI_SERVICE';
  compact?: boolean;
}

export const ForceBadge: React.FC<ForceBadgeProps> = ({
  branch,
  compact = false,
  className,
  ...props
}) => {
  const config = FORCES_CONFIG[branch] || FORCES_CONFIG.TRI_SERVICE;

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 px-2 py-0.5 rounded-xs text-[11px] font-bold font-sans uppercase tracking-wider text-white select-none',
        className,
      )}
      style={{ backgroundColor: config.color }}
      {...props}
    >
      <Shield className="w-3 h-3 text-[#C6A75E] flex-shrink-0" />
      <span>{compact ? config.shortLabel : config.label}</span>
    </span>
  );
};
