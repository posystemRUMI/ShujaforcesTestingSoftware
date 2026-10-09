-- Authenticated student portal. No batch-derived assignments or fabricated records.
BEGIN;
ALTER TABLE public.test_assignments ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id);
ALTER TABLE public.test_assignments ALTER COLUMN batch_id DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS portal_student_assignment ON public.test_assignments(test_id,student_id) WHERE student_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.portal_student_id() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid;
BEGIN
 SELECT s.id INTO sid FROM students s JOIN profiles p ON p.id=s.profile_id
 WHERE s.profile_id=auth.uid() AND p.role='STUDENT' AND s.status='ACTIVE';
 IF sid IS NULL THEN RAISE EXCEPTION 'Active authenticated student required'; END IF;
 RETURN sid;
END $$;

CREATE OR REPLACE FUNCTION public.portal_eligible(sid uuid, tid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM students s JOIN test_eligible_courses e
 ON e.course_id=s.target_course_id AND e.force_id=s.target_force_id
 JOIN courses c ON c.id=e.course_id AND c.force_id=e.force_id
 WHERE s.id=sid AND e.test_id=tid AND s.status='ACTIVE');
$$;

CREATE VIEW public.portal_valid_results WITH (security_invoker=true) AS
 SELECT r.*,a.submitted_at AS completed_at,t.name AS test_name,a.attempt_number
 FROM test_results r JOIN test_attempts a ON a.id=r.attempt_id AND a.student_id=r.student_id AND a.test_id=r.test_id
 JOIN tests t ON t.id=r.test_id
 WHERE a.status IN ('SUBMITTED','AUTO_SUBMITTED','FORCE_SUBMITTED') AND a.submitted_at IS NOT NULL AND r.max_marks>0;

