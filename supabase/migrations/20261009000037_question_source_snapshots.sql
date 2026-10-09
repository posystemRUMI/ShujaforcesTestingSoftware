BEGIN;
-- Capture source labels when a new immutable payload is built; do not rewrite old snapshots.
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
          SELECT q.id, q.code, q.stem, q.stem_image_url, q.subject_id, q.source_label
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
            'source_label', v_q.source_label,
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
CREATE OR REPLACE FUNCTION public.exam_staff_result_detail_internal(p_result_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
 IF public.is_student() AND NOT EXISTS(SELECT 1 FROM public.portal_valid_results r JOIN public.students s ON s.id=r.student_id
 WHERE r.id=p_result_id AND s.profile_id=auth.uid()) THEN RAISE EXCEPTION 'No valid finalized result owned by this student'; END IF;
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
        q.id, q.code, q.stem, q.stem_image_url, q.explanation, q.subject_id, q.source_label,
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
          'source_label', v_q.source_label,
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_result_detail(p_result_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r test_results%ROWTYPE; t tests%ROWTYPE; snapshot exam_attempt_snapshots%ROWTYPE; sid uuid;
 section jsonb; item jsonb; options jsonb; questions jsonb; sections jsonb:='[]'; answer attempt_answers%ROWTYPE; key text;
BEGIN
 IF is_admin() OR is_teacher() THEN RETURN exam_staff_result_detail_internal(p_result_id); END IF;
 sid:=portal_student_id();
 SELECT result.* INTO r FROM test_results result JOIN portal_valid_results valid ON valid.id=result.id
 WHERE result.id=p_result_id AND result.student_id=sid;
 IF r.id IS NULL THEN RAISE EXCEPTION 'No valid finalized result owned by this student'; END IF;
 SELECT * INTO t FROM tests WHERE id=r.test_id;
 SELECT * INTO snapshot FROM exam_attempt_snapshots WHERE attempt_id=r.attempt_id;
 IF snapshot.attempt_id IS NOT NULL THEN
  FOR section IN SELECT value FROM jsonb_array_elements(snapshot.payload->'sections') LOOP
   questions:='[]';
   FOR item IN SELECT value FROM jsonb_array_elements(section->'questions') LOOP
    SELECT * INTO answer FROM attempt_answers WHERE attempt_id=r.attempt_id AND question_id=(item->>'id')::uuid;
    key:=snapshot.answer_keys->>(item->>'id');
    SELECT coalesce(jsonb_agg(opt || jsonb_build_object('is_correct',opt->>'id'=key) ORDER BY ord),'[]') INTO options
    FROM jsonb_array_elements(item->'options') WITH ORDINALITY entries(opt,ord);
    questions:=questions || jsonb_build_array(jsonb_build_object(
     'question_id',item->>'id','code',item->>'code','stem',item->>'stem','source_label',item->>'source_label','stem_image_url',item->>'stem_image_url',
     'subject_id',snapshot.review_metadata#>>ARRAY[item->>'id','subject_id'],
     'explanation',snapshot.review_metadata#>>ARRAY[item->>'id','explanation'],
     'marks',item->'marks','selected_option_id',answer.selected_option_id,'marked_for_review',coalesce(answer.marked_for_review,false),
     'options',options,'status',CASE WHEN answer.selected_option_id IS NULL THEN 'skipped'
       WHEN answer.selected_option_id::text=key THEN 'correct' ELSE 'incorrect' END));
   END LOOP;
   sections:=sections || jsonb_build_array(jsonb_build_object('section_id',section->>'id','section_name',section->>'name','questions',questions));
  END LOOP;
 END IF;
 RETURN jsonb_build_object('result',to_jsonb(r),'test',jsonb_build_object('id',t.id,
  'name',coalesce(snapshot.payload#>>'{test,name}',t.name),
  'passing_threshold',coalesce((snapshot.payload#>>'{test,passing_threshold}')::numeric,t.passing_threshold)),
  'student',jsonb_build_object('id',sid,'roll_number',(SELECT roll_number FROM students WHERE id=sid)),
  'sections',sections,'answer_review_enabled',snapshot.attempt_id IS NOT NULL);
END $function$
;
NOTIFY pgrst,'reload schema';
COMMIT;
