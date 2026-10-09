BEGIN;
-- New and edited shared intelligence questions must retain PN Cadet eligibility.
-- Reuse the existing authorized writer without changing its security or key validation.
DO $$ DECLARE definition text; updated text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='admin_upsert_question';
 updated:=replace(definition,'''PMA_LONG_COURSE'',''PMA_LC'',''AFNS''','''PMA_LONG_COURSE'',''PMA_LC'',''AFNS'',''PN_CADET''');
 IF updated=definition AND strpos(definition,'''PN_CADET''')=0 THEN RAISE EXCEPTION 'Shared intelligence authoring function differs from the expected definition'; END IF;
 IF updated<>definition THEN EXECUTE updated; END IF;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