CREATE TABLE public.student_performance (
 student_id uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
 completed_tests integer NOT NULL, finalized_attempts integer NOT NULL,
 total_marks_obtained numeric NOT NULL,total_possible_marks numeric NOT NULL,
 average_percentage numeric,aggregate_percentage numeric,updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE student_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY performance_read ON student_performance FOR SELECT TO authenticated USING
 (public.is_admin() OR public.is_teacher() OR student_id IN (SELECT id FROM students WHERE profile_id=auth.uid()));

CREATE OR REPLACE FUNCTION public.portal_recalculate(sid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 -- Serialize corrections/finalizations for the same student.
 PERFORM 1 FROM students WHERE id=sid FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 INSERT INTO student_performance(student_id,completed_tests,finalized_attempts,total_marks_obtained,total_possible_marks,average_percentage,aggregate_percentage)
 SELECT sid,count(DISTINCT test_id),count(*),coalesce(sum(marks_obtained),0),coalesce(sum(max_marks),0),
 avg(percentage),sum(marks_obtained)/nullif(sum(max_marks),0)*100 FROM portal_valid_results WHERE student_id=sid
 ON CONFLICT(student_id) DO UPDATE SET completed_tests=excluded.completed_tests,finalized_attempts=excluded.finalized_attempts,
 total_marks_obtained=excluded.total_marks_obtained,total_possible_marks=excluded.total_possible_marks,
 average_percentage=excluded.average_percentage,aggregate_percentage=excluded.aggregate_percentage,updated_at=now();
END $$;
CREATE OR REPLACE FUNCTION public.portal_stats_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP<>'INSERT' THEN PERFORM portal_recalculate(OLD.student_id); END IF;
 IF TG_OP<>'DELETE' THEN PERFORM portal_recalculate(NEW.student_id); END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER portal_result_stats AFTER INSERT OR UPDATE OR DELETE ON test_results FOR EACH ROW EXECUTE FUNCTION portal_stats_changed();
CREATE TRIGGER portal_attempt_stats AFTER INSERT OR UPDATE OR DELETE ON test_attempts FOR EACH ROW EXECUTE FUNCTION portal_stats_changed();
CREATE OR REPLACE FUNCTION public.portal_new_student_stats() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM portal_recalculate(NEW.id); RETURN NULL; END $$;
CREATE TRIGGER portal_student_stats AFTER INSERT ON students FOR EACH ROW EXECUTE FUNCTION portal_new_student_stats();
SELECT portal_recalculate(id) FROM students;

CREATE OR REPLACE FUNCTION public.portal_pending(sid uuid) RETURNS SETOF public.tests LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT t.* FROM tests t WHERE t.status IN ('ACTIVE','PUBLISHED') AND portal_eligible(sid,t.id)
 AND EXISTS(SELECT 1 FROM test_assignments ta WHERE ta.test_id=t.id AND ta.student_id=sid AND ta.status='ACTIVE'
 AND ta.available_from<=now() AND (ta.available_until IS NULL OR ta.available_until>now()))
 AND (NOT EXISTS(SELECT 1 FROM portal_valid_results r WHERE r.student_id=sid AND r.test_id=t.id)
 OR EXISTS(SELECT 1 FROM retake_permissions rp WHERE rp.student_id=sid AND rp.test_id=t.id AND rp.status='AVAILABLE'
 AND (rp.expires_at IS NULL OR rp.expires_at>now()))
 OR EXISTS(SELECT 1 FROM test_attempts a JOIN retake_permissions rp ON rp.consumed_attempt_id=a.id
 WHERE a.student_id=sid AND a.test_id=t.id AND a.status='IN_PROGRESS' AND a.expires_at>now() AND rp.status='USED'))
 ORDER BY t.name,t.id;
$$;

CREATE OR REPLACE FUNCTION public.student_portal_snapshot() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=portal_student_id(); profile jsonb; stats jsonb; fees jsonb; history jsonb; pending jsonb; course_position bigint; academy_position bigint;
BEGIN
 SELECT jsonb_build_object('name',p.display_name,'email',p.email,'phone',p.phone,'role',p.role,'roll_number',s.roll_number,
 'father_name',s.father_name,'cnic',s.cnic,'force_name',f.name,'course_name',c.name)
 INTO profile FROM students s JOIN profiles p ON p.id=s.profile_id LEFT JOIN forces f ON f.id=s.target_force_id
 LEFT JOIN courses c ON c.id=s.target_course_id WHERE s.id=sid;
 SELECT to_jsonb(sp)-'student_id' INTO stats FROM student_performance sp WHERE student_id=sid;
 WITH ranked AS(SELECT sp.student_id,dense_rank() OVER(ORDER BY sp.aggregate_percentage DESC) AS position
 FROM student_performance sp JOIN students s ON s.id=sp.student_id WHERE sp.finalized_attempts>0 AND s.status='ACTIVE')
 SELECT position INTO academy_position FROM ranked WHERE student_id=sid;
 WITH ranked AS(SELECT sp.student_id,dense_rank() OVER(ORDER BY sp.aggregate_percentage DESC) AS position
 FROM student_performance sp JOIN students s ON s.id=sp.student_id JOIN students me ON me.id=sid
 WHERE sp.finalized_attempts>0 AND s.status='ACTIVE' AND s.target_course_id=me.target_course_id AND s.target_force_id=me.target_force_id)
 SELECT position INTO course_position FROM ranked WHERE student_id=sid;
 SELECT jsonb_build_object('total_fee',(SELECT sum(amount_due-discount_amount+fine_amount) FROM student_fee_accounts WHERE student_id=sid),
 'paid_fee',coalesce((SELECT sum(amount) FROM student_fee_payments WHERE student_id=sid AND status='ACTIVE'),0),
 'remaining_fee',(SELECT greatest(0,sum(amount_due-discount_amount+fine_amount)-coalesce((SELECT sum(amount) FROM student_fee_payments WHERE student_id=sid AND status='ACTIVE'),0)) FROM student_fee_accounts WHERE student_id=sid)) INTO fees;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'attempt_id',attempt_id,'test_id',test_id,'test_name',test_name,
 'marks_obtained',marks_obtained,'max_marks',max_marks,'percentage',percentage,'completed_at',completed_at)
 ORDER BY completed_at DESC,attempt_number DESC,attempt_id DESC),'[]') INTO history FROM portal_valid_results WHERE student_id=sid;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'duration_minutes',t.duration_minutes,
 'question_count',(SELECT sum(question_count) FROM test_sections WHERE test_id=t.id),'passing_threshold',t.passing_threshold,
 'is_retake',EXISTS(SELECT 1 FROM portal_valid_results r WHERE r.student_id=sid AND r.test_id=t.id))),'[]') INTO pending FROM portal_pending(sid) t;
 RETURN jsonb_build_object('profile',profile,'statistics',stats,'fees',fees,'results',history,'assigned_tests',pending,
 'course_position',course_position,'academy_position',academy_position,'timezone','Asia/Karachi');
