import { supabase } from '@/lib/supabaseClient';
import {
  ForceOption,
  CourseOption,
  BatchOption,
  StudentRegistrationInput,
  RegistrationResult,
} from '@/types/registration.types';

interface ForceRow {
  id: string;
  code: string;
  name: string;
  motto: string | null;
}

interface CourseRow {
  id: string;
  force_id: string;
  code: string;
  name: string;
  duration_weeks: number | null;
}

interface BatchRow {
  id: string;
  course_id: string;
  code: string;
  name: string;
  session_name: string | null;
  status: string;
}

export const studentRegistrationService = {
  /**
   * Fetch all active military force branches directly from database
   */
  async getActiveForces(): Promise<ForceOption[]> {
    const { data, error } = await supabase
      .from('forces')
      .select('id, code, name, motto')
      .eq('status', 'ACTIVE')
      .order('sort_order', { ascending: true })
      .returns<ForceRow[]>();

    if (error) {
      console.error('Error fetching forces:', error);
      throw new Error('Unable to connect to the academy server. Please try again.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((f: ForceRow) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      motto: f.motto || undefined,
    }));
  },

  /**
   * Fetch active courses for a selected military force from database
   */
  async getCoursesForForce(forceId: string): Promise<CourseOption[]> {
    if (!forceId) return [];

    const { data, error } = await supabase
      .from('courses')
      .select('id, force_id, code, name, duration_weeks')
      .eq('force_id', forceId)
      .eq('status', 'ACTIVE')
      .order('sort_order', { ascending: true })
      .returns<CourseRow[]>();

    if (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Unable to connect to the academy server. Please try again.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((c: CourseRow) => ({
      id: c.id,
      forceId: c.force_id,
      code: c.code,
      name: c.name,
      durationWeeks: c.duration_weeks || undefined,
    }));
  },

  /**
   * Fetch active batches for a selected course from database
   */
  async getBatchesForCourse(courseId: string): Promise<BatchOption[]> {
    if (!courseId) return [];

    const { data, error } = await supabase
      .from('batches')
      .select('id, course_id, code, name, session_name, status')
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .returns<BatchRow[]>();

    if (error) {
      console.error('Error fetching batches:', error);
      throw new Error('Unable to connect to the academy server. Please try again.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((b: BatchRow) => ({
      id: b.id,
      courseId: b.course_id,
      code: b.code,
      name: b.name,
      sessionName: b.session_name || undefined,
      status: b.status,
    }));
  },

  /**
   * Check if Roll Number already exists (Staff Gated)
   */
  async checkRollNumberExists(rollNumber: string): Promise<boolean> {
    if (!rollNumber || !rollNumber.trim()) return false;

    try {
      const rpcFn = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: boolean | null; error: { message: string } | null }>;

      const { data, error } = await rpcFn('check_roll_number_exists', {
        p_roll_number: rollNumber.trim(),
      });
      if (error) {
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Check if CNIC already exists using canonical normalization (Staff Gated)
   */
  async checkCnicExists(cnic: string): Promise<boolean> {
    if (!cnic || !cnic.trim()) return false;

    try {
      const rpcFn = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: boolean | null; error: { message: string } | null }>;

      const { data, error } = await rpcFn('check_cnic_exists', {
        p_cnic: cnic.trim(),
      });
      if (error) {
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Check if Email already exists (Staff Gated)
   */
  async checkEmailExists(email: string): Promise<boolean> {
    if (!email || !email.trim()) return false;

    try {
      const rpcFn = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: boolean | null; error: { message: string } | null }>;

      const { data, error } = await rpcFn('check_email_exists', {
        p_email: email.trim().toLowerCase(),
      });
      if (error) {
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Upload Student Photo to Private Storage Bucket
   * Returns storage object path (NOT a public URL).
   */
  async uploadStudentPhoto(file: File): Promise<{ path: string; signedUrl: string }> {
    if (!file) throw new Error('No file provided for upload.');

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
      console.error('Storage upload error:', uploadError);
      throw new Error(`Photo upload failed: ${uploadError.message}`);
    }

    // Generate signed URL for immediate secure private preview
    const { data: signedData, error: signedError } = await supabase.storage
      .from('student-photos')
      .createSignedUrl(filePath, 3600);

    if (signedError || !signedData?.signedUrl) {
      throw new Error('Failed to generate secure preview URL for uploaded photo.');
    }

    return {
      path: filePath,
      signedUrl: signedData.signedUrl,
    };
  },

  /**
   * Register a new student via the secure Edge Function
   */
  async registerStudent(input: StudentRegistrationInput): Promise<RegistrationResult> {
    const { data, error } = await supabase.functions.invoke<RegistrationResult>('register-student', {
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        fullName: input.fullName.trim(),
        fatherName: input.fatherName.trim(),
        cnic: input.cnic.trim(),
        phone: input.phone.trim(),
        targetForceId: input.targetForceId,
        targetCourseId: input.targetCourseId,
        batchId: input.batchId,
        rollNumber: input.rollNumber.trim().toUpperCase(),
        education: input.education.trim(),
        educationDetails: input.educationDetails?.trim() || null,
        gender: input.gender || 'Male',
        dateOfBirth: input.dateOfBirth || null,
        alternatePhone: input.alternatePhone?.trim() || null,
        address: input.address?.trim() || null,
        guardianName: input.guardianName?.trim() || null,
        guardianRelationship: input.guardianRelationship || 'Father',
        guardianPhone: input.guardianPhone?.trim() || null,
        admissionDate: input.admissionDate || new Date().toISOString().split('T')[0],
        status: input.status || 'ACTIVE',
        notes: input.notes?.trim() || null,
        photoUrl: input.photoUrl || null,
      },
    });

    if (error) {
      console.error('Edge Function registration error:', error);
      throw new Error(error.message || 'Registration failed. Please try again.');
    }

    if (!data || !data.success) {
      throw new Error('Student registration failed on academy server.');
    }

    return data;
  },
};
