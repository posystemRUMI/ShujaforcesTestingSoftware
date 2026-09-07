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
      <header className="h-[66px] bg-white border-b border-[#E8ECF0] px-5 sm:px-7 flex items-center justify-between z-20 select-none flex-shrink-0">
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center space-x-3 flex-1 max-w-lg">
          {onMobileMenuToggle && (
            <button
              type="button"
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 rounded-lg text-[#0E1B2A] hover:bg-[#EDF1F5] focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => setCommandSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F4F6F9] border border-[#E2E6EB] rounded-lg text-sm text-[#64748B] hover:border-[#B0B8C4] cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Search className="w-4 h-4 text-[#94A3B8]" />
              <span className="truncate text-[13.5px]">Search students, batches, tests...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono bg-white border border-[#D4D9DF] rounded text-[#64748B]">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Right: Cycle, Notifications, User */}
        <div className="flex items-center space-x-3 ml-5">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-[#F4F6F9] rounded-lg text-[12.5px] font-medium text-[#374151] border border-[#E2E6EB]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span>Intake 2026-A</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 rounded-lg text-[#374151] hover:bg-[#F4F6F9] relative transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              aria-label="Open notifications"
            >
              <Bell className="w-5 h-5 stroke-[1.75]" />
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 border border-white" />
            </button>
            <NotificationPanel
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          <div className="h-6 w-[1px] bg-[#E2E6EB]" />

          {/* User & Role Switcher */}
          <div className="flex items-center space-x-3">
            <Avatar size="sm" fallbackText={user?.name || 'CP'} />
            <div className="hidden sm:block">
              <div className="text-[13.5px] font-semibold text-[#0E1B2A] truncate max-w-[160px] leading-tight">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[12px] text-[#64748B] truncate max-w-[160px] leading-tight">
                {user?.rankTitle || user?.email}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#F4F6F9] border border-[#E2E6EB] rounded-lg text-[12.5px] font-medium text-[#374151] hover:bg-[#EAECF0] transition-colors focus:outline-none focus:ring-1 focus:ring-[#0E1B2A]"
              >
                <span className="font-semibold text-[#0E1B2A] capitalize">{role?.toLowerCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E2E6EB] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider border-b border-[#F1F5F9]">
                    Switch View
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#F8FAFC] transition-colors ${
                      role === 'ADMIN' ? 'font-semibold text-[#0E1B2A] bg-[#F4F6F9]' : 'text-[#374151]'
                    }`}
                  >
                    Administrator
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('TEACHER')}
                    className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#F8FAFC] transition-colors ${
                      role === 'TEACHER' ? 'font-semibold text-[#0E1B2A] bg-[#F4F6F9]' : 'text-[#374151]'
                    }`}
                  >
                    Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('STUDENT')}
                    className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#F8FAFC] transition-colors ${
                      role === 'STUDENT' ? 'font-semibold text-[#0E1B2A] bg-[#F4F6F9]' : 'text-[#374151]'
                    }`}
                  >
                    Candidate
                  </button>
                  <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full text-left px-3 py-2.5 text-[13px] text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
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
