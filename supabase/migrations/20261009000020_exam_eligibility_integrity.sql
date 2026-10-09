BEGIN;
CREATE FUNCTION exam_eligibility_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; sid uuid;
BEGIN
 tid:=CASE WHEN TG_OP='DELETE' THEN OLD.test_id ELSE NEW.test_id END;
 IF NOT EXISTS(SELECT 1 FROM tests WHERE id=tid) THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM tests WHERE id=tid AND status IN('PUBLISHED','ACTIVE')) THEN PERFORM exam_validate_test(tid); END IF;
 DELETE FROM test_course_deliveries d WHERE d.test_id=tid AND NOT EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=d.test_id AND e.course_id=d.course_id AND e.force_id=d.force_id);
 INSERT INTO test_course_deliveries(test_id,course_id,force_id,assigned_by)
 SELECT t.id,e.course_id,e.force_id,coalesce(t.published_by,t.created_by) FROM tests t JOIN test_eligible_courses e ON e.test_id=t.id WHERE t.id=tid AND t.status IN('PUBLISHED','ACTIVE') ON CONFLICT DO NOTHING;
 FOR sid IN SELECT id FROM students WHERE status='ACTIVE' LOOP PERFORM portal_deliver_student(sid); END LOOP;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER exam_eligibility_guard AFTER INSERT OR UPDATE OR DELETE ON test_eligible_courses DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION exam_eligibility_guard();
CREATE POLICY exam_test_staff_update ON tests AS RESTRICTIVE FOR UPDATE TO authenticated USING(can_manage_test(id)) WITH CHECK(can_manage_test(id));
CREATE POLICY exam_test_staff_delete ON tests AS RESTRICTIVE FOR DELETE TO authenticated USING(can_manage_test(id));
REVOKE ALL ON FUNCTION exam_eligibility_guard() FROM PUBLIC,anon,authenticated;
COMMIT;
