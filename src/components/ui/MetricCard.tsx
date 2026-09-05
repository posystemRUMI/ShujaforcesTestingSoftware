import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant?: string;
  };
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  subtitle,
  icon,
  badge,
  trend,
  highlight = false,
  className,
  ...props
}) => {
  const displaySubtext = subtext ?? subtitle;
  return (
    <div
      className={cn(
        'bg-white border rounded p-4 shadow-sm select-none transition-colors',
        highlight ? 'border-[#0E1B2A] ring-1 ring-[#0E1B2A]/10' : 'border-[#D4D9DF]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#64748B]">
        <span>{title}</span>
        <div className="flex items-center space-x-1.5">
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EDF1F5] text-[#0E1B2A] font-semibold">
              {badge.text}
            </span>
          )}
          {icon && (
            <div className="text-[#0E1B2A]">
              {React.isValidElement(icon)
                ? icon
                : typeof icon === 'function' || (typeof icon === 'object' && icon !== null)
                ? React.createElement(icon as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })
                : null}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 text-2xl font-bold font-display tabular-nums text-[#0E1B2A]">
        {value}
      </div>

      {(displaySubtext || trend) && (
        <div className="mt-2 text-[11px] flex items-center space-x-1.5 leading-tight">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center space-x-0.5 font-semibold font-mono',
                trend.direction === 'up'
                  ? 'text-[#234E35]'
                  : trend.direction === 'down'
                  ? 'text-[#782525]'
                  : 'text-[#64748B]',
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>{trend.value}</span>
            </span>
          )}
          {displaySubtext && <span className="text-[#64748B] truncate">{displaySubtext}</span>}
        </div>
      )}
    </div>
  );
};
