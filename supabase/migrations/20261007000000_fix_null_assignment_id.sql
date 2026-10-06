-- Migration: 20261007000000_fix_null_assignment_id.sql
-- Description: Drop NOT NULL constraint on assignment_id in test_attempts & update start_test_attempt and get_student_assigned_tests functions to allow all PMA Long Course students to attempt active tests directly without batch or eligibility restrictions

-- 1. Drop NOT NULL constraint on assignment_id in test_attempts table
ALTER TABLE public.test_attempts ALTER COLUMN assignment_id DROP NOT NULL;

-- 2. Update start_test_attempt function for zero-block course testing
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
  v_retake_id UUID;
  v_max_allowed INT;
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

  -- 4. Find optional assignment if present (without blocking if absent)
  SELECT ta.* INTO v_assignment
  FROM public.test_assignments ta
  WHERE ta.test_id = p_test_id
  ORDER BY ta.created_at DESC
  LIMIT 1;

  -- 5. Count existing attempts
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.test_attempts
  WHERE student_id = v_student.id AND test_id = p_test_id;

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

  v_attempt_number := v_attempt_count + 1;
  v_expires_at := timezone('utc', now()) + (COALESCE(v_test.duration_minutes, 65) * interval '1 minute');
  v_question_order := '[]'::jsonb;
  v_option_order := '{}'::jsonb;

  -- 7. Build Question & Option Order per section
  FOR v_section IN
    SELECT * FROM public.test_sections
    WHERE test_id = p_test_id ORDER BY position
  LOOP
    v_section_questions := '[]'::jsonb;
    
    SELECT ARRAY(
      SELECT q.id
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      WHERE tsq.test_section_id = v_section.id
        AND q.status = 'APPROVED'
      ORDER BY 
        CASE WHEN COALESCE(v_test.shuffle_questions, true) THEN gen_random_uuid() ELSE NULL END,
        tsq.position ASC
    ) INTO v_qids;

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

  SELECT id, duration_minutes, name
  INTO v_first_section_id, v_first_section_duration, v_first_section_name
  FROM public.test_sections
  WHERE test_id = p_test_id
  ORDER BY position ASC
  LIMIT 1;

  IF v_first_section_id IS NULL THEN
    RAISE EXCEPTION 'Test has no sections defined.';
  END IF;

  -- 8. Insert attempt (assignment_id is nullable and safe)
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

-- 3. Update get_student_assigned_tests function to return all active tests
CREATE OR REPLACE FUNCTION public.get_student_assigned_tests(p_student_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  duration_minutes INTEGER,
  total_marks INTEGER,
  passing_threshold INTEGER,
  negative_marking BOOLEAN,
  shuffle_questions BOOLEAN,
  shuffle_options BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    t.id,
    t.name,
    t.duration_minutes,
    t.total_marks,
    t.passing_threshold,
    t.negative_marking,
    t.shuffle_questions,
    t.shuffle_options
  FROM public.tests t
  WHERE t.status IN ('PUBLISHED', 'ACTIVE')
  ORDER BY t.name ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_assigned_tests(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_assigned_tests(UUID) TO authenticated;
