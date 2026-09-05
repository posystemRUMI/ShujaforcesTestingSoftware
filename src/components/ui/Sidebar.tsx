import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppLogo } from './AppLogo';
import { Wifi, BookOpen } from 'lucide-react';
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
        'w-60 bg-[#0E1B2A] text-white flex flex-col flex-shrink-0 border-r border-[#0E1B2A] select-none z-20',
        className,
      )}
      {...props}
    >
      {/* Masthead Branding */}
      <div className="h-16 px-4 flex items-center border-b border-[#1C2E42]">
        <AppLogo size="md" theme="dark" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3 py-2.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#C6A75E]',
                  isActive
                    ? 'bg-[#1C2E42] text-white font-semibold border-l-2 border-[#C6A75E]'
                    : 'text-[#A0AEC0] hover:bg-[#152335] hover:text-white',
                )
              }
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className="w-[18px] h-[18px] flex-shrink-0 stroke-[1.75]" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-[#1C2E42] text-[#C6A75E] border border-[#2E425A]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-3 border-t border-[#1C2E42] mt-3">
          <NavLink
            to="/exam/instructions"
            onClick={onNavigate}
            className="flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-medium text-[#C6A75E] bg-[#C6A75E]/10 hover:bg-[#C6A75E]/20 transition-colors"
          >
            <BookOpen className="w-[18px] h-[18px] flex-shrink-0 stroke-[2]" />
            <span className="truncate font-semibold">Candidate Exam Room</span>
          </NavLink>
        </div>
      </nav>

      {/* Air-Gapped Local LAN Heartbeat Status */}
      <div className="p-3 bg-[#09121D] border-t border-[#1C2E42] flex items-center justify-between text-[11px] text-[#A0AEC0]">
        <div className="flex items-center space-x-2 font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LAN AIR-GAP : SECURE</span>
        </div>
        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
      </div>
    </aside>
  );
};
