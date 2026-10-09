BEGIN;
-- Published course delivery becomes an explicit, persisted rule and individual assignment.
CREATE TABLE public.test_course_deliveries (
 test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
 course_id uuid NOT NULL REFERENCES courses(id),force_id uuid NOT NULL REFERENCES forces(id),
 assigned_by uuid NOT NULL REFERENCES profiles(id),available_from timestamptz NOT NULL DEFAULT now(),
 available_until timestamptz,active boolean NOT NULL DEFAULT true,PRIMARY KEY(test_id,course_id)
);
ALTER TABLE test_course_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY deliveries_staff ON test_course_deliveries FOR ALL TO authenticated USING(is_admin() OR is_teacher()) WITH CHECK(is_admin() OR is_teacher());
CREATE OR REPLACE FUNCTION public.portal_deliver_student(sid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO test_assignments(test_id,student_id,assigned_by,available_from,available_until)
 SELECT d.test_id,s.id,d.assigned_by,d.available_from,d.available_until FROM test_course_deliveries d
 JOIN students s ON s.id=sid AND s.target_course_id=d.course_id AND s.target_force_id=d.force_id
 JOIN tests t ON t.id=d.test_id AND t.status IN ('ACTIVE','PUBLISHED')
 WHERE d.active AND s.status='ACTIVE'
 ON CONFLICT(test_id,student_id) WHERE student_id IS NOT NULL DO NOTHING;
END $$;
CREATE OR REPLACE FUNCTION public.portal_deliver_registration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN PERFORM portal_deliver_student(NEW.id); RETURN NULL; END $$;
CREATE TRIGGER portal_registration_delivery AFTER INSERT OR UPDATE OF target_course_id,target_force_id,status ON students FOR EACH ROW EXECUTE FUNCTION portal_deliver_registration();
CREATE OR REPLACE FUNCTION public.portal_publish_deliveries() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; sid uuid;
BEGIN
 IF TG_TABLE_NAME='tests' THEN tid:=NEW.id; ELSE tid:=NEW.test_id; END IF;
 INSERT INTO test_course_deliveries(test_id,course_id,force_id,assigned_by)
 SELECT t.id,e.course_id,e.force_id,coalesce(t.published_by,t.created_by) FROM tests t JOIN test_eligible_courses e ON e.test_id=t.id
 WHERE t.id=tid AND t.status IN ('ACTIVE','PUBLISHED') AND coalesce(t.published_by,t.created_by) IS NOT NULL
 ON CONFLICT(test_id,course_id) DO NOTHING;
 FOR sid IN SELECT id FROM students WHERE status='ACTIVE' LOOP PERFORM portal_deliver_student(sid); END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER portal_test_delivery AFTER INSERT OR UPDATE OF status ON tests FOR EACH ROW EXECUTE FUNCTION portal_publish_deliveries();
CREATE TRIGGER portal_eligibility_delivery AFTER INSERT ON test_eligible_courses FOR EACH ROW EXECUTE FUNCTION portal_publish_deliveries();
INSERT INTO test_course_deliveries(test_id,course_id,force_id,assigned_by)
SELECT t.id,e.course_id,e.force_id,coalesce(t.published_by,t.created_by) FROM tests t JOIN test_eligible_courses e ON e.test_id=t.id
WHERE t.status IN ('ACTIVE','PUBLISHED') AND coalesce(t.published_by,t.created_by) IS NOT NULL;
SELECT portal_deliver_student(id) FROM students WHERE status='ACTIVE';

-- Fix historical/live schema variations in internal attempt initialization.
DO $fix$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.portal_start_attempt_internal(uuid)'::regprocedure);
 definition:=replace(definition,'WHERE ta.test_id = p_test_id','WHERE ta.test_id = p_test_id AND ta.student_id = v_student.id AND ta.status = ''ACTIVE'' AND ta.available_from <= now() AND (ta.available_until IS NULL OR ta.available_until > now())');
 EXECUTE definition;
END $fix$;
CREATE POLICY portal_eligible_tests ON tests AS RESTRICTIVE FOR SELECT TO authenticated USING
 (NOT is_student() OR EXISTS(SELECT 1 FROM test_eligible_courses e JOIN students s ON s.target_course_id=e.course_id AND s.target_force_id=e.force_id WHERE e.test_id=tests.id AND s.profile_id=auth.uid()));
CREATE POLICY portal_assigned_tests ON tests FOR SELECT TO authenticated USING
 (EXISTS(SELECT 1 FROM test_assignments a JOIN students s ON s.id=a.student_id WHERE a.test_id=tests.id AND s.profile_id=auth.uid()));
CREATE POLICY portal_eligibility_read ON test_eligible_courses FOR SELECT TO authenticated USING
 (EXISTS(SELECT 1 FROM students s WHERE s.profile_id=auth.uid() AND s.target_course_id=course_id AND s.target_force_id=force_id));

-- Attempts cannot change ownership through staff corrections.
ALTER TABLE test_attempts ADD CONSTRAINT portal_attempt_owner_key UNIQUE(id,student_id,test_id);
ALTER TABLE test_results ADD CONSTRAINT portal_result_owner FOREIGN KEY(attempt_id,student_id,test_id) REFERENCES test_attempts(id,student_id,test_id);
REVOKE ALL ON FUNCTION portal_deliver_student(uuid),portal_deliver_registration(),portal_publish_deliveries() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
