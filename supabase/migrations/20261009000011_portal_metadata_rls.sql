BEGIN;
-- Avoid a cycle between test RLS and eligibility write policies which also read tests.
CREATE OR REPLACE FUNCTION public.portal_can_read_test(tid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM students s WHERE s.profile_id=auth.uid() AND s.status='ACTIVE'
 AND portal_eligible(s.id,tid) AND EXISTS(SELECT 1 FROM test_assignments a WHERE a.student_id=s.id AND a.test_id=tid));
$$;
REVOKE ALL ON FUNCTION portal_can_read_test(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION portal_can_read_test(uuid) TO authenticated;
DROP POLICY portal_eligible_tests ON tests;
DROP POLICY portal_assigned_tests ON tests;
CREATE POLICY portal_eligible_tests ON tests AS RESTRICTIVE FOR SELECT TO authenticated USING(NOT is_student() OR portal_can_read_test(id));
CREATE POLICY portal_assigned_tests ON tests FOR SELECT TO authenticated USING(is_student() AND portal_can_read_test(id));
NOTIFY pgrst,'reload schema';
COMMIT;
