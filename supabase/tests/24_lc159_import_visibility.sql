-- Verify saved import records and real student exam RPCs; QA writes roll back.
BEGIN;
CREATE TEMP TABLE lc159_checks(name text,passed boolean);
DO $$
DECLARE staff uuid; uid uuid:=gen_random_uuid(); c courses%ROWTYPE; v uuid; ac uuid[];
 cfg jsonb; t tests%ROWTYPE; r jsonb; aid uuid; p jsonb; section jsonb; question jsonb; option_id uuid; snapshot jsonb;
BEGIN
 IF (SELECT count(*) FROM question_import_items WHERE import_key='LC159-20261010-practice-preparation')<>44 OR (SELECT count(*) FROM question_import_items WHERE import_key='LC159-20261010-practice-preparation' AND status='APPLIED')<>42 OR (SELECT count(*) FROM question_import_items WHERE import_key='LC159-20261010-practice-preparation' AND status='REVIEW_REQUIRED' AND question_id IS NULL)<>2 THEN RAISE EXCEPTION 'Source accounting/review hold incorrect'; END IF;
 SELECT * INTO c FROM courses WHERE code='PMA_LONG_COURSE';
 IF EXISTS(SELECT 1 FROM question_import_items i JOIN questions q ON q.id=i.question_id WHERE i.import_key='LC159-20261010-practice-preparation' AND (q.bank_key<>i.source_payload->>'bank_key' OR q.status<>'APPROVED' OR NOT 'LC-159'=ANY(q.tags) OR q.source_label<>'LC-159 · '||(i.source_payload->>'provenance') OR q.explanation<>i.source_payload->>'explanation' OR q.stem<>i.source_payload->>'stem' OR (SELECT count(*) FROM question_options o WHERE o.question_id=q.id)<>4 OR (SELECT count(*) FROM question_options o WHERE o.question_id=q.id AND o.is_correct)<>1 OR NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=c.id))) THEN RAISE EXCEPTION 'Imported bank, tag, explanation, status or structure mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i JOIN questions q ON q.id=i.question_id JOIN question_courses qc ON qc.question_id=q.id WHERE i.import_key='LC159-20261010-practice-preparation' AND q.bank_key='PMA-LC-A' AND qc.course_id<>c.id) THEN RAISE EXCEPTION 'Academic mapped to another course'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i CROSS JOIN LATERAL jsonb_array_elements(i.source_payload->'options') opt LEFT JOIN question_options o ON o.question_id=i.question_id AND o.label=opt->>'label' WHERE i.import_key='LC159-20261010-practice-preparation' AND i.status='APPLIED' AND (o.id IS NULL OR o.text<>opt->>'text' OR o.is_correct<>(opt->>'is_correct')::boolean)) THEN RAISE EXCEPTION 'Supplied options/key not preserved'; END IF;
 INSERT INTO lc159_checks VALUES('44 accounted for: 42 applied, 2 held; exact options, keys, explanations, tags and bank/course mappings',true);
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 r:=get_staff_question_bank(c.force_id,c.id,'v',NULL,'LC-159','ALL',1,100);
 -- Search implementations may search code/stem rather than tags; verify by codes.
 SELECT question_id INTO v FROM question_import_items WHERE import_key='LC159-20261010-practice-preparation' AND source_ref='V1';
 r:=get_staff_question_bank(c.force_id,c.id,'v',NULL,(SELECT code FROM questions WHERE id=v),'ALL',1,100);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r->'questions') x WHERE x->>'id'=v::text AND x->>'source_label' LIKE 'LC-159 · Practice%') THEN RAISE EXCEPTION 'Staff catalog missing persistent provenance'; END IF;
 SELECT array_agg(question_id ORDER BY source_ref) INTO ac FROM question_import_items WHERE import_key='LC159-20261010-practice-preparation' AND source_ref IN('A3','A10');
 cfg:=jsonb_build_object('test',jsonb_build_object('name','LC159 provenance rollback QA','duration_minutes',5,'passing_threshold',60,'show_result_immediately',true,'show_answer_review',true),'eligibilities',jsonb_build_array(jsonb_build_object('force_id',c.force_id,'course_id',c.id)),'sections',jsonb_build_array(
 jsonb_build_object('name','Verbal Intelligence','section_code','VERBAL_PMA','position',1,'question_count',1,'duration_minutes',2,'subject_ids',jsonb_build_array((SELECT subject_id FROM questions WHERE id=v)),'question_ids',to_jsonb(ARRAY[v])),
 jsonb_build_object('name','Academic','section_code','ACADEMIC_PMA','position',2,'question_count',2,'duration_minutes',3,'subject_ids',(SELECT jsonb_agg(DISTINCT subject_id) FROM questions WHERE id=ANY(ac)),'question_ids',to_jsonb(ac))));
 t:=save_test_blueprint(cfg);
 INSERT INTO auth.users(id,email) VALUES(uid,uid||'@lc159-provenance-rollback.invalid');
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 r:=portal_register_student(uid,staff,jsonb_build_object('email',uid||'@lc159-provenance-rollback.invalid','fullName','LC159 provenance QA','fatherName','Fixture','cnic','9919988776655','phone','03001234567','targetForceId',c.force_id,'targetCourseId',c.id,'rollNumber','SFA-PMA-'||(SELECT last_issued+1 FROM student_roll_counters WHERE prefix='SFA-PMA'),'education','Intermediate','gender','Male','courseFeeAmount',0,'initialPaymentAmount',0,'paymentMethod','CASH'));
 IF NOT (r->>'success')::boolean THEN RAISE EXCEPTION 'QA registration failed'; END IF;
 PERFORM set_config('request.jwt.claim.role','authenticated',true);PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 r:=start_test_attempt(t.id);aid:=(r->>'attempt_id')::uuid;p:=get_safe_exam_payload(aid);
 IF p::text LIKE '%is_correct%' OR p::text LIKE '%explanation%' OR p::text LIKE '%answer_keys%' THEN RAISE EXCEPTION 'Active exam answer leak'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(p->'sections') s CROSS JOIN LATERAL jsonb_array_elements(s->'questions') q WHERE q->>'source_label' LIKE 'LC-159 · %')<>3 OR p::text NOT LIKE '%LC-159 preparation%' OR p::text NOT LIKE '%Practice — based on LC-159 reported topics%' THEN RAISE EXCEPTION 'Active exam provenance missing'; END IF;
 SELECT payload INTO snapshot FROM exam_attempt_snapshots WHERE attempt_id=aid;
 PERFORM start_test_attempt(t.id);
 IF (SELECT payload FROM exam_attempt_snapshots WHERE attempt_id=aid) IS DISTINCT FROM snapshot THEN RAISE EXCEPTION 'Resume changed provenance snapshot'; END IF;
 INSERT INTO lc159_checks VALUES('New PMA registration eligible; active student payload and immutable resume snapshot contain tag/provenance without keys',true);
 FOR section IN SELECT value FROM jsonb_array_elements(p->'sections') LOOP
  IF (section->>'id')::uuid<>(SELECT current_section_id FROM test_attempts WHERE id=aid) THEN PERFORM advance_section(aid,(section->>'id')::uuid); END IF;
  FOR question IN SELECT value FROM jsonb_array_elements(section->'questions') LOOP
   SELECT id INTO option_id FROM question_options WHERE question_id=(question->>'id')::uuid AND is_correct;
   PERFORM save_answer(aid,(question->>'id')::uuid,option_id,false);
  END LOOP;
 END LOOP;
 r:=submit_test_attempt(aid);p:=get_result_detail((r->>'result_id')::uuid);
 IF (SELECT count(*) FROM jsonb_array_elements(p->'sections') s CROSS JOIN LATERAL jsonb_array_elements(s->'questions') q WHERE q->>'source_label' LIKE 'LC-159 · %' AND coalesce(q->>'explanation','')<>'')<>3 THEN RAISE EXCEPTION 'Submitted review provenance/explanation missing'; END IF;
 INSERT INTO lc159_checks VALUES('Submission/review preserves tag, correct answers and explanations through existing backend',true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM question_import_items) THEN RAISE EXCEPTION 'Student can read staff import/review payloads'; END IF; END $$;
RESET ROLE;
INSERT INTO lc159_checks VALUES('RLS hides import payloads and disputed review items from students',true);
SELECT * FROM lc159_checks;
ROLLBACK;