END $$;

CREATE OR REPLACE FUNCTION public.student_portal_leaderboard(p_test_id uuid DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=portal_student_id(); response jsonb;
BEGIN
 IF p_test_id IS NOT NULL AND NOT portal_eligible(sid,p_test_id) THEN RAISE EXCEPTION 'Test is outside your registered course'; END IF;
 WITH latest AS(SELECT DISTINCT ON(student_id) student_id,percentage FROM portal_valid_results WHERE test_id=p_test_id ORDER BY student_id,completed_at DESC,attempt_number DESC,attempt_id DESC),
 scores AS(SELECT s.id,s.roll_number,p.display_name AS student_name,
 CASE WHEN p_test_id IS NULL THEN sp.aggregate_percentage ELSE l.percentage END AS percentage
 FROM students s JOIN students me ON me.id=sid JOIN profiles p ON p.id=s.profile_id
 LEFT JOIN student_performance sp ON sp.student_id=s.id LEFT JOIN latest l ON l.student_id=s.id
 WHERE s.status='ACTIVE' AND s.target_course_id=me.target_course_id AND s.target_force_id=me.target_force_id),
 ranked AS(SELECT *,CASE WHEN percentage IS NOT NULL THEN dense_rank() OVER(ORDER BY percentage DESC NULLS LAST) END AS position FROM scores),
 page AS(SELECT * FROM ranked ORDER BY percentage DESC NULLS LAST,roll_number,id LIMIT least(greatest(p_limit,1),500) OFFSET greatest(p_offset,0))
 SELECT jsonb_build_object('total',(SELECT count(*) FROM ranked),'current_position',(SELECT position FROM ranked WHERE id=sid),
 'rows',coalesce((SELECT jsonb_agg(jsonb_build_object('position',position,'student_name',student_name,'roll_number',roll_number,
 'percentage',percentage,'is_current_user',id=sid) ORDER BY percentage DESC NULLS LAST,roll_number,id) FROM page),'[]')) INTO response;
 RETURN response;
END $$;
CREATE OR REPLACE FUNCTION public.student_portal_tests() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=portal_student_id(); output jsonb;
BEGIN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name) ORDER BY name,id),'[]') INTO output
 FROM tests WHERE portal_eligible(sid,id); RETURN output;
END $$;

