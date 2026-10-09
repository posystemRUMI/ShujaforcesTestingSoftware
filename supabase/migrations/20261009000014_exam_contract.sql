BEGIN;
-- Persist the subject contract rather than infer banks from question text.
CREATE TABLE test_section_subjects(test_section_id uuid NOT NULL REFERENCES test_sections(id) ON DELETE CASCADE,subject_id uuid NOT NULL REFERENCES subjects(id),PRIMARY KEY(test_section_id,subject_id));
ALTER TABLE test_section_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY section_subjects_staff ON test_section_subjects FOR ALL TO authenticated USING(is_admin() OR is_teacher()) WITH CHECK(is_admin() OR is_teacher());
ALTER TABLE test_sections ADD COLUMN section_code text,ADD COLUMN source_template_section_id uuid,ADD COLUMN passing_percentage integer NOT NULL DEFAULT 55,ADD COLUMN is_mandatory boolean NOT NULL DEFAULT false;
INSERT INTO test_section_subjects SELECT s.id,sub.id FROM test_sections s CROSS JOIN subjects sub WHERE
 (s.name ILIKE '%Non%Verbal%' AND sub.code='INTELLIGENCE_NON_VERBAL') OR
 (s.name ILIKE '%Verbal%' AND s.name NOT ILIKE '%Non%Verbal%' AND sub.code='INTELLIGENCE_VERBAL') OR
 (s.name ILIKE '%Academic%' AND sub.code IN('ACADEMIC_PHYSICS','ACADEMIC_ENGLISH','ACADEMIC_MATH','GENERAL_KNOWLEDGE'));
UPDATE test_sections s SET subject_id=(SELECT min(subject_id::text)::uuid FROM test_section_subjects WHERE test_section_id=s.id) WHERE subject_id IS NULL;

CREATE FUNCTION exam_validate_test(tid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t tests%ROWTYPE; s record;
BEGIN
 SELECT * INTO t FROM tests WHERE id=tid;
 IF NOT FOUND OR t.duration_minutes IS NULL OR t.duration_minutes<=0 THEN RAISE EXCEPTION 'Test requires an explicit positive duration'; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_eligible_courses WHERE test_id=tid) THEN RAISE EXCEPTION 'Select eligible Force/course'; END IF;
 IF EXISTS(SELECT 1 FROM test_eligible_courses e LEFT JOIN courses c ON c.id=e.course_id AND c.force_id=e.force_id AND c.status='ACTIVE' WHERE e.test_id=tid AND c.id IS NULL) THEN RAISE EXCEPTION 'Invalid Force/course eligibility'; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_sections WHERE test_id=tid) THEN RAISE EXCEPTION 'Select sections'; END IF;
 IF t.duration_minutes<>(SELECT sum(duration_minutes) FROM test_sections WHERE test_id=tid) THEN RAISE EXCEPTION 'Test duration must equal configured section duration total'; END IF;
 FOR s IN SELECT * FROM test_sections WHERE test_id=tid LOOP
 IF s.question_count<=0 OR s.duration_minutes<=0 OR s.question_count<>(SELECT count(*) FROM test_section_questions WHERE test_section_id=s.id) THEN RAISE EXCEPTION 'Section % must contain exactly % questions',s.name,s.question_count; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_section_subjects WHERE test_section_id=s.id) THEN RAISE EXCEPTION 'Section % requires designated subjects',s.name; END IF;
 IF EXISTS(SELECT 1 FROM test_section_questions x JOIN questions q ON q.id=x.question_id WHERE x.test_section_id=s.id AND
 (q.status<>'APPROVED' OR NOT EXISTS(SELECT 1 FROM test_section_subjects m WHERE m.test_section_id=s.id AND m.subject_id=q.subject_id)
 OR (s.name ILIKE '%Non%Verbal%' AND q.subject_id<>(SELECT id FROM subjects WHERE code='INTELLIGENCE_NON_VERBAL'))
 OR (s.name ILIKE '%Verbal%' AND s.name NOT ILIKE '%Non%Verbal%' AND q.subject_id<>(SELECT id FROM subjects WHERE code='INTELLIGENCE_VERBAL'))
 OR (s.name ILIKE '%Academic%' AND q.subject_id IN(SELECT id FROM subjects WHERE code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL')))
 OR EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=tid AND NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=e.course_id))
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id)<>4
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id AND is_correct)<>1)) THEN RAISE EXCEPTION 'Section % contains unapproved, invalid or wrong-bank questions',s.name; END IF;
 END LOOP;
 IF EXISTS(SELECT question_id FROM test_section_questions x JOIN test_sections s ON s.id=x.test_section_id WHERE s.test_id=tid GROUP BY question_id HAVING count(*)>1) THEN RAISE EXCEPTION 'A question cannot appear in multiple sections'; END IF;
