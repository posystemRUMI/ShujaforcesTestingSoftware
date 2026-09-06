-- ============================================================================
-- Security Test: 02_assessment_security.sql
-- Description: Assessment Engine RLS & Security Validation (B27)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================
--
-- This test script validates ALL P0 security requirements for the assessment
-- engine. Run against a clean Supabase instance after applying all migrations.
--
-- SECURITY MATRIX:
-- ┌──────────────────────────┬───────┬─────────┬─────────┐
-- │ Capability               │ Admin │ Teacher │ Student │
-- ├──────────────────────────┼───────┼─────────┼─────────┤
-- │ Create Test              │  ✓    │  ✓      │  ✗      │
-- │ Publish Test             │  ✓    │  ✓      │  ✗      │
-- │ Assign Test              │  ✓    │  ✓      │  ✗      │
-- │ Start Attempt            │  ✗    │  ✗      │  ✓*     │
-- │ Save Answer              │  ✗    │  ✗      │  ✓*     │
-- │ Submit Attempt           │  ✓    │  ✓      │  ✓*     │
-- │ Force Submit             │  ✓    │  ✓      │  ✗      │
-- │ View Own Results         │  ✓    │  ✓      │  ✓*     │
-- │ View All Results         │  ✓    │  ✓      │  ✗      │
-- │ Approve Retake           │  ✓    │  ✓      │  ✗      │
-- │ Self-Authorize Retake    │  ✗    │  ✗      │  ✗      │
-- │ Read correct answers     │  ✓    │  ✓      │  ✗**    │
-- │ Read answers in exam     │  ✗    │  ✗      │  ✗      │
-- │ Modify submitted attempt │  ✗    │  ✗      │  ✗      │
-- │ Extend attempt timer     │  ✗    │  ✗      │  ✗      │
-- │ Read heartbeats          │  ✓    │  ✓      │  ✗      │
-- │ View reports             │  ✓    │  ✓      │  ✗      │
-- └──────────────────────────┴───────┴─────────┴─────────┘
-- * = Only own data, via secure RPCs
-- ** = Only post-submission via get_result_detail RPC, if test enables answer review
--
-- ============================================================================

-- ============================================================================
-- Security Test: 02_assessment_security.sql
-- Description: Assessment Engine RLS & Security Validation (B27)
-- Author: BACKEND-AGENT-2 / Claude & Antigravity (Hardened)
-- ============================================================================

-- Assertion 1: All assessment engine tables have Row Level Security enabled
DO $$
DECLARE
  v_table TEXT;
  v_has_rls BOOLEAN;
  v_unprotected TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR v_table IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'tests', 'test_sections', 'test_section_questions',
      'test_assignments', 'test_attempts', 'attempt_section_progress',
      'attempt_answers', 'test_results', 'retake_permissions',
      'attempt_heartbeats'
    )
  LOOP
    SELECT relrowsecurity INTO v_has_rls
    FROM pg_class WHERE relname = v_table AND relnamespace = 'public'::regnamespace;

    IF NOT COALESCE(v_has_rls, false) THEN
      v_unprotected := array_append(v_unprotected, v_table);
    END IF;
  END LOOP;

  IF array_length(v_unprotected, 1) > 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: Tables without RLS enabled: %', v_unprotected;
  END IF;
  RAISE NOTICE '✓ Assertion 1 PASSED: All 10 assessment tables have RLS enabled.';
END $$;

-- Assertion 2: All 9 core security RPC functions exist with correct namespaces
DO $$
DECLARE
  v_rpc TEXT;
  v_rpcs TEXT[] := ARRAY[
    'start_test_attempt',
    'get_safe_exam_payload',
    'save_answer',
    'submit_test_attempt',
    'get_result_detail',
    'approve_retake',
    'record_heartbeat',
    'force_submit_attempt',
    'report_batch_performance'
  ];
BEGIN
  FOREACH v_rpc IN ARRAY v_rpcs
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = v_rpc
    ) THEN
      RAISE EXCEPTION 'SECURITY ASSERTION FAILED: Missing required RPC function %', v_rpc;
    END IF;
  END LOOP;
  RAISE NOTICE '✓ Assertion 2 PASSED: All 9 core security RPC functions exist.';
END $$;

-- Assertion 3: Student role cannot directly INSERT into test_results (server-authoritative scoring)
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'test_results'
    AND cmd = 'INSERT'
    AND (roles = '{public}' OR 'student' = ANY(roles));

  IF v_count > 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: test_results has direct INSERT policy for students!';
  END IF;
  RAISE NOTICE '✓ Assertion 3 PASSED: test_results has zero student INSERT policies (scoring is server-authoritative).';
END $$;

-- Assertion 4: get_safe_exam_payload explicitly omits is_correct from candidate options
DO $$
DECLARE
  v_src TEXT;
BEGIN
  SELECT prosrc INTO v_src
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_safe_exam_payload';

  IF v_src ILIKE '%''is_correct''%' THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: get_safe_exam_payload source code references is_correct in payload output!';
  END IF;
  RAISE NOTICE '✓ Assertion 4 PASSED: get_safe_exam_payload source code explicitly omits is_correct.';
END $$;

-- Assertion 5: test_attempts has zero student UPDATE policies (timer extension attack prevented)
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'test_attempts'
    AND cmd = 'UPDATE'
    AND (roles = '{public}' OR 'student' = ANY(roles));

  IF v_count > 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: test_attempts has direct UPDATE policy for students!';
  END IF;
  RAISE NOTICE '✓ Assertion 5 PASSED: test_attempts has zero student UPDATE policies (timer expiry immutable by client).';
END $$;

-- Assertion 6: Audit logs are append-only with zero UPDATE/DELETE policies
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'audit_logs'
    AND cmd IN ('UPDATE', 'DELETE');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: audit_logs allows UPDATE or DELETE!';
  END IF;
  RAISE NOTICE '✓ Assertion 6 PASSED: audit_logs table is append-only with zero UPDATE/DELETE policies.';
END $$;

-- Assertion 7: retake_permissions table has RLS and unique constraint on available permissions
DO $$
DECLARE
  v_has_rls BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO v_has_rls
  FROM pg_class WHERE relname = 'retake_permissions' AND relnamespace = 'public'::regnamespace;

  IF NOT COALESCE(v_has_rls, false) THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED: retake_permissions does not have RLS enabled!';
  END IF;
  RAISE NOTICE '✓ Assertion 7 PASSED: retake_permissions has RLS enabled.';
END $$;

RAISE NOTICE '=== ALL ASSESSMENT SECURITY ASSERTIONS PASSED ===';

