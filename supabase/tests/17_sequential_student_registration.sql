BEGIN;
CREATE TEMP TABLE roll_checks(name text,passed boolean);
DO $$
DECLARE staff uuid; c courses%ROWTYPE; suggestion jsonb; r jsonb; uid uuid; input jsonb; rejected boolean; n bigint;
BEGIN
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 SELECT * INTO c FROM courses WHERE code='PN_CADET' AND status='ACTIVE';
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 -- Isolated test counter state is rolled back at the end.
 UPDATE student_roll_counters SET last_issued=0 WHERE prefix='SFA-NAVY';
 suggestion:=suggest_student_registration(c.force_id,c.id,'Ali Khan');
 IF suggestion->>'rollNumber'<>'SFA-NAVY-1' OR suggestion->>'email'<>'ali.1@gmail.com' THEN RAISE EXCEPTION 'First suggestion mismatch'; END IF;
 UPDATE student_roll_counters SET last_issued=22 WHERE prefix='SFA-NAVY';
 suggestion:=suggest_student_registration(c.force_id,c.id,'Ali Khan');
 IF suggestion->>'rollNumber'<>'SFA-NAVY-23' OR suggestion->>'email'<>'ali.23@gmail.com' THEN RAISE EXCEPTION '23 suggestion mismatch'; END IF;
 UPDATE student_roll_counters SET last_issued=0 WHERE prefix='SFA-NAVY';
 INSERT INTO roll_checks VALUES('DB suggestions start at 1 and firstname.23@gmail.com uses suffix 23',true);
 FOR n IN 1..2 LOOP
  uid:=gen_random_uuid();
  input:=jsonb_build_object('email',CASE WHEN n=1 THEN 'personal-'||uid||'@example.test' ELSE 'ali.2@gmail.com' END,
   'fullName','Ali Khan','fatherName','Fixture','cnic',CASE WHEN n=1 THEN '9919977776655' ELSE '9919977776656' END,
   'phone','03001234567','targetForceId',c.force_id,'targetCourseId',c.id,'rollNumber','SFA-NAVY-'||n,
   'education','Intermediate','gender','Male','courseFeeAmount',0,'initialPaymentAmount',0,'paymentMethod','CASH');
  INSERT INTO auth.users(id,email) VALUES(uid,input->>'email');
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  r:=portal_register_student(uid,staff,input);
  IF r->>'rollNumber'<>'SFA-NAVY-'||n OR r->>'email'<>input->>'email' THEN RAISE EXCEPTION 'Saved registration mismatch'; END IF;
  IF NOT EXISTS(SELECT 1 FROM students s JOIN profiles p ON p.id=s.profile_id JOIN auth.users u ON u.id=p.id
    WHERE s.id=(r->>'studentId')::uuid AND s.roll_number='SFA-NAVY-'||n AND p.email=input->>'email' AND u.email=input->>'email') THEN RAISE EXCEPTION 'DB/Auth linkage mismatch'; END IF;
 END LOOP;
 INSERT INTO roll_checks VALUES('Real backend registration saves rolls 1 then 2 and preserves personal email in Auth/profile/student linkage',true);
 uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(uid,uid||'@roll-rollback.invalid');
 input:=input||jsonb_build_object('email',uid||'@roll-rollback.invalid','cnic','9919977776657','rollNumber','SFA-NAVY-1');
 rejected:=false;
 BEGIN PERFORM portal_register_student(uid,staff,input); EXCEPTION WHEN OTHERS THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Duplicate/stale roll accepted'; END IF;
 input:=input||jsonb_build_object('rollNumber','SFA-NAVY-99');rejected:=false;
 BEGIN PERFORM portal_register_student(uid,staff,input); EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%Roll number must be SFA-NAVY-3%' THEN RAISE; END IF;rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Sequence bypass accepted'; END IF;
 input:=input||jsonb_build_object('rollNumber','SFA-NAVY-3','courseFeeAmount',-1);rejected:=false;
 BEGIN PERFORM portal_register_student(uid,staff,input); EXCEPTION WHEN OTHERS THEN rejected:=true; END;
 IF NOT rejected OR (SELECT last_issued FROM student_roll_counters WHERE prefix='SFA-NAVY')<>2
 OR EXISTS(SELECT 1 FROM students WHERE profile_id=uid) THEN RAISE EXCEPTION 'Failed registration consumed number or left student'; END IF;
 INSERT INTO roll_checks VALUES('Stale/skipped rolls rejected and failed registration does not consume next number',true);
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 rejected:=false;BEGIN PERFORM suggest_student_registration(c.force_id,c.id,'Ali'); EXCEPTION WHEN OTHERS THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Non-staff suggestion accepted'; END IF;
 INSERT INTO roll_checks VALUES('Non-staff suggestion RPC access denied',true);
END $$;
SELECT * FROM roll_checks;
ROLLBACK;
