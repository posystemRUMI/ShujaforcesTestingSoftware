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

      if (!error && data && data.leaders && data.leaders.length > 0) {
        return {
          leaders: data.leaders,
          current_student: data.current_student || null,
          total_participants: Number(data.total_participants || 0),
        };
      }
    } catch (err) {
      console.warn('RPC get_test_leaderboard error, using direct table fallback:', err);
    }

    // Direct table fallback for test leaderboard
    try {
      const { data: results, error: resErr } = await (supabase as any)
        .from('test_results')
        .select(`
          id,
          percentage,
          marks_obtained,
          max_marks,
          correct_count,
          total_questions,
          passed,
          generated_at,
          students (
            id,
            roll_number,
            profile_id,
            forces ( name ),
            courses ( name ),
            profiles:profiles!students_profile_id_fkey ( display_name )
          )
        `)
        .eq('test_id', testId)
        .order('percentage', { ascending: false })
        .limit(limit);

      if (resErr || !results || results.length === 0) {
        return { leaders: [], current_student: null, total_participants: 0 };
      }

      const leadersList: LeaderboardEntry[] = results.map((r: any, idx: number) => {
        const std = r.students;
        return {
          rank: idx + 1,
          student_id: std?.id || r.student_id,
          roll_number: std?.roll_number || 'CADET',
          student_name: std?.profiles?.display_name || std?.roll_number || 'Cadet Officer',
          batch_id: null,
          batch_name: 'Active Batch',
          course_id: null,
          course_name: std?.courses?.name || 'Official Course',
          force_id: null,
          force_name: std?.forces?.name || 'Pakistan Armed Forces',
          tests_completed: 1,
          percentage: r.percentage || 0,
          best_percentage: r.percentage || 0,
          score: r.marks_obtained || 0,
          passed: r.passed,
          is_current_user: false,
        };
      });

      return {
        leaders: leadersList,
        current_student: leadersList[0] || null,
        total_participants: results.length,
      };
    } catch (e) {
      console.warn('Direct test leaderboard fallback failed:', e);
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

      if (!error && data && data.leaders && data.leaders.length > 0) {
        return {
          leaders: data.leaders,
          current_student: data.current_student || null,
          total_participants: Number(data.total_participants || 0),
        };
      }
    } catch (err) {
      console.warn('RPC get_course_leaderboard error, using academy fallback:', err);
    }

    return this.getAcademyLeaderboard({ courseId, batchId, limit });
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

      if (!error && data && data.leaders && data.leaders.length > 0) {
        return {
          leaders: data.leaders,
          current_student: data.current_student || null,
          total_participants: Number(data.total_participants || 0),
        };
      }
    } catch (err) {
      console.warn('RPC get_academy_leaderboard error, using direct table fallback:', err);
    }

    // Direct table fallback: query test_results
    try {
      const { data: results, error: resErr } = await (supabase as any)
        .from('test_results')
        .select(`
          id,
          percentage,
          marks_obtained,
          max_marks,
          correct_count,
          total_questions,
          passed,
          generated_at,
          students (
            id,
            roll_number,
            profile_id,
            forces ( name ),
            courses ( name ),
            profiles:profiles!students_profile_id_fkey ( display_name )
          )
        `)
        .order('percentage', { ascending: false });

      if (resErr || !results || results.length === 0) {
        return { leaders: [], current_student: null, total_participants: 0 };
      }

      const studentMap = new Map<string, any>();
      for (const r of results) {
        const std = r.students;
        if (!std) continue;
        const sId = std.id;
        const sName = std.profiles?.display_name || std.roll_number || 'Cadet';
        const forceName = std.forces?.name || 'Pakistan Armed Forces';
        const courseName = std.courses?.name || 'Standard Course';

        if (!studentMap.has(sId)) {
          studentMap.set(sId, {
            student_id: sId,
            roll_number: std.roll_number || 'CADET',
            student_name: sName,
            batch_id: null,
            batch_name: 'Active Batch',
            course_id: null,
            course_name: courseName,
            force_id: null,
            force_name: forceName,
            tests_completed: 1,
            total_marks_obtained: r.marks_obtained || 0,
            total_marks_possible: r.max_marks || 100,
            aggregate_percentage: r.percentage || 0,
            average_percentage: r.percentage || 0,
            best_percentage: r.percentage || 0,
            score: r.marks_obtained || 0,
            percentage: r.percentage || 0,
            passed: r.passed,
            is_current_user: false,
          });
        }
      }

      const leadersList: LeaderboardEntry[] = Array.from(studentMap.values())
        .sort((a, b) => b.best_percentage - a.best_percentage)
        .slice(0, filters?.limit || 40)
        .map((entry, idx) => ({
          ...entry,
          rank: idx + 1,
        }));

      return {
        leaders: leadersList,
        current_student: leadersList[0] || null,
        total_participants: studentMap.size,
      };
    } catch (fallbackErr) {
      console.warn('Leaderboard table query fallback error:', fallbackErr);
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
