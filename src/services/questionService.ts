import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Question } from '@/types';
export interface BankFilters { forceId?: string; courseId?: string; bank?: string; subjectId?: string; search?: string; status?: string; page?: number; pageSize?: number; }
export interface BankCatalog {
  total: number; active: number; inactive: number; verbal: number; non_verbal: number; academic: number;
  academic_courses: Array<{ id: string; code: string; name: string; total: number; active: number; inactive: number }>;
  subjects: Array<{ id: string; code: string; name: string; total: number }>;
  questions: Question[];
}
function mapQuestion(q: any): Question {
  const options = q.question_options || [];
  return {
    id: q.id, code: q.code, subject_id: q.subject_id, subject: q.subject_code,
    subjectName: q.subject_name, bankKey: q.bank_key,
    branch: ['v', 'nv'].includes(q.bank_key) ? 'TRI_SERVICE' : q.bank_key?.startsWith('PN-') ? 'PAKISTAN_NAVY' : q.bank_key?.startsWith('PAF-') ? 'PAKISTAN_AIR_FORCE' : 'PAKISTAN_ARMY',
    courseIds: (q.question_courses || []).map((m: any) => m.course_id),
    stem: q.stem, sourceLabel: q.source_label || undefined,
    sourceCourse: q.source_course || undefined, sourceType: q.source_type || undefined,
    options: options.map((o: any) => ({ id: o.id, label: o.label, text: o.text, imageUrl: o.image_url || undefined })),
    correctOptionId: options.find((o: any) => o.is_correct)?.id || '',
    explanation: q.explanation, difficulty: q.difficulty,
    timeLimitSeconds: q.time_limit_seconds, status: q.status,
    imageUrl: q.stem_image_url || undefined, authorName: q.author_name || 'Faculty Officer',
    tags: q.tags || [], updatedAt: q.updated_at?.split('T')[0] || '',
  };
}
export const questionService = {
  async getCatalog(filters: BankFilters = {}): Promise<BankCatalog> {
    if (!isSupabaseConfigured()) throw new Error('Database connection is required.');
    const { data, error } = await (supabase as any).rpc('get_staff_question_bank', {
      p_force_id: filters.forceId || null, p_course_id: filters.courseId || null,
      p_bank: filters.bank || null, p_subject_id: filters.subjectId || null,
      p_search: filters.search || '', p_status: filters.status || 'ALL',
      p_page: filters.page || 1, p_page_size: filters.pageSize || 50,
    });
    if (error) throw error;
    return { ...data, questions: data.questions.map(mapQuestion) };
  },
  async getTaxonomy(): Promise<{ forces: Array<{ id: string; name: string }>; courses: Array<{ id: string; name: string; code: string; force_id: string }>; subjects: Array<{ id: string; name: string; code: string; category: string }> }> {
    const responses = await Promise.all([
      supabase.from('forces').select('id,name').order('sort_order'),
      supabase.from('courses').select('id,name,code,force_id').eq('status', 'ACTIVE').order('sort_order'),
      supabase.from('subjects').select('id,name,code,category').order('sort_order'),
    ]);
    for (const response of responses) if (response.error) throw response.error;
    return { forces: responses[0].data || [], courses: responses[1].data || [], subjects: responses[2].data || [] };
  },
  async getQuestions(): Promise<Question[]> {
    const questions: Question[] = [];
    for (let page = 1; ; page++) {
      const data = await this.getCatalog({ page, pageSize: 100 });
      questions.push(...data.questions);
      if (questions.length >= data.total) return questions;
    }
  },
  async archiveQuestions(ids: string[]) {
    const { error } = await supabase.from('questions').update({ status: 'INACTIVE' }).in('id', ids);
    if (error) throw error;
  },
  async upsertQuestion(payload: {
    id?: string; code: string; subjectId: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    stem: string; stemImageUrl?: string; explanation?: string; timeLimitSeconds: number;
    status: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED'; tags: string[]; courseIds: string[];
    options: Array<{ option_key: string; label: string; text: string; image_url?: string; is_correct: boolean }>;
  }): Promise<string> {
    if (!isSupabaseConfigured()) throw new Error('Database connection is required.');
    let subjectId = payload.subjectId;
    if (!/^[0-9a-f-]{36}$/i.test(subjectId)) {
      const { data, error } = await supabase.from('subjects').select('id').eq('code', subjectId).single();
      if (error) throw error;
      subjectId = data.id;
    }
    const { data, error } = await (supabase as any).rpc('admin_upsert_question', {
      p_id: payload.id || null, p_code: payload.code, p_subject_id: subjectId,
      p_difficulty: payload.difficulty, p_stem: payload.stem,
      p_stem_image_url: payload.stemImageUrl || null, p_explanation: payload.explanation || null,
      p_time_limit_seconds: payload.timeLimitSeconds, p_status: payload.status,
      p_tags: payload.tags, p_course_ids: payload.courseIds, p_options: payload.options,
    });
    if (error) throw error;
    return data;
  },
};
