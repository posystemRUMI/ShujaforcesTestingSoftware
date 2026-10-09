BEGIN;
CREATE OR REPLACE FUNCTION public.portal_student_id() RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid;
BEGIN
 SELECT s.id INTO sid FROM students s JOIN profiles p ON p.id=s.profile_id
 WHERE s.profile_id=auth.uid() AND p.role='STUDENT' AND p.status='ACTIVE' AND s.status='ACTIVE';
 IF sid IS NULL THEN RAISE EXCEPTION 'Active authenticated student required'; END IF;
 RETURN sid;
END $$;

ALTER FUNCTION public.get_safe_exam_payload(uuid) RENAME TO portal_safe_exam_payload_internal;
REVOKE ALL ON FUNCTION portal_safe_exam_payload_internal(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.get_safe_exam_payload(p_attempt_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
 'allow_section_navigation',t.allow_section_navigation,'show_result_immediately',t.show_result_immediately),
 'student',jsonb_build_object('id',a.student_id,'roll_number',(SELECT roll_number FROM students WHERE id=a.student_id)),
 'sections',sections,'saved_answers',answers,'server_time',clock_timestamp());
END $$;
REVOKE ALL ON FUNCTION get_safe_exam_payload(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION get_safe_exam_payload(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