-- Existing attempt/question construction remains intact; guard every entry point.
CREATE OR REPLACE FUNCTION public.start_test_attempt(p_test_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_test RECORD;
  v_assignment RECORD;
  v_attempt_count INT;
  v_attempt_id UUID;
  v_first_section_id UUID;
  v_first_section_duration INT;
  v_first_section_name TEXT;
  v_expires_at TIMESTAMPTZ;
  v_question_order JSONB;
  v_option_order JSONB;
  v_section RECORD;
  v_qids UUID[];
  v_attempt_number INT;
  v_bad_section RECORD;
BEGIN
  -- 1. Authentication check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Load Student
  SELECT s.* INTO v_student
  FROM public.students s
  WHERE s.profile_id = auth.uid() OR s.id = auth.uid();

  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Only registered cadets can start a test attempt.';
  END IF;

  -- 3. Load Test
  SELECT * INTO v_test FROM public.tests WHERE id = p_test_id;
  IF v_test IS NULL THEN
    RAISE EXCEPTION 'Examination docket not found.';
  END IF;

  IF v_test.status NOT IN ('PUBLISHED', 'ACTIVE') THEN
    RAISE EXCEPTION 'Examination is not currently active for testing.';
  END IF;

  -- 4. STRICT ZERO-TOLERANCE VALIDATION:
  -- Verify every section has EXACTLY question_count questions assigned in test_section_questions
  FOR v_bad_section IN
    SELECT 
      ts.name AS sec_name,
      ts.question_count AS configured,
      COUNT(tsq.question_id) AS assigned
    FROM public.test_sections ts
    LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
    WHERE ts.test_id = p_test_id
    GROUP BY ts.id, ts.name, ts.question_count
    HAVING COUNT(tsq.question_id) <> ts.question_count
  LOOP
    RAISE EXCEPTION 'Test configuration is invalid: section "%" requires % questions but only % are assigned. The examination administrator must re-save or assign the required questions before testing can begin.',
      v_bad_section.sec_name, v_bad_section.configured, v_bad_section.assigned;
  END LOOP;

  -- 5. Find optional assignment
  SELECT ta.* INTO v_assignment
  FROM public.test_assignments ta
  WHERE ta.test_id = p_test_id
  ORDER BY ta.created_at DESC
  LIMIT 1;

  -- 6. Check for active IN_PROGRESS attempt (Resume)
  IF EXISTS (
    SELECT 1 FROM public.test_attempts
    WHERE student_id = v_student.id
      AND test_id = p_test_id
      AND status = 'IN_PROGRESS'
      AND expires_at > timezone('utc', now())
  ) THEN
    SELECT id INTO v_attempt_id
    FROM public.test_attempts
    WHERE student_id = v_student.id
      AND test_id = p_test_id
      AND status = 'IN_PROGRESS'
      AND expires_at > timezone('utc', now())
    LIMIT 1;

    RETURN jsonb_build_object(
      'attempt_id', v_attempt_id,
      'resumed', true,
      'message', 'Existing active attempt found. Resuming.'
    );
  END IF;

  -- 7. Count existing attempts
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.test_attempts
  WHERE student_id = v_student.id AND test_id = p_test_id;

  v_attempt_number := v_attempt_count + 1;
  -- Duration comes directly from configured test duration (no 65m fallback)
  v_expires_at := timezone('utc', now()) + (COALESCE(v_test.duration_minutes, 30) * interval '1 minute');
  v_question_order := '[]'::jsonb;
  v_option_order := '{}'::jsonb;

  -- 8. Build question and option order honoring saved test_section_questions
  FOR v_section IN
    SELECT * FROM public.test_sections
    WHERE test_id = p_test_id
    ORDER BY position ASC
  LOOP
    SELECT ARRAY(
      SELECT tsq.question_id
      FROM public.test_section_questions tsq
      JOIN public.questions q ON q.id = tsq.question_id
      WHERE tsq.test_section_id = v_section.id
        AND q.status = 'APPROVED'
      ORDER BY 
        CASE WHEN COALESCE(v_test.shuffle_questions, false) THEN gen_random_uuid() ELSE NULL END,
        tsq.position ASC
    ) INTO v_qids;

    -- Strict check on approved count matching section
    IF cardinality(v_qids) <> v_section.question_count THEN
      RAISE EXCEPTION 'Section "%" has % valid approved questions but requires %.',
        v_section.name, COALESCE(cardinality(v_qids), 0), v_section.question_count;
    END IF;

    v_question_order := v_question_order || jsonb_build_object(
      'section_id', v_section.id,
      'question_ids', to_jsonb(v_qids)
    );

    IF COALESCE(v_test.shuffle_options, true) THEN
      FOR i IN 1..cardinality(v_qids) LOOP
        DECLARE
          v_opt_ids UUID[];
        BEGIN
          SELECT ARRAY(
            SELECT qo.id
            FROM public.question_options qo
            WHERE qo.question_id = v_qids[i]
            ORDER BY gen_random_uuid()
          ) INTO v_opt_ids;

          v_option_order := v_option_order || jsonb_build_object(
            v_qids[i]::text, to_jsonb(v_opt_ids)
          );
        END;
      END LOOP;
    END IF;
  END LOOP;

  -- 9. Resolve first section
  SELECT id, duration_minutes, name
  INTO v_first_section_id, v_first_section_duration, v_first_section_name
  FROM public.test_sections
  WHERE test_id = p_test_id
  ORDER BY position ASC
  LIMIT 1;

  IF v_first_section_id IS NULL THEN
    RAISE EXCEPTION 'Examination has no sections configured.';
  END IF;

  -- 10. Insert attempt record
  INSERT INTO public.test_attempts (
    test_id, student_id, assignment_id, current_section_id,
    status, question_order, option_order, started_at, expires_at, attempt_number
  ) VALUES (
    p_test_id, v_student.id, v_assignment.id, v_first_section_id,
    'IN_PROGRESS', v_question_order, v_option_order,
    timezone('utc', now()), v_expires_at, v_attempt_number
  ) RETURNING id INTO v_attempt_id;

  -- 11. Initialize section progress with exact configured section duration (no 20m default)
  INSERT INTO public.attempt_section_progress (
    attempt_id, section_id, started_at, expires_at
  ) VALUES (
    v_attempt_id, v_first_section_id, timezone('utc', now()),
    timezone('utc', now()) + (COALESCE(v_first_section_duration, 30) * interval '1 minute')
  );

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_number,
    'first_section_id', v_first_section_id,
    'first_section_name', v_first_section_name,
    'first_section_duration', COALESCE(v_first_section_duration, 30),
    'started_at', timezone('utc', now()),
    'resumed', false
  );
