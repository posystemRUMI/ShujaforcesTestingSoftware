import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AdminShell, ExamShell, StudentShell, AuthShell } from '@/components/layout';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { UserRole } from '@/types';

// Lazy-loaded Feature Modules
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const BatchesPage = lazy(() => import('@/features/batches/BatchesPage'));
const BatchDetailPage = lazy(() => import('@/features/batches/BatchDetailPage'));
const StudentsListPage = lazy(() => import('@/features/students/StudentsListPage'));
const StudentFormPage = lazy(() => import('@/features/students/StudentFormPage'));
const StudentRegistrationPage = lazy(() => import('@/features/students/StudentRegistrationPage'));
const StudentDetailPage = lazy(() => import('@/features/students/StudentDetailPage'));
const StudentImportPage = lazy(() => import('@/features/students/StudentImportPage'));
const TeachersListPage = lazy(() => import('@/features/teachers/TeachersListPage'));
const TeacherFormPage = lazy(() => import('@/features/teachers/TeacherFormPage'));
const TeacherDetailPage = lazy(() => import('@/features/teachers/TeacherDetailPage'));
const QuestionBankPage = lazy(() => import('@/features/question-bank/QuestionBankPage'));
const QuestionAuthorPage = lazy(() => import('@/features/question-author/QuestionAuthorPage'));
const TestBuilderPage = lazy(() => import('@/features/test-builder/TestBuilderPage'));
const TestManagementPage = lazy(() => import('@/features/tests/TestManagementPage'));
const LiveProctorPage = lazy(() => import('@/features/live-proctor/LiveProctorPage'));
const ResultsPage = lazy(() => import('@/features/results/ResultsPage'));
const RetakesPage = lazy(() => import('@/features/retakes/RetakesPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));
const ForcesPage = lazy(() => import('@/features/configuration/ForcesPage'));
const ForceDetailPage = lazy(() => import('@/features/configuration/ForceDetailPage'));
const CoursesPage = lazy(() => import('@/features/configuration/CoursesPage'));
const SubjectsPage = lazy(() => import('@/features/configuration/SubjectsPage'));
const SettingsPage = lazy(() => import('@/features/configuration/SettingsPage'));
const StudentDashboardPage = lazy(() => import('@/features/student-portal/StudentDashboardPage'));
const StudentTestsPage = lazy(() => import('@/features/student-portal/StudentTestsPage'));
const StudentResultsPage = lazy(() => import('@/features/student-portal/StudentResultsPage'));
const StudentProfilePage = lazy(() => import('@/features/student-portal/StudentProfilePage'));
const ExamFamiliarizationPage = lazy(() => import('@/features/exam-engine/ExamFamiliarizationPage'));
const ExamInstructionsPage = lazy(() => import('@/features/exam-engine/ExamInstructionsPage'));
const ExamRunnerPage = lazy(() => import('@/features/exam-engine/ExamRunnerPage'));
const ExamFinishPage = lazy(() => import('@/features/exam-engine/ExamFinishPage'));
const TestPatternsPage = lazy(() => import('@/features/configuration/TestPatternsPage'));
const StudentLeaderboardPage = lazy(() => import('@/features/leaderboard/StudentLeaderboardPage'));
const TeacherLeaderboardPage = lazy(() => import('@/features/leaderboard/TeacherLeaderboardPage'));
const FinancePage = lazy(() => import('@/features/finance/FinancePage'));
const NotFoundPage = lazy(() => import('@/features/not-found/NotFoundPage'));

// Sober Institutional Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center space-y-3">
    <RefreshCw className="w-6 h-6 text-[#0E1B2A] animate-spin" />
    <span className="text-xs font-sans font-medium text-[#64748B] uppercase tracking-wider">
      Initializing Module...
    </span>
  </div>
);

// Declarative Role & Auth Protection Guard
const RequireRole: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Root Redirect
  {
    path: '/',
    element: <Navigate to="/student" replace />,
  },

  // Compatibility Redirect for /finance (Admin only)
  {
    path: '/finance',
    element: (
      <RequireRole allowedRoles={['ADMIN']}>
        <Navigate to="/admin/finance" replace />
      </RequireRole>
    ),
  },

  // Auth Routes
  {
    element: <AuthShell />,
    children: [
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <LoginPage />
          </Suspense>
        ),
      },
    ],
  },

  // Admin / Faculty Command Center Routes
  {
    path: '/admin',
    element: (
      <RequireRole allowedRoles={['ADMIN', 'TEACHER']}>
        <AdminShell />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'batches',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <BatchesPage />
          </Suspense>
        ),
      },
      {
        path: 'batches/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <BatchDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'cadets',
        element: <Navigate to="/admin/students" replace />,
      },
      {
        path: 'students',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentsListPage />
          </Suspense>
        ),
      },
      {
        path: 'students/register',
        element: (
          <RequireRole allowedRoles={['ADMIN', 'TEACHER']}>
            <Suspense fallback={<PageLoadingFallback />}>
              <StudentRegistrationPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'students/new',
        element: (
          <RequireRole allowedRoles={['ADMIN', 'TEACHER']}>
            <Suspense fallback={<PageLoadingFallback />}>
              <StudentRegistrationPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'students/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'students/:id/edit',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentFormPage />
          </Suspense>
        ),
      },
      {
        path: 'students/import',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentImportPage />
          </Suspense>
        ),
      },
      {
        path: 'teachers',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeachersListPage />
          </Suspense>
        ),
      },
      {
        path: 'teachers/new',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeacherFormPage />
          </Suspense>
        ),
      },
      {
        path: 'teachers/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeacherDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'teachers/:id/edit',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeacherFormPage />
          </Suspense>
        ),
      },
      {
        path: 'questions',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <QuestionBankPage />
          </Suspense>
        ),
      },
      {
        path: 'authoring',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <QuestionAuthorPage />
          </Suspense>
        ),
      },
      {
        path: 'tests',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TestManagementPage />
          </Suspense>
        ),
      },
      {
        path: 'tests/new',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TestBuilderPage />
          </Suspense>
        ),
      },
      {
        path: 'tests/:id',
        element: (
          <RequireRole allowedRoles={['ADMIN', 'TEACHER']}>
            <Suspense fallback={<PageLoadingFallback />}>
              <TestBuilderPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'test-builder',
        element: (
          <RequireRole allowedRoles={['ADMIN', 'TEACHER']}>
            <Suspense fallback={<PageLoadingFallback />}>
              <TestBuilderPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'test-patterns',
        element: (
          <RequireRole allowedRoles={['ADMIN', 'TEACHER']}>
            <Suspense fallback={<PageLoadingFallback />}>
              <TestPatternsPage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'live-proctor',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <LiveProctorPage />
          </Suspense>
        ),
      },
      {
        path: 'results',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ResultsPage />
          </Suspense>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeacherLeaderboardPage />
          </Suspense>
        ),
      },
      {
        path: 'retakes',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <RetakesPage />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ReportsPage />
          </Suspense>
        ),
      },
      {
        path: 'finance',
        element: (
          <RequireRole allowedRoles={['ADMIN']}>
            <Suspense fallback={<PageLoadingFallback />}>
              <FinancePage />
            </Suspense>
          </RequireRole>
        ),
      },
      {
        path: 'forces',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ForcesPage />
          </Suspense>
        ),
      },
      {
        path: 'forces/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ForceDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'courses',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CoursesPage />
          </Suspense>
        ),
      },
      {
        path: 'subjects',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <SubjectsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },

  // Cadet / Student Practice Portal (Strict Isolation)
  {
    path: '/student',
    element: (
      <RequireRole allowedRoles={['STUDENT']}>
        <StudentShell />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'tests',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentTestsPage />
          </Suspense>
        ),
      },
      {
        path: 'results',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentResultsPage />
          </Suspense>
        ),
      },
      {
        path: 'leaderboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentLeaderboardPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudentProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'test/:id/familiarization',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamFamiliarizationPage />
          </Suspense>
        ),
      },
      {
        path: 'test/:id/instructions',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamInstructionsPage />
          </Suspense>
        ),
      },
      {
        path: 'result/:attemptId',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamFinishPage />
          </Suspense>
        ),
      },
    ],
  },

  // Distraction-Free Air-Gapped CBT Examination Room
  {
    path: '/exam',
    element: (
      <RequireRole allowedRoles={['STUDENT']}>
        <ExamShell />
      </RequireRole>
    ),
    children: [
      {
        path: 'familiarization',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamFamiliarizationPage />
          </Suspense>
        ),
      },
      {
        path: 'instructions',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamInstructionsPage />
          </Suspense>
        ),
      },
      {
        path: 'runner',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamRunnerPage />
          </Suspense>
        ),
      },
      {
        path: 'finish',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ExamFinishPage />
          </Suspense>
        ),
      },
    ],
  },

  // 404 Catch-All
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
