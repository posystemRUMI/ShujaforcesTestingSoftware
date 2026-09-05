import React from 'react';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchSlot?: React.ReactNode;
  filterSlots?: React.ReactNode;
  activeCount?: number;
  onResetFilters?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchSlot,
  filterSlots,
  activeCount = 0,
  onResetFilters,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#D4D9DF] rounded p-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm select-none',
        className,
      )}
      {...props}
    >
      <div className="flex-1 flex items-center space-x-3">
        {searchSlot}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filterSlots}

        {activeCount > 0 && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-semibold text-[#782525] hover:bg-[#FDF2F2] transition-colors border border-transparent hover:border-[#E29A9A]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ({activeCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};
