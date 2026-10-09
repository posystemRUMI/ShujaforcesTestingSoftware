BEGIN;
ALTER FUNCTION get_safe_exam_payload(uuid) RENAME TO exam_context_payload_internal;
REVOKE ALL ON FUNCTION exam_context_payload_internal(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION get_safe_exam_payload(p_attempt_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE payload jsonb; sections jsonb; c record;
BEGIN
 payload:=exam_context_payload_internal(p_attempt_id);
 SELECT course.id,course.name,force.id force_id,force.name force_name INTO c FROM students s JOIN courses course ON course.id=s.target_course_id JOIN forces force ON force.id=course.force_id WHERE s.id=(payload#>>'{student,id}')::uuid;
 SELECT jsonb_agg(sec.item||jsonb_build_object('questions',(SELECT jsonb_agg(q.item||jsonb_build_object('subject_code',(SELECT code FROM subjects WHERE id=(q.item->>'subject_id')::uuid)) ORDER BY q.n) FROM jsonb_array_elements(sec.item->'questions') WITH ORDINALITY q(item,n))) ORDER BY sec.n) INTO sections FROM jsonb_array_elements(payload->'sections') WITH ORDINALITY sec(item,n);
 RETURN payload||jsonb_build_object('sections',sections,'test',(payload->'test')||jsonb_build_object('course_id',c.id,'course_name',c.name,'force_id',c.force_id,'force_name',c.force_name),'server_time',clock_timestamp());
END $$;
REVOKE ALL ON FUNCTION get_safe_exam_payload(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION get_safe_exam_payload(uuid) TO authenticated;
COMMIT;
