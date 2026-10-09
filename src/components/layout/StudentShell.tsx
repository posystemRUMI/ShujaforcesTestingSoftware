import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ArrowRight, BookOpen, Award, UserCheck, LayoutDashboard, Trophy, Wallet } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { ShujaForcesLogo } from '@/components/brand/ShujaForcesLogo';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useQuery } from '@tanstack/react-query';
import { studentPortalService } from '@/services/studentPortalService';
import '@/styles/student-portal.css';
import { MotionConfig } from 'framer-motion';
const links = [
  { to: '/student', label: 'Dashboard', mobile: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/tests', label: 'Assigned Tests', mobile: 'Tests', icon: BookOpen },
  { to: '/student/results', label: 'My Results', mobile: 'Results', icon: Award },
  { to: '/student/leaderboard', label: 'Leaderboard', mobile: 'Rankings', icon: Trophy },
  { to: '/student/fees', label: 'My Fees', mobile: 'Fees', icon: Wallet },
  { to: '/student/profile', label: 'My Profile', mobile: 'Profile', icon: UserCheck },
];
export const StudentShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const portal = useQuery({
    queryKey: ['student', 'portal', user?.id],
    queryFn: studentPortalService.snapshot,
    enabled: !!user,
    staleTime: 0,
    refetchInterval: 30000,
  });

  // Initialize Supabase Realtime auto-refresh query invalidation for student portal
  useRealtimeSync('student');


  const title = links.find(l => l.to !== '/student' && location.pathname.startsWith(l.to))?.label
    || (location.pathname.includes('/test/') ? 'Examination' : location.pathname.includes('/result/') ? 'My Results' : 'Dashboard');
  const name = portal.data?.profile.name ?? (portal.isError ? 'Unavailable' : 'Loading...');
  const roll = portal.data?.profile.roll_number ?? (portal.isError ? 'Unavailable' : 'Loading...');
  const navigation = (mobile: boolean) => links.map(({ to, label, mobile: shortLabel, icon: Icon }) =>
    <NavLink key={to} to={to} end={to === '/student'} className={({ isActive }) => 'student-nav-link' + (isActive || (to === '/student' && location.pathname === '/student/dashboard') ? ' is-active' : '')}>
      <Icon aria-hidden="true" /><span>{mobile ? shortLabel : label}</span>
    </NavLink>);
  return <MotionConfig reducedMotion="user"><div className="academy-student">
    <aside className="student-sidebar">
      <div className="student-sidebar-brand"><ShujaForcesLogo variant="light" size="sm" showLocation={true} compact={true} /></div>
      <p className="student-nav-caption">Student Portal</p>
      <nav className="student-navigation" aria-label="Student navigation">{navigation(false)}</nav>
      <div className="student-sidebar-identity"><p>{name}</p><p>{roll}</p></div>
    </aside>
    <div className="student-workspace">
      <header className="student-topbar">
        <div><div className="student-mobile-brand"><ShujaForcesLogo variant="light" size="sm" showLocation={true} compact={true} /></div><p className="student-topbar-eyebrow">Shuja Forces Academy</p><p className="student-topbar-title">{title}</p></div>
        <div className="student-topbar-actions">
          <NavLink to="/student/tests" className="student-button"><span className="hidden sm:inline">Launch Exam</span><span className="sm:hidden">Exam</span><ArrowRight size={16} aria-hidden="true" /></NavLink>
          <div className="student-topbar-account"><strong>{name}</strong><span>{roll}</span></div>
          <button type="button" onClick={() => { logout(); navigate('/login'); }} title="Log Out" className="student-logout" aria-label="Log Out"><LogOut size={18} /></button>
        </div>
      </header>
      <nav className="student-mobile-navigation" aria-label="Mobile student navigation">{navigation(true)}</nav>
      <main className="student-main"><Outlet /></main>
      <footer className="student-footer">Shuja Forces Academy Pindsultani - Computerized Testing &amp; Examination System</footer>
    </div>
  </div></MotionConfig>;
};
export default StudentShell;
