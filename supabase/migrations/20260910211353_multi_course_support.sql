-- Migration: Multi-Course Support for Tests
-- Date: 2026-09-10

-- 1. Create many-to-many relationship table
CREATE TABLE IF NOT EXISTS public.test_courses (
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, course_id)
);

ALTER TABLE public.test_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_courses_read_policy" ON public.test_courses
  FOR SELECT USING (true);

CREATE POLICY "test_courses_write_policy" ON public.test_courses
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('ADMIN', 'TEACHER'))
  );

-- 2. Backfill from legacy tests.course_id
INSERT INTO public.test_courses (test_id, course_id)
SELECT id, course_id FROM public.tests WHERE course_id IS NOT NULL
ON CONFLICT DO NOTHING;


-- 3. Create get_student_assigned_tests RPC
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
) AS $$
BEGIN
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
  JOIN public.test_courses tc ON tc.test_id = t.id
  JOIN public.students s ON s.target_course_id = tc.course_id
  JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'ACTIVE'
  JOIN public.test_assignments ta ON ta.batch_id = be.batch_id AND ta.test_id = t.id
  WHERE s.id = p_student_id
    AND t.status IN ('PUBLISHED', 'ACTIVE')
    AND ta.status = 'ACTIVE'
    AND (ta.available_from IS NULL OR ta.available_from <= timezone('utc', now()))
    AND (ta.available_until IS NULL OR ta.available_until >= timezone('utc', now()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Re-declare start_test_attempt with course eligibility
CREATE OR REPLACE FUNCTION public.start_test_attempt(p_test_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student RECORD;
  v_test RECORD;
  v_assignment RECORD;
  v_attempt_count INT;
  v_retake_id UUID := NULL;
  v_attempt_id UUID;
  v_attempt_number INT;
  v_expires_at TIMESTAMPTZ;
  v_first_section RECORD;
  v_question_order JSONB;
  v_option_order JSONB := '{}'::jsonb;
  v_section RECORD;
  v_q RECORD;
  v_opt_ids UUID[];
  v_section_questions JSONB;
BEGIN
  -- 1. Verify caller is an active student
  IF NOT public.is_student() THEN
    RAISE EXCEPTION 'Only students can start test attempts.';
  END IF;

  SELECT s.* INTO v_student
  FROM public.students s
  WHERE s.profile_id = auth.uid() AND s.status = 'ACTIVE';

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Active student profile not found.';
  END IF;

  -- 2. Load test
  SELECT * INTO v_test FROM public.tests WHERE id = p_test_id;
  IF v_test IS NULL THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;
  IF v_test.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Test is not available.';
  END IF;

  -- 2b. Check course eligibility
  IF NOT EXISTS (
    SELECT 1 FROM public.test_courses tc
    WHERE tc.test_id = p_test_id AND tc.course_id = v_student.target_course_id
  ) THEN
    RAISE EXCEPTION 'Test is not available for your registered course.';
  END IF;

  -- 3. Find active assignment for student's batch
  SELECT ta.* INTO v_assignment
  FROM public.test_assignments ta
  JOIN public.batch_enrollments be ON be.batch_id = ta.batch_id
  WHERE ta.test_id = p_test_id
    AND be.student_id = v_student.id
    AND be.status = 'ACTIVE'
    AND ta.status = 'ACTIVE'
    AND ta.available_from <= timezone('utc', now())
    AND (ta.available_until IS NULL OR ta.available_until > timezone('utc', now()))
  LIMIT 1;

  IF v_assignment IS NULL THEN
    RAISE EXCEPTION 'No active assignment found for this test.';
  END IF;

  -- 4. Check attempt limit
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.test_attempts
  WHERE student_id = v_student.id AND test_id = p_test_id;

  -- Check for active in-progress attempt (resume instead of new)
  IF EXISTS (
    SELECT 1 FROM public.test_attempts
    WHERE student_id = v_student.id
      AND test_id = p_test_id
      AND status = 'IN_PROGRESS'
      AND expires_at > timezone('utc', now())
  ) THEN
    -- Return existing active attempt
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

  -- First attempt is free; additional attempts require retake permission
  IF v_attempt_count >= v_assignment.max_attempts THEN
    -- Check for available retake permission
    SELECT id INTO v_retake_id
    FROM public.retake_permissions
    WHERE student_id = v_student.id
      AND test_id = p_test_id
      AND status = 'AVAILABLE'
      AND (expires_at IS NULL OR expires_at > timezone('utc', now()))
    ORDER BY approved_at ASC
    LIMIT 1;

    IF v_retake_id IS NULL THEN
      RAISE EXCEPTION 'Attempt limit reached. No retake permission available.';
    END IF;
  END IF;

  -- 5. Build question/option order
  v_attempt_number := v_attempt_count + 1;
  v_expires_at := timezone('utc', now()) + (v_test.duration_minutes * interval '1 minute');
  v_question_order := '[]'::jsonb;

  FOR v_section IN
    SELECT * FROM public.test_sections
    WHERE test_id = p_test_id ORDER BY position
  LOOP
    v_section_questions := '[]'::jsonb;
    FOR v_q IN
      SELECT tsq.question_id, tsq.position
      FROM public.test_section_questions tsq
      WHERE tsq.test_section_id = v_section.id
      ORDER BY CASE WHEN v_test.shuffle_questions OR v_section.shuffle_questions THEN random() ELSE tsq.position::float END
    LOOP
      v_section_questions := v_section_questions || jsonb_build_array(v_q.question_id);

      -- Shuffle options if enabled
      IF v_test.shuffle_options THEN
        SELECT array_agg(qo.id ORDER BY random()) INTO v_opt_ids
        FROM public.question_options qo
        WHERE qo.question_id = v_q.question_id;

        v_option_order := v_option_order || jsonb_build_object(
          v_q.question_id::text, to_jsonb(v_opt_ids)
        );
      END IF;
    END LOOP;

    v_question_order := v_question_order || jsonb_build_array(
      jsonb_build_object(
        'section_id', v_section.id,
        'section_name', v_section.name,
        'question_ids', v_section_questions
      )
    );
  END LOOP;

  -- Get first section
  SELECT * INTO v_first_section
  FROM public.test_sections WHERE test_id = p_test_id ORDER BY position LIMIT 1;

  -- 6. Create attempt atomically
  INSERT INTO public.test_attempts (
    student_id, test_id, assignment_id, attempt_number,
    started_at, expires_at, current_section_id, status,
    question_order, option_order
  )
  VALUES (
    v_student.id, p_test_id, v_assignment.id, v_attempt_number,
    timezone('utc', now()), v_expires_at, v_first_section.id, 'IN_PROGRESS',
    v_question_order, v_option_order
  )
  RETURNING id INTO v_attempt_id;

  -- Initialize section progress for first section
  INSERT INTO public.attempt_section_progress (
    attempt_id, section_id, started_at, expires_at
  )
  VALUES (
    v_attempt_id,
    v_first_section.id,
    timezone('utc', now()),
    timezone('utc', now()) + (v_first_section.duration_minutes * interval '1 minute')
  );

  -- Consume retake permission if this was authorized via retake
  IF v_retake_id IS NOT NULL THEN
    UPDATE public.retake_permissions
    SET status = 'USED', consumed_attempt_id = v_attempt_id, updated_at = timezone('utc', now())
    WHERE id = v_retake_id;
  END IF;

  -- Audit
  PERFORM public.log_audit_event(
    'ATTEMPT_STARTED',
    'TEST_ATTEMPT',
    v_attempt_id::TEXT,
    jsonb_build_object(
      'test_id', p_test_id,
      'student_id', v_student.id,
      'attempt_number', v_attempt_number,
      'expires_at', v_expires_at
    )
  );

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_number,
    'started_at', timezone('utc', now()),
    'expires_at', v_expires_at,
    'server_time', timezone('utc', now()),
    'resumed', false
  );
END;
$function$;

-- 5. Re-declare get_safe_exam_payload with course eligibility
CREATE OR REPLACE FUNCTION public.get_safe_exam_payload(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student RECORD;
  v_attempt RECORD;
  v_test RECORD;
  v_sections JSONB := '[]'::jsonb;
  v_section RECORD;
  v_q RECORD;
  v_opts JSONB;
  v_qids UUID[];
  v_current_section RECORD;
BEGIN
  -- 1. Student Auth
  IF NOT public.is_student() THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT s.* INTO v_student
  FROM public.students s
  WHERE s.profile_id = auth.uid() AND s.status = 'ACTIVE';

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Active student profile required.';
  END IF;

  -- 2. Load Attempt
  SELECT a.*, ta.max_attempts INTO v_attempt
  FROM public.test_attempts a
  JOIN public.test_assignments ta ON ta.id = a.assignment_id
  WHERE a.id = p_attempt_id AND a.student_id = v_student.id;

  IF v_attempt IS NULL THEN
    RAISE EXCEPTION 'Attempt not found.';
  END IF;

  IF v_attempt.status <> 'IN_PROGRESS' THEN
    RAISE EXCEPTION 'Attempt is not in progress.';
  END IF;

  IF v_attempt.expires_at <= timezone('utc', now()) THEN
    RAISE EXCEPTION 'Attempt has expired.';
  END IF;

  -- 3. Load Test
  SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

  -- 3b. Check course eligibility for safe exam
  IF NOT EXISTS (
    SELECT 1 FROM public.test_courses tc
    WHERE tc.test_id = v_test.id AND tc.course_id = v_student.target_course_id
  ) THEN
    RAISE EXCEPTION 'Test is not available for your registered course.';
  END IF;

  -- 4. Current Section Details
  SELECT * INTO v_current_section
  FROM public.attempt_section_progress
  WHERE attempt_id = p_attempt_id AND section_id = v_attempt.current_section_id;

  -- 5. Build full safe payload
  FOR v_section IN
    SELECT ts.id, ts.name, ts.description, ts.duration_minutes
    FROM public.test_sections ts
    WHERE ts.test_id = v_test.id
    ORDER BY ts.position
  LOOP
    -- Extract question IDs for this section from the saved order
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(el->'question_ids')::UUID
      FROM jsonb_array_elements(v_attempt.question_order) el
      WHERE (el->>'section_id')::UUID = v_section.id
    ) INTO v_qids;

    DECLARE
      v_section_questions JSONB := '[]'::jsonb;
    BEGIN
      IF array_length(v_qids, 1) > 0 THEN
        FOR v_q IN
          SELECT q.id, q.code, q.stem, q.stem_image_url
          FROM public.questions q
          JOIN unnest(v_qids) WITH ORDINALITY t(id, ord) USING (id)
          ORDER BY t.ord
        LOOP
          -- Get options honoring the saved option_order or fallback
          IF v_attempt.option_order ? v_q.id::text THEN
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', qo.id,
                'label', qo.label,
                'text', qo.text,
                'image_url', qo.image_url
              )
            ) INTO v_opts
            FROM public.question_options qo
            JOIN jsonb_array_elements_text(v_attempt.option_order->(v_q.id::text)) WITH ORDINALITY o(opt_id, ord)
              ON qo.id::uuid = o.opt_id::uuid
            ORDER BY o.ord;
          ELSE
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', qo.id,
                'label', qo.label,
                'text', qo.text,
                'image_url', qo.image_url
              ) ORDER BY qo.label
            ) INTO v_opts
            FROM public.question_options qo
            WHERE qo.question_id = v_q.id;
          END IF;

          v_section_questions := v_section_questions || jsonb_build_object(
            'id', v_q.id,
            'code', v_q.code,
            'stem', v_q.stem,
            'stem_image_url', v_q.stem_image_url,
            'options', COALESCE(v_opts, '[]'::jsonb)
          );
        END LOOP;
      END IF;

      v_sections := v_sections || jsonb_build_object(
        'id', v_section.id,
        'name', v_section.name,
        'description', v_section.description,
        'duration_minutes', v_section.duration_minutes,
        'questions', v_section_questions
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'test_id', v_test.id,
    'test_name', v_test.name,
    'global_expires_at', v_attempt.expires_at,
    'current_section_id', v_attempt.current_section_id,
    'section_expires_at', v_current_section.expires_at,
    'sections', v_sections,
    'server_time', timezone('utc', now()),
    'allow_section_navigation', v_test.allow_section_navigation
  );
