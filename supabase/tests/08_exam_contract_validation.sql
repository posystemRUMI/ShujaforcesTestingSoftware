-- All fixtures, including Auth rows and bank membership, are rolled back.
BEGIN;
CREATE TEMP TABLE exam_verification(check_name text,passed boolean,details jsonb);
DO $$
DECLARE admin_id uuid; c record; sub record; duration int; i int; n int:=0; qid uuid; opt uuid; qids uuid[]; old_uid uuid; new_uid uuid; sid uuid; uid uuid; tid uuid; sec uuid; aid uuid; payload jsonb; r jsonb; before_payload jsonb; deadline timestamptz; testdata tests%ROWTYPE; denied boolean; config jsonb; initial_count int;
BEGIN
 SELECT id INTO admin_id FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 FOR c IN SELECT id,force_id,code FROM courses WHERE code IN('PMA_LONG_COURSE','AFNS','GDP','PN_CADET') LOOP
 old_uid:=gen_random_uuid();
 INSERT INTO auth.users(id,email) VALUES(old_uid,old_uid||'@exam-fixture.invalid');
 INSERT INTO profiles(id,email,display_name,role) VALUES(old_uid,old_uid||'@exam-fixture.invalid','Old Exam Fixture','STUDENT') ON CONFLICT(id) DO UPDATE SET role='STUDENT';
 INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id) VALUES(old_uid,'EXAM-OLD-'||old_uid,'Fixture',c.force_id,c.id);
 FOR sub IN SELECT id,code FROM subjects WHERE code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL','ACADEMIC_ENGLISH') LOOP
 qids:='{}';
 FOR i IN 1..16 LOOP
 INSERT INTO questions(code,subject_id,difficulty,stem,status,author_id) VALUES('EXAM-FIXTURE-'||gen_random_uuid(),sub.id,'EASY','Isolated rollback question '||i,'APPROVED',admin_id) RETURNING id INTO qid;
 INSERT INTO question_courses(question_id,course_id) VALUES(qid,c.id);
 INSERT INTO question_options(question_id,option_key,label,text,is_correct) VALUES(qid,'A','A','Correct',true),(qid,'B','B','B',false),(qid,'C','C','C',false),(qid,'D','D','D',false);
 qids:=array_append(qids,qid);
 END LOOP;
 FOREACH duration IN ARRAY ARRAY[15,30,60] LOOP
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 config:=jsonb_build_object('test',jsonb_build_object('name','EXAM fixture '||c.code||' '||sub.code||' '||duration,'duration_minutes',duration,'passing_threshold',50,'shuffle_questions',true,'shuffle_options',true),
 'eligibilities',jsonb_build_array(jsonb_build_object('force_id',c.force_id,'course_id',c.id)),
 'sections',jsonb_build_array(jsonb_build_object('name',CASE sub.code WHEN 'INTELLIGENCE_VERBAL' THEN 'Verbal Intelligence' WHEN 'INTELLIGENCE_NON_VERBAL' THEN 'Non-Verbal Intelligence' ELSE 'Academic Test' END,'position',1,'question_count',16,'duration_minutes',duration,'subject_ids',jsonb_build_array(sub.id),'question_ids',to_jsonb(qids))));
 testdata:=save_test_blueprint(config);tid:=testdata.id;
 SELECT id INTO sec FROM test_sections WHERE test_id=tid;
 IF testdata.duration_minutes<>duration OR (SELECT count(*) FROM test_section_questions WHERE test_section_id=sec)<>16 THEN RAISE EXCEPTION 'Saved count/duration mismatch'; END IF;
 new_uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(new_uid,new_uid||'@exam-fixture.invalid');
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 r:=portal_register_student(new_uid,admin_id,jsonb_build_object('email',new_uid||'@exam-fixture.invalid','fullName','New Exam Fixture','fatherName','Fixture','cnic','990'||lpad((n+1)::text,10,'0'),'phone','03001234567','targetForceId',c.force_id,'targetCourseId',c.id,'rollNumber','EXAM-NEW-'||new_uid,'education','Intermediate','gender','Female','courseFeeAmount',0,'initialPaymentAmount',0,'paymentMethod','CASH'));
 IF NOT (r->>'success')::boolean THEN RAISE EXCEPTION 'New registration failed'; END IF;
 FOREACH uid IN ARRAY ARRAY[old_uid,new_uid] LOOP
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 sid:=portal_student_id();
 IF NOT EXISTS(SELECT 1 FROM portal_pending(sid) WHERE id=tid) THEN RAISE EXCEPTION 'Old/new eligibility missing'; END IF;
 r:=start_test_attempt(tid);aid:=(r->>'attempt_id')::uuid;
 payload:=get_safe_exam_payload(aid);deadline:=(payload#>>'{attempt,expires_at}')::timestamptz;
 IF jsonb_array_length(payload#>'{sections,0,questions}')<>16 OR extract(epoch FROM (deadline-(payload#>>'{attempt,started_at}')::timestamptz))<>duration*60 THEN RAISE EXCEPTION 'Payload count or exact timer mismatch'; END IF;
 IF payload::text LIKE '%is_correct%' OR payload::text LIKE '%correctOption%' OR payload::text LIKE '%answer_keys%' THEN RAISE EXCEPTION 'Answer key exposed'; END IF;
 before_payload:=payload;
 r:=start_test_attempt(tid);IF (r->>'attempt_id')::uuid<>aid OR (SELECT expires_at FROM test_attempts WHERE id=aid)<>deadline THEN RAISE EXCEPTION 'Resume reset timer'; END IF;
 FOR i IN 1..15 LOOP SELECT id INTO opt FROM question_options WHERE question_id=qids[i] AND is_correct;PERFORM save_answer(aid,qids[i],opt,i=1); END LOOP;
 -- One explicit cleared answer and one skipped: persisted count must remain 16.
 PERFORM save_answer(aid,qids[15],NULL,false);
 payload:=get_safe_exam_payload(aid);IF (payload#>>ARRAY['saved_answers',qids[1]::text,'marked_for_review'])::boolean IS DISTINCT FROM true THEN RAISE EXCEPTION 'Review state lost'; END IF;
 r:=submit_test_attempt(aid);
 IF (r->>'correct_count')::int<>14 OR (r->>'skipped_count')::int<>2 OR (SELECT count(*) FROM attempt_answers WHERE attempt_id=aid)<>16 OR NOT EXISTS(SELECT 1 FROM test_results WHERE attempt_id=aid AND total_questions=16 AND marks_obtained=14 AND max_marks=16 AND jsonb_array_length(section_results)=1) THEN RAISE EXCEPTION 'Complete submission mismatch'; END IF;
 IF NOT (submit_test_attempt(aid)->>'already_submitted')::boolean THEN RAISE EXCEPTION 'Submission not idempotent'; END IF;
 denied:=false;BEGIN PERFORM save_answer(aid,qids[1],NULL,false);EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Answer changed after submission'; END IF;
 END LOOP;
 n:=n+1;
 INSERT INTO exam_verification VALUES(c.code||' / '||sub.code||' / '||duration||' min / old + registered student',true,jsonb_build_object('questions',16,'minutes',duration,'answers_saved',16,'correct',14,'skipped',2));
 END LOOP;
 END LOOP;
 END LOOP;
 IF n<>36 THEN RAISE EXCEPTION 'Expected 36 configurations'; END IF;
 -- Reject malicious changed count and force/course mismatch atomically.
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 SELECT count(*) INTO initial_count FROM tests;
 denied:=false;BEGIN PERFORM save_test_blueprint(jsonb_set(config,'{sections,0,question_count}','17'));EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied OR (SELECT count(*) FROM tests)<>initial_count THEN RAISE EXCEPTION 'Failed count mutation not atomic'; END IF;
 INSERT INTO exam_verification VALUES('Exact count mismatch rejected and entire blueprint rolled back',true,'{}');
 denied:=false;BEGIN PERFORM save_test_blueprint(jsonb_set(config,'{eligibilities,0,force_id}',to_jsonb(CASE WHEN config#>>'{eligibilities,0,force_id}'='00000000-0000-0000-0000-000000000001' THEN '00000000-0000-0000-0000-000000000002' ELSE '00000000-0000-0000-0000-000000000001' END)));EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Wrong Force accepted'; END IF;
 INSERT INTO exam_verification VALUES('Wrong Force/course pair rejected',true,'{}');
END $$;
SET CONSTRAINTS ALL IMMEDIATE;
SELECT * FROM exam_verification;
ROLLBACK;


