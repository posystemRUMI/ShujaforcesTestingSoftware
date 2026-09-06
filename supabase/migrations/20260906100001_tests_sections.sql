-- ============================================================================
-- Migration: 20260906100001_tests_sections.sql
-- Description: Test & Section Schema (Phase B13)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TEST STATUS ENUM
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.test_status AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. TESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  force_id UUID NOT NULL REFERENCES public.forces(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  passing_threshold INT NOT NULL DEFAULT 50 CHECK (passing_threshold BETWEEN 1 AND 100),
  total_marks INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  shuffle_options BOOLEAN NOT NULL DEFAULT false,
  allow_section_navigation BOOLEAN NOT NULL DEFAULT false,
  show_result_immediately BOOLEAN NOT NULL DEFAULT true,
  show_answer_review BOOLEAN NOT NULL DEFAULT true,
  negative_marking BOOLEAN NOT NULL DEFAULT false,
  negative_mark_value NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  status public.test_status NOT NULL DEFAULT 'DRAFT',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_tests_status ON public.tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_force_id ON public.tests(force_id);
CREATE INDEX IF NOT EXISTS idx_tests_course_id ON public.tests(course_id);
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON public.tests(created_by);

CREATE TRIGGER trg_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. TEST SECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  question_count INT NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  duration_minutes INT NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  marks_per_question INT NOT NULL DEFAULT 1 CHECK (marks_per_question > 0),
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (test_id, position)
);

CREATE INDEX IF NOT EXISTS idx_test_sections_test_id ON public.test_sections(test_id);

CREATE TRIGGER trg_test_sections_updated_at
  BEFORE UPDATE ON public.test_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. RLS for TESTS & TEST_SECTIONS
-- ----------------------------------------------------------------------------
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;

-- Admin/Teacher: full access to tests
CREATE POLICY "tests_staff_select"
  ON public.tests FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "tests_staff_insert"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "tests_staff_update"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "tests_staff_delete"
  ON public.tests FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Test Sections: admin/teacher full access
CREATE POLICY "test_sections_staff_select"
  ON public.test_sections FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

CREATE POLICY "test_sections_staff_write"
  ON public.test_sections FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());
