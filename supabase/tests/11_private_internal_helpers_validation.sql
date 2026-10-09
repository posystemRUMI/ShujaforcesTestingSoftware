BEGIN;
DO $$
BEGIN
 IF has_function_privilege('anon','public.generate_receipt_number()','EXECUTE') OR has_function_privilege('authenticated','public.generate_receipt_number()','EXECUTE') THEN RAISE EXCEPTION 'Receipt sequence exposed'; END IF;
 IF has_function_privilege('anon','public.log_audit_event(text,text,text,jsonb)','EXECUTE') OR has_function_privilege('authenticated','public.log_audit_event(text,text,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Audit helper exposed'; END IF;
END $$;
SELECT 'Internal audit/receipt helper direct execution denied' AS name, true AS passed;
ROLLBACK;
