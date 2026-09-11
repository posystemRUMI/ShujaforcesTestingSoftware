-- ============================================================================
-- Migration: 20260907100000_leaderboards_and_ranking.sql
-- Description: Remove Stanine Completely + Academy Ranking & Leaderboards (B27)
-- Author: Shuja Forces Academy CBT Engineering
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP STANINE COLUMN & HELPER FUNCTION
-- ----------------------------------------------------------------------------
ALTER TABLE public.test_results DROP COLUMN IF EXISTS stanine;
DROP FUNCTION IF EXISTS public.calculate_stanine(NUMERIC);

-- ----------------------------------------------------------------------------
-- 2. UPDATE SUBMIT_TEST_ATTEMPT (STANINE REMOVED)
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
  v_section_results JSONB := '[]'::jsonb;
  v_section RECORD;
  v_sec_total INT;
  v_sec_correct INT;
  v_sec_incorrect INT;
  v_sec_skipped INT;
  v_sec_marks NUMERIC(10,2);
  v_sec_max NUMERIC(10,2);
  v_result_id UUID;
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
        'max_marks', v_existing_result.max_marks
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

  -- 6. TRUSTED SCORING ENGINE
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

    -- Count incorrect
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

  -- Time spent
  v_time_spent := EXTRACT(EPOCH FROM (timezone('utc', now()) - v_attempt.started_at))::INT;

  -- 7. Set submitted_at exactly once
  UPDATE public.test_attempts
  SET
    submitted_at = timezone('utc', now()),
    status = v_submit_status
  WHERE id = p_attempt_id;

  -- 8. Create result
  INSERT INTO public.test_results (
    attempt_id, student_id, test_id,
    total_questions, correct_count, incorrect_count, skipped_count,
    marks_obtained, max_marks, percentage, passed,
    section_results, time_spent_seconds
  )
  VALUES (
    p_attempt_id, v_attempt.student_id, v_attempt.test_id,
    v_total_questions, v_correct, v_incorrect, v_skipped,
    v_marks_obtained, v_max_marks, v_percentage, v_passed,
    v_section_results, v_time_spent
  )
  RETURNING id INTO v_result_id;

  -- 9. Consume retake permission if retake
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
    'section_results', v_section_results,
    'time_spent_seconds', v_time_spent
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. UPDATE GET_RESULT_DETAIL (STANINE REMOVED)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_result_detail(p_result_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result RECORD;
  v_test RECORD;
  v_student RECORD;
  v_sections JSONB := '[]'::jsonb;
  v_section RECORD;
  v_questions JSONB;
  v_q RECORD;
  v_options JSONB;
BEGIN
  -- 1. Load result
  SELECT * INTO v_result FROM public.test_results WHERE id = p_result_id;
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Result not found.';
  END IF;

  -- 2. Check authorization
  SELECT * INTO v_student FROM public.students WHERE id = v_result.student_id;
  IF v_student.profile_id <> auth.uid() AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Cannot view another student''s result detail.';
  END IF;

  -- 3. Load test
  SELECT * INTO v_test FROM public.tests WHERE id = v_result.test_id;

  -- 4. Check answer review permission
  IF NOT v_test.show_answer_review AND NOT (public.is_admin() OR public.is_teacher()) THEN
    RETURN jsonb_build_object(
      'result', jsonb_build_object(
        'id', v_result.id,
        'percentage', v_result.percentage,
        'passed', v_result.passed,
        'marks_obtained', v_result.marks_obtained,
        'max_marks', v_result.max_marks
      ),
      'answer_review_enabled', false
    );
  END IF;

  -- 5. Build full review payload
  FOR v_section IN
    SELECT ts.* FROM public.test_sections ts
    WHERE ts.test_id = v_test.id ORDER BY ts.position
  LOOP
    v_questions := '[]'::jsonb;

    FOR v_q IN
      SELECT
        q.id, q.code, q.stem, q.stem_image_url, q.explanation, q.subject_id,
        ts.marks_per_question,
        aa.selected_option_id,
        COALESCE(aa.marked_for_review, false) AS marked_for_review,
        tsq.position AS q_pos
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      JOIN public.test_sections ts ON ts.id = tsq.test_section_id
      LEFT JOIN public.attempt_answers aa
        ON aa.question_id = q.id AND aa.attempt_id = v_result.attempt_id
      WHERE tsq.test_section_id = v_section.id
      ORDER BY tsq.position
    LOOP
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', qo.id,
          'label', qo.label,
          'text', qo.text,
          'image_url', qo.image_url,
          'is_correct', qo.is_correct
        ) ORDER BY qo.sort_order
      ) INTO v_options
      FROM public.question_options qo
      WHERE qo.question_id = v_q.id;

      v_questions := v_questions || jsonb_build_array(
        jsonb_build_object(
          'question_id', v_q.id,
          'code', v_q.code,
          'stem', v_q.stem,
          'stem_image_url', v_q.stem_image_url,
          'explanation', v_q.explanation,
          'subject_id', v_q.subject_id,
          'marks', v_q.marks_per_question,
          'selected_option_id', v_q.selected_option_id,
          'marked_for_review', v_q.marked_for_review,
          'options', COALESCE(v_options, '[]'::jsonb),
          'status', CASE
            WHEN v_q.selected_option_id IS NULL THEN 'skipped'
            WHEN EXISTS (
              SELECT 1 FROM public.question_options qo2
              WHERE qo2.id = v_q.selected_option_id AND qo2.is_correct = true
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

-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE & RANKING INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_test_results_ranking 
  ON public.test_results(student_id, test_id, percentage DESC, marks_obtained DESC);

CREATE INDEX IF NOT EXISTS idx_test_attempts_ranking 
  ON public.test_attempts(id, student_id, test_id, status);

CREATE INDEX IF NOT EXISTS idx_students_ranking 
  ON public.students(id, status, target_course_id, target_force_id);

CREATE INDEX IF NOT EXISTS idx_batch_enrollments_ranking 
  ON public.batch_enrollments(student_id, batch_id, status);

-- ----------------------------------------------------------------------------
-- 5. VIEW: BEST STUDENT TEST ATTEMPTS (Retake Policy: Best attempt per test)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_best_student_test_results AS
WITH ranked AS (
  SELECT
    tr.id AS result_id,
    tr.attempt_id,
    tr.student_id,
    tr.test_id,
    tr.total_questions,
    tr.correct_count,
    tr.incorrect_count,
    tr.skipped_count,
    tr.marks_obtained,
    tr.max_marks,
    tr.percentage,
    tr.passed,
    tr.time_spent_seconds,
    tr.generated_at,
    ta.submitted_at,
    t.name AS test_name,
    t.course_id,
    t.force_id,
    t.batch_id AS test_batch_id,
    ROW_NUMBER() OVER (
      PARTITION BY tr.student_id, tr.test_id
      ORDER BY tr.percentage DESC, tr.marks_obtained DESC, tr.time_spent_seconds ASC, tr.generated_at ASC
    ) as rn
  FROM public.test_results tr
  JOIN public.test_attempts ta ON ta.id = tr.attempt_id
  JOIN public.tests t ON t.id = tr.test_id
  WHERE ta.status IN ('SUBMITTED', 'AUTO_SUBMITTED', 'FORCE_SUBMITTED')
    AND t.status IN ('PUBLISHED', 'ACTIVE', 'COMPLETED')
)
SELECT
  result_id,
  attempt_id,
  student_id,
  test_id,
  total_questions,
  correct_count,
  incorrect_count,
  skipped_count,
  marks_obtained,
  max_marks,
  percentage,
  passed,
  time_spent_seconds,
  generated_at,
  submitted_at,
  test_name,
  course_id,
  force_id,
  test_batch_id
FROM ranked
WHERE rn = 1;

-- ----------------------------------------------------------------------------
-- 6. RPC: GET TEST LEADERBOARD (Top 40 + Current Student + Total Count)
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
      DENSE_RANK() OVER (
        ORDER BY b.percentage DESC, b.marks_obtained DESC
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
-- 7. RPC: GET COURSE LEADERBOARD (Aggregate by Course / Batch)
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
      DENSE_RANK() OVER (
        ORDER BY sa.aggregate_percentage DESC, sa.total_marks_obtained DESC, sa.average_percentage DESC
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
-- 8. RPC: GET ACADEMY LEADERBOARD (Overall Academy Standings)
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
      DENSE_RANK() OVER (
        ORDER BY sa.aggregate_percentage DESC, sa.total_marks_obtained DESC, sa.average_percentage DESC
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
-- 9. RPC: GET STUDENT RANK SUMMARY (Batch, Course, Academy, Latest Test Ranks)
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
        DENSE_RANK() OVER (
          ORDER BY agg_pct DESC, tot_marks DESC, avg_pct DESC
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
        DENSE_RANK() OVER (
          ORDER BY agg_pct DESC, tot_marks DESC, avg_pct DESC
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
        DENSE_RANK() OVER (
          ORDER BY agg_pct DESC, tot_marks DESC, avg_pct DESC
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
        DENSE_RANK() OVER (
          ORDER BY b.percentage DESC, b.marks_obtained DESC
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
-- 10. RPC: GET RANK NEIGHBORHOOD (+/- 2 around candidate)
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
        DENSE_RANK() OVER (
          ORDER BY b.percentage DESC, b.marks_obtained DESC
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
        DENSE_RANK() OVER (
          ORDER BY
            ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) DESC,
            SUM(b.marks_obtained) DESC,
            AVG(b.percentage) DESC
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
        DENSE_RANK() OVER (
          ORDER BY
            ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) DESC,
            SUM(b.marks_obtained) DESC,
            AVG(b.percentage) DESC
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
        DENSE_RANK() OVER (
          ORDER BY
            ROUND((SUM(b.marks_obtained) / NULLIF(SUM(b.max_marks), 0)) * 100, 2) DESC,
            SUM(b.marks_obtained) DESC,
            AVG(b.percentage) DESC
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
