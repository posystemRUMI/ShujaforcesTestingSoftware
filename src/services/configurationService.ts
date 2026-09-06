import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ForceConfig, CourseConfig, SubjectConfig } from '@/features/configuration/types';
import { configStore } from '@/features/configuration/configStore';

export const configurationService = {
  async getForces(): Promise<ForceConfig[]> {
    if (!isSupabaseConfigured()) {
      return configStore.getForces();
    }

    const { data, error } = await (supabase as any)
      .from('forces')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.warn('Falling back to local config store for forces:', error);
      return configStore.getForces();
    }

    return data.map((f: any) => ({
      id: f.id,
      name: f.name,
      branch: f.code as any,
      motto: f.motto || '',
      mottoTranslation: '',
      headquarters: f.headquarters || '',
      coursesCount: 3,
      enrolledCadetsCount: 120,
      totalQuestionsCount: 450,
      activeTestsCount: 8,
      description: f.description || '',
      inductionCenter: 'Armed Forces Selection & Recruitment Centre',
    }));
  },

  async getCourses(): Promise<CourseConfig[]> {
    if (!isSupabaseConfigured()) {
      return configStore.getCourses();
    }

    const { data, error } = await (supabase as any)
      .from('courses')
      .select(`
        *,
        forces (
          code
        )
      `)
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.warn('Falling back to local config store for courses:', error);
      return configStore.getCourses();
    }

    return data.map((c: any) => {
      const force = c.forces as any;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        branch: (force?.code || 'PAKISTAN_ARMY') as any,
        durationMonths: Math.round(c.duration_weeks / 4),
        minAge: 17,
        maxAge: 22,
        educationRequirement: 'F.Sc / A-Level (Minimum 60%)',
        passingMarksPercent: 60,
        batchesCount: 2,
        status: (c.status || 'ACTIVE') as any,
        description: c.description || undefined,
      };
    });
  },

  async getSubjects(): Promise<SubjectConfig[]> {
    if (!isSupabaseConfigured()) {
      return configStore.getSubjects();
    }

    const { data, error } = await (supabase as any)
      .from('subjects')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.warn('Falling back to local config store for subjects:', error);
      return configStore.getSubjects();
    }

    return data.map((s: any) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category as any,
      questionCount: 45,
      activeTestsCount: 4,
      status: (s.status || 'ACTIVE') as any,
      description: s.description || '',
    }));
  },
};
