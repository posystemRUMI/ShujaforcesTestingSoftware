import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { UserRole } from '@/types';
import { Avatar } from './Avatar';
import { NotificationPanel } from './NotificationPanel';
import { CommandSearch } from './CommandSearch';

export interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileMenuToggle }) => {
  const { user, role, switchRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandSearchOpen, setCommandSearchOpen] = useState(false);

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleMenuOpen(false);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-[#D4D9DF] px-4 sm:px-6 flex items-center justify-between z-20 select-none flex-shrink-0">
        {/* Left: Mobile Menu & Omnibox Search */}
        <div className="flex items-center space-x-3 flex-1 max-w-lg">
          {onMobileMenuToggle && (
            <button
              type="button"
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded text-[#0E1B2A] hover:bg-[#EDF1F5] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => setCommandSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#F6F8FA] border border-[#D4D9DF] rounded text-xs text-[#64748B] hover:border-[#0E1B2A] cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="truncate">Search cadets, batches, tests...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#EDF1F5] border border-[#D4D9DF] rounded text-[#0E1B2A]">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right: Academic Cycle, Notification Bell, User Dossier */}
        <div className="flex items-center space-x-4 ml-4">
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-[#EDF1F5] rounded text-[11px] font-mono text-[#0E1B2A] border border-[#D4D9DF]">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>CYCLE: INTAKE-2026-A</span>
          </div>

          {/* Notification Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded text-[#0E1B2A] hover:bg-[#EDF1F5] relative transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4 stroke-[2]" />
              <span className="w-2 h-2 rounded-full bg-red-600 absolute top-1.5 right-1.5" />
            </button>
            <NotificationPanel
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          <div className="h-5 w-[1px] bg-[#D4D9DF]" />

          {/* User Dossier & Role Switcher */}
          <div className="flex items-center space-x-3">
            <Avatar size="sm" fallbackText={user?.name || 'CP'} />
            <div className="hidden sm:block text-right">
              <div className="text-xs font-semibold text-[#0E1B2A] truncate max-w-[160px]">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono truncate max-w-[160px]">
                {user?.rankTitle || user?.email}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-1.5 px-2 py-1 bg-[#EDF1F5] border border-[#D4D9DF] rounded text-xs font-medium text-[#0E1B2A] hover:bg-[#E2E6EB] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              >
                <span className="uppercase text-[10px] font-bold text-[#455D4A]">{role}</span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border-2 border-[#0E1B2A] rounded shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#64748B] border-b border-[#EDF1F5] font-mono">
                    Simulate Role Switch
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F6F8FA] ${
                      role === 'ADMIN' ? 'font-bold text-[#0E1B2A] bg-[#EDF1F5]' : 'text-[#1F2937]'
                    }`}
                  >
                    Chief Proctor (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('TEACHER')}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F6F8FA] ${
                      role === 'TEACHER' ? 'font-bold text-[#0E1B2A] bg-[#EDF1F5]' : 'text-[#1F2937]'
                    }`}
                  >
                    Instructor (Faculty)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('STUDENT')}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F6F8FA] ${
                      role === 'STUDENT' ? 'font-bold text-[#0E1B2A] bg-[#EDF1F5]' : 'text-[#1F2937]'
                    }`}
                  >
                    Candidate (Cadet)
                  </button>
                  <div className="border-t border-[#EDF1F5] mt-1">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-[#FDF2F2] flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Search Modal */}
      <CommandSearch
        isOpen={commandSearchOpen}
        onClose={() => setCommandSearchOpen(false)}
      />
    </>
  );
};
