import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ArrowRight, BookOpen, Award, UserCheck, LayoutDashboard, Trophy } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ShujaForcesLogo } from '@/components/brand/ShujaForcesLogo';

export const StudentShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FA] text-[#1F2937]">
      {/* Top Header (68px Desktop Height) */}
      <header className="h-[68px] bg-[#0E1B2A] text-white px-5 sm:px-6 lg:px-8 flex items-center justify-between border-b border-[#1C2E42] sticky top-0 z-30 shadow-xs">
        {/* Brand / Logo Area */}
        <div className="flex items-center">
          <ShujaForcesLogo
            variant="light"
            size="sm"
            showLocation={true}
            compact={true}
          />
        </div>

        {/* Primary Student Navigation (42px height, 16px padding, 8px gap) */}
        <nav className="hidden md:flex items-center space-x-2">
          <NavLink
            to="/student"
            end
            className={({ isActive }) =>
              `h-[42px] px-4 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-white shadow-xs font-semibold' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <LayoutDashboard className="w-[17px] h-[17px]" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/student/tests"
            className={({ isActive }) =>
              `h-[42px] px-4 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-white shadow-xs font-semibold' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <BookOpen className="w-[17px] h-[17px]" />
            <span>Assigned Tests</span>
          </NavLink>

          <NavLink
            to="/student/results"
            className={({ isActive }) =>
              `h-[42px] px-4 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-white shadow-xs font-semibold' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <Award className="w-[17px] h-[17px]" />
            <span>My Results</span>
          </NavLink>

          <NavLink
            to="/student/leaderboard"
            className={({ isActive }) =>
              `h-[42px] px-4 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-white shadow-xs font-semibold' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <Trophy className="w-[17px] h-[17px]" />
            <span>Leaderboard</span>
          </NavLink>

          <NavLink
            to="/student/profile"
            className={({ isActive }) =>
              `h-[42px] px-4 rounded-xl text-[13px] font-medium flex items-center gap-2 transition-colors ${
                isActive ? 'bg-[#1C2E42] text-white shadow-xs font-semibold' : 'text-[#A0AEC0] hover:text-white hover:bg-[#152335]'
              }`
            }
          >
            <UserCheck className="w-[17px] h-[17px]" />
            <span>My Profile</span>
          </NavLink>
        </nav>

        {/* User Identity & Direct Exam Action */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <NavLink
            to="/exam/familiarization"
            className="h-[42px] px-4 sm:px-5 rounded-xl text-[13px] font-semibold bg-[#C6A75E] text-[#0E1B2A] hover:bg-[#D8BA70] transition-colors shadow-xs flex items-center gap-2 shrink-0"
          >
            <span className="hidden sm:inline">Launch Exam</span>
            <span className="sm:hidden">Exam</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>

          <div className="text-right hidden sm:flex flex-col justify-center min-w-[110px] lg:min-w-[130px] border-l border-[#1C2E42] pl-3.5 pr-1">
            <p className="text-[13px] font-semibold text-white leading-tight truncate">{user?.name || 'Cadet User'}</p>
            <p className="text-[11px] text-[#C6A75E] font-mono leading-tight mt-0.5">{user?.rollNumber || 'PMA-2601'}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Log Out"
            className="w-10 h-10 flex items-center justify-center text-[#A0AEC0] hover:text-red-400 rounded-xl hover:bg-[#1C2E42] transition-colors shrink-0"
            aria-label="Log Out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-[#0E1B2A] border-b border-[#1C2E42] px-4 py-2.5 flex items-center justify-around text-xs">
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
          to="/student/leaderboard"
          className={({ isActive }) => (isActive ? 'text-[#C6A75E] font-bold' : 'text-[#A0AEC0]')}
        >
          Rankings
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
      <footer className="bg-[#0E1B2A] border-t border-[#1C2E42] py-4 px-6 text-center text-xs text-[#64748B] font-sans">
        Shuja Forces Academy Pindsultani • Computerized Testing & Examination System
      </footer>
    </div>
  );
};

export default StudentShell;
