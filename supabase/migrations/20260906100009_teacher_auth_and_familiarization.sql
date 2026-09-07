-- ============================================================================
-- Migration: 20260906100009_teacher_auth_and_familiarization.sql
-- Description: 1. Teacher Ownership & Scope RLS (Teacher can only edit/delete/manage own tests)
--              2. Master Pattern Templates remain strictly ADMIN-only for writes
--              3. Deterministic schema upgrades without EXCEPTION WHEN OTHERS THEN NULL
--              4. Question usage_type (EXAM, PRACTICE, FAMILIARIZATION)
--              5. Lightweight familiarization completion tracking table & RPCs
--              6. Hardened Familiarization Payload RPC (eligibility + exact 5 questions + pattern-aware)
--              7. Seed 5 dedicated familiarization questions per subject
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DETERMINISTIC SCHEMA UPGRADES (No EXCEPTION WHEN OTHERS THEN NULL)
-- ----------------------------------------------------------------------------
-- Add is_enabled column to test_sections if not exists
ALTER TABLE public.test_sections
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add usage_type column to questions if not exists
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS usage_type TEXT NOT NULL DEFAULT 'EXAM';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'questions_usage_type_check'
  ) THEN
    ALTER TABLE public.questions
      ADD CONSTRAINT questions_usage_type_check
      CHECK (usage_type IN ('EXAM', 'PRACTICE', 'FAMILIARIZATION'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_questions_usage_type ON public.questions(usage_type);

-- Default created_by to auth.uid() on public.tests
ALTER TABLE public.tests ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Trigger to guarantee created_by is populated and cannot be forged by teachers
CREATE OR REPLACE FUNCTION public.set_test_created_by()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL OR (public.is_teacher() AND NOT public.is_admin()) THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_test_created_by ON public.tests;
CREATE TRIGGER trg_set_test_created_by
  BEFORE INSERT ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_test_created_by();

-- ----------------------------------------------------------------------------
-- 2. TEACHER OWNERSHIP & MANAGEMENT HELPER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_test(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin() OR (
    public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = p_test_id AND t.created_by = auth.uid()
    )
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. STRICT ROW LEVEL SECURITY: TESTS & COMPOSITION
-- ----------------------------------------------------------------------------
-- A. TESTS TABLE
DROP POLICY IF EXISTS "tests_staff_insert" ON public.tests;
CREATE POLICY "tests_staff_insert"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "tests_staff_update" ON public.tests;
CREATE POLICY "tests_staff_update"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR (public.is_teacher() AND created_by = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.is_teacher() AND created_by = auth.uid()));

DROP POLICY IF EXISTS "tests_staff_delete" ON public.tests;
CREATE POLICY "tests_staff_delete"
  ON public.tests FOR DELETE
  TO authenticated
  USING (public.is_admin() OR (public.is_teacher() AND created_by = auth.uid() AND status = 'DRAFT'));

-- B. TEST SECTIONS TABLE
DROP POLICY IF EXISTS "test_sections_staff_select" ON public.test_sections;
CREATE POLICY "test_sections_staff_select"
  ON public.test_sections FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "test_sections_staff_write" ON public.test_sections;
CREATE POLICY "test_sections_staff_write"
  ON public.test_sections FOR ALL
  TO authenticated
  USING (public.can_manage_test(test_id))
  WITH CHECK (public.can_manage_test(test_id));

-- C. TEST SECTION SUBJECTS TABLE
DROP POLICY IF EXISTS "test_sec_subj_staff_access" ON public.test_section_subjects;
CREATE POLICY "test_sec_subj_staff_access"
  ON public.test_section_subjects FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.test_sections ts
      WHERE ts.id = test_section_subjects.test_section_id
        AND public.can_manage_test(ts.test_id)
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.test_sections ts
      WHERE ts.id = test_section_subjects.test_section_id
        AND public.can_manage_test(ts.test_id)
    )
  );

-- D. TEST SECTION QUESTIONS TABLE
DROP POLICY IF EXISTS "tsq_staff_access" ON public.test_section_questions;
CREATE POLICY "tsq_staff_access"
  ON public.test_section_questions FOR ALL
  TO authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.test_sections ts
      WHERE ts.id = test_section_questions.test_section_id
        AND public.can_manage_test(ts.test_id)
    )
  )
  WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.test_sections ts
      WHERE ts.id = test_section_questions.test_section_id
        AND public.can_manage_test(ts.test_id)
    )
  );

