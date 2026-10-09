BEGIN;

-- Resolve identity from the verified JWT, never from a supplied student ID.
CREATE OR REPLACE FUNCTION public.student_session_identity() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE sid uuid:=portal_student_id(); identity jsonb;
BEGIN
 SELECT to_jsonb(s) || jsonb_build_object('forces',to_jsonb(f),'courses',to_jsonb(c)) INTO identity
 FROM students s JOIN forces f ON f.id=s.target_force_id JOIN courses c ON c.id=s.target_course_id
 WHERE s.id=sid AND s.profile_id=auth.uid();
 IF identity IS NULL THEN RAISE EXCEPTION 'Student registration is incomplete'; END IF;
 RETURN identity;
END $$;
REVOKE ALL ON FUNCTION public.student_session_identity() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.student_session_identity() TO authenticated;

ALTER FUNCTION public.portal_register_student(uuid,uuid,jsonb) RENAME TO portal_register_student_internal;
REVOKE ALL ON FUNCTION public.portal_register_student_internal(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.portal_register_student(p_auth_user_id uuid,p_creator_id uuid,p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb; sid uuid;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF EXISTS(SELECT 1 FROM profiles WHERE id=p_auth_user_id AND role IN('ADMIN','TEACHER'))
 OR EXISTS(SELECT 1 FROM teachers WHERE profile_id=p_auth_user_id) THEN RAISE EXCEPTION 'Staff account cannot be converted into a student'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_auth_user_id AND lower(email)=lower(trim(p_input->>'email'))) THEN RAISE EXCEPTION 'Registration Auth identity mismatch'; END IF;
 IF coalesce(p_input->>'status','ACTIVE')<>'ACTIVE' THEN RAISE EXCEPTION 'New student registration requires ACTIVE status'; END IF;
 result:=portal_register_student_internal(p_auth_user_id,p_creator_id,p_input);
 sid:=(result->>'studentId')::uuid;
 IF NOT EXISTS(SELECT 1 FROM students s JOIN profiles p ON p.id=s.profile_id JOIN auth.users u ON u.id=p.id
 WHERE s.id=sid AND s.profile_id=p_auth_user_id AND s.status='ACTIVE' AND p.status='ACTIVE' AND p.role='STUDENT')
 THEN RAISE EXCEPTION 'Registration did not create a linked active student'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.portal_register_student(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.portal_register_student(uuid,uuid,jsonb) TO service_role;
COMMIT;
