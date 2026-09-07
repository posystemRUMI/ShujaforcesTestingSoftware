import React from 'react';
import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
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
        'bg-white border border-[#E2E6EB] rounded-lg p-12 text-center flex flex-col items-center justify-center select-none shadow-[0_1px_4px_rgba(0,0,0,0.06)]',
        className,
      )}
      {...props}
    >
      <div className="w-14 h-14 rounded-xl bg-[#F4F6F9] flex items-center justify-center text-[#374151] mb-4">
        {icon ? (
          React.isValidElement(icon)
            ? icon
            : typeof icon === 'function' || (typeof icon === 'object' && icon !== null)
            ? React.createElement(icon as React.ComponentType<{ className?: string }>, { className: 'w-6 h-6 stroke-[1.75]' })
            : null
        ) : (
          <FileQuestion className="w-6 h-6 stroke-[1.75]" />
        )}
      </div>
      <h3 className="text-base font-semibold text-[#0E1B2A] font-display">
        {title}
      </h3>
      <p className="text-sm text-[#64748B] max-w-sm mt-1.5 mb-6 leading-relaxed font-sans">
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
              className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0E1B2A] text-white hover:bg-[#1A2C42] transition-colors"
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
