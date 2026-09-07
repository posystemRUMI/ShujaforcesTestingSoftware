-- ============================================================================
-- Migration: 20260908120000_student_registration_fields.sql
-- Description: Student Registration Module Hardening:
--              1. Extended columns on public.students
--              2. Private 'student-photos' storage bucket & strict RLS
--              3. Canonical normalization functions (CNIC, Phone)
--              4. Security-definer role-gated availability check RPCs
--              5. Atomic compound RPC 'public.create_registered_student_profile'
--                 (NO direct SQL auth.users/auth.identities inserts)
-- Author: Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTEND public.students COLUMNS
-- ----------------------------------------------------------------------------
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'MALE', 'FEMALE')),
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS education_details TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS admission_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_created_by ON public.students(created_by);
CREATE INDEX IF NOT EXISTS idx_students_gender ON public.students(gender);

-- Ensure batch enrollments cascade upon student deletion
ALTER TABLE public.batch_enrollments
  DROP CONSTRAINT IF EXISTS batch_enrollments_student_id_fkey,
  ADD CONSTRAINT batch_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 2. PRIVATE 'student-photos' STORAGE BUCKET & STRICT RLS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-photos',
  'student-photos',
  false, -- STRICTLY PRIVATE
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  DROP POLICY IF EXISTS "student_photos_select" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_select" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_insert" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_update" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_delete" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_student_select" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Admin and Teacher: Full management of student photos
CREATE POLICY "student_photos_staff_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (public.is_admin() OR public.is_teacher())
  );

CREATE POLICY "student_photos_staff_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-photos'
    AND (public.is_admin() OR public.is_teacher())
  );

CREATE POLICY "student_photos_staff_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (public.is_admin() OR public.is_teacher())
  );

CREATE POLICY "student_photos_staff_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND (public.is_admin() OR public.is_teacher())
  );

