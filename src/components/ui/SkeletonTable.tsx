import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 6,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#D4D9DF] rounded overflow-hidden shadow-sm animate-pulse',
        className,
      )}
      {...props}
    >
      <div className="h-10 bg-[#EDF1F5] border-b border-[#D4D9DF] flex items-center px-4 space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3.5 bg-[#D4D9DF] rounded-xs flex-1" />
        ))}
      </div>

      <div className="divide-y divide-[#E2E6EB]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="h-12 flex items-center px-4 space-x-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="h-3 bg-[#EDF1F5] rounded-xs flex-1"
                style={{ width: `${60 + ((rowIdx + colIdx) % 4) * 10}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
