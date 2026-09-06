-- ============================================================================
-- Migration: 20260906100004_attempts.sql
-- Description: Attempt Creation, Eligibility, Safe Payload, Timing (B16-B18)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ATTEMPT STATUS ENUM
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.attempt_status AS ENUM (
    'IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EXPIRED', 'FORCE_SUBMITTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. TEST ATTEMPTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  assignment_id UUID NOT NULL REFERENCES public.test_assignments(id) ON DELETE RESTRICT,
  attempt_number INT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  current_section_id UUID REFERENCES public.test_sections(id),
  status public.attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
  question_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  option_order JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, test_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_student ON public.test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON public.test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_status ON public.test_attempts(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_assignment ON public.test_attempts(assignment_id);

CREATE TRIGGER trg_test_attempts_updated_at
  BEFORE UPDATE ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_attempts_student_select"
  ON public.test_attempts FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = test_attempts.student_id AND s.profile_id = auth.uid()
    )
  );

-- Only RPCs create/update attempts (no direct write for students)
CREATE POLICY "test_attempts_staff_write"
  ON public.test_attempts FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 3. ATTEMPT SECTION PROGRESS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attempt_section_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.test_sections(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE (attempt_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_asp_attempt ON public.attempt_section_progress(attempt_id);

ALTER TABLE public.attempt_section_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asp_student_select"
  ON public.attempt_section_progress FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.test_attempts ta
      JOIN public.students s ON s.id = ta.student_id
      WHERE ta.id = attempt_section_progress.attempt_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "asp_staff_write"
  ON public.attempt_section_progress FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 4. ATTEMPT ANSWERS TABLE (B19)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  marked_for_review BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON public.attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question ON public.attempt_answers(question_id);

CREATE TRIGGER trg_attempt_answers_updated_at
  BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempt_answers_student_select"
  ON public.attempt_answers FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.test_attempts ta
      JOIN public.students s ON s.id = ta.student_id
      WHERE ta.id = attempt_answers.attempt_id AND s.profile_id = auth.uid()
    )
  );

-- Students can only write through save_answer RPC, not direct INSERT/UPDATE
CREATE POLICY "attempt_answers_staff_write"
  ON public.attempt_answers FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 4b. RETAKE PERMISSIONS TABLE
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

CREATE POLICY "retake_perms_staff_write"
  ON public.retake_permissions FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 5. SERVER TIME HELPER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT timezone('utc', now());
$$;

-- ----------------------------------------------------------------------------
-- 6. START TEST ATTEMPT RPC (B16 — Trusted Attempt Creation)
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
$$;

