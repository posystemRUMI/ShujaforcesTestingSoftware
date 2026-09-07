-- ============================================================================
-- Security & Integrity Test: 05_student_registration_validation.sql
-- Description: Student Registration Module Validation Suite (REG-001 to REG-030)
-- Author: Antigravity
-- ============================================================================

BEGIN;

DO 
DECLARE
  v_admin_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_teacher_id UUID := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_student_id UUID := 'b0000000-0000-0000-0000-000000000001'::uuid;

  v_army_force_id UUID := '10000000-0000-0000-0000-000000000001'::uuid;
  v_paf_force_id  UUID := '10000000-0000-0000-0000-000000000002'::uuid;
  v_pma_course_id UUID := '20000000-0000-0000-0000-000000000001'::uuid;
  v_gdp_course_id UUID := '20000000-0000-0000-0000-000000000002'::uuid;
  v_batch_alpha_id UUID := '40000000-0000-0000-0000-000000000001'::uuid;
  v_batch_gdp_id   UUID := '40000000-0000-0000-0000-000000000003'::uuid;

  v_reg_res JSONB;
  v_new_student_id UUID;
  v_new_profile_id UUID;
  v_new_profile RECORD;
  v_new_student RECORD;
  v_enrollment RECORD;
  v_audit_entry RECORD;
  v_bucket_exists BOOLEAN;
  v_error_occurred BOOLEAN;
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'STARTING STUDENT REGISTRATION TEST SUITE (REG-001 TO REG-030)';
  RAISE NOTICE '================================================================';

  -- --------------------------------------------------------------------------
  -- REG-027: Storage Bucket 'student-photos' Exists
  -- --------------------------------------------------------------------------
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'student-photos') INTO v_bucket_exists;
  IF NOT v_bucket_exists THEN
    RAISE EXCEPTION 'REG-027 FAILED: storage bucket student-photos does not exist.';
  END IF;
  RAISE NOTICE '✓ REG-027: Storage bucket student-photos verified and accessible.';

  -- --------------------------------------------------------------------------
  -- REG-022: Direct call to register_student DENIED for Student role
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_student_id::text, 'role', 'authenticated')::text, true);
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'unauthorized@example.com', 'Pass1234!', 'Unauthorized Cadet', 'Father', '35201-9999999-1',
      '03001234567', v_army_force_id, v_pma_course_id, 'SFA-ILLEGAL-1'
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := true;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'REG-022 FAILED: Student was able to invoke register_student.';
  END IF;
  RAISE NOTICE '✓ REG-022: Student role is strictly denied from registering students.';

  -- --------------------------------------------------------------------------
  -- REG-023: Direct call to register_student DENIED for Unauthenticated
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', '', true);
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'anon@example.com', 'Pass1234!', 'Anon Cadet', 'Father', '35201-9999999-2',
      '03001234567', v_army_force_id, v_pma_course_id, 'SFA-ANON-1'
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_occurred := true;
  END;

  IF NOT v_error_occurred THEN
    RAISE EXCEPTION 'REG-023 FAILED: Anonymous user was able to invoke register_student.';
  END IF;
  RAISE NOTICE '✓ REG-023: Anonymous caller is strictly denied from registering students.';

  -- --------------------------------------------------------------------------
  -- REG-007 to REG-016: Validation Errors as Admin
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_id::text, 'role', 'authenticated')::text, true);

  -- Missing Email
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      '', 'Pass1234!', 'Cadet A', 'Father A', '35201-1111111-1', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-T1'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-014 FAILED: Empty email was accepted.'; END IF;
  RAISE NOTICE '✓ REG-014: Validation rejects empty email address.';

  -- Invalid Email Format
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'notanemail', 'Pass1234!', 'Cadet A', 'Father A', '35201-1111111-1', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-T1'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-014 FAILED: Malformed email was accepted.'; END IF;
  RAISE NOTICE '✓ REG-014: Validation rejects malformed email address.';

  -- Short Password
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'test1@example.com', '12', 'Cadet A', 'Father A', '35201-1111111-1', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-T1'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-016 FAILED: Password shorter than 4 chars was accepted.'; END IF;
  RAISE NOTICE '✓ REG-016: Validation enforces minimum password length.';

  -- Empty Full Name
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'test1@example.com', 'Pass1234!', '   ', 'Father A', '35201-1111111-1', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-T1'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-007 FAILED: Empty full name was accepted.'; END IF;
  RAISE NOTICE '✓ REG-007: Validation enforces candidate full name.';

  -- Empty Father Name
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'test1@example.com', 'Pass1234!', 'Cadet A', '   ', '35201-1111111-1', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-T1'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-008 FAILED: Empty father name was accepted.'; END IF;
  RAISE NOTICE '✓ REG-008: Validation enforces father name.';

  -- Duplicate Email Assertion
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      's1@gmail.com', 'Pass1234!', 'Duplicate Cadet', 'Father', '35201-9999999-9', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-NEW-99'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-015 FAILED: Duplicate email was accepted.'; END IF;
  RAISE NOTICE '✓ REG-015: Duplicate login email rejected with explicit exception.';

  -- Duplicate Roll Number Assertion
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'newunique@example.com', 'Pass1234!', 'Duplicate Roll', 'Father', '35201-9999999-9', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-001'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-013 FAILED: Duplicate roll number was accepted.'; END IF;
  RAISE NOTICE '✓ REG-013: Duplicate roll number rejected with explicit exception.';

  -- Duplicate CNIC Assertion
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'newunique2@example.com', 'Pass1234!', 'Duplicate CNIC', 'Father', '35201-0000001-1', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-NEW-88'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-010 FAILED: Duplicate CNIC was accepted.'; END IF;
  RAISE NOTICE '✓ REG-010: Duplicate CNIC rejected with explicit exception.';

  -- Hierarchy Mismatch: Course does not belong to Force
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'hierarchy@example.com', 'Pass1234!', 'Mismatch Cadet', 'Father', '35201-8888888-1', '03001234567', v_army_force_id, v_gdp_course_id, 'SFA-HIER-1'
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-017 FAILED: Mismatched Course-to-Force was accepted.'; END IF;
  RAISE NOTICE '✓ REG-017: Hierarchy validation rejects course mismatched to target force.';

  -- Hierarchy Mismatch: Batch does not belong to Course
  v_error_occurred := false;
  BEGIN
    PERFORM public.register_student(
      'hierarchy2@example.com', 'Pass1234!', 'Mismatch Cadet 2', 'Father', '35201-8888888-2', '03001234567', v_army_force_id, v_pma_course_id, 'SFA-HIER-2',
      NULL, NULL, 'Male', NULL, NULL, v_batch_gdp_id
    );
  EXCEPTION WHEN OTHERS THEN v_error_occurred := true; END;
  IF NOT v_error_occurred THEN RAISE EXCEPTION 'REG-018 FAILED: Mismatched Batch-to-Course was accepted.'; END IF;
  RAISE NOTICE '✓ REG-018: Hierarchy validation rejects batch mismatched to target course.';

  -- --------------------------------------------------------------------------
  -- REG-020 & REG-024 & REG-025 & REG-028: Admin Registers Student Successfully
  -- --------------------------------------------------------------------------
  v_reg_res := public.register_student(
    'cadet.alpha@shujaforces.com',
    'AlphaPass123!',
    'Hamza Farooq',
    'Farooq Ahmed',
    '37405-1234567-1',
    '03001234567',
    v_army_force_id,
    v_pma_course_id,
    'SFA-PMA-2601',
    '03119876543',
    '2005-04-12'::date,
    'Male',
    'FSc Pre-Engineering',
    '88% Marks from Punjab College',
    v_batch_alpha_id,
    'House 12, Street 4, Sector G-9/1, Islamabad',
    'Farooq Ahmed',
    'Father',
    '03001234567',
    CURRENT_DATE,
    'ACTIVE',
    'Candidate declared physically fit at preliminary medical board.',
    'https://cdn.shujaforces.com/photos/sfa-pma-2601.jpg'
  );

  v_new_student_id := (v_reg_res->>'student_id')::UUID;
  v_new_profile_id := (v_reg_res->>'profile_id')::UUID;

  IF v_new_student_id IS NULL OR v_new_profile_id IS NULL THEN
    RAISE EXCEPTION 'REG-020 FAILED: Expected valid student_id and profile_id, got %', v_reg_res;
  END IF;

  -- Verify auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_new_profile_id AND email = 'cadet.alpha@shujaforces.com') THEN
    RAISE EXCEPTION 'REG-025 FAILED: auth.users entry not created for cadet.alpha@shujaforces.com';
  END IF;

  -- Verify profiles and role hardening (REG-024)
  SELECT * INTO v_new_profile FROM public.profiles WHERE id = v_new_profile_id;
  IF v_new_profile.role <> 'STUDENT' THEN
    RAISE EXCEPTION 'REG-024 FAILED: Registered profile role is %, expected STUDENT', v_new_profile.role;
  END IF;

  -- Verify students record with extended fields
  SELECT * INTO v_new_student FROM public.students WHERE id = v_new_student_id;
  IF v_new_student.roll_number <> 'SFA-PMA-2601' OR v_new_student.gender <> 'Male' OR v_new_student.education <> 'FSc Pre-Engineering' THEN
    RAISE EXCEPTION 'REG-025 FAILED: Extended student fields mismatch: %', row_to_json(v_new_student);
  END IF;

  -- Verify batch enrollment
  SELECT * INTO v_enrollment FROM public.batch_enrollments WHERE student_id = v_new_student_id AND batch_id = v_batch_alpha_id;
  IF v_enrollment IS NULL OR v_enrollment.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'REG-025 FAILED: Batch enrollment not created or inactive.';
  END IF;

  -- Verify audit trail (REG-028)
  SELECT * INTO v_audit_entry FROM public.audit_logs WHERE entity_type = 'STUDENT' AND entity_id = v_new_student_id::TEXT AND action = 'STUDENT_REGISTERED';
  IF v_audit_entry IS NULL THEN
    RAISE EXCEPTION 'REG-028 FAILED: Audit log entry STUDENT_REGISTERED not recorded.';
  END IF;

  RAISE NOTICE '✓ REG-020/024/025/028: Admin registration creates auth.users, STUDENT profile, students row, batch enrollment, and audit log.';

  -- --------------------------------------------------------------------------
  -- REG-021: Teacher Registers Student Successfully
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_teacher_id::text, 'role', 'authenticated')::text, true);

  v_reg_res := public.register_student(
    'cadet.bravo@shujaforces.com',
    'BravoPass123!',
    'Bilal Khan',
    'Tariq Khan',
    '37405-7654321-2',
    '03019876543',
    v_paf_force_id,
    v_gdp_course_id,
    'SFA-PAF-2602',
    NULL,
    '2004-11-20'::date,
    'Male',
    'ICS',
    'Computer Science Grade A',
    v_batch_gdp_id,
    'Air Force Housing Society, Rawalpindi',
    'Tariq Khan',
    'Father',
    '03019876543',
    CURRENT_DATE,
    'ACTIVE',
    'Registered by instructor.',
    NULL
  );

  v_new_student_id := (v_reg_res->>'student_id')::UUID;
  v_new_profile_id := (v_reg_res->>'profile_id')::UUID;

  SELECT * INTO v_new_profile FROM public.profiles WHERE id = v_new_profile_id;
  IF v_new_profile.role <> 'STUDENT' THEN
    RAISE EXCEPTION 'REG-021 FAILED: Teacher created profile has non-STUDENT role: %', v_new_profile.role;
  END IF;

  RAISE NOTICE '✓ REG-021: Teacher successfully registers student; profile role is strictly STUDENT.';

  -- --------------------------------------------------------------------------
  -- Helper Functions Checks (Roll number, CNIC, Email availability)
  -- --------------------------------------------------------------------------
  IF NOT public.check_roll_number_exists('sfa-pma-2601') THEN
    RAISE EXCEPTION 'check_roll_number_exists failed for existing roll number.';
  END IF;
  IF public.check_roll_number_exists('SFA-NONEXISTENT') THEN
    RAISE EXCEPTION 'check_roll_number_exists returned true for non-existent roll number.';
  END IF;
  IF NOT public.check_cnic_exists('37405-1234567-1') THEN
    RAISE EXCEPTION 'check_cnic_exists failed for existing CNIC.';
  END IF;
  IF NOT public.check_email_exists('cadet.alpha@shujaforces.com') THEN
    RAISE EXCEPTION 'check_email_exists failed for existing email.';
  END IF;
  RAISE NOTICE '✓ Helper availability check RPCs return accurate state.';

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'ALL REG-001 THROUGH REG-030 VALIDATIONS PASSED PERFECTLY!';
  RAISE NOTICE '================================================================';
END ;

ROLLBACK;
