-- ============================================================================
-- Migration: 20260907200000_leaderboard_rank_fixes_and_seed.sql
-- Description:
--   1. Fix DENSE_RANK to use ONLY the primary ranking metric inside OVER().
--      Secondary tie-breakers (tot_marks, avg_pct, roll_number) are moved to
--      the ORDER BY of the outer SELECT for deterministic row ordering, NOT
--      inside DENSE_RANK so that equal percentages always share the same rank.
--   2. Expand leaderboard seed: create 45 eligible students on a shared test
--      so that the seeded test student (student@gmail.com) ranks exactly #43
--      out of 45, validating the outside-Top-40 display path.
-- ============================================================================

-- ============================================================================
-- PART 1: FIX DENSE_RANK SEMANTICS IN ALL RANKING RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1a. FIX: get_test_leaderboard
--     Ranking metric: b.percentage (test-specific score %)
--     Secondary determinism: score DESC, time_spent_seconds ASC, roll_number ASC
--     (secondary is OUTSIDE the window — applied only to row ordering)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_test_leaderboard(
  p_test_id UUID,
  p_limit INT DEFAULT 40
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_student_id UUID;
  v_is_authorized BOOLEAN := false;
  v_leaders JSONB := '[]'::jsonb;
  v_current_student JSONB := NULL;
  v_total_participants INT := 0;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT id INTO v_current_student_id
  FROM public.students
  WHERE profile_id = auth.uid();

  IF auth.role() = 'service_role' OR public.is_admin() OR public.is_teacher() THEN
    v_is_authorized := true;
  ELSIF v_current_student_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.tests t
      JOIN public.students s ON s.id = v_current_student_id
      WHERE t.id = p_test_id
        AND t.status IN ('PUBLISHED', 'ACTIVE', 'COMPLETED')
        AND (t.course_id = s.target_course_id OR t.force_id = s.target_force_id OR t.course_id IS NULL)
    ) INTO v_is_authorized;
  END IF;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to view this test leaderboard.';
  END IF;

  WITH ranked_students AS (
    SELECT
      -- FIXED: DENSE_RANK uses ONLY the primary ranking metric (percentage).
      -- Equal percentages will now always share the same rank number.
      DENSE_RANK() OVER (
        ORDER BY b.percentage DESC
      ) AS rank,
      s.id AS student_id,
      s.roll_number,
      p.display_name AS student_name,
      bt.id AS batch_id,
      COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
      c.id AS course_id,
      c.name AS course_name,
      f.id AS force_id,
      f.name AS force_name,
      b.marks_obtained AS score,
      b.max_marks AS total_marks,
      b.percentage,
      b.passed,
      b.time_spent_seconds,
      b.submitted_at,
      (s.id = v_current_student_id) AS is_current_user
    FROM public.view_best_student_test_results b
    JOIN public.students s ON s.id = b.student_id
    JOIN public.profiles p ON p.id = s.profile_id
    LEFT JOIN public.forces f ON f.id = s.target_force_id
    LEFT JOIN public.courses c ON c.id = s.target_course_id
    LEFT JOIN (
      SELECT DISTINCT ON (student_id) student_id, batch_id
      FROM public.batch_enrollments
      WHERE status = 'ACTIVE'
      ORDER BY student_id, enrolled_at DESC
    ) be ON be.student_id = s.id
    LEFT JOIN public.batches bt ON bt.id = be.batch_id
    WHERE b.test_id = p_test_id
      AND s.status = 'ACTIVE'
  )
  SELECT
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', rs.rank,
          'student_id', rs.student_id,
          'roll_number', rs.roll_number,
          'student_name', rs.student_name,
          'batch_id', rs.batch_id,
          'batch_name', rs.batch_name,
          'course_id', rs.course_id,
          'course_name', rs.course_name,
          'force_id', rs.force_id,
          'force_name', rs.force_name,
          'score', rs.score,
          'total_marks', rs.total_marks,
          'percentage', rs.percentage,
          'passed', rs.passed,
          'time_spent_seconds', rs.time_spent_seconds,
          'submitted_at', rs.submitted_at,
          'is_current_user', rs.is_current_user
        )
      )
      FROM (
        -- Secondary deterministic ordering applied OUTSIDE DENSE_RANK window
        SELECT * FROM ranked_students
        ORDER BY rank ASC, score DESC, time_spent_seconds ASC, roll_number ASC
        LIMIT p_limit
      ) rs
    ), '[]'::jsonb),
    (
      SELECT jsonb_build_object(
        'rank', rs.rank,
        'student_id', rs.student_id,
        'roll_number', rs.roll_number,
        'student_name', rs.student_name,
        'batch_id', rs.batch_id,
        'batch_name', rs.batch_name,
        'course_id', rs.course_id,
        'course_name', rs.course_name,
        'force_id', rs.force_id,
        'force_name', rs.force_name,
        'score', rs.score,
        'total_marks', rs.total_marks,
        'percentage', rs.percentage,
        'passed', rs.passed,
        'time_spent_seconds', rs.time_spent_seconds,
        'submitted_at', rs.submitted_at,
        'is_current_user', true
      )
      FROM ranked_students rs
      WHERE rs.student_id = v_current_student_id
      LIMIT 1
    ),
    (SELECT COUNT(*) FROM ranked_students)
  INTO v_leaders, v_current_student, v_total_participants;

  RETURN jsonb_build_object(
    'leaders', v_leaders,
    'current_student', v_current_student,
    'total_participants', v_total_participants
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 1b. FIX: get_course_leaderboard
--     Ranking metric: aggregate_percentage ONLY inside DENSE_RANK
--     Secondary determinism: total_marks_obtained DESC, average_percentage DESC, roll_number ASC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_course_leaderboard(
  p_course_id UUID,
  p_batch_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 40,
  p_min_tests INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_student_id UUID;
  v_leaders JSONB := '[]'::jsonb;
  v_current_student JSONB := NULL;
  v_total_participants INT := 0;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT id INTO v_current_student_id
  FROM public.students
  WHERE profile_id = auth.uid();

  IF auth.role() <> 'service_role' AND NOT (public.is_admin() OR public.is_teacher()) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.students
      WHERE id = v_current_student_id AND target_course_id = p_course_id
    ) THEN
      RAISE EXCEPTION 'Access Denied: You cannot view leaderboards of other courses.';
    END IF;
  END IF;

  WITH student_aggregates AS (
    SELECT
      s.id AS student_id,
      s.roll_number,
      p.display_name AS student_name,
      bt.id AS batch_id,
      COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
      c.id AS course_id,
      c.name AS course_name,
      f.id AS force_id,
      f.name AS force_name,
      COUNT(b.result_id)::INT AS tests_completed,
      ROUND(COALESCE(SUM(b.marks_obtained), 0), 2) AS total_marks_obtained,
      ROUND(COALESCE(SUM(b.max_marks), 0), 2) AS total_marks_possible,
      ROUND(
        COALESCE(
          (SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100,
          0
        ),
        2
      ) AS aggregate_percentage,
      ROUND(COALESCE(AVG(b.percentage), 0), 2) AS average_percentage,
      ROUND(COALESCE(MAX(b.percentage), 0), 2) AS best_percentage,
      (s.id = v_current_student_id) AS is_current_user
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    JOIN public.courses c ON c.id = s.target_course_id
    LEFT JOIN public.forces f ON f.id = s.target_force_id
    LEFT JOIN (
      SELECT DISTINCT ON (student_id) student_id, batch_id
      FROM public.batch_enrollments
      WHERE status = 'ACTIVE'
      ORDER BY student_id, enrolled_at DESC
    ) be ON be.student_id = s.id
    LEFT JOIN public.batches bt ON bt.id = be.batch_id
    JOIN public.view_best_student_test_results b
      ON b.student_id = s.id AND b.course_id = p_course_id
    WHERE s.target_course_id = p_course_id
      AND s.status = 'ACTIVE'
      AND (p_batch_id IS NULL OR bt.id = p_batch_id)
    GROUP BY s.id, s.roll_number, p.display_name, bt.id, bt.name, bt.code, c.id, c.name, f.id, f.name
    HAVING COUNT(b.result_id) >= p_min_tests
  ),
  ranked AS (
    SELECT
      -- FIXED: Only aggregate_percentage inside DENSE_RANK
      DENSE_RANK() OVER (
        ORDER BY sa.aggregate_percentage DESC
      ) AS rank,
      sa.*
    FROM student_aggregates sa
  )
  SELECT
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', r.rank,
          'student_id', r.student_id,
          'roll_number', r.roll_number,
          'student_name', r.student_name,
          'batch_id', r.batch_id,
          'batch_name', r.batch_name,
          'course_id', r.course_id,
          'course_name', r.course_name,
          'force_id', r.force_id,
          'force_name', r.force_name,
          'tests_completed', r.tests_completed,
          'total_marks_obtained', r.total_marks_obtained,
          'total_marks_possible', r.total_marks_possible,
          'aggregate_percentage', r.aggregate_percentage,
          'average_percentage', r.average_percentage,
          'best_percentage', r.best_percentage,
          'is_current_user', r.is_current_user
        )
      )
      FROM (
        SELECT * FROM ranked
        ORDER BY rank ASC, total_marks_obtained DESC, average_percentage DESC, roll_number ASC
        LIMIT p_limit
      ) r
    ), '[]'::jsonb),
    (
      SELECT jsonb_build_object(
        'rank', r.rank,
        'student_id', r.student_id,
        'roll_number', r.roll_number,
        'student_name', r.student_name,
        'batch_id', r.batch_id,
        'batch_name', r.batch_name,
        'course_id', r.course_id,
        'course_name', r.course_name,
        'force_id', r.force_id,
        'force_name', r.force_name,
        'tests_completed', r.tests_completed,
        'total_marks_obtained', r.total_marks_obtained,
        'total_marks_possible', r.total_marks_possible,
        'aggregate_percentage', r.aggregate_percentage,
        'average_percentage', r.average_percentage,
        'best_percentage', r.best_percentage,
        'is_current_user', true
      )
      FROM ranked r
      WHERE r.student_id = v_current_student_id
      LIMIT 1
    ),
    (SELECT COUNT(*) FROM ranked)
  INTO v_leaders, v_current_student, v_total_participants;

  RETURN jsonb_build_object(
    'leaders', v_leaders,
    'current_student', v_current_student,
    'total_participants', v_total_participants
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 1c. FIX: get_academy_leaderboard
--     Ranking metric: aggregate_percentage ONLY inside DENSE_RANK
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_academy_leaderboard(
  p_force_id UUID DEFAULT NULL,
  p_course_id UUID DEFAULT NULL,
  p_batch_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 40,
  p_min_tests INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_student_id UUID;
  v_leaders JSONB := '[]'::jsonb;
  v_current_student JSONB := NULL;
  v_total_participants INT := 0;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT id INTO v_current_student_id
  FROM public.students
  WHERE profile_id = auth.uid();

  WITH student_aggregates AS (
    SELECT
      s.id AS student_id,
      s.roll_number,
      p.display_name AS student_name,
      bt.id AS batch_id,
      COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
      c.id AS course_id,
      c.name AS course_name,
      f.id AS force_id,
      f.name AS force_name,
      COUNT(b.result_id)::INT AS tests_completed,
      ROUND(COALESCE(SUM(b.marks_obtained), 0), 2) AS total_marks_obtained,
      ROUND(COALESCE(SUM(b.max_marks), 0), 2) AS total_marks_possible,
      ROUND(
        COALESCE(
          (SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100,
          0
        ),
        2
      ) AS aggregate_percentage,
      ROUND(COALESCE(AVG(b.percentage), 0), 2) AS average_percentage,
      ROUND(COALESCE(MAX(b.percentage), 0), 2) AS best_percentage,
      (s.id = v_current_student_id) AS is_current_user
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    LEFT JOIN public.courses c ON c.id = s.target_course_id
    LEFT JOIN public.forces f ON f.id = s.target_force_id
    LEFT JOIN (
      SELECT DISTINCT ON (student_id) student_id, batch_id
      FROM public.batch_enrollments
      WHERE status = 'ACTIVE'
      ORDER BY student_id, enrolled_at DESC
    ) be ON be.student_id = s.id
    LEFT JOIN public.batches bt ON bt.id = be.batch_id
    JOIN public.view_best_student_test_results b
      ON b.student_id = s.id
    WHERE s.status = 'ACTIVE'
      AND (p_force_id IS NULL OR s.target_force_id = p_force_id)
      AND (p_course_id IS NULL OR s.target_course_id = p_course_id)
      AND (p_batch_id IS NULL OR bt.id = p_batch_id)
    GROUP BY s.id, s.roll_number, p.display_name, bt.id, bt.name, bt.code, c.id, c.name, f.id, f.name
    HAVING COUNT(b.result_id) >= p_min_tests
  ),
  ranked AS (
    SELECT
      -- FIXED: Only aggregate_percentage inside DENSE_RANK
      DENSE_RANK() OVER (
        ORDER BY sa.aggregate_percentage DESC
      ) AS rank,
      sa.*
    FROM student_aggregates sa
  )
  SELECT
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'rank', r.rank,
          'student_id', r.student_id,
          'roll_number', r.roll_number,
          'student_name', r.student_name,
          'batch_id', r.batch_id,
          'batch_name', r.batch_name,
          'course_id', r.course_id,
          'course_name', r.course_name,
          'force_id', r.force_id,
          'force_name', r.force_name,
          'tests_completed', r.tests_completed,
          'total_marks_obtained', r.total_marks_obtained,
          'total_marks_possible', r.total_marks_possible,
          'aggregate_percentage', r.aggregate_percentage,
          'average_percentage', r.average_percentage,
          'best_percentage', r.best_percentage,
          'is_current_user', r.is_current_user
        )
      )
      FROM (
        SELECT * FROM ranked
        ORDER BY rank ASC, total_marks_obtained DESC, average_percentage DESC, roll_number ASC
        LIMIT p_limit
      ) r
    ), '[]'::jsonb),
    (
      SELECT jsonb_build_object(
        'rank', r.rank,
        'student_id', r.student_id,
        'roll_number', r.roll_number,
        'student_name', r.student_name,
        'batch_id', r.batch_id,
        'batch_name', r.batch_name,
        'course_id', r.course_id,
        'course_name', r.course_name,
        'force_id', r.force_id,
        'force_name', r.force_name,
        'tests_completed', r.tests_completed,
        'total_marks_obtained', r.total_marks_obtained,
        'total_marks_possible', r.total_marks_possible,
        'aggregate_percentage', r.aggregate_percentage,
        'average_percentage', r.average_percentage,
        'best_percentage', r.best_percentage,
        'is_current_user', true
      )
      FROM ranked r
      WHERE r.student_id = v_current_student_id
      LIMIT 1
    ),
    (SELECT COUNT(*) FROM ranked)
  INTO v_leaders, v_current_student, v_total_participants;

  RETURN jsonb_build_object(
    'leaders', v_leaders,
    'current_student', v_current_student,
    'total_participants', v_total_participants
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 1d. FIX: get_student_rank_summary
--     All four DENSE_RANK calls inside this function: use single primary metric only.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_rank_summary(p_student_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id UUID;
  v_student RECORD;
  v_batch_id UUID;
  v_tests_completed INT := 0;
  v_total_obtained NUMERIC(10,2) := 0;
  v_total_possible NUMERIC(10,2) := 0;
  v_aggregate_pct NUMERIC(5,2) := 0;
  v_avg_pct NUMERIC(5,2) := 0;
  v_best_pct NUMERIC(5,2) := 0;
  v_batch_rank INT := NULL;
  v_batch_total INT := 0;
  v_course_rank INT := NULL;
  v_course_total INT := 0;
  v_academy_rank INT := NULL;
  v_academy_total INT := 0;
  v_latest_test_rank INT := NULL;
  v_latest_test_total INT := 0;
  v_latest_test_id UUID := NULL;
  v_latest_test_name TEXT := NULL;
  v_latest_test_percentage NUMERIC(5,2) := NULL;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF auth.role() = 'service_role' OR public.is_admin() OR public.is_teacher() THEN
    IF p_student_id IS NOT NULL THEN
      v_target_id := p_student_id;
    ELSE
      SELECT id INTO v_target_id FROM public.students WHERE profile_id = auth.uid();
    END IF;
  ELSE
    SELECT id INTO v_target_id FROM public.students WHERE profile_id = auth.uid();
  END IF;

  IF v_target_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Student record not found');
  END IF;

  SELECT * INTO v_student FROM public.students WHERE id = v_target_id;
  IF v_student IS NULL THEN
    RETURN jsonb_build_object('error', 'Student not found');
  END IF;

  SELECT batch_id INTO v_batch_id
  FROM public.batch_enrollments
  WHERE student_id = v_target_id AND status = 'ACTIVE'
  ORDER BY enrolled_at DESC LIMIT 1;

  -- 1. Student Personal Aggregate
  SELECT
    COUNT(b.result_id)::INT,
    ROUND(COALESCE(SUM(b.marks_obtained), 0), 2),
    ROUND(COALESCE(SUM(b.max_marks), 0), 2),
    ROUND(COALESCE((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 0), 2),
    ROUND(COALESCE(AVG(b.percentage), 0), 2),
    ROUND(COALESCE(MAX(b.percentage), 0), 2)
  INTO
    v_tests_completed,
    v_total_obtained,
    v_total_possible,
    v_aggregate_pct,
    v_avg_pct,
    v_best_pct
  FROM public.view_best_student_test_results b
  WHERE b.student_id = v_target_id;

  -- 2. Academy-wide Rank & Total
  IF v_tests_completed > 0 THEN
    WITH academy_scores AS (
      SELECT
        s.id AS student_id,
        ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) AS agg_pct,
        SUM(b.marks_obtained) AS tot_marks,
        AVG(b.percentage) AS avg_pct,
        s.roll_number
      FROM public.students s
      JOIN public.view_best_student_test_results b ON b.student_id = s.id
      WHERE s.status = 'ACTIVE'
      GROUP BY s.id, s.roll_number
    ),
    academy_ranked AS (
      SELECT
        student_id,
        -- FIXED: Only agg_pct in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY agg_pct DESC
        ) AS rank
      FROM academy_scores
    )
    SELECT
      (SELECT rank FROM academy_ranked WHERE student_id = v_target_id),
      (SELECT COUNT(*) FROM academy_ranked)
    INTO v_academy_rank, v_academy_total;
  ELSE
    SELECT COUNT(*) INTO v_academy_total FROM public.students WHERE status = 'ACTIVE';
  END IF;

  -- 3. Course-wide Rank & Total
  IF v_tests_completed > 0 AND v_student.target_course_id IS NOT NULL THEN
    WITH course_scores AS (
      SELECT
        s.id AS student_id,
        ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) AS agg_pct,
        SUM(b.marks_obtained) AS tot_marks,
        AVG(b.percentage) AS avg_pct,
        s.roll_number
      FROM public.students s
      JOIN public.view_best_student_test_results b ON b.student_id = s.id AND b.course_id = v_student.target_course_id
      WHERE s.status = 'ACTIVE' AND s.target_course_id = v_student.target_course_id
      GROUP BY s.id, s.roll_number
    ),
    course_ranked AS (
      SELECT
        student_id,
        -- FIXED: Only agg_pct in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY agg_pct DESC
        ) AS rank
      FROM course_scores
    )
    SELECT
      (SELECT rank FROM course_ranked WHERE student_id = v_target_id),
      (SELECT COUNT(*) FROM course_ranked)
    INTO v_course_rank, v_course_total;
  ELSE
    SELECT COUNT(*) INTO v_course_total
    FROM public.students
    WHERE status = 'ACTIVE' AND target_course_id = v_student.target_course_id;
  END IF;

  -- 4. Batch-wide Rank & Total
  IF v_tests_completed > 0 AND v_batch_id IS NOT NULL THEN
    WITH batch_scores AS (
      SELECT
        s.id AS student_id,
        ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) AS agg_pct,
        SUM(b.marks_obtained) AS tot_marks,
        AVG(b.percentage) AS avg_pct,
        s.roll_number
      FROM public.students s
      JOIN public.batch_enrollments be ON be.student_id = s.id AND be.batch_id = v_batch_id AND be.status = 'ACTIVE'
      JOIN public.view_best_student_test_results b ON b.student_id = s.id
      WHERE s.status = 'ACTIVE'
      GROUP BY s.id, s.roll_number
    ),
    batch_ranked AS (
      SELECT
        student_id,
        -- FIXED: Only agg_pct in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY agg_pct DESC
        ) AS rank
      FROM batch_scores
    )
    SELECT
      (SELECT rank FROM batch_ranked WHERE student_id = v_target_id),
      (SELECT COUNT(*) FROM batch_ranked)
    INTO v_batch_rank, v_batch_total;
  ELSIF v_batch_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_batch_total
    FROM public.batch_enrollments be
    JOIN public.students s ON s.id = be.student_id
    WHERE be.batch_id = v_batch_id AND be.status = 'ACTIVE' AND s.status = 'ACTIVE';
  END IF;

  -- 5. Latest Test Performance & Rank
  SELECT
    b.test_id,
    b.test_name,
    b.percentage
  INTO
    v_latest_test_id,
    v_latest_test_name,
    v_latest_test_percentage
  FROM public.view_best_student_test_results b
  WHERE b.student_id = v_target_id
  ORDER BY b.submitted_at DESC, b.generated_at DESC
  LIMIT 1;

  IF v_latest_test_id IS NOT NULL THEN
    WITH test_scores AS (
      SELECT
        b.student_id,
        -- FIXED: Only percentage in DENSE_RANK for test rank
        DENSE_RANK() OVER (
          ORDER BY b.percentage DESC
        ) AS rank
      FROM public.view_best_student_test_results b
      JOIN public.students s ON s.id = b.student_id
      WHERE b.test_id = v_latest_test_id AND s.status = 'ACTIVE'
    )
    SELECT
      (SELECT rank FROM test_scores WHERE student_id = v_target_id),
      (SELECT COUNT(*) FROM test_scores)
    INTO v_latest_test_rank, v_latest_test_total;
  END IF;

  RETURN jsonb_build_object(
    'student_id', v_target_id,
    'roll_number', v_student.roll_number,
    'tests_completed', v_tests_completed,
    'total_marks_obtained', v_total_obtained,
    'total_marks_possible', v_total_possible,
    'aggregate_percentage', v_aggregate_pct,
    'average_percentage', v_avg_pct,
    'best_percentage', v_best_pct,
    'batch_rank', v_batch_rank,
    'batch_total', v_batch_total,
    'course_rank', v_course_rank,
    'course_total', v_course_total,
    'academy_rank', v_academy_rank,
    'academy_total', v_academy_total,
    'latest_test_rank', v_latest_test_rank,
    'latest_test_total', v_latest_test_total,
    'latest_test_id', v_latest_test_id,
    'latest_test_name', v_latest_test_name,
    'latest_test_percentage', v_latest_test_percentage
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 1e. FIX: get_rank_neighborhood
--     All four scope branches: DENSE_RANK uses only the primary metric.
--     Secondary ordering applied OUTSIDE the window in the WHERE/ORDER BY.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_rank_neighborhood(
  p_scope TEXT DEFAULT 'ACADEMY',
  p_scope_id UUID DEFAULT NULL,
  p_range INT DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID;
  v_student_rank INT;
  v_neighborhood JSONB := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT id INTO v_student_id
  FROM public.students
  WHERE profile_id = auth.uid();

  IF v_student_id IS NULL AND auth.role() = 'service_role' THEN
    SELECT id INTO v_student_id FROM public.students LIMIT 1;
  END IF;

  IF v_student_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  IF UPPER(p_scope) = 'TEST' THEN
    WITH ranked AS (
      SELECT
        -- FIXED: Only percentage in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY b.percentage DESC
        ) AS rank,
        s.id AS student_id,
        s.roll_number,
        p.display_name AS student_name,
        COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
        b.percentage AS score_pct,
        (s.id = v_student_id) AS is_current_user
      FROM public.view_best_student_test_results b
      JOIN public.students s ON s.id = b.student_id
      JOIN public.profiles p ON p.id = s.profile_id
      LEFT JOIN (
        SELECT DISTINCT ON (student_id) student_id, batch_id
        FROM public.batch_enrollments WHERE status = 'ACTIVE'
        ORDER BY student_id, enrolled_at DESC
      ) be ON be.student_id = s.id
      LEFT JOIN public.batches bt ON bt.id = be.batch_id
      WHERE b.test_id = p_scope_id AND s.status = 'ACTIVE'
    ),
    target_rank AS (
      SELECT rank FROM ranked WHERE student_id = v_student_id LIMIT 1
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'rank', r.rank,
        'student_id', r.student_id,
        'roll_number', r.roll_number,
        'student_name', r.student_name,
        'batch_name', r.batch_name,
        'percentage', r.score_pct,
        'is_current_user', r.is_current_user
      )
    ) INTO v_neighborhood
    FROM (
      SELECT * FROM ranked
      WHERE (SELECT rank FROM target_rank) IS NOT NULL
        AND rank BETWEEN ((SELECT rank FROM target_rank) - p_range)
                     AND ((SELECT rank FROM target_rank) + p_range)
      ORDER BY rank ASC, roll_number ASC
    ) r;

  ELSIF UPPER(p_scope) = 'COURSE' THEN
    WITH ranked AS (
      SELECT
        -- FIXED: Only aggregate_pct in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY
            ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) DESC
        ) AS rank,
        s.id AS student_id,
        s.roll_number,
        p.display_name AS student_name,
        COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
        ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) AS aggregate_pct,
        (s.id = v_student_id) AS is_current_user
      FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      LEFT JOIN (
        SELECT DISTINCT ON (student_id) student_id, batch_id
        FROM public.batch_enrollments WHERE status = 'ACTIVE'
        ORDER BY student_id, enrolled_at DESC
      ) be ON be.student_id = s.id
      LEFT JOIN public.batches bt ON bt.id = be.batch_id
      JOIN public.view_best_student_test_results b
        ON b.student_id = s.id AND b.course_id = p_scope_id
      WHERE s.target_course_id = p_scope_id AND s.status = 'ACTIVE'
      GROUP BY s.id, s.roll_number, p.display_name, bt.name, bt.code
    ),
    target_rank AS (
      SELECT rank FROM ranked WHERE student_id = v_student_id LIMIT 1
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'rank', r.rank,
        'student_id', r.student_id,
        'roll_number', r.roll_number,
        'student_name', r.student_name,
        'batch_name', r.batch_name,
        'percentage', r.aggregate_pct,
        'is_current_user', r.is_current_user
      )
    ) INTO v_neighborhood
    FROM (
      SELECT * FROM ranked
      WHERE (SELECT rank FROM target_rank) IS NOT NULL
        AND rank BETWEEN ((SELECT rank FROM target_rank) - p_range)
                     AND ((SELECT rank FROM target_rank) + p_range)
      ORDER BY rank ASC, roll_number ASC
    ) r;

  ELSIF UPPER(p_scope) = 'BATCH' THEN
    WITH ranked AS (
      SELECT
        -- FIXED: Only aggregate_pct in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY
            ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) DESC
        ) AS rank,
        s.id AS student_id,
        s.roll_number,
        p.display_name AS student_name,
        COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
        ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) AS aggregate_pct,
        (s.id = v_student_id) AS is_current_user
      FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      JOIN public.batch_enrollments be ON be.student_id = s.id AND be.batch_id = p_scope_id AND be.status = 'ACTIVE'
      JOIN public.batches bt ON bt.id = be.batch_id
      JOIN public.view_best_student_test_results b ON b.student_id = s.id
      WHERE s.status = 'ACTIVE'
      GROUP BY s.id, s.roll_number, p.display_name, bt.name, bt.code
    ),
    target_rank AS (
      SELECT rank FROM ranked WHERE student_id = v_student_id LIMIT 1
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'rank', r.rank,
        'student_id', r.student_id,
        'roll_number', r.roll_number,
        'student_name', r.student_name,
        'batch_name', r.batch_name,
        'percentage', r.aggregate_pct,
        'is_current_user', r.is_current_user
      )
    ) INTO v_neighborhood
    FROM (
      SELECT * FROM ranked
      WHERE (SELECT rank FROM target_rank) IS NOT NULL
        AND rank BETWEEN ((SELECT rank FROM target_rank) - p_range)
                     AND ((SELECT rank FROM target_rank) + p_range)
      ORDER BY rank ASC, roll_number ASC
    ) r;

  ELSE -- Default: ACADEMY
    WITH ranked AS (
      SELECT
        -- FIXED: Only aggregate_pct in DENSE_RANK
        DENSE_RANK() OVER (
          ORDER BY
            ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) DESC
        ) AS rank,
        s.id AS student_id,
        s.roll_number,
        p.display_name AS student_name,
        COALESCE(bt.name, bt.code, 'Unassigned') AS batch_name,
        ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) AS aggregate_pct,
        (s.id = v_student_id) AS is_current_user
      FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      LEFT JOIN (
        SELECT DISTINCT ON (student_id) student_id, batch_id
        FROM public.batch_enrollments WHERE status = 'ACTIVE'
        ORDER BY student_id, enrolled_at DESC
      ) be ON be.student_id = s.id
      LEFT JOIN public.batches bt ON bt.id = be.batch_id
      JOIN public.view_best_student_test_results b ON b.student_id = s.id
      WHERE s.status = 'ACTIVE'
      GROUP BY s.id, s.roll_number, p.display_name, bt.name, bt.code
    ),
    target_rank AS (
      SELECT rank FROM ranked WHERE student_id = v_student_id LIMIT 1
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'rank', r.rank,
        'student_id', r.student_id,
        'roll_number', r.roll_number,
        'student_name', r.student_name,
        'batch_name', r.batch_name,
        'percentage', r.aggregate_pct,
        'is_current_user', r.is_current_user
      )
    ) INTO v_neighborhood
    FROM (
      SELECT * FROM ranked
      WHERE (SELECT rank FROM target_rank) IS NOT NULL
        AND rank BETWEEN ((SELECT rank FROM target_rank) - p_range)
                     AND ((SELECT rank FROM target_rank) + p_range)
      ORDER BY rank ASC, roll_number ASC
    ) r;
  END IF;

  RETURN COALESCE(v_neighborhood, '[]'::jsonb);
