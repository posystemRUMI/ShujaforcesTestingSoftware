import React from 'react';
import { cn } from '@/lib/utils';
import { SkeletonTable } from './SkeletonTable';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  id?: string;
  cell?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalRecords?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No Records Found',
  emptyDescription = 'There are no active entries matching the specified criteria.',
  pagination,
  className,
  ...props
}: DataTableProps<T>) {
  if (isLoading) {
    return <SkeletonTable rows={5} columns={columns.length} className={className} />;
  }

  return (
    <div
      className={cn(
        'bg-white border border-[#E2E6EB] rounded-lg overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)] select-none',
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#F4F6F9] text-[#374151] font-semibold text-[12px] border-b border-[#E2E6EB] sticky top-0 z-10">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={cn(
                    'py-3.5 px-4 font-display',
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] bg-white">
            {data.length > 0 ? (
              data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  className="hover:bg-[#F8FAFC] transition-colors focus-within:bg-[#F6F8FA]"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn(
                        'py-3.5 px-4',
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left',
                        col.className,
                      )}
                    >
                      {col.cell
                        ? col.cell(item, rowIdx)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-10">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && <Pagination {...pagination} />}
    </div>
  );
}
