-- ============================================================================
-- Migration: 20260906100007_seed_requested_users.sql
-- Description: Seed requested admin@gmail.com, teacher@gmail.com, and student@gmail.com accounts
-- Author: Antigravity
-- ============================================================================

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_teacher_id UUID := 'e0000000-0000-0000-0000-000000000003'::uuid;
  v_teacher2_id UUID := 'e0000000-0000-0000-0000-000000000004'::uuid;
  v_student_id UUID := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_student2_id UUID := 'b0000000-0000-0000-0000-000000000005'::uuid;
  v_force_id UUID;
  v_course_id UUID;
  v_batch_id UUID;
BEGIN
  -- Ensure default forces exist if running before seed.sql
  INSERT INTO public.forces (id, code, name, description, motto, headquarters, sort_order)
  VALUES
    ('10000000-0000-0000-0000-000000000001', 'PAKISTAN_ARMY', 'Pakistan Army', 'Primary land warfare branch.', 'Iman, Taqwa, Jihad fi Sabilillah', 'GHQ Rawalpindi', 1),
    ('10000000-0000-0000-0000-000000000002', 'PAKISTAN_AIR_FORCE', 'Pakistan Air Force', 'Aerial warfare branch.', 'Sehraast ke Daryaast Tah-e-Bal-o-Par-e-Maast', 'AHQ Islamabad', 2),
    ('10000000-0000-0000-0000-000000000003', 'PAKISTAN_NAVY', 'Pakistan Navy', 'Naval warfare branch.', 'Himmat-e-Mardan, Madad-e-Khuda', 'NHQ Islamabad', 3)
  ON CONFLICT (code) DO NOTHING;

  -- Ensure default courses exist
  INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
  VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PMA_LONG_COURSE', 'PMA Long Course (154 LC)', 'Regular Commission cadet training at PMA Kakul.', 104, 1)
  ON CONFLICT (code) DO NOTHING;

  -- Ensure default batch exists
  INSERT INTO public.batches (id, code, name, course_id, session_name, start_date, end_date, status, max_cadets)
  VALUES (
    '40000000-0000-0000-0000-000000000001',
    '154-PMA-ALPHA',
    'PMA 154 Long Course Alpha Wing',
    '20000000-0000-0000-0000-000000000001',
    'Spring 2026 Intake',
    '2026-01-15',
    '2026-06-30',
    'ACTIVE',
    60
  ) ON CONFLICT (code) DO NOTHING;

  -- Get default force, course, and batch IDs if available
  SELECT id INTO v_force_id FROM public.forces LIMIT 1;
  SELECT id INTO v_course_id FROM public.courses LIMIT 1;
  SELECT id INTO v_batch_id FROM public.batches LIMIT 1;

  -- 1. Create Admin User (admin@gmail.com / 12345678)
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
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@gmail.com',
    crypt('12345678', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"ADMIN","display_name":"System Admin"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET encrypted_password = crypt('12345678', gen_salt('bf', 10)),
      raw_user_meta_data = '{"role":"ADMIN","display_name":"System Admin"}'::jsonb;

  -- Ensure profile exists & has ADMIN role
  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_admin_id, 'ADMIN', 'System Admin', 'admin@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
  SET role = 'ADMIN', display_name = 'System Admin';

  -- 2. Create Teacher User (teacher@gmail.com / 12345678)
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
    v_teacher_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'teacher@gmail.com',
    crypt('12345678', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"TEACHER","display_name":"Faculty Officer"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET encrypted_password = crypt('12345678', gen_salt('bf', 10)),
      raw_user_meta_data = '{"role":"TEACHER","display_name":"Faculty Officer"}'::jsonb;

  -- Ensure profile exists & has TEACHER role
  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_teacher_id, 'TEACHER', 'Faculty Officer', 'teacher@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
  SET role = 'TEACHER', display_name = 'Faculty Officer';

  -- Create teacher record
  INSERT INTO public.teachers (profile_id, service_number, rank, branch_code, role_title)
  VALUES (v_teacher_id, 'FAC-PAF-102', 'Wing Commander', 'PAKISTAN_AIR_FORCE', 'SENIOR_FACULTY')
  ON CONFLICT (profile_id) DO NOTHING;

  -- 2b. Create Teacher User 2 (Teacher B: teacher2@gmail.com / 12345678)
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
    v_teacher2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'teacher2@gmail.com',
    crypt('12345678', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"TEACHER","display_name":"Faculty Officer 2"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET encrypted_password = crypt('12345678', gen_salt('bf', 10)),
      raw_user_meta_data = '{"role":"TEACHER","display_name":"Faculty Officer 2"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_teacher2_id, 'TEACHER', 'Faculty Officer 2', 'teacher2@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
  SET role = 'TEACHER', display_name = 'Faculty Officer 2';

  INSERT INTO public.teachers (profile_id, service_number, rank, branch_code, role_title)
  VALUES (v_teacher2_id, 'FAC-PAF-103', 'Squadron Leader', 'PAKISTAN_AIR_FORCE', 'FACULTY')
  ON CONFLICT (profile_id) DO NOTHING;

  -- 3. Create Student User (student@gmail.com / 12345678)
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
    v_student_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'student@gmail.com',
    crypt('12345678', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Student Cadet"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET encrypted_password = crypt('12345678', gen_salt('bf', 10)),
      raw_user_meta_data = '{"role":"STUDENT","display_name":"Student Cadet"}'::jsonb;

  -- Ensure profile exists & has STUDENT role
  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student_id, 'STUDENT', 'Student Cadet', 'student@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
  SET role = 'STUDENT', display_name = 'Student Cadet';

  -- Create student record if forces & courses exist
  IF v_force_id IS NOT NULL AND v_course_id IS NOT NULL THEN
    INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id)
    VALUES (v_student_id, 'PMA-2601', 'Tariq Mahmood', '35202-8941205-1', v_force_id, v_course_id)
    ON CONFLICT (profile_id) DO NOTHING;

    -- Add to batch if available
    IF v_batch_id IS NOT NULL THEN
      INSERT INTO public.batch_enrollments (batch_id, student_id)
      SELECT v_batch_id, s.id FROM public.students s WHERE s.profile_id = v_student_id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- 3b. Create Student User 2 (Student B: student2@gmail.com / 12345678) - Unassigned
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
    v_student2_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'student2@gmail.com',
    crypt('12345678', gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Cadet B (Unassigned)"}'::jsonb,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET encrypted_password = crypt('12345678', gen_salt('bf', 10)),
      raw_user_meta_data = '{"role":"STUDENT","display_name":"Cadet B (Unassigned)"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student2_id, 'STUDENT', 'Cadet B (Unassigned)', 'student2@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE
  SET role = 'STUDENT', display_name = 'Cadet B (Unassigned)';

  IF v_force_id IS NOT NULL AND v_course_id IS NOT NULL THEN
    INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id)
    VALUES (v_student2_id, 'PMA-2602', 'Nadeem Akhtar', '35202-8941205-2', v_force_id, v_course_id)
    ON CONFLICT (profile_id) DO NOTHING;
    -- Note: Student B is intentionally NOT enrolled in v_batch_id
  END IF;

  -- Ensure token fields are non-null strings so GoTrue scanner does not error
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '');

  -- Ensure identities exist for GoTrue auth lookup
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT
    id,
    id,
    id::text,
    jsonb_build_object('sub', id::text, 'email', email),
    'email',
    now(),
    now(),
    now()
  FROM auth.users
  ON CONFLICT DO NOTHING;

END $$;
