-- ============================================================================
-- Migration: 20261009000002_final_test_integrity.sql
-- Description: Permanent Architectural Enforcement for Exact Questions, 
--              Strict Question Count Verification, and Atomic Save/Updates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DIAGNOSTIC FUNCTION: check_test_question_assignments()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_test_question_assignments()
RETURNS TABLE (
  test_id UUID,
  test_name TEXT,
  section_id UUID,
  section_name TEXT,
  configured_count INT,
  assigned_count BIGINT,
  configured_duration INT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can run test assignment diagnostics.';
  END IF;

  RETURN QUERY
  SELECT
    t.id AS test_id,
    t.name AS test_name,
    ts.id AS section_id,
    ts.name AS section_name,
    ts.question_count AS configured_count,
    COUNT(tsq.question_id) AS assigned_count,
    ts.duration_minutes AS configured_duration,
    CASE
      WHEN COUNT(tsq.question_id) = ts.question_count THEN 'OK'
      WHEN COUNT(tsq.question_id) = 0 THEN 'MISSING ALL QUESTIONS'
      WHEN COUNT(tsq.question_id) < ts.question_count THEN 'INSUFFICIENT QUESTIONS'
      ELSE 'EXCESS QUESTIONS'
    END AS status
  FROM public.tests t
  JOIN public.test_sections ts ON ts.test_id = t.id
  LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
  GROUP BY t.id, t.name, ts.id, ts.name, ts.question_count, ts.duration_minutes, ts.position
  ORDER BY t.name, ts.position;
END;
$$;

REVOKE ALL ON FUNCTION public.check_test_question_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_test_question_assignments() TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. ATOMIC SECTION QUESTIONS UPSERT RPC: upsert_section_questions()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_section_questions(
  p_section_id UUID,
  p_question_ids UUID[]
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id UUID;
  v_inserted INT := 0;
  v_qid UUID;
  v_pos INT := 0;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can manage test question compositions.';
  END IF;

  -- 1. Verify section exists and fetch test_id
  SELECT ts.test_id INTO v_test_id
  FROM public.test_sections ts
  WHERE ts.id = p_section_id;

  IF v_test_id IS NULL THEN
    RAISE EXCEPTION 'Test section % does not exist.', p_section_id;
  END IF;

  -- 2. Clear existing composition for this section
  DELETE FROM public.test_section_questions
  WHERE test_section_id = p_section_id;

  -- 3. Insert each question in the exact specified order
  IF p_question_ids IS NOT NULL AND array_length(p_question_ids, 1) > 0 THEN
    FOREACH v_qid IN ARRAY p_question_ids
    LOOP
      -- Verify question exists and is approved
      IF NOT EXISTS (
        SELECT 1 FROM public.questions q
        WHERE q.id = v_qid AND q.status = 'APPROVED'
      ) THEN
        RAISE EXCEPTION 'Question % is invalid or not APPROVED.', v_qid;
      END IF;

      v_pos := v_pos + 1;
      INSERT INTO public.test_section_questions (
        test_section_id,
        question_id,
        position,
        marks
      ) VALUES (
        p_section_id,
        v_qid,
        v_pos,
        1
      );
      v_inserted := v_inserted + 1;
    END LOOP;
  END IF;

  -- 4. Automatically keep test_sections.question_count synchronized with reality
  UPDATE public.test_sections
  SET question_count = v_inserted
  WHERE id = p_section_id;

  -- 5. Recalculate test total_marks
  UPDATE public.tests
  SET total_marks = (
    SELECT COALESCE(SUM(ts.question_count), 0)
    FROM public.test_sections ts
    WHERE ts.test_id = v_test_id
  ),
  updated_at = timezone('utc', now())
  WHERE id = v_test_id;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_section_questions(UUID, UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_section_questions(UUID, UUID[]) TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. STRICT ATTEMPT INITIALIZATION RPC: start_test_attempt()
-- ----------------------------------------------------------------------------
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
  v_qids UUID[];
  v_attempt_number INT;
  v_bad_section RECORD;
BEGIN
  -- 1. Authentication check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Load Student
  SELECT s.* INTO v_student
  FROM public.students s
  WHERE s.profile_id = auth.uid() OR s.id = auth.uid();

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Only registered cadets can start a test attempt.';
  END IF;

  -- 3. Load Test
  SELECT * INTO v_test FROM public.tests WHERE id = p_test_id;
  IF v_test IS NULL THEN
    RAISE EXCEPTION 'Examination docket not found.';
  END IF;

  IF v_test.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Examination is not currently active for testing.';
  END IF;

  -- 4. STRICT ZERO-TOLERANCE VALIDATION:
  -- Verify every section has EXACTLY question_count questions assigned in test_section_questions
  FOR v_bad_section IN
    SELECT 
      ts.name AS sec_name,
      ts.question_count AS configured,
      COUNT(tsq.question_id) AS assigned
    FROM public.test_sections ts
    LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
    WHERE ts.test_id = p_test_id
    GROUP BY ts.id, ts.name, ts.question_count
    HAVING COUNT(tsq.question_id) <> ts.question_count
  LOOP
    RAISE EXCEPTION 'Test configuration is invalid: section "%" requires % questions but only % are assigned. The examination administrator must re-save or assign the required questions before testing can begin.',
      v_bad_section.sec_name, v_bad_section.configured, v_bad_section.assigned;
  END LOOP;

  -- 5. Find optional assignment
  SELECT ta.* INTO v_assignment
  FROM public.test_assignments ta
  WHERE ta.test_id = p_test_id
  ORDER BY ta.created_at DESC
  LIMIT 1;

  -- 6. Check for active IN_PROGRESS attempt (Resume)
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

  -- 7. Count existing attempts
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.test_attempts
  WHERE student_id = v_student.id AND test_id = p_test_id;

  v_attempt_number := v_attempt_count + 1;
  -- Duration comes directly from configured test duration (no 65m fallback)
  v_expires_at := timezone('utc', now()) + (COALESCE(v_test.duration_minutes, 30) * interval '1 minute');
  v_question_order := '[]'::jsonb;
  v_option_order := '{}'::jsonb;

  -- 8. Build question and option order honoring saved test_section_questions
  FOR v_section IN
    SELECT * FROM public.test_sections
    WHERE test_id = p_test_id
    ORDER BY position ASC
  LOOP
    SELECT ARRAY(
      SELECT tsq.question_id
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      WHERE tsq.test_section_id = v_section.id
        AND q.status = 'APPROVED'
      ORDER BY 
        CASE WHEN COALESCE(v_test.shuffle_questions, false) THEN gen_random_uuid() ELSE NULL END,
        tsq.position ASC
    ) INTO v_qids;

    -- Strict check on approved count matching section
    IF cardinality(v_qids) <> v_section.question_count THEN
      RAISE EXCEPTION 'Section "%" has % valid approved questions but requires %.',
        v_section.name, COALESCE(cardinality(v_qids), 0), v_section.question_count;
    END IF;

    v_question_order := v_question_order || jsonb_build_object(
      'section_id', v_section.id,
      'question_ids', to_jsonb(v_qids)
    );

    IF COALESCE(v_test.shuffle_options, true) THEN
      FOR i IN 1..cardinality(v_qids) LOOP
        DECLARE
          v_opt_ids UUID[];
        BEGIN
          SELECT ARRAY(
            SELECT qo.id
            FROM public.question_options qo
            WHERE qo.question_id = v_qids[i]
            ORDER BY gen_random_uuid()
          ) INTO v_opt_ids;

          v_option_order := v_option_order || jsonb_build_object(
            v_qids[i]::text, to_jsonb(v_opt_ids)
          );
        END;
      END LOOP;
    END IF;
  END LOOP;

  -- 9. Resolve first section
  SELECT id, duration_minutes, name
  INTO v_first_section_id, v_first_section_duration, v_first_section_name
  FROM public.test_sections
  WHERE test_id = p_test_id
  ORDER BY position ASC
  LIMIT 1;

  IF v_first_section_id IS NULL THEN
    RAISE EXCEPTION 'Examination has no sections configured.';
  END IF;

  -- 10. Insert attempt record
  INSERT INTO public.test_attempts (
    test_id, student_id, assignment_id, current_section_id,
    status, question_order, option_order, started_at, expires_at, attempt_number
  ) VALUES (
    p_test_id, v_student.id, v_assignment.id, v_first_section_id,
    'IN_PROGRESS', v_question_order, v_option_order,
    timezone('utc', now()), v_expires_at, v_attempt_number
  ) RETURNING id INTO v_attempt_id;

  -- 11. Initialize section progress with exact configured section duration (no 20m default)
  INSERT INTO public.attempt_section_progress (
    attempt_id, section_id, started_at, expires_at
  ) VALUES (
    v_attempt_id, v_first_section_id, timezone('utc', now()),
    timezone('utc', now()) + (COALESCE(v_first_section_duration, 30) * interval '1 minute')
  );

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_number,
    'first_section_id', v_first_section_id,
    'first_section_name', v_first_section_name,
    'first_section_duration', COALESCE(v_first_section_duration, 30),
    'started_at', timezone('utc', now()),
    'resumed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_test_attempt(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_test_attempt(UUID) TO authenticated;
