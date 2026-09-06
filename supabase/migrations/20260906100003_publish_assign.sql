-- ============================================================================
-- Migration: 20260906100003_publish_assign.sql
-- Description: Test Publishing & Assignment (Phase B15)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TEST ASSIGNMENTS TABLE
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.assignment_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  available_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  available_until TIMESTAMPTZ,
  max_attempts INT NOT NULL DEFAULT 1 CHECK (max_attempts >= 1),
  status public.assignment_status NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (test_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_test_assignments_test ON public.test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_batch ON public.test_assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_status ON public.test_assignments(status);

CREATE TRIGGER trg_test_assignments_updated_at
  BEFORE UPDATE ON public.test_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;

-- Staff: full access
CREATE POLICY "test_assignments_staff_select"
  ON public.test_assignments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.batch_enrollments be
      JOIN public.students s ON s.id = be.student_id
      WHERE be.batch_id = test_assignments.batch_id
        AND s.profile_id = auth.uid()
        AND be.status = 'ACTIVE'
    )
  );

CREATE POLICY "test_assignments_staff_write"
  ON public.test_assignments FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Student read access to published tests once assigned to candidate's batch
CREATE POLICY "tests_student_assigned_select"
  ON public.tests FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND status IN ('PUBLISHED', 'ACTIVE', 'COMPLETED')
    AND EXISTS (
      SELECT 1 FROM public.test_assignments ta
      JOIN public.batch_enrollments be ON be.batch_id = ta.batch_id
      JOIN public.students s ON s.id = be.student_id
      WHERE ta.test_id = tests.id
        AND s.profile_id = auth.uid()
        AND ta.status = 'ACTIVE'
    )
  );

-- Student read access to sections of assigned tests
CREATE POLICY "test_sections_student_assigned_select"
  ON public.test_sections FOR SELECT
  TO authenticated
  USING (
    public.is_student()
    AND EXISTS (
      SELECT 1 FROM public.tests t
      JOIN public.test_assignments ta ON ta.test_id = t.id
      JOIN public.batch_enrollments be ON be.batch_id = ta.batch_id
      JOIN public.students s ON s.id = be.student_id
      WHERE t.id = test_sections.test_id
        AND s.profile_id = auth.uid()
        AND ta.status = 'ACTIVE'
        AND t.status IN ('PUBLISHED', 'ACTIVE', 'COMPLETED')
    )
  );

