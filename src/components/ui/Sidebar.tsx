import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppLogo } from './AppLogo';
import { BookOpen, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarNavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  className,
  onNavigate,
  ...props
}) => {
  return (
    <aside
      className={cn(
        'w-[250px] bg-[#0E1B2A] text-white flex flex-col flex-shrink-0 border-r border-[#0E1B2A] select-none z-20',
        className,
      )}
      {...props}
    >
      {/* Masthead Branding */}
      <div className="h-[76px] px-5 flex items-center border-b border-[#1C2E42]">
        <AppLogo size="md" theme="dark" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-[11px] rounded-lg text-[13.5px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#C6A75E] group',
                  isActive
                    ? 'bg-[#1A2E42] text-white font-semibold'
                    : 'text-[#94A3B8] hover:bg-[#152335] hover:text-[#E2E8F0]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3 truncate">
                    <div className="relative flex-shrink-0">
                      {isActive && (
                        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C6A75E] rounded-r-full" />
                      )}
                      <Icon
                        className={cn(
                          'w-[18px] h-[18px] stroke-[1.75]',
                          isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#94A3B8]',
                        )}
                      />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-sans tabular-nums bg-[#1C2E42] text-[#C6A75E] border border-[#2E425A] flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 border-t border-[#1C2E42] mt-4">
          <NavLink
            to="/exam/instructions"
            onClick={onNavigate}
            className="flex items-center space-x-3 px-3 py-[11px] rounded-lg text-[13.5px] font-medium text-[#C6A75E] bg-[#C6A75E]/10 hover:bg-[#C6A75E]/20 transition-colors"
          >
            <BookOpen className="w-[18px] h-[18px] flex-shrink-0 stroke-[2]" />
            <span className="truncate font-semibold">Exam Portal</span>
          </NavLink>
        </div>
      </nav>

      {/* System Status */}
      <div className="px-4 py-3 bg-[#09121D] border-t border-[#1C2E42] flex items-center justify-between text-[12px] text-[#64748B]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span>System Online</span>
        </div>
        <Wifi className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
      </div>
    </aside>
  );
};
