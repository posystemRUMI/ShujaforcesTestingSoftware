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
        profile_id,
        roll_number,
        father_name,
        cnic,
        status,
        created_at,
        date_of_birth,
        gender,
        education,
        education_details,
        alternate_phone,
        address,
        guardian_name,
        guardian_relationship,
        guardian_phone,
        admission_date,
        notes,
        photo_url,
        profiles:profiles!students_profile_id_fkey (
          display_name,
          phone,
          avatar_url,
          email
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
      if (error) console.warn('Error fetching students from database:', error);
      return [];
    }

    return data.map((s: any) => {
      const profile = (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles) as any;
      const force = (Array.isArray(s.forces) ? s.forces[0] : s.forces) as any;
      const course = (Array.isArray(s.courses) ? s.courses[0] : s.courses) as any;
      const enrollment = (s.batch_enrollments && s.batch_enrollments[0]) as any;

      const rawPhone = profile?.phone || s.alternate_phone || s.guardian_phone || 'N/A';

      return {
        id: s.id,
        rollNumber: s.roll_number,
        fullName: profile?.display_name || 'Cadet',
        fatherName: s.father_name || '—',
        cnic: s.cnic || 'N/A',
        phone: rawPhone,
        branch: (force?.code || 'TRI_SERVICE') as any,
        batchId: enrollment?.batch_id || '',
        batchCode: enrollment?.batches?.code || '',
        targetCourse: course?.name || '',
        status: (s.status || 'ACTIVE') as any,
        enrolledAt: s.admission_date || (s.created_at ? s.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        avatarUrl: profile?.avatar_url || s.photo_url || undefined,
        academicScoreAverage: 0,
        intelligenceScoreAverage: 0,
        totalAttempts: 0,
        highestScore: 0,
        passRate: 0,
        dateOfBirth: s.date_of_birth,
        gender: s.gender,
        education: s.education,
        educationDetails: s.education_details,
        alternatePhone: s.alternate_phone,
        address: s.address,
        guardianName: s.guardian_name,
        guardianRelationship: s.guardian_relationship,
        guardianPhone: s.guardian_phone,
        admissionDate: s.admission_date,
        notes: s.notes,
        email: profile?.email,
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
    const found = students.find((s) => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
    if (found) return found;

    // Fallback: direct query by ID, profile_id or roll_number
    try {
      const { data, error } = await (supabase as any)
        .from('students')
        .select(`
          id,
          profile_id,
          roll_number,
          father_name,
          cnic,
          status,
          created_at,
          date_of_birth,
          gender,
          education,
          education_details,
          alternate_phone,
          address,
          guardian_name,
          guardian_relationship,
          guardian_phone,
          admission_date,
          notes,
          photo_url,
          profiles:profiles!students_profile_id_fkey (
            display_name,
            phone,
            avatar_url,
            email
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
        .or(`id.eq.${id},profile_id.eq.${id},roll_number.eq.${id}`)
        .maybeSingle();

      if (error || !data) {
        return studentStore.getById(id) || null;
      }

      const profile = (Array.isArray(data.profiles) ? data.profiles[0] : data.profiles) as any;
      const force = (Array.isArray(data.forces) ? data.forces[0] : data.forces) as any;
      const course = (Array.isArray(data.courses) ? data.courses[0] : data.courses) as any;
      const enrollment = (data.batch_enrollments && data.batch_enrollments[0]) as any;

      return {
        id: data.id,
        rollNumber: data.roll_number,
        fullName: profile?.display_name || 'Cadet',
        fatherName: data.father_name || '—',
        cnic: data.cnic || 'N/A',
        phone: profile?.phone || data.alternate_phone || data.guardian_phone || 'N/A',
        branch: (force?.code || 'PAKISTAN_ARMY') as any,
        batchId: enrollment?.batch_id || 'batch-001',
        batchCode: enrollment?.batches?.code || '154-PMA-LC',
        targetCourse: course?.name || 'PMA Long Course',
        status: (data.status || 'ACTIVE') as any,
        enrolledAt: data.admission_date || (data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
        avatarUrl: profile?.avatar_url || data.photo_url || undefined,
        academicScoreAverage: 85,
        intelligenceScoreAverage: 88,
        totalAttempts: 4,
        highestScore: 92,
        passRate: 95,
        dateOfBirth: data.date_of_birth,
        gender: data.gender,
        education: data.education,
        educationDetails: data.education_details,
        alternatePhone: data.alternate_phone,
        address: data.address,
        guardianName: data.guardian_name,
        guardianRelationship: data.guardian_relationship,
        guardianPhone: data.guardian_phone,
        admissionDate: data.admission_date,
        notes: data.notes,
        email: profile?.email,
      };
    } catch {
      return studentStore.getById(id) || null;
    }
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
    const { data: stdData, error } = await (supabase as any)
      .from('students')
      .update({
        father_name: updates.fatherName,
        cnic: updates.cnic,
        status: updates.status,
      })
      .eq('id', id)
      .select('profile_id')
      .maybeSingle();

    if (error) {
      console.warn('Failed to update student in Supabase:', error);
    }

    if (stdData?.profile_id && (updates.fullName || updates.phone)) {
      await (supabase as any)
        .from('profiles')
        .update({
          ...(updates.fullName ? { display_name: updates.fullName } : {}),
          ...(updates.phone ? { phone: updates.phone } : {}),
        })
        .eq('id', stdData.profile_id);
    }

    studentStore.update(id, updates as any);
  },
};

