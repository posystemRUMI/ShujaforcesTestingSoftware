-- ============================================================================
-- Migration: 20260908120000_student_registration_fields.sql
-- Description: Student Registration Module Extensions:
--              1. Additional columns on public.students
--              2. 'student-photos' storage bucket & RLS policies
--              3. Atomic compound RPC 'public.register_student' with
--                 strict role checks, validations, auth creation,
--                 batch enrollment, and audit logging.
--              4. Uniqueness check helper functions
-- Author: Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD ADDITIONAL COLUMNS TO public.students
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

-- ----------------------------------------------------------------------------
-- 2. CREATE 'student-photos' STORAGE BUCKET & RLS POLICIES
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-photos',
  'student-photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for 'student-photos'
DO $$ BEGIN
  DROP POLICY IF EXISTS "student_photos_select" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_insert" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_update" ON storage.objects;
  DROP POLICY IF EXISTS "student_photos_staff_delete" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "student_photos_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'student-photos');

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

-- ----------------------------------------------------------------------------
-- 3. AVAILABILITY CHECK HELPER RPC FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_roll_number_exists(p_roll_number TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
BEGIN
  IF p_cnic IS NULL OR trim(p_cnic) = '' THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.students
    WHERE trim(cnic) = trim(p_cnic)
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
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(trim(email)) = lower(trim(p_email))
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. ATOMIC COMPOUND REGISTRATION RPC: public.register_student
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_student(
  p_email TEXT,
  p_password TEXT,
  p_display_name TEXT,
  p_father_name TEXT,
  p_cnic TEXT,
  p_phone TEXT,
  p_target_force_id UUID,
  p_target_course_id UUID,
  p_roll_number TEXT,
  p_alternate_phone TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender TEXT DEFAULT 'Male',
  p_education TEXT DEFAULT NULL,
  p_education_details TEXT DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_guardian_name TEXT DEFAULT NULL,
  p_guardian_relationship TEXT DEFAULT NULL,
  p_guardian_phone TEXT DEFAULT NULL,
  p_admission_date DATE DEFAULT CURRENT_DATE,
  p_status TEXT DEFAULT 'ACTIVE',
  p_notes TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_student_id UUID;
  v_clean_email TEXT;
  v_clean_roll TEXT;
  v_clean_cnic TEXT;
  v_clean_phone TEXT;
BEGIN
  -- 1. Authorization Check: Admin or Teacher only
  IF NOT (public.is_admin() OR public.is_teacher() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only administrators and teachers can register students.';
  END IF;

  -- 2. Input Normalization & Cleansing
  v_clean_email := lower(trim(p_email));
  v_clean_roll := upper(trim(p_roll_number));
  v_clean_cnic := NULLIF(trim(p_cnic), '');
  v_clean_phone := trim(p_phone);

  -- 3. Field Validations
  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Login email is required.';
  END IF;

  IF v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Invalid email address format: %', v_clean_email;
  END IF;

  IF p_password IS NULL OR length(p_password) < 4 THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Password must be at least 4 characters.';
  END IF;

  IF trim(p_display_name) IS NULL OR trim(p_display_name) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Candidate full name is required.';
  END IF;

  IF trim(p_father_name) IS NULL OR trim(p_father_name) = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Father name is required.';
  END IF;

  IF v_clean_roll IS NULL OR v_clean_roll = '' THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Cadet roll number is required.';
  END IF;

  -- 4. Uniqueness Verifications
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_clean_email) THEN
    RAISE EXCEPTION 'DUPLICATE_EMAIL: A user account with email % already exists.', v_clean_email;
  END IF;

  IF EXISTS (SELECT 1 FROM public.students WHERE upper(roll_number) = v_clean_roll) THEN
    RAISE EXCEPTION 'DUPLICATE_ROLL_NUMBER: Cadet roll number % is already assigned.', v_clean_roll;
  END IF;

  IF v_clean_cnic IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.students WHERE cnic = v_clean_cnic) THEN
      RAISE EXCEPTION 'DUPLICATE_CNIC: A cadet with CNIC % is already registered.', v_clean_cnic;
    END IF;
  END IF;

  -- 5. Foreign Key & Hierarchy Verification
  IF NOT EXISTS (SELECT 1 FROM public.forces WHERE id = p_target_force_id AND status = 'ACTIVE') THEN
    RAISE EXCEPTION 'INVALID_FORCE: Selected force does not exist or is inactive.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = p_target_course_id
      AND force_id = p_target_force_id
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'INVALID_COURSE: Selected course does not belong to the selected force or is inactive.';
  END IF;

  IF p_batch_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.batches
      WHERE id = p_batch_id
        AND course_id = p_target_course_id
    ) THEN
      RAISE EXCEPTION 'INVALID_BATCH: Selected batch does not belong to the target course.';
    END IF;
  END IF;

  -- 6. Generate UUID and Create auth.users Record
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_clean_email,
    crypt(p_password, gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'role', 'STUDENT',
      'display_name', trim(p_display_name),
      'phone', v_clean_phone,
      'avatar_url', p_photo_url
    ),
    now(),
    now()
  );

  -- 7. Insert Identity in auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id::text,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- 8. Upsert Profile (Forcing role = 'STUDENT')
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
    v_user_id,
    'STUDENT'::public.app_role,
    trim(p_display_name),
    v_clean_email,
    v_clean_phone,
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

  -- 9. Insert Student Record
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
    v_user_id,
    v_clean_roll,
    trim(p_father_name),
    v_clean_cnic,
    p_date_of_birth,
    COALESCE(p_gender, 'Male'),
    p_education,
    p_education_details,
    p_target_force_id,
    p_target_course_id,
    COALESCE(p_status, 'ACTIVE')::public.student_status,
    p_alternate_phone,
    p_address,
    p_guardian_name,
    p_guardian_relationship,
    p_guardian_phone,
    COALESCE(p_admission_date, CURRENT_DATE),
    p_notes,
    p_photo_url,
    auth.uid()
  )
  RETURNING id INTO v_student_id;

  -- 10. Optional Batch Enrollment
  IF p_batch_id IS NOT NULL THEN
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
  END IF;

  -- 11. Structured Audit Log
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
      'registered_by', auth.uid()
    )
  );

  -- 12. Return Result Payload
  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'profile_id', v_user_id,
    'roll_number', v_clean_roll,
    'email', v_clean_email,
    'display_name', trim(p_display_name)
  );
END;
$$;
