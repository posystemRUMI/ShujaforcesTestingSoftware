import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { StudentRecord } from '@/features/students/types';
import { studentStore } from '@/features/students/studentStore';

export const studentService = {
  async getStudents(): Promise<StudentRecord[]> {
    if (!isSupabaseConfigured()) {
      return studentStore.getAll();
    }

    const { data, error } = await (supabase as any)
      .from('students')
      .select(`
        id,
        roll_number,
        father_name,
        cnic,
        status,
        created_at,
        profiles (
          display_name,
          phone,
          avatar_url
        ),
        forces (
          code
        ),
        courses (
          name
        ),
        batch_enrollments (
          batch_id,
          batches (
            code
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Falling back to local student store due to Supabase error:', error);
      return studentStore.getAll();
    }

    return data.map((s: any) => {
      const profile = s.profiles as any;
      const force = s.forces as any;
      const course = s.courses as any;
      const enrollment = (s.batch_enrollments && s.batch_enrollments[0]) as any;

      return {
        id: s.id,
        rollNumber: s.roll_number,
        fullName: profile?.display_name || 'Cadet',
        fatherName: s.father_name,
        cnic: s.cnic || 'N/A',
        phone: profile?.phone || 'N/A',
        branch: (force?.code || 'PAKISTAN_ARMY') as any,
        batchId: enrollment?.batch_id || 'batch-001',
        batchCode: enrollment?.batches?.code || '154-PMA-LC',
        targetCourse: course?.name || 'PMA Long Course',
        status: (s.status || 'ACTIVE') as any,
        enrolledAt: s.created_at.split('T')[0],
        avatarUrl: profile?.avatar_url || undefined,
        academicScoreAverage: 85,
        intelligenceScoreAverage: 88,
        totalAttempts: 4,
        highestScore: 92,
        passRate: 95,
      };
    });
  },

  async createStudent(payload: {
    userId: string;
    rollNumber: string;
    fatherName: string;
    cnic: string;
    dateOfBirth: string;
    targetForceId: string;
    targetCourseId: string;
    batchId?: string;
  }): Promise<string> {
    if (!isSupabaseConfigured()) {
      return 'mock-student-id';
    }

    const { data, error } = await (supabase as any).rpc('admin_create_student', {
      p_user_id: payload.userId,
      p_roll_number: payload.rollNumber,
      p_father_name: payload.fatherName,
      p_cnic: payload.cnic,
      p_date_of_birth: payload.dateOfBirth,
      p_target_force_id: payload.targetForceId,
      p_target_course_id: payload.targetCourseId,
      p_batch_id: payload.batchId,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getStudentById(id: string): Promise<StudentRecord | null> {
    if (!isSupabaseConfigured()) {
      return studentStore.getById(id) || null;
    }
    const students = await this.getStudents();
    return students.find((s) => s.id === id) || null;
  },

  async deleteStudent(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      studentStore.delete(id);
      return;
    }
    const { error } = await (supabase as any).from('students').delete().eq('id', id);
    if (error) {
      console.warn('Failed to delete student from Supabase:', error);
    }
    studentStore.delete(id);
  },

  async updateStudent(id: string, updates: Partial<StudentRecord>): Promise<void> {
    if (!isSupabaseConfigured()) {
      studentStore.update(id, updates as any);
      return;
    }
    const { error } = await (supabase as any)
      .from('students')
      .update({
        father_name: updates.fatherName,
        cnic: updates.cnic,
        status: updates.status,
      })
      .eq('id', id);
    if (error) {
      console.warn('Failed to update student in Supabase:', error);
    }
    studentStore.update(id, updates as any);
  },
};