END $$;
-- Preserve invalid authored tests and exact selections for staff correction.
CREATE TABLE exam_configuration_issues(test_id uuid PRIMARY KEY REFERENCES tests(id),reason text NOT NULL,detected_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE exam_configuration_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY configuration_issues_staff ON exam_configuration_issues FOR ALL TO authenticated USING(is_admin() OR is_teacher()) WITH CHECK(is_admin() OR is_teacher());
DO $$ DECLARE t record; BEGIN FOR t IN SELECT id FROM tests WHERE status IN('PUBLISHED','ACTIVE') LOOP
 BEGIN PERFORM exam_validate_test(t.id); EXCEPTION WHEN OTHERS THEN INSERT INTO exam_configuration_issues VALUES(t.id,SQLERRM,now()); UPDATE tests SET status='DRAFT' WHERE id=t.id; END;
 END LOOP; END $$;
CREATE FUNCTION exam_publish_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NEW.status IN('PUBLISHED','ACTIVE') THEN PERFORM exam_validate_test(NEW.id); END IF; RETURN NEW; END $$;
CREATE CONSTRAINT TRIGGER exam_publish_guard AFTER INSERT OR UPDATE ON tests DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION exam_publish_guard();
CREATE OR REPLACE FUNCTION publish_test(p_test_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT can_manage_test(p_test_id) THEN RAISE EXCEPTION 'Test management denied'; END IF;
 PERFORM exam_validate_test(p_test_id);
 UPDATE tests SET status='PUBLISHED',published_at=now(),published_by=auth.uid(),total_marks=(SELECT sum(s.question_count*s.marks_per_question) FROM test_sections s WHERE test_id=p_test_id) WHERE id=p_test_id;
 DELETE FROM exam_configuration_issues WHERE test_id=p_test_id;
 RETURN true;
END $$;
-- Updating any published composition must pass the same validation at commit.
CREATE FUNCTION exam_composition_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; sec uuid;
BEGIN
 IF TG_TABLE_NAME='test_sections' THEN tid:=COALESCE(NEW.test_id,OLD.test_id); ELSE sec:=COALESCE(NEW.test_section_id,OLD.test_section_id); SELECT test_id INTO tid FROM test_sections WHERE id=sec; END IF;
 IF EXISTS(SELECT 1 FROM tests WHERE id=tid AND status IN('PUBLISHED','ACTIVE')) THEN PERFORM exam_validate_test(tid); END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER exam_sections_guard AFTER INSERT OR UPDATE OR DELETE ON test_sections DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION exam_composition_guard();
CREATE CONSTRAINT TRIGGER exam_questions_guard AFTER INSERT OR UPDATE OR DELETE ON test_section_questions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION exam_composition_guard();
CREATE CONSTRAINT TRIGGER exam_subjects_guard AFTER INSERT OR UPDATE OR DELETE ON test_section_subjects DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION exam_composition_guard();

CREATE FUNCTION save_test_blueprint(p_payload jsonb) RETURNS tests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; t jsonb:=p_payload->'test'; s jsonb; e jsonb; sec uuid; sid uuid; q jsonb; pos integer; result tests%ROWTYPE;
BEGIN
 IF NOT(is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Staff required'; END IF;
 tid:=NULLIF(p_payload->>'testId','')::uuid;
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
 -- Retain section IDs referenced by previous attempts, replacing only content.
 FOR s IN SELECT value FROM jsonb_array_elements(p_payload->'sections') LOOP
 sec:=NULLIF(s->>'id','')::uuid;
 IF sec IS NULL THEN INSERT INTO test_sections(test_id,name,position,question_count,duration_minutes) VALUES(tid,s->>'name',(s->>'position')::int,(s->>'question_count')::int,(s->>'duration_minutes')::int) RETURNING id INTO sec;
 ELSE IF NOT EXISTS(SELECT 1 FROM test_sections WHERE id=sec AND test_id=tid) THEN RAISE EXCEPTION 'Invalid section owner'; END IF;
 UPDATE test_sections SET name=s->>'name',position=(s->>'position')::int,question_count=(s->>'question_count')::int,duration_minutes=(s->>'duration_minutes')::int WHERE id=sec; END IF;
 DELETE FROM test_section_subjects WHERE test_section_id=sec;
 FOR q IN SELECT value FROM jsonb_array_elements(s->'subject_ids') LOOP INSERT INTO test_section_subjects VALUES(sec,(q#>>'{}')::uuid) ON CONFLICT DO NOTHING; END LOOP;
 IF NOT EXISTS(SELECT 1 FROM test_section_subjects WHERE test_section_id=sec) AND NULLIF(s->>'subject_id','') IS NOT NULL THEN INSERT INTO test_section_subjects VALUES(sec,(s->>'subject_id')::uuid); END IF;
 UPDATE test_sections SET subject_id=(SELECT subject_id FROM test_section_subjects WHERE test_section_id=sec ORDER BY subject_id LIMIT 1),section_code=s->>'section_code',is_mandatory=coalesce((s->>'is_mandatory')::boolean,false) WHERE id=sec;
 IF jsonb_array_length(s->'question_ids')<>(s->>'question_count')::int THEN RAISE EXCEPTION 'Exact question count required for %',s->>'name'; END IF;
 DELETE FROM test_section_questions WHERE test_section_id=sec;
 pos:=0; FOR q IN SELECT value FROM jsonb_array_elements(s->'question_ids') LOOP pos:=pos+1; INSERT INTO test_section_questions(test_section_id,question_id,position,marks) VALUES(sec,(q#>>'{}')::uuid,pos,1); END LOOP;
 END LOOP;
 -- Removing sections with attempts is deliberately rejected by FK; transaction rolls back.
 DELETE FROM test_sections WHERE test_id=tid AND position>jsonb_array_length(p_payload->'sections');
 PERFORM publish_test(tid);
 SELECT * INTO result FROM tests WHERE id=tid;
 RETURN result;
END $$;

-- Correct the actual callable RPCs, not aliases.
CREATE OR REPLACE FUNCTION save_answer(p_attempt_id uuid,p_question_id uuid,p_selected_option_id uuid DEFAULT NULL,p_marked_for_review boolean DEFAULT false) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; sec uuid;
BEGIN SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF a.id IS NULL OR a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 IF a.status<>'IN_PROGRESS' OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Attempt is closed or expired'; END IF;
 SELECT (j->>'section_id')::uuid INTO sec FROM jsonb_array_elements(a.question_order) j WHERE j->'question_ids' ? p_question_id::text;
 IF sec IS NULL OR sec<>a.current_section_id OR NOT EXISTS(SELECT 1 FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=sec AND completed_at IS NULL AND expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'Question section is locked or expired'; END IF;
 IF p_selected_option_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM question_options WHERE id=p_selected_option_id AND question_id=p_question_id) THEN RAISE EXCEPTION 'Invalid question option'; END IF;
 INSERT INTO attempt_answers(attempt_id,question_id,selected_option_id,marked_for_review,answered_at) VALUES(a.id,p_question_id,p_selected_option_id,p_marked_for_review,clock_timestamp()) ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id=excluded.selected_option_id,marked_for_review=excluded.marked_for_review,answered_at=excluded.answered_at,updated_at=clock_timestamp();
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION advance_section(p_attempt_id uuid,p_next_section_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; nxt test_sections%ROWTYPE; p attempt_section_progress%ROWTYPE;
BEGIN SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF a.id IS NULL OR a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 IF a.status<>'IN_PROGRESS' OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Attempt closed or expired'; END IF;
 IF p_next_section_id=a.current_section_id THEN SELECT * INTO p FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=p_next_section_id;
 ELSE
 SELECT * INTO nxt FROM test_sections WHERE test_id=a.test_id AND position=(SELECT position+1 FROM test_sections WHERE id=a.current_section_id);
 IF nxt.id IS NULL OR nxt.id<>p_next_section_id THEN RAISE EXCEPTION 'Only the next section may be started'; END IF;
 UPDATE attempt_section_progress SET completed_at=clock_timestamp() WHERE attempt_id=a.id AND section_id=a.current_section_id AND completed_at IS NULL;
 INSERT INTO attempt_section_progress(attempt_id,section_id,started_at,expires_at) VALUES(a.id,nxt.id,clock_timestamp(),least(a.expires_at,clock_timestamp()+nxt.duration_minutes*interval '1 minute')) ON CONFLICT(attempt_id,section_id) DO NOTHING;
 SELECT * INTO p FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=nxt.id;
 IF p.completed_at IS NOT NULL THEN RAISE EXCEPTION 'Completed section cannot be reopened'; END IF;
 UPDATE test_attempts SET current_section_id=nxt.id WHERE id=a.id;
 END IF;
 RETURN jsonb_build_object('section_id',p.section_id,'started_at',p.started_at,'expires_at',p.expires_at,'server_time',clock_timestamp());
END $$;
CREATE POLICY exam_own_section_read ON test_sections FOR SELECT TO authenticated USING(portal_can_read_test(test_id));
REVOKE ALL ON FUNCTION exam_validate_test(uuid),exam_publish_guard(),exam_composition_guard() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION save_test_blueprint(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION save_test_blueprint(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.generate_test_section_questions(p_section_id uuid, p_subject_id uuid, p_count integer, p_force_id uuid DEFAULT NULL::uuid, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_test_id UUID;
  v_existing_count INT;
  v_inserted INT := 0;
  v_question RECORD;
  v_position INT;
BEGIN
  -- Authorization
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can generate question composition.';
  END IF;

  -- Get test_id from section
  SELECT ts.test_id INTO v_test_id
  FROM public.test_sections ts
  WHERE ts.id = p_section_id;

  IF v_test_id IS NULL THEN
    RAISE EXCEPTION 'Section % not found.', p_section_id;
  END IF;

  -- Verify test is in DRAFT status
  IF NOT EXISTS (
    SELECT 1 FROM public.tests WHERE id = v_test_id AND status = 'DRAFT'
  ) THEN
    RAISE EXCEPTION 'Can only generate questions for DRAFT tests.';
  END IF;

  -- Clear existing composition for this section
  DELETE FROM public.test_section_questions WHERE test_section_id = p_section_id;

  -- Get next position
  v_position := 0;

  -- Select random approved questions matching criteria
  FOR v_question IN
    SELECT q.id
    FROM public.questions q
    WHERE q.subject_id = p_subject_id
      AND q.status = 'APPROVED'
 AND EXISTS(SELECT 1 FROM test_section_subjects m WHERE m.test_section_id=p_section_id AND m.subject_id=q.subject_id)
 AND NOT EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=v_test_id AND NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=e.course_id))
 AND (p_force_id IS NULL OR EXISTS(SELECT 1 FROM question_courses qc JOIN courses c ON c.id=qc.course_id WHERE qc.question_id=q.id AND c.force_id=p_force_id))
      -- Filter by force if provided (via question_courses ? courses ? force)
      AND (p_course_id IS NULL OR EXISTS (
        SELECT 1 FROM public.question_courses qc
        WHERE qc.question_id = q.id AND qc.course_id = p_course_id
      ))
      -- Ensure 4 valid options with exactly 1 correct
      AND (
        SELECT COUNT(*) FROM public.question_options qo
        WHERE qo.question_id = q.id
      ) = 4
      AND (
        SELECT COUNT(*) FROM public.question_options qo
        WHERE qo.question_id = q.id AND qo.is_correct = true
      ) = 1
      -- Exclude questions already used in other sections of the same test
      AND NOT EXISTS (
        SELECT 1 FROM public.test_section_questions tsq
        JOIN public.test_sections ts ON ts.id = tsq.test_section_id
        WHERE ts.test_id = v_test_id AND tsq.question_id = q.id
      )
    ORDER BY q.code,q.id
    LIMIT p_count
  LOOP
    v_position := v_position + 1;
    INSERT INTO public.test_section_questions (test_section_id, question_id, position)
    VALUES (p_section_id, v_question.id, v_position);
    v_inserted := v_inserted + 1;
  END LOOP;

  IF v_inserted <> p_count THEN RAISE EXCEPTION 'Bank has % valid questions; exactly % required',v_inserted,p_count; END IF;
  -- Preserve configured count
  UPDATE public.test_sections
  SET question_count = p_count
  WHERE id = p_section_id;

  RETURN v_inserted;
END;
$function$;

CREATE OR REPLACE FUNCTION public.portal_start_attempt_internal(p_test_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  PERFORM exam_validate_test(p_test_id);
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
  WHERE ta.test_id = p_test_id AND ta.student_id = v_student.id AND ta.status = 'ACTIVE' AND ta.available_from <= now() AND (ta.available_until IS NULL OR ta.available_until > now())
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
  v_expires_at := timezone('utc', now()) + (v_test.duration_minutes * interval '1 minute');
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
    timezone('utc', now()) + (v_first_section_duration * interval '1 minute')
  );

  PERFORM exam_capture_attempt(v_attempt_id);
  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_number,
    'first_section_id', v_first_section_id,
    'first_section_name', v_first_section_name,
    'first_section_duration', v_first_section_duration,
    'started_at', timezone('utc', now()),
    'resumed', false
  );
END;
$function$;

NOTIFY pgrst,'reload schema';
COMMIT;


