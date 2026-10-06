import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Question } from '@/types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

async function resolveSubjectUuid(subjectIdOrCode?: string | null): Promise<string> {
  const fallbackCode = subjectIdOrCode || 'INTELLIGENCE_VERBAL';

  if (UUID_REGEX.test(fallbackCode)) {
    return fallbackCode;
  }

  if (!isSupabaseConfigured()) {
    return '00000000-0000-0000-0000-000000000001';
  }

  try {
    const { data: codeMatch } = await (supabase as any)
      .from('subjects')
      .select('id')
      .eq('code', fallbackCode)
      .maybeSingle();

    if (codeMatch?.id) return codeMatch.id;

    const searchTerms: string[] = [];
    if (fallbackCode.includes('NON_VERBAL') || fallbackCode.includes('NON-VERBAL')) {
      searchTerms.push('Non-Verbal', 'INTELLIGENCE_NON_VERBAL');
    } else if (fallbackCode.includes('VERBAL')) {
      searchTerms.push('Verbal', 'INTELLIGENCE_VERBAL');
    } else if (fallbackCode.includes('PHYSICS')) {
      searchTerms.push('Physics', 'PHYSICS');
    } else if (fallbackCode.includes('MATH')) {
      searchTerms.push('Mathematics', 'Math', 'MATHEMATICS');
    } else if (fallbackCode.includes('ENGLISH')) {
      searchTerms.push('English', 'ENGLISH');
    } else if (fallbackCode.includes('ACADEMIC')) {
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

    const { data: firstSubject } = await (supabase as any)
      .from('subjects')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (firstSubject?.id) return firstSubject.id;

    const cleanCode = fallbackCode.toUpperCase();
    const cleanName = cleanCode
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const category = cleanCode.includes('INTELLIGENCE')
      ? 'INTELLIGENCE'
      : cleanCode.includes('ACADEMIC') || cleanCode.includes('PHYSICS') || cleanCode.includes('MATH') || cleanCode.includes('ENGLISH')
      ? 'ACADEMIC'
      : 'GENERAL';

    const { data: created } = await (supabase as any)
      .from('subjects')
      .insert({
        code: cleanCode,
        name: cleanName,
        category: category,
        description: `${cleanName} assessment subject`,
      })
      .select('id')
      .single();

    if (created?.id) return created.id;
  } catch (err) {
    console.warn('Failed to resolve subject UUID for:', fallbackCode, err);
  }

  return '00000000-0000-0000-0000-000000000001';
}

export const questionService = {
  async getQuestions(): Promise<Question[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    // Paginate to load ALL questions beyond Supabase 1000 default limit
    let allData: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;

    while (true) {
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
            option_key,
            text,
            image_url,
            is_correct
          )
        `)
        .range(from, from + PAGE_SIZE - 1);

      if (error || !data || data.length === 0) break;
      allData.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const mapped = allData.map((q: any) => {
      const subject = q.subjects as any;
      const profile = q.profiles as any;
      const opts = (q.question_options || []) as any[];
      const correctOpt = opts.find((o) => o.is_correct);

      const tags: string[] = q.tags || [];
      const isAFNS = tags.includes('AFNS') || q.code.startsWith('AFNS') || q.stem.startsWith('AFNS');
      const isVerbal = tags.includes('Verbal') || q.code.startsWith('VERBAL') || q.stem.startsWith('V--Q');
      
      const branch = isAFNS && !tags.includes('PMA') 
        ? 'ARMED_FORCES_NURSING_SERVICE' 
        : isVerbal 
        ? 'TRI_SERVICE' 
        : 'PAKISTAN_ARMY';

      return {
        id: q.id,
        code: q.code,
        subject_id: q.subject_id,
        subjectName: subject?.name || subject?.code || 'General',
        subject: (subject?.code || 'INTELLIGENCE_VERBAL') as any,
        branch: branch as any,
        stem: q.stem,
        options: opts.map((o) => ({
          id: o.id,
          label: (o.label || o.option_key || 'A') as any,
          text: o.text || '',
          imageUrl: o.image_url || undefined,
        })),
        correctOptionId: correctOpt?.id || (opts[0]?.id ?? 'opt-a'),
        explanation: q.explanation || '',
        difficulty: q.difficulty as any,
        timeLimitSeconds: q.time_limit_seconds || 30,
        status: (q.status === 'ARCHIVED' ? 'ARCHIVED' : q.status === 'APPROVED' ? 'APPROVED' : q.status === 'INACTIVE' ? 'DRAFT' : 'DRAFT') as any,
        imageUrl: q.stem_image_url || undefined,
        authorName: profile?.display_name || 'Faculty Officer',
        tags,
        updatedAt: q.updated_at ? q.updated_at.split('T')[0] : '2026-10-06',
      };
    });

    // Sequential & Numerical Sorting: Verbal -> AFNS -> PMA (1, 2, 3...)
    mapped.sort((a, b) => {
      const parseStemNum = (str: string) => {
        const m = str.match(/(?:PMA|V|AFNS)--Q\s*(?:no\.?|#)?\s*(\d+)/i) || str.match(/(?:PMA|VERBAL|AFNS)-Q-(\d+)/i);
        return m ? parseInt(m[1], 10) : 999999;
      };

      const getPrefixGroup = (str: string) => {
        if (str.includes('V--Q') || str.includes('VERBAL')) return 1;
        if (str.includes('AFNS')) return 2;
        return 3;
      };

      const groupA = getPrefixGroup(a.stem + a.code);
      const groupB = getPrefixGroup(b.stem + b.code);

      if (groupA !== groupB) return groupA - groupB;

      const numA = parseStemNum(a.stem + a.code);
      const numB = parseStemNum(b.stem + b.code);
      return numA - numB;
    });

    return mapped;
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

    const resolvedSubjectUuid = await resolveSubjectUuid(payload.subjectId);

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
        p_options: payload.options,
      });

      if (!error && data) {
        return data as string;
      }
    } catch (rpcErr) {
      console.warn('RPC admin_upsert_question unavailable or failed:', rpcErr);
    }

    // Direct table fallback upsert
    const qRow = {
      id: payload.id || `q-${Date.now()}`,
      code: payload.code,
      subject_id: resolvedSubjectUuid,
      difficulty: payload.difficulty,
      stem: payload.stem,
      stem_image_url: payload.stemImageUrl || null,
      explanation: payload.explanation || null,
      time_limit_seconds: payload.timeLimitSeconds,
      status: payload.status,
      tags: payload.tags || [],
    };

    const { error: qErr } = await (supabase as any).from('questions').upsert(qRow);
    if (qErr) throw qErr;

    if (payload.options && payload.options.length > 0) {
      const optRows = payload.options.map((o) => ({
        question_id: qRow.id,
        option_key: o.option_key || o.label,
        label: o.label,
        text: o.text,
        image_url: o.image_url || null,
        is_correct: o.is_correct,
      }));
      await (supabase as any).from('question_options').upsert(optRows);
    }

    if (payload.courseIds && payload.courseIds.length > 0) {
      const courseRows = payload.courseIds.map((cid) => ({
        question_id: qRow.id,
        course_id: cid,
      }));
      await (supabase as any).from('question_courses').upsert(courseRows);
    }

    return qRow.id;
  },
};