-- E. TEST ASSIGNMENTS TABLE
DROP POLICY IF EXISTS "test_assignments_staff_write" ON public.test_assignments;
CREATE POLICY "test_assignments_staff_write"
  ON public.test_assignments FOR ALL
  TO authenticated
  USING (public.can_manage_test(test_id))
  WITH CHECK (public.can_manage_test(test_id));

-- F. QUESTIONS & OPTIONS
DROP POLICY IF EXISTS "questions_staff_policy" ON public.questions;
CREATE POLICY "questions_staff_policy"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

DROP POLICY IF EXISTS "question_options_staff_policy" ON public.question_options;
CREATE POLICY "question_options_staff_policy"
  ON public.question_options FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 4. MASTER PATTERN TEMPLATES: STRICTLY ADMIN-ONLY WRITES, PUBLIC READ-ONLY
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "templates_admin_full" ON public.test_pattern_templates;
CREATE POLICY "templates_admin_full"
  ON public.test_pattern_templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "templates_teacher_read" ON public.test_pattern_templates;
DROP POLICY IF EXISTS "templates_read_all" ON public.test_pattern_templates;
CREATE POLICY "templates_read_all"
  ON public.test_pattern_templates FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "pattern_sections_admin_full" ON public.test_pattern_sections;
CREATE POLICY "pattern_sections_admin_full"
  ON public.test_pattern_sections FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pattern_sections_teacher_read" ON public.test_pattern_sections;
DROP POLICY IF EXISTS "pattern_sections_read_all" ON public.test_pattern_sections;
CREATE POLICY "pattern_sections_read_all"
  ON public.test_pattern_sections FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "pattern_sec_subj_admin_full" ON public.test_pattern_section_subjects;
CREATE POLICY "pattern_sec_subj_admin_full"
  ON public.test_pattern_section_subjects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pattern_sec_subj_teacher_read" ON public.test_pattern_section_subjects;
DROP POLICY IF EXISTS "pattern_sec_subj_read_all" ON public.test_pattern_section_subjects;
CREATE POLICY "pattern_sec_subj_read_all"
  ON public.test_pattern_section_subjects FOR SELECT
  TO authenticated, anon
  USING (true);

-- Ensure public reference tables are accessible to both authenticated and anon
DROP POLICY IF EXISTS "forces_select_policy" ON public.forces;
CREATE POLICY "forces_select_policy" ON public.forces FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy" ON public.courses FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "subjects_select_policy" ON public.subjects;
CREATE POLICY "subjects_select_policy" ON public.subjects FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "course_subjects_select_policy" ON public.course_subjects;
CREATE POLICY "course_subjects_select_policy" ON public.course_subjects FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "batches_select_policy" ON public.batches;
CREATE POLICY "batches_select_policy" ON public.batches FOR SELECT TO authenticated, anon USING (true);

