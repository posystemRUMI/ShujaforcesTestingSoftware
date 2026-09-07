/**
 * Leaderboard & Ranking Service
 * Shuja Forces Academy CBT Production Engine
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  roll_number: string;
  student_name: string;
  batch_id: string | null;
  batch_name: string;
  course_id: string | null;
  course_name: string;
  force_id: string | null;
  force_name: string;
  tests_completed?: number;
  total_marks_obtained?: number;
  total_marks_possible?: number;
  aggregate_percentage?: number;
  average_percentage?: number;
  best_percentage?: number;
  score?: number;
  total_marks?: number;
  percentage?: number;
  passed?: boolean;
  time_spent_seconds?: number | null;
  submitted_at?: string;
  is_current_user: boolean;
}

export interface StudentRankSummary {
  student_id: string;
  roll_number: string;
  tests_completed: number;
  total_marks_obtained: number;
  total_marks_possible: number;
  aggregate_percentage: number;
  average_percentage: number;
  best_percentage: number;
  batch_rank: number | null;
  batch_total: number;
  course_rank: number | null;
  course_total: number;
  academy_rank: number | null;
  academy_total: number;
  latest_test_rank: number | null;
  latest_test_total: number;
  latest_test_id: string | null;
  latest_test_name: string | null;
  latest_test_percentage: number | null;
}

export interface RankNeighborhoodEntry {
  rank: number;
  roll_number: string;
  student_name: string;
  batch_name: string;
  percentage: number;
  is_current_user: boolean;
}

export interface LeaderboardResponse {
  leaders: LeaderboardEntry[];
  current_student: LeaderboardEntry | null;
  total_participants: number;
}

export interface LeaderboardFilters {
  forceId?: string | null;
  courseId?: string | null;
  batchId?: string | null;
  testId?: string | null;
  limit?: number;
  minTests?: number;
}

export const leaderboardService = {
  /**
   * Get official leaderboard for a specific test
   */
  async getTestLeaderboard(testId: string, limit = 40): Promise<LeaderboardResponse> {
    if (!isSupabaseConfigured() || !testId) {
      return { leaders: [], current_student: null, total_participants: 0 };
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_test_leaderboard', {
        p_test_id: testId,
        p_limit: limit,
      });

      if (error) throw error;
      return {
        leaders: data?.leaders || [],
        current_student: data?.current_student || null,
        total_participants: Number(data?.total_participants || 0),
      };
    } catch (err) {
      console.warn('Failed to load test leaderboard:', err);
      return { leaders: [], current_student: null, total_participants: 0 };
    }
  },

  /**
   * Get course-wide or batch-within-course aggregate leaderboard
   */
  async getCourseLeaderboard(
    courseId: string,
    batchId?: string | null,
    limit = 40,
    minTests = 1
  ): Promise<LeaderboardResponse> {
    if (!isSupabaseConfigured() || !courseId) {
      return { leaders: [], current_student: null, total_participants: 0 };
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_course_leaderboard', {
        p_course_id: courseId,
        p_batch_id: batchId || null,
        p_limit: limit,
        p_min_tests: minTests,
      });

      if (error) throw error;
      return {
        leaders: data?.leaders || [],
        current_student: data?.current_student || null,
        total_participants: Number(data?.total_participants || 0),
      };
    } catch (err) {
      console.warn('Failed to load course leaderboard:', err);
      return { leaders: [], current_student: null, total_participants: 0 };
    }
  },

  /**
   * Get overall academy aggregate leaderboard with optional filters
   */
  async getAcademyLeaderboard(filters?: LeaderboardFilters): Promise<LeaderboardResponse> {
    if (!isSupabaseConfigured()) {
      return { leaders: [], current_student: null, total_participants: 0 };
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_academy_leaderboard', {
        p_force_id: filters?.forceId || null,
        p_course_id: filters?.courseId || null,
        p_batch_id: filters?.batchId || null,
        p_limit: filters?.limit || 40,
        p_min_tests: filters?.minTests || 1,
      });

      if (error) throw error;
      return {
        leaders: data?.leaders || [],
        current_student: data?.current_student || null,
        total_participants: Number(data?.total_participants || 0),
      };
    } catch (err) {
      console.warn('Failed to load academy leaderboard:', err);
      return { leaders: [], current_student: null, total_participants: 0 };
    }
  },

  /**
   * Get authenticated student's full rank summary across batch, course, academy, and latest test
   */
  async getStudentRankSummary(studentId?: string | null): Promise<StudentRankSummary | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data, error } = await (supabase as any).rpc('get_student_rank_summary', {
        p_student_id: studentId || null,
      });

      if (error) throw error;
      if (data?.error) return null;
      return data as StudentRankSummary;
    } catch (err) {
      console.warn('Failed to load student rank summary:', err);
      return null;
    }
  },

  /**
   * Get candidate's rank neighborhood (+/- 2 students around rank)
   */
  async getRankNeighborhood(
    scope: 'ACADEMY' | 'COURSE' | 'BATCH' | 'TEST' = 'ACADEMY',
    scopeId?: string | null,
    range = 2
  ): Promise<RankNeighborhoodEntry[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await (supabase as any).rpc('get_rank_neighborhood', {
        p_scope: scope,
        p_scope_id: scopeId || null,
        p_range: range,
      });

      if (error) throw error;
      return (data || []) as RankNeighborhoodEntry[];
    } catch (err) {
      console.warn('Failed to load rank neighborhood:', err);
      return [];
    }
  },

  /**
   * Search students on the leaderboard (server-side query for teachers/admins)
   */
  async searchStudentOnLeaderboard(
    query: string,
    filters?: LeaderboardFilters
  ): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured() || !query.trim()) return [];

    // Fetch broader leaderboard and match by name or roll_number
    const res = filters?.testId
      ? await this.getTestLeaderboard(filters.testId, 200)
      : filters?.courseId
      ? await this.getCourseLeaderboard(filters.courseId, filters.batchId, 200)
      : await this.getAcademyLeaderboard({ ...filters, limit: 200 });

    const q = query.toLowerCase().trim();
    return res.leaders.filter(
      (entry) =>
        entry.student_name.toLowerCase().includes(q) ||
        entry.roll_number.toLowerCase().includes(q)
    );
  },
};

export default leaderboardService;
