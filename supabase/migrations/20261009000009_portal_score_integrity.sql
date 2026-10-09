BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS portal_roll_number_case_unique ON students(lower(trim(roll_number)));
-- Corrections to marks must also correct the stored percentage and qualification.
CREATE OR REPLACE FUNCTION public.portal_normalize_result() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE threshold integer;
BEGIN
 IF NEW.max_marks<=0 OR NEW.marks_obtained<0 OR NEW.marks_obtained>NEW.max_marks THEN RAISE EXCEPTION 'Invalid result marks'; END IF;
 NEW.percentage:=round(NEW.marks_obtained/NEW.max_marks*100,2);
 SELECT passing_threshold INTO threshold FROM tests WHERE id=NEW.test_id;
 NEW.passed:=NEW.percentage>=threshold;
 RETURN NEW;
END $$;
CREATE TRIGGER portal_result_normalization BEFORE INSERT OR UPDATE OF marks_obtained,max_marks,percentage ON test_results FOR EACH ROW EXECUTE FUNCTION portal_normalize_result();
DO $fix$
DECLARE d text;
BEGIN
 d:=pg_get_functiondef('public.student_portal_leaderboard(uuid,integer,integer)'::regprocedure);
 d:=replace(d,'student_id,percentage FROM portal_valid_results','student_id,marks_obtained/nullif(max_marks,0)*100 AS percentage FROM portal_valid_results');
 EXECUTE d;
END $fix$;
REVOKE ALL ON FUNCTION portal_normalize_result() FROM PUBLIC,anon,authenticated;
COMMIT;