-- ----------------------------------------------------------------------------
-- 5. HARDENED PUBLISH & ASSIGN RPCS (TEACHER SCOPE ENFORCEMENT)
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
  -- Strict teacher scope authorization
  IF NOT public.can_manage_test(p_test_id) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to publish this test.';
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

  -- Validate enabled sections exist
  IF NOT EXISTS (SELECT 1 FROM public.test_sections WHERE test_id = p_test_id AND COALESCE(is_enabled, true) = true) THEN
    RAISE EXCEPTION 'Test must have at least one enabled section.';
  END IF;

  -- Validate each enabled section
  FOR v_section IN
    SELECT * FROM public.test_sections WHERE test_id = p_test_id AND COALESCE(is_enabled, true) = true ORDER BY position
  LOOP
    SELECT COUNT(*) INTO v_section_question_count
    FROM public.test_section_questions
    WHERE test_section_id = v_section.id;

    IF v_section_question_count = 0 THEN
      RAISE EXCEPTION 'Section "%" has no questions assigned.', v_section.name;
    END IF;

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

    IF EXISTS (
      SELECT 1
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      WHERE tsq.test_section_id = v_section.id AND q.status <> 'APPROVED'
    ) THEN
      RAISE EXCEPTION 'Section "%" contains non-APPROVED questions.', v_section.name;
    END IF;

    UPDATE public.test_sections
    SET question_count = v_section_question_count
    WHERE id = v_section.id;

    v_total_questions := v_total_questions + v_section_question_count;
    v_total_marks := v_total_marks + (v_section_question_count * v_section.marks_per_question);
    v_total_duration := v_total_duration + v_section.duration_minutes;
  END LOOP;

  IF v_total_questions = 0 THEN
    RAISE EXCEPTION 'Test has no questions.';
  END IF;

  UPDATE public.tests
  SET
    status = 'PUBLISHED',
    total_marks = v_total_marks,
    duration_minutes = v_total_duration,
    published_at = timezone('utc', now()),
    published_by = auth.uid()
  WHERE id = p_test_id;

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
  -- Strict teacher scope authorization
  IF NOT public.can_manage_test(p_test_id) THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to assign this test.';
  END IF;

  SELECT status INTO v_test_status FROM public.tests WHERE id = p_test_id;
  IF v_test_status IS NULL THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;
  IF v_test_status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Test must be PUBLISHED or ACTIVE to assign. Current status: %', v_test_status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.batches WHERE id = p_batch_id) THEN
    RAISE EXCEPTION 'Batch not found.';
  END IF;

  INSERT INTO public.test_assignments (
    test_id, batch_id, assigned_by, available_from, available_until, max_attempts, notes
  )
  VALUES (
    p_test_id, p_batch_id, auth.uid(), p_available_from, p_available_until, p_max_attempts, p_notes
  )
  ON CONFLICT (test_id, batch_id) DO UPDATE
  SET
    available_from = EXCLUDED.available_from,
    available_until = EXCLUDED.available_until,
    max_attempts = EXCLUDED.max_attempts,
    notes = EXCLUDED.notes,
    status = 'ACTIVE',
    updated_at = timezone('utc', now())
  RETURNING id INTO v_assignment_id;

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

-- ----------------------------------------------------------------------------
-- 6. LIGHTWEIGHT FAMILIARIZATION COMPLETIONS TABLE & SECURITY
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.familiarization_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_fam_completions_student ON public.familiarization_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_fam_completions_test ON public.familiarization_completions(test_id);

ALTER TABLE public.familiarization_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fam_completions_select" ON public.familiarization_completions;
CREATE POLICY "fam_completions_select"
  ON public.familiarization_completions FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = familiarization_completions.student_id
        AND s.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fam_completions_insert" ON public.familiarization_completions;
CREATE POLICY "fam_completions_insert"
  ON public.familiarization_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id
        AND s.profile_id = auth.uid()
    )
  );

