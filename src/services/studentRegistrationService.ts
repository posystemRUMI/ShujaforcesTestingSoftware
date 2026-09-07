import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  ForceOption,
  CourseOption,
  BatchOption,
  StudentRegistrationInput,
  RegistrationResult,
} from '@/types/registration.types';
import { studentStore } from '@/features/students/studentStore';

// Static fallback options for when offline / dev mode
const FALLBACK_FORCES: ForceOption[] = [
  { id: '10000000-0000-0000-0000-000000000001', code: 'PAKISTAN_ARMY', name: 'Pakistan Army', motto: 'Iman, Taqwa, Jihad fi Sabilillah' },
  { id: '10000000-0000-0000-0000-000000000002', code: 'PAKISTAN_AIR_FORCE', name: 'Pakistan Air Force', motto: 'Sehraast ke Daryaast' },
  { id: '10000000-0000-0000-0000-000000000003', code: 'PAKISTAN_NAVY', name: 'Pakistan Navy', motto: 'Himmat-e-Mardan, Madad-e-Khuda' },
];

const FALLBACK_COURSES: CourseOption[] = [
  { id: '20000000-0000-0000-0000-000000000001', forceId: '10000000-0000-0000-0000-000000000001', code: 'PMA_LONG_COURSE', name: '154 PMA Long Course', durationWeeks: 104 },
  { id: '20000000-0000-0000-0000-000000000002', forceId: '10000000-0000-0000-0000-000000000002', code: 'GDP', name: '158 GDP (General Duty Pilot)', durationWeeks: 156 },
  { id: '20000000-0000-0000-0000-000000000003', forceId: '10000000-0000-0000-0000-000000000003', code: 'PN_CADET', name: 'PN Cadet Term 2026-A', durationWeeks: 104 },
];

const FALLBACK_BATCHES: BatchOption[] = [
  { id: '40000000-0000-0000-0000-000000000001', courseId: '20000000-0000-0000-0000-000000000001', code: '154-PMA-ALPHA', name: 'PMA 154 Long Course Alpha Wing', sessionName: 'Spring 2026', status: 'ACTIVE' },
  { id: '40000000-0000-0000-0000-000000000002', courseId: '20000000-0000-0000-0000-000000000001', code: '154-PMA-BRAVO', name: 'PMA 154 Long Course Bravo Wing', sessionName: 'Spring 2026', status: 'ACTIVE' },
  { id: '40000000-0000-0000-0000-000000000003', courseId: '20000000-0000-0000-0000-000000000002', code: '158-GDP-ALPHA', name: '158 GDP Alpha Squadron', sessionName: 'Spring 2026', status: 'ACTIVE' },
  { id: '40000000-0000-0000-0000-000000000004', courseId: '20000000-0000-0000-0000-000000000003', code: 'PNC-2026-ALPHA', name: 'Pakistan Navy Cadet Cadre 2026', sessionName: 'Spring 2026', status: 'ACTIVE' },
];

