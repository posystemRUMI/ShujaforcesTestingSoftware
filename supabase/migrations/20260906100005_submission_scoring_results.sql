-- ============================================================================
-- Migration: 20260906100005_submission_scoring_results.sql
-- Description: Submission, Scoring, Results, Answer Review, Retakes (B20-B23)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TEST RESULTS TABLE (B22)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID UNIQUE NOT NULL REFERENCES public.test_attempts(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  total_questions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  marks_obtained NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_marks NUMERIC(10,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  section_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  stanine INT CHECK (stanine IS NULL OR (stanine >= 1 AND stanine <= 9)),
  time_spent_seconds INT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_test_results_student ON public.test_results(student_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON public.test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_attempt ON public.test_results(attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_results_passed ON public.test_results(passed);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_results_student_select"
  ON public.test_results FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = test_results.student_id AND s.profile_id = auth.uid()
    )
  );

-- No direct student INSERT/UPDATE/DELETE on results
CREATE POLICY "test_results_staff_write"
  ON public.test_results FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 2. RETAKE PERMISSIONS TABLE (B23)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.retake_status AS ENUM ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.retake_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  original_attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  approved_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ,
  status public.retake_status NOT NULL DEFAULT 'AVAILABLE',
  notes TEXT,
  consumed_attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_retake_perms_student ON public.retake_permissions(student_id);
CREATE INDEX IF NOT EXISTS idx_retake_perms_test ON public.retake_permissions(test_id);
CREATE INDEX IF NOT EXISTS idx_retake_perms_status ON public.retake_permissions(status);

CREATE TRIGGER trg_retake_permissions_updated_at
  BEFORE UPDATE ON public.retake_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.retake_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retake_perms_student_select"
  ON public.retake_permissions FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = retake_permissions.student_id AND s.profile_id = auth.uid()
    )
  );

-- Students CANNOT self-authorize retakes
CREATE POLICY "retake_perms_staff_write"
  ON public.retake_permissions FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 3. APPROVE RETAKE RPC (B23)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_retake(
  p_student_id UUID,
  p_test_id UUID,
  p_original_attempt_id UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_retake_id UUID;
BEGIN
  -- Students cannot self-authorize
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can approve retakes.';
  END IF;

  -- Verify student exists
  IF NOT EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id) THEN
    RAISE EXCEPTION 'Student not found.';
  END IF;

  -- Verify test exists
  IF NOT EXISTS (SELECT 1 FROM public.tests WHERE id = p_test_id) THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;

  INSERT INTO public.retake_permissions (
    student_id, test_id, original_attempt_id,
    approved_by, expires_at, notes, status
  )
  VALUES (
    p_student_id, p_test_id, p_original_attempt_id,
    auth.uid(), p_expires_at, p_notes, 'AVAILABLE'
  )
  RETURNING id INTO v_retake_id;

  -- Audit
  PERFORM public.log_audit_event(
    'RETAKE_APPROVED',
    'RETAKE_PERMISSION',
    v_retake_id::TEXT,
    jsonb_build_object(
      'student_id', p_student_id,
      'test_id', p_test_id,
      'original_attempt_id', p_original_attempt_id
    )
  );

  RETURN v_retake_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. STANINE CALCULATION HELPER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_stanine(p_percentage NUMERIC)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_percentage >= 96 THEN 9
    WHEN p_percentage >= 89 THEN 8
    WHEN p_percentage >= 77 THEN 7
    WHEN p_percentage >= 60 THEN 6
    WHEN p_percentage >= 40 THEN 5
    WHEN p_percentage >= 23 THEN 4
    WHEN p_percentage >= 11 THEN 3
    WHEN p_percentage >= 4  THEN 2
    ELSE 1
  END;
$$;

