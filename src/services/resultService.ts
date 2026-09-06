/**
 * Result Service — Production backend adapter for results & answer review
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Json } from '@/types/database.types';

// ============================================================================
// Types
// ============================================================================
export interface ResultRecord {
  id: string;
  attempt_id: string;
  student_id: string;
  test_id: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  passed: boolean;
  section_results: Json;
  stanine: number | null;
  time_spent_seconds: number | null;
  generated_at: string;
}

export interface ResultDetailResponse {
  result: ResultRecord;
  test: {
    id: string;
    name: string;
    passing_threshold: number;
  };
  student: {
    id: string;
    roll_number: string;
  };
  sections: Array<{
    section_id: string;
    section_name: string;
    questions: Array<{
      question_id: string;
      code: string;
      stem: string;
      stem_image_url: string | null;
      explanation: string | null;
      subject_id: string;
      marks: number;
      selected_option_id: string | null;
      marked_for_review: boolean;
      options: Array<{
        id: string;
        label: string;
        text: string;
        image_url: string | null;
        is_correct: boolean; // Only available post-submission in review
      }>;
      status: 'correct' | 'incorrect' | 'skipped';
    }>;
  }>;
  answer_review_enabled: boolean;
}

// ============================================================================
// Service
// ============================================================================
export const resultService = {
  async getResults(filters?: { studentId?: string; testId?: string }) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('test_results').select('*').order('generated_at', { ascending: false });
    if (filters?.studentId) query = query.eq('student_id', filters.studentId);
    if (filters?.testId) query = query.eq('test_id', filters.testId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ResultRecord[];
  },

  async getResultById(id: string) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as ResultRecord;
  },

  async getResultDetail(resultId: string): Promise<ResultDetailResponse> {
    const { data, error } = await (supabase as any).rpc('get_result_detail', {
      p_result_id: resultId,
    });
    if (error) throw error;
    return data as unknown as ResultDetailResponse;
  },

  async getResultByAttemptId(attemptId: string) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('attempt_id', attemptId)
      .single();
    if (error) throw error;
    return data as ResultRecord;
  },
};

export default resultService;
