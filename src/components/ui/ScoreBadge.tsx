import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface ScoreBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  score: number;
  total?: number;
  percentage?: number;
  passed?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  total,
  percentage,
  passed,
  className,
  ...props
}) => {
  const calcPercent = percentage ?? (total ? Math.round((score / total) * 100) : score);
  const isQualified = passed !== undefined ? passed : calcPercent >= 60;

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xs font-sans tabular-nums text-xs font-bold border select-none',
        isQualified
          ? 'bg-[#EDF6F0] text-[#234E35] border-[#88BE9B]'
          : 'bg-[#FDF2F2] text-[#782525] border-[#E29A9A]',
        className,
      )}
      {...props}
    >
      {isQualified ? (
        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#234E35]" />
      ) : (
        <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#782525]" />
      )}
      <span className="tabular-nums">{calcPercent}%</span>
    </span>
  );
};
