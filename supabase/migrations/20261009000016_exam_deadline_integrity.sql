BEGIN;
CREATE OR REPLACE FUNCTION public.start_test_attempt(p_test_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE sid uuid:=portal_student_id(); aid uuid; rid uuid; payload jsonb;
BEGIN
 PERFORM 1 FROM students WHERE id=sid FOR UPDATE;
 IF NOT portal_eligible(sid,p_test_id) THEN RAISE EXCEPTION 'Force/course eligibility denied'; END IF;
 SELECT id INTO aid FROM test_attempts WHERE student_id=sid AND test_id=p_test_id AND status='IN_PROGRESS' ORDER BY started_at DESC LIMIT 1;
 IF aid IS NOT NULL THEN RETURN jsonb_build_object('attempt_id',aid,'resumed',true,'expires_at',(SELECT expires_at FROM test_attempts WHERE id=aid),'server_time',clock_timestamp()); END IF;
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
END $function$
;
CREATE OR REPLACE FUNCTION save_answer(p_attempt_id uuid,p_question_id uuid,p_selected_option_id uuid DEFAULT NULL,p_marked_for_review boolean DEFAULT false) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; sec uuid;
BEGIN SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF a.id IS NULL OR a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 IF a.status<>'IN_PROGRESS' OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Attempt is closed or expired'; END IF;
 SELECT (j->>'section_id')::uuid INTO sec FROM jsonb_array_elements(a.question_order) j WHERE j->'question_ids' ? p_question_id::text;
 IF sec IS NULL OR sec<>a.current_section_id OR NOT EXISTS(SELECT 1 FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=sec AND completed_at IS NULL AND expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'Question section is locked or expired'; END IF;
 IF p_selected_option_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM exam_attempt_snapshots snap CROSS JOIN LATERAL jsonb_array_elements(snap.payload->'sections') s CROSS JOIN LATERAL jsonb_array_elements(s->'questions') q CROSS JOIN LATERAL jsonb_array_elements(q->'options') o WHERE snap.attempt_id=a.id AND q->>'id'=p_question_id::text AND o->>'id'=p_selected_option_id::text) THEN RAISE EXCEPTION 'Invalid question option'; END IF;
 INSERT INTO attempt_answers(attempt_id,question_id,selected_option_id,marked_for_review,answered_at) VALUES(a.id,p_question_id,p_selected_option_id,p_marked_for_review,clock_timestamp()) ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id=excluded.selected_option_id,marked_for_review=excluded.marked_for_review,answered_at=excluded.answered_at,updated_at=clock_timestamp();
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION advance_section(p_attempt_id uuid,p_next_section_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; nxt jsonb; p attempt_section_progress%ROWTYPE;
BEGIN SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF a.id IS NULL OR a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 IF a.status<>'IN_PROGRESS' OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Attempt closed or expired'; END IF;
 IF p_next_section_id=a.current_section_id THEN SELECT * INTO p FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=p_next_section_id;
 ELSE
 SELECT s.item INTO nxt FROM exam_attempt_snapshots snap CROSS JOIN LATERAL jsonb_array_elements(snap.payload->'sections') WITH ORDINALITY s(item,n) WHERE snap.attempt_id=a.id AND s.n=(SELECT c.n+1 FROM jsonb_array_elements(snap.payload->'sections') WITH ORDINALITY c(item,n) WHERE c.item->>'id'=a.current_section_id::text);
 IF (nxt->>'id')::uuid IS NULL OR (nxt->>'id')::uuid<>p_next_section_id THEN RAISE EXCEPTION 'Only the next section may be started'; END IF;
 UPDATE attempt_section_progress SET completed_at=clock_timestamp() WHERE attempt_id=a.id AND section_id=a.current_section_id AND completed_at IS NULL;
 INSERT INTO attempt_section_progress(attempt_id,section_id,started_at,expires_at) VALUES(a.id,(nxt->>'id')::uuid,clock_timestamp(),least(a.expires_at,clock_timestamp()+(nxt->>'duration_minutes')::int*interval '1 minute')) ON CONFLICT(attempt_id,section_id) DO NOTHING;
 SELECT * INTO p FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=(nxt->>'id')::uuid;
 IF p.completed_at IS NOT NULL THEN RAISE EXCEPTION 'Completed section cannot be reopened'; END IF;
 UPDATE test_attempts SET current_section_id=(nxt->>'id')::uuid WHERE id=a.id;
 END IF;
 RETURN jsonb_build_object('section_id',p.section_id,'started_at',p.started_at,'expires_at',p.expires_at,'server_time',clock_timestamp());
END $$;
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


REVOKE ALL ON FUNCTION save_answer(uuid,uuid,uuid,boolean),advance_section(uuid,uuid),submit_test_attempt(uuid),publish_test(uuid),generate_test_section_questions(uuid,uuid,integer,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION save_answer(uuid,uuid,uuid,boolean),advance_section(uuid,uuid),submit_test_attempt(uuid),publish_test(uuid),generate_test_section_questions(uuid,uuid,integer,uuid,uuid) TO authenticated;
COMMIT;
