import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Retrieving Telemetry...',
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-12 flex flex-col items-center justify-center space-y-3 select-none text-center',
        className,
      )}
      {...props}
    >
      <RefreshCw className="w-6 h-6 text-[#0E1B2A] animate-spin stroke-[2]" />
      <span className="text-xs font-sans font-medium text-[#64748B] uppercase tracking-wider">
        {message}
      </span>
    </div>
  );
};
