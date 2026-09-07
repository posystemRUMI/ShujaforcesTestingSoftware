import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs: TabItem[];
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  onChange?: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onChange,
  className,
  ...props
}) => {
  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId);
    onChange?.(tabId);
  };

  return (
    <div
      className={cn('border-b border-[#D4D9DF] flex items-center space-x-1 select-none', className)}
      role="tablist"
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-[1px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]',
              isActive
                ? 'border-[#0E1B2A] text-[#0E1B2A]'
                : 'border-transparent text-[#64748B] hover:text-[#0E1B2A] hover:border-[#D4D9DF]',
            )}
          >
            {tab.icon && (
              <span className="w-4 h-4 flex items-center justify-center">
                {React.isValidElement(tab.icon)
                  ? tab.icon
                  : typeof tab.icon === 'function' || (typeof tab.icon === 'object' && tab.icon !== null)
                  ? React.createElement(tab.icon as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' })
                  : null}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-xs text-[10px] font-sans font-bold tabular-nums',
                  isActive
                    ? 'bg-[#0E1B2A] text-white'
                    : 'bg-[#EDF1F5] text-[#64748B]',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