-- Function: Record Familiarization Completion with Eligibility Guard
CREATE OR REPLACE FUNCTION public.record_familiarization_completion(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_test RECORD;
  v_assignment RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF public.is_admin() OR public.is_teacher() THEN
    RETURN true; -- Staff bypass
  END IF;

  -- Active student profile verification
  SELECT s.*, p.status AS profile_status INTO v_student
  FROM public.students s
  JOIN public.profiles p ON p.id = s.profile_id
  WHERE s.profile_id = auth.uid();

  IF v_student IS NULL OR v_student.profile_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Active student profile required.';
  END IF;

  -- Test exists & is published/active
  SELECT id, status INTO v_test FROM public.tests WHERE id = p_test_id;
  IF v_test IS NULL THEN
    RAISE EXCEPTION 'Test not found.';
  END IF;
  IF v_test.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Test is not active.';
  END IF;

  -- Student must have valid effective assignment
  SELECT ta.id INTO v_assignment
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
    RAISE EXCEPTION 'Student is not eligible for this test.';
  END IF;

  INSERT INTO public.familiarization_completions (student_id, test_id, completed_at)
  VALUES (v_student.id, p_test_id, timezone('utc', now()))
  ON CONFLICT (student_id, test_id)
  DO UPDATE SET completed_at = EXCLUDED.completed_at;

  RETURN true;
END;
$$;

-- Function: Check Familiarization Completion
CREATE OR REPLACE FUNCTION public.is_familiarization_completed(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_done BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_admin() OR public.is_teacher() THEN
    RETURN true;
  END IF;

  SELECT id INTO v_student_id FROM public.students WHERE profile_id = auth.uid();
  IF v_student_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.familiarization_completions
    WHERE student_id = v_student_id AND test_id = p_test_id
  ) INTO v_done;

  RETURN v_done;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. SEED DEDICATED FAMILIARIZATION QUESTIONS (5 per subject, usage_type = 'FAMILIARIZATION')
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_sub_verbal UUID := '30000000-0000-0000-0000-000000000001';
  v_sub_nonverbal UUID := '30000000-0000-0000-0000-000000000002';
  v_sub_physics UUID := '30000000-0000-0000-0000-000000000003';
  v_sub_math UUID := '30000000-0000-0000-0000-000000000004';
  v_sub_english UUID := '30000000-0000-0000-0000-000000000005';
  v_sub_chemistry UUID := '30000000-0000-0000-0000-000000000006';
  v_sub_biology UUID := '30000000-0000-0000-0000-000000000007';
  v_sub_gk UUID := '30000000-0000-0000-0000-000000000008';

  v_qid UUID;
BEGIN
  -- ---------------- VERBAL INTELLIGENCE (5 MCQs) ----------------
  -- Q1
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000001', 'FAM-VRB-01', v_sub_verbal, 'EASY',
    'Which word does not belong with the others?',
    'Car, Bus, and Truck are motor vehicles; Bicycle is non-motorized.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Car', false), (v_qid, 'opt-b', 'B', 'Bus', false),
    (v_qid, 'opt-c', 'C', 'Bicycle', true), (v_qid, 'opt-d', 'D', 'Truck', false);

  -- Q2
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000012', 'FAM-VRB-02', v_sub_verbal, 'EASY',
    'If ARMY is coded as 1-18-13-25, how is NAVY coded?',
    'Each letter corresponds to its position in the alphabet: N=14, A=1, V=22, Y=25.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '14-1-22-25', true), (v_qid, 'opt-b', 'B', '13-1-21-25', false),
    (v_qid, 'opt-c', 'C', '14-2-22-26', false), (v_qid, 'opt-d', 'D', '15-1-22-25', false);

  -- Q3
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000013', 'FAM-VRB-03', v_sub_verbal, 'MEDIUM',
    'Pilot is to Aircraft as Captain is to:',
    'A pilot commands an aircraft, while a ship captain commands a ship/vessel.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Runway', false), (v_qid, 'opt-b', 'B', 'Ship', true),
    (v_qid, 'opt-c', 'C', 'Hangar', false), (v_qid, 'opt-d', 'D', 'Submarine Base', false);

  -- Q4
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000014', 'FAM-VRB-04', v_sub_verbal, 'EASY',
    'What comes next in the sequence: 3, 6, 12, 24, ?',
    'Each term is multiplied by 2: 24 * 2 = 48.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '36', false), (v_qid, 'opt-b', 'B', '42', false),
    (v_qid, 'opt-c', 'C', '48', true), (v_qid, 'opt-d', 'D', '52', false);

  -- Q5
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000015', 'FAM-VRB-05', v_sub_verbal, 'MEDIUM',
    'Courage is to Cowardice as Loyalty is to:',
    'Antonyms: Courage opposes Cowardice; Loyalty opposes Treachery.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Bravery', false), (v_qid, 'opt-b', 'B', 'Treachery', true),
    (v_qid, 'opt-c', 'C', 'Honour', false), (v_qid, 'opt-d', 'D', 'Devotion', false);

  -- ---------------- NON-VERBAL INTELLIGENCE (5 MCQs) ----------------
  -- Q1
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000002', 'FAM-NVR-01', v_sub_nonverbal, 'EASY',
    'Identify the odd shape out in pattern: Circle, Square, Pentagon, Oval, Triangle.',
    'Square, Pentagon, and Triangle are straight-line polygons; Oval and Circle are curved conic shapes.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','non-verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Equilateral Triangle', false), (v_qid, 'opt-b', 'B', 'Regular Hexagon', false),
    (v_qid, 'opt-c', 'C', 'Circle', true), (v_qid, 'opt-d', 'D', 'Square', false);

  -- Q2
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000022', 'FAM-NVR-02', v_sub_nonverbal, 'MEDIUM',
    'A clock hand rotates 90 degrees clockwise from 12:00. Where does it point?',
    '90 degrees clockwise rotation from 12:00 points to 3:00.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','non-verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '3:00', true), (v_qid, 'opt-b', 'B', '6:00', false),
    (v_qid, 'opt-c', 'C', '9:00', false), (v_qid, 'opt-d', 'D', '1:30', false);

  -- Q3
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000023', 'FAM-NVR-03', v_sub_nonverbal, 'EASY',
    'In a matrix, shapes increase sides: Triangle (3), Square (4), Pentagon (5). What comes next?',
    'A shape with 6 sides: Hexagon.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','non-verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Heptagon', false), (v_qid, 'opt-b', 'B', 'Hexagon', true),
    (v_qid, 'opt-c', 'C', 'Octagon', false), (v_qid, 'opt-d', 'D', 'Decagon', false);

  -- Q4
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000024', 'FAM-NVR-04', v_sub_nonverbal, 'MEDIUM',
    'Which figure represents a mirror reflection across the vertical axis?',
    'In vertical axis reflection, left and right invert while top and bottom remain stationary.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','non-verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Lateral Inversion', true), (v_qid, 'opt-b', 'B', 'Vertical Inversion', false),
    (v_qid, 'opt-c', 'C', '180 Degree Rotation', false), (v_qid, 'opt-d', 'D', 'Direct Translation', false);

  -- Q5
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000025', 'FAM-NVR-05', v_sub_nonverbal, 'EASY',
    'A square has two diagonals. Into how many non-overlapping triangles is it divided?',
    'Two diagonal lines intersect in the center dividing a square into 4 congruent triangles.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','non-verbal'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '2', false), (v_qid, 'opt-b', 'B', '4', true),
    (v_qid, 'opt-c', 'C', '6', false), (v_qid, 'opt-d', 'D', '8', false);

  -- ---------------- PHYSICS (5 MCQs) ----------------
  -- Q1
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000003', 'FAM-PHY-01', v_sub_physics, 'EASY',
    'What is the SI unit of Force?',
    'The SI unit of force is the Newton (N), equal to 1 kg * m / s^2.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','physics'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Joule', false), (v_qid, 'opt-b', 'B', 'Newton', true),
    (v_qid, 'opt-c', 'C', 'Watt', false), (v_qid, 'opt-d', 'D', 'Pascal', false);

  -- Q2
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000032', 'FAM-PHY-02', v_sub_physics, 'EASY',
    'What is the rate of change of displacement called?',
    'Displacement divided by time is Velocity (a vector quantity).', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','physics'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Speed', false), (v_qid, 'opt-b', 'B', 'Acceleration', false),
    (v_qid, 'opt-c', 'C', 'Velocity', true), (v_qid, 'opt-d', 'D', 'Momentum', false);

  -- Q3
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000033', 'FAM-PHY-03', v_sub_physics, 'MEDIUM',
    'According to Newton''s Third Law, action and reaction forces:',
    'Action and reaction are equal in magnitude, opposite in direction, and act on two different bodies.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','physics'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Act on the same body', false), (v_qid, 'opt-b', 'B', 'Act on different bodies', true),
    (v_qid, 'opt-c', 'C', 'Cancel each other out', false), (v_qid, 'opt-d', 'D', 'Have unequal magnitudes', false);

  -- Q4
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000034', 'FAM-PHY-04', v_sub_physics, 'EASY',
    'What is the speed of light in vacuum approximately?',
    'The speed of light c is approximately 3 * 10^8 meters per second.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','physics'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '3 * 10^6 m/s', false), (v_qid, 'opt-b', 'B', '3 * 10^8 m/s', true),
    (v_qid, 'opt-c', 'C', '3 * 10^10 m/s', false), (v_qid, 'opt-d', 'D', '3 * 10^4 m/s', false);

  -- Q5
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000035', 'FAM-PHY-05', v_sub_physics, 'MEDIUM',
    'In an electric circuit, Ohm''s law is represented by which formula?',
    'Ohm''s Law states Voltage (V) = Current (I) * Resistance (R).', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','physics'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'V = I * R', true), (v_qid, 'opt-b', 'B', 'V = I / R', false),
    (v_qid, 'opt-c', 'C', 'I = V * R', false), (v_qid, 'opt-d', 'D', 'R = V * I', false);

  -- ---------------- MATHEMATICS (5 MCQs) ----------------
  -- Q1
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000004', 'FAM-MTH-01', v_sub_math, 'EASY',
    'If 2x + 6 = 16, what is the value of x?',
    '2x = 16 - 6 = 10, hence x = 10 / 2 = 5.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','math'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '4', false), (v_qid, 'opt-b', 'B', '5', true),
    (v_qid, 'opt-c', 'C', '6', false), (v_qid, 'opt-d', 'D', '8', false);

  -- Q2
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000042', 'FAM-MTH-02', v_sub_math, 'MEDIUM',
    'What is the derivative of x^3 with respect to x?',
    'Power rule: d/dx(x^n) = n * x^(n-1). For x^3, derivative is 3x^2.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','math'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '3x^2', true), (v_qid, 'opt-b', 'B', 'x^2', false),
    (v_qid, 'opt-c', 'C', '3x', false), (v_qid, 'opt-d', 'D', '6x', false);

  -- Q3
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000043', 'FAM-MTH-03', v_sub_math, 'EASY',
    'What is the value of sin(90 degrees)?',
    'In trigonometry, sin(90°) = 1.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','math'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '0', false), (v_qid, 'opt-b', 'B', '0.5', false),
    (v_qid, 'opt-c', 'C', '1', true), (v_qid, 'opt-d', 'D', 'Undefined', false);

  -- Q4
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000044', 'FAM-MTH-04', v_sub_math, 'EASY',
    'The sum of interior angles of a triangle is always:',
    'A Euclidean triangle''s interior angles always sum to 180 degrees.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','math'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '90°', false), (v_qid, 'opt-b', 'B', '180°', true),
    (v_qid, 'opt-c', 'C', '270°', false), (v_qid, 'opt-d', 'D', '360°', false);

  -- Q5
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000045', 'FAM-MTH-05', v_sub_math, 'MEDIUM',
    'What is the area of a circle with radius r?',
    'The formula for the area of a circle is π * r^2.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','math'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', '2 * π * r', false), (v_qid, 'opt-b', 'B', 'π * r^2', true),
    (v_qid, 'opt-c', 'C', 'π * d', false), (v_qid, 'opt-d', 'D', '4/3 * π * r^3', false);

  -- ---------------- ENGLISH (5 MCQs) ----------------
  -- Q1
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000005', 'FAM-ENG-01', v_sub_english, 'EASY',
    'Choose the synonym for "VALIANT":',
    'Valiant means courageous, determined, or brave in battle.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','english'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Fearful', false), (v_qid, 'opt-b', 'B', 'Brave', true),
    (v_qid, 'opt-c', 'C', 'Weak', false), (v_qid, 'opt-d', 'D', 'Hesitant', false);

  -- Q2
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000052', 'FAM-ENG-02', v_sub_english, 'EASY',
    'Identify the preposition in the sentence: "The cadet marched into the parade ground."',
    '"Into" is a preposition indicating motion toward the interior.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','english'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'marched', false), (v_qid, 'opt-b', 'B', 'into', true),
    (v_qid, 'opt-c', 'C', 'parade', false), (v_qid, 'opt-d', 'D', 'cadet', false);

  -- Q3
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000053', 'FAM-ENG-03', v_sub_english, 'MEDIUM',
    'Choose the correct passive voice: "The officer inspected the troops."',
    'Past simple active becomes "was/were inspected by": The troops were inspected by the officer.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','english'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'The troops were inspected by the officer.', true),
    (v_qid, 'opt-b', 'B', 'The troops are inspected by the officer.', false),
    (v_qid, 'opt-c', 'C', 'The troops had inspected the officer.', false),
    (v_qid, 'opt-d', 'D', 'The troops have been inspected by the officer.', false);

  -- Q4
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000054', 'FAM-ENG-04', v_sub_english, 'EASY',
    'Select the antonym for "OBEDIENT":',
    'Obedient means compliant; rebellious/defiant is its antonym.', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','english'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'Submissive', false), (v_qid, 'opt-b', 'B', 'Dutiful', false),
    (v_qid, 'opt-c', 'C', 'Defiant', true), (v_qid, 'opt-d', 'D', 'Loyal', false);

  -- Q5
  INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
  VALUES ('70000000-0000-0000-0000-000000000055', 'FAM-ENG-05', v_sub_english, 'MEDIUM',
    'Fill in the blank: "Neither of the candidates _____ present at the briefing."',
    '"Neither" takes a singular verb: "was".', 30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','english'])
  ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
    (v_qid, 'opt-a', 'A', 'were', false), (v_qid, 'opt-b', 'B', 'was', true),
    (v_qid, 'opt-c', 'C', 'are', false), (v_qid, 'opt-d', 'D', 'have been', false);

  -- ---------------- CHEMISTRY, BIOLOGY, GK (Seeds for Tri-Service Patterns) ----------------
  -- Chemistry Q1-Q5
  FOR i IN 1..5 LOOP
    INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
    VALUES (
      ('70000000-0000-0000-0000-00000000006' || i)::uuid,
      'FAM-CHM-0' || i,
      v_sub_chemistry,
      'EASY',
      'What is the chemical symbol for Water?',
      'Water molecule consists of 2 Hydrogen atoms and 1 Oxygen atom (H2O).',
      30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','chemistry']
    ) ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
    DELETE FROM public.question_options WHERE question_id = v_qid;
    INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
      (v_qid, 'opt-a', 'A', 'H2O', true), (v_qid, 'opt-b', 'B', 'CO2', false),
      (v_qid, 'opt-c', 'C', 'NaCl', false), (v_qid, 'opt-d', 'D', 'O2', false);
  END LOOP;

  -- Biology Q1-Q5
  FOR i IN 1..5 LOOP
    INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
    VALUES (
      ('70000000-0000-0000-0000-00000000007' || i)::uuid,
      'FAM-BIO-0' || i,
      v_sub_biology,
      'EASY',
      'What organelle is known as the powerhouse of the eukaryotic cell?',
      'Mitochondria generate most of the cell''s supply of ATP (chemical energy).',
      30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','biology']
    ) ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
    DELETE FROM public.question_options WHERE question_id = v_qid;
    INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
      (v_qid, 'opt-a', 'A', 'Nucleus', false), (v_qid, 'opt-b', 'B', 'Mitochondria', true),
      (v_qid, 'opt-c', 'C', 'Ribosome', false), (v_qid, 'opt-d', 'D', 'Golgi Body', false);
  END LOOP;

  -- General Knowledge Q1-Q5
  FOR i IN 1..5 LOOP
    INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, usage_type, tags)
    VALUES (
      ('70000000-0000-0000-0000-00000000008' || i)::uuid,
      'FAM-GEN-0' || i,
      v_sub_gk,
      'EASY',
      'What is the highest military gallantry award of Pakistan?',
      'Nishan-e-Haider is the supreme military award of Pakistan for unmatched gallantry.',
      30, 'APPROVED', 'FAMILIARIZATION', ARRAY['sample','gk']
    ) ON CONFLICT (code) DO UPDATE SET stem = EXCLUDED.stem RETURNING id INTO v_qid;
    DELETE FROM public.question_options WHERE question_id = v_qid;
    INSERT INTO public.question_options (question_id, option_key, label, text, is_correct) VALUES
      (v_qid, 'opt-a', 'A', 'Hilal-e-Jurat', false), (v_qid, 'opt-b', 'B', 'Nishan-e-Haider', true),
      (v_qid, 'opt-c', 'C', 'Sitara-e-Basalat', false), (v_qid, 'opt-d', 'D', 'Tamgha-e-Shujaat', false);
  END LOOP;

END $$;

-- ----------------------------------------------------------------------------
-- 8. HARDENED GET_FAMILIARIZATION_PAYLOAD RPC (EXACT 5 MCQS & PATTERN-AWARE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_familiarization_payload(p_test_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
