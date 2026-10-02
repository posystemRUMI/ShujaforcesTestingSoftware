import { createClient } from '@supabase/supabase-js';
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

    // 1. Resolve target force code
    let forceCode = forceId;
    const officialMatched = OFFICIAL_FORCES.find((f) => f.id === forceId || f.code === forceId);
    if (officialMatched) {
      forceCode = officialMatched.code;
    } else {
      try {
        const { data: dbForce } = await supabase
          .from('forces')
          .select('code')
          .eq('id', forceId)
          .maybeSingle();
        if (dbForce?.code) {
          forceCode = dbForce.code;
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
        .eq('force_id', forceId)
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
   * Register a new student via Edge Function with direct Auth+RPC fallback
   */
  async registerStudent(input: StudentRegistrationInput): Promise<RegistrationResult> {
    const payload = {
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
    };

    // 1. Try Edge Function
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke<RegistrationResult>('register-student', {
        body: payload,
        headers,
      });

      if (!error && data && data.success) {
        if (data.studentId) {
          await setupInitialFeeAccountAndPayment(data.studentId, input);
        }
        return data;
      }

      if (error) {
        const errObj = error as any;
        if (errObj.context && typeof errObj.context.json === 'function') {
          try {
            const body = await errObj.context.json();
            if (body?.error) {
              const errMsg = String(body.error);
              if (errMsg.includes('DUPLICATE_ENTRY') || errMsg.includes('BAD_REQUEST') || errMsg.includes('FORBIDDEN')) {
                throw new Error(errMsg);
              }
              console.warn('Edge function error, attempting DB fallback:', errMsg);
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && (jsonErr.message.includes('DUPLICATE_ENTRY') || jsonErr.message.includes('BAD_REQUEST') || jsonErr.message.includes('FORBIDDEN'))) {
              throw jsonErr;
            }
          }
        }
      }
    } catch (edgeErr: any) {
      if (
        edgeErr.message &&
        (edgeErr.message.includes('DUPLICATE_ENTRY') ||
         edgeErr.message.includes('BAD_REQUEST') ||
         edgeErr.message.includes('FORBIDDEN'))
      ) {
        throw edgeErr;
      }
      console.warn('Edge Function invocation failed, trying direct Auth/RPC creation:', edgeErr?.message);
    }

    // 2. Direct Auth + DB RPC fallback (For local development / single-tier runtime)
    const DEFAULT_SUPABASE_URL = 'https://cxnfxxtlnsypajwqmfni.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bmZ4eHRsbnN5cGFqd3FtZm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDkyMDIsImV4cCI6MjEwNDcyNTIwMn0.P8OK8zbLqYcObqqIoVnmsmKOnehiJ23a-Txa6R1dqKo';

    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

    const memoryStore = new Map<string, string>();
    const safeStorage: Storage = {
      getItem: (k: string) => memoryStore.get(k) ?? null,
      setItem: (k: string, v: string) => { memoryStore.set(k, v); },
      removeItem: (k: string) => { memoryStore.delete(k); },
      clear: () => { memoryStore.clear(); },
      length: memoryStore.size,
      key: (i: number) => Array.from(memoryStore.keys())[i] ?? null,
    };

    const tempAnon = createClient(envUrl, envAnon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: safeStorage,
      },
    });

    const { data: signUpData, error: signUpError } = await tempAnon.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          role: 'STUDENT',
          display_name: payload.fullName,
          phone: payload.phone,
          avatar_url: payload.photoUrl,
        },
      },
    });

    if (signUpError || !signUpData?.user) {
      const msg = signUpError?.message || '';
      if (msg.toLowerCase().includes('rate limit')) {
        throw new Error('Email rate limit exceeded by Supabase Auth (Default SMTP allows 3-4 signups/hour). Disable "Confirm email" in Supabase Auth settings to bypass this limit.');
      }
      throw new Error(msg || 'Failed to create student authentication record.');
    }

    const createdAuthId = signUpData.user.id;
    let result: RegistrationResult;

    let rpcData: any = null;
    let rpcError: any = null;

    try {
      if (supabase && typeof (supabase as any).rpc === 'function') {
        const res = await (supabase as any).rpc('create_registered_student_profile', {
          p_auth_user_id: createdAuthId,
          p_email: payload.email,
          p_display_name: payload.fullName,
          p_father_name: payload.fatherName,
          p_cnic: payload.cnic,
          p_phone: payload.phone,
          p_target_force_id: payload.targetForceId,
          p_target_course_id: payload.targetCourseId,
          p_batch_id: payload.batchId || null,
          p_roll_number: payload.rollNumber,
          p_education: payload.education,
          p_education_details: payload.educationDetails,
          p_gender: payload.gender,
          p_date_of_birth: payload.dateOfBirth || null,
          p_alternate_phone: payload.alternatePhone || null,
          p_address: payload.address || null,
          p_guardian_name: payload.guardianName || null,
          p_guardian_relationship: payload.guardianRelationship || null,
          p_guardian_phone: payload.guardianPhone || null,
          p_admission_date: payload.admissionDate || new Date().toISOString().split('T')[0],
          p_status: payload.status || 'ACTIVE',
          p_notes: payload.notes || null,
          p_photo_url: payload.photoUrl || null,
        });
        rpcData = res.data;
        rpcError = res.error;
      } else {
        rpcError = new Error('RPC client unavailable');
      }
    } catch (e: any) {
      rpcError = e;
    }

    let studentId = createdAuthId;

    if (rpcError || !rpcData || !(rpcData.studentId || rpcData.student_id)) {
      console.warn('RPC create_registered_student_profile unavailable/failed, executing direct DB table insertion fallback:', rpcError);

      try {
        await (supabase as any).from('profiles').upsert({
          id: createdAuthId,
          email: payload.email,
          display_name: payload.fullName,
          phone: payload.phone,
          role: 'STUDENT',
          avatar_url: payload.photoUrl || null,
        });
      } catch (pErr) {
        console.warn('Direct profile upsert warning:', pErr);
      }

      try {
        const { data: stdData } = await (supabase as any).from('students').insert({
          profile_id: createdAuthId,
          roll_number: payload.rollNumber,
          father_name: payload.fatherName,
          cnic: payload.cnic,
          target_force_id: payload.targetForceId,
          target_course_id: payload.targetCourseId,
          batch_id: payload.batchId || null,
          education: payload.education,
          education_details: payload.educationDetails,
          gender: payload.gender,
          date_of_birth: payload.dateOfBirth || null,
          alternate_phone: payload.alternatePhone || null,
          address: payload.address || null,
          guardian_name: payload.guardianName || null,
          guardian_relationship: payload.guardianRelationship || null,
          guardian_phone: payload.guardianPhone || null,
          admission_date: payload.admissionDate || new Date().toISOString().split('T')[0],
          status: payload.status || 'ACTIVE',
          notes: payload.notes || null,
          photo_url: payload.photoUrl || null,
        }).select('id').single();

        if (stdData?.id) studentId = stdData.id;
      } catch (sErr) {
        console.warn('Direct student insert warning:', sErr);
      }

      // Store in local studentStore so cadet is immediately listed across roster and login
      try {
        const { studentStore } = await import('@/features/students/studentStore');
        const forcesList = await studentRegistrationService.getActiveForces();
        const forceObj = forcesList.find((f) => f.id === payload.targetForceId);
        const coursesList = await studentRegistrationService.getCoursesForForce(payload.targetForceId);
        const courseObj = coursesList.find((c) => c.id === payload.targetCourseId);

        studentStore.create({
          rollNumber: payload.rollNumber,
          fullName: payload.fullName,
          fatherName: payload.fatherName,
          cnic: payload.cnic,
          phone: payload.phone,
          branch: (forceObj?.code || 'PAKISTAN_ARMY') as any,
          batchId: '',
          batchCode: '',
          targetCourse: courseObj?.name || 'Entry Course',
          status: (payload.status || 'ACTIVE') as any,
          avatarUrl: payload.photoUrl || undefined,
          dateOfBirth: payload.dateOfBirth || undefined,
          gender: payload.gender,
        });
      } catch (storeErr) {
        console.warn('Failed to sync student to local store:', storeErr);
      }

      result = {
        success: true,
        profileId: createdAuthId,
        studentId: studentId,
        rollNumber: payload.rollNumber,
        email: payload.email,
        displayName: payload.fullName,
      };
    } else {
      result = rpcData as RegistrationResult;
    }

    if (result && (result.studentId || (result as any).student_id)) {
      const sid = result.studentId || (result as any).student_id;
      await setupInitialFeeAccountAndPayment(sid, input);
    }

    return result;
  },
};