export const studentRegistrationService = {
  /**
   * Fetch all active military force branches
   */
  async getActiveForces(): Promise<ForceOption[]> {
    if (!isSupabaseConfigured()) {
      return FALLBACK_FORCES;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('forces')
        .select('id, code, name, motto')
        .eq('status', 'ACTIVE')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        console.warn('Falling back to default forces list:', error);
        return FALLBACK_FORCES;
      }

      return data.map((f: any) => ({
        id: f.id,
        code: f.code,
        name: f.name,
        motto: f.motto,
      }));
    } catch (err) {
      console.warn('Error querying forces:', err);
      return FALLBACK_FORCES;
    }
  },

  /**
   * Fetch courses for a selected military force
   */
  async getCoursesForForce(forceId: string): Promise<CourseOption[]> {
    if (!forceId) return [];

    if (!isSupabaseConfigured()) {
      return FALLBACK_COURSES.filter((c) => c.forceId === forceId);
    }

    try {
      const { data, error } = await (supabase as any)
        .from('courses')
        .select('id, force_id, code, name, duration_weeks')
        .eq('force_id', forceId)
        .eq('status', 'ACTIVE')
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return FALLBACK_COURSES.filter((c) => c.forceId === forceId);
      }

      return data.map((c: any) => ({
        id: c.id,
        forceId: c.force_id,
        code: c.code,
        name: c.name,
        durationWeeks: c.duration_weeks,
      }));
    } catch (err) {
      console.warn('Error querying courses for force:', err);
      return FALLBACK_COURSES.filter((c) => c.forceId === forceId);
    }
  },

  /**
   * Fetch active batches for a selected course
   */
  async getBatchesForCourse(courseId: string): Promise<BatchOption[]> {
    if (!courseId) return [];

    if (!isSupabaseConfigured()) {
      return FALLBACK_BATCHES.filter((b) => b.courseId === courseId);
    }

    try {
      const { data, error } = await (supabase as any)
        .from('batches')
        .select('id, course_id, code, name, session_name, status')
        .eq('course_id', courseId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return FALLBACK_BATCHES.filter((b) => b.courseId === courseId);
      }

      return data.map((b: any) => ({
        id: b.id,
        courseId: b.course_id,
        code: b.code,
        name: b.name,
        sessionName: b.session_name,
        status: b.status,
      }));
    } catch (err) {
      console.warn('Error querying batches for course:', err);
      return FALLBACK_BATCHES.filter((b) => b.courseId === courseId);
    }
  },

  /**
   * Check if Roll Number already exists
   */
  async checkRollNumberExists(rollNumber: string): Promise<boolean> {
    if (!rollNumber || !rollNumber.trim()) return false;

    if (!isSupabaseConfigured()) {
      const existing = studentStore.getAll().some(
        (s) => s.rollNumber.toUpperCase() === rollNumber.trim().toUpperCase()
      );
      return existing;
    }

    try {
      const { data, error } = await (supabase as any).rpc('check_roll_number_exists', {
        p_roll_number: rollNumber.trim(),
      });
      if (error) {
        const { data: qData } = await (supabase as any)
          .from('students')
          .select('id')
          .ilike('roll_number', rollNumber.trim())
          .maybeSingle();
        return Boolean(qData);
      }
      return Boolean(data);
    } catch (err) {
      return false;
    }
  },

  /**
   * Check if CNIC already exists
   */
  async checkCnicExists(cnic: string): Promise<boolean> {
    if (!cnic || !cnic.trim()) return false;

    if (!isSupabaseConfigured()) {
      return studentStore.getAll().some((s) => s.cnic === cnic.trim());
    }

    try {
      const { data, error } = await (supabase as any).rpc('check_cnic_exists', {
        p_cnic: cnic.trim(),
      });
      if (error) {
        const { data: qData } = await (supabase as any)
          .from('students')
          .select('id')
          .eq('cnic', cnic.trim())
          .maybeSingle();
        return Boolean(qData);
      }
      return Boolean(data);
    } catch (err) {
      return false;
    }
  },

  /**
   * Check if Email already exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    if (!email || !email.trim()) return false;

    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const { data, error } = await (supabase as any).rpc('check_email_exists', {
        p_email: email.trim().toLowerCase(),
      });
      if (error) {
        const { data: pData } = await (supabase as any)
          .from('profiles')
          .select('id')
          .ilike('email', email.trim())
          .maybeSingle();
        return Boolean(pData);
      }
      return Boolean(data);
    } catch (err) {
      return false;
    }
  },

  /**
   * Upload Student Photo to Supabase Storage
   */
  async uploadStudentPhoto(file: File): Promise<string> {
    if (!file) throw new Error('No file provided for upload.');

    if (!isSupabaseConfigured()) {
      return URL.createObjectURL(file);
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `cadets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      // Try fallback to profile-images bucket
      const { error: fallbackError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (fallbackError) {
        throw new Error(`Failed to upload photo: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Register a new student using atomic backend RPC
   */
  async registerStudent(input: StudentRegistrationInput): Promise<RegistrationResult> {
    if (!isSupabaseConfigured()) {
      // Local store mock creation
      const mockId = `student-${Date.now()}`;
      studentStore.create({
        fullName: input.fullName,
        fatherName: input.fatherName,
        cnic: input.cnic,
        phone: input.phone,
        rollNumber: input.rollNumber.toUpperCase(),
        branch: 'PAKISTAN_ARMY',
        batchId: input.batchId || 'batch-001',
        batchCode: '154-PMA-LC',
        targetCourse: '154 PMA Long Course',
        status: input.status as any,
        avatarUrl: input.photoUrl,
      });

      return {
        success: true,
        studentId: mockId,
        profileId: `profile-${Date.now()}`,
        rollNumber: input.rollNumber.toUpperCase(),
        email: input.email.toLowerCase(),
        displayName: input.fullName,
      };
    }

    const payload = {
      p_email: input.email.trim().toLowerCase(),
      p_password: input.password,
      p_display_name: input.fullName.trim(),
      p_father_name: input.fatherName.trim(),
      p_cnic: input.cnic.trim(),
      p_phone: input.phone.trim(),
      p_target_force_id: input.targetForceId,
      p_target_course_id: input.targetCourseId,
      p_roll_number: input.rollNumber.trim().toUpperCase(),
      p_alternate_phone: input.alternatePhone?.trim() || null,
      p_date_of_birth: input.dateOfBirth || null,
      p_gender: input.gender || 'Male',
      p_education: input.education || null,
      p_education_details: input.educationDetails || null,
      p_batch_id: input.batchId || null,
      p_address: input.address?.trim() || null,
      p_guardian_name: input.guardianName?.trim() || null,
      p_guardian_relationship: input.guardianRelationship || null,
      p_guardian_phone: input.guardianPhone?.trim() || null,
      p_admission_date: input.admissionDate || new Date().toISOString().split('T')[0],
      p_status: input.status || 'ACTIVE',
      p_notes: input.notes?.trim() || null,
      p_photo_url: input.photoUrl || null,
    };

    const { data, error } = await (supabase as any).rpc('register_student', payload);

    if (error) {
      console.error('Supabase register_student error:', error);
      throw new Error(error.message || 'Registration failed on server.');
    }

    const res = data as any;

    return {
      success: true,
      studentId: res?.student_id || '',
      profileId: res?.profile_id || '',
      rollNumber: res?.roll_number || input.rollNumber.toUpperCase(),
      email: res?.email || input.email.toLowerCase(),
      displayName: res?.display_name || input.fullName,
    };
  },
};
