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
  async getTestLeaderboard(
    testId: string,
    limit = 40,
    filters?: { forceId?: string | null; courseId?: string | null }
  ): Promise<LeaderboardResponse> {
    if (!isSupabaseConfigured() || !testId) {
      return { leaders: [], current_student: null, total_participants: 0 };
    }

    try {
      const { data, error } = await (supabase as any).rpc('get_test_leaderboard', {
        p_test_id: testId,
        p_limit: limit,
      });

      if (!error && data && Array.isArray(data.leaders)) {
        let leaders: LeaderboardEntry[] = data.leaders;
        if (filters?.forceId) {
          leaders = leaders.filter(
            (l) =>
              l.force_id === filters.forceId ||
              (l.force_name && l.force_name.toLowerCase().includes(filters.forceId!.toLowerCase()))
          );
        }
        if (filters?.courseId) {
          leaders = leaders.filter(
            (l) =>
              l.course_id === filters.courseId ||
              (l.course_name && l.course_name.toLowerCase().includes(filters.courseId!.toLowerCase()))
          );
        }
        leaders = leaders.map((l, idx) => ({ ...l, rank: idx + 1 }));
        return {
          leaders,
          current_student: data.current_student || null,
          total_participants: leaders.length,
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
          students:students!test_results_student_id_fkey (
            id,
            roll_number,
            profile_id,
            target_force_id,
            target_course_id,
            forces:forces!students_target_force_id_fkey ( id, name, code ),
            courses:courses!students_target_course_id_fkey ( id, name, code ),
            profiles:profiles!students_profile_id_fkey ( display_name )
          )
        `)
        .eq('test_id', testId)
        .order('percentage', { ascending: false });

      if (resErr || !results || results.length === 0) {
        return { leaders: [], current_student: null, total_participants: 0 };
      }

      const filteredResults = results.filter((r: any) => {
        const std = r.students;
        if (!std) return false;

        if (filters?.forceId) {
          const forceMatch =
            std.target_force_id === filters.forceId ||
            std.forces?.id === filters.forceId ||
            std.forces?.code === filters.forceId;
          if (!forceMatch) return false;
        }

        if (filters?.courseId) {
          const courseMatch =
            std.target_course_id === filters.courseId ||
            std.courses?.id === filters.courseId ||
            std.courses?.code === filters.courseId;
          if (!courseMatch) return false;
        }

        return true;
      });

      if (filteredResults.length === 0) {
        return { leaders: [], current_student: null, total_participants: 0 };
      }

      const leadersList: LeaderboardEntry[] = filteredResults.slice(0, limit).map((r: any, idx: number) => {
        const std = r.students;
        return {
          rank: idx + 1,
          student_id: std?.id || r.student_id,
          roll_number: std?.roll_number || 'CADET',
          student_name: std?.profiles?.display_name || std?.roll_number || 'Cadet Officer',
          batch_id: null,
          batch_name: 'Active Batch',
          course_id: std?.target_course_id || std?.courses?.id || null,
          course_name: std?.courses?.name || 'Official Course',
          force_id: std?.target_force_id || std?.forces?.id || null,
          force_name: std?.forces?.name || 'Pakistan Armed Forces',
          tests_completed: 1,
          percentage: r.percentage || 0,
          best_percentage: r.percentage || 0,
          score: r.marks_obtained || 0,
          total_marks: r.max_marks || 100,
          passed: r.passed,
          is_current_user: false,
        };
      });

      return {
        leaders: leadersList,
        current_student: leadersList[0] || null,
        total_participants: filteredResults.length,
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
    minTests = 1,
    forceId?: string | null
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

      if (!error && data && Array.isArray(data.leaders)) {
        let leaders: LeaderboardEntry[] = data.leaders;
        if (forceId) {
          leaders = leaders.filter(
            (l) =>
              l.force_id === forceId ||
              (l.force_name && l.force_name.toLowerCase().includes(forceId.toLowerCase()))
          );
        }
        leaders = leaders.map((l, idx) => ({ ...l, rank: idx + 1 }));
        return {
          leaders,
          current_student: data.current_student || null,
          total_participants: leaders.length,
        };
      }
    } catch (err) {
      console.warn('RPC get_course_leaderboard error, using academy fallback:', err);
    }

    return this.getAcademyLeaderboard({ courseId, batchId, limit, forceId });
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

      if (!error && data && Array.isArray(data.leaders)) {
        let leaders: LeaderboardEntry[] = data.leaders;
        if (filters?.forceId) {
          leaders = leaders.filter(
            (l) =>
              l.force_id === filters.forceId ||
              (l.force_name && l.force_name.toLowerCase().includes(filters.forceId!.toLowerCase()))
          );
        }
        if (filters?.courseId) {
          leaders = leaders.filter(
            (l) =>
              l.course_id === filters.courseId ||
              (l.course_name && l.course_name.toLowerCase().includes(filters.courseId!.toLowerCase()))
          );
        }
        leaders = leaders.map((l, idx) => ({ ...l, rank: idx + 1 }));
        return {
          leaders,
          current_student: data.current_student || null,
          total_participants: leaders.length,
        };
      }
    } catch (err) {
      console.warn('RPC get_academy_leaderboard error, using direct table fallback:', err);
    }

    // Direct table fallback: query test_results
    try {
      let query = (supabase as any)
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
          test_id,
          students:students!test_results_student_id_fkey (
            id,
            roll_number,
            profile_id,
            target_force_id,
            target_course_id,
            forces:forces!students_target_force_id_fkey ( id, name, code ),
            courses:courses!students_target_course_id_fkey ( id, name, code ),
            profiles:profiles!students_profile_id_fkey ( display_name )
          )
        `);

      if (filters?.testId) {
        query = query.eq('test_id', filters.testId);
      }

      const { data: results, error: resErr } = await query.order('percentage', { ascending: false });

      if (resErr || !results || results.length === 0) {
        return { leaders: [], current_student: null, total_participants: 0 };
      }

      const filteredResults = results.filter((r: any) => {
        const std = r.students;
        if (!std) return false;

        if (filters?.forceId) {
          const forceMatch =
            std.target_force_id === filters.forceId ||
            std.forces?.id === filters.forceId ||
            std.forces?.code === filters.forceId;
          if (!forceMatch) return false;
        }

        if (filters?.courseId) {
          const courseMatch =
            std.target_course_id === filters.courseId ||
            std.courses?.id === filters.courseId ||
            std.courses?.code === filters.courseId;
          if (!courseMatch) return false;
        }

        return true;
      });

      if (filteredResults.length === 0) {
        return { leaders: [], current_student: null, total_participants: 0 };
      }

      const studentMap = new Map<string, any>();
      for (const r of filteredResults) {
        const std = r.students;
        if (!std) continue;
        const sId = std.id;
        const sName = std.profiles?.display_name || std.roll_number || 'Cadet';
        const forceId = std.target_force_id || std.forces?.id || null;
        const forceName = std.forces?.name || 'Pakistan Armed Forces';
        const courseId = std.target_course_id || std.courses?.id || null;
        const courseName = std.courses?.name || 'Standard Course';

        if (!studentMap.has(sId)) {
          studentMap.set(sId, {
            student_id: sId,
            roll_number: std.roll_number || 'CADET',
            student_name: sName,
            batch_id: null,
            batch_name: 'Active Batch',
            course_id: courseId,
            course_name: courseName,
            force_id: forceId,
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
            _attempts: [r],
          });
        } else {
          const existing = studentMap.get(sId);
          existing.tests_completed += 1;
          existing.total_marks_obtained += (r.marks_obtained || 0);
          existing.total_marks_possible += (r.max_marks || 100);
          existing.best_percentage = Math.max(existing.best_percentage, r.percentage || 0);
          existing._attempts.push(r);
          const sumPercentages = existing._attempts.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
          existing.average_percentage = Math.round((sumPercentages / existing._attempts.length) * 100) / 100;
          existing.aggregate_percentage = existing.total_marks_possible > 0
            ? Math.round((existing.total_marks_obtained / existing.total_marks_possible) * 10000) / 100
            : 0;
        }
      }

      const leadersList: LeaderboardEntry[] = Array.from(studentMap.values())
        .sort((a, b) => b.aggregate_percentage - a.aggregate_percentage || b.best_percentage - a.best_percentage)
        .slice(0, filters?.limit || 40)
        .map((entry, idx) => {
          const { _attempts, ...cleanEntry } = entry;
          return {
            ...cleanEntry,
            rank: idx + 1,
          };
        });

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
      ? await this.getTestLeaderboard(filters.testId, 200, {
          forceId: filters.forceId,
          courseId: filters.courseId,
        })
      : filters?.courseId
      ? await this.getCourseLeaderboard(filters.courseId, filters.batchId, 200, 1, filters.forceId)
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
