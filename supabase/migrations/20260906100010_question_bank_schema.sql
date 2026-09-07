-- ============================================================================
-- Migration: 20260906100010_question_bank_schema.sql
-- Description: Comprehensive Question Bank Schema & Taxonomy (Forces Academy CBT)
-- Author: ANTIGRAVITY / DEEPMIND PAIR PROGRAMMING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUMS FOR QUESTION TAXONOMY & FORMAT
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cognitive_level') THEN
    CREATE TYPE public.cognitive_level AS ENUM (
      'REMEMBERING',
      'UNDERSTANDING',
      'APPLYING',
      'ANALYZING',
      'EVALUATING'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_format') THEN
    CREATE TYPE public.question_format AS ENUM (
      'MCQ_SINGLE',
      'MCQ_MULTIPLE',
      'PASSAGE_BASED',
      'IMAGE_SERIES',
      'IMAGE_ANALOGY',
      'ODD_ONE_OUT'
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. QUESTION TOPICS & SUBTOPICS TABLE (Hierarchical Syllabus Taxonomy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES public.question_topics(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (subject_id, code)
);

CREATE INDEX IF NOT EXISTS idx_question_topics_subject ON public.question_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_parent ON public.question_topics(parent_topic_id);

-- ----------------------------------------------------------------------------
-- 3. QUESTION PASSAGES / STIMULUS TABLE (Comprehension & Shared Stems)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_question_passages_subject ON public.question_passages(subject_id);

-- ----------------------------------------------------------------------------
-- 4. QUESTION IMPORT BATCHES (Bulk Ingestion & Audit Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT NOT NULL UNIQUE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  source_filename TEXT,
  total_items INT NOT NULL DEFAULT 0,
  imported_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL')),
  error_log JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_question_import_batches_uploader ON public.question_import_batches(uploaded_by);

-- ----------------------------------------------------------------------------
-- 5. ENRICH QUESTIONS TABLE WITH TAXONOMY, METRICS & AUDIT FIELDS
-- ----------------------------------------------------------------------------
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.question_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS passage_id UUID REFERENCES public.question_passages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.question_import_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cognitive_level public.cognitive_level NOT NULL DEFAULT 'APPLYING',
  ADD COLUMN IF NOT EXISTS question_format public.question_format NOT NULL DEFAULT 'MCQ_SINGLE',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS times_attempted INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS times_correct INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difficulty_index NUMERIC(4,2) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_passage_id ON public.questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_questions_import_batch ON public.questions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_questions_cognitive ON public.questions(cognitive_level);
CREATE INDEX IF NOT EXISTS idx_questions_format ON public.questions(question_format);

-- ----------------------------------------------------------------------------
-- 6. QUESTION AUDIT LOG TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'VERIFIED', 'APPROVED', 'REJECTED', 'ARCHIVED')),
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_question_audit_qid ON public.question_audit_log(question_id);
CREATE INDEX IF NOT EXISTS idx_question_audit_performed_by ON public.question_audit_log(performed_by);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_audit_log ENABLE ROW LEVEL SECURITY;

-- Question Topics: Staff manage, all authenticated read
CREATE POLICY topics_read_all
  ON public.question_topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY topics_staff_manage
  ON public.question_topics FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Question Passages: Staff manage, all authenticated read
CREATE POLICY passages_read_all
  ON public.question_passages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY passages_staff_manage
  ON public.question_passages FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Question Import Batches: Staff only
CREATE POLICY batches_staff_manage
  ON public.question_import_batches FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Question Audit Log: Staff only
CREATE POLICY audit_staff_read
  ON public.question_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

CREATE POLICY audit_staff_insert
  ON public.question_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 8. QUESTION BANK METRICS & STATS RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_question_bank_statistics(
  p_subject_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff may access question bank statistics.';
  END IF;

  SELECT jsonb_build_object(
    'total_questions', COUNT(*),
    'approved_count', COUNT(*) FILTER (WHERE q.status = 'APPROVED'),
    'draft_count', COUNT(*) FILTER (WHERE q.status = 'DRAFT'),
    'verified_count', COUNT(*) FILTER (WHERE q.is_verified = true),
    'verbal_count', COUNT(*) FILTER (WHERE s.code = 'INTELLIGENCE_VERBAL'),
    'non_verbal_count', COUNT(*) FILTER (WHERE s.code = 'INTELLIGENCE_NON_VERBAL'),
    'academic_count', COUNT(*) FILTER (WHERE s.code LIKE 'ACADEMIC%'),
    'easy_count', COUNT(*) FILTER (WHERE q.difficulty = 'EASY'),
    'medium_count', COUNT(*) FILTER (WHERE q.difficulty = 'MEDIUM'),
    'hard_count', COUNT(*) FILTER (WHERE q.difficulty = 'HARD')
  )
  INTO v_result
  FROM public.questions q
  JOIN public.subjects s ON s.id = q.subject_id
  WHERE (p_subject_id IS NULL OR q.subject_id = p_subject_id);

  RETURN v_result;
END;
$$;