-- Student: Can only read own photo
CREATE POLICY "student_photos_student_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-photos'
    AND public.is_student()
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 3. CANONICAL NORMALIZATION HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_cnic(p_cnic TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits TEXT;
BEGIN
  IF p_cnic IS NULL OR trim(p_cnic) = '' THEN
    RETURN NULL;
  END IF;

  v_digits := regexp_replace(p_cnic, '\D', '', 'g');

  IF length(v_digits) = 13 THEN
    RETURN substr(v_digits, 1, 5) || '-' || substr(v_digits, 6, 7) || '-' || substr(v_digits, 13, 1);
  END IF;

  RETURN trim(p_cnic);
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits TEXT;
BEGIN
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RETURN NULL;
  END IF;

  v_digits := regexp_replace(p_phone, '\D', '', 'g');

  IF length(v_digits) = 11 AND substr(v_digits, 1, 2) = '03' THEN
    RETURN '92' || substr(v_digits, 2);
  ELSIF length(v_digits) = 10 AND substr(v_digits, 1, 1) = '3' THEN
    RETURN '92' || v_digits;
  ELSIF length(v_digits) = 12 AND substr(v_digits, 1, 2) = '92' THEN
    RETURN v_digits;
  END IF;

  RETURN trim(p_phone);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. ROLE-GATED AVAILABILITY CHECK RPC FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_roll_number_exists(p_roll_number TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Access restricted to academy staff.';
  END IF;

  IF p_roll_number IS NULL OR trim(p_roll_number) = '' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.students
    WHERE upper(trim(roll_number)) = upper(trim(p_roll_number))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_cnic_exists(p_cnic TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_canonical_cnic TEXT;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Access restricted to academy staff.';
  END IF;

  v_canonical_cnic := public.normalize_cnic(p_cnic);
  IF v_canonical_cnic IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.students
    WHERE cnic = v_canonical_cnic
       OR public.normalize_cnic(cnic) = v_canonical_cnic
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Access restricted to academy staff.';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(trim(email)) = lower(trim(p_email))
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. SECURE DB RPC: public.create_registered_student_profile
--    (Called after Auth user is created via Supabase Admin API / Edge Function)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_registered_student_profile(
  p_auth_user_id UUID,
  p_email TEXT,
  p_display_name TEXT,
  p_father_name TEXT,
  p_cnic TEXT,
  p_phone TEXT,
  p_target_force_id UUID,
  p_target_course_id UUID,
  p_batch_id UUID, -- MANDATORY
  p_roll_number TEXT,
  p_education TEXT, -- MANDATORY
  p_education_details TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT 'Male',
  p_date_of_birth DATE DEFAULT NULL,
  p_alternate_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_guardian_name TEXT DEFAULT NULL,
  p_guardian_relationship TEXT DEFAULT NULL,
  p_guardian_phone TEXT DEFAULT NULL,
  p_admission_date DATE DEFAULT CURRENT_DATE,
  p_status TEXT DEFAULT 'ACTIVE',
  p_notes TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_creator_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_clean_email TEXT;
  v_clean_roll TEXT;
  v_norm_cnic TEXT;
  v_norm_phone TEXT;
  v_norm_alt_phone TEXT;
  v_norm_guardian_phone TEXT;
  v_effective_creator UUID;
BEGIN
  -- 1. Caller Authorization Check (Admin, Teacher, or service_role only)
  IF NOT (public.is_admin() OR public.is_teacher() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only administrators and teachers can register students.';
  END IF;

  -- 2. Validate Required References
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: auth_user_id is required.';
  END IF;

  IF p_batch_id IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Batch enrollment is mandatory.';
  END IF;

  IF p_education IS NULL OR trim(p_education) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Education qualification is mandatory.';
  END IF;

  IF trim(p_education) = 'Other' AND (p_education_details IS NULL OR trim(p_education_details) = '') THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Education details are required when Other is selected.';
  END IF;

  -- 3. Input Normalization
  v_clean_email := lower(trim(p_email));
  v_clean_roll := upper(trim(p_roll_number));
  v_norm_cnic := public.normalize_cnic(p_cnic);
  v_norm_phone := public.normalize_phone(p_phone);
  v_norm_alt_phone := public.normalize_phone(p_alternate_phone);
  v_norm_guardian_phone := public.normalize_phone(p_guardian_phone);
  v_effective_creator := COALESCE(p_creator_id, auth.uid());

  -- 4. Field Validations
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Login email is required.';
  END IF;

  IF trim(p_display_name) IS NULL OR trim(p_display_name) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Student full name is required.';
  END IF;

  IF trim(p_father_name) IS NULL OR trim(p_father_name) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Father name is required.';
  END IF;

  IF v_clean_roll IS NULL OR v_clean_roll = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Roll number is required.';
  END IF;

  IF v_norm_cnic IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Valid Pakistani CNIC is required.';
  END IF;

  -- 5. Uniqueness Verifications
  IF EXISTS (SELECT 1 FROM public.students WHERE upper(roll_number) = v_clean_roll) THEN
    RAISE EXCEPTION 'DUPLICATE_ROLL_NUMBER: Cadet roll number % is already assigned.', v_clean_roll;
  END IF;

  IF EXISTS (SELECT 1 FROM public.students WHERE cnic = v_norm_cnic OR public.normalize_cnic(cnic) = v_norm_cnic) THEN
    RAISE EXCEPTION 'DUPLICATE_CNIC: A cadet with CNIC % is already registered.', v_norm_cnic;
  END IF;

  -- 6. Foreign Key & Hierarchy Verification
  IF NOT EXISTS (SELECT 1 FROM public.forces WHERE id = p_target_force_id AND status = 'ACTIVE') THEN
    RAISE EXCEPTION 'INVALID_FORCE: Selected force does not exist or is inactive.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = p_target_course_id
      AND force_id = p_target_force_id
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'INVALID_COURSE: Selected course does not belong to the target force or is inactive.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.batches
    WHERE id = p_batch_id
      AND course_id = p_target_course_id
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'INVALID_BATCH: Selected batch does not belong to the target course or is inactive.';
  END IF;

  -- 7. Upsert Profile (Forcing role = 'STUDENT')
  INSERT INTO public.profiles (
    id,
    role,
    display_name,
    email,
    phone,
    avatar_url,
    status
  )
  VALUES (
    p_auth_user_id,
    'STUDENT'::public.app_role,
    trim(p_display_name),
    v_clean_email,
    v_norm_phone,
    p_photo_url,
    COALESCE(p_status, 'ACTIVE')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'STUDENT'::public.app_role,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    status = EXCLUDED.status,
    updated_at = now();

  -- 8. Insert Student Docket
  INSERT INTO public.students (
    profile_id,
    roll_number,
    father_name,
    cnic,
    date_of_birth,
    gender,
    education,
    education_details,
    target_force_id,
    target_course_id,
    status,
    alternate_phone,
    address,
    guardian_name,
    guardian_relationship,
    guardian_phone,
    admission_date,
    notes,
    photo_url,
    created_by
  )
  VALUES (
    p_auth_user_id,
    v_clean_roll,
    trim(p_father_name),
    v_norm_cnic,
    p_date_of_birth,
    COALESCE(p_gender, 'Male'),
    trim(p_education),
    p_education_details,
    p_target_force_id,
    p_target_course_id,
    COALESCE(p_status, 'ACTIVE')::public.student_status,
    v_norm_alt_phone,
    p_address,
    p_guardian_name,
    p_guardian_relationship,
    v_norm_guardian_phone,
    COALESCE(p_admission_date, CURRENT_DATE),
    p_notes,
    p_photo_url,
    v_effective_creator
  )
  RETURNING id INTO v_student_id;

  -- 9. Mandatory Batch Enrollment
  INSERT INTO public.batch_enrollments (
    batch_id,
    student_id,
    status
  )
  VALUES (
    p_batch_id,
    v_student_id,
    'ACTIVE'
  )
  ON CONFLICT (batch_id, student_id) DO NOTHING;

  -- 10. Structured Audit Logging
  PERFORM public.log_audit_event(
    'STUDENT_REGISTERED',
    'STUDENT',
    v_student_id::TEXT,
    jsonb_build_object(
      'roll_number', v_clean_roll,
      'email', v_clean_email,
      'display_name', trim(p_display_name),
      'target_force_id', p_target_force_id,
      'target_course_id', p_target_course_id,
      'batch_id', p_batch_id,
      'created_by', v_effective_creator
    )
  );

  -- 11. Return Payload
  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'profile_id', p_auth_user_id,
    'roll_number', v_clean_roll,
    'email', v_clean_email,
    'display_name', trim(p_display_name)
  );
END;
$$;
