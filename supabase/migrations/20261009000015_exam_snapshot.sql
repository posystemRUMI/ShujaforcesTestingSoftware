BEGIN;
CREATE TABLE exam_attempt_snapshots(attempt_id uuid PRIMARY KEY REFERENCES test_attempts(id) ON DELETE CASCADE,payload jsonb NOT NULL,answer_keys jsonb NOT NULL,captured_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE exam_attempt_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY snapshot_staff ON exam_attempt_snapshots FOR SELECT TO authenticated USING(is_admin() OR is_teacher());
CREATE FUNCTION exam_capture_attempt(aid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb; keys jsonb;
BEGIN
 p:=get_safe_exam_payload(aid);
 SELECT jsonb_object_agg(q.id::text,o.id::text) INTO keys FROM test_attempts a CROSS JOIN LATERAL jsonb_array_elements(a.question_order) s CROSS JOIN LATERAL jsonb_array_elements_text(s->'question_ids') ids JOIN questions q ON q.id=ids.value::uuid JOIN question_options o ON o.question_id=q.id AND o.is_correct WHERE a.id=aid;
 INSERT INTO exam_attempt_snapshots(attempt_id,payload,answer_keys) VALUES(aid,p,keys) ON CONFLICT DO NOTHING;
END $$;
ALTER FUNCTION get_safe_exam_payload(uuid) RENAME TO exam_live_payload_internal;
CREATE OR REPLACE FUNCTION public.exam_live_payload_internal(p_attempt_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE payload jsonb; a test_attempts%ROWTYPE; t tests%ROWTYPE; sid uuid; sections jsonb; answers jsonb;
BEGIN
 IF is_student() THEN
 sid:=portal_student_id();
 IF NOT EXISTS(SELECT 1 FROM test_attempts WHERE id=p_attempt_id AND student_id=sid AND portal_eligible(sid,test_id)) THEN RAISE EXCEPTION 'Attempt ownership or course eligibility denied'; END IF;
 ELSIF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Authentication required'; END IF;
 -- Retain existing locked question/option ordering and answer secrecy.
 payload:=portal_safe_exam_payload_internal(p_attempt_id);
 SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id;
 SELECT * INTO t FROM tests WHERE id=a.test_id;
 SELECT coalesce(jsonb_agg(
 raw.section || jsonb_build_object('position',ts.position,'question_count',ts.question_count,'duration_minutes',ts.duration_minutes,
 'marks_per_question',ts.marks_per_question,'started_at',progress.started_at,'expires_at',progress.expires_at,'completed_at',progress.completed_at,
 'questions',(SELECT coalesce(jsonb_agg(q.item||jsonb_build_object('marks',ts.marks_per_question) ORDER BY q.n),'[]')
 FROM jsonb_array_elements(raw.section->'questions') WITH ORDINALITY q(item,n))) ORDER BY raw.n),'[]') INTO sections
 FROM jsonb_array_elements(payload->'sections') WITH ORDINALITY raw(section,n)
 JOIN test_sections ts ON ts.id=(raw.section->>'id')::uuid AND ts.test_id=a.test_id
 LEFT JOIN attempt_section_progress progress ON progress.section_id=ts.id AND progress.attempt_id=a.id;
 SELECT coalesce(jsonb_object_agg(question_id::text,jsonb_build_object('selected_option_id',selected_option_id,'marked_for_review',marked_for_review,'answered_at',answered_at)),'{}')
 INTO answers FROM attempt_answers WHERE attempt_id=a.id;
 RETURN payload || jsonb_build_object(
 'attempt',jsonb_build_object('id',a.id,'attempt_number',a.attempt_number,'status',a.status,'started_at',a.started_at,'expires_at',a.expires_at,
 'current_section_id',a.current_section_id,'question_order',a.question_order,'option_order',a.option_order),
 'test',jsonb_build_object('id',t.id,'name',t.name,'description',t.description,'duration_minutes',t.duration_minutes,'total_marks',t.total_marks,
 'passing_threshold',t.passing_threshold,'shuffle_questions',t.shuffle_questions,'shuffle_options',t.shuffle_options,
 'negative_marking',t.negative_marking,'negative_mark_value',t.negative_mark_value,'allow_section_navigation',t.allow_section_navigation,'show_result_immediately',t.show_result_immediately),
 'student',jsonb_build_object('id',a.student_id,'roll_number',(SELECT roll_number FROM students WHERE id=a.student_id)),
 'sections',sections,'saved_answers',answers,'server_time',clock_timestamp());
END $function$;

REVOKE ALL ON FUNCTION exam_live_payload_internal(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION get_safe_exam_payload(p_attempt_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; p jsonb; sections jsonb; answers jsonb;
BEGIN
 SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id;
 IF a.id IS NULL OR (NOT(is_admin() OR is_teacher()) AND (a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id))) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 SELECT payload INTO p FROM exam_attempt_snapshots WHERE attempt_id=a.id;
 IF p IS NULL THEN RETURN exam_live_payload_internal(a.id); END IF;
 SELECT jsonb_agg(s.item||jsonb_build_object('started_at',pr.started_at,'expires_at',pr.expires_at,'completed_at',pr.completed_at) ORDER BY s.n) INTO sections FROM jsonb_array_elements(p->'sections') WITH ORDINALITY s(item,n) LEFT JOIN attempt_section_progress pr ON pr.attempt_id=a.id AND pr.section_id=(s.item->>'id')::uuid;
 SELECT coalesce(jsonb_object_agg(question_id::text,jsonb_build_object('selected_option_id',selected_option_id,'marked_for_review',marked_for_review,'answered_at',answered_at)),'{}') INTO answers FROM attempt_answers WHERE attempt_id=a.id;
 RETURN p||jsonb_build_object('sections',sections,'saved_answers',answers,'server_time',clock_timestamp(),'attempt',(p->'attempt')||jsonb_build_object('current_section_id',a.current_section_id,'status',a.status,'expires_at',a.expires_at));
END $$;
-- Legacy attempts are captured with existing saved selection, never regenerated.
DO $$ DECLARE a record; BEGIN FOR a IN SELECT id FROM test_attempts LOOP PERFORM exam_capture_attempt(a.id); END LOOP; END $$;
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
 submit_status:=CASE WHEN (is_admin() OR is_teacher()) AND a.student_id IS DISTINCT FROM portal_student_id() THEN 'FORCE_SUBMITTED'::attempt_status WHEN clock_timestamp()>=a.expires_at THEN 'AUTO_SUBMITTED'::attempt_status ELSE 'SUBMITTED'::attempt_status END;
 UPDATE test_attempts SET status=submit_status,submitted_at=clock_timestamp() WHERE id=a.id;
 UPDATE attempt_section_progress SET completed_at=least(clock_timestamp(),expires_at) WHERE attempt_id=a.id AND completed_at IS NULL;
 INSERT INTO test_results(attempt_id,student_id,test_id,total_questions,correct_count,incorrect_count,skipped_count,marks_obtained,max_marks,percentage,passed,section_results,time_spent_seconds) VALUES(a.id,a.student_id,a.test_id,total,correct,incorrect,skipped,marks,maxmarks,pct,pct>=(snap.payload#>>'{test,passing_threshold}')::numeric,sections,elapsed) RETURNING id INTO result_id;
 PERFORM log_audit_event('ATTEMPT_SUBMITTED','TEST_ATTEMPT',a.id::text,jsonb_build_object('result_id',result_id,'status',submit_status,'questions',total));
 RETURN jsonb_build_object('result_id',result_id,'already_submitted',false,'marks_obtained',marks,'max_marks',maxmarks,'percentage',pct,'passed',pct>=(snap.payload#>>'{test,passing_threshold}')::numeric,'correct_count',correct,'incorrect_count',incorrect,'skipped_count',skipped,'section_results',sections,'time_spent_seconds',elapsed);
END $$;
REVOKE ALL ON FUNCTION exam_capture_attempt(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION get_safe_exam_payload(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION get_safe_exam_payload(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;