-- ----------------------------------------------------------------------------
-- 7. SAFE EXAM PAYLOAD RPC (B17)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_safe_exam_payload(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_student RECORD;
  v_test RECORD;
  v_sections JSONB;
  v_section RECORD;
  v_section_data JSONB;
  v_questions JSONB;
  v_q RECORD;
  v_q_data JSONB;
  v_options JSONB;
  v_saved_answers JSONB;
  v_answer RECORD;
  v_section_progress RECORD;
BEGIN
  -- Load attempt
  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF v_attempt IS NULL THEN
    RAISE EXCEPTION 'Attempt not found.';
  END IF;

  -- Verify ownership
  SELECT * INTO v_student
  FROM public.students WHERE id = v_attempt.student_id AND profile_id = auth.uid();

  IF v_student IS NULL AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Not your attempt.';
  END IF;

  -- Load test
  SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

  -- Build sections with questions
  v_sections := '[]'::jsonb;

  FOR v_section IN
    SELECT ts.* FROM public.test_sections ts
    WHERE ts.test_id = v_test.id ORDER BY ts.position
  LOOP
    -- Get section progress
    SELECT * INTO v_section_progress
    FROM public.attempt_section_progress
    WHERE attempt_id = p_attempt_id AND section_id = v_section.id;

    -- Build questions (WITHOUT is_correct, explanation)
    v_questions := '[]'::jsonb;
    FOR v_q IN
      SELECT q.id, q.code, q.stem, q.stem_image_url, q.subject_id, q.difficulty
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      WHERE tsq.test_section_id = v_section.id
      ORDER BY tsq.position
    LOOP
      -- Build options (WITHOUT is_correct!)
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', qo.id,
          'label', qo.label,
          'text', qo.text,
          'image_url', qo.image_url
        ) ORDER BY qo.label
      ), '[]'::jsonb) INTO v_options
      FROM public.question_options qo
      WHERE qo.question_id = v_q.id;

      v_q_data := jsonb_build_object(
        'id', v_q.id,
        'code', v_q.code,
        'stem', v_q.stem,
        'stem_image_url', v_q.stem_image_url,
        'subject_id', v_q.subject_id,
        'options', v_options
      );

      v_questions := v_questions || jsonb_build_array(v_q_data);
    END LOOP;

    v_section_data := jsonb_build_object(
      'id', v_section.id,
      'name', v_section.name,
      'position', v_section.position,
      'question_count', v_section.question_count,
      'duration_minutes', v_section.duration_minutes,
      'marks_per_question', v_section.marks_per_question,
      'started_at', v_section_progress.started_at,
      'expires_at', v_section_progress.expires_at,
      'completed_at', v_section_progress.completed_at,
      'questions', v_questions
    );

    v_sections := v_sections || jsonb_build_array(v_section_data);
  END LOOP;

  -- Build saved answers
  SELECT COALESCE(jsonb_object_agg(
    aa.question_id::text,
    jsonb_build_object(
      'selected_option_id', aa.selected_option_id,
      'marked_for_review', aa.marked_for_review,
      'answered_at', aa.answered_at
    )
  ), '{}'::jsonb) INTO v_saved_answers
  FROM public.attempt_answers aa
  WHERE aa.attempt_id = p_attempt_id;

  -- Return safe payload
  RETURN jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'attempt_number', v_attempt.attempt_number,
      'started_at', v_attempt.started_at,
      'expires_at', v_attempt.expires_at,
      'status', v_attempt.status,
      'current_section_id', v_attempt.current_section_id,
      'question_order', v_attempt.question_order,
      'option_order', v_attempt.option_order
    ),
    'test', jsonb_build_object(
      'id', v_test.id,
      'name', v_test.name,
      'description', v_test.description,
      'duration_minutes', v_test.duration_minutes,
      'total_marks', v_test.total_marks,
      'passing_threshold', v_test.passing_threshold,
      'shuffle_questions', v_test.shuffle_questions,
      'shuffle_options', v_test.shuffle_options,
      'allow_section_navigation', v_test.allow_section_navigation,
      'show_result_immediately', v_test.show_result_immediately
    ),
    'student', jsonb_build_object(
      'id', v_student.id,
      'roll_number', v_student.roll_number
    ),
    'sections', v_sections,
    'saved_answers', v_saved_answers,
    'server_time', timezone('utc', now())
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. ADVANCE SECTION RPC (B18)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_section(
  p_attempt_id UUID,
  p_next_section_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_student RECORD;
  v_current_section RECORD;
  v_next_section RECORD;
BEGIN
  -- Load and verify
  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF v_attempt IS NULL OR v_attempt.status <> 'IN_PROGRESS' THEN
    RAISE EXCEPTION 'Attempt not available for section advancement.';
  END IF;

  -- Verify ownership
  SELECT * INTO v_student
  FROM public.students WHERE id = v_attempt.student_id AND profile_id = auth.uid();
  IF v_student IS NULL AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  -- Check expiry
  IF v_attempt.expires_at <= timezone('utc', now()) THEN
    RAISE EXCEPTION 'Attempt has expired.';
  END IF;

  -- Mark current section as completed
  UPDATE public.attempt_section_progress
  SET completed_at = timezone('utc', now())
  WHERE attempt_id = p_attempt_id AND section_id = v_attempt.current_section_id
    AND completed_at IS NULL;

  -- Verify next section belongs to same test
  SELECT * INTO v_next_section
  FROM public.test_sections
  WHERE id = p_next_section_id AND test_id = v_attempt.test_id;

  IF v_next_section IS NULL THEN
    RAISE EXCEPTION 'Invalid section for this test.';
  END IF;

  -- Initialize next section progress
  INSERT INTO public.attempt_section_progress (
    attempt_id, section_id, started_at, expires_at
  )
  VALUES (
    p_attempt_id,
    p_next_section_id,
    timezone('utc', now()),
    LEAST(
      timezone('utc', now()) + (v_next_section.duration_minutes * interval '1 minute'),
      v_attempt.expires_at
    )
  )
  ON CONFLICT (attempt_id, section_id) DO UPDATE SET
    started_at = COALESCE(attempt_section_progress.started_at, timezone('utc', now())),
    expires_at = LEAST(
      timezone('utc', now()) + (v_next_section.duration_minutes * interval '1 minute'),
      v_attempt.expires_at
    );

  -- Update current section
  UPDATE public.test_attempts
  SET current_section_id = p_next_section_id
  WHERE id = p_attempt_id;

  RETURN jsonb_build_object(
    'section_id', p_next_section_id,
    'started_at', timezone('utc', now()),
    'expires_at', LEAST(
      timezone('utc', now()) + (v_next_section.duration_minutes * interval '1 minute'),
      v_attempt.expires_at
    ),
    'server_time', timezone('utc', now())
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. SAVE ANSWER RPC (B19 — Autosave)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_answer(
  p_attempt_id UUID,
  p_question_id UUID,
  p_selected_option_id UUID DEFAULT NULL,
  p_marked_for_review BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_student RECORD;
BEGIN
  -- Load attempt
  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF v_attempt IS NULL THEN
    RAISE EXCEPTION 'Attempt not found.';
  END IF;

  -- Verify active
  IF v_attempt.status <> 'IN_PROGRESS' THEN
    RAISE EXCEPTION 'Cannot save answers: attempt is %.', v_attempt.status;
  END IF;

  -- Check expiry
  IF v_attempt.expires_at <= timezone('utc', now()) THEN
    RAISE EXCEPTION 'Cannot save answers: attempt has expired.';
  END IF;

  -- Verify ownership
  SELECT * INTO v_student
  FROM public.students WHERE id = v_attempt.student_id AND profile_id = auth.uid();
  IF v_student IS NULL AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  -- Verify question belongs to this test composition
  IF NOT EXISTS (
    SELECT 1
    FROM public.test_section_questions tsq
    JOIN public.test_sections ts ON ts.id = tsq.test_section_id
    WHERE ts.test_id = v_attempt.test_id AND tsq.question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'Question does not belong to this test.';
  END IF;

  -- Verify option belongs to question (if selected)
  IF p_selected_option_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.question_options
      WHERE id = p_selected_option_id AND question_id = p_question_id
    ) THEN
      RAISE EXCEPTION 'Option does not belong to this question.';
    END IF;
  END IF;

  -- Upsert answer
  INSERT INTO public.attempt_answers (
    attempt_id, question_id, selected_option_id, marked_for_review, answered_at
  )
  VALUES (
    p_attempt_id, p_question_id, p_selected_option_id, p_marked_for_review, timezone('utc', now())
  )
  ON CONFLICT (attempt_id, question_id) DO UPDATE SET
    selected_option_id = EXCLUDED.selected_option_id,
    marked_for_review = EXCLUDED.marked_for_review,
    answered_at = timezone('utc', now()),
    updated_at = timezone('utc', now());

  RETURN true;
END;
$$;
