import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Retrieval Anomaly',
  message = 'Failed to load telemetry or record set. Please verify workstation connectivity.',
  onRetry,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-[#FDF2F2] border border-[#E29A9A] rounded p-6 flex flex-col sm:flex-row items-center justify-between gap-4 select-none',
        className,
      )}
      {...props}
    >
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-[#782525] flex-shrink-0">
          <AlertTriangle className="w-4 h-4 stroke-[2]" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#782525] font-display">
            {title}
          </h4>
          <p className="text-xs text-[#782525]/80 mt-0.5 max-w-lg font-sans leading-normal">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#E29A9A] hover:bg-red-50 text-[#782525] rounded text-xs font-semibold transition-colors flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
