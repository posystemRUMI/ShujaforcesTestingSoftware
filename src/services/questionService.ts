import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Question } from '@/types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function resolveSubjectUuid(subjectIdOrCode?: string | null): Promise<string | null> {
  if (!subjectIdOrCode) return null;
  if (UUID_REGEX.test(subjectIdOrCode)) {
    return subjectIdOrCode;
  }

  if (!isSupabaseConfigured()) return null;

  try {
    // 1. Try exact code match
    const { data: codeMatch } = await (supabase as any)
      .from('subjects')
      .select('id')
      .eq('code', subjectIdOrCode)
      .maybeSingle();

    if (codeMatch?.id) return codeMatch.id;

    // 2. Search by key terms
    const searchTerms: string[] = [];
    if (subjectIdOrCode.includes('NON_VERBAL') || subjectIdOrCode.includes('NON-VERBAL')) {
      searchTerms.push('Non-Verbal', 'INTELLIGENCE_NON_VERBAL');
    } else if (subjectIdOrCode.includes('VERBAL')) {
      searchTerms.push('Verbal', 'INTELLIGENCE_VERBAL');
    } else if (subjectIdOrCode.includes('PHYSICS')) {
      searchTerms.push('Physics', 'PHYSICS');
    } else if (subjectIdOrCode.includes('MATH')) {
      searchTerms.push('Mathematics', 'Math', 'MATHEMATICS');
    } else if (subjectIdOrCode.includes('ENGLISH')) {
      searchTerms.push('English', 'ENGLISH');
    } else if (subjectIdOrCode.includes('ACADEMIC')) {
      searchTerms.push('Academic', 'ACADEMIC');
    }

    for (const term of searchTerms) {
      const { data: termMatch } = await (supabase as any)
        .from('subjects')
        .select('id')
        .or(`code.ilike.%${term}%,name.ilike.%${term}%`)
        .limit(1)
        .maybeSingle();

      if (termMatch?.id) return termMatch.id;
    }

    // 3. Fallback to first available subject
    const { data: firstSubject } = await (supabase as any)
      .from('subjects')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstSubject?.id) return firstSubject.id;
  } catch (err) {
    console.warn('Failed to resolve subject UUID for:', subjectIdOrCode, err);
  }

  return null;
}

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

    // Resolve subjectId to a valid UUID if a code like "INTELLIGENCE_VERBAL" was passed
    const resolvedSubjectUuid = await resolveSubjectUuid(payload.subjectId);

    // 1. Try RPC call with explicit null for optional parameters
    try {
      const { data, error } = await (supabase as any).rpc('admin_upsert_question', {
        p_id: payload.id ?? null,
        p_code: payload.code,
        p_subject_id: resolvedSubjectUuid,
        p_difficulty: payload.difficulty,
        p_stem: payload.stem,
        p_stem_image_url: payload.stemImageUrl ?? null,
        p_explanation: payload.explanation ?? null,
        p_time_limit_seconds: payload.timeLimitSeconds,
        p_status: payload.status,
        p_tags: payload.tags || [],
        p_course_ids: payload.courseIds || [],
        p_options: payload.options as any,
      });

      if (!error && data) {
        return data;
      }
      if (error) {
        console.warn('RPC admin_upsert_question returned warning, attempting direct table upsert:', error.message);
      }
    } catch (rpcErr) {
      console.warn('RPC execution failed, using direct table fallback:', rpcErr);
    }

    // 2. Direct table fallback if RPC is missing in schema cache or errors out
    let questionId = payload.id;
    if (!questionId) {
      const { data: newQ, error: qErr } = await (supabase as any)
        .from('questions')
        .insert({
          code: payload.code,
          subject_id: resolvedSubjectUuid,
          difficulty: payload.difficulty,
          stem: payload.stem,
          stem_image_url: payload.stemImageUrl ?? null,
          explanation: payload.explanation ?? null,
          time_limit_seconds: payload.timeLimitSeconds,
          status: payload.status,
          tags: payload.tags || [],
        })
        .select('id')
        .single();

      if (qErr || !newQ) throw new Error(qErr?.message || 'Failed to create question record.');
      questionId = newQ.id;
    } else {
      const { error: updateErr } = await (supabase as any)
        .from('questions')
        .update({
          code: payload.code,
          subject_id: resolvedSubjectUuid,
          difficulty: payload.difficulty,
          stem: payload.stem,
          stem_image_url: payload.stemImageUrl ?? null,
          explanation: payload.explanation ?? null,
          time_limit_seconds: payload.timeLimitSeconds,
          status: payload.status,
          tags: payload.tags || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (updateErr) throw new Error(updateErr.message);
    }

    // Upsert options
    if (payload.options && payload.options.length > 0) {
      await (supabase as any).from('question_options').delete().eq('question_id', questionId);

      const optionRows = payload.options.map((opt) => ({
        question_id: questionId,
        option_key: opt.option_key || opt.label,
        label: opt.label,
        text: opt.text,
        image_url: opt.image_url ?? null,
        is_correct: opt.is_correct,
      }));

      const { error: optErr } = await (supabase as any).from('question_options').insert(optionRows);
      if (optErr) console.warn('Options insert warning:', optErr.message);
    }

    // Upsert course eligibilities
    if (payload.courseIds && payload.courseIds.length > 0) {
      await (supabase as any).from('question_course_eligibilities').delete().eq('question_id', questionId);
      const eligRows = payload.courseIds.map((cid) => ({
        question_id: questionId,
        course_id: cid,
      }));
      await (supabase as any).from('question_course_eligibilities').insert(eligRows);
    }

    return questionId as string;
  },
};
