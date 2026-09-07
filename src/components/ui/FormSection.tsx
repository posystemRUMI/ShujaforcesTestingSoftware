import React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  description?: string;
  stepNumber?: number | string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  subtitle,
  description,
  stepNumber,
  children,
  className,
  ...props
}) => {
  const sub = subtitle ?? description;
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
            <span className="w-5 h-5 rounded bg-[#0E1B2A] text-white flex items-center justify-center font-sans tabular-nums text-[11px] font-bold">
              {stepNumber}
            </span>
          )}
          <h3 className="text-[15px] font-semibold text-[#0E1B2A] font-display">
            {title}
          </h3>
        </div>
        {sub && (
          <p className="text-[13.5px] text-[#64748B] mt-1 font-sans leading-normal">
            {sub}
          </p>
        )}
      </div>

      <div className="space-y-4 pt-1">{children}</div>
    </div>
  );
};
