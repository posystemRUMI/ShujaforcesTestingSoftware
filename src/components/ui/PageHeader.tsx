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
        'border-b border-[#E8ECF0] pb-5 mb-8 select-none space-y-2',
        className,
      )}
      {...props}
    >
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-1" />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-[28px] font-bold tracking-tight text-[#0E1B2A] font-display leading-none">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-[#64748B] mt-1.5 max-w-2xl font-sans leading-normal">
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
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0E1B2A] text-white hover:bg-[#1E293B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E1B2A] focus:ring-offset-1"
              >
                {action.icon && (
                  React.isValidElement(action.icon) ? (
                    action.icon
                  ) : typeof action.icon === 'function' || (typeof action.icon === 'object' && action.icon !== null) ? (
                    React.createElement(action.icon as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })
                  ) : null
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