-- ----------------------------------------------------------------------------
-- 2. PUBLISH TEST RPC (Trusted Validation)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_test(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test RECORD;
  v_section RECORD;
  v_section_question_count INT;
  v_total_questions INT := 0;
  v_total_marks INT := 0;
  v_total_duration INT := 0;
BEGIN
  -- Authorization
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can publish tests.';
  END IF;

  -- Load test
  SELECT * INTO v_test FROM public.tests WHERE id = p_test_id;
  IF v_test IS NULL THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;

  IF v_test.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Only DRAFT tests can be published. Current status: %', v_test.status;
  END IF;

  -- Validate test metadata
  IF v_test.name IS NULL OR trim(v_test.name) = '' THEN
    RAISE EXCEPTION 'Test name is required.';
  END IF;
  IF v_test.force_id IS NULL THEN
    RAISE EXCEPTION 'Force is required.';
  END IF;
  IF v_test.course_id IS NULL THEN
    RAISE EXCEPTION 'Course is required.';
  END IF;

  -- Validate sections exist
  IF NOT EXISTS (SELECT 1 FROM public.test_sections WHERE test_id = p_test_id) THEN
    RAISE EXCEPTION 'Test must have at least one section.';
  END IF;

  -- Validate each section
  FOR v_section IN
    SELECT * FROM public.test_sections WHERE test_id = p_test_id ORDER BY position
  LOOP
    -- Count actual questions assigned
    SELECT COUNT(*) INTO v_section_question_count
    FROM public.test_section_questions
    WHERE test_section_id = v_section.id;

    IF v_section_question_count = 0 THEN
      RAISE EXCEPTION 'Section "%" has no questions assigned.', v_section.name;
    END IF;

    -- Verify each question has exactly 4 options and 1 correct
    IF EXISTS (
      SELECT tsq.question_id
      FROM public.test_section_questions tsq
      WHERE tsq.test_section_id = v_section.id
        AND (
          (SELECT COUNT(*) FROM public.question_options qo WHERE qo.question_id = tsq.question_id) <> 4
          OR (SELECT COUNT(*) FROM public.question_options qo WHERE qo.question_id = tsq.question_id AND qo.is_correct = true) <> 1
        )
    ) THEN
      RAISE EXCEPTION 'Section "%" contains questions with invalid options (must have exactly 4 options with 1 correct).', v_section.name;
    END IF;

    -- Verify all questions are APPROVED
    IF EXISTS (
      SELECT 1
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      WHERE tsq.test_section_id = v_section.id AND q.status <> 'APPROVED'
    ) THEN
      RAISE EXCEPTION 'Section "%" contains non-APPROVED questions.', v_section.name;
    END IF;

    -- Update section question_count if out of sync
    UPDATE public.test_sections
    SET question_count = v_section_question_count
    WHERE id = v_section.id;

    v_total_questions := v_total_questions + v_section_question_count;
    v_total_marks := v_total_marks + (v_section_question_count * v_section.marks_per_question);
    v_total_duration := v_total_duration + v_section.duration_minutes;
  END LOOP;

  -- Final validation
  IF v_total_questions = 0 THEN
    RAISE EXCEPTION 'Test has no questions.';
  END IF;

  -- Publish: update test status and computed fields
  UPDATE public.tests
  SET
    status = 'PUBLISHED',
    total_marks = v_total_marks,
    duration_minutes = v_total_duration,
    published_at = timezone('utc', now()),
    published_by = auth.uid()
  WHERE id = p_test_id;

  -- Audit
  PERFORM public.log_audit_event(
    'TEST_PUBLISHED',
    'TEST',
    p_test_id::TEXT,
    jsonb_build_object(
      'name', v_test.name,
      'total_questions', v_total_questions,
      'total_marks', v_total_marks,
      'duration_minutes', v_total_duration
    )
  );

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. ASSIGN TEST RPC (Trusted Assignment)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_test(
  p_test_id UUID,
  p_batch_id UUID,
  p_available_from TIMESTAMPTZ DEFAULT timezone('utc', now()),
  p_available_until TIMESTAMPTZ DEFAULT NULL,
  p_max_attempts INT DEFAULT 1,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assignment_id UUID;
  v_test_status public.test_status;
BEGIN
  -- Authorization: Students CANNOT self-assign
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can assign tests.';
  END IF;

  -- Verify test is published
  SELECT status INTO v_test_status FROM public.tests WHERE id = p_test_id;
  IF v_test_status IS NULL THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;
  IF v_test_status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Test must be PUBLISHED or ACTIVE to assign. Current status: %', v_test_status;
  END IF;

  -- Verify batch exists
  IF NOT EXISTS (SELECT 1 FROM public.batches WHERE id = p_batch_id) THEN
    RAISE EXCEPTION 'Batch not found.';
  END IF;

  -- Create assignment
  INSERT INTO public.test_assignments (
    test_id, batch_id, assigned_by,
    available_from, available_until, max_attempts, notes, status
  )
  VALUES (
    p_test_id, p_batch_id, auth.uid(),
    p_available_from, p_available_until, p_max_attempts, p_notes, 'ACTIVE'
  )
  ON CONFLICT (test_id, batch_id) DO UPDATE SET
    available_from = EXCLUDED.available_from,
    available_until = EXCLUDED.available_until,
    max_attempts = EXCLUDED.max_attempts,
    notes = EXCLUDED.notes,
    status = 'ACTIVE',
    updated_at = timezone('utc', now())
  RETURNING id INTO v_assignment_id;

  -- Activate test if not already
  UPDATE public.tests SET status = 'ACTIVE' WHERE id = p_test_id AND status = 'PUBLISHED';

  -- Audit
  PERFORM public.log_audit_event(
    'TEST_ASSIGNED',
    'TEST_ASSIGNMENT',
    v_assignment_id::TEXT,
    jsonb_build_object(
      'test_id', p_test_id,
      'batch_id', p_batch_id,
      'max_attempts', p_max_attempts
    )
  );

  RETURN v_assignment_id;
END;
$$;
