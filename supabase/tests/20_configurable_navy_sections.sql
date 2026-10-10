-- Exercise real approved questions and hosted writers; leave no QA data behind.
BEGIN;
CREATE TEMP TABLE configurable_navy_checks(name text,passed boolean);
DO $$
DECLARE staff uuid; c courses%ROWTYPE; uid uuid:=gen_random_uuid(); student uuid;
 cfg jsonb; default_cfg jsonb; default_sections jsonb; pattern jsonb; sections jsonb:='[]'; qids uuid[]; s record;
 t tests%ROWTYPE; aid uuid; payload jsonb; part jsonb; q jsonb; result jsonb;
 option_id uuid; deadline timestamptz; timer attempt_section_progress%ROWTYPE;
 denied boolean; bank text; total integer:=0;
BEGIN
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 SELECT * INTO c FROM courses WHERE code='PN_CADET';
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 SELECT configuration||jsonb_build_object('id',course_id,'entryCourseId',course_id,'forceId',force_id)
 INTO pattern FROM course_test_patterns WHERE course_id=c.id;
 IF ARRAY(SELECT (value->>'defaultQuestionCount')::integer FROM jsonb_array_elements(pattern->'sections'))<>ARRAY[25,15,40]
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(pattern->'sections') x WHERE NOT (x->>'teacherCanOverrideQuestionCount')::boolean OR NOT (x->>'teacherCanOverrideDuration')::boolean) THEN RAISE EXCEPTION 'Editable defaults incorrect'; END IF;
 INSERT INTO configurable_navy_checks VALUES('Three editable database defaults: 25 Verbal, 15 Non-Verbal, 40 Academic',true);
 PERFORM save_pn_cadet_test_pattern(jsonb_set(jsonb_set(pattern,'{sections,0,defaultQuestionCount}','27'),'{sections,0,defaultDurationMinutes}','30'));
 IF (SELECT configuration#>>'{sections,0,defaultQuestionCount}' FROM course_test_patterns WHERE course_id=c.id)<>'27' THEN RAISE EXCEPTION 'Custom master defaults not saved'; END IF;
 PERFORM save_pn_cadet_test_pattern(pattern);
 INSERT INTO configurable_navy_checks VALUES('Authorized master-pattern writer persists custom defaults',true);
 FOR s IN SELECT * FROM (VALUES ('VERBAL_PN_CADET','Verbal Intelligence','v',1,27,30),('NON_VERBAL_PN_CADET','Non-Verbal Intelligence','nv',2,17,45),('ACADEMIC_PN_CADET','Academic','PN-CADET-A',3,41,60)) x(code,name,bank,position,questions,minutes) LOOP
  SELECT array_agg(id ORDER BY code) INTO qids FROM (SELECT id,code FROM questions WHERE bank_key=s.bank AND status='APPROVED' AND exam_question_course_eligible(id,c.id) ORDER BY code LIMIT s.questions) x;
  IF cardinality(qids) IS DISTINCT FROM s.questions THEN RAISE EXCEPTION 'Approved bank % lacks % questions',s.bank,s.questions; END IF;
  sections:=sections||jsonb_build_array(jsonb_build_object('name',s.name,'section_code',s.code,'position',s.position,'question_count',s.questions,'duration_minutes',s.minutes,'subject_ids',(SELECT jsonb_agg(DISTINCT subject_id) FROM questions WHERE id=ANY(qids)),'question_ids',to_jsonb(qids)));
  total:=total+s.questions;
 END LOOP;
 cfg:=jsonb_build_object('test',jsonb_build_object('name','Navy configurable rollback verification','duration_minutes',135,'passing_threshold',60,'show_result_immediately',true,'show_answer_review',true),'eligibilities',jsonb_build_array(jsonb_build_object('force_id',c.force_id,'course_id',c.id)),'sections',sections);
 t:=save_test_blueprint(cfg);
 IF t.duration_minutes<>135 OR (SELECT array_agg(question_count ORDER BY position) FROM test_sections WHERE test_id=t.id)<>ARRAY[27,17,41]
  OR (SELECT array_agg(duration_minutes ORDER BY position) FROM test_sections WHERE test_id=t.id)<>ARRAY[30,45,60] THEN RAISE EXCEPTION 'Configured blueprint values changed'; END IF;
 INSERT INTO configurable_navy_checks VALUES('Published exact custom counts 27/17/41 and minutes 30/45/60 through real backend',true);
 SELECT jsonb_agg(x.value||jsonb_build_object('question_count',(pattern->'sections'->(x.n::integer-1)->>'defaultQuestionCount')::integer,'duration_minutes',25,
  'question_ids',(SELECT jsonb_agg(q.value ORDER BY q.n) FROM jsonb_array_elements(x.value->'question_ids') WITH ORDINALITY q(value,n)
   WHERE q.n<=(pattern->'sections'->(x.n::integer-1)->>'defaultQuestionCount')::integer)) ORDER BY x.n)
 INTO default_sections FROM jsonb_array_elements(sections) WITH ORDINALITY x(value,n);
 default_cfg:=jsonb_set(jsonb_set(cfg,'{test,duration_minutes}','75'),'{sections}',default_sections);
 PERFORM save_test_blueprint(default_cfg);
 INSERT INTO configurable_navy_checks VALUES('Default 25/15/40 blueprint publishes exactly 80 approved questions',true);
 denied:=false; BEGIN PERFORM save_test_blueprint(jsonb_set(cfg,'{sections,0,question_count}','26')); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Mismatched question count accepted'; END IF;
 denied:=false; BEGIN PERFORM save_test_blueprint(jsonb_set(cfg,'{sections,0,section_code}','ACADEMIC_PN_CADET')); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Disguised bank accepted'; END IF;
 denied:=false; BEGIN PERFORM save_test_blueprint(jsonb_set(cfg,'{sections,0,duration_minutes}','0')); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Zero section duration accepted'; END IF;
 INSERT INTO configurable_navy_checks VALUES('Backend rejects count mismatch, wrong bank and zero timing',true);
 INSERT INTO auth.users(id,email) VALUES(uid,uid||'@navy-rollback.invalid');
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 result:=portal_register_student(uid,staff,jsonb_build_object('email',uid||'@navy-rollback.invalid','fullName','Navy rollback registration','fatherName','Fixture','cnic','9919988776655','phone','03001234567','targetForceId',c.force_id,'targetCourseId',c.id,'rollNumber','SFA-NAVY-'||(SELECT last_issued+1 FROM student_roll_counters WHERE prefix='SFA-NAVY'),'education','Intermediate','gender','Male','courseFeeAmount',0,'initialPaymentAmount',0,'paymentMethod','CASH'));
 IF NOT (result->>'success')::boolean THEN RAISE EXCEPTION 'Backend registration failed'; END IF;
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);student:=portal_student_id();
 IF NOT EXISTS(SELECT 1 FROM portal_pending(student) WHERE id=t.id) THEN RAISE EXCEPTION 'Navy auto eligibility missing'; END IF;
 result:=start_test_attempt(t.id);aid:=(result->>'attempt_id')::uuid;
 payload:=get_safe_exam_payload(aid);deadline:=(payload#>>'{attempt,expires_at}')::timestamptz;
 IF extract(epoch FROM (deadline-(payload#>>'{attempt,started_at}')::timestamptz))<>8100
  OR payload::text LIKE '%is_correct%' OR payload::text LIKE '%explanation%' THEN RAISE EXCEPTION 'Timer total or key privacy failed'; END IF;
 FOR part IN SELECT value FROM jsonb_array_elements(payload->'sections') LOOP
  IF jsonb_array_length(part->'questions')<>(part->>'question_count')::integer THEN RAISE EXCEPTION 'Exam question count mismatch'; END IF;
  IF (part->>'id')::uuid<>(SELECT current_section_id FROM test_attempts WHERE id=aid) THEN PERFORM advance_section(aid,(part->>'id')::uuid); END IF;
  SELECT * INTO timer FROM attempt_section_progress WHERE attempt_id=aid AND section_id=(part->>'id')::uuid;
  IF extract(epoch FROM(timer.expires_at-timer.started_at))<>(part->>'duration_minutes')::integer*60 THEN RAISE EXCEPTION 'Independent section timer mismatch'; END IF;
  PERFORM start_test_attempt(t.id);
  IF (SELECT expires_at FROM attempt_section_progress WHERE attempt_id=aid AND section_id=timer.section_id)<>timer.expires_at OR (SELECT expires_at FROM test_attempts WHERE id=aid)<>deadline THEN RAISE EXCEPTION 'Resume reset timer'; END IF;
  FOR q IN SELECT value FROM jsonb_array_elements(part->'questions') LOOP
   SELECT id INTO option_id FROM question_options WHERE question_id=(q->>'id')::uuid AND is_correct;
   PERFORM save_answer(aid,(q->>'id')::uuid,option_id,false);
  END LOOP;
 END LOOP;
 result:=submit_test_attempt(aid);
 IF (SELECT count(*) FROM attempt_answers WHERE attempt_id=aid)<>total OR NOT EXISTS(SELECT 1 FROM test_results WHERE attempt_id=aid AND total_questions=total AND marks_obtained=total AND jsonb_array_length(section_results)=3) THEN RAISE EXCEPTION 'Complete submission not saved'; END IF;
 IF (SELECT completed_tests FROM student_performance WHERE student_id=student)<>1 THEN RAISE EXCEPTION 'Dashboard not updated'; END IF;
 INSERT INTO configurable_navy_checks VALUES('New Navy student eligibility, exact runner counts, independent timers and resume persistence',true);
 INSERT INTO configurable_navy_checks VALUES('All 85 answers, three section results, marks and dashboard completion persist',true);
 denied:=false; BEGIN PERFORM save_pn_cadet_test_pattern(pattern); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Student wrote staff pattern'; END IF;
 INSERT INTO configurable_navy_checks VALUES('Student cannot update staff pattern; active exam keys remain hidden',true);
END $$;
SELECT * FROM configurable_navy_checks;
ROLLBACK;
