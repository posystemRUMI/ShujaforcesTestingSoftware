-- Real hosted integration checks. All QA mutations and Auth fixtures roll back.
BEGIN;
CREATE TEMP TABLE paf_verbal_checks(name text,passed boolean);
DO $$
#variable_conflict use_column
DECLARE staff uuid; c courses%ROWTYPE; r jsonb; ids uuid[]; q questions%ROWTYPE; opts jsonb; t tests%ROWTYPE;
 cfg jsonb; uid uuid; aid uuid; payload jsonb; blocked boolean:=false;
BEGIN
 IF (SELECT count(*) FROM question_import_items WHERE import_key='PAF-VERBAL-ATTACHMENT-20261011')<>282 THEN RAISE EXCEPTION 'Source accounting failed'; END IF;
 IF (SELECT count(*) FROM question_import_items WHERE import_key='PAF-VERBAL-ATTACHMENT-20261011' AND source_payload->>'status'='INSERT')<>270 THEN RAISE EXCEPTION 'Insert count failed'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i JOIN questions q ON q.id=i.question_id WHERE i.import_key='PAF-VERBAL-ATTACHMENT-20261011' AND i.source_payload->>'status'='INSERT' AND (
 q.bank_key<>'v' OR q.subject_id<>'9f9debd0-3e40-4f38-9067-2d8005313de2' OR q.status<>'APPROVED' OR q.stem<>i.source_payload#>>'{source,stem}' OR q.explanation<>i.source_payload#>>'{source,explanation}' OR
 (SELECT count(*) FROM question_options WHERE question_id=q.id)<>4 OR (SELECT count(*) FROM question_options WHERE question_id=q.id AND is_correct)<>1 OR
 (SELECT count(*) FROM question_courses WHERE question_id=q.id)<>2 OR EXISTS(SELECT 1 FROM question_courses qc JOIN courses c ON c.id=qc.course_id WHERE qc.question_id=q.id AND c.code NOT IN('PAF_AIRMEN','PAF_CAE')))) THEN RAISE EXCEPTION 'Import preservation or isolation failed'; END IF;
 IF EXISTS(SELECT 1 FROM question_import_items i CROSS JOIN LATERAL jsonb_array_elements(i.source_payload#>'{source,options}') choice LEFT JOIN question_options o ON o.question_id=i.question_id AND o.label=choice->>'label'
 WHERE i.import_key='PAF-VERBAL-ATTACHMENT-20261011' AND i.source_payload->>'status'='INSERT' AND (o.id IS NULL OR o.text<>choice->>'text' OR o.is_correct<>(choice->>'is_correct')::boolean)) THEN RAISE EXCEPTION 'Option preservation failed'; END IF;
 INSERT INTO paf_verbal_checks VALUES('282 accounted for; 270 saved with exact options/keys/explanations and PAF-only Verbal mappings',true);
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 SELECT array_agg(question_id) INTO ids FROM (SELECT question_id FROM question_import_items WHERE import_key='PAF-VERBAL-ATTACHMENT-20261011' AND source_payload->>'status'='INSERT' ORDER BY source_ref LIMIT 2) picked;
 IF EXISTS(SELECT 1 FROM unnest(ids) qid CROSS JOIN courses c WHERE c.status='ACTIVE' AND exam_question_course_eligible(qid,c.id) IS DISTINCT FROM (c.code IN('PAF_AIRMEN','PAF_CAE'))) THEN RAISE EXCEPTION 'Backend force/course eligibility failed'; END IF;
 INSERT INTO paf_verbal_checks VALUES('Backend eligible for Airman/CAE and rejects Army/Navy',true);
 FOR c IN SELECT * FROM courses WHERE code IN('PAF_AIRMEN','PAF_CAE') LOOP
  PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
  r:=get_staff_question_bank(c.force_id,c.id,'v',NULL,'','ALL',1,50);
  IF (r->>'total')::int<>270 OR jsonb_array_length(r->'questions')<>50 THEN RAISE EXCEPTION 'PAF bank visibility failed: %',c.code; END IF;
  cfg:=jsonb_build_object('test',jsonb_build_object('name','PAF Verbal rollback QA','duration_minutes',2,'passing_threshold',55,'show_result_immediately',true,'show_answer_review',true),'eligibilities',jsonb_build_array(jsonb_build_object('force_id',c.force_id,'course_id',c.id)),
   'sections',jsonb_build_array(jsonb_build_object('name','Intelligence','section_code',CASE WHEN c.code='PAF_CAE' THEN 'INTEL_CAE' ELSE 'INTEL_AIRMAN' END,'position',1,'question_count',2,'duration_minutes',2,'subject_ids',jsonb_build_array('9f9debd0-3e40-4f38-9067-2d8005313de2'),'question_ids',to_jsonb(ids))));
  t:=save_test_blueprint(cfg);
  IF (SELECT count(*) FROM test_section_questions q JOIN test_sections s ON s.id=q.test_section_id WHERE s.test_id=t.id)<>2 THEN RAISE EXCEPTION 'Builder persistence failed'; END IF;
  uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(uid,uid||'@paf-verbal-rollback.invalid');
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  r:=portal_register_student(uid,staff,jsonb_build_object('email',uid||'@paf-verbal-rollback.invalid','fullName','PAF Verbal QA','fatherName','Fixture','cnic',CASE WHEN c.code='PAF_CAE' THEN '9929988776611' ELSE '9929988776622' END,'phone','03001234567','targetForceId',c.force_id,'targetCourseId',c.id,'rollNumber','SFA-PAF-'||(SELECT last_issued+1 FROM student_roll_counters WHERE prefix='SFA-PAF'),'education','Intermediate','gender','Male','courseFeeAmount',0,'initialPaymentAmount',0,'paymentMethod','CASH'));
  IF NOT (r->>'success')::boolean THEN RAISE EXCEPTION 'QA registration failed'; END IF;
  PERFORM set_config('request.jwt.claim.role','authenticated',true);PERFORM set_config('request.jwt.claim.sub',uid::text,true);
  r:=start_test_attempt(t.id);aid:=(r->>'attempt_id')::uuid;payload:=get_safe_exam_payload(aid);
  IF (SELECT count(*) FROM jsonb_array_elements(payload->'sections') s CROSS JOIN LATERAL jsonb_array_elements(s->'questions'))<>2 OR payload::text LIKE '%is_correct%' OR payload::text LIKE '%explanation%' THEN RAISE EXCEPTION 'Student payload visibility/privacy failed'; END IF;
  INSERT INTO paf_verbal_checks VALUES(c.name||': bank filter, real builder save, fresh registration and safe student exam',true);
 END LOOP;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 SELECT * INTO q FROM questions WHERE id=ids[1];
 SELECT jsonb_agg(jsonb_build_object('label',label,'text',text,'is_correct',is_correct)) INTO opts FROM question_options WHERE question_id=q.id;
 PERFORM admin_upsert_question(q.id,q.code,q.subject_id,q.difficulty,q.stem,q.stem_image_url,q.explanation,q.time_limit_seconds,q.status,q.tags,ARRAY(SELECT course_id FROM question_courses WHERE question_id=q.id),opts);
 IF (SELECT count(*) FROM question_courses WHERE question_id=q.id)<>2 OR EXISTS(SELECT 1 FROM question_courses qc JOIN courses c ON c.id=qc.course_id WHERE qc.question_id=q.id AND c.code NOT IN('PAF_CAE','PAF_AIRMEN')) THEN RAISE EXCEPTION 'Editor added non-PAF mapping'; END IF;
 BEGIN
  PERFORM admin_upsert_question(q.id,q.code,q.subject_id,q.difficulty,q.stem,q.stem_image_url,q.explanation,q.time_limit_seconds,q.status,q.tags,ARRAY['00000000-0000-0000-0000-000000000101'::uuid],opts);
 EXCEPTION WHEN OTHERS THEN blocked:=SQLERRM LIKE '%PAF-only Verbal%'; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Foreign course edit not rejected'; END IF;
 INSERT INTO paf_verbal_checks VALUES('Editing imported records preserves PAF-only mappings and rejects foreign courses',true);
END $$;
SELECT * FROM paf_verbal_checks;
ROLLBACK;
