BEGIN;
CREATE OR REPLACE FUNCTION save_test_blueprint(p_payload jsonb) RETURNS tests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; t jsonb:=p_payload->'test'; s jsonb; e jsonb; sec uuid; sid uuid; q jsonb; pos integer; result tests%ROWTYPE; retained uuid[]:='{}';
BEGIN
 IF NOT(is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Staff required'; END IF;
 tid:=NULLIF(p_payload->>'testId','')::uuid;
 PERFORM 1 FROM tests WHERE id=tid FOR UPDATE;
 IF tid IS NOT NULL AND NOT can_manage_test(tid) THEN RAISE EXCEPTION 'Test management denied'; END IF;
 IF jsonb_array_length(p_payload->'eligibilities')=0 THEN RAISE EXCEPTION 'Select eligible courses'; END IF;
 IF tid IS NULL THEN INSERT INTO tests(name,duration_minutes,status,created_by) VALUES(t->>'name',(t->>'duration_minutes')::int,'DRAFT',auth.uid()) RETURNING id INTO tid; END IF;
 -- No student can observe half-written composition; transaction publishes once complete.
 UPDATE tests SET status='DRAFT',name=t->>'name',description=t->>'description',duration_minutes=(t->>'duration_minutes')::int,
 passing_threshold=(t->>'passing_threshold')::int,shuffle_questions=coalesce((t->>'shuffle_questions')::boolean,false),shuffle_options=coalesce((t->>'shuffle_options')::boolean,false),
 allow_section_navigation=coalesce((t->>'allow_section_navigation')::boolean,false),show_result_immediately=coalesce((t->>'show_result_immediately')::boolean,true),show_answer_review=coalesce((t->>'show_answer_review')::boolean,false),negative_marking=coalesce((t->>'negative_marking')::boolean,false),negative_mark_value=coalesce((t->>'negative_mark_value')::numeric,0) WHERE id=tid;
 DELETE FROM test_eligible_courses WHERE test_id=tid;
 DELETE FROM test_course_deliveries WHERE test_id=tid;
 FOR e IN SELECT value FROM jsonb_array_elements(p_payload->'eligibilities') LOOP
 IF NOT EXISTS(SELECT 1 FROM courses WHERE id=(e->>'course_id')::uuid AND force_id=(e->>'force_id')::uuid AND status='ACTIVE') THEN RAISE EXCEPTION 'Invalid Force/course'; END IF;
 INSERT INTO test_eligible_courses(test_id,force_id,course_id) VALUES(tid,(e->>'force_id')::uuid,(e->>'course_id')::uuid);
 END LOOP;
 UPDATE tests SET force_id=(SELECT CASE WHEN count(DISTINCT force_id)=1 THEN min(force_id::text)::uuid ELSE NULL END FROM test_eligible_courses WHERE test_id=tid),
 course_id=(SELECT CASE WHEN count(DISTINCT course_id)=1 THEN min(course_id::text)::uuid ELSE NULL END FROM test_eligible_courses WHERE test_id=tid) WHERE id=tid;
 -- Retain section IDs referenced by previous attempts, replacing only content.
 FOR s IN SELECT value FROM jsonb_array_elements(p_payload->'sections') LOOP
 sec:=NULLIF(s->>'id','')::uuid;
 IF sec IS NULL THEN INSERT INTO test_sections(test_id,name,position,question_count,duration_minutes) VALUES(tid,s->>'name',(s->>'position')::int,(s->>'question_count')::int,(s->>'duration_minutes')::int) RETURNING id INTO sec;
 ELSE IF NOT EXISTS(SELECT 1 FROM test_sections WHERE id=sec AND test_id=tid) THEN RAISE EXCEPTION 'Invalid section owner'; END IF;
 UPDATE test_sections SET name=s->>'name',position=(s->>'position')::int,question_count=(s->>'question_count')::int,duration_minutes=(s->>'duration_minutes')::int WHERE id=sec; END IF;
 retained:=array_append(retained,sec);
 DELETE FROM test_section_subjects WHERE test_section_id=sec;
 FOR q IN SELECT value FROM jsonb_array_elements(s->'subject_ids') LOOP INSERT INTO test_section_subjects VALUES(sec,(q#>>'{}')::uuid) ON CONFLICT DO NOTHING; END LOOP;
 IF NOT EXISTS(SELECT 1 FROM test_section_subjects WHERE test_section_id=sec) AND NULLIF(s->>'subject_id','') IS NOT NULL THEN INSERT INTO test_section_subjects VALUES(sec,(s->>'subject_id')::uuid); END IF;
 UPDATE test_sections SET subject_id=(SELECT subject_id FROM test_section_subjects WHERE test_section_id=sec ORDER BY subject_id LIMIT 1),section_code=s->>'section_code',is_mandatory=coalesce((s->>'is_mandatory')::boolean,false) WHERE id=sec;
 IF jsonb_array_length(s->'question_ids')<>(s->>'question_count')::int THEN RAISE EXCEPTION 'Exact question count required for %',s->>'name'; END IF;
 DELETE FROM test_section_questions WHERE test_section_id=sec;
 pos:=0; FOR q IN SELECT value FROM jsonb_array_elements(s->'question_ids') LOOP pos:=pos+1; INSERT INTO test_section_questions(test_section_id,question_id,position,marks) VALUES(sec,(q#>>'{}')::uuid,pos,1); END LOOP;
 END LOOP;
 -- Removing sections with attempts is deliberately rejected by FK; transaction rolls back.
 DELETE FROM test_sections WHERE test_id=tid AND NOT(id=ANY(retained));
 PERFORM publish_test(tid);
 SELECT * INTO result FROM tests WHERE id=tid;
 RETURN result;
END $$;



UPDATE tests t SET force_id=(SELECT CASE WHEN count(DISTINCT force_id)=1 THEN min(force_id::text)::uuid ELSE NULL END FROM test_eligible_courses WHERE test_id=t.id),course_id=(SELECT CASE WHEN count(DISTINCT course_id)=1 THEN min(course_id::text)::uuid ELSE NULL END FROM test_eligible_courses WHERE test_id=t.id);
CREATE VIEW exam_staff_all_results WITH(security_invoker=true) AS SELECT r.id result_id,r.attempt_id,r.student_id,r.test_id,r.marks_obtained,r.max_marks,r.percentage,r.passed,r.time_spent_seconds,r.generated_at,a.submitted_at,a.attempt_number,t.name test_name,s.target_course_id course_id,s.target_force_id force_id
FROM portal_valid_results r JOIN test_attempts a ON a.id=r.attempt_id JOIN tests t ON t.id=r.test_id JOIN students s ON s.id=r.student_id;
CREATE VIEW exam_staff_latest_results WITH(security_invoker=true) AS SELECT DISTINCT ON(student_id,test_id) * FROM exam_staff_all_results ORDER BY student_id,test_id,submitted_at DESC,attempt_number DESC,result_id DESC;
GRANT SELECT ON exam_staff_all_results,exam_staff_latest_results TO authenticated;
CREATE OR REPLACE FUNCTION public.get_academy_leaderboard(p_force_id uuid DEFAULT NULL::uuid, p_course_id uuid DEFAULT NULL::uuid, p_batch_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 40, p_min_tests integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_student_id UUID;
  v_leaders JSONB := '[]'::jsonb;
  v_current_student JSONB := NULL;
  v_total_participants INT := 0;
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Active staff authorization required'; END IF;
 IF public.is_student() THEN RAISE EXCEPTION 'Use the authenticated student portal ranking API'; END IF;
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
      COUNT(DISTINCT b.test_id)::INT AS tests_completed,
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
    JOIN public.exam_staff_all_results b
      ON b.student_id = s.id
    WHERE s.status = 'ACTIVE'
      AND (p_force_id IS NULL OR s.target_force_id = p_force_id)
      AND (p_course_id IS NULL OR s.target_course_id = p_course_id)
      AND (p_batch_id IS NULL OR bt.id = p_batch_id)
    GROUP BY s.id, s.roll_number, p.display_name, bt.id, bt.name, bt.code, c.id, c.name, f.id, f.name
    HAVING COUNT(DISTINCT b.test_id) >= p_min_tests
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_course_leaderboard(p_course_id uuid, p_batch_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 40, p_min_tests integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_student_id UUID;
  v_leaders JSONB := '[]'::jsonb;
  v_current_student JSONB := NULL;
  v_total_participants INT := 0;
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Active staff authorization required'; END IF;
 IF public.is_student() THEN RAISE EXCEPTION 'Use the authenticated student portal ranking API'; END IF;
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
      COUNT(DISTINCT b.test_id)::INT AS tests_completed,
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
    JOIN public.exam_staff_all_results b
      ON b.student_id = s.id AND b.course_id = p_course_id
    WHERE s.target_course_id = p_course_id
      AND s.status = 'ACTIVE'
      AND (p_batch_id IS NULL OR bt.id = p_batch_id)
    GROUP BY s.id, s.roll_number, p.display_name, bt.id, bt.name, bt.code, c.id, c.name, f.id, f.name
    HAVING COUNT(DISTINCT b.test_id) >= p_min_tests
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_test_leaderboard(p_test_id uuid, p_limit integer DEFAULT 40)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_student_id UUID;
  v_is_authorized BOOLEAN := false;
  v_leaders JSONB := '[]'::jsonb;
  v_current_student JSONB := NULL;
  v_total_participants INT := 0;
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Active staff authorization required'; END IF;
 IF public.is_student() THEN RAISE EXCEPTION 'Use the authenticated student portal ranking API'; END IF;
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
    FROM public.exam_staff_latest_results b
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_student_rank_summary(p_student_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Active staff authorization required'; END IF;
 IF public.is_student() THEN RAISE EXCEPTION 'Use the authenticated student portal ranking API'; END IF;
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
    COUNT(DISTINCT b.test_id)::INT,
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
  FROM public.exam_staff_all_results b
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
      JOIN public.exam_staff_all_results b ON b.student_id = s.id
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
      JOIN public.exam_staff_all_results b ON b.student_id = s.id AND b.course_id = v_student.target_course_id
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
      JOIN public.exam_staff_all_results b ON b.student_id = s.id
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
  FROM public.exam_staff_latest_results b
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
      FROM public.exam_staff_latest_results b
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_rank_neighborhood(p_scope text DEFAULT 'ACADEMY'::text, p_scope_id uuid DEFAULT NULL::uuid, p_range integer DEFAULT 2)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_id UUID;
  v_student_rank INT;
  v_neighborhood JSONB := '[]'::jsonb;
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Active staff authorization required'; END IF;
 IF public.is_student() THEN RAISE EXCEPTION 'Use the authenticated student portal ranking API'; END IF;
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
      FROM public.exam_staff_latest_results b
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
      JOIN public.exam_staff_all_results b
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
      JOIN public.exam_staff_all_results b ON b.student_id = s.id
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
      JOIN public.exam_staff_all_results b ON b.student_id = s.id
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_safe_exam_questions(p_question_ids uuid[])
 RETURNS TABLE(id uuid, code text, subject_id uuid, difficulty question_difficulty, stem text, stem_image_url text, time_limit_seconds integer, options jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
 IF NOT(is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Use own saved attempt payload'; END IF;
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
$function$
;
REVOKE ALL ON FUNCTION get_safe_exam_questions(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION get_safe_exam_questions(uuid[]) TO authenticated;
COMMIT;
