BEGIN;
CREATE OR REPLACE FUNCTION submit_test_attempt(p_attempt_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; snap exam_attempt_snapshots%ROWTYPE; r test_results%ROWTYPE; s jsonb; q jsonb; answer uuid; key text;
 total integer:=0; correct integer:=0; incorrect integer:=0; skipped integer:=0; marks numeric:=0; maxmarks numeric:=0; sections jsonb:='[]';
 sc integer; si integer; ss integer; sm numeric; sx numeric; result_id uuid; pct numeric; elapsed integer; submit_status attempt_status;
BEGIN
 SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF a.id IS NULL OR (NOT(is_admin() OR is_teacher()) AND (a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id))) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 SELECT * INTO r FROM test_results WHERE attempt_id=a.id;
 IF r.id IS NOT NULL THEN RETURN jsonb_build_object('result_id',r.id,'already_submitted',true,'marks_obtained',r.marks_obtained,'max_marks',r.max_marks,'percentage',r.percentage,'passed',r.passed,'correct_count',r.correct_count,'incorrect_count',r.incorrect_count,'skipped_count',r.skipped_count); END IF;
 IF a.status<>'IN_PROGRESS' THEN RAISE EXCEPTION 'Attempt cannot be submitted'; END IF;
 SELECT * INTO snap FROM exam_attempt_snapshots WHERE attempt_id=a.id;
 IF snap.attempt_id IS NULL THEN RAISE EXCEPTION 'Immutable saved examination is missing'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(snap.payload->'sections') LOOP
 sc:=0;si:=0;ss:=0;sm:=0;sx:=0;
 FOR q IN SELECT value FROM jsonb_array_elements(s->'questions') LOOP
 INSERT INTO attempt_answers(attempt_id,question_id,selected_option_id,marked_for_review) VALUES(a.id,(q->>'id')::uuid,NULL,false) ON CONFLICT DO NOTHING;
 SELECT selected_option_id INTO answer FROM attempt_answers WHERE attempt_id=a.id AND question_id=(q->>'id')::uuid;
 key:=snap.answer_keys->>(q->>'id');
 IF answer IS NULL THEN ss:=ss+1; ELSIF answer::text=key THEN sc:=sc+1; sm:=sm+(s->>'marks_per_question')::numeric; ELSE si:=si+1; END IF;
 sx:=sx+(s->>'marks_per_question')::numeric;
 END LOOP;
 IF (snap.payload#>>'{test,negative_marking}')::boolean THEN sm:=greatest(0,sm-si*(snap.payload#>>'{test,negative_mark_value}')::numeric); END IF;
 total:=total+sc+si+ss;correct:=correct+sc;incorrect:=incorrect+si;skipped:=skipped+ss;marks:=marks+sm;maxmarks:=maxmarks+sx;
 sections:=sections||jsonb_build_array(jsonb_build_object('section_id',s->>'id','section_name',s->>'name','total_questions',sc+si+ss,'correct',sc,'incorrect',si,'skipped',ss,'marks_obtained',sm,'max_marks',sx,'percentage',round(sm/sx*100,2)));
 END LOOP;
 pct:=round(marks/maxmarks*100,2);elapsed:=greatest(0,floor(extract(epoch FROM (least(clock_timestamp(),a.expires_at)-a.started_at)))::int);
 submit_status:=CASE WHEN (is_admin() OR is_teacher()) AND NOT EXISTS(SELECT 1 FROM students WHERE id=a.student_id AND profile_id=auth.uid()) THEN 'FORCE_SUBMITTED'::attempt_status WHEN clock_timestamp()>=a.expires_at THEN 'AUTO_SUBMITTED'::attempt_status ELSE 'SUBMITTED'::attempt_status END;
 UPDATE test_attempts SET status=submit_status,submitted_at=clock_timestamp() WHERE id=a.id;
 UPDATE attempt_section_progress SET completed_at=least(clock_timestamp(),expires_at) WHERE attempt_id=a.id AND completed_at IS NULL;
 INSERT INTO test_results(attempt_id,student_id,test_id,total_questions,correct_count,incorrect_count,skipped_count,marks_obtained,max_marks,percentage,passed,section_results,time_spent_seconds) VALUES(a.id,a.student_id,a.test_id,total,correct,incorrect,skipped,marks,maxmarks,pct,pct>=(snap.payload#>>'{test,passing_threshold}')::numeric,sections,elapsed) RETURNING id INTO result_id;
 PERFORM log_audit_event('ATTEMPT_SUBMITTED','TEST_ATTEMPT',a.id::text,jsonb_build_object('result_id',result_id,'status',submit_status,'questions',total));
 RETURN jsonb_build_object('result_id',result_id,'already_submitted',false,'marks_obtained',marks,'max_marks',maxmarks,'percentage',pct,'passed',pct>=(snap.payload#>>'{test,passing_threshold}')::numeric,'correct_count',correct,'incorrect_count',incorrect,'skipped_count',skipped,'section_results',sections,'time_spent_seconds',elapsed);
END $$;
CREATE OR REPLACE FUNCTION public.portal_safe_exam_payload_internal(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_attempt RECORD;
  v_test RECORD;
  v_current_section RECORD;
  v_asp RECORD;
  v_sections JSONB := '[]'::jsonb;
  v_qids UUID[];
  v_q RECORD;
  v_opts JSONB;
  v_section RECORD;
  v_caller_role TEXT;
  v_student_id UUID;
  v_rem_sec INT;
  v_sec_status TEXT;
BEGIN
 IF public.is_student() AND NOT EXISTS(SELECT 1 FROM public.test_attempts a JOIN public.students s ON s.id=a.student_id
 WHERE a.id=p_attempt_id AND s.profile_id=auth.uid() AND public.portal_eligible(s.id,a.test_id)) THEN
 RAISE EXCEPTION 'Attempt ownership or course eligibility denied'; END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Fetch attempt
  SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found';
  END IF;

  -- 2. Security Check: Staff or owning Student only
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role = 'STUDENT' THEN
    SELECT id INTO v_student_id FROM public.students WHERE profile_id = auth.uid();
    IF v_attempt.student_id <> v_student_id THEN
      RAISE EXCEPTION 'Unauthorized: You do not own this test attempt.';
    END IF;
  ELSIF v_caller_role NOT IN ('ADMIN', 'TEACHER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 3. Test Details
  SELECT * INTO v_test FROM public.tests WHERE id = v_attempt.test_id;

  -- 4. Current Section Details
  SELECT ts.name, ts.duration_minutes INTO v_current_section
  FROM public.test_sections ts
  WHERE ts.id = v_attempt.current_section_id;

  SELECT * INTO v_asp
  FROM public.attempt_section_progress
  WHERE attempt_id = p_attempt_id AND section_id = v_attempt.current_section_id;

  IF v_asp IS NOT NULL AND v_asp.expires_at IS NOT NULL THEN
    v_rem_sec := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_asp.expires_at - timezone('utc', now()))))::INT);
  ELSE
    v_rem_sec := v_current_section.duration_minutes * 60;
  END IF;

  IF v_asp IS NOT NULL AND v_asp.completed_at IS NOT NULL THEN
    v_sec_status := 'COMPLETED';
  ELSE
    v_sec_status := 'IN_PROGRESS';
  END IF;

  -- 5. Build full safe payload
  FOR v_section IN
    SELECT ts.id, ts.name, ts.duration_minutes
    FROM public.test_sections ts
    WHERE ts.test_id = v_test.id
    ORDER BY ts.position
  LOOP
    -- Extract question IDs for this section from the saved order
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(el->'question_ids')::UUID
      FROM jsonb_array_elements(v_attempt.question_order) el
      WHERE (el->>'section_id')::UUID = v_section.id
    ) INTO v_qids;

    DECLARE
      v_section_questions JSONB := '[]'::jsonb;
    BEGIN
      IF array_length(v_qids, 1) > 0 THEN
        FOR v_q IN
          SELECT q.id, q.code, q.stem, q.stem_image_url, q.subject_id
          FROM public.questions q
          JOIN unnest(v_qids) WITH ORDINALITY t(id, ord) USING (id)
          ORDER BY t.ord
        LOOP
          -- Get options honoring the saved option_order or fallback
          IF v_attempt.option_order ? v_q.id::text THEN
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', qo.id,
                'label', qo.label,
                'text', qo.text,
                'image_url', qo.image_url
              ) ORDER BY o.ord
            ) INTO v_opts
            FROM public.question_options qo
            JOIN jsonb_array_elements_text(v_attempt.option_order->(v_q.id::text)) WITH ORDINALITY o(opt_id, ord)
              ON qo.id::uuid = o.opt_id::uuid;
          ELSE
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', qo.id,
                'label', qo.label,
                'text', qo.text,
                'image_url', qo.image_url
              ) ORDER BY qo.label
            ) INTO v_opts
            FROM public.question_options qo
            WHERE qo.question_id = v_q.id;
          END IF;

          v_section_questions := v_section_questions || jsonb_build_object(
            'id', v_q.id,
            'code', v_q.code,
            'subject_id',v_q.subject_id,
            'stem', v_q.stem,
            'stem_image_url', v_q.stem_image_url,
            'options', COALESCE(v_opts, '[]'::jsonb)
          );
        END LOOP;
      END IF;

      v_sections := v_sections || jsonb_build_object(
        'id', v_section.id,
        'name', v_section.name,
        'duration_minutes', v_section.duration_minutes,
        'questions', v_section_questions
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'test_id', v_test.id,
    'test_name', v_test.name,
    'test_status', v_test.status,
    'attempt_status', v_attempt.status,
    'current_section_id', v_attempt.current_section_id,
    'current_section_name', COALESCE(v_current_section.name, 'General Section'),
    'current_section_status', v_sec_status,
    'time_remaining_seconds', v_rem_sec,
    'started_at', v_attempt.started_at,
    'sections', v_sections,
    'test', jsonb_build_object(
      'id', v_test.id,
      'name', v_test.name,
      'status', v_test.status,
      'duration_minutes', v_test.duration_minutes
    ),
    'attempt', jsonb_build_object(
      'id', v_attempt.id,
      'status', v_attempt.status,
      'expires_at', v_asp.expires_at,
      'started_at', v_attempt.started_at
    )
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.create_test_with_eligibilities(p_test jsonb, p_eligibilities jsonb)
 RETURNS tests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_role TEXT;
  v_test_id UUID;
  v_test_record RECORD;
  v_elig JSONB;
BEGIN
  -- Authorize caller
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role NOT IN ('ADMIN', 'TEACHER') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate eligibilities (at least one)
  IF p_eligibilities IS NULL OR jsonb_typeof(p_eligibilities) != 'array' OR jsonb_array_length(p_eligibilities) = 0 THEN
    RAISE EXCEPTION 'At least one eligible course is required.';
  END IF;

  -- Create test
  INSERT INTO public.tests (
    name, description, force_id, course_id, batch_id, 
    passing_threshold, duration_minutes, shuffle_questions, shuffle_options, 
    allow_section_navigation, show_result_immediately, show_answer_review, 
    negative_marking, negative_mark_value, status, total_marks, created_by
  ) VALUES (
    p_test->>'name',
    p_test->>'description',
    NULLIF(p_test->>'force_id', '')::UUID,
    NULLIF(p_test->>'course_id', '')::UUID,
    NULLIF(p_test->>'batch_id', '')::UUID,
    COALESCE((p_test->>'passing_threshold')::INTEGER, 50),
    (p_test->>'duration_minutes')::INTEGER,
    COALESCE((p_test->>'shuffle_questions')::BOOLEAN, true),
    COALESCE((p_test->>'shuffle_options')::BOOLEAN, true),
    COALESCE((p_test->>'allow_section_navigation')::BOOLEAN, false),
    COALESCE((p_test->>'show_result_immediately')::BOOLEAN, true),
    COALESCE((p_test->>'show_answer_review')::BOOLEAN, true),
    COALESCE((p_test->>'negative_marking')::BOOLEAN, false),
    COALESCE((p_test->>'negative_mark_value')::NUMERIC, 0),
    COALESCE((p_test->>'status')::public.test_status, 'DRAFT'::public.test_status),
    COALESCE((p_test->>'total_marks')::INTEGER, 100),
    auth.uid() -- Authoritative
  ) RETURNING * INTO v_test_record;
  
  v_test_id := v_test_record.id;
  
  -- Insert mapping and deduplicate with ON CONFLICT DO NOTHING
  FOR v_elig IN SELECT * FROM jsonb_array_elements(p_eligibilities)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = (v_elig->>'course_id')::UUID 
      AND force_id = (v_elig->>'force_id')::UUID
      AND status = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'Invalid force/course mapping or course not active: Force %, Course %', v_elig->>'force_id', v_elig->>'course_id';
    END IF;
    
    INSERT INTO public.test_eligible_courses (test_id, force_id, course_id)
    VALUES (v_test_id, (v_elig->>'force_id')::UUID, (v_elig->>'course_id')::UUID)
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN v_test_record;
END;
$function$
;
COMMIT;
