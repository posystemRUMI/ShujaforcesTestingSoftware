BEGIN;
CREATE TABLE IF NOT EXISTS public.student_roll_counters (
 prefix text PRIMARY KEY,
 last_issued bigint NOT NULL DEFAULT 0 CHECK(last_issued>=0)
);
ALTER TABLE public.student_roll_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_roll_counters FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.student_roll_prefix(p_force_id uuid,p_course_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE force_code text; course_code text;
BEGIN
 SELECT f.code,c.code INTO force_code,course_code FROM courses c JOIN forces f ON f.id=c.force_id
 WHERE c.id=p_course_id AND f.id=p_force_id AND c.status='ACTIVE' AND f.status='ACTIVE';
 IF force_code IS NULL THEN RAISE EXCEPTION 'Invalid active force/course selection'; END IF;
 RETURN CASE force_code WHEN 'PAKISTAN_NAVY' THEN 'SFA-NAVY'
  WHEN 'PAKISTAN_AIR_FORCE' THEN 'SFA-PAF'
  WHEN 'PAKISTAN_ARMY' THEN CASE WHEN course_code='AFNS' THEN 'SFA-AFNS' ELSE 'SFA-PMA' END
  ELSE NULL END;
END $$;
REVOKE ALL ON FUNCTION public.student_roll_prefix(uuid,uuid) FROM PUBLIC,anon,authenticated;

-- Preserve existing roll identifiers and start beyond numbers already issued.
INSERT INTO student_roll_counters(prefix,last_issued)
SELECT regexp_replace(roll_number,'-[0-9]+$',''),max(substring(roll_number FROM '[0-9]+$')::bigint)
FROM students WHERE roll_number ~ '^SFA-(NAVY|PAF|PMA|AFNS)-[1-9][0-9]*$'
GROUP BY 1 ON CONFLICT(prefix) DO UPDATE SET last_issued=greatest(student_roll_counters.last_issued,excluded.last_issued);
INSERT INTO student_roll_counters(prefix) VALUES('SFA-NAVY'),('SFA-PAF'),('SFA-PMA'),('SFA-AFNS') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.suggest_student_registration(p_force_id uuid,p_course_id uuid,p_full_name text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_prefix text; n bigint; first_name text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role IN ('ADMIN','TEACHER') AND status='ACTIVE')
 THEN RAISE EXCEPTION 'Active staff authentication required'; END IF;
 v_prefix:=student_roll_prefix(p_force_id,p_course_id);
 SELECT last_issued+1 INTO n FROM student_roll_counters WHERE student_roll_counters.prefix=v_prefix;
 IF n IS NULL THEN RAISE EXCEPTION 'Roll sequence is not configured'; END IF;
 first_name:=regexp_replace(lower(split_part(trim(coalesce(p_full_name,'')),' ',1)),'[^a-z0-9]','','g');
 RETURN jsonb_build_object('rollNumber',v_prefix||'-'||n,'email',CASE WHEN first_name<>'' THEN first_name||'.'||n||'@gmail.com' ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.suggest_student_registration(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.suggest_student_registration(uuid,uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_sequential_student_roll()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_prefix text; expected text; n bigint;
BEGIN
 IF TG_OP='UPDATE' AND NEW.roll_number IS NOT DISTINCT FROM OLD.roll_number THEN RETURN NEW; END IF;
 v_prefix:=student_roll_prefix(NEW.target_force_id,NEW.target_course_id);
 SELECT last_issued+1 INTO n FROM student_roll_counters WHERE student_roll_counters.prefix=v_prefix FOR UPDATE;
 IF n IS NULL THEN RAISE EXCEPTION 'Roll sequence is not configured'; END IF;
 expected:=v_prefix||'-'||n;
 IF NEW.roll_number IS DISTINCT FROM expected THEN
  RAISE EXCEPTION 'Roll number must be %. Refresh the roll suggestion and try again.',expected;
 END IF;
 UPDATE student_roll_counters SET last_issued=n WHERE student_roll_counters.prefix=v_prefix;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enforce_sequential_student_roll() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS enforce_sequential_student_roll ON public.students;
CREATE TRIGGER enforce_sequential_student_roll BEFORE INSERT OR UPDATE OF roll_number ON public.students
FOR EACH ROW EXECUTE FUNCTION public.enforce_sequential_student_roll();
NOTIFY pgrst,'reload schema';
COMMIT;
