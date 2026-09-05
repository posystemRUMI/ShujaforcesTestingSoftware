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
} from 'lucide-react';
import { Sidebar, Topbar, ResponsiveDrawer } from '@/components/ui';

const NAV_ITEMS = [
  { label: 'Command Console', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Wing Batches', to: '/admin/batches', icon: Users },
  { label: 'Cadet Dockets', to: '/admin/students', icon: IdCard },
  { label: 'Faculty & Officers', to: '/admin/teachers', icon: GraduationCap },
  { label: 'Question Bank', to: '/admin/questions', icon: FileQuestion },
  { label: 'Authoring Studio', to: '/admin/authoring', icon: PenSquare },
  { label: 'Test Management', to: '/admin/tests', icon: Wrench },
  { label: 'Live Proctor Radar', to: '/admin/live-proctor', icon: Radio },
  { label: 'Results & Stanine', to: '/admin/results', icon: BarChart3 },
  { label: 'Retake Chamber', to: '/admin/retakes', icon: RotateCcw },
  { label: 'Reports & Analytics', to: '/admin/reports', icon: PieChart },
  { label: 'Configuration', to: '/admin/settings', icon: Settings },
];

export const AdminShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F6F8FA] select-none text-[#1F2937]">
      {/* Desktop Structural Navigation Sidebar (240px) */}
      <Sidebar items={NAV_ITEMS} className="hidden md:flex" />

      {/* Mobile Drawer Navigation */}
      <ResponsiveDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Navigation Menu"
        subtitle="Forces Academy CBT Command"
        side="left"
        width="w-64"
      >
        <Sidebar
          items={NAV_ITEMS}
          className="w-full border-none h-full bg-transparent text-[#0E1B2A]"
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </ResponsiveDrawer>

      {/* Main Command Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Scrollable Subsystem Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
