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
    try {
      const { data } = await supabase
        .from('forces')
        .select('id, code, name, motto')
        .eq('status', 'ACTIVE')
        .order('sort_order', { ascending: true })
        .returns<ForceRow[]>();

      if (data && data.length > 0) {
        // Filter to only allowed official forces
        const allowedCodes = new Set(['PAKISTAN_ARMY', 'PAKISTAN_AIR_FORCE', 'PAKISTAN_NAVY']);
        const filtered = data.filter((f) => allowedCodes.has(f.code));
        if (filtered.length > 0) {
          return filtered.map((f: ForceRow) => ({
            id: f.id,
            code: f.code,
            name: f.name,
            motto: f.motto || undefined,
          }));
        }
      }
    } catch (e) {
      console.warn('DB forces query warning:', e);
    }

    const { OFFICIAL_FORCES } = await import('@/config/officialTestPatterns');
    return OFFICIAL_FORCES.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      motto: f.motto,
    }));
  },

  /**
   * Fetch active courses for a selected military force from database
   */
  async getCoursesForForce(forceId: string): Promise<CourseOption[]> {
    if (!forceId) return [];
    const { OFFICIAL_COURSES, OFFICIAL_FORCES, normalizeCourseCode } = await import('@/config/officialTestPatterns');

    // 1. Resolve target force code and target force UUID
    let forceCode = forceId;
    let forceUuid = forceId;
    const officialMatched = OFFICIAL_FORCES.find((f) => f.id === forceId || f.code === forceId);
    if (officialMatched) {
      forceCode = officialMatched.code;
      forceUuid = officialMatched.id;
    } else {
      try {
        const { data: dbForce } = await supabase
          .from('forces')
          .select('id, code')
          .eq('id', forceId)
          .maybeSingle();
        if (dbForce?.code) {
          forceCode = dbForce.code;
          forceUuid = dbForce.id;
        }
      } catch (e) {
        console.warn('Could not resolve force code from DB:', e);
      }
    }

    // 2. Target official course codes by force
    let targetOfficialCodes: string[] = [];
    if (forceCode.includes('ARMY')) {
      targetOfficialCodes = ['PMA_LONG_COURSE', 'AFNS'];
    } else if (forceCode.includes('AIR') || forceCode.includes('PAF')) {
      targetOfficialCodes = ['GDP_CAE', 'AIRMAN'];
    } else if (forceCode.includes('NAVY')) {
      targetOfficialCodes = ['SAILOR'];
    }

    // 3. Query DB courses first to match DB UUIDs where available
    let dbRows: CourseRow[] = [];
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, force_id, code, name, duration_weeks')
        .eq('force_id', forceUuid)
        .eq('status', 'ACTIVE')
        .order('sort_order', { ascending: true })
        .returns<CourseRow[]>();

      if (data && data.length > 0) {
        dbRows = data;
      }
    } catch (e) {
      console.warn('DB courses query warning:', e);
    }

    // 4. For each target official code, pick exactly 1 matching DB row OR static fallback
    const result: CourseOption[] = [];

    for (const code of targetOfficialCodes) {
      const dbMatch = dbRows.find((c) => {
        const norm = normalizeCourseCode(c.code || c.name);
        return norm === code;
      });

      if (dbMatch) {
        result.push({
          id: dbMatch.id,
          forceId: dbMatch.force_id,
          code: dbMatch.code || code,
          name: dbMatch.name,
          durationWeeks: dbMatch.duration_weeks || undefined,
        });
      } else {
        const staticMatch = OFFICIAL_COURSES.find((c) => c.code === code);
        if (staticMatch) {
          result.push({
            id: staticMatch.id,
            forceId: staticMatch.forceCode,
            code: staticMatch.code,
            name: staticMatch.name,
            durationWeeks: 12,
          });
        }
      }
    }

    return result;
  },

  /**
   * Fetch active batches for a selected course from database
   */
  async getBatchesForCourse(courseId: string): Promise<BatchOption[]> {
    if (!courseId || courseId.length !== 36) return [];

    const { data, error } = await supabase
      .from('batches')
      .select('id, course_id, code, name, session_name, status')
      .eq('course_id', courseId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .returns<BatchRow[]>();

    if (error) {
      console.error('Error fetching batches:', error);
      return [];
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
   * Register a new student via Edge Function with direct Auth+RPC fallback
   */
  async registerStudent(input: StudentRegistrationInput): Promise<RegistrationResult> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('An authenticated staff session is required.');
    const { data, error } = await supabase.functions.invoke<RegistrationResult>('register-student', {
      body: { ...input, email: input.email.trim().toLowerCase(), rollNumber: input.rollNumber.trim() },
      headers: { Authorization: 'Bearer ' + session.access_token },
    });
    if (error) {
      let message = error.message;
      const context = (error as any).context;
      if (context && typeof context.json === 'function') {
        try { const body = await context.json(); message = body.error || message; } catch { /* Keep the transport error. */ }
      }
      throw new Error(message);
    }
    if (!data?.success || !data.studentId) throw new Error('Registration did not return a saved student record.');
    return data;
  },
};
