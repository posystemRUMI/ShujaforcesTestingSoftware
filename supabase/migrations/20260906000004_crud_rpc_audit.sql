-- ============================================================================
-- Migration: 20260906000004_crud_rpc_audit.sql
-- Description: Audit Logging & Secure Compound Transactional RPC Procedures
-- Author: BACKEND-AGENT-1 / Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AUDIT LOGGING SYSTEM (Phase B8)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can inspect audit logs
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Absolutely NO updates or deletes allowed on audit logs (Immutable)
-- No user update/delete policies exist.

-- Secure Audit Event Logger (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_role TEXT;
BEGIN
  v_role := public.current_app_role()::TEXT;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), v_role, p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. SECURE COMPOUND RPC PROCEDURES (Phase B7)
-- ----------------------------------------------------------------------------

-- RPC: Admin Create Student with Atomic Batch Enrollment
CREATE OR REPLACE FUNCTION public.admin_create_student(
  p_user_id UUID,
  p_roll_number TEXT,
  p_father_name TEXT,
  p_cnic TEXT,
  p_date_of_birth DATE,
  p_target_force_id UUID,
  p_target_course_id UUID,
  p_batch_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
BEGIN
  -- Privilege gate
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff officers can register cadets.';
  END IF;

  -- Create domain student docket
  INSERT INTO public.students (
    profile_id,
    roll_number,
    father_name,
    cnic,
    date_of_birth,
    target_force_id,
    target_course_id,
    status
  )
  VALUES (
    p_user_id,
    p_roll_number,
    p_father_name,
    p_cnic,
    p_date_of_birth,
    p_target_force_id,
    p_target_course_id,
    'ACTIVE'
  )
  RETURNING id INTO v_student_id;

  -- Optional immediate batch enrollment
  IF p_batch_id IS NOT NULL THEN
    INSERT INTO public.batch_enrollments (batch_id, student_id, status)
    VALUES (p_batch_id, v_student_id, 'ACTIVE');
  END IF;

  -- Audit event
  PERFORM public.log_audit_event(
    'CADET_ENROLLED',
    'STUDENT',
    v_student_id::TEXT,
    jsonb_build_object('roll_number', p_roll_number, 'batch_id', p_batch_id)
  );

  RETURN v_student_id;
END;
$$;

-- RPC: Admin Create Teacher with Specialization Allocation
CREATE OR REPLACE FUNCTION public.admin_create_teacher(
  p_user_id UUID,
  p_service_number TEXT,
  p_rank TEXT,
  p_branch_code TEXT,
  p_role_title TEXT,
  p_subject_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID;
  v_sub_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can register faculty officers.';
  END IF;

  INSERT INTO public.teachers (
    profile_id,
    service_number,
    rank,
    branch_code,
    role_title,
    status
  )
  VALUES (
    p_user_id,
    p_service_number,
    p_rank,
    p_branch_code,
    p_role_title,
    'ACTIVE'
  )
  RETURNING id INTO v_teacher_id;

  -- Assign subjects
  IF array_length(p_subject_ids, 1) > 0 THEN
    FOREACH v_sub_id IN ARRAY p_subject_ids LOOP
      INSERT INTO public.teacher_subjects (teacher_id, subject_id)
      VALUES (v_teacher_id, v_sub_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  PERFORM public.log_audit_event(
    'FACULTY_COMMISSIONED',
    'TEACHER',
    v_teacher_id::TEXT,
    jsonb_build_object('service_number', p_service_number, 'rank', p_rank)
  );

  RETURN v_teacher_id;
END;
$$;

-- RPC: Admin / Teacher Upsert Question with 4 Options
CREATE OR REPLACE FUNCTION public.admin_upsert_question(
  p_id UUID,
  p_code TEXT,
  p_subject_id UUID,
  p_difficulty public.question_difficulty,
  p_stem TEXT,
  p_stem_image_url TEXT,
  p_explanation TEXT,
  p_time_limit_seconds INT,
  p_status public.question_status,
  p_tags TEXT[],
  p_course_ids UUID[],
  p_options JSONB -- Array of { option_key, label, text, image_url, is_correct }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qid UUID;
  v_opt JSONB;
  v_course_id UUID;
  v_correct_count INT := 0;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff officers can author questions.';
  END IF;

  -- Validate that options contain exactly 1 correct answer
  FOR v_opt IN SELECT * FROM jsonb_array_elements(p_options) LOOP
    IF (v_opt->>'is_correct')::boolean = true THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  IF v_correct_count <> 1 THEN
    RAISE EXCEPTION 'Question validation failed: Exactly one correct option is required (found %).', v_correct_count;
  END IF;

  -- Upsert Question Record
  IF p_id IS NOT NULL THEN
    UPDATE public.questions
    SET
      code = p_code,
      subject_id = p_subject_id,
      difficulty = p_difficulty,
      stem = p_stem,
      stem_image_url = p_stem_image_url,
      explanation = p_explanation,
      time_limit_seconds = p_time_limit_seconds,
      status = p_status,
      tags = p_tags,
      updated_at = timezone('utc', now())
    WHERE id = p_id;
    v_qid := p_id;
  ELSE
    INSERT INTO public.questions (
      code,
      subject_id,
      difficulty,
      stem,
      stem_image_url,
      explanation,
      time_limit_seconds,
      status,
      author_id,
      tags
    )
    VALUES (
      p_code,
      p_subject_id,
      p_difficulty,
      p_stem,
      p_stem_image_url,
      p_explanation,
      p_time_limit_seconds,
      p_status,
      auth.uid(),
      p_tags
    )
    RETURNING id INTO v_qid;
  END IF;

  -- Re-insert Options
  DELETE FROM public.question_options WHERE question_id = v_qid;
  FOR v_opt IN SELECT * FROM jsonb_array_elements(p_options) LOOP
    INSERT INTO public.question_options (
      question_id,
      option_key,
      label,
      text,
      image_url,
      is_correct
    )
    VALUES (
      v_qid,
      v_opt->>'option_key',
      v_opt->>'label',
      v_opt->>'text',
      v_opt->>'image_url',
      (v_opt->>'is_correct')::boolean
    );
  END LOOP;

  -- Associate Courses
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  IF array_length(p_course_ids, 1) > 0 THEN
    FOREACH v_course_id IN ARRAY p_course_ids LOOP
      INSERT INTO public.question_courses (question_id, course_id)
      VALUES (v_qid, v_course_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  PERFORM public.log_audit_event(
    'QUESTION_UPSERTED',
    'QUESTION',
    v_qid::TEXT,
    jsonb_build_object('code', p_code, 'subject_id', p_subject_id)
  );

  RETURN v_qid;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. SAFE CANDIDATE EXAM DELIVERY INTERFACE (CRITICAL SECURITY)
-- ----------------------------------------------------------------------------
-- Returns question items for an exam while STRIPPING 'is_correct' and 'explanation'
CREATE OR REPLACE FUNCTION public.get_safe_exam_questions(
  p_question_ids UUID[]
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  subject_id UUID,
  difficulty public.question_difficulty,
  stem TEXT,
  stem_image_url TEXT,
  time_limit_seconds INT,
  options JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.code,
    q.subject_id,
    q.difficulty,
    q.stem,
    q.stem_image_url,
    q.time_limit_seconds,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', qo.id,
            'option_key', qo.option_key,
            'label', qo.label,
            'text', qo.text,
            'image_url', qo.image_url
            -- Notice: is_correct is intentionally completely omitted!
          ) ORDER BY qo.label
        )
        FROM public.question_options qo
        WHERE qo.question_id = q.id
      ),
      '[]'::jsonb
    ) AS options
  FROM public.questions q
  WHERE q.id = ANY(p_question_ids)
    AND q.status = 'APPROVED';
END;
$$;
