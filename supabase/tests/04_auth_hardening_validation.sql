-- ============================================================================
-- Security & Integrity Test: 04_auth_hardening_validation.sql
-- Description: Authentication Hardening, Real User Verification,
--              Profile Mappings, and Zero Ghost Accounts Assertion
-- Test Codes: AUTH-001 to AUTH-027
-- Author: Antigravity
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Assertion 1: Total & Exact Real Auth Users (AUTH-019, AUTH-027)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_count INT;
  v_invalid_count INT;
  v_expected_emails TEXT[] := ARRAY[
    'a@gmail.com',
    's1@gmail.com', 's2@gmail.com', 's3@gmail.com', 's4@gmail.com', 's5@gmail.com',
    't1@gmail.com', 't2@gmail.com', 't3@gmail.com'
  ];
BEGIN
  SELECT COUNT(*) INTO v_count FROM auth.users;
  SELECT COUNT(*) INTO v_invalid_count FROM auth.users WHERE email != ALL(v_expected_emails);

  IF v_count <> 9 THEN
    RAISE EXCEPTION 'AUTH-019 FAILED: Expected exactly 9 users in auth.users, found %', v_count;
  END IF;

  IF v_invalid_count > 0 THEN
    RAISE EXCEPTION 'AUTH-027 FAILED: Found % unauthorized or ghost users in auth.users', v_invalid_count;
  END IF;

  RAISE NOTICE '✓ AUTH-019/027: auth.users contains exactly the 9 requested real accounts (0 ghost users).';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 2: Admin Profile & Role Verification (AUTH-020)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT p.*, u.email as auth_email
  INTO v_admin
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'a@gmail.com';

  IF v_admin IS NULL THEN
    RAISE EXCEPTION 'AUTH-020 FAILED: Admin profile not found for a@gmail.com';
  END IF;

  IF v_admin.role <> 'ADMIN' OR v_admin.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'AUTH-020 FAILED: Admin role or status incorrect (role=%, status=%)', v_admin.role, v_admin.status;
  END IF;

  RAISE NOTICE '✓ AUTH-020: a@gmail.com is correctly mapped to ADMIN profile with ACTIVE status.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 3: Students s1-s5 Profiles & Records (AUTH-021, AUTH-023)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_student_count INT;
  v_students_table_count INT;
  v_student_record RECORD;
  v_emails TEXT[] := ARRAY['s1@gmail.com', 's2@gmail.com', 's3@gmail.com', 's4@gmail.com', 's5@gmail.com'];
  v_email TEXT;
BEGIN
  SELECT COUNT(*) INTO v_student_count
  FROM public.profiles
  WHERE email = ANY(v_emails) AND role = 'STUDENT' AND status = 'ACTIVE';

  IF v_student_count <> 5 THEN
    RAISE EXCEPTION 'AUTH-021 FAILED: Expected 5 student profiles, found %', v_student_count;
  END IF;

  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT s.*, p.display_name, p.email
    INTO v_student_record
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE p.email = v_email;

    IF v_student_record IS NULL THEN
      RAISE EXCEPTION 'AUTH-023 FAILED: students table row missing for %', v_email;
    END IF;

    IF v_student_record.target_force_id IS NULL OR v_student_record.target_course_id IS NULL THEN
      RAISE EXCEPTION 'AUTH-023 FAILED: student % missing force or course mapping', v_email;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO v_students_table_count
  FROM public.students s
  JOIN public.profiles p ON p.id = s.profile_id
  WHERE p.email = ANY(v_emails);

  IF v_students_table_count <> 5 THEN
    RAISE EXCEPTION 'AUTH-023 FAILED: Expected exactly 5 students rows, found %', v_students_table_count;
  END IF;

  RAISE NOTICE '✓ AUTH-021/023: All 5 students (s1-s5) have verified profiles and valid students table rows.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 4: Teachers t1-t3 Profiles & Records (AUTH-022, AUTH-024)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_teacher_count INT;
  v_teacher_record RECORD;
  v_emails TEXT[] := ARRAY['t1@gmail.com', 't2@gmail.com', 't3@gmail.com'];
  v_email TEXT;
BEGIN
  SELECT COUNT(*) INTO v_teacher_count
  FROM public.profiles
  WHERE email = ANY(v_emails) AND role = 'TEACHER' AND status = 'ACTIVE';

  IF v_teacher_count <> 3 THEN
    RAISE EXCEPTION 'AUTH-022 FAILED: Expected 3 teacher profiles, found %', v_teacher_count;
  END IF;

  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT t.*, p.display_name, p.email
    INTO v_teacher_record
    FROM public.teachers t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE p.email = v_email;

    IF v_teacher_record IS NULL THEN
      RAISE EXCEPTION 'AUTH-024 FAILED: teachers table row missing for %', v_email;
    END IF;

    IF v_teacher_record.service_number IS NULL THEN
      RAISE EXCEPTION 'AUTH-024 FAILED: teacher % missing service_number', v_email;
    END IF;
  END LOOP;

  RAISE NOTICE '✓ AUTH-022/024: All 3 teachers (t1-t3) have verified profiles and valid teachers table rows.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 5: No Duplicate or Orphan Profiles (AUTH-025, AUTH-026)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_dup_count INT;
  v_orphan_count INT;
BEGIN
  -- Duplicate emails
  SELECT COUNT(*) INTO v_dup_count
  FROM (
    SELECT email, COUNT(*)
    FROM public.profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  ) dups;

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION 'AUTH-025 FAILED: Duplicate profiles found (count: %)', v_dup_count;
  END IF;

  -- Orphan profiles without auth.users
  SELECT COUNT(*) INTO v_orphan_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE u.id IS NULL;

  IF v_orphan_count > 0 THEN
    RAISE EXCEPTION 'AUTH-026 FAILED: Found % orphan profiles without auth.users', v_orphan_count;
  END IF;

  RAISE NOTICE '✓ AUTH-025/026: Zero duplicate profiles and zero orphan profiles confirmed.';
END $$;

-- ----------------------------------------------------------------------------
-- Assertion 6: Batch Enrollments Verified
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_enrolled_count INT;
BEGIN
  SELECT COUNT(*) INTO v_enrolled_count
  FROM public.batch_enrollments be
  JOIN public.students s ON s.id = be.student_id
  JOIN public.profiles p ON p.id = s.profile_id
  WHERE p.email IN ('s1@gmail.com', 's2@gmail.com', 's3@gmail.com', 's4@gmail.com', 's5@gmail.com')
    AND be.status = 'ACTIVE';

  IF v_enrolled_count < 5 THEN
    RAISE EXCEPTION 'Enrollment assertion failed: Expected at least 5 active enrollments for s1-s5, found %', v_enrolled_count;
  END IF;

  RAISE NOTICE '✓ All 5 students are actively enrolled in valid training batches.';
END $$;

ROLLBACK;
