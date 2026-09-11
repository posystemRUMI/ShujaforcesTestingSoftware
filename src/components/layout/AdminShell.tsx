import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  IdCard,
  GraduationCap,
  FileQuestion,
  PenSquare,
  Wrench,
  Radio,
  BarChart3,
  RotateCcw,
  Settings,
  PieChart,
  Layers,
  Sparkles,
  Trophy,
  Wallet,
} from 'lucide-react';
import { Sidebar, Topbar, ResponsiveDrawer } from '@/components/ui';
import { useAuth } from '@/app/providers';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Batches', to: '/admin/batches', icon: Users },
  { label: 'Students', to: '/admin/students', icon: IdCard },
  { label: 'Faculty', to: '/admin/teachers', icon: GraduationCap },
  { label: 'Question Bank', to: '/admin/questions', icon: FileQuestion },
  { label: 'Question Authoring', to: '/admin/authoring', icon: PenSquare },
  { label: 'Test Management', to: '/admin/tests', icon: Wrench },
  { label: 'Test Builder', to: '/admin/test-builder', icon: Sparkles },
  { label: 'Test Patterns', to: '/admin/test-patterns', icon: Layers },
  { label: 'Live Monitoring', to: '/admin/live-proctor', icon: Radio },
  { label: 'Leaderboard', to: '/admin/leaderboard', icon: Trophy },
  { label: 'Results', to: '/admin/results', icon: BarChart3 },
  { label: 'Retakes', to: '/admin/retakes', icon: RotateCcw },
  { label: 'Reports & Analytics', to: '/admin/reports', icon: PieChart },
  { label: 'Finance', to: '/admin/finance', icon: Wallet },
  { label: 'Configuration', to: '/admin/settings', icon: Settings },
];

export const AdminShell: React.FC = () => {
  const { role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavItems = React.useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (item.to === '/admin/finance') {
        return role === 'ADMIN';
      }
      return true;
    });
  }, [role]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F8FA] select-none text-[#1F2937]">
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
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-[1520px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
