import { supabase } from '@/lib/supabaseClient';
import { Teacher } from '@/features/teachers/types';
import { TeacherFormData } from '@/features/teachers/teacherSchema';
export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    const { data, error } = await (supabase as any).from('teachers').select('id,service_number,rank,branch_code,created_at,profiles(display_name,email,phone,avatar_url),teacher_subjects(subjects(code))').order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((t: any) => ({ id: t.id, employeeId: t.service_number, fullName: t.profiles?.display_name || '',
      titleRank: t.rank, email: t.profiles?.email || '', phone: t.profiles?.phone || '',
      assignedSubjects: (t.teacher_subjects || []).map((s: any) => s.subjects?.code).filter(Boolean),
      branchAffiliation: t.branch_code || 'TRI_SERVICE', joinedAt: t.created_at?.split('T')[0] || '', avatarUrl: t.profiles?.avatar_url }));
  },
  async getTeacherById(id: string): Promise<Teacher | undefined> { return (await this.getTeachers()).find(t => t.id === id); },
  async suggestCode(): Promise<string> {
    const { data, error } = await (supabase.rpc as any)('suggest_faculty_code');
    if (error) throw new Error(error.message); if (!data) throw new Error('Faculty code sequence unavailable'); return data;
  },
  async saveTeacher(input: TeacherFormData, teacherId?: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession(); if (!session) throw new Error('Administrator login required');
    const { data, error } = await supabase.functions.invoke('save-faculty', { body: { teacherId: teacherId || null, input }, headers: { Authorization: 'Bearer ' + session.access_token } });
    if (error) { let message = error.message; const context = (error as any).context;
      if (context?.json) { try { message = (await context.json()).error || message; } catch { /* Keep transport error. */ } }
      throw new Error(message);
    }
    if (!data?.success || !data.teacherId) throw new Error('Faculty save did not return a persisted record'); return data.teacherId;
  },
};
