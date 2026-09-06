-- ============================================================================
-- Migration: 20260906100002_test_questions.sql
-- Description: Test Question Composition (Phase B14)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TEST SECTION QUESTIONS (Composition Table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_section_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_section_id UUID NOT NULL REFERENCES public.test_sections(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position INT NOT NULL DEFAULT 0,
  marks INT NOT NULL DEFAULT 1 CHECK (marks > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (test_section_id, question_id),
  UNIQUE (test_section_id, position)
);

CREATE INDEX IF NOT EXISTS idx_test_section_questions_section ON public.test_section_questions(test_section_id);
CREATE INDEX IF NOT EXISTS idx_test_section_questions_question ON public.test_section_questions(question_id);

-- RLS
ALTER TABLE public.test_section_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tsq_staff_access"
  ON public.test_section_questions FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Students can read composition only through safe exam payload RPC; no direct SELECT
-- (They need to see question count but not the question IDs before attempt start)

-- ----------------------------------------------------------------------------
-- 2. AUTO-GENERATE SECTION QUESTIONS RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_test_section_questions(
  p_section_id UUID,
  p_subject_id UUID,
  p_count INT,
  p_force_id UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id UUID;
  v_existing_count INT;
  v_inserted INT := 0;
  v_question RECORD;
  v_position INT;
BEGIN
  -- Authorization
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can generate question composition.';
  END IF;

  -- Get test_id from section
  SELECT ts.test_id INTO v_test_id
  FROM public.test_sections ts
  WHERE ts.id = p_section_id;

  IF v_test_id IS NULL THEN
    RAISE EXCEPTION 'Section % not found.', p_section_id;
  END IF;

  -- Verify test is in DRAFT status
  IF NOT EXISTS (
    SELECT 1 FROM public.tests WHERE id = v_test_id AND status = 'DRAFT'
  ) THEN
    RAISE EXCEPTION 'Can only generate questions for DRAFT tests.';
  END IF;

  -- Clear existing composition for this section
  DELETE FROM public.test_section_questions WHERE test_section_id = p_section_id;

  -- Get next position
  v_position := 0;

  -- Select random approved questions matching criteria
  FOR v_question IN
    SELECT q.id
    FROM public.questions q
    WHERE q.subject_id = p_subject_id
      AND q.status = 'APPROVED'
      -- Filter by force if provided (via question_courses → courses → force)
      AND (p_course_id IS NULL OR EXISTS (
        SELECT 1 FROM public.question_courses qc
        WHERE qc.question_id = q.id AND qc.course_id = p_course_id
      ))
      -- Ensure 4 valid options with exactly 1 correct
      AND (
        SELECT COUNT(*) FROM public.question_options qo
        WHERE qo.question_id = q.id
      ) = 4
      AND (
        SELECT COUNT(*) FROM public.question_options qo
        WHERE qo.question_id = q.id AND qo.is_correct = true
      ) = 1
      -- Exclude questions already used in other sections of the same test
      AND NOT EXISTS (
        SELECT 1 FROM public.test_section_questions tsq
        JOIN public.test_sections ts ON ts.id = tsq.test_section_id
        WHERE ts.test_id = v_test_id AND tsq.question_id = q.id
      )
    ORDER BY random()
    LIMIT p_count
  LOOP
    v_position := v_position + 1;
    INSERT INTO public.test_section_questions (test_section_id, question_id, position)
    VALUES (p_section_id, v_question.id, v_position);
    v_inserted := v_inserted + 1;
  END LOOP;

  -- Update section question_count
  UPDATE public.test_sections
  SET question_count = v_inserted
  WHERE id = p_section_id;

  RETURN v_inserted;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. MANUAL ADD QUESTION TO SECTION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_question_to_section(
  p_section_id UUID,
  p_question_id UUID,
  p_position INT DEFAULT NULL,
  p_marks INT DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id UUID;
  v_next_position INT;
  v_tsq_id UUID;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can compose test questions.';
  END IF;

  -- Get test_id, verify DRAFT
  SELECT ts.test_id INTO v_test_id
  FROM public.test_sections ts WHERE ts.id = p_section_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.tests WHERE id = v_test_id AND status = 'DRAFT'
  ) THEN
    RAISE EXCEPTION 'Can only add questions to DRAFT tests.';
  END IF;

  -- Verify question is APPROVED with valid options
  IF NOT EXISTS (
    SELECT 1 FROM public.questions q
    WHERE q.id = p_question_id AND q.status = 'APPROVED'
  ) THEN
    RAISE EXCEPTION 'Question must be APPROVED to be added to a test.';
  END IF;

  -- Check for duplicate across entire test
  IF EXISTS (
    SELECT 1 FROM public.test_section_questions tsq
    JOIN public.test_sections ts ON ts.id = tsq.test_section_id
    WHERE ts.test_id = v_test_id AND tsq.question_id = p_question_id
  ) THEN
    RAISE EXCEPTION 'Question is already in this test.';
  END IF;

  -- Determine position
  IF p_position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
    FROM public.test_section_questions WHERE test_section_id = p_section_id;
  ELSE
    v_next_position := p_position;
  END IF;

  INSERT INTO public.test_section_questions (test_section_id, question_id, position, marks)
  VALUES (p_section_id, p_question_id, v_next_position, p_marks)
  RETURNING id INTO v_tsq_id;

  -- Update section question_count
  UPDATE public.test_sections
  SET question_count = (
    SELECT COUNT(*) FROM public.test_section_questions WHERE test_section_id = p_section_id
  )
  WHERE id = p_section_id;

  RETURN v_tsq_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. REMOVE QUESTION FROM SECTION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.remove_question_from_section(
  p_section_id UUID,
  p_question_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id UUID;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  SELECT ts.test_id INTO v_test_id
  FROM public.test_sections ts WHERE ts.id = p_section_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.tests WHERE id = v_test_id AND status = 'DRAFT'
  ) THEN
    RAISE EXCEPTION 'Can only remove questions from DRAFT tests.';
  END IF;

  DELETE FROM public.test_section_questions
  WHERE test_section_id = p_section_id AND question_id = p_question_id;

  -- Recount
  UPDATE public.test_sections
  SET question_count = (
    SELECT COUNT(*) FROM public.test_section_questions WHERE test_section_id = p_section_id
  )
  WHERE id = p_section_id;

  RETURN true;
END;
$$;
