-- ============================================================================
-- Migration: 20260906100007_seed_requested_users.sql
-- Description: Deterministic Foundation Seed for the 9 Real Academy Users:
--              1. a@gmail.com (ADMIN)
--              2. s1@gmail.com ... s5@gmail.com (STUDENT)
--              3. t1@gmail.com ... t3@gmail.com (TEACHER)
--              All passwords set to: 1234
-- Author: Antigravity
-- ============================================================================

DO $$
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
  
  v_teacher1_id UUID := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_teacher2_id UUID := 'e0000000-0000-0000-0000-000000000002'::uuid;
  v_teacher3_id UUID := 'e0000000-0000-0000-0000-000000000003'::uuid;

  v_student1_id UUID := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_student2_id UUID := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_student3_id UUID := 'b0000000-0000-0000-0000-000000000003'::uuid;
  v_student4_id UUID := 'b0000000-0000-0000-0000-000000000004'::uuid;
  v_student5_id UUID := 'b0000000-0000-0000-0000-000000000005'::uuid;

  v_army_force_id UUID := '10000000-0000-0000-0000-000000000001'::uuid;
  v_paf_force_id  UUID := '10000000-0000-0000-0000-000000000002'::uuid;
  v_navy_force_id UUID := '10000000-0000-0000-0000-000000000003'::uuid;

  v_pma_course_id UUID := '20000000-0000-0000-0000-000000000001'::uuid;
  v_gdp_course_id UUID := '20000000-0000-0000-0000-000000000002'::uuid;

  v_batch_alpha_id UUID := '40000000-0000-0000-0000-000000000001'::uuid;
  v_batch_bravo_id UUID := '40000000-0000-0000-0000-000000000002'::uuid;
  v_batch_gdp_id   UUID := '40000000-0000-0000-0000-000000000003'::uuid;

  v_student_pk UUID;