END;
$$;


ALTER FUNCTION public.start_test_attempt(uuid) RENAME TO portal_start_attempt_internal;
CREATE OR REPLACE FUNCTION public.start_test_attempt(p_test_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=portal_student_id(); aid uuid; rid uuid; payload jsonb;
BEGIN
 PERFORM 1 FROM students WHERE id=sid FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM portal_pending(sid) WHERE id=p_test_id) THEN RAISE EXCEPTION 'No eligible pending assignment'; END IF;
 SELECT id INTO aid FROM test_assignments WHERE student_id=sid AND test_id=p_test_id AND status='ACTIVE'
 AND available_from<=now() AND (available_until IS NULL OR available_until>now()) ORDER BY created_at DESC LIMIT 1;
 IF EXISTS(SELECT 1 FROM portal_valid_results WHERE student_id=sid AND test_id=p_test_id)
 AND NOT EXISTS(SELECT 1 FROM test_attempts WHERE student_id=sid AND test_id=p_test_id AND status='IN_PROGRESS' AND expires_at>now()) THEN
 SELECT id INTO rid FROM retake_permissions WHERE student_id=sid AND test_id=p_test_id AND status='AVAILABLE'
 AND (expires_at IS NULL OR expires_at>now()) ORDER BY created_at LIMIT 1 FOR UPDATE;
 IF rid IS NULL THEN RAISE EXCEPTION 'Approved retake required'; END IF;
 END IF;
 payload:=portal_start_attempt_internal(p_test_id);
 UPDATE test_attempts SET assignment_id=aid WHERE id=(payload->>'attempt_id')::uuid AND student_id=sid;
 IF rid IS NOT NULL THEN UPDATE retake_permissions SET status='USED',consumed_attempt_id=(payload->>'attempt_id')::uuid WHERE id=rid; END IF;
 RETURN payload;