END;
$function$;

-- 6. Re-declare get_familiarization_payload
CREATE OR REPLACE FUNCTION public.get_familiarization_payload(p_test_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_test RECORD;
  v_student RECORD;
  v_assignment RECORD;
  v_questions JSONB := '[]'::jsonb;
  v_q RECORD;
  v_opts JSONB;
  v_enabled_subject_ids UUID[];
  v_num_subjects INT;
  v_target_counts INT[];
  v_selected_qids UUID[] := ARRAY[]::UUID[];
  v_target INT;
  v_subj UUID;
  v_idx INT;
BEGIN
  -- 1. Authentication Check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Staff vs Student Eligibility Check
  IF public.is_admin() OR public.is_teacher() THEN
    -- Staff can preview payload for any existing test
    SELECT id, name, force_id, course_id, status INTO v_test
    FROM public.tests
    WHERE id = p_test_id;

    IF v_test IS NULL THEN
      RAISE EXCEPTION 'Test % not found.', p_test_id;
    END IF;
  ELSE
    -- Student must be active
    SELECT s.*, p.status AS profile_status INTO v_student
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE s.profile_id = auth.uid();

    IF v_student IS NULL OR v_student.profile_status <> 'ACTIVE' THEN
      RAISE EXCEPTION 'Active student profile required.';
    END IF;

    -- Test must exist
    SELECT id, name, force_id, course_id, status INTO v_test
    FROM public.tests
    WHERE id = p_test_id;

    IF v_test IS NULL THEN
      RAISE EXCEPTION 'Test % not found.', p_test_id;
    END IF;

    -- Test must be PUBLISHED or ACTIVE
    IF v_test.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
      RAISE EXCEPTION 'Test is not currently active.';
    END IF;

    -- Check course eligibility
    IF NOT EXISTS (
      SELECT 1 FROM public.test_courses tc
      WHERE tc.test_id = p_test_id AND tc.course_id = v_student.target_course_id
    ) THEN
      RAISE EXCEPTION 'Test is not available for your registered course.';
    END IF;

    -- Student must have valid active effective assignment
    SELECT ta.* INTO v_assignment
    FROM public.test_assignments ta
    JOIN public.batch_enrollments be ON be.batch_id = ta.batch_id
    WHERE ta.test_id = p_test_id
      AND be.student_id = v_student.id
      AND be.status = 'ACTIVE'
      AND ta.status = 'ACTIVE'
      AND ta.available_from <= timezone('utc', now())
      AND (ta.available_until IS NULL OR ta.available_until > timezone('utc', now()))
    LIMIT 1;

    IF v_assignment IS NULL THEN
      RAISE EXCEPTION 'No active assignment found for this test.';
    END IF;
  END IF;

  -- 3. Pattern-Aware Subject Resolution (Enabled sections only; disabled sections contribute ZERO)
  SELECT ARRAY(
    SELECT DISTINCT ts.subject_id
    FROM public.test_sections ts
    WHERE ts.test_id = p_test_id
      AND COALESCE(ts.is_enabled, true) = true
      AND ts.question_count > 0
      AND ts.subject_id IS NOT NULL
    UNION
    SELECT DISTINCT tss.subject_id
    FROM public.test_section_subjects tss
    JOIN public.test_sections ts ON ts.id = tss.test_section_id
    WHERE ts.test_id = p_test_id
      AND COALESCE(ts.is_enabled, true) = true
      AND ts.question_count > 0
      AND tss.subject_id IS NOT NULL
  ) INTO v_enabled_subject_ids;

  IF v_enabled_subject_ids IS NULL OR cardinality(v_enabled_subject_ids) = 0 THEN
    RAISE EXCEPTION 'Familiarization content is incomplete for this test.';
  END IF;

  v_num_subjects := cardinality(v_enabled_subject_ids);
  v_target_counts := array_fill(0, ARRAY[v_num_subjects]);

  -- Distribute 5 questions round-robin across enabled subjects for even representation
  FOR i IN 1..5 LOOP
    v_idx := ((i - 1) % v_num_subjects) + 1;
    v_target_counts[v_idx] := v_target_counts[v_idx] + 1;
  END LOOP;

  -- Fetch questions subject-by-subject strictly from FAMILIARIZATION/PRACTICE
  FOR s_idx IN 1..v_num_subjects LOOP
    v_subj := v_enabled_subject_ids[s_idx];
    v_target := v_target_counts[s_idx];

    FOR v_q IN
      SELECT q.id, q.code, q.stem, q.stem_image_url, q.explanation, q.time_limit_seconds, s.name AS subject_name
      FROM public.questions q
      JOIN public.subjects s ON s.id = q.subject_id
      WHERE q.usage_type IN ('FAMILIARIZATION', 'PRACTICE')
        AND q.status = 'APPROVED'
        AND q.subject_id = v_subj
        AND NOT (q.id = ANY(v_selected_qids))
      ORDER BY q.created_at ASC
      LIMIT v_target
    LOOP
      v_selected_qids := array_append(v_selected_qids, v_q.id);

      SELECT jsonb_agg(
        jsonb_build_object(
          'id', qo.id,
          'label', qo.label,
          'text', qo.text,
          'image_url', qo.image_url,
          'is_correct', qo.is_correct
        ) ORDER BY qo.label
      ) INTO v_opts
      FROM public.question_options qo
      WHERE qo.question_id = v_q.id;

      v_questions := v_questions || jsonb_build_object(
        'id', v_q.id,
        'code', v_q.code,
        'stem', v_q.stem,
        'stem_image_url', v_q.stem_image_url,
        'explanation', v_q.explanation,
        'subject_name', v_q.subject_name,
        'options', COALESCE(v_opts, '[]'::jsonb)
      );
    END LOOP;
  END LOOP;

  -- If any subject lacked sufficient questions, backfill from other enabled subjects
  IF jsonb_array_length(v_questions) < 5 THEN
    FOR v_q IN
      SELECT q.id, q.code, q.stem, q.stem_image_url, q.explanation, q.time_limit_seconds, s.name AS subject_name
      FROM public.questions q
      JOIN public.subjects s ON s.id = q.subject_id
      WHERE q.usage_type IN ('FAMILIARIZATION', 'PRACTICE')
        AND q.status = 'APPROVED'
        AND q.subject_id = ANY(v_enabled_subject_ids)
        AND NOT (q.id = ANY(v_selected_qids))
      ORDER BY q.created_at ASC
      LIMIT (5 - jsonb_array_length(v_questions))
    LOOP
      v_selected_qids := array_append(v_selected_qids, v_q.id);

      SELECT jsonb_agg(
        jsonb_build_object(
          'id', qo.id,
          'label', qo.label,
          'text', qo.text,
          'image_url', qo.image_url,
          'is_correct', qo.is_correct
        ) ORDER BY qo.label
      ) INTO v_opts
      FROM public.question_options qo
      WHERE qo.question_id = v_q.id;

      v_questions := v_questions || jsonb_build_object(
        'id', v_q.id,
        'code', v_q.code,
        'stem', v_q.stem,
        'stem_image_url', v_q.stem_image_url,
        'explanation', v_q.explanation,
        'subject_name', v_q.subject_name,
        'options', COALESCE(v_opts, '[]'::jsonb)
      );
    END LOOP;
  END IF;

  -- Controlled invariant: Exactly 5 questions or Controlled Exception
  IF jsonb_array_length(v_questions) <> 5 THEN
    RAISE EXCEPTION 'Familiarization content is incomplete for this test.';
  END IF;

  RETURN jsonb_build_object(
    'test_id', v_test.id,
    'test_name', v_test.name,
    'duration_seconds', 60,
    'question_count', 5,
    'is_practice_mode', true,
    'questions', v_questions
  );
END;
$function$;
