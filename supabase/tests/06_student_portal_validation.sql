-- Fixtures exist only inside this transaction. Never commit this file.
BEGIN;
CREATE TEMP TABLE portal_test_report(check_name text,passed boolean);
CREATE FUNCTION pg_temp.portal_reject_test_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF current_setting('portal.fixture.reject',true)='yes' THEN RAISE EXCEPTION 'Injected isolated result-save failure'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER portal_fixture_fail_submission BEFORE INSERT ON test_results FOR EACH ROW EXECUTE FUNCTION pg_temp.portal_reject_test_result();
DO $$
DECLARE admin_id uuid; uid uuid; sid uuid; course record; tid uuid; section_id uuid; qid uuid; aid uuid; attempt uuid; result jsonb; snap jsonb;
 students_ids uuid[]:='{}'; user_ids uuid[]:='{}'; test_ids uuid[]:='{}'; i integer; other uuid; peer uuid; second_test uuid; repeat_attempt uuid; board jsonb; denied boolean; payment jsonb; fee_account uuid; option_id uuid;
BEGIN
 SELECT id INTO admin_id FROM profiles WHERE role='ADMIN' LIMIT 1;
 IF admin_id IS NULL THEN RAISE EXCEPTION 'Admin required'; END IF;
 SELECT q.id INTO qid FROM questions q JOIN subjects sub ON sub.id=q.subject_id WHERE q.status='APPROVED' AND sub.code='INTELLIGENCE_VERBAL' LIMIT 1;
 IF qid IS NULL THEN RAISE EXCEPTION 'Approved question required'; END IF;
 FOR course IN SELECT DISTINCT ON (case when c.code='AFNS' then 'AFNS' else f.code end) c.id,c.force_id,c.code
 FROM courses c JOIN forces f ON f.id=c.force_id WHERE c.code IN('AFNS','PMA_LONG_COURSE','GDP','PN_CADET') ORDER BY case when c.code='AFNS' then 'AFNS' else f.code end LOOP
 uid:=gen_random_uuid();
 INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(uid,uid||'@portal-fixture.invalid',jsonb_build_object('display_name','Portal fixture','role','STUDENT'));
 INSERT INTO profiles(id,email,display_name,role) VALUES(uid,uid||'@portal-fixture.invalid','Portal fixture','STUDENT') ON CONFLICT(id) DO UPDATE SET role='STUDENT',display_name='Portal fixture';
 INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id) VALUES(uid,'QA-'||uid,'Fixture father',course.force_id,course.id) RETURNING id INTO sid;
 INSERT INTO tests(name,force_id,course_id,created_by,status,total_marks,duration_minutes) VALUES('Portal fixture '||course.code,course.force_id,course.id,admin_id,'DRAFT',10,30) RETURNING id INTO tid;
 INSERT INTO test_eligible_courses(test_id,course_id,force_id) VALUES(tid,course.id,course.force_id);
 -- Explicit intelligence bank membership exists only inside this rollback fixture.
 INSERT INTO question_courses(question_id,course_id) VALUES(qid,course.id) ON CONFLICT DO NOTHING;
 INSERT INTO test_sections(test_id,name,position,question_count,duration_minutes) VALUES(tid,'Fixture',1,1,30) RETURNING id INTO section_id;
 UPDATE test_sections SET marks_per_question=10,subject_id=(SELECT subject_id FROM questions WHERE id=qid) WHERE id=section_id;
 INSERT INTO test_section_subjects(test_section_id,subject_id) SELECT section_id,subject_id FROM questions WHERE id=qid;
 INSERT INTO test_section_questions(test_section_id,question_id,position,marks) VALUES(section_id,qid,1,10);
 UPDATE tests SET status='PUBLISHED',published_by=admin_id WHERE id=tid;
 students_ids:=array_append(students_ids,sid); user_ids:=array_append(user_ids,uid);test_ids:=array_append(test_ids,tid);
 END LOOP;
 IF cardinality(students_ids)<>4 THEN RAISE EXCEPTION 'All four cohorts required'; END IF;
 FOR i IN 1..4 LOOP
 PERFORM set_config('request.jwt.claim.sub',user_ids[i]::text,true);
 snap:=student_portal_snapshot();
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(snap->'assigned_tests') e WHERE e->>'id'=test_ids[i]::text) THEN RAISE EXCEPTION 'Missing eligible assignment'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(snap->'assigned_tests') e WHERE (e->>'id')::uuid=ANY(test_ids) AND e->>'id'<>test_ids[i]::text) THEN RAISE EXCEPTION 'Cross-force assignment'; END IF;
 denied:=false;
 BEGIN PERFORM start_test_attempt(test_ids[case when i=4 then 1 else i+1 end]); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Direct start bypass'; END IF;
 denied:=false;
 BEGIN PERFORM student_portal_leaderboard(test_ids[case when i=4 then 1 else i+1 end]); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Test leaderboard bypass'; END IF;
 END LOOP;
 INSERT INTO portal_test_report VALUES('Army / AFNS / Air Force / Navy isolation and direct start/leaderboard denial',true);

 PERFORM set_config('request.jwt.claim.sub',user_ids[1]::text,true); sid:=students_ids[1];tid:=test_ids[1];
 result:=start_test_attempt(tid);attempt:=(result->>'attempt_id')::uuid;
 IF (SELECT student_id FROM test_assignments WHERE id=(SELECT assignment_id FROM test_attempts WHERE id=attempt))<>sid THEN RAISE EXCEPTION 'Wrong assignment owner'; END IF;
 SELECT id INTO option_id FROM question_options WHERE question_id=qid ORDER BY label LIMIT 1;
 INSERT INTO attempt_answers(attempt_id,question_id,selected_option_id,marked_for_review) VALUES(attempt,qid,option_id,true);
 result:=get_safe_exam_payload(attempt);
 IF result#>>'{saved_answers}' IS NULL OR result#>>ARRAY['saved_answers',qid::text,'selected_option_id']<>option_id::text
 OR result#>>'{attempt,current_section_id}' IS NULL OR result#>>'{attempt,expires_at}' IS NULL
 OR result#>>'{sections,0,expires_at}' IS NULL OR (result#>>'{test,passing_threshold}')::numeric<>(SELECT passing_threshold FROM tests WHERE id=tid)
 THEN RAISE EXCEPTION 'Resume payload did not restore saved answers/deadlines/rubric'; END IF;
 INSERT INTO portal_test_report VALUES('Exam resume restores saved answers, review flags, section deadlines, current section and real rubric',true);
 PERFORM set_config('portal.fixture.reject','yes',true);
 denied:=false;BEGIN PERFORM submit_test_attempt(attempt);EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied OR (SELECT status FROM test_attempts WHERE id=attempt)<>'IN_PROGRESS' OR EXISTS(SELECT 1 FROM test_results WHERE attempt_id=attempt)
 OR (SELECT completed_tests FROM student_performance WHERE student_id=sid)<>0 THEN RAISE EXCEPTION 'Partial failed submission became completed'; END IF;
 PERFORM set_config('portal.fixture.reject','no',true);
 INSERT INTO portal_test_report VALUES('Injected result-save failure leaves attempt in progress with no result or completed statistic',true);
 result:=submit_test_attempt(attempt);
 IF NOT EXISTS(SELECT 1 FROM portal_valid_results WHERE attempt_id=attempt) THEN RAISE EXCEPTION 'Final result not saved'; END IF;
 IF EXISTS(SELECT 1 FROM portal_pending(sid) WHERE id=tid) THEN RAISE EXCEPTION 'Completed assignment remains pending'; END IF;
 denied:=false; BEGIN PERFORM start_test_attempt(tid); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Unapproved repeat permitted'; END IF;
 INSERT INTO retake_permissions(student_id,test_id,approved_by) VALUES(sid,tid,admin_id);
 result:=start_test_attempt(tid);repeat_attempt:=(result->>'attempt_id')::uuid;
 PERFORM submit_test_attempt(repeat_attempt);
 IF (SELECT completed_tests FROM student_performance WHERE student_id=sid)<>1 OR (SELECT finalized_attempts FROM student_performance WHERE student_id=sid)<>2 THEN RAISE EXCEPTION 'Retake counting incorrect'; END IF;
 INSERT INTO portal_test_report VALUES('Real backend start, atomic submission, pending removal, authorized retake and distinct test count',true);

 UPDATE test_results SET marks_obtained=8,max_marks=10,percentage=80 WHERE attempt_id=attempt;
 UPDATE test_results SET marks_obtained=10,max_marks=20,percentage=50 WHERE attempt_id=repeat_attempt;
 snap:=student_portal_snapshot();
 IF (snap#>>'{statistics,average_percentage}')::numeric<>65 OR abs((snap#>>'{statistics,aggregate_percentage}')::numeric-60)>0.00001 THEN RAISE EXCEPTION 'Average / aggregate mismatch'; END IF;
 board:=student_portal_leaderboard(tid);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(board->'rows') r WHERE (r->>'is_current_user')::boolean AND (r->>'percentage')::numeric=50) THEN RAISE EXCEPTION 'Latest attempt policy incorrect'; END IF;
 UPDATE test_attempts SET status='EXPIRED' WHERE id=repeat_attempt;
 IF (SELECT finalized_attempts FROM student_performance WHERE student_id=sid)<>1 OR (SELECT aggregate_percentage FROM student_performance WHERE student_id=sid)<>80 THEN RAISE EXCEPTION 'Invalidation not synchronized'; END IF;
 UPDATE test_attempts SET status='SUBMITTED' WHERE id=repeat_attempt;
 INSERT INTO portal_test_report VALUES('Correction/invalidation synchronization; average 65 vs weighted aggregate 60; latest test score 50',true);

 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM portal_registration_fee(sid,12000,3000,'CASH');
 PERFORM portal_registration_fee(sid,12000,3000,'CASH');
 IF (SELECT count(*) FROM student_fee_payments WHERE student_id=sid)<>1 THEN RAISE EXCEPTION 'Initial payment duplicated'; END IF;
 SELECT id INTO fee_account FROM student_fee_accounts WHERE student_id=sid AND fee_type='ADMISSION & TUITION FEE';
 payment:=record_student_fee_payment(sid,fee_account,2000,'CASH',NULL,'Portal fixture later payment');
 PERFORM set_config('request.jwt.claim.sub',user_ids[1]::text,true);
 snap:=student_portal_snapshot();
 IF (snap#>>'{fees,total_fee}')::numeric<>12000 OR (snap#>>'{fees,paid_fee}')::numeric<>5000 OR (snap#>>'{fees,remaining_fee}')::numeric<>7000 THEN RAISE EXCEPTION 'Registration fees incorrect'; END IF;
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM void_student_fee_payment((payment->>'payment_id')::uuid,'Portal fixture void');
 PERFORM set_config('request.jwt.claim.sub',user_ids[1]::text,true);
 IF (student_portal_snapshot()#>>'{fees,paid_fee}')::numeric<>3000 THEN RAISE EXCEPTION 'Voided payment still counted'; END IF;
 INSERT INTO portal_test_report VALUES('Persisted registration fee, initial/later payments, void recalculation, balance and retry idempotency',true);

 FOR i IN 1..105 LOOP
 uid:=gen_random_uuid();
 INSERT INTO auth.users(id,email) VALUES(uid,uid||'@portal-fixture.invalid');
 INSERT INTO profiles(id,email,display_name,role) VALUES(uid,uid||'@portal-fixture.invalid','Portal cohort fixture','STUDENT') ON CONFLICT(id) DO UPDATE SET role='STUDENT';
 INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id)
 SELECT uid,'QA-'||uid,'Fixture father',target_force_id,target_course_id FROM students WHERE id=sid RETURNING id INTO other;
 IF i=1 THEN peer:=other; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_assignments WHERE student_id=other AND test_id=tid) THEN RAISE EXCEPTION 'New registration delivery missing'; END IF;
 END LOOP;
 board:=student_portal_leaderboard(NULL,100,100);
 IF jsonb_array_length(board->'rows')<6 THEN RAISE EXCEPTION 'Students beyond first page missing'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(board->'rows') r WHERE r->>'percentage' IS NOT NULL) THEN RAISE EXCEPTION 'Fabricated scores'; END IF;
 INSERT INTO portal_test_report VALUES('105 future registrations receive assignments; all accessible after first 100; no invented ranks',true);
 -- Equal aggregate percentages receive the same rank even with different totals.
 SELECT id INTO aid FROM test_assignments WHERE student_id=peer AND test_id=tid;
 INSERT INTO test_attempts(student_id,test_id,assignment_id,expires_at,submitted_at,status,attempt_number)
 VALUES(peer,tid,aid,now()+interval '30 minutes',now(),'SUBMITTED',1) RETURNING id INTO attempt;
 INSERT INTO test_results(attempt_id,student_id,test_id,marks_obtained,max_marks,percentage) VALUES(attempt,peer,tid,30,50,60);
 board:=student_portal_leaderboard(NULL,0,100);
 IF (SELECT count(DISTINCT r->>'position') FROM jsonb_array_elements(board->'rows') r WHERE (r->>'percentage')::numeric=60)<>1 THEN RAISE EXCEPTION 'Equal scores receive unequal ranks'; END IF;
 INSERT INTO portal_test_report VALUES('Equal aggregate percentages with unequal marks totals receive equal ranks',true);
