-- ============================================================================
-- Migration: 20260906100006_monitoring_reports.sql
-- Description: Live Monitoring, Heartbeats, Force Submit, Reports (B24-B25)
-- Author: BACKEND-AGENT-2 / Claude
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ATTEMPT HEARTBEATS TABLE (B24)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attempt_heartbeats (
  attempt_id UUID PRIMARY KEY REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  answered_count INT NOT NULL DEFAULT 0,
  current_question_index INT NOT NULL DEFAULT 0,
  current_section_name TEXT,
  connection_state TEXT NOT NULL DEFAULT 'CONNECTED' CHECK (connection_state IN ('CONNECTED', 'RECONNECTING', 'DISCONNECTED')),
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_test ON public.attempt_heartbeats(test_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_student ON public.attempt_heartbeats(student_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_last_seen ON public.attempt_heartbeats(last_seen);

ALTER TABLE public.attempt_heartbeats ENABLE ROW LEVEL SECURITY;

-- Staff can read all heartbeats for monitoring
CREATE POLICY "heartbeats_staff_select"
  ON public.attempt_heartbeats FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_teacher());

-- Students can only update their own heartbeat via RPC
CREATE POLICY "heartbeats_staff_write"
  ON public.attempt_heartbeats FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Enable Supabase Realtime on heartbeats for live monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.attempt_heartbeats;

-- ----------------------------------------------------------------------------
-- 2. RECORD HEARTBEAT RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_heartbeat(
  p_attempt_id UUID,
  p_answered_count INT DEFAULT 0,
  p_current_question_index INT DEFAULT 0,
  p_current_section_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt RECORD;
  v_student RECORD;
  v_total_questions INT;
BEGIN
  -- Load attempt
  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF v_attempt IS NULL OR v_attempt.status <> 'IN_PROGRESS' THEN
    RETURN false;
  END IF;

  -- Verify ownership
  SELECT * INTO v_student
  FROM public.students WHERE id = v_attempt.student_id AND profile_id = auth.uid();
  IF v_student IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate total questions for progress
  SELECT COALESCE(SUM(ts.question_count), 0) INTO v_total_questions
  FROM public.test_sections ts WHERE ts.test_id = v_attempt.test_id;

  -- Upsert heartbeat
  INSERT INTO public.attempt_heartbeats (
    attempt_id, student_id, test_id,
    last_seen, answered_count, current_question_index,
    current_section_name, connection_state,
    progress_percent
  )
  VALUES (
    p_attempt_id, v_student.id, v_attempt.test_id,
    timezone('utc', now()), p_answered_count, p_current_question_index,
    p_current_section_name, 'CONNECTED',
    CASE WHEN v_total_questions > 0
      THEN ROUND((p_answered_count::NUMERIC / v_total_questions) * 100, 2)
      ELSE 0 END
  )
  ON CONFLICT (attempt_id) DO UPDATE SET
    last_seen = timezone('utc', now()),
    answered_count = EXCLUDED.answered_count,
    current_question_index = EXCLUDED.current_question_index,
    current_section_name = EXCLUDED.current_section_name,
    connection_state = 'CONNECTED',
    progress_percent = EXCLUDED.progress_percent,
    updated_at = timezone('utc', now());

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. FORCE SUBMIT ATTEMPT RPC (B24 — Admin/Teacher privileged action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.force_submit_attempt(p_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only staff can force submit
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can force-submit attempts.';
  END IF;

  -- Verify attempt exists and is in progress
  IF NOT EXISTS (
    SELECT 1 FROM public.test_attempts
    WHERE id = p_attempt_id AND status = 'IN_PROGRESS'
  ) THEN
    RAISE EXCEPTION 'No active attempt found to force-submit.';
  END IF;

  -- Audit the force-submit action specifically
  PERFORM public.log_audit_event(
    'ATTEMPT_FORCE_SUBMITTED',
    'TEST_ATTEMPT',
    p_attempt_id::TEXT,
    jsonb_build_object(
      'forced_by', auth.uid()
    )
  );

  -- Use the standard submit function
  v_result := public.submit_test_attempt(p_attempt_id);

  -- Update heartbeat to disconnected
  UPDATE public.attempt_heartbeats
  SET connection_state = 'DISCONNECTED', updated_at = timezone('utc', now())
  WHERE attempt_id = p_attempt_id;

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. ACTIVE MONITORING VIEW (B24)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_active_monitoring AS
SELECT
  ta.id AS attempt_id,
  ta.test_id,
  t.name AS test_name,
  ta.student_id,
  s.roll_number,
  p.display_name AS student_name,
  f.code AS force_code,
  f.name AS force_name,
  ta.started_at,
  ta.expires_at,
  ta.status AS attempt_status,
  ta.attempt_number,
  COALESCE(ah.answered_count, 0) AS answered_count,
  COALESCE(ah.current_question_index, 0) AS current_question_index,
  ah.current_section_name,
  COALESCE(ah.progress_percent, 0) AS progress_percent,
  COALESCE(ah.connection_state, 'DISCONNECTED') AS connection_state,
  ah.last_seen,
  CASE
    WHEN ah.last_seen IS NULL THEN 'NEVER_CONNECTED'
    WHEN ah.last_seen < timezone('utc', now()) - interval '30 seconds' THEN 'STALE'
    ELSE 'LIVE'
  END AS liveness,
  (SELECT COUNT(*) FROM public.test_section_questions tsq
   JOIN public.test_sections ts ON ts.id = tsq.test_section_id
   WHERE ts.test_id = ta.test_id) AS total_questions,
  EXTRACT(EPOCH FROM (ta.expires_at - timezone('utc', now())))::INT AS remaining_seconds
FROM public.test_attempts ta
JOIN public.tests t ON t.id = ta.test_id
JOIN public.students s ON s.id = ta.student_id
JOIN public.profiles p ON p.id = s.profile_id
JOIN public.forces f ON f.id = s.target_force_id
LEFT JOIN public.attempt_heartbeats ah ON ah.attempt_id = ta.id
WHERE ta.status = 'IN_PROGRESS';

-- ----------------------------------------------------------------------------
-- 5. REPORTS / ANALYTICS RPCs (B25)
-- ----------------------------------------------------------------------------

-- 5a. Batch Performance Report
CREATE OR REPLACE FUNCTION public.report_batch_performance(
  p_batch_id UUID DEFAULT NULL,
  p_force_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  SELECT jsonb_agg(batch_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'batch_id', b.id,
      'batch_name', b.name,
      'batch_code', b.code,
      'force_name', f.name,
      'total_students', (SELECT COUNT(DISTINCT be.student_id) FROM public.batch_enrollments be WHERE be.batch_id = b.id AND be.status = 'ACTIVE'),
      'total_attempts', COUNT(DISTINCT tr.attempt_id),
      'avg_percentage', ROUND(COALESCE(AVG(tr.percentage), 0), 2),
      'pass_count', COUNT(CASE WHEN tr.passed THEN 1 END),
      'fail_count', COUNT(CASE WHEN NOT tr.passed THEN 1 END),
      'pass_rate', CASE WHEN COUNT(*) > 0
        THEN ROUND((COUNT(CASE WHEN tr.passed THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0 END,
      'highest_score', COALESCE(MAX(tr.percentage), 0),
      'lowest_score', COALESCE(MIN(tr.percentage), 0)
    ) AS batch_data
    FROM public.batches b
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.forces f ON f.id = c.force_id
    LEFT JOIN public.batch_enrollments be ON be.batch_id = b.id AND be.status = 'ACTIVE'
    LEFT JOIN public.test_results tr ON tr.student_id = be.student_id
    WHERE (p_batch_id IS NULL OR b.id = p_batch_id)
      AND (p_force_id IS NULL OR f.id = p_force_id)
      AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
      AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    GROUP BY b.id, b.name, b.code, f.name
    ORDER BY b.name
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 5b. Student Performance Report
CREATE OR REPLACE FUNCTION public.report_student_performance(
  p_student_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  SELECT jsonb_agg(student_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'student_id', s.id,
      'student_name', p.display_name,
      'roll_number', s.roll_number,
      'force_name', f.name,
      'total_tests_taken', COUNT(DISTINCT tr.test_id),
      'total_attempts', COUNT(tr.id),
      'avg_percentage', ROUND(COALESCE(AVG(tr.percentage), 0), 2),
      'pass_count', COUNT(CASE WHEN tr.passed THEN 1 END),
      'fail_count', COUNT(CASE WHEN NOT tr.passed THEN 1 END),
      'highest_score', COALESCE(MAX(tr.percentage), 0),
      'lowest_score', COALESCE(MIN(CASE WHEN tr.percentage > 0 THEN tr.percentage END), 0),
      'avg_time_seconds', ROUND(COALESCE(AVG(tr.time_spent_seconds), 0))
    ) AS student_data
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    JOIN public.forces f ON f.id = s.target_force_id
    LEFT JOIN public.test_results tr ON tr.student_id = s.id
    LEFT JOIN public.batch_enrollments be ON be.student_id = s.id AND be.status = 'ACTIVE'
    WHERE (p_student_id IS NULL OR s.id = p_student_id)
      AND (p_batch_id IS NULL OR be.batch_id = p_batch_id)
      AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
      AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    GROUP BY s.id, p.display_name, s.roll_number, f.name
    ORDER BY p.display_name
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 5c. Test Performance Report
CREATE OR REPLACE FUNCTION public.report_test_performance(
  p_test_id UUID DEFAULT NULL,
  p_force_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  SELECT jsonb_agg(test_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'test_id', t.id,
      'test_name', t.name,
      'force_name', f.name,
      'course_name', c.name,
      'total_attempts', COUNT(tr.id),
      'unique_students', COUNT(DISTINCT tr.student_id),
      'avg_percentage', ROUND(COALESCE(AVG(tr.percentage), 0), 2),
      'pass_count', COUNT(CASE WHEN tr.passed THEN 1 END),
      'fail_count', COUNT(CASE WHEN NOT tr.passed THEN 1 END),
      'pass_rate', CASE WHEN COUNT(*) > 0
        THEN ROUND((COUNT(CASE WHEN tr.passed THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0 END,
      'avg_time_seconds', ROUND(COALESCE(AVG(tr.time_spent_seconds), 0)),
      'highest_score', COALESCE(MAX(tr.percentage), 0),
      'lowest_score', COALESCE(MIN(tr.percentage), 0)
    ) AS test_data
    FROM public.tests t
    JOIN public.forces f ON f.id = t.force_id
    JOIN public.courses c ON c.id = t.course_id
    LEFT JOIN public.test_results tr ON tr.test_id = t.id
    WHERE (p_test_id IS NULL OR t.id = p_test_id)
      AND (p_force_id IS NULL OR t.force_id = p_force_id)
      AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
      AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    GROUP BY t.id, t.name, f.name, c.name
    ORDER BY t.name
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 5d. Pass/Fail Summary
CREATE OR REPLACE FUNCTION public.report_pass_fail_summary(
  p_force_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  RETURN jsonb_build_object(
    'total_attempts', (
      SELECT COUNT(*) FROM public.test_results tr
      JOIN public.tests t ON t.id = tr.test_id
      WHERE (p_force_id IS NULL OR t.force_id = p_force_id)
        AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
        AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    ),
    'passed', (
      SELECT COUNT(*) FROM public.test_results tr
      JOIN public.tests t ON t.id = tr.test_id
      WHERE tr.passed = true
        AND (p_force_id IS NULL OR t.force_id = p_force_id)
        AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
        AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    ),
    'failed', (
      SELECT COUNT(*) FROM public.test_results tr
      JOIN public.tests t ON t.id = tr.test_id
      WHERE tr.passed = false
        AND (p_force_id IS NULL OR t.force_id = p_force_id)
        AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
        AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    ),
    'avg_percentage', (
      SELECT ROUND(COALESCE(AVG(tr.percentage), 0), 2) FROM public.test_results tr
      JOIN public.tests t ON t.id = tr.test_id
      WHERE (p_force_id IS NULL OR t.force_id = p_force_id)
        AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
        AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    )
  );
END;
$$;

-- 5e. Force Performance Report
CREATE OR REPLACE FUNCTION public.report_force_performance(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied.';
  END IF;

  SELECT jsonb_agg(force_data) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'force_id', f.id,
      'force_name', f.name,
      'force_code', f.code,
      'total_students', (
        SELECT COUNT(*) FROM public.students s WHERE s.target_force_id = f.id AND s.status = 'ACTIVE'
      ),
      'total_attempts', COUNT(tr.id),
      'avg_percentage', ROUND(COALESCE(AVG(tr.percentage), 0), 2),
      'pass_count', COUNT(CASE WHEN tr.passed THEN 1 END),
      'fail_count', COUNT(CASE WHEN NOT tr.passed THEN 1 END),
      'pass_rate', CASE WHEN COUNT(tr.id) > 0
        THEN ROUND((COUNT(CASE WHEN tr.passed THEN 1 END)::NUMERIC / COUNT(tr.id)::NUMERIC) * 100, 2)
        ELSE 0 END
    ) AS force_data
    FROM public.forces f
    LEFT JOIN public.tests t ON t.force_id = f.id
    LEFT JOIN public.test_results tr ON tr.test_id = t.id
      AND (p_date_from IS NULL OR tr.generated_at >= p_date_from)
      AND (p_date_to IS NULL OR tr.generated_at <= p_date_to)
    WHERE f.status = 'ACTIVE'
    GROUP BY f.id, f.name, f.code
    ORDER BY f.sort_order
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. PERFORMANCE INDEXES FOR REPORTING (B25)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_test_results_generated_at ON public.test_results(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_student_test ON public.test_results(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_test ON public.test_attempts(student_id, test_id);
