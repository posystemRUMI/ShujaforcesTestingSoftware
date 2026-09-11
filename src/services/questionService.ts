import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Question } from '@/types';

export const questionService = {
  async getQuestions(): Promise<Question[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('questions')
      .select(`
        *,
        subjects (
          id,
          code,
          name
        ),
        profiles:profiles!questions_author_id_fkey (
          display_name
        ),
        question_options (
          id,
          label,
          text,
          image_url,
          is_correct
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Failed to load questions from database:', error);
      return [];
    }

    return data.map((q: any) => {
      const subject = q.subjects as any;
      const profile = q.profiles as any;
      const opts = (q.question_options || []) as any[];
      const correctOpt = opts.find((o) => o.is_correct);

      return {
        id: q.id,
        code: q.code,
        subject_id: q.subject_id,
        subjectName: subject?.name || subject?.code || 'General',
        subject: (subject?.code || 'INTELLIGENCE_VERBAL') as any,
        branch: 'TRI_SERVICE',
        stem: q.stem,
        options: opts.map((o) => ({
          id: o.id,
          label: o.label as any,
          text: o.text,
          imageUrl: o.image_url || undefined,
        })),
        correctOptionId: correctOpt?.id || (opts[0]?.id ?? 'opt-a'),
        explanation: q.explanation || '',
        difficulty: q.difficulty as any,
        timeLimitSeconds: q.time_limit_seconds,
        status: (q.status === 'ARCHIVED' ? 'ARCHIVED' : q.status === 'APPROVED' ? 'APPROVED' : 'DRAFT') as any,
        imageUrl: q.stem_image_url || undefined,
        authorName: profile?.display_name || 'Faculty Officer',
        tags: q.tags || [],
        updatedAt: q.updated_at.split('T')[0],
      };
    });
  },

  async upsertQuestion(payload: {
    id?: string;
    code: string;
    subjectId: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    stem: string;
    stemImageUrl?: string;
    explanation?: string;
    timeLimitSeconds: number;
    status: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED';
    tags: string[];
    courseIds: string[];
    options: Array<{
      option_key: string;
      label: string;
      text: string;
      image_url?: string;
      is_correct: boolean;
    }>;
  }): Promise<string> {
    if (!isSupabaseConfigured()) {
      return payload.id || 'mock-qid';
    }

    const { data, error } = await (supabase as any).rpc('admin_upsert_question', {
      p_id: payload.id,
      p_code: payload.code,
      p_subject_id: payload.subjectId,
      p_difficulty: payload.difficulty,
      p_stem: payload.stem,
      p_stem_image_url: payload.stemImageUrl,
      p_explanation: payload.explanation,
      p_time_limit_seconds: payload.timeLimitSeconds,
      p_status: payload.status,
      p_tags: payload.tags,
      p_course_ids: payload.courseIds,
      p_options: payload.options as any,
    });

    if (error) throw new Error(error.message);
    return data;
  },
};