async function setupInitialFeeAccountAndPayment(studentId: string, input: StudentRegistrationInput) {
  if (!studentId || !input.courseFeeAmount || input.courseFeeAmount <= 0) return;

  try {
    const { data: feeAcc, error: feeErr } = await supabase
      .from('student_fee_accounts')
      .insert({
        student_id: studentId,
        course_id: input.targetCourseId,
        batch_id: input.batchId,
        fee_type: 'ADMISSION & TUITION FEE',
        fee_year: new Date().getFullYear(),
        fee_month: new Date().getMonth() + 1,
        fee_period: `${new Date().getFullYear()} Session`,
        amount_due: input.courseFeeAmount,
        discount_amount: 0,
        fine_amount: 0,
        amount_paid: 0,
        status: 'UNPAID',
      })
      .select('id')
      .single();

    if (!feeErr && feeAcc && input.initialPaymentAmount && input.initialPaymentAmount > 0) {
      const { financeService } = await import('@/services/financeService');
      await financeService.recordStudentFeePayment({
        studentId,
        feeAccountId: feeAcc.id,
        amount: input.initialPaymentAmount,
        paymentMethod: input.paymentMethod || 'CASH',
        notes: 'Initial course fee payment recorded during student registration',
      });
    }
  } catch (err) {
    console.warn('Initial fee setup error:', err);
  }
}
