BEGIN;
-- Change sampling order only; preserve all staff authorization, bank/course,
-- exact-count, option-validity and duplicate-exclusion checks in the live RPC.
DO $$ DECLARE definition text; revised text;
BEGIN
 definition:=pg_get_functiondef('generate_test_section_questions(uuid,uuid,integer,uuid,uuid)'::regprocedure);
 revised:=replace(definition,'ORDER BY q.code,q.id','ORDER BY random(),q.id');
 IF revised=definition THEN
  IF position('ORDER BY random(),q.id' IN definition)=0 THEN
   RAISE EXCEPTION 'Question generator ordering does not match inspected definition';
  END IF;
 ELSE EXECUTE revised;
 END IF;
END $$;
COMMIT;
