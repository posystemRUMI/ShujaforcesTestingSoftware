-- Migration: 20261009000001_validate_section_questions_on_start.sql
-- Description: (1) Creates check_test_question_assignments() diagnostic helper.
--              (2) Updates start_test_attempt to BLOCK if any section has zero
--                  assigned questions, preventing students from starting broken tests.

-- -------------------------------------------------------------------------
-- 1. Diagnostic helper (safe for staff to call)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_test_question_assignments()
RETURNS TABLE (
  test_id UUID,
  test_name TEXT,
  section_id UUID,
  section_name TEXT,
  configured_count INT,
  assigned_count BIGINT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can run this check.';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    ts.id,
    ts.name,
    ts.question_count,
    COUNT(tsq.question_id),
    CASE
      WHEN COUNT(tsq.question_id) = ts.question_count THEN 'OK'
      WHEN COUNT(tsq.question_id) = 0               THEN 'MISSING ALL QUESTIONS'
      WHEN COUNT(tsq.question_id) < ts.question_count THEN 'INSUFFICIENT QUESTIONS'
      ELSE 'EXCESS QUESTIONS'
    END
  FROM public.tests t
  JOIN public.test_sections ts ON ts.test_id = t.id
  LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
  GROUP BY t.id, t.name, ts.id, ts.name, ts.question_count
  HAVING COUNT(tsq.question_id) <> ts.question_count
  ORDER BY t.name, ts.position;
END;
$$;

REVOKE ALL ON FUNCTION public.check_test_question_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_test_question_assignments() TO authenticated;

-- -------------------------------------------------------------------------
-- 2. Update start_test_attempt to block tests with missing section questions
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_test_attempt(p_test_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_test RECORD;
  v_assignment RECORD;
  v_attempt_count INT;
  v_attempt_id UUID;
  v_first_section_id UUID;
  v_first_section_duration INT;
  v_first_section_name TEXT;
  v_expires_at TIMESTAMPTZ;
  v_question_order JSONB;
  v_option_order JSONB;
  v_section RECORD;
  v_section_questions JSONB;
  v_qids UUID[];
  v_attempt_number INT;
  v_bad_section RECORD;
  v_bad_count INT;
BEGIN
  -- 1. Authentication check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Load Student
  SELECT s.* INTO v_student
  FROM public.students s
  WHERE s.profile_id = auth.uid();

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Only registered students can start a test attempt.';
  END IF;

  -- 3. Load Test
  SELECT * INTO v_test FROM public.tests WHERE id = p_test_id;
  IF v_test IS NULL THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;

  IF v_test.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Test is not available for examination.';
  END IF;

  -- 4. VALIDATE: every section must have exactly question_count assigned questions
  FOR v_bad_section IN
    SELECT ts.name AS sec_name, ts.question_count AS configured,
           COUNT(tsq.question_id) AS assigned
    FROM public.test_sections ts
    LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
    WHERE ts.test_id = p_test_id
    GROUP BY ts.id, ts.name, ts.question_count
    HAVING COUNT(tsq.question_id) <> ts.question_count
  LOOP
    RAISE EXCEPTION
      'Section "%" has % questions assigned but is configured for %. '
      'The test administrator must fix this test before it can be attempted.',
      v_bad_section.sec_name, v_bad_section.assigned, v_bad_section.configured;
  END LOOP;

  -- 5. Find optional assignment
  SELECT ta.* INTO v_assignment
  FROM public.test_assignments ta
  WHERE ta.test_id = p_test_id
  ORDER BY ta.created_at DESC
  LIMIT 1;

  -- 6. Count existing attempts
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.test_attempts
  WHERE student_id = v_student.id AND test_id = p_test_id;

  -- 7. Check for active IN_PROGRESS attempt (Resume)
  IF EXISTS (
    SELECT 1 FROM public.test_attempts
    WHERE student_id = v_student.id
      AND test_id = p_test_id
      AND status = 'IN_PROGRESS'
      AND expires_at > timezone('utc', now())
  ) THEN
    SELECT id INTO v_attempt_id
    FROM public.test_attempts
    WHERE student_id = v_student.id
      AND test_id = p_test_id
      AND status = 'IN_PROGRESS'
      AND expires_at > timezone('utc', now())
    LIMIT 1;

    RETURN jsonb_build_object(
      'attempt_id', v_attempt_id,
      'resumed', true,
      'message', 'Existing active attempt found. Resuming.'
    );
  END IF;

  v_attempt_number := v_attempt_count + 1;
  v_expires_at := timezone('utc', now()) + (COALESCE(v_test.duration_minutes, 65) * interval '1 minute');
  v_question_order := '[]'::jsonb;
  v_option_order := '{}'::jsonb;

  -- 8. Build Question & Option Order per section (from persisted test_section_questions)
  FOR v_section IN
    SELECT * FROM public.test_sections
    WHERE test_id = p_test_id ORDER BY position
  LOOP
    SELECT ARRAY(
      SELECT tsq.question_id
      FROM public.test_section_questions tsq
      WHERE tsq.test_section_id = v_section.id
      ORDER BY
        CASE WHEN COALESCE(v_test.shuffle_questions, true) THEN gen_random_uuid() ELSE NULL END,
        tsq.position ASC
    ) INTO v_qids;

    v_question_order := v_question_order || jsonb_build_object(
      'section_id', v_section.id,
      'question_ids', to_jsonb(v_qids)
    );

    IF COALESCE(v_test.shuffle_options, true) THEN
      DECLARE
        i INT;
        v_opt_ids UUID[];
      BEGIN
        FOR i IN 1..cardinality(v_qids) LOOP
          SELECT ARRAY(
            SELECT qo.id
            FROM public.question_options qo
            WHERE qo.question_id = v_qids[i]
            ORDER BY gen_random_uuid()
          ) INTO v_opt_ids;
          v_option_order := v_option_order || jsonb_build_object(v_qids[i]::text, to_jsonb(v_opt_ids));
        END LOOP;
      END;
    END IF;
  END LOOP;

  SELECT id, duration_minutes, name
  INTO v_first_section_id, v_first_section_duration, v_first_section_name
  FROM public.test_sections
  WHERE test_id = p_test_id
  ORDER BY position ASC LIMIT 1;

  IF v_first_section_id IS NULL THEN
    RAISE EXCEPTION 'Test has no sections defined.';
  END IF;

  -- 9. Insert attempt (assignment_id nullable)
  INSERT INTO public.test_attempts (
    test_id, student_id, assignment_id, current_section_id,
    status, question_order, option_order, started_at, expires_at, attempt_number
  ) VALUES (
    p_test_id, v_student.id, v_assignment.id, v_first_section_id,
    'IN_PROGRESS', v_question_order, v_option_order,
    timezone('utc', now()), v_expires_at, v_attempt_number
  ) RETURNING id INTO v_attempt_id;

  INSERT INTO public.attempt_section_progress (
    attempt_id, section_id, started_at, expires_at
  ) VALUES (
    v_attempt_id, v_first_section_id, timezone('utc', now()),
    timezone('utc', now()) + (COALESCE(v_first_section_duration, 20) * interval '1 minute')
  );

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_number,
    'first_section_id', v_first_section_id,
    'first_section_name', v_first_section_name,
    'first_section_duration', COALESCE(v_first_section_duration, 20),
    'started_at', timezone('utc', now()),
    'resumed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_test_attempt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_test_attempt(UUID) TO authenticated;