END $$;
CREATE OR REPLACE FUNCTION public.get_familiarization_payload(p_test_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    -- Check course eligibility
    IF NOT EXISTS (
      SELECT 1 FROM public.test_eligible_courses tc
      WHERE tc.test_id = p_test_id AND tc.course_id = v_student.target_course_id
    ) THEN
      RAISE EXCEPTION 'Test is not available for your registered course.';
    END IF;

    -- Student must have valid active effective assignment
    SELECT ta.* INTO v_assignment
    FROM public.test_assignments ta
    
    WHERE ta.test_id = p_test_id
      AND ta.student_id = v_student.id
      
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
$function$
;
ALTER FUNCTION public.get_familiarization_payload(uuid) RENAME TO portal_familiarization_internal;
CREATE OR REPLACE FUNCTION public.get_familiarization_payload(p_test_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=portal_student_id();
BEGIN
 IF NOT EXISTS(SELECT 1 FROM portal_pending(sid) WHERE id=p_test_id) THEN RAISE EXCEPTION 'No eligible pending assignment'; END IF;
 RETURN portal_familiarization_internal(p_test_id);
END $$;
REVOKE ALL ON FUNCTION public.portal_start_attempt_internal(uuid),public.portal_familiarization_internal(uuid) FROM PUBLIC,anon,authenticated;

-- RLS restrictions combine with existing permissive policies and cannot be bypassed by a new permissive policy.
CREATE POLICY portal_private_students ON students AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR profile_id=auth.uid());
CREATE POLICY portal_private_profiles ON profiles AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR id=auth.uid());
CREATE POLICY portal_private_results ON test_results AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR student_id IN(SELECT id FROM students WHERE profile_id=auth.uid()));
CREATE POLICY portal_private_attempts ON test_attempts AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR student_id IN(SELECT id FROM students WHERE profile_id=auth.uid()));
CREATE POLICY portal_private_fees ON student_fee_accounts AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR student_id IN(SELECT id FROM students WHERE profile_id=auth.uid()));
CREATE POLICY portal_private_payments ON student_fee_payments AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR student_id IN(SELECT id FROM students WHERE profile_id=auth.uid()));
CREATE POLICY portal_private_assignments ON test_assignments AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT public.is_student() OR student_id IN(SELECT id FROM students WHERE profile_id=auth.uid()));
CREATE POLICY portal_own_assignments ON test_assignments FOR SELECT TO authenticated USING
 (student_id IN(SELECT id FROM students WHERE profile_id=auth.uid()));

