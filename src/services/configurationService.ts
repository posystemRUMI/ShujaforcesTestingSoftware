import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { ForceConfig, CourseConfig, SubjectConfig } from '@/features/configuration/types';
import {
  OFFICIAL_FORCES,
  OFFICIAL_COURSES,
  normalizeCourseCode,
  normalizeForceCode,
} from '@/config/officialTestPatterns';

export const configurationService = {
  async getForces(): Promise<ForceConfig[]> {
    let dbData: any[] = [];
    if (isSupabaseConfigured()) {
      const { data, error } = await (supabase as any)
        .from('forces')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) dbData = data;
    }

    const seenForces = new Set<string>();
    const forcesList: ForceConfig[] = [];

    // Prioritize official forces in order
    for (const offForce of OFFICIAL_FORCES) {
      const dbMatch = dbData.find(
        (f) => normalizeForceCode(f.code || f.name) === offForce.code
      );

      forcesList.push({
        id: dbMatch?.id || offForce.id,
        name: offForce.name,
        branch: offForce.code as any,
        motto: dbMatch?.motto || offForce.motto,
        mottoTranslation: '',
        headquarters: dbMatch?.headquarters || 'GHQ / AHQ / NHQ',
        coursesCount: offForce.code === 'PAKISTAN_NAVY' ? 1 : 2,
        enrolledCadetsCount: 0,
        totalQuestionsCount: 0,
        activeTestsCount: 0,
        description: dbMatch?.description || '',
        inductionCenter: 'Armed Forces Selection & Recruitment Centre',
      });
      seenForces.add(offForce.code);
    }

    return forcesList;
  },

  async getCourses(forceId?: string): Promise<CourseConfig[]> {
    let dbData: any[] = [];
    if (isSupabaseConfigured()) {
      let query = (supabase as any)
        .from('courses')
        .select(`
          *,
          forces (
            id,
            code,
            name
          )
        `)
        .order('sort_order', { ascending: true });

      if (forceId) {
        query = query.eq('force_id', forceId);
      }

      const { data, error } = await query;
      if (!error && data) dbData = data;
    }

    if (dbData && dbData.length > 0) {
      const coursesList: CourseConfig[] = [];
      const seenIds = new Set<string>();

      for (const c of dbData) {
        if (seenIds.has(c.id)) continue;
        seenIds.add(c.id);

        const targetForceId = c.force_id || c.forces?.id || '';
        if (forceId && targetForceId !== forceId && c.forces?.code !== forceId) {
          continue;
        }

        coursesList.push({
          id: c.id,
          code: c.code,
          name: c.name,
          forceId: targetForceId,
          branch: (c.forces?.code || 'PAKISTAN_ARMY') as any,
          durationMonths: Math.round(((c.duration_weeks || 24) / 4)),
          minAge: 17,
          maxAge: 22,
          educationRequirement: 'F.Sc / A-Level',
          passingMarksPercent: 50,
          status: c.status || 'ACTIVE',
          description: c.description || undefined,
        });
      }
      return coursesList;
    }

    const officialCoursesList: CourseConfig[] = [];
    const seenCourseCodes = new Set<string>();

    for (const offCourse of OFFICIAL_COURSES) {
      // Find matching course from DB if available
      const dbMatch = dbData.find(
        (c) => normalizeCourseCode(c.code || c.name) === offCourse.code
      );

      const targetBranch = offCourse.forceCode;
      const defaultForceId =
        targetBranch === 'PAKISTAN_ARMY'
          ? '00000000-0000-0000-0000-000000000001'
          : targetBranch === 'PAKISTAN_AIR_FORCE'
          ? '00000000-0000-0000-0000-000000000002'
          : '00000000-0000-0000-0000-000000000003';

      const effectiveForceId = dbMatch?.force_id || defaultForceId;

      // If forceId parameter was passed, filter by forceId
      if (forceId && forceId !== effectiveForceId && forceId !== targetBranch && dbMatch?.forces?.id !== forceId) {
        continue;
      }

      if (!seenCourseCodes.has(offCourse.code)) {
        seenCourseCodes.add(offCourse.code);
        officialCoursesList.push({
          id: dbMatch?.id || offCourse.id,
          code: offCourse.code,
          name: offCourse.name,
          forceId: effectiveForceId,
          branch: targetBranch as any,
          durationMonths: Math.round(((dbMatch as any)?.duration_weeks || 24) / 4),
          minAge: 17,
          maxAge: 22,
          educationRequirement: 'F.Sc / A-Level',
          passingMarksPercent: 50,
          status: 'ACTIVE',
          description: (dbMatch as any)?.description || undefined,
        });
      }
    }

    return officialCoursesList;
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
