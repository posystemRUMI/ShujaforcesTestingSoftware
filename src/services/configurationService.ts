import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ForceConfig, CourseConfig, SubjectConfig } from '@/features/configuration/types';

export const configurationService = {
  async getForces(): Promise<ForceConfig[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('forces')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Error fetching forces:', error);
      return [];
    }

    return data.map((f: any) => ({
      id: f.id,
      name: f.name,
      branch: f.code as any,
      motto: f.motto || '',
      mottoTranslation: '',
      headquarters: f.headquarters || '',
      coursesCount: 0,
      enrolledCadetsCount: 0,
      totalQuestionsCount: 0,
      activeTestsCount: 0,
      description: f.description || '',
      inductionCenter: 'Armed Forces Selection & Recruitment Centre',
    }));
  },

  async getCourses(forceId?: string): Promise<CourseConfig[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = (supabase as any)
      .from('courses')
      .select(`
        *,
        forces (
          id,
          code
        )
      `)
      .order('sort_order', { ascending: true });

    if (forceId) {
      query = query.eq('force_id', forceId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      if (error) console.warn('Error fetching courses:', error);
      return [];
    }

    return data.map((c: any) => {
      const force = c.forces as any;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        forceId: c.force_id,
        branch: (force?.code || 'TRI_SERVICE') as any,
        durationMonths: Math.round((c.duration_weeks || 24) / 4),
        minAge: 17,
        maxAge: 22,
        educationRequirement: 'F.Sc / A-Level',
        passingMarksPercent: 50,
        batchesCount: 0,
        status: (c.status || 'ACTIVE') as any,
        description: c.description || undefined,
      };
    });
  },

  async getSubjects(): Promise<SubjectConfig[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('subjects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Error fetching subjects:', error);
      return [];
    }

    return data.map((s: any) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category as any,
      questionCount: 0,
      activeTestsCount: 0,
      status: (s.status || 'ACTIVE') as any,
      description: s.description || '',
    }));
  },
};