CREATE OR REPLACE FUNCTION public.portal_assign_student(p_student_id uuid,p_test_id uuid,p_available_until timestamptz DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE aid uuid;
BEGIN
 IF NOT (is_admin() OR (is_teacher() AND can_manage_test(p_test_id))) THEN RAISE EXCEPTION 'Staff authorization required'; END IF;
 IF NOT portal_eligible(p_student_id,p_test_id) THEN RAISE EXCEPTION 'Force/course mismatch'; END IF;
 INSERT INTO test_assignments(test_id,student_id,assigned_by,available_until) VALUES(p_test_id,p_student_id,auth.uid(),p_available_until)
 ON CONFLICT(test_id,student_id) WHERE student_id IS NOT NULL DO UPDATE SET status='ACTIVE',available_until=excluded.available_until RETURNING id INTO aid;
 RETURN aid;
END $$;

-- Idempotent, atomic registration fee + initial payment. No browser ledger or duplicate payments.
CREATE UNIQUE INDEX portal_registration_fee ON student_fee_accounts(student_id) WHERE fee_type='ADMISSION & TUITION FEE';
CREATE OR REPLACE FUNCTION public.portal_registration_fee(p_student_id uuid,p_total numeric,p_paid numeric,p_method text DEFAULT 'CASH') RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE aid uuid; existing_total numeric; existing_paid numeric;
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Staff authorization required'; END IF;
 IF p_total IS NULL OR p_paid IS NULL OR p_total<0 OR p_paid<0 OR p_paid>p_total THEN RAISE EXCEPTION 'Invalid registration fee'; END IF;
 PERFORM 1 FROM students WHERE id=p_student_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Student not found'; END IF;
 SELECT id,amount_due INTO aid,existing_total FROM student_fee_accounts WHERE student_id=p_student_id AND fee_type='ADMISSION & TUITION FEE';
 IF aid IS NOT NULL THEN
 SELECT coalesce(sum(amount),0) INTO existing_paid FROM student_fee_payments WHERE fee_account_id=aid AND notes='Initial course fee payment recorded during student registration' AND status='ACTIVE';
 IF existing_total<>p_total OR existing_paid<>p_paid THEN RAISE EXCEPTION 'Registration fee already saved with different values'; END IF;
 RETURN;
 END IF;
 INSERT INTO student_fee_accounts(student_id,course_id,fee_type,fee_year,amount_due,amount_paid,status,created_by)
 SELECT id,target_course_id,'ADMISSION & TUITION FEE',extract(year FROM now()),p_total,p_paid,
 CASE WHEN p_paid=p_total THEN 'PAID' WHEN p_paid>0 THEN 'PARTIAL' ELSE 'UNPAID' END,auth.uid() FROM students WHERE id=p_student_id RETURNING id INTO aid;
 IF p_paid>0 THEN INSERT INTO student_fee_payments(student_id,fee_account_id,amount,payment_method,received_by,receipt_number,notes)
 VALUES(p_student_id,aid,p_paid,p_method,auth.uid(),generate_receipt_number(),'Initial course fee payment recorded during student registration'); END IF;
END $$;

REVOKE ALL ON FUNCTION public.portal_student_id(),public.portal_eligible(uuid,uuid),public.portal_recalculate(uuid),public.portal_stats_changed(),
 public.portal_new_student_stats(),public.portal_pending(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.student_portal_snapshot(),public.student_portal_leaderboard(uuid,integer,integer),public.student_portal_tests(),
 public.start_test_attempt(uuid),public.get_familiarization_payload(uuid),public.portal_assign_student(uuid,uuid,timestamptz),public.portal_registration_fee(uuid,numeric,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.student_portal_snapshot(),public.student_portal_leaderboard(uuid,integer,integer),public.student_portal_tests(),
 public.start_test_attempt(uuid),public.get_familiarization_payload(uuid),public.portal_assign_student(uuid,uuid,timestamptz),public.portal_registration_fee(uuid,numeric,numeric,text) TO authenticated;
-- Legacy staff ranking RPCs must not leak other courses or private identifiers to students.
DO $guard$
DECLARE fn record; definition text;
BEGIN
 FOR fn IN SELECT oid FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN
 ('get_academy_leaderboard','get_course_leaderboard','get_test_leaderboard','get_rank_neighborhood','get_student_rank_summary') LOOP
 definition:=pg_get_functiondef(fn.oid);
 definition:=regexp_replace(definition,'\mBEGIN\M',$body$BEGIN
 IF public.is_student() THEN RAISE EXCEPTION 'Use the authenticated student portal ranking API'; END IF;$body$);
 EXECUTE definition;
 END LOOP;
END $guard$;
CREATE OR REPLACE FUNCTION public.get_student_assigned_tests(p_student_id uuid)
RETURNS TABLE(id uuid,name text,duration_minutes integer,total_marks integer,passing_threshold integer,negative_marking boolean,shuffle_questions boolean,shuffle_options boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $assigned$
DECLARE sid uuid;
BEGIN
 IF public.is_student() THEN sid:=portal_student_id();
 ELSIF public.is_admin() OR public.is_teacher() THEN sid:=p_student_id;
 ELSE RAISE EXCEPTION 'Authentication required'; END IF;
 RETURN QUERY SELECT t.id,t.name,t.duration_minutes,t.total_marks,t.passing_threshold,t.negative_marking,t.shuffle_questions,t.shuffle_options FROM portal_pending(sid) t;
END $assigned$;
NOTIFY pgrst,'reload schema';
COMMIT;
