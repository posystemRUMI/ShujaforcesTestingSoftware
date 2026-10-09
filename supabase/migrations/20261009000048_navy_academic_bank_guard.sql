BEGIN;
DO $$ DECLARE definition text; updated text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='exam_validate_test';
 updated:=replace(definition,
 'ELSIF s.section_code=''ACADEMIC_PN_CADET'' OR s.name ILIKE ''%Academic%'' THEN',
 'ELSIF s.section_code=''ACADEMIC_PN_CADET'' OR s.name ILIKE ''%Academic%'' THEN
    IF EXISTS(SELECT 1 FROM test_section_questions x JOIN questions q ON q.id=x.question_id JOIN subjects sub ON sub.id=q.subject_id WHERE x.test_section_id=s.id AND (sub.category<>''ACADEMIC'' OR q.bank_key<>''PN-CADET-A'')) THEN RAISE EXCEPTION ''PN Cadet Academic can only use its designated Academic bank''; END IF;');
 IF updated=definition THEN RAISE EXCEPTION 'Expected Navy validation branch missing'; END IF;
 EXECUTE updated;
 SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='save_pn_cadet_test_pattern';
 updated:=replace(definition,'IF p_template->>''id''<>','IF p_template->>''id'' IS DISTINCT FROM ');
 updated:=replace(updated,'OR p_template->>''entryCourseId''<>','OR p_template->>''entryCourseId'' IS DISTINCT FROM ');
 updated:=replace(updated,'IF saved IS NULL THEN RAISE EXCEPTION ''PN Cadet pattern is missing''; END IF;',
 'IF saved IS NULL THEN RAISE EXCEPTION ''PN Cadet pattern is missing''; END IF;
 IF sections IS DISTINCT FROM saved->''sections'' OR p_template->''isDefault'' IS DISTINCT FROM saved->''isDefault'' OR p_template->''isActive'' IS DISTINCT FROM saved->''isActive'' THEN RAISE EXCEPTION ''The designated Navy section specifications are fixed; name, description, stage and version can be updated''; END IF;');
 EXECUTE updated;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