-- ----------------------------------------------------------------------------
-- 5. SUBMIT TEST ATTEMPT RPC (B20 + B21 — Transactional & Idempotent)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_test_attempt(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_student RECORD;
  v_test RECORD;
  v_existing_result RECORD;
  v_total_questions INT := 0;
  v_correct INT := 0;
  v_incorrect INT := 0;
  v_skipped INT := 0;
  v_marks_obtained NUMERIC(10,2) := 0;
  v_max_marks NUMERIC(10,2) := 0;
  v_percentage NUMERIC(5,2) := 0;
  v_passed BOOLEAN;
  v_stanine INT;
  v_section_results JSONB := '[]'::jsonb;
  v_section RECORD;
  v_sec_total INT;
  v_sec_correct INT;
  v_sec_incorrect INT;
  v_sec_skipped INT;
  v_sec_marks NUMERIC(10,2);
  v_sec_max NUMERIC(10,2);
  v_result_id UUID;
  v_retake RECORD;
  v_time_spent INT;
  v_submit_status public.attempt_status;
BEGIN
  -- 1. Load attempt with row lock to prevent concurrent submit
  SELECT * INTO v_attempt
  FROM public.test_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF v_attempt IS NULL THEN
    RAISE EXCEPTION 'Attempt not found.';
  END IF;

  -- 2. Idempotency: if already submitted, return existing result
  IF v_attempt.status IN ('SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED') THEN
    SELECT * INTO v_existing_result
    FROM public.test_results WHERE attempt_id = p_attempt_id;

    IF v_existing_result IS NOT NULL THEN
      RETURN jsonb_build_object(
        'result_id', v_existing_result.id,
        'already_submitted', true,
        'percentage', v_existing_result.percentage,
        'passed', v_existing_result.passed,
        'correct_count', v_existing_result.correct_count,
        'incorrect_count', v_existing_result.incorrect_count,
        'skipped_count', v_existing_result.skipped_count,
        'marks_obtained', v_existing_result.marks_obtained,
        'max_marks', v_existing_result.max_marks,
        'stanine', v_existing_result.stanine
      );
    END IF;
  END IF;

  -- 3. Verify ownership or authorized force-submit
  SELECT * INTO v_student FROM public.students WHERE id = v_attempt.student_id;
  IF v_student.profile_id <> auth.uid() AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Cannot submit another student''s attempt.';
  END IF;

  -- 4. Determine submission type
  IF public.is_admin() OR public.is_teacher() THEN
    IF v_student.profile_id <> auth.uid() THEN
      v_submit_status := 'FORCE_SUBMITTED';
    ELSE
      v_submit_status := 'SUBMITTED';
    END IF;
  ELSIF v_attempt.expires_at <= timezone('utc', now()) THEN
    v_submit_status := 'AUTO_SUBMITTED';
  ELSE
    v_submit_status := 'SUBMITTED';
  END IF;

  -- 5. Load test
  SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

  -- 6. TRUSTED SCORING ENGINE (B21)
  -- Process each section
  FOR v_section IN
    SELECT ts.* FROM public.test_sections ts
    WHERE ts.test_id = v_attempt.test_id ORDER BY ts.position
  LOOP
    -- Count questions in this section
    SELECT COUNT(*) INTO v_sec_total
    FROM public.test_section_questions tsq
    WHERE tsq.test_section_id = v_section.id;

    -- Count correct answers
    SELECT COUNT(*) INTO v_sec_correct
    FROM public.test_section_questions tsq
    JOIN public.attempt_answers aa ON aa.question_id = tsq.question_id AND aa.attempt_id = p_attempt_id
    JOIN public.question_options qo ON qo.id = aa.selected_option_id
    WHERE tsq.test_section_id = v_section.id
      AND qo.is_correct = true;

    -- Count incorrect (answered but wrong)
    SELECT COUNT(*) INTO v_sec_incorrect
    FROM public.test_section_questions tsq
    JOIN public.attempt_answers aa ON aa.question_id = tsq.question_id AND aa.attempt_id = p_attempt_id
    WHERE tsq.test_section_id = v_section.id
      AND aa.selected_option_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.question_options qo
        WHERE qo.id = aa.selected_option_id AND qo.is_correct = true
      );

    v_sec_skipped := v_sec_total - v_sec_correct - v_sec_incorrect;
    v_sec_marks := v_sec_correct * v_section.marks_per_question;
    v_sec_max := v_sec_total * v_section.marks_per_question;

    -- Apply negative marking if enabled
    IF v_test.negative_marking AND v_test.negative_mark_value > 0 THEN
      v_sec_marks := v_sec_marks - (v_sec_incorrect * v_test.negative_mark_value);
      IF v_sec_marks < 0 THEN v_sec_marks := 0; END IF;
    END IF;

    v_total_questions := v_total_questions + v_sec_total;
    v_correct := v_correct + v_sec_correct;
    v_incorrect := v_incorrect + v_sec_incorrect;
    v_skipped := v_skipped + v_sec_skipped;
    v_marks_obtained := v_marks_obtained + v_sec_marks;
    v_max_marks := v_max_marks + v_sec_max;

    -- Section result
    v_section_results := v_section_results || jsonb_build_array(
      jsonb_build_object(
        'section_id', v_section.id,
        'section_name', v_section.name,
        'subject_id', v_section.subject_id,
        'total_questions', v_sec_total,
        'correct', v_sec_correct,
        'incorrect', v_sec_incorrect,
        'skipped', v_sec_skipped,
        'marks_obtained', v_sec_marks,
        'max_marks', v_sec_max,
        'percentage', CASE WHEN v_sec_max > 0 THEN ROUND((v_sec_marks / v_sec_max) * 100, 2) ELSE 0 END
      )
    );
  END LOOP;

  -- Overall percentage and pass/fail
  IF v_max_marks > 0 THEN
    v_percentage := ROUND((v_marks_obtained / v_max_marks) * 100, 2);
  END IF;
  v_passed := (v_percentage >= v_test.passing_threshold);
  v_stanine := public.calculate_stanine(v_percentage);

  -- Time spent
  v_time_spent := EXTRACT(EPOCH FROM (timezone('utc', now()) - v_attempt.started_at))::INT;

  -- 7. Set submitted_at exactly once
  UPDATE public.test_attempts
  SET
    submitted_at = timezone('utc', now()),
    status = v_submit_status
  WHERE id = p_attempt_id;

  -- 8. Create result (UNIQUE on attempt_id prevents duplicates)
  INSERT INTO public.test_results (
    attempt_id, student_id, test_id,
    total_questions, correct_count, incorrect_count, skipped_count,
    marks_obtained, max_marks, percentage, passed,
    section_results, stanine, time_spent_seconds
  )
  VALUES (
    p_attempt_id, v_attempt.student_id, v_attempt.test_id,
    v_total_questions, v_correct, v_incorrect, v_skipped,
    v_marks_obtained, v_max_marks, v_percentage, v_passed,
    v_section_results, v_stanine, v_time_spent
  )
  RETURNING id INTO v_result_id;

  -- 9. Consume retake permission if this was a retake
  IF v_attempt.attempt_number > 1 THEN
    UPDATE public.retake_permissions
    SET status = 'USED', consumed_attempt_id = p_attempt_id
    WHERE student_id = v_attempt.student_id
      AND test_id = v_attempt.test_id
      AND status = 'AVAILABLE'
      AND id = (
        SELECT rp.id FROM public.retake_permissions rp
        WHERE rp.student_id = v_attempt.student_id
          AND rp.test_id = v_attempt.test_id
          AND rp.status = 'AVAILABLE'
        ORDER BY rp.approved_at ASC
        LIMIT 1
      );
  END IF;

  -- 10. Audit
  PERFORM public.log_audit_event(
    'ATTEMPT_SUBMITTED',
    'TEST_ATTEMPT',
    p_attempt_id::TEXT,
    jsonb_build_object(
      'result_id', v_result_id,
      'percentage', v_percentage,
      'passed', v_passed,
      'submit_type', v_submit_status,
      'correct', v_correct,
      'incorrect', v_incorrect,
      'skipped', v_skipped
    )
  );

  -- 11. Return result
  RETURN jsonb_build_object(
    'result_id', v_result_id,
    'already_submitted', false,
    'percentage', v_percentage,
    'passed', v_passed,
    'correct_count', v_correct,
    'incorrect_count', v_incorrect,
    'skipped_count', v_skipped,
    'marks_obtained', v_marks_obtained,
    'max_marks', v_max_marks,
    'stanine', v_stanine,
    'section_results', v_section_results,
    'time_spent_seconds', v_time_spent
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. RESULT DETAIL / ANSWER REVIEW RPC (B22)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_result_detail(p_result_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_test RECORD;
  v_student RECORD;
  v_answers JSONB;
  v_section RECORD;
  v_sections JSONB := '[]'::jsonb;
  v_q RECORD;
  v_questions JSONB;
BEGIN
  -- Load result
  SELECT * INTO v_result FROM public.test_results WHERE id = p_result_id;
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Result not found.';
  END IF;

  -- Verify access
  SELECT * INTO v_student FROM public.students WHERE id = v_result.student_id;
  IF v_student.profile_id <> auth.uid() AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  SELECT * INTO v_test FROM public.tests WHERE id = v_result.test_id;

  -- Only show answers after submission (check test settings for reveal)
  IF NOT v_test.show_answer_review AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RETURN jsonb_build_object(
      'result', row_to_json(v_result),
      'answer_review_enabled', false,
      'message', 'Answer review is not enabled for this test.'
    );
  END IF;

  -- Build detailed answer review per section
  FOR v_section IN
    SELECT ts.* FROM public.test_sections ts
    WHERE ts.test_id = v_result.test_id ORDER BY ts.position
  LOOP
    v_questions := '[]'::jsonb;

    FOR v_q IN
      SELECT
        q.id, q.code, q.stem, q.stem_image_url, q.explanation, q.subject_id,
        tsq.marks,
        aa.selected_option_id,
        aa.marked_for_review,
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', qo.id,
            'label', qo.label,
            'text', qo.text,
            'image_url', qo.image_url,
            'is_correct', qo.is_correct
          ) ORDER BY qo.label
        ) FROM public.question_options qo WHERE qo.question_id = q.id) AS options
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      LEFT JOIN public.attempt_answers aa ON aa.question_id = q.id AND aa.attempt_id = v_result.attempt_id
      WHERE tsq.test_section_id = v_section.id
      ORDER BY tsq.position
    LOOP
      v_questions := v_questions || jsonb_build_array(
        jsonb_build_object(
          'question_id', v_q.id,
          'code', v_q.code,
          'stem', v_q.stem,
          'stem_image_url', v_q.stem_image_url,
          'explanation', v_q.explanation,
          'subject_id', v_q.subject_id,
          'marks', v_q.marks,
          'selected_option_id', v_q.selected_option_id,
          'marked_for_review', v_q.marked_for_review,
          'options', v_q.options,
          'status', CASE
            WHEN v_q.selected_option_id IS NULL THEN 'skipped'
            WHEN EXISTS (
              SELECT 1 FROM public.question_options qo
              WHERE qo.id = v_q.selected_option_id AND qo.is_correct = true
            ) THEN 'correct'
            ELSE 'incorrect'
          END
        )
      );
    END LOOP;

    v_sections := v_sections || jsonb_build_array(
      jsonb_build_object(
        'section_id', v_section.id,
        'section_name', v_section.name,
        'questions', v_questions
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'result', jsonb_build_object(
      'id', v_result.id,
      'attempt_id', v_result.attempt_id,
      'student_id', v_result.student_id,
      'test_id', v_result.test_id,
      'total_questions', v_result.total_questions,
      'correct_count', v_result.correct_count,
      'incorrect_count', v_result.incorrect_count,
      'skipped_count', v_result.skipped_count,
      'marks_obtained', v_result.marks_obtained,
      'max_marks', v_result.max_marks,
      'percentage', v_result.percentage,
      'passed', v_result.passed,
      'section_results', v_result.section_results,
      'stanine', v_result.stanine,
      'time_spent_seconds', v_result.time_spent_seconds,
      'generated_at', v_result.generated_at
    ),
    'test', jsonb_build_object(
      'id', v_test.id,
      'name', v_test.name,
      'passing_threshold', v_test.passing_threshold
    ),
    'student', jsonb_build_object(
      'id', v_student.id,
      'roll_number', v_student.roll_number
    ),
    'sections', v_sections,
    'answer_review_enabled', true
  );
END;
$$;
