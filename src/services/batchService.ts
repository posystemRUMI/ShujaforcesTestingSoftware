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

    if (error || !data || data.length === 0) {
      if (error) console.warn('Error fetching batches:', error);
      return [];
    }

    return data.map((b: any) => {
      const course = b.courses as any;
      const force = course?.forces as any;
      const enrolledCount = (b.batch_enrollments && b.batch_enrollments[0]?.count) || 0;

      return {
        id: b.id,
        code: b.code,
        name: b.name,
        wing: 'Main Wing',
        branch: (force?.code || 'TRI_SERVICE') as any,
        cadetCount: Number(enrolledCount),
        startDate: b.start_date,
        endDate: b.end_date || '',
        status: (b.status === 'ARCHIVED' ? 'COMPLETED' : b.status) as any,
        targetCourse: course?.name || '',
        benchmarkPassRate: 0,
        meanAggregate: 0,
        verbalMastery: 0,
        nonVerbalMastery: 0,
        academicMastery: 0,
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
