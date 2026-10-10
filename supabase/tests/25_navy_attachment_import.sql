-- Persisted bank and actual builder/backend verification; test writes roll back.
BEGIN;
CREATE TEMP TABLE navy_attachment_checks(name text,passed boolean);
DO $$
DECLARE staff uuid; course courses%ROWTYPE; response jsonb; ids uuid[]; cfg jsonb; t tests%ROWTYPE;
BEGIN
 SELECT * INTO course FROM courses WHERE code='PN_CADET';
 IF (SELECT count(*) FROM question_import_items WHERE import_key='NAVY-ACADEMIC-ATTACHMENT-20261010')<>749 OR
 (SELECT count(*) FROM question_import_items WHERE import_key='NAVY-ACADEMIC-ATTACHMENT-20261010' AND source_payload->>'status'='INSERT')<>534 OR
 (SELECT count(*) FROM question_import_items WHERE import_key='NAVY-ACADEMIC-ATTACHMENT-20261010' AND source_payload->>'status' LIKE 'DUPLICATE_%')<>215 OR
 EXISTS(SELECT 1 FROM question_import_items WHERE import_key='NAVY-ACADEMIC-ATTACHMENT-20261010' AND source_ref='Entry 475') THEN RAISE EXCEPTION 'Source/duplicate/exclusion accounting failed'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i JOIN questions q ON q.id=i.question_id WHERE i.import_key='NAVY-ACADEMIC-ATTACHMENT-20261010' AND i.source_payload->>'status'='INSERT' AND (
 q.bank_key<>'PN-CADET-A' OR q.status<>'APPROVED' OR q.stem<>i.source_payload#>>'{source,stem}' OR q.explanation<>i.source_payload#>>'{source,explanation}' OR
 (SELECT count(*) FROM question_options o WHERE o.question_id=q.id)<>4 OR
 (SELECT count(*) FROM question_options o WHERE o.question_id=q.id AND o.is_correct)<>1 OR
 (SELECT count(*) FROM question_courses qc WHERE qc.question_id=q.id)<>1 OR
 NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=course.id))) THEN RAISE EXCEPTION 'Bank, mappings or exact text/explanation failed'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i CROSS JOIN LATERAL jsonb_array_elements(i.source_payload#>'{source,options}') choice LEFT JOIN question_options o ON o.question_id=i.question_id AND o.label=choice->>'label'
 WHERE i.import_key='NAVY-ACADEMIC-ATTACHMENT-20261010' AND i.source_payload->>'status'='INSERT' AND (o.id IS NULL OR o.text<>choice->>'text' OR o.is_correct<>(choice->>'is_correct')::boolean)) THEN RAISE EXCEPTION 'Supplied choice/key mismatch'; END IF;
 INSERT INTO navy_attachment_checks VALUES('749 completed accounted: 534 inserted, 215 exact duplicates skipped; Entry 475 excluded',true);
 INSERT INTO navy_attachment_checks VALUES('Every inserted statement/condition, four options, key, explanation and PN-only Academic mapping persisted exactly',true);
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 response:=get_staff_question_bank(course.force_id,course.id,'ACADEMIC',NULL,'','ALL',1,50);
 IF (response->>'total')::integer<>1283 OR jsonb_array_length(response->'questions')<>50 THEN RAISE EXCEPTION 'Bank totals/pagination failed'; END IF;
 response:=get_staff_question_bank(course.force_id,course.id,'ACADEMIC',NULL,'','ALL',26,50);
 IF jsonb_array_length(response->'questions')<>33 THEN RAISE EXCEPTION 'Last page failed'; END IF;
 response:=get_staff_question_bank(course.force_id,course.id,'ACADEMIC',NULL,'PN-CADET-A-Q1283','ALL',1,100);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(response->'questions') q WHERE q->>'code'='PN-CADET-A-Q1283') THEN RAISE EXCEPTION 'Last code not searchable'; END IF;
 INSERT INTO navy_attachment_checks VALUES('Actual staff question-bank course/bank filters, 1283 total, final page and last-code search',true);
 SELECT array_agg(question_id ORDER BY source_ref) INTO ids FROM (SELECT question_id,source_ref FROM question_import_items WHERE import_key='NAVY-ACADEMIC-ATTACHMENT-20261010' AND source_payload->>'status'='INSERT' ORDER BY source_ref LIMIT 3) picked;
 cfg:=jsonb_build_object('test',jsonb_build_object('name','Navy attachment selection rollback QA','duration_minutes',7,'passing_threshold',60),'eligibilities',jsonb_build_array(jsonb_build_object('force_id',course.force_id,'course_id',course.id)),
 'sections',jsonb_build_array(jsonb_build_object('name','Academic','section_code','ACADEMIC_PN_CADET','position',1,'question_count',3,'duration_minutes',7,'subject_ids',(SELECT jsonb_agg(DISTINCT subject_id) FROM questions WHERE id=ANY(ids)),'question_ids',to_jsonb(ids))));
 t:=save_test_blueprint(cfg);
 IF (SELECT count(*) FROM test_section_questions tsq JOIN test_sections ts ON ts.id=tsq.test_section_id WHERE ts.test_id=t.id AND tsq.question_id=ANY(ids))<>3 THEN RAISE EXCEPTION 'Builder selected questions not saved'; END IF;
 INSERT INTO navy_attachment_checks VALUES('Actual builder blueprint backend accepts and saves three imported Navy Academic questions',true);
END $$;
SELECT * FROM navy_attachment_checks;
ROLLBACK;
