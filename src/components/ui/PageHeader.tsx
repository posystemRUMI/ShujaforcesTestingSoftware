import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { cn } from '@/lib/utils';

export interface PageHeaderAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  onClick?: () => void;
  variant?: string;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  action?: PageHeaderAction;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  action,
  badge,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'border-b border-[#D4D9DF] pb-4 mb-6 select-none space-y-2',
        className,
      )}
      {...props}
    >
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-1" />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] font-display">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl font-sans leading-normal">
              {subtitle}
            </p>
          )}
        </div>

        {(actions || action) && (
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {actions}
            {action && (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xs text-xs font-semibold uppercase tracking-wider bg-[#0E1B2A] text-white hover:bg-[#1E293B] transition-colors"
              >
                {action.icon && (
                  typeof action.icon === 'function' ? (
                    <action.icon className="w-3.5 h-3.5" />
                  ) : (
                    action.icon
                  )
                )}
                <span>{action.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
