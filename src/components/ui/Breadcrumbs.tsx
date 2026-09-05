import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className, ...props }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1.5 text-xs text-[#64748B] select-none', className)}
      {...props}
    >
      <Link
        to="/admin/dashboard"
        className="hover:text-[#0E1B2A] transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
        title="Dashboard Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-[#94A3B8] flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="font-semibold text-[#0E1B2A] truncate max-w-xs">{item.label}</span>
            ) : (
              <Link
                to={item.href}
                className="hover:text-[#0E1B2A] transition-colors truncate max-w-xs focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
