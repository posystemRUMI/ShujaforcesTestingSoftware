import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LogOut, ArrowRight, BookOpen, Award, UserCheck, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/app/providers';

export const StudentShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FA] text-[#1F2937]">
      {/* Top Header */}
      <header className="h-16 bg-[#0E1B2A] text-white px-4 md:px-6 flex items-center justify-between border-b border-[#1C2E42] sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="w-9 h-9 rounded bg-[#C6A75E] flex items-center justify-center text-[#0E1B2A] font-bold shadow-inner">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              Cadet Examination Portal
            </h1>
            <p className="text-[10px] text-[#A0AEC0] font-mono hidden sm:block">Forces Academy Testing System</p>
          </div>
        </div>

        {/* Primary Student Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              `text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-[#C6A75E]' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/student/tests"
            className={({ isActive }) =>
              `text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-[#C6A75E]' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Assigned Tests</span>
          </NavLink>

          <NavLink
            to="/student/results"
            className={({ isActive }) =>
              `text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-[#C6A75E]' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Results</span>
          </NavLink>

          <NavLink
            to="/student/profile"
            className={({ isActive }) =>
              `text-xs font-semibold px-3 py-2 rounded flex items-center gap-1.5 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-[#C6A75E]' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </NavLink>
        </nav>

        {/* User Identity Docket & Direct Exam Action */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <NavLink
            to="/student/test/test-pma-initial/instructions"
            className="flex items-center space-x-1.5 bg-[#C6A75E] text-[#0E1B2A] px-3 py-1.5 rounded text-xs font-bold hover:bg-[#D8BA70] transition-colors shadow-sm"
          >
            <span className="hidden sm:inline">Launch Exam</span>
            <span className="sm:hidden">Exam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>

          <div className="text-right hidden sm:block border-l border-[#1C2E42] pl-3">
            <p className="text-xs font-semibold text-white leading-tight">{user?.name || 'Cadet User'}</p>
            <p className="text-[10px] text-[#C6A75E] font-mono leading-tight">{user?.rollNumber || 'PMA-2601'}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Log Out"
            className="text-[#A0AEC0] hover:text-red-400 p-1.5 rounded hover:bg-[#1C2E42] transition-colors"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-[#0E1B2A] border-b border-[#1C2E42] px-4 py-2 flex items-center justify-around text-xs">
        <NavLink
          to="/student"
          end
          className={({ isActive }) => (isActive ? 'text-[#C6A75E] font-bold' : 'text-[#A0AEC0]')}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/student/tests"
          className={({ isActive }) => (isActive ? 'text-[#C6A75E] font-bold' : 'text-[#A0AEC0]')}
        >
          Tests
        </NavLink>
        <NavLink
          to="/student/results"
          className={({ isActive }) => (isActive ? 'text-[#C6A75E] font-bold' : 'text-[#A0AEC0]')}
        >
          Results
        </NavLink>
        <NavLink
          to="/student/profile"
          className={({ isActive }) => (isActive ? 'text-[#C6A75E] font-bold' : 'text-[#A0AEC0]')}
        >
          Profile
        </NavLink>
      </div>

      {/* Main Student Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Sober Institutional Footer */}
      <footer className="bg-[#0E1B2A] border-t border-[#1C2E42] py-4 px-6 text-center text-[11px] text-[#64748B] font-mono">
        Forces Academy Computerized Testing System (CBT Engine v2.4) • All Cadet Sessions Encrypted & Audited
      </footer>
    </div>
  );
};

export default StudentShell;
