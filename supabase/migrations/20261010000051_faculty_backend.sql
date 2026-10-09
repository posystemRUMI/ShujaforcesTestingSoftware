BEGIN;
-- A faculty member with Tri-Service affiliation has no single force FK.
ALTER TABLE public.teachers ALTER COLUMN branch_code DROP NOT NULL;
CREATE TABLE IF NOT EXISTS public.faculty_code_counter(id boolean PRIMARY KEY DEFAULT true CHECK(id),last_issued bigint NOT NULL DEFAULT 0 CHECK(last_issued>=0));
ALTER TABLE faculty_code_counter ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON faculty_code_counter FROM anon,authenticated;
INSERT INTO faculty_code_counter(id,last_issued) SELECT true,coalesce(max(substring(service_number FROM '[0-9]+$')::bigint),0) FROM teachers WHERE service_number ~ '^FAC-[1-9][0-9]*$'
ON CONFLICT(id) DO UPDATE SET last_issued=greatest(faculty_code_counter.last_issued,excluded.last_issued);

CREATE OR REPLACE FUNCTION public.suggest_faculty_code() RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='ADMIN' AND status='ACTIVE') THEN RAISE EXCEPTION 'Active administrator required'; END IF;
 RETURN (SELECT 'FAC-'||(last_issued+1) FROM faculty_code_counter WHERE id);
END $$;
REVOKE ALL ON FUNCTION suggest_faculty_code() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION suggest_faculty_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_faculty_code() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE n bigint;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.service_number IS DISTINCT FROM OLD.service_number THEN RAISE EXCEPTION 'Faculty code cannot be changed'; END IF;
  RETURN NEW;
 END IF;
 SELECT last_issued+1 INTO n FROM faculty_code_counter WHERE id FOR UPDATE;
 IF NEW.service_number IS DISTINCT FROM 'FAC-'||n THEN RAISE EXCEPTION 'Faculty code must be FAC-%. Refresh the form and try again.',n; END IF;
 UPDATE faculty_code_counter SET last_issued=n WHERE id;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION enforce_faculty_code() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS enforce_faculty_code ON teachers;
CREATE TRIGGER enforce_faculty_code BEFORE INSERT OR UPDATE OF service_number ON teachers FOR EACH ROW EXECUTE FUNCTION enforce_faculty_code();

CREATE OR REPLACE FUNCTION public.portal_save_faculty(p_teacher_id uuid,p_auth_user_id uuid,p_creator_id uuid,p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE tid uuid; uid uuid; codes text[]; sids uuid[]; email_value text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_creator_id AND role='ADMIN' AND status='ACTIVE') THEN RAISE EXCEPTION 'Active administrator required'; END IF;
 IF coalesce(length(trim(p_input->>'fullName')),0)<3 OR coalesce(length(trim(p_input->>'titleRank')),0)<2
 OR coalesce(length(trim(p_input->>'phone')),0)<7 THEN RAISE EXCEPTION 'Valid name, title/rank and contact phone required'; END IF;
 IF coalesce(p_input->>'branchAffiliation','') NOT IN ('PAKISTAN_ARMY','PAKISTAN_AIR_FORCE','PAKISTAN_NAVY','TRI_SERVICE') THEN RAISE EXCEPTION 'Invalid branch affiliation'; END IF;
 email_value:=lower(trim(p_input->>'email'));
 IF email_value IS NULL OR email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Valid email required'; END IF;
 IF jsonb_typeof(p_input->'assignedSubjects') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Assigned subjects required'; END IF;
 SELECT array_agg(DISTINCT value) INTO codes FROM jsonb_array_elements_text(p_input->'assignedSubjects');
 IF coalesce(cardinality(codes),0)=0 THEN RAISE EXCEPTION 'At least one subject required'; END IF;
 SELECT array_agg(id) INTO sids FROM subjects WHERE code=ANY(codes) AND status='ACTIVE';
 IF cardinality(sids) IS DISTINCT FROM cardinality(codes) THEN RAISE EXCEPTION 'Every assigned subject must exist and be active'; END IF;
 IF p_teacher_id IS NULL THEN
  uid:=p_auth_user_id;
  IF uid IS NULL OR EXISTS(SELECT 1 FROM teachers WHERE profile_id=uid) OR EXISTS(SELECT 1 FROM students WHERE profile_id=uid)
  OR EXISTS(SELECT 1 FROM profiles WHERE id=uid AND role='ADMIN') THEN RAISE EXCEPTION 'A new faculty Auth account is required'; END IF;
 ELSE
  SELECT profile_id INTO uid FROM teachers WHERE id=p_teacher_id FOR UPDATE;
  IF uid IS NULL THEN RAISE EXCEPTION 'Faculty record not found'; END IF;
  IF p_auth_user_id IS DISTINCT FROM uid THEN RAISE EXCEPTION 'Faculty account mismatch'; END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=uid AND lower(email)=email_value) THEN RAISE EXCEPTION 'Faculty Auth email mismatch'; END IF;
 IF p_teacher_id IS NULL THEN
  INSERT INTO profiles(id,role,display_name,email,phone,status) VALUES(uid,'TEACHER',trim(p_input->>'fullName'),email_value,trim(p_input->>'phone'),'ACTIVE')
  ON CONFLICT(id) DO UPDATE SET role='TEACHER',display_name=excluded.display_name,email=excluded.email,phone=excluded.phone,status='ACTIVE',updated_at=now();
  INSERT INTO teachers(profile_id,service_number,rank,branch_code,role_title,status)
  VALUES(uid,p_input->>'employeeId',trim(p_input->>'titleRank'),nullif(p_input->>'branchAffiliation','TRI_SERVICE'),'SENIOR_INSTRUCTOR','ACTIVE') RETURNING id INTO tid;
 ELSE
  tid:=p_teacher_id;
  IF (SELECT service_number FROM teachers WHERE id=tid) IS DISTINCT FROM p_input->>'employeeId' THEN RAISE EXCEPTION 'Faculty code cannot be changed'; END IF;
  UPDATE profiles SET display_name=trim(p_input->>'fullName'),email=email_value,phone=trim(p_input->>'phone'),updated_at=now() WHERE id=uid;
  UPDATE teachers SET rank=trim(p_input->>'titleRank'),branch_code=nullif(p_input->>'branchAffiliation','TRI_SERVICE'),updated_at=now() WHERE id=tid;
 END IF;
 DELETE FROM teacher_subjects WHERE teacher_id=tid AND NOT(subject_id=ANY(sids));
 INSERT INTO teacher_subjects(teacher_id,subject_id) SELECT tid,unnest(sids) ON CONFLICT DO NOTHING;
 PERFORM set_config('request.jwt.claim.sub',p_creator_id::text,true);
 PERFORM log_audit_event('FACULTY_SAVED','TEACHER',tid::text,jsonb_build_object('employeeId',p_input->>'employeeId'));
 RETURN jsonb_build_object('success',true,'teacherId',tid,'profileId',uid);
END $$;
REVOKE ALL ON FUNCTION portal_save_faculty(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION portal_save_faculty(uuid,uuid,uuid,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
