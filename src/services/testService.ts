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

  // --- Publishing & Assignment ---
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

  async compileTestFromPattern(payload: { eligibilities?: Array<{force_id: string, course_id: string}>; 
    test: Partial<TestRecord>;
    sections: Array<{
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
      question_ids?: string[];
    }>;
    batchId?: string;
    autoGenerateQuestions?: boolean;
  }): Promise<TestRecord> {
    if (!isSupabaseConfigured()) {
      const mockTest: TestRecord = {
        id: `test-${Date.now()}`,
        name: payload.test.name || 'Sample Test',
        description: payload.test.description || null,
        force_id: payload.test.force_id || '',
        course_id: payload.test.course_id || '',
        batch_id: payload.batchId || payload.test.batch_id || null,
        passing_threshold: payload.test.passing_threshold || 50,
        total_marks: payload.sections.reduce((acc, s) => acc + s.question_count, 0),
        duration_minutes: payload.sections.reduce((acc, s) => acc + s.duration_minutes, 0),
        shuffle_questions: payload.test.shuffle_questions ?? true,
        shuffle_options: payload.test.shuffle_options ?? true,
        allow_section_navigation: payload.test.allow_section_navigation ?? false,
        show_result_immediately: payload.test.show_result_immediately ?? true,
        show_answer_review: payload.test.show_answer_review ?? true,
        negative_marking: payload.test.negative_marking ?? false,
        negative_mark_value: payload.test.negative_mark_value ?? 0,
        status: 'PUBLISHED',
        created_by: null,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockTest;
    }

    // 1. Insert Test with sanitized UUIDs
    const testData = {
      ...payload.test,
      batch_id: payload.batchId || payload.test.batch_id || null,
      template_id: payload.test.template_id || undefined,
      total_marks: payload.sections.reduce((acc, s) => acc + s.question_count, 0),
      duration_minutes: payload.sections.reduce((acc, s) => acc + s.duration_minutes, 0),
      status: 'DRAFT',
    };

    const { data: createdTest, error: testError } = await supabase.rpc('create_test_with_eligibilities', {
      p_test: testData,
      p_eligibilities: payload.eligibilities || []
    });

    if (testError || !createdTest) throw testError || new Error('Failed to create test docket');

    // 2. Insert Sections
    for (const sec of payload.sections) {
      const { data: createdSec, error: secError } = await supabase
        .from('test_sections')
        .insert({
          test_id: createdTest.id,
          name: sec.name,
          position: sec.position,
          question_count: sec.question_count,
          duration_minutes: sec.duration_minutes,
          subject_id: sec.subject_id || null,
          section_code: sec.section_code || null,
          source_template_section_id: sec.source_template_section_id || null,
          passing_percentage: sec.passing_percentage || 50,
          is_mandatory: sec.is_mandatory ?? false,
        })
        .select()
        .single();

      if (secError || !createdSec) throw secError || new Error(`Failed to create section ${sec.name}`);

      // Optional subject mappings
      if (sec.subject_ids && sec.subject_ids.length > 0) {
        const uniqueSubjectIds = Array.from(new Set(sec.subject_ids.filter(Boolean)));
        for (const subId of uniqueSubjectIds) {
          try {
            await supabase
              .from('test_section_subjects')
              .insert({ test_section_id: createdSec.id, subject_id: subId });
          } catch (subErr) {
            console.warn('Notice attaching section subject:', subErr);
          }
        }
      }

      // Manual questions assignment if provided
      if (sec.question_ids && sec.question_ids.length > 0) {
        const rows = sec.question_ids.map((qId, qIdx) => ({
          test_section_id: createdSec.id,
          question_id: qId,
          position: qIdx + 1,
        }));
        try {
          await supabase.from('test_section_questions').insert(rows);
        } catch (mErr) {
          console.warn('Notice attaching manual questions:', mErr);
        }
      }

      // Auto-generate questions if requested and subject is defined
      const targetSubjectId = sec.subject_id || (sec.subject_ids && sec.subject_ids[0]);
      if (payload.autoGenerateQuestions && targetSubjectId && (!sec.question_ids || sec.question_ids.length === 0)) {
        try {
          const { data: genCount } = await supabase.rpc('generate_test_section_questions', {
            p_section_id: createdSec.id,
            p_subject_id: targetSubjectId,
            p_count: sec.question_count,
            p_force_id: payload.test.force_id,
            p_course_id: payload.test.course_id,
          });

          // Fallback if course filter was too restrictive
          if ((!genCount || genCount === 0) && (payload.test.course_id || payload.test.force_id)) {
            await supabase.rpc('generate_test_section_questions', {
              p_section_id: createdSec.id,
              p_subject_id: targetSubjectId,
              p_count: sec.question_count,
              p_force_id: undefined,
              p_course_id: undefined,
            });
          }
        } catch (genErr) {
          console.warn('Auto-generation notice for section:', sec.name, genErr);
        }
      }
    }

    return createdTest;
  },
};

export default testService;
