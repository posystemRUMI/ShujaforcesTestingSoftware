BEGIN;
CREATE OR REPLACE VIEW public.portal_valid_results WITH (security_invoker=true) AS
 SELECT r.*,a.submitted_at AS completed_at,t.name AS test_name,a.attempt_number
 FROM test_results r JOIN test_attempts a ON a.id=r.attempt_id AND a.student_id=r.student_id AND a.test_id=r.test_id
 JOIN tests t ON t.id=r.test_id WHERE a.status IN ('SUBMITTED','AUTO_SUBMITTED','FORCE_SUBMITTED') AND a.submitted_at IS NOT NULL AND r.max_marks>0;
DO $fix$
DECLARE d text; signature text;
BEGIN
 FOREACH signature IN ARRAY ARRAY['public.student_portal_leaderboard(uuid,integer,integer)','public.student_portal_snapshot()'] LOOP
 d:=pg_get_functiondef(signature::regprocedure);
 d:=replace(d,'completed_at DESC,attempt_id DESC','completed_at DESC,attempt_number DESC,attempt_id DESC');
 EXECUTE d;
 END LOOP;
END $fix$;
COMMIT;
