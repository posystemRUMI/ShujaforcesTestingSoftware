BEGIN;
-- Old views must honor underlying ownership RLS when queried directly.
ALTER VIEW public.view_best_student_test_results SET (security_invoker=true);
ALTER VIEW public.v_active_monitoring SET (security_invoker=true);
DO $fix$
DECLARE d text;
BEGIN
 d:=pg_get_functiondef('public.student_portal_snapshot()'::regprocedure);
 d:=replace(d,'FROM student_fee_accounts WHERE student_id=sid','FROM student_fee_accounts WHERE student_id=sid AND fee_type=''ADMISSION & TUITION FEE''');
 EXECUTE d;
 d:=pg_get_functiondef('public.get_result_detail(uuid)'::regprocedure);
 d:=regexp_replace(d,'\mBEGIN\M',$body$BEGIN
 IF public.is_student() AND NOT EXISTS(SELECT 1 FROM public.portal_valid_results r JOIN public.students s ON s.id=r.student_id
 WHERE r.id=p_result_id AND s.profile_id=auth.uid()) THEN RAISE EXCEPTION 'No valid finalized result owned by this student'; END IF;$body$);
 EXECUTE d;
END $fix$;
NOTIFY pgrst,'reload schema';
COMMIT;