BEGIN
  -- --------------------------------------------------------------------------
  -- 0. Clean up any historical dummy / demo users from auth.users and profiles
  -- --------------------------------------------------------------------------
  DELETE FROM auth.users WHERE email NOT IN (
    'a@gmail.com',
    's1@gmail.com', 's2@gmail.com', 's3@gmail.com', 's4@gmail.com', 's5@gmail.com',
    't1@gmail.com', 't2@gmail.com', 't3@gmail.com'
  );

  DELETE FROM public.profiles WHERE email NOT IN (
    'a@gmail.com',
    's1@gmail.com', 's2@gmail.com', 's3@gmail.com', 's4@gmail.com', 's5@gmail.com',
    't1@gmail.com', 't2@gmail.com', 't3@gmail.com'
  );

  -- --------------------------------------------------------------------------
  -- 1. Ensure Forces exist
  -- --------------------------------------------------------------------------
  INSERT INTO public.forces (id, code, name, description, motto, headquarters, sort_order)
  VALUES
    (v_army_force_id, 'PAKISTAN_ARMY', 'Pakistan Army', 'Primary land warfare branch.', 'Iman, Taqwa, Jihad fi Sabilillah', 'GHQ Rawalpindi', 1),
    (v_paf_force_id, 'PAKISTAN_AIR_FORCE', 'Pakistan Air Force', 'Aerial warfare branch.', 'Sehraast ke Daryaast Tah-e-Bal-o-Par-e-Maast', 'AHQ Islamabad', 2),
    (v_navy_force_id, 'PAKISTAN_NAVY', 'Pakistan Navy', 'Naval warfare branch.', 'Himmat-e-Mardan, Madad-e-Khuda', 'NHQ Islamabad', 3)
  ON CONFLICT (code) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 2. Ensure Courses exist
  -- --------------------------------------------------------------------------
  INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
  VALUES
    (v_pma_course_id, v_army_force_id, 'PMA_LONG_COURSE', 'PMA Long Course (154 LC)', 'Regular Commission cadet training at PMA Kakul.', 104, 1),
    (v_gdp_course_id, v_paf_force_id, 'GDP', 'General Duty Pilot (GDP 158)', 'Commissioned pilot training at PAF Academy Risalpur.', 156, 2)
  ON CONFLICT (code) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 3. Ensure Batches exist
  -- --------------------------------------------------------------------------
  INSERT INTO public.batches (id, code, name, course_id, session_name, start_date, end_date, status, max_cadets)
  VALUES
    (v_batch_alpha_id, '154-PMA-ALPHA', 'PMA 154 Long Course Alpha Wing', v_pma_course_id, 'Spring 2026 Intake', '2026-01-15', '2026-06-30', 'ACTIVE', 60),
    (v_batch_bravo_id, '154-PMA-BRAVO', 'PMA 154 Long Course Bravo Wing', v_pma_course_id, 'Spring 2026 Intake', '2026-02-01', '2026-07-15', 'ACTIVE', 60),
    (v_batch_gdp_id,   '158-GDP-ALPHA', '158 GDP Alpha Squadron',        v_gdp_course_id, 'Spring 2026 Intake', '2026-01-10', '2026-07-01', 'ACTIVE', 45)
  ON CONFLICT (code) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 4. ADMIN USER (a@gmail.com / 1234)
  -- --------------------------------------------------------------------------
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'a@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"ADMIN","display_name":"Administrator"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 'a@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"ADMIN","display_name":"Administrator"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_admin_id, 'ADMIN', 'Administrator', 'a@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN', display_name = 'Administrator', email = 'a@gmail.com', status = 'ACTIVE';

  -- --------------------------------------------------------------------------
  -- 5. TEACHER USERS (t1, t2, t3 / 1234)
  -- --------------------------------------------------------------------------
  -- Teacher 1
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_teacher1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    't1@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"TEACHER","display_name":"Teacher 1"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 't1@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"TEACHER","display_name":"Teacher 1"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_teacher1_id, 'TEACHER', 'Teacher 1', 't1@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'TEACHER', display_name = 'Teacher 1', email = 't1@gmail.com', status = 'ACTIVE';

  INSERT INTO public.teachers (profile_id, service_number, rank, branch_code, role_title)
  VALUES (v_teacher1_id, 'TCH-001', 'Instructor', 'PAKISTAN_ARMY', 'FACULTY')
  ON CONFLICT (profile_id) DO UPDATE SET
    service_number = 'TCH-001', rank = 'Instructor', branch_code = 'PAKISTAN_ARMY';

  -- Teacher 2
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_teacher2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    't2@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"TEACHER","display_name":"Teacher 2"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 't2@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"TEACHER","display_name":"Teacher 2"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_teacher2_id, 'TEACHER', 'Teacher 2', 't2@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'TEACHER', display_name = 'Teacher 2', email = 't2@gmail.com', status = 'ACTIVE';

  INSERT INTO public.teachers (profile_id, service_number, rank, branch_code, role_title)
  VALUES (v_teacher2_id, 'TCH-002', 'Senior Instructor', 'PAKISTAN_AIR_FORCE', 'SENIOR_FACULTY')
  ON CONFLICT (profile_id) DO UPDATE SET
    service_number = 'TCH-002', rank = 'Senior Instructor', branch_code = 'PAKISTAN_AIR_FORCE';

  -- Teacher 3
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_teacher3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    't3@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"TEACHER","display_name":"Teacher 3"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 't3@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"TEACHER","display_name":"Teacher 3"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_teacher3_id, 'TEACHER', 'Teacher 3', 't3@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'TEACHER', display_name = 'Teacher 3', email = 't3@gmail.com', status = 'ACTIVE';

  INSERT INTO public.teachers (profile_id, service_number, rank, branch_code, role_title)
  VALUES (v_teacher3_id, 'TCH-003', 'Chief Instructor', 'PAKISTAN_NAVY', 'CHIEF_INSTRUCTOR')
  ON CONFLICT (profile_id) DO UPDATE SET
    service_number = 'TCH-003', rank = 'Chief Instructor', branch_code = 'PAKISTAN_NAVY';

  -- --------------------------------------------------------------------------
  -- 6. STUDENT USERS (s1 ... s5 / 1234)
  -- --------------------------------------------------------------------------
  -- Student 1
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_student1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    's1@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Student 1"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 's1@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"STUDENT","display_name":"Student 1"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student1_id, 'STUDENT', 'Student 1', 's1@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'STUDENT', display_name = 'Student 1', email = 's1@gmail.com', status = 'ACTIVE';

  INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id, status)
  VALUES (v_student1_id, 'SFA-001', 'Father 1', '35201-0000001-1', v_army_force_id, v_pma_course_id, 'ACTIVE')
  ON CONFLICT (profile_id) DO UPDATE SET
    roll_number = 'SFA-001', target_force_id = v_army_force_id, target_course_id = v_pma_course_id, status = 'ACTIVE'
  RETURNING id INTO v_student_pk;

  IF v_student_pk IS NULL THEN
    SELECT id INTO v_student_pk FROM public.students WHERE profile_id = v_student1_id;
  END IF;
  INSERT INTO public.batch_enrollments (batch_id, student_id, status)
  VALUES (v_batch_alpha_id, v_student_pk, 'ACTIVE')
  ON CONFLICT DO NOTHING;

  -- Student 2
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_student2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    's2@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Student 2"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 's2@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"STUDENT","display_name":"Student 2"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student2_id, 'STUDENT', 'Student 2', 's2@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'STUDENT', display_name = 'Student 2', email = 's2@gmail.com', status = 'ACTIVE';

  INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id, status)
  VALUES (v_student2_id, 'SFA-002', 'Father 2', '35201-0000002-2', v_army_force_id, v_pma_course_id, 'ACTIVE')
  ON CONFLICT (profile_id) DO UPDATE SET
    roll_number = 'SFA-002', target_force_id = v_army_force_id, target_course_id = v_pma_course_id, status = 'ACTIVE'
  RETURNING id INTO v_student_pk;

  IF v_student_pk IS NULL THEN
    SELECT id INTO v_student_pk FROM public.students WHERE profile_id = v_student2_id;
  END IF;
  INSERT INTO public.batch_enrollments (batch_id, student_id, status)
  VALUES (v_batch_alpha_id, v_student_pk, 'ACTIVE')
  ON CONFLICT DO NOTHING;

  -- Student 3
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_student3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    's3@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Student 3"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 's3@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"STUDENT","display_name":"Student 3"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student3_id, 'STUDENT', 'Student 3', 's3@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'STUDENT', display_name = 'Student 3', email = 's3@gmail.com', status = 'ACTIVE';

  INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id, status)
  VALUES (v_student3_id, 'SFA-003', 'Father 3', '35201-0000003-3', v_army_force_id, v_pma_course_id, 'ACTIVE')
  ON CONFLICT (profile_id) DO UPDATE SET
    roll_number = 'SFA-003', target_force_id = v_army_force_id, target_course_id = v_pma_course_id, status = 'ACTIVE'
  RETURNING id INTO v_student_pk;

  IF v_student_pk IS NULL THEN
    SELECT id INTO v_student_pk FROM public.students WHERE profile_id = v_student3_id;
  END IF;
  INSERT INTO public.batch_enrollments (batch_id, student_id, status)
  VALUES (v_batch_bravo_id, v_student_pk, 'ACTIVE')
  ON CONFLICT DO NOTHING;

  -- Student 4
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_student4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    's4@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Student 4"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 's4@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"STUDENT","display_name":"Student 4"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student4_id, 'STUDENT', 'Student 4', 's4@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'STUDENT', display_name = 'Student 4', email = 's4@gmail.com', status = 'ACTIVE';

  INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id, status)
  VALUES (v_student4_id, 'SFA-004', 'Father 4', '35201-0000004-4', v_paf_force_id, v_gdp_course_id, 'ACTIVE')
  ON CONFLICT (profile_id) DO UPDATE SET
    roll_number = 'SFA-004', target_force_id = v_paf_force_id, target_course_id = v_gdp_course_id, status = 'ACTIVE'
  RETURNING id INTO v_student_pk;

  IF v_student_pk IS NULL THEN
    SELECT id INTO v_student_pk FROM public.students WHERE profile_id = v_student4_id;
  END IF;
  INSERT INTO public.batch_enrollments (batch_id, student_id, status)
  VALUES (v_batch_gdp_id, v_student_pk, 'ACTIVE')
  ON CONFLICT DO NOTHING;

  -- Student 5
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_student5_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    's5@gmail.com', crypt('1234', gen_salt('bf', 10)), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"STUDENT","display_name":"Student 5"}'::jsonb,
    now(), now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = 's5@gmail.com',
    encrypted_password = crypt('1234', gen_salt('bf', 10)),
    raw_user_meta_data = '{"role":"STUDENT","display_name":"Student 5"}'::jsonb;

  INSERT INTO public.profiles (id, role, display_name, email, status)
  VALUES (v_student5_id, 'STUDENT', 'Student 5', 's5@gmail.com', 'ACTIVE')
  ON CONFLICT (id) DO UPDATE SET
    role = 'STUDENT', display_name = 'Student 5', email = 's5@gmail.com', status = 'ACTIVE';

  INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id, status)
  VALUES (v_student5_id, 'SFA-005', 'Father 5', '35201-0000005-5', v_paf_force_id, v_gdp_course_id, 'ACTIVE')
  ON CONFLICT (profile_id) DO UPDATE SET
    roll_number = 'SFA-005', target_force_id = v_paf_force_id, target_course_id = v_gdp_course_id, status = 'ACTIVE'
  RETURNING id INTO v_student_pk;

  IF v_student_pk IS NULL THEN
    SELECT id INTO v_student_pk FROM public.students WHERE profile_id = v_student5_id;
  END IF;
  INSERT INTO public.batch_enrollments (batch_id, student_id, status)
  VALUES (v_batch_gdp_id, v_student_pk, 'ACTIVE')
  ON CONFLICT DO NOTHING;

  -- --------------------------------------------------------------------------
  -- 7. Ensure token fields and GoTrue identities exist
  -- --------------------------------------------------------------------------
  UPDATE auth.users
  SET
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, '');

  DELETE FROM auth.identities WHERE user_id NOT IN (
    v_admin_id, v_teacher1_id, v_teacher2_id, v_teacher3_id,
    v_student1_id, v_student2_id, v_student3_id, v_student4_id, v_student5_id
  );

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  SELECT
    id, id, id::text,
    jsonb_build_object('sub', id::text, 'email', email),
    'email', now(), now(), now()
  FROM auth.users
  ON CONFLICT (id) DO UPDATE SET
    identity_data = jsonb_build_object('sub', EXCLUDED.id::text, 'email', EXCLUDED.identity_data->>'email');

END $$;
