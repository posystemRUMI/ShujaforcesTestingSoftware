import { useQuery } from '@tanstack/react-query';
import { configurationService } from '@/services/configurationService';
import testPatternService from '@/services/testPatternService';
import { batchService } from '@/services/batchService';
import { studentService } from '@/services/studentService';
import { teacherService } from '@/services/teacherService';
import { testService } from '@/services/testService';
import { questionService } from '@/services/questionService';
import { resultService } from '@/services/resultService';
import { leaderboardService } from '@/services/leaderboardService';
import { financeService } from '@/services/financeService';
import { queryClient } from '@/lib/queryClient';

// Core Hooks for React Components
export function useForcesQuery() {
  return useQuery({
    queryKey: ['forces'],
    queryFn: () => configurationService.getForces(),
    staleTime: 15 * 60 * 1000, // 15 mins reference cache
    gcTime: 30 * 60 * 1000,
  });
}

export function useCoursesQuery(forceId?: string) {
  return useQuery({
    queryKey: forceId ? ['courses', forceId] : ['courses'],
    queryFn: () => configurationService.getCourses(forceId),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useSubjectsQuery() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => configurationService.getSubjects(),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useTestPatternsQuery(forceId?: string, courseId?: string) {
  return useQuery({
    queryKey: ['test-patterns', forceId || 'all', courseId || 'all'],
    queryFn: () => testPatternService.getTemplates(forceId, courseId),
    staleTime: 15 * 60 * 1000,
  });
}

export function useBatchesQuery() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: () => batchService.getBatches(),
    staleTime: 30 * 1000, // 30s operational cache
    gcTime: 5 * 60 * 1000,
  });
}

export function useStudentsQuery() {
  return useQuery({
    queryKey: ['students'],
    queryFn: () => studentService.getStudents(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useTeachersQuery() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: () => teacherService.getTeachers(),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useTestsQuery() {
  return useQuery({
    queryKey: ['tests'],
    queryFn: () => testService.getTests(),
    staleTime: 30 * 1000,
  });
}

export function useQuestionBankQuery() {
  return useQuery({
    queryKey: ['question-bank'],
    queryFn: () => questionService.getQuestions(),
    staleTime: 30 * 1000,
  });
}

export function useResultsQuery(studentId?: string) {
  return useQuery({
    queryKey: studentId ? ['results', studentId] : ['results'],
    queryFn: () => resultService.getResults(studentId ? { studentId } : undefined),
    staleTime: 20 * 1000,
  });
}

export function useLeaderboardQuery(filters?: any) {
  return useQuery({
    queryKey: ['leaderboard', filters || {}],
    queryFn: () => leaderboardService.getAcademyLeaderboard(filters),
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000, // Conservative polling fallback for leaderboard
  });
}

export function useFinanceQuery(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['finance', fromDate || 'all', toDate || 'all'],
    queryFn: () => financeService.getFinanceSummary(fromDate, toDate),
    staleTime: 20 * 1000,
  });
}

// Invalidation Helpers after Mutations
export const invalidateAppQuery = (queryKey: string[]) => {
  queryClient.invalidateQueries({ queryKey });
};
