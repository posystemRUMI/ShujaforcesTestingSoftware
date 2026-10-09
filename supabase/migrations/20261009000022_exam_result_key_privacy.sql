BEGIN;
ALTER FUNCTION get_result_detail(uuid) RENAME TO exam_staff_result_detail_internal;
REVOKE ALL ON FUNCTION exam_staff_result_detail_internal(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION get_result_detail(p_result_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r test_results%ROWTYPE; t tests%ROWTYPE; snap jsonb; sid uuid;
BEGIN
 IF is_admin() OR is_teacher() THEN RETURN exam_staff_result_detail_internal(p_result_id); END IF;
 sid:=portal_student_id();
 SELECT result.* INTO r FROM test_results result JOIN portal_valid_results valid ON valid.id=result.id WHERE result.id=p_result_id AND result.student_id=sid;
 IF r.id IS NULL THEN RAISE EXCEPTION 'No valid finalized result owned by this student'; END IF;
 SELECT * INTO t FROM tests WHERE id=r.test_id;
 SELECT payload INTO snap FROM exam_attempt_snapshots WHERE attempt_id=r.attempt_id;
 -- Aggregate/section marks and own answer records are persisted; keyed review remains private.
 RETURN jsonb_build_object('result',to_jsonb(r),'test',jsonb_build_object('id',t.id,'name',coalesce(snap#>>'{test,name}',t.name),'passing_threshold',coalesce((snap#>>'{test,passing_threshold}')::numeric,t.passing_threshold)),
 'student',jsonb_build_object('id',sid,'roll_number',(SELECT roll_number FROM students WHERE id=sid)),
 'sections','[]'::jsonb,'answer_review_enabled',false);
END $$;
REVOKE ALL ON FUNCTION get_result_detail(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION get_result_detail(uuid) TO authenticated;
COMMIT;
