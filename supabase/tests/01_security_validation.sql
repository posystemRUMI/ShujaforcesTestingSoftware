-- ============================================================================
-- Test Suite: 01_security_validation.sql
-- Description: Security Verification Tests for RLS, Roles, and Exam Boundaries
-- Author: BACKEND-AGENT-1 / Antigravity
-- ============================================================================

BEGIN;

-- 1. Verify RLS is enabled on all core tables
DO $$
DECLARE
  v_table text;
  v_rls_enabled boolean;
  v_tables text[] := ARRAY[
    'profiles', 'forces', 'courses', 'subjects', 'course_subjects',
    'batches', 'teachers', 'teacher_subjects', 'students',
    'batch_enrollments', 'questions', 'question_options', 'question_courses',
    'audit_logs'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    SELECT relrowsecurity INTO v_rls_enabled
    FROM pg_class
    WHERE relname = v_table;

    IF v_rls_enabled IS NOT TRUE THEN
      RAISE EXCEPTION 'RLS NOT ENABLED ON TABLE: %', v_table;
    END IF;
  END LOOP;
  RAISE NOTICE 'SUCCESS: RLS is enabled on all core tables.';
END $$;

-- 2. Verify Safe Exam Question RPC strips is_correct
DO $$
DECLARE
  v_sample_qid UUID := '50000000-0000-0000-0000-000000000001';
  v_opts JSONB;
BEGIN
  SELECT options INTO v_opts
  FROM public.get_safe_exam_questions(ARRAY[v_sample_qid]);

  IF v_opts::text ILIKE '%is_correct%' THEN
    RAISE EXCEPTION 'CRITICAL SECURITY BREACH: get_safe_exam_questions leaks is_correct!';
  END IF;

  RAISE NOTICE 'SUCCESS: get_safe_exam_questions safely omits is_correct.';
END $$;

-- 3. Verify single correct option trigger enforcement
DO $$
DECLARE
  v_err_caught boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
    VALUES ('50000000-0000-0000-0000-000000000001', 'opt-c', 'C', 'Duplicate correct', true);
  EXCEPTION WHEN others THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'Constraint failure: Duplicate correct option was permitted!';
  END IF;

  RAISE NOTICE 'SUCCESS: Single correct option constraint is strictly enforced.';
END $$;

ROLLBACK;
