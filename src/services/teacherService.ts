import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { Teacher } from '@/features/teachers/types';
import { teacherStore } from '@/features/teachers/teacherStore';

export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    if (!isSupabaseConfigured()) {
      return teacherStore.getTeachers();
    }

    const { data, error } = await (supabase as any)
      .from('teachers')
      .select(`
        id,
        service_number,
        rank,
        branch_code,
        role_title,
        status,
        created_at,
        profiles (
          display_name,
          email,
          phone,
          avatar_url
        ),
        teacher_subjects (
          subjects (
            code
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error) console.warn('Error fetching teachers from database:', error);
      return [];
    }

    return data.map((t: any) => {
      const profile = t.profiles as any;
      const subs = (t.teacher_subjects || []).map((ts: any) => ts.subjects?.code).filter(Boolean);

      return {
        id: t.id,
        employeeId: t.service_number,
        fullName: profile?.display_name || 'Faculty Officer',
        titleRank: t.rank,
        email: profile?.email || '',
        phone: profile?.phone || 'N/A',
        assignedSubjects: subs,
        branchAffiliation: (t.branch_code || 'TRI_SERVICE') as any,
        role: (t.role_title || 'INSTRUCTOR') as any,
        status: (t.status || 'ACTIVE') as any,
        questionsCreatedCount: 0,
        activeTestsManaged: 0,
        lastActiveAt: new Date().toISOString(),
        joinedAt: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        avatarUrl: profile?.avatar_url || undefined,
      };
    });
  },

  async createTeacher(payload: {
    userId: string;
    serviceNumber: string;
    rank: string;
    branchCode: string;
    roleTitle: string;
    subjectIds?: string[];
  }): Promise<string> {
    if (!isSupabaseConfigured()) {
      return 'mock-teacher-id';
    }

    const { data, error } = await (supabase as any).rpc('admin_create_teacher', {
      p_user_id: payload.userId,
      p_service_number: payload.serviceNumber,
      p_rank: payload.rank,
      p_branch_code: payload.branchCode,
      p_role_title: payload.roleTitle,
      p_subject_ids: payload.subjectIds || [],
    });

    if (error) throw new Error(error.message);
    return data;
  },
};
