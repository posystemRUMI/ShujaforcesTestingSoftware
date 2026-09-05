import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode | { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#D4D9DF] rounded p-12 text-center flex flex-col items-center justify-center select-none shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded bg-[#EDF1F5] flex items-center justify-center text-[#0E1B2A] mb-3">
        {icon || <FileQuestion className="w-6 h-6 stroke-[1.75]" />}
      </div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
        {title}
      </h3>
      <p className="text-xs text-[#64748B] max-w-sm mt-1 mb-5 leading-relaxed font-sans">
        {description}
      </p>
      {action && (
        <div>
          {React.isValidElement(action) ? (
            action
          ) : typeof action === 'object' && action !== null && 'label' in action ? (
            <button
              type="button"
              onClick={(action as { label: string; onClick: () => void }).onClick}
              className="px-3.5 py-1.5 rounded text-xs font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] transition-colors"
            >
              {(action as { label: string; onClick: () => void }).label}
            </button>
          ) : (
            action as React.ReactNode
          )}
        </div>
      )}
    </div>
  );
};
