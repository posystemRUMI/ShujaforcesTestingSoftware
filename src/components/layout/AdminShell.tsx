import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  IdCard,
  GraduationCap,
  FileQuestion,
  PenSquare,
  BarChart3,
  Sparkles,
  Trophy,
  Wallet,
  CalendarCheck,
} from 'lucide-react';
import { Sidebar, Topbar, ResponsiveDrawer } from '@/components/ui';
import { useAuth } from '@/app/providers';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import '@/styles/management-portal.css';
import { MotionConfig } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', to: '/admin/students', icon: IdCard },
  { label: 'Attendance', to: '/admin/attendance', icon: CalendarCheck },
  { label: 'Faculty', to: '/admin/teachers', icon: GraduationCap },
  { label: 'Question Bank', to: '/admin/questions', icon: FileQuestion },
  { label: 'Question Authoring', to: '/admin/authoring', icon: PenSquare },
  { label: 'Test Builder', to: '/admin/test-builder', icon: Sparkles },
  { label: 'Leaderboard', to: '/admin/leaderboard', icon: Trophy },
  { label: 'Results', to: '/admin/results', icon: BarChart3 },
  { label: 'Finance', to: '/admin/finance', icon: Wallet },
];

export const AdminShell: React.FC = () => {
  const { role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Supabase Realtime auto-refresh query invalidation
  useRealtimeSync('admin');

  const filteredNavItems = React.useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (item.to === '/admin/finance' || item.to === '/admin/attendance') {
        return role === 'ADMIN';
      }
      return true;
    });
  }, [role]);

  return (
    <MotionConfig reducedMotion="user"><div className="academy-management flex h-screen w-screen overflow-hidden bg-[#F6F8FA] select-none text-[#1F2937]" data-role={role}>
      {/* Desktop Structural Navigation Sidebar (240px) */}
      <Sidebar items={filteredNavItems} className="hidden md:flex" />

      {/* Mobile Drawer Navigation */}
      <ResponsiveDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Navigation Menu"
        subtitle="Shuja Forces Academy Pindsultani"
        side="left"
        width="w-64"
      >
        <Sidebar
          items={filteredNavItems}
          className="w-full border-none h-full bg-transparent text-[#0E1B2A]"
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </ResponsiveDrawer>

      {/* Main Command Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Scrollable Page Canvas */}
        <main className="staff-content flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="staff-canvas max-w-[1520px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div></MotionConfig>
  );
};

export default AdminShell;
