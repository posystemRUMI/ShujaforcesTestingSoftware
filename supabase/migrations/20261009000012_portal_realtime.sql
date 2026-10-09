BEGIN;
DO $$
DECLARE tbl text;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
 FOREACH tbl IN ARRAY ARRAY['profiles','students','test_assignments','test_attempts','test_results','student_performance','student_fee_accounts','student_fee_payments','retake_permissions'] LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=tbl) THEN
 EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',tbl);
 END IF;
 END LOOP;
 END IF;
END $$;
COMMIT;
