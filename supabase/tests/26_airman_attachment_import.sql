-- Verify the real hosted bank and builder; every QA mutation rolls back.
BEGIN;
CREATE TEMP TABLE airman_attachment_checks(name text,passed boolean);
DO $$
DECLARE staff uuid; c courses%ROWTYPE; r jsonb; item record; ids uuid[]; cfg jsonb; t tests%ROWTYPE; sections jsonb:='[]'; position integer:=0;
 uid uuid:=gen_random_uuid(); aid uuid; payload jsonb;
BEGIN
 SELECT * INTO c FROM courses WHERE code='PAF_AIRMEN';
 IF (SELECT count(*) FROM question_import_items WHERE import_key='AIRMAN-ACADEMIC-ATTACHMENT-20261011')<>692 OR EXISTS(SELECT 1 FROM question_import_items WHERE import_key='AIRMAN-ACADEMIC-ATTACHMENT-20261011' AND source_payload->>'status'<>'INSERT') THEN RAISE EXCEPTION 'Import source accounting incorrect'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i JOIN questions q ON q.id=i.question_id WHERE i.import_key='AIRMAN-ACADEMIC-ATTACHMENT-20261011' AND (
 q.bank_key<>'PAF-AIRMEN-A' OR q.status<>'APPROVED' OR q.stem<>i.source_payload#>>'{source,stem}' OR q.explanation<>i.source_payload#>>'{source,explanation}' OR q.subject_id<>(i.source_payload#>>'{source,subject_id}')::uuid OR
 (SELECT count(*) FROM question_options o WHERE o.question_id=q.id)<>4 OR (SELECT count(*) FROM question_options o WHERE o.question_id=q.id AND o.is_correct)<>1 OR
 (SELECT count(*) FROM question_courses qc WHERE qc.question_id=q.id)<>1 OR NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=c.id))) THEN RAISE EXCEPTION 'Preserved text/key/subject or Airman-only mapping failed'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i CROSS JOIN LATERAL jsonb_array_elements(i.source_payload#>'{source,options}') choice LEFT JOIN question_options o ON o.question_id=i.question_id AND o.label=choice->>'label'
 WHERE i.import_key='AIRMAN-ACADEMIC-ATTACHMENT-20261011' AND (o.id IS NULL OR o.text<>choice->>'text' OR o.is_correct<>(choice->>'is_correct')::boolean)) THEN RAISE EXCEPTION 'Exact option preservation failed'; END IF;
 INSERT INTO airman_attachment_checks VALUES('All 692 exact statements/conditions, choices, keys, explanations and Airman-only mappings persisted',true);
 FOR item IN SELECT * FROM (VALUES('ACADEMIC_ENGLISH',305,'English','ENG_AIRMAN'),('ACADEMIC_PHYSICS',290,'Physics','PHYS_AIRMAN'),('ACADEMIC_MATH',97,'Mathematics','MATH_AIRMAN')) x(subject_code,expected,name,section_code) LOOP
  IF (SELECT count(*) FROM questions q JOIN subjects s ON s.id=q.subject_id WHERE q.bank_key='PAF-AIRMEN-A' AND s.code=item.subject_code)<>item.expected THEN RAISE EXCEPTION 'Subject counts failed'; END IF;
 END LOOP;
 INSERT INTO airman_attachment_checks VALUES('Existing subject mappings: 305 English, 290 Physics/related science, 97 Mathematics',true);
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 r:=get_staff_question_bank(c.force_id,c.id,'ACADEMIC',NULL,'','ALL',1,50);
 IF (r->>'total')::integer<>692 OR jsonb_array_length(r->'questions')<>50 THEN RAISE EXCEPTION 'Bank counts/pagination failed'; END IF;
 r:=get_staff_question_bank(c.force_id,c.id,'ACADEMIC',NULL,'','ALL',14,50);
 IF jsonb_array_length(r->'questions')<>42 THEN RAISE EXCEPTION 'Last page failed'; END IF;
 r:=get_staff_question_bank(c.force_id,c.id,'ACADEMIC',NULL,'PAF-AIRMEN-A-Q692','ALL',1,100);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(r->'questions') q WHERE q->>'code'='PAF-AIRMEN-A-Q692') THEN RAISE EXCEPTION 'Last code not searchable'; END IF;
 INSERT INTO airman_attachment_checks VALUES('Actual Air Force/Airman/Academic filter, totals, pagination and last-code search',true);
 FOR item IN SELECT * FROM (VALUES('ACADEMIC_ENGLISH','English','ENG_AIRMAN'),('ACADEMIC_PHYSICS','Physics','PHYS_AIRMAN'),('ACADEMIC_MATH','Mathematics','MATH_AIRMAN')) x(subject_code,name,section_code) LOOP
  SELECT array_agg(id ORDER BY code) INTO ids FROM (SELECT q.id,q.code FROM questions q JOIN subjects s ON s.id=q.subject_id WHERE q.bank_key='PAF-AIRMEN-A' AND s.code=item.subject_code ORDER BY q.code LIMIT 2) picked;
  position:=position+1;
  sections:=sections||jsonb_build_array(jsonb_build_object('name',item.name,'section_code',item.section_code,'position',position,'question_count',2,'duration_minutes',2,'subject_ids',jsonb_build_array((SELECT id FROM subjects WHERE code=item.subject_code)),'question_ids',to_jsonb(ids)));
 END LOOP;
 cfg:=jsonb_build_object('test',jsonb_build_object('name','Airman import rollback QA','duration_minutes',6,'passing_threshold',55,'show_result_immediately',true,'show_answer_review',true),'eligibilities',jsonb_build_array(jsonb_build_object('force_id',c.force_id,'course_id',c.id)),'sections',sections);
 t:=save_test_blueprint(cfg);
 IF (SELECT count(*) FROM test_section_questions q JOIN test_sections s ON s.id=q.test_section_id WHERE s.test_id=t.id)<>6 THEN RAISE EXCEPTION 'Builder questions not persisted'; END IF;
 INSERT INTO airman_attachment_checks VALUES('Actual test builder backend saves six imported questions across the three Airman Academic sections',true);
 INSERT INTO auth.users(id,email) VALUES(uid,uid||'@airman-import-rollback.invalid');
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 r:=portal_register_student(uid,staff,jsonb_build_object('email',uid||'@airman-import-rollback.invalid','fullName','Airman import QA','fatherName','Fixture','cnic','9919988776655','phone','03001234567','targetForceId',c.force_id,'targetCourseId',c.id,'rollNumber','SFA-PAF-'||(SELECT last_issued+1 FROM student_roll_counters WHERE prefix='SFA-PAF'),'education','Intermediate','gender','Male','courseFeeAmount',0,'initialPaymentAmount',0,'paymentMethod','CASH'));
 IF NOT (r->>'success')::boolean THEN RAISE EXCEPTION 'QA registration failed'; END IF;
 PERFORM set_config('request.jwt.claim.role','authenticated',true);PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 r:=start_test_attempt(t.id);aid:=(r->>'attempt_id')::uuid;payload:=get_safe_exam_payload(aid);
 IF (SELECT count(*) FROM jsonb_array_elements(payload->'sections') s CROSS JOIN LATERAL jsonb_array_elements(s->'questions') q)<>6 OR payload::text LIKE '%is_correct%' OR payload::text LIKE '%explanation%' THEN RAISE EXCEPTION 'Student visibility or key privacy failed'; END IF;
 INSERT INTO airman_attachment_checks VALUES('New Airman automatically eligible; student exam receives saved Academic selections without answer keys/explanations',true);
END $$;
SELECT * FROM airman_attachment_checks;
ROLLBACK;
