import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  totalRecords?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  totalItems,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  className,
  ...props
}) => {
  const effectiveTotalRecords = totalRecords ?? totalItems;
  return (
    <div
      className={cn(
        'bg-white border-t border-[#D4D9DF] px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 select-none text-xs text-[#64748B]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center space-x-2 font-sans tabular-nums">
        {effectiveTotalRecords !== undefined ? (
          <span>
            Showing <strong className="text-[#0E1B2A]">{Math.min((currentPage - 1) * pageSize + 1, effectiveTotalRecords)}</strong> to{' '}
            <strong className="text-[#0E1B2A]">{Math.min(currentPage * pageSize, effectiveTotalRecords)}</strong> of{' '}
            <strong className="text-[#0E1B2A]">{effectiveTotalRecords}</strong> records
          </span>
        ) : (
          <span>
            Page <strong className="text-[#0E1B2A]">{currentPage}</strong> of{' '}
            <strong className="text-[#0E1B2A]">{totalPages}</strong>
          </span>
        )}

        {onPageSizeChange && (
          <div className="flex items-center space-x-1 ml-4 border-l border-[#D4D9DF] pl-4">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#F6F8FA] border border-[#D4D9DF] rounded px-2 py-1 text-xs text-[#0E1B2A] focus:outline-none focus:border-[#0E1B2A]"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded border border-[#D4D9DF] text-[#0E1B2A] hover:bg-[#EDF1F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center space-x-1 px-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            const pageNum = idx + 1;
            const isCurrent = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  'w-7 h-7 rounded text-xs font-sans tabular-nums font-semibold transition-colors',
                  isCurrent
                    ? 'bg-[#0E1B2A] text-white'
                    : 'text-[#0E1B2A] hover:bg-[#EDF1F5] border border-transparent hover:border-[#D4D9DF]',
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded border border-[#D4D9DF] text-[#0E1B2A] hover:bg-[#EDF1F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