END $$;
-- Exercise actual authenticated RLS rather than superuser-visible rows.
SELECT set_config('request.jwt.claim.sub',(SELECT profile_id::text FROM students WHERE roll_number LIKE 'QA-%' ORDER BY created_at LIMIT 1),true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
 IF (SELECT count(*) FROM students)<>1 THEN RAISE EXCEPTION 'Student privacy RLS bypass'; END IF;
 IF EXISTS(SELECT 1 FROM profiles WHERE id<>auth.uid()) THEN RAISE EXCEPTION 'Profile privacy RLS bypass'; END IF;
 IF EXISTS(SELECT 1 FROM test_results WHERE student_id<>(SELECT id FROM students)) THEN RAISE EXCEPTION 'Results privacy bypass'; END IF;
 IF EXISTS(SELECT 1 FROM student_fee_accounts WHERE student_id<>(SELECT id FROM students)) THEN RAISE EXCEPTION 'Fee privacy bypass'; END IF;
 PERFORM student_portal_snapshot();
 IF NOT EXISTS(SELECT 1 FROM tests) THEN RAISE EXCEPTION 'Own assigned test metadata is inaccessible'; END IF;
 IF (SELECT count(*) FROM get_student_assigned_tests(gen_random_uuid()))<>jsonb_array_length(student_portal_snapshot()->'assigned_tests') THEN RAISE EXCEPTION 'Supplied student ID changed assignment access'; END IF;
END $$;
RESET ROLE;
INSERT INTO portal_test_report VALUES('Authenticated role RLS: private students, profiles, results, fees; snapshot works',true);
SELECT * FROM portal_test_report;
ROLLBACK;