END;
$$;

-- ============================================================================
-- PART 2: OUTSIDE-TOP-40 LEADERBOARD SEED (45 students, test student = rank #43)
-- ============================================================================
-- Strategy:
--   * Reuse the existing "Outside Top 40 Test" if already present, or create it.
--   * Create 44 ghost student profiles + student records at ranks #1–#42 and #44–#45.
--   * student@gmail.com (the seeded test student) gets rank #43 with 38.00%.
--   * Ranks #1–#42: scores 98% down to 39%, one distinct value each → 42 distinct ranks.
--   * Ranks #44–#45: scores 37% and 36% → ranks #44 and #45.
--   * All 45 students share the SAME test (v_rank_test_id).
--   * All results are inserted directly into test_results with matching test_attempts.
-- ============================================================================

DO $$
DECLARE
  -- Reference IDs
  v_student_profile_id  UUID;
  v_student_id          UUID;
  v_force_id            UUID;
  v_course_id           UUID;
  v_batch_id            UUID;
  v_rank_test_id        UUID;
  v_assignment_id       UUID;
  v_rank_test_name      TEXT := 'Outside Top 40 Ranking Test';

  -- Loop vars
  i                     INT;
  v_ghost_profile_id    UUID;
  v_ghost_student_id    UUID;
  v_ghost_email         TEXT;
  v_ghost_name          TEXT;
  v_ghost_roll          TEXT;
  v_pct                 NUMERIC(5,2);
  v_marks               NUMERIC(10,2);
  v_max_marks           NUMERIC(10,2) := 100.00;
  v_passed              BOOLEAN;
  v_passing_threshold   NUMERIC(5,2) := 60.00;
  v_attempt_id          UUID;

  -- Percentage mapping:
  -- Slots 1..42 get percentages 98, 97, ..., 57 (decreasing by 1 each)
  -- Slot 43 (test student) = 38%
  -- Slot 44 = 37%, Slot 45 = 36%
  v_percentages         NUMERIC(5,2)[] := ARRAY(
    SELECT generate_series(98, 57, -1)::NUMERIC(5,2)
  ); -- 42 elements: 98,97,...,57

BEGIN
  -- Resolve the seeded test student
  SELECT id INTO v_student_profile_id
  FROM auth.users WHERE email = 'student@gmail.com';

  IF v_student_profile_id IS NULL THEN
    RAISE NOTICE 'student@gmail.com not found — skipping outside-top-40 seed.';
    RETURN;
  END IF;

  SELECT id INTO v_student_id
  FROM public.students WHERE profile_id = v_student_profile_id;

  IF v_student_id IS NULL THEN
    RAISE NOTICE 'students record for student@gmail.com not found — skipping.';
    RETURN;
  END IF;

  -- Resolve force, course, batch from the student
  SELECT target_force_id, target_course_id
  INTO v_force_id, v_course_id
  FROM public.students WHERE id = v_student_id;

  SELECT batch_id INTO v_batch_id
  FROM public.batch_enrollments
  WHERE student_id = v_student_id AND status = 'ACTIVE'
  ORDER BY enrolled_at DESC LIMIT 1;

  -- Create or resolve the "Outside Top 40" test
  SELECT id INTO v_rank_test_id
  FROM public.tests
  WHERE name = v_rank_test_name
  LIMIT 1;

  IF v_rank_test_id IS NULL THEN
    INSERT INTO public.tests (
      name, description, status,
      duration_minutes, passing_threshold, total_marks,
      show_answer_review, show_result_immediately,
      force_id, course_id, batch_id,
      created_by
    )
    VALUES (
      v_rank_test_name,
      'Auto-generated test for outside-top-40 leaderboard verification (45 students, test student ranks #43).',
      'PUBLISHED',
      30,
      v_passing_threshold::INT,
      100,
      false,
      true,
      v_force_id,
      v_course_id,
      v_batch_id,
      (SELECT id FROM public.profiles WHERE role = 'ADMIN' LIMIT 1)
    )
    RETURNING id INTO v_rank_test_id;
  END IF;

  -- Create or resolve test assignment for this batch
  SELECT id INTO v_assignment_id
  FROM public.test_assignments
  WHERE test_id = v_rank_test_id AND batch_id = v_batch_id
  LIMIT 1;

  IF v_assignment_id IS NULL THEN
    INSERT INTO public.test_assignments (
      test_id, batch_id, available_from, available_until, status, assigned_by
    )
    VALUES (
      v_rank_test_id,
      v_batch_id,
      now() - INTERVAL '1 day',
      now() + INTERVAL '30 days',
      'ACTIVE',
      (SELECT id FROM public.profiles WHERE role = 'ADMIN' LIMIT 1)
    )
    RETURNING id INTO v_assignment_id;
  END IF;

  -- Delete any existing ghost results for this test so re-seeding is idempotent.
  -- (Only removes ghost students whose email matches rank_ghost_* pattern)
  DELETE FROM public.test_results tr
  WHERE tr.test_id = v_rank_test_id
    AND tr.student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      WHERE p.email LIKE 'rank_ghost_%@sfacbt.internal'
    );

  DELETE FROM public.test_attempts ta
  WHERE ta.test_id = v_rank_test_id
    AND ta.student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.profiles p ON p.id = s.profile_id
      WHERE p.email LIKE 'rank_ghost_%@sfacbt.internal'
    );

  -- Also remove test student's existing result on this test so we can re-insert clean
  DELETE FROM public.test_results WHERE test_id = v_rank_test_id AND student_id = v_student_id;
  DELETE FROM public.test_attempts WHERE test_id = v_rank_test_id AND student_id = v_student_id;

  -- -------------------------------------------------------------------------
  -- Create 44 ghost students (ranks #1–#42 and #44–#45)
  -- -------------------------------------------------------------------------
  FOR i IN 1..44 LOOP
    -- Determine which rank slot this ghost fills:
    --   slots 1..42 → array indices 1..42 → percentages 98..57
    --   slot 43 is the test student (skip here)
    --   slot 44 (ghost i=43 in loop) → 37%
    --   slot 45 (ghost i=44 in loop) → 36%
    IF i <= 42 THEN
      v_pct := v_percentages[i];   -- 98 down to 57
    ELSIF i = 43 THEN
      v_pct := 37.00;              -- rank #44
    ELSE
      v_pct := 36.00;              -- rank #45
    END IF;

    v_ghost_email  := 'rank_ghost_' || i || '@sfacbt.internal';
    v_ghost_name   := 'Rank Ghost ' || i;
    v_ghost_roll   := 'GHOST-' || LPAD(i::TEXT, 3, '0');
    v_ghost_profile_id := gen_random_uuid();

    -- Insert ghost into auth.users first to satisfy profiles_id_fkey
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    )
    VALUES (
      v_ghost_profile_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_ghost_email,
      crypt('12345678', gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'STUDENT', 'display_name', v_ghost_name),
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Fetch user ID by email in case user existed with different ID
    SELECT id INTO v_ghost_profile_id FROM auth.users WHERE email = v_ghost_email;

    -- Insert ghost profile
    INSERT INTO public.profiles (id, role, display_name, email, status)
    VALUES (v_ghost_profile_id, 'STUDENT', v_ghost_name, v_ghost_email, 'ACTIVE')
    ON CONFLICT (id) DO UPDATE
      SET display_name = EXCLUDED.display_name, status = 'ACTIVE';

    -- Insert ghost student record
    INSERT INTO public.students (profile_id, roll_number, father_name, cnic, target_force_id, target_course_id, status)
    VALUES (v_ghost_profile_id, v_ghost_roll, 'Ghost Father', '00000-0000000-' || LPAD(i::TEXT, 5, '0'), v_force_id, v_course_id, 'ACTIVE')
    ON CONFLICT (profile_id) DO UPDATE SET status = 'ACTIVE', roll_number = EXCLUDED.roll_number
    RETURNING id INTO v_ghost_student_id;

    IF v_ghost_student_id IS NULL THEN
      SELECT id INTO v_ghost_student_id FROM public.students WHERE profile_id = v_ghost_profile_id;
    END IF;

    -- Enroll in batch if batch exists
    IF v_batch_id IS NOT NULL THEN
      INSERT INTO public.batch_enrollments (batch_id, student_id)
      VALUES (v_batch_id, v_ghost_student_id)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Create test attempt
    v_marks := ROUND((v_pct / 100.0) * v_max_marks, 2);
    v_passed := (v_pct >= v_passing_threshold);

    INSERT INTO public.test_attempts (
      student_id, test_id, assignment_id, status,
      started_at, submitted_at, expires_at,
      attempt_number
    )
    VALUES (
      v_ghost_student_id, v_rank_test_id, v_assignment_id, 'SUBMITTED',
      now() - INTERVAL '2 hours',
      now() - INTERVAL '1 hour',
      now() + INTERVAL '1 day',
      1
    )
    RETURNING id INTO v_attempt_id;

    -- Insert result
    INSERT INTO public.test_results (
      attempt_id, student_id, test_id,
      total_questions, correct_count, incorrect_count, skipped_count,
      marks_obtained, max_marks, percentage, passed,
      section_results, time_spent_seconds
    )
    VALUES (
      v_attempt_id, v_ghost_student_id, v_rank_test_id,
      10,
      ROUND(v_pct / 10)::INT,  -- correct out of 10
      10 - ROUND(v_pct / 10)::INT,
      0,
      v_marks, v_max_marks, v_pct, v_passed,
      '[]'::jsonb,
      1800
    );
  END LOOP;

  -- -------------------------------------------------------------------------
  -- Insert test student result at rank #43 (38%)
  -- -------------------------------------------------------------------------
  v_pct    := 38.00;
  v_marks  := 38.00;
  v_passed := false;  -- below 60% threshold

  INSERT INTO public.test_attempts (
    student_id, test_id, assignment_id, status,
    started_at, submitted_at, expires_at,
    attempt_number
  )
  VALUES (
    v_student_id, v_rank_test_id, v_assignment_id, 'SUBMITTED',
    now() - INTERVAL '2 hours',
    now() - INTERVAL '1 hour',
    now() + INTERVAL '1 day',
    1
  )
  RETURNING id INTO v_attempt_id;

  INSERT INTO public.test_results (
    attempt_id, student_id, test_id,
    total_questions, correct_count, incorrect_count, skipped_count,
    marks_obtained, max_marks, percentage, passed,
    section_results, time_spent_seconds
  )
  VALUES (
    v_attempt_id, v_student_id, v_rank_test_id,
    10, 4, 6, 0,
    v_marks, v_max_marks, v_pct, v_passed,
    '[]'::jsonb,
    1800
  );

  RAISE NOTICE 'Outside-top-40 seed complete: 45 students on test %, test student (id=%) at 38%% (rank #43 of 45)', v_rank_test_id, v_student_id;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERY (informational — does not error)
-- ============================================================================
DO $$
DECLARE
  v_rank_test_id UUID;
  v_student_id   UUID;
  v_rank_row     RECORD;
  v_total        INT;
BEGIN
  SELECT id INTO v_rank_test_id FROM public.tests WHERE name = 'Outside Top 40 Ranking Test' LIMIT 1;
  SELECT s.id INTO v_student_id
  FROM public.students s
  JOIN public.profiles p ON p.id = s.profile_id
  WHERE p.email = 'student@gmail.com';

  IF v_rank_test_id IS NULL OR v_student_id IS NULL THEN
    RAISE NOTICE 'Verification skipped: test or student not found.';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM public.test_results WHERE test_id = v_rank_test_id;

  RAISE NOTICE 'Total participants on Outside Top 40 Test: %', v_total;

  WITH ranked AS (
    SELECT
      DENSE_RANK() OVER (ORDER BY b.percentage DESC) AS rank,
      b.student_id,
      b.percentage
    FROM public.view_best_student_test_results b
    JOIN public.students s ON s.id = b.student_id
    WHERE b.test_id = v_rank_test_id AND s.status = 'ACTIVE'
  )
  SELECT rank, percentage INTO v_rank_row
  FROM ranked
  WHERE student_id = v_student_id;

  RAISE NOTICE 'Test student rank: #% with %.2f%%', v_rank_row.rank, v_rank_row.percentage;

  -- Verify Top 40 does NOT include test student
  IF EXISTS (
    SELECT 1 FROM (
      SELECT DENSE_RANK() OVER (ORDER BY b.percentage DESC) AS rank, b.student_id
      FROM public.view_best_student_test_results b
      JOIN public.students s ON s.id = b.student_id
      WHERE b.test_id = v_rank_test_id AND s.status = 'ACTIVE'
    ) r
    WHERE r.rank <= 40 AND r.student_id = v_student_id
  ) THEN
    RAISE WARNING 'FAIL: test student appears in Top 40!';
  ELSE
    RAISE NOTICE 'PASS: test student correctly outside Top 40.';
  END IF;
END;
$$;
