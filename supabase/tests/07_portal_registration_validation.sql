BEGIN;
CREATE TEMP TABLE portal_registration_report(check_name text,passed boolean);
DO $$
DECLARE staff_id uuid; uid uuid; sid uuid; course record; r jsonb; input jsonb; n integer:=0; bad_uid uuid; denied boolean; snap jsonb;
BEGIN
 SELECT id INTO staff_id FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 FOR course IN SELECT c.id,c.force_id,c.code FROM courses c WHERE code IN('PMA_LONG_COURSE','AFNS','GDP','PN_CADET') LOOP
 n:=n+1;uid:=gen_random_uuid();
 INSERT INTO auth.users(id,email) VALUES(uid,uid||'@portal-registration-fixture.invalid');
 input:=jsonb_build_object('email',uid||'@portal-registration-fixture.invalid','fullName','New Portal Fixture','fatherName','Father Fixture',
 'cnic','990000000000'||n,'phone','03001234567','targetForceId',course.force_id,'targetCourseId',course.id,'rollNumber','Qa-Exact-'||uid,
 'education','Intermediate','gender','Female','courseFeeAmount',15000,'initialPaymentAmount',4000,'paymentMethod','CASH');
 r:=portal_register_student(uid,staff_id,input);sid:=(r->>'studentId')::uuid;
 IF sid IS NULL OR NOT (r->>'success')::boolean THEN RAISE EXCEPTION 'Registration failed'; END IF;
 IF (SELECT roll_number FROM students WHERE id=sid)<>input->>'rollNumber' THEN RAISE EXCEPTION 'Exact roll number not retained'; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles p JOIN students s ON s.profile_id=p.id WHERE s.id=sid AND p.display_name='New Portal Fixture' AND s.father_name='Father Fixture'
 AND s.cnic=normalize_cnic('990000000000'||n) AND s.target_force_id=course.force_id AND s.target_course_id=course.id) THEN RAISE EXCEPTION 'Registration fields not preserved'; END IF;
 IF NOT EXISTS(SELECT 1 FROM student_performance WHERE student_id=sid AND completed_tests=0 AND finalized_attempts=0 AND aggregate_percentage IS NULL) THEN RAISE EXCEPTION 'New registration performance incorrect'; END IF;
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 snap:=student_portal_snapshot();
 IF (snap#>>'{fees,total_fee}')::numeric<>15000 OR (snap#>>'{fees,paid_fee}')::numeric<>4000 OR (snap#>>'{fees,remaining_fee}')::numeric<>11000 THEN RAISE EXCEPTION 'Registration finance not atomic'; END IF;
 IF snap->>'course_position' IS NOT NULL OR snap->>'academy_position' IS NOT NULL THEN RAISE EXCEPTION 'New registration assigned fabricated rank'; END IF;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 END LOOP;
 IF n<>4 THEN RAISE EXCEPTION 'All four registration cohorts required'; END IF;
 INSERT INTO portal_registration_report VALUES('Actual registration RPC: all four course cohorts, no batch, exact roll, personal fields, initial fees, null scores/ranks',true);
 bad_uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(bad_uid,bad_uid||'@portal-registration-fixture.invalid');
 input:=input||jsonb_build_object('email',bad_uid||'@portal-registration-fixture.invalid','cnic','9900000000009','rollNumber','Qa-Bad-'||bad_uid,'initialPaymentAmount',999999);
 denied:=false;BEGIN PERFORM portal_register_student(bad_uid,staff_id,input);EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied OR EXISTS(SELECT 1 FROM students WHERE profile_id=bad_uid) OR EXISTS(SELECT 1 FROM student_fee_accounts a JOIN students s ON s.id=a.student_id WHERE s.profile_id=bad_uid) THEN RAISE EXCEPTION 'Partial failed registration persisted'; END IF;
 INSERT INTO portal_registration_report VALUES('Invalid fee rolls back student, assignments, statistics, fee account and payment together',true);
END $$;
SELECT * FROM portal_registration_report;
ROLLBACK;
