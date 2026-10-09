import { TablesInsert, TablesUpdate } from '@/types/database.types';
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
  eligibilities?: Array<{ force_id: string; course_id: string }>;
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
  template_id?: string | null;
  template_version?: number | null;
  test_type?: string;
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
  section_code?: string | null;
  source_template_section_id?: string | null;
  is_mandatory?: boolean | null;
  passing_percentage?: number | null;
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
  async getStudentAssignedTests(studentId: string) {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase.rpc('get_student_assigned_tests', { p_student_id: studentId });
    if (error) { console.warn('Failed to get student assigned tests', error); return []; }
    return data || [];
  },

  async getTestEligibilities(testId: string) {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('test_eligible_courses')
      .select('force_id, course_id')
      .eq('test_id', testId);
    if (error) throw error;
    return data || [];
  },

  async getTests() {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('tests')
      .select('*, eligibilities:test_eligible_courses(force_id,course_id)')
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
    return data;
  },

  async createTest(test: Partial<TestRecord>, eligibilities: Array<{force_id: string, course_id: string}> = []) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    
    // Call the RPC
    const { data, error } = await supabase.rpc('create_test_with_eligibilities', {
      p_test: test,
      p_eligibilities: eligibilities
    });
    
    if (error) throw error;
    return data;
  },

  async updateTest(id: string, updates: Partial<TestRecord>) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('tests')
      .update(updates as TablesUpdate<'tests'>)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('test_sections')
      .insert(section as TablesInsert<'test_sections'>)
      .select()
      .single();
    if (error) throw error;
    return data as TestSectionRecord;
  },

  async updateSection(id: string, updates: Partial<TestSectionRecord>) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('test_sections')
      .update(updates as TablesUpdate<'test_sections'>)
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
    const { data, error } = await supabase.rpc('generate_test_section_questions', {
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
    const { data, error } = await supabase.rpc('add_question_to_section', {
      p_section_id: sectionId,
      p_question_id: questionId,
      p_position: position,
      p_marks: marks,
    });
    if (error) throw error;
    return data as string;
  },

  async removeQuestionFromSection(sectionId: string, questionId: string) {
    const { data, error } = await supabase.rpc('remove_question_from_section', {
      p_section_id: sectionId,
      p_question_id: questionId,
    });
    if (error) throw error;
    return data as boolean;
  },

  async publishTest(testId: string) {
    const { data, error } = await supabase.rpc('publish_test', { p_test_id: testId });
    if (error) throw error;
    return data as boolean;
  },

  async assignTest(testId: string, batchId: string, availableFrom?: string, availableUntil?: string, maxAttempts?: number, notes?: string) {
    const { data, error } = await supabase.rpc('assign_test', {
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

  async compileTestFromPattern(payload: UpsertTestPayload): Promise<TestRecord> {
    return this.upsertTest(payload);
  },

  /**
   * Fetch full test details including eligibilities, sections, and exact assigned questions.
   * Used by Test Builder when editing an existing test.
   */
  async getTestWithFullDetails(testId: string): Promise<FullTestDetails | null> {
    if (!isSupabaseConfigured() || !testId) return null;

    const [testRes, eligRes, sectionsRes] = await Promise.all([
      supabase.from('tests').select('*').eq('id', testId).single(),
      supabase.from('test_eligible_courses').select('force_id, course_id').eq('test_id', testId),
      supabase.from('test_sections').select('*, test_section_subjects(subjects(id,code,name))').eq('test_id', testId).order('position', { ascending: true }),
    ]);

    if (testRes.error || !testRes.data) return null;

    const sections = (sectionsRes.data || []) as TestSectionRecord[];
    const sectionIds = sections.map((s) => s.id);

    let tsqRows: Array<{ test_section_id: string; question_id: string; position: number }> = [];
    if (sectionIds.length > 0) {
      const { data } = await supabase
        .from('test_section_questions')
        .select('test_section_id, question_id, position')
        .in('test_section_id', sectionIds)
        .order('position', { ascending: true });
      tsqRows = data || [];
    }

    const qMap = new Map<string, string[]>();
    for (const row of tsqRows) {
      if (!qMap.has(row.test_section_id)) {
        qMap.set(row.test_section_id, []);
      }
      qMap.get(row.test_section_id)!.push(row.question_id);
    }

    const fullSections: FullTestSectionDetails[] = sections.map((s) => ({
      ...s,
      question_ids: qMap.get(s.id) || [],
      subjects: ((s as any).test_section_subjects || []).map((m: any) => m.subjects).filter(Boolean),
    }));

    return {
      test: testRes.data as TestRecord,
      eligibilities: eligRes.data || [],
      sections: fullSections,
    };
  },

  /**
   * Unified upsert for tests.
   * If testId is provided, updates the existing test in-place (no duplicate created).
   * If testId is omitted, creates a new test.
   * Enforces exact question count validation and atomic section/question synchronization.
   */
  async upsertTest(payload: UpsertTestPayload): Promise<TestRecord> {
    if (!isSupabaseConfigured()) throw new Error('Database connection required.');
    for (const sec of payload.sections) {
      if (sec.question_ids.length !== sec.question_count || new Set(sec.question_ids).size !== sec.question_count) {
        throw new Error('Each section requires exactly its configured number of unique questions.');
      }
    }
    const { data, error } = await (supabase as any).rpc('save_test_blueprint', { p_payload: payload });
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error('Backend did not save the test.');
    return data as TestRecord;
  },
};

export interface FullTestSectionDetails extends TestSectionRecord {
  subjects: Array<{ id: string; code: string; name: string }>;
  question_ids: string[];
}

export interface FullTestDetails {
  test: TestRecord;
  eligibilities: Array<{ force_id: string; course_id: string }>;
  sections: FullTestSectionDetails[];
}

export interface UpsertTestPayload {
  testId?: string | null;
  eligibilities?: Array<{ force_id: string; course_id: string }>;
  test: Partial<TestRecord>;
  sections: Array<{
    id?: string;
    name: string;
    section_code?: string;
    source_template_section_id?: string;
    position: number;
    question_count: number;
    duration_minutes: number;
    subject_id?: string | null;
    subject_ids?: string[];
    is_mandatory?: boolean;
    passing_percentage?: number;
    question_ids: string[];
  }>;
  batchId?: string;
  autoGenerateQuestions?: boolean;
}

export default testService;

