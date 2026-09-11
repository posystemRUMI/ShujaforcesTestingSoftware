import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AdminShell, ExamShell, StudentShell, AuthShell } from '@/components/layout';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { UserRole } from '@/types';

// Resilient Lazy Import Helper (Auto-reloads on deployment bundle hash changes)
function safeLazy<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      console.warn('Dynamic import failed (fresh build deployment detected). Auto-reloading...', err);
      const reloaded = sessionStorage.getItem('chunk_load_auto_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_load_auto_reload', 'true');
        window.location.reload();
      }
      throw err;
    }
  });
}

// Lazy-loaded Feature Modules
const LoginPage = safeLazy(() => import('@/features/auth/LoginPage'));
const DashboardPage = safeLazy(() => import('@/features/dashboard/DashboardPage'));
const BatchesPage = safeLazy(() => import('@/features/batches/BatchesPage'));
const BatchDetailPage = safeLazy(() => import('@/features/batches/BatchDetailPage'));
const StudentsListPage = safeLazy(() => import('@/features/students/StudentsListPage'));
const StudentFormPage = safeLazy(() => import('@/features/students/StudentFormPage'));
const StudentRegistrationPage = safeLazy(() => import('@/features/students/StudentRegistrationPage'));
const StudentDetailPage = safeLazy(() => import('@/features/students/StudentDetailPage'));
const StudentImportPage = safeLazy(() => import('@/features/students/StudentImportPage'));
const TeachersListPage = safeLazy(() => import('@/features/teachers/TeachersListPage'));
const TeacherFormPage = safeLazy(() => import('@/features/teachers/TeacherFormPage'));
const TeacherDetailPage = safeLazy(() => import('@/features/teachers/TeacherDetailPage'));
const QuestionBankPage = safeLazy(() => import('@/features/question-bank/QuestionBankPage'));
const QuestionAuthorPage = safeLazy(() => import('@/features/question-author/QuestionAuthorPage'));
const TestBuilderPage = safeLazy(() => import('@/features/test-builder/TestBuilderPage'));
const TestManagementPage = safeLazy(() => import('@/features/tests/TestManagementPage'));
const ResultsPage = safeLazy(() => import('@/features/results/ResultsPage'));
const RetakesPage = safeLazy(() => import('@/features/retakes/RetakesPage'));
const ReportsPage = safeLazy(() => import('@/features/reports/ReportsPage'));
const ForcesPage = safeLazy(() => import('@/features/configuration/ForcesPage'));
const ForceDetailPage = safeLazy(() => import('@/features/configuration/ForceDetailPage'));
const CoursesPage = safeLazy(() => import('@/features/configuration/CoursesPage'));
const SubjectsPage = safeLazy(() => import('@/features/configuration/SubjectsPage'));
const SettingsPage = safeLazy(() => import('@/features/configuration/SettingsPage'));
const StudentDashboardPage = safeLazy(() => import('@/features/student-portal/StudentDashboardPage'));
const StudentTestsPage = safeLazy(() => import('@/features/student-portal/StudentTestsPage'));
const StudentResultsPage = safeLazy(() => import('@/features/student-portal/StudentResultsPage'));
const StudentProfilePage = safeLazy(() => import('@/features/student-portal/StudentProfilePage'));
const ExamFamiliarizationPage = safeLazy(() => import('@/features/exam-engine/ExamFamiliarizationPage'));
const ExamInstructionsPage = safeLazy(() => import('@/features/exam-engine/ExamInstructionsPage'));
const ExamRunnerPage = safeLazy(() => import('@/features/exam-engine/ExamRunnerPage'));
const ExamFinishPage = safeLazy(() => import('@/features/exam-engine/ExamFinishPage'));
const TestPatternsPage = safeLazy(() => import('@/features/configuration/TestPatternsPage'));
const StudentLeaderboardPage = safeLazy(() => import('@/features/leaderboard/StudentLeaderboardPage'));
const TeacherLeaderboardPage = safeLazy(() => import('@/features/leaderboard/TeacherLeaderboardPage'));
const FinancePage = safeLazy(() => import('@/features/finance/FinancePage'));
const NotFoundPage = safeLazy(() => import('@/features/not-found/NotFoundPage'));

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
