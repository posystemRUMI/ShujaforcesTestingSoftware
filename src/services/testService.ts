/**
 * Test Service — Production backend adapter for test management
 * Bridges frozen frontend UI → Supabase RPCs
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';

// ============================================================================
// Types (matching frozen frontend contracts)
// ============================================================================
export interface TestRecord {
  id: string;
  name: string;
  description: string | null;
  force_id: string;
  course_id: string;
  batch_id: string | null;
  passing_threshold: number;
  total_marks: number;
  duration_minutes: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  allow_section_navigation: boolean;
  show_result_immediately: boolean;
  show_answer_review: boolean;
  negative_marking: boolean;
  negative_mark_value: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestSectionRecord {
  id: string;
  test_id: string;
  name: string;
  position: number;
  question_count: number;
  duration_minutes: number;
  subject_id: string | null;
  marks_per_question: number;
  shuffle_questions: boolean;
}

export interface TestAssignmentRecord {
  id: string;
  test_id: string;
  batch_id: string;
  assigned_by: string;
  available_from: string;
  available_until: string | null;
  max_attempts: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
}

// ============================================================================
// Service Methods
// ============================================================================

export const testService = {
  // --- Tests CRUD ---
  async getTests() {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as TestRecord[];
  },

  async getTestById(id: string) {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as TestRecord;
  },

  async createTest(test: Partial<TestRecord>) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await (supabase as any)
      .from('tests')
      .insert(test)
      .select()
      .single();
    if (error) throw error;
    return data as TestRecord;
  },

  async updateTest(id: string, updates: Partial<TestRecord>) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await (supabase as any)
      .from('tests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TestRecord;
  },

  // --- Sections ---
  async getSections(testId: string) {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('test_sections')
      .select('*')
      .eq('test_id', testId)
      .order('position');
    if (error) throw error;
    return (data || []) as TestSectionRecord[];
  },

  async createSection(section: Partial<TestSectionRecord>) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await (supabase as any)
      .from('test_sections')
      .insert(section)
      .select()
      .single();
    if (error) throw error;
    return data as TestSectionRecord;
  },

  async updateSection(id: string, updates: Partial<TestSectionRecord>) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await (supabase as any)
      .from('test_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TestSectionRecord;
  },

  async deleteSection(id: string) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await supabase.from('test_sections').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Question Composition ---
  async generateSectionQuestions(sectionId: string, subjectId: string, count: number, forceId?: string, courseId?: string) {
    const { data, error } = await (supabase as any).rpc('generate_test_section_questions', {
      p_section_id: sectionId,
      p_subject_id: subjectId,
      p_count: count,
      p_force_id: forceId,
      p_course_id: courseId,
    });
    if (error) throw error;
    return data as number;
  },

  async addQuestionToSection(sectionId: string, questionId: string, position?: number, marks?: number) {
    const { data, error } = await (supabase as any).rpc('add_question_to_section', {
      p_section_id: sectionId,
      p_question_id: questionId,
      p_position: position,
      p_marks: marks,
    });
    if (error) throw error;
    return data as string;
  },

  async removeQuestionFromSection(sectionId: string, questionId: string) {
    const { data, error } = await (supabase as any).rpc('remove_question_from_section', {
      p_section_id: sectionId,
      p_question_id: questionId,
    });
    if (error) throw error;
    return data as boolean;
  },

  // --- Publishing & Assignment ---
  async publishTest(testId: string) {
    const { data, error } = await (supabase as any).rpc('publish_test', { p_test_id: testId });
    if (error) throw error;
    return data as boolean;
  },

  async assignTest(testId: string, batchId: string, availableFrom?: string, availableUntil?: string, maxAttempts?: number, notes?: string) {
    const { data, error } = await (supabase as any).rpc('assign_test', {
      p_test_id: testId,
      p_batch_id: batchId,
      p_available_from: availableFrom,
      p_available_until: availableUntil,
      p_max_attempts: maxAttempts,
      p_notes: notes,
    });
    if (error) throw error;
    return data as string;
  },

  async getAssignments(testId?: string) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('test_assignments').select('*').order('created_at', { ascending: false });
    if (testId) query = query.eq('test_id', testId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TestAssignmentRecord[];
  },
};

export default testService;
