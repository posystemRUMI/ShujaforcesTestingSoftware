/**
 * Attempt Service — Production backend adapter for exam attempts
 * Bridges frozen frontend exam engine → Supabase RPCs
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 *
 * QUESTION LOADING CONTRACT:
 *  - Questions are always loaded from test_section_questions (persisted at test creation).
 *  - If saved IDs ≠ configured question_count, a blocking error is thrown.
 *  - No random selection, no padding from the full bank, no hardcoded defaults.
 *  - Session-only (localStorage-only) attempts are NOT created. If the DB fails, an error is thrown.
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Json } from '@/types/database.types';

// ============================================================================
// Types
// ============================================================================
export interface StartAttemptResult {
  attempt_id: string;
  attempt_number: number;
  started_at: string;
  expires_at: string;
  server_time: string;
  resumed: boolean;
}

export interface SafeExamPayload {
  attempt: {
    id: string;
    attempt_number: number;
    started_at: string;
    expires_at: string;
    status: string;
    current_section_id: string | null;
    question_order: Json;
    option_order: Json;
  };
  test: {
    id: string;
    name: string;
    description: string | null;
    course_name?: string;
    force_name?: string;
    duration_minutes: number;
    total_marks: number;
    passing_threshold: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    allow_section_navigation: boolean;
    show_result_immediately: boolean;
  };
  student: {
    id: string;
    roll_number: string;
  };
  sections: Array<{
    id: string;
    name: string;
    position: number;
    question_count: number;
    duration_minutes: number;
    marks_per_question: number;
    started_at: string | null;
    expires_at: string | null;
    completed_at: string | null;
    questions: Array<{
      id: string;
      code: string;
      stem: string;
      stem_image_url: string | null;
      subject_id: string;
      subject_code?: string;
      options: Array<{
        id: string;
        label: string;
        text: string;
        image_url: string | null;
      }>;
    }>;
  }>;
  saved_answers: Record<string, {
    selected_option_id: string | null;
    marked_for_review: boolean;
    answered_at: string;
  }>;
  server_time: string;
}

export interface SubmitResult {
  result_id: string;
  already_submitted: boolean;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  marks_obtained: number;
  max_marks: number;
  section_results?: Json;
  time_spent_seconds?: number;
}

export interface SectionAdvanceResult {
  section_id: string;
  started_at: string;
  expires_at: string;
  server_time: string;
}

export interface FamiliarizationQuestion {
  id: string;
  code: string;
  stem: string;
  stem_image_url: string | null;
  explanation: string | null;
  subject_name: string;
  options: Array<{
    id: string;
    label: string;
    text: string;
    image_url: string | null;
    is_correct: boolean;
  }>;
}

export interface FamiliarizationPayload {
  test_id: string;
  test_name: string;
  duration_seconds: number;
  question_count: number;
  is_practice_mode: boolean;
  questions: FamiliarizationQuestion[];
}

// ============================================================================
// Service
// ============================================================================
export const attemptService = {
  async getFamiliarizationPayload(testId: string): Promise<FamiliarizationPayload> {
    const { data, error } = await (supabase as any).rpc('get_familiarization_payload', {
      p_test_id: testId,
    });
    if (error) throw error;
    return data as unknown as FamiliarizationPayload;
  },

  async startAttempt(testId: string): Promise<StartAttemptResult> {
    const { data, error } = await (supabase as any).rpc('start_test_attempt', { p_test_id: testId });
    if (error) throw new Error(error.message);
    if (!data?.attempt_id) throw new Error('No saved attempt returned by the backend.');
    return data as StartAttemptResult;
  },

  async getSafeExamPayload(attemptId: string): Promise<SafeExamPayload> {
    const { data, error } = await (supabase as any).rpc('get_safe_exam_payload', { p_attempt_id: attemptId });
    if (error) throw new Error(error.message);
    if (!data?.attempt?.id || !data?.student?.id || !data?.server_time) throw new Error('Incomplete saved exam state returned by the backend.');
    return data as SafeExamPayload;
  },

  async saveAnswer(attemptId: string, questionId: string, selectedOptionId?: string, markedForReview?: boolean): Promise<boolean> {
    const { data, error } = await (supabase as any).rpc('save_answer', {
      p_attempt_id: attemptId, p_question_id: questionId,
      p_selected_option_id: selectedOptionId || null, p_marked_for_review: markedForReview ?? false,
    });
    if (error) throw new Error(error.message);
    if (data !== true) throw new Error('Answer was not saved.');
    return true;
  },

  async advanceSection(attemptId: string, nextSectionId: string): Promise<SectionAdvanceResult> {
    const { data, error } = await (supabase as any).rpc('advance_section', { p_attempt_id: attemptId, p_next_section_id: nextSectionId });
    if (error) throw new Error(error.message);
    if (!data?.expires_at || !data?.server_time) throw new Error('Saved section deadline missing.');
    return data as SectionAdvanceResult;
  },

  async submitAttempt(attemptId: string): Promise<SubmitResult> {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('submit_test_attempt', {
          p_attempt_id: attemptId,
        });
        if (!error && data) return data as unknown as SubmitResult;
        if (error) {
          throw new Error(error.message || 'Submission failed on server.');
        }
      } catch (rpcErr: any) {
        // Rethrow — do NOT fall back to client-side grading (would expose answer keys)
        throw new Error(
          rpcErr.message ||
          'Unable to submit your attempt. Please check your connection and try again, or contact your proctor.'
        );
      }
    }

    // Supabase not configured — cannot grade server-side
    throw new Error(
      'Examination system is not configured. Cannot submit attempt. Please contact your proctor.'
    );
  },

  async getServerTime(): Promise<string> {
    const { data, error } = await (supabase as any).rpc('get_server_time');
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Backend clock unavailable.');
    return data as string;
  },

  async getStudentAttempts(filters?: { studentId?: string; testId?: string }) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('test_attempts').select('*').order('started_at', { ascending: false });
    if (filters?.studentId) {
      let targetStudentId = filters.studentId;
      try {
        const { data: std } = await (supabase as any)
          .from('students')
          .select('id')
          .or(`id.eq.${targetStudentId},profile_id.eq.${targetStudentId}`)
          .maybeSingle();
        if (std?.id) targetStudentId = std.id;
      } catch {
        // use targetStudentId as-is
      }
      query = query.eq('student_id', targetStudentId);
    }
    if (filters?.testId) query = query.eq('test_id', filters.testId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async recordHeartbeat(attemptId: string, answeredCount: number, currentQuestionIndex: number, currentSectionName?: string): Promise<boolean> {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('record_heartbeat', {
          p_attempt_id: attemptId,
          p_answered_count: answeredCount,
          p_current_question_index: currentQuestionIndex,
          p_current_section_name: currentSectionName,
        });
        if (!error) return data as boolean;
      } catch {
        // ignore
      }
    }
    return true;
  },
};

export default attemptService;

