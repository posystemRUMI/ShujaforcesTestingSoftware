import { useQuery, useMutation } from '@tanstack/react-query';
import { configurationService } from '@/services/configurationService';
import { studentService } from '@/services/studentService';
import { teacherService } from '@/services/teacherService';
import { batchService } from '@/services/batchService';
import { testService } from '@/services/testService';
import { questionService } from '@/services/questionService';
import { resultService } from '@/services/resultService';
import { leaderboardService } from '@/services/leaderboardService';
import { financeService } from '@/services/financeService';
import { queryClient } from '@/lib/queryClient';

// Reference Data Hooks (Longer stale times: 10-30 min)
export function useForcesQuery() {
  return useQuery({
    queryKey: ['forces'],
    queryFn: () => configurationService.getForces(),
    staleTime: 20 * 60 * 1000,
  });
}

export function useCoursesQuery(forceId?: string) {
  return useQuery({
    queryKey: forceId ? ['courses', forceId] : ['courses'],
    queryFn: () => configurationService.getCourses(forceId),
    staleTime: 20 * 60 * 1000,
  });
}

export function useSubjectsQuery() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => configurationService.getSubjects(),
    staleTime: 20 * 60 * 1000,
  });
}

export function useTestPatternsQuery() {
  return useQuery({
    queryKey: ['test-patterns'],
    queryFn: () => configurationService.getTestPatterns(),
    staleTime: 10 * 60 * 1000,
  });
}

// Operational Data Hooks (Shorter stale times: 15-60 seconds)
export function useBatchesQuery() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getBatches(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentsQuery(filters?: any) {
  return useQuery({
    queryKey: ['students', filters || {}],
    queryFn: () => studentService.getStudents(filters),
    staleTime: 30 * 1000,
  });
}

export function useTeachersQuery() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers(),
    staleTime: 30 * 1000,
  });
}

export function useTestsQuery() {
  return useQuery({
    queryKey: ['tests'],
    queryFn: () => testService.getTests(),
    staleTime: 30 * 1000,
  });
}

export function useQuestionBankQuery(filters?: any) {
  return useQuery({
    queryKey: ['question-bank', filters || {}],
    queryFn: () => questionService.getQuestions(filters),
    staleTime: 30 * 1000,
  });
}

export function useResultsQuery(studentId?: string) {
  return useQuery({
    queryKey: studentId ? ['results', studentId] : ['results'],
    queryFn: () => (studentId ? resultService.getStudentResults(studentId) : resultService.getResults()),
    staleTime: 20 * 1000,
  });
}

export function useLeaderboardQuery(scope: string = 'ACADEMY', scopeId?: string) {
  return useQuery({
    queryKey: ['leaderboard', scope, scopeId || 'all'],
    queryFn: () => leaderboardService.getLeaderboard(scope as any, scopeId),
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000, // Conservative polling fallback for leaderboard
  });
}

export function useFinanceQuery() {
  return useQuery({
    queryKey: ['finance'],
    queryFn: () => financeService.getFinanceOverview(),
    staleTime: 20 * 1000,
  });
}

// Invalidation Helpers after Mutations
export const invalidateAppQuery = (queryKey: string[]) => {
  queryClient.invalidateQueries({ queryKey });
};
