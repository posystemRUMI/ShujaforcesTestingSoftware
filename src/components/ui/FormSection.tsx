import React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  stepNumber?: number | string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  stepNumber,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#E2E6EB] rounded-lg p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-4 select-none',
        className,
      )}
      {...props}
    >
      <div className="border-b border-[#EDF1F5] pb-3">
        <div className="flex items-center space-x-2.5">
          {stepNumber !== undefined && (
            <span className="w-6 h-6 rounded bg-[#0E1B2A] text-white flex items-center justify-center font-sans tabular-nums text-xs font-bold shrink-0">
              {stepNumber}
            </span>
          )}
          <h3 className="text-lg font-bold text-[#0E1B2A] font-display">
            {title}
          </h3>
        </div>
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
};
