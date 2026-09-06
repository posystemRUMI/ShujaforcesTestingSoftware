import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { BatchItem } from '@/features/batches/types';
import { batchStore } from '@/features/batches/batchStore';

export const batchService = {
  async getBatches(): Promise<BatchItem[]> {
    if (!isSupabaseConfigured()) {
      return batchStore.getBatches();
    }

    const { data, error } = await (supabase as any)
      .from('batches')
      .select(`
        id,
        code,
        name,
        start_date,
        end_date,
        status,
        courses (
          name,
          forces (
            code
          )
        ),
        batch_enrollments (
          count
        )
      `)
      .order('start_date', { ascending: false });

    if (error || !data) {
      console.warn('Falling back to local batch store due to Supabase error:', error);
      return batchStore.getBatches();
    }

    return data.map((b: any) => {
      const course = b.courses as any;
      const force = course?.forces as any;
      const enrolledCount = (b.batch_enrollments && b.batch_enrollments[0]?.count) || 28;

      return {
        id: b.id,
        code: b.code,
        name: b.name,
        wing: 'Alpha Wing',
        branch: (force?.code || 'PAKISTAN_ARMY') as any,
        cadetCount: Number(enrolledCount),
        startDate: b.start_date,
        endDate: b.end_date || '2026-06-30',
        status: (b.status === 'ARCHIVED' ? 'COMPLETED' : b.status) as any,
        targetCourse: course?.name || '154 PMA Long Course',
        benchmarkPassRate: 85.0,
        meanAggregate: 78.4,
        verbalMastery: 84.5,
        nonVerbalMastery: 79.2,
        academicMastery: 72.0,
        isFlagship: b.code.includes('154'),
      };
    });
  },

  async createBatch(payload: {
    code: string;
    name: string;
    courseId: string;
    sessionName: string;
    startDate: string;
    endDate?: string;
  }): Promise<string> {
    if (!isSupabaseConfigured()) {
      return 'mock-batch-id';
    }

    const { data, error } = await (supabase as any)
      .from('batches')
      .insert({
        code: payload.code,
        name: payload.name,
        course_id: payload.courseId,
        session_name: payload.sessionName,
        start_date: payload.startDate,
        end_date: payload.endDate || null,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id;
  },
};
