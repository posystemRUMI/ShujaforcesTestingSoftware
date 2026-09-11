-- Migration: Fix get_safe_exam_payload option ordering aggregate bug, section fields & nested objects
-- Resolves 'column "o.ord" must appear in the GROUP BY clause...' and safe object structure.

CREATE OR REPLACE FUNCTION public.get_safe_exam_payload(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_test RECORD;
  v_current_section RECORD;
  v_asp RECORD;
  v_sections JSONB := '[]'::jsonb;
  v_qids UUID[];
  v_q RECORD;
  v_opts JSONB;
  v_section RECORD;
  v_caller_role TEXT;
  v_student_id UUID;
  v_rem_sec INT;
  v_sec_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Fetch attempt
  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  -- 2. Security Check: Staff or owning Student only
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role = 'STUDENT' THEN
    SELECT id INTO v_student_id FROM public.students WHERE profile_id = auth.uid();
    IF v_attempt.student_id <> v_student_id THEN
      RAISE EXCEPTION 'Unauthorized: You do not own this test attempt.';
    END IF;
  ELSIF v_caller_role NOT IN ('ADMIN', 'TEACHER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 3. Test Details
  SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

  -- 4. Current Section Details
  SELECT ts.name, ts.duration_minutes INTO v_current_section
  FROM public.test_sections ts
  WHERE ts.id = v_attempt.current_section_id;

  SELECT * INTO v_asp
  FROM public.attempt_section_progress
  WHERE attempt_id = p_attempt_id AND section_id = v_attempt.current_section_id;

  IF v_asp IS NOT NULL AND v_asp.expires_at IS NOT NULL THEN
    v_rem_sec := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_asp.expires_at - timezone('utc', now()))))::INT);
  ELSE
    v_rem_sec := COALESCE(v_current_section.duration_minutes * 60, 1800);
  END IF;

  IF v_asp IS NOT NULL AND v_asp.completed_at IS NOT NULL THEN
    v_sec_status := 'COMPLETED';
  ELSE
    v_sec_status := 'IN_PROGRESS';
  END IF;

  -- 5. Build full safe payload
  FOR v_section IN
    SELECT ts.id, ts.name, ts.duration_minutes
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
              ) ORDER BY o.ord
            ) INTO v_opts
            FROM public.question_options qo
            JOIN jsonb_array_elements_text(v_attempt.option_order->(v_q.id::text)) WITH ORDINALITY o(opt_id, ord)
              ON qo.id::uuid = o.opt_id::uuid;
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
        'duration_minutes', v_section.duration_minutes,
        'questions', v_section_questions
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'test_id', v_test.id,
    'test_name', v_test.name,
    'test_status', v_test.status,
    'attempt_status', v_attempt.status,
    'current_section_id', v_attempt.current_section_id,
    'current_section_name', COALESCE(v_current_section.name, 'General Section'),
    'current_section_status', v_sec_status,
    'time_remaining_seconds', v_rem_sec,
    'started_at', v_attempt.started_at,
    'sections', v_sections,
    'test', jsonb_build_object(
      'id', v_test.id,
      'name', v_test.name,
      'status', v_test.status,
      'duration_minutes', v_test.duration_minutes
    ),
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'status', v_attempt.status,
      'expires_at', v_asp.expires_at,
      'started_at', v_attempt.started_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_safe_exam_payload(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_safe_exam_payload(UUID) TO authenticated;
