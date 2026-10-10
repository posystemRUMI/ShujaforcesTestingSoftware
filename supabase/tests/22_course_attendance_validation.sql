-- Dedicated fixtures only; all writes and Auth accounts are rolled back.
BEGIN;
CREATE TEMP TABLE course_attendance_checks(name text,passed boolean);
DO $$
DECLARE day date; staff uuid; uid uuid; sid uuid; rid uuid; c record; f record;
 fixture_prefix text; roll text; suffix text; response jsonb; before_audit integer; denied boolean;
 cae_suffix text; cae_sid uuid; old_memberships jsonb; bid uuid:=gen_random_uuid(); pma_sid uuid; pma_suffix text;
BEGIN
 SELECT least(attendance_today()-4,min(coalesce(admission_date,(created_at AT TIME ZONE 'Asia/Karachi')::date))-4) INTO day FROM students;
 IF EXISTS(SELECT 1 FROM attendance_registers WHERE attendance_date=day) THEN RAISE EXCEPTION 'Isolated fixture date already has a register'; END IF;
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 CREATE TEMP TABLE course_attendance_fixtures(course_id uuid,student_id uuid,uid uuid,suffix text);
 FOR c IN SELECT a.*,co.name FROM attendance_course_rules a JOIN courses co ON co.id=a.course_id ORDER BY a.course_id LOOP
  uid:=gen_random_uuid(); INSERT INTO auth.users(id,email) VALUES(uid,uid||'@course-attendance-rollback.invalid');
  UPDATE profiles SET display_name='Course attendance QA' WHERE id=uid;
  fixture_prefix:=student_roll_prefix(c.force_id,c.course_id);
  SELECT (last_issued+1)::text INTO suffix FROM student_roll_counters WHERE student_roll_counters.prefix=fixture_prefix;
  roll:=fixture_prefix||'-'||suffix;
  INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id,admission_date) VALUES(uid,roll,'QA',c.force_id,c.course_id,day-1) RETURNING id INTO sid;
  INSERT INTO course_attendance_fixtures VALUES(c.course_id,sid,uid,suffix);
 END LOOP;
 SELECT fx.student_id,fx.suffix INTO pma_sid,pma_suffix FROM course_attendance_fixtures fx WHERE fx.course_id='00000000-0000-0000-0000-000000000101';
 INSERT INTO batches(id,code,name,course_id,session_name,start_date,status) VALUES(bid,'COURSE-ATTENDANCE-'||bid,'Course attendance QA','00000000-0000-0000-0000-000000000103','QA rollback',day-1,'ACTIVE');
 INSERT INTO batch_enrollments(batch_id,student_id,enrolled_at,status) VALUES(bid,pma_sid,(day-1)::timestamptz,'ACTIVE');
 PERFORM attendance_admin('CREATE',day,'{"historicalConfirmed":true}');
 SELECT id INTO rid FROM attendance_registers WHERE attendance_date=day;
 response:=attendance_report(day,day);
 IF jsonb_array_length(response->'courses')<>5 OR EXISTS(SELECT 1 FROM jsonb_array_elements(response->'courses') x WHERE x->>'roll_prefix' IS NULL) THEN RAISE EXCEPTION 'Five database prefixes not returned'; END IF;
 INSERT INTO course_attendance_checks VALUES('Five real course IDs and persisted prefixes returned by authorized catalog',true);
 SELECT fx.suffix,fx.student_id INTO cae_suffix,cae_sid FROM course_attendance_fixtures fx WHERE fx.course_id='20000000-0000-0000-0000-000000000003';
 SELECT count(*) INTO before_audit FROM attendance_audit WHERE register_id=rid;
 denied:=false; BEGIN PERFORM attendance_mark_course(day,'20000000-0000-0000-0000-000000000006',cae_suffix); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Actual course: CAE%'; END;
 IF NOT denied OR EXISTS(SELECT 1 FROM attendance_records WHERE register_id=rid AND status<>'UNMARKED') OR (SELECT count(*) FROM attendance_audit WHERE register_id=rid)<>before_audit THEN RAISE EXCEPTION 'Same-force wrong-course write not rejected atomically'; END IF;
 INSERT INTO course_attendance_checks VALUES('CAE rejected in Airman despite shared legacy SFA-PAF prefix; no record/audit change',true);
 FOR f IN SELECT * FROM course_attendance_fixtures LOOP
  response:=attendance_mark_course(day,f.course_id,' '||f.suffix||' ');
  IF NOT EXISTS(SELECT 1 FROM attendance_records WHERE register_id=rid AND student_id=f.student_id AND status='PRESENT' AND arrival_at IS NOT NULL) THEN RAISE EXCEPTION 'Course marking failed'; END IF;
  response:=attendance_mark_course(day,f.course_id,f.suffix);
  IF NOT (response->>'already_present')::boolean THEN RAISE EXCEPTION 'Course duplicate not idempotent'; END IF;
  IF (attendance_report(day,day,NULL,f.course_id)#>>'{totals,present}')::integer<>(CASE WHEN f.course_id='00000000-0000-0000-0000-000000000103' AND EXISTS(SELECT 1 FROM attendance_records WHERE register_id=rid AND student_id=pma_sid AND status='PRESENT') THEN 2 ELSE 1 END) THEN RAISE EXCEPTION 'Course-specific count incorrect'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM attendance_audit WHERE register_id=rid AND action='MARK')<>5 OR (SELECT count(*) FROM attendance_records WHERE register_id=rid)<>5 THEN RAISE EXCEPTION 'Duplicate daily records/audits'; END IF;
 IF pma_suffix=(SELECT fx.suffix FROM course_attendance_fixtures fx WHERE fx.course_id='00000000-0000-0000-0000-000000000103') THEN
  denied:=false; BEGIN PERFORM attendance_mark_course(day,'00000000-0000-0000-0000-000000000103',pma_suffix); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Ambiguous%'; END;
  IF NOT denied THEN RAISE EXCEPTION 'Ambiguous multi-course suffix was guessed'; END IF;
 ELSE
  response:=attendance_mark_course(day,'00000000-0000-0000-0000-000000000103',pma_suffix);
  IF NOT (response->>'already_present')::boolean THEN RAISE EXCEPTION 'Multi-course created duplicate attendance'; END IF;
 END IF;
 INSERT INTO course_attendance_checks VALUES('Multi-course membership resolves existing roll without duplicate records; ambiguity rejected',true);
 INSERT INTO course_attendance_checks VALUES('All five courses save exact student; legacy prefixes resolve; counts, arrival persistence and retry idempotence',true);
 FOREACH suffix IN ARRAY ARRAY['999999999999999999','01','SFA-CAE-1','1 OR 1=1','-1',''] LOOP
  denied:=false; BEGIN PERFORM attendance_mark_course(day,'20000000-0000-0000-0000-000000000003',suffix); EXCEPTION WHEN OTHERS THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Invalid/unknown suffix accepted: %',suffix; END IF;
 END LOOP;
 denied:=false; BEGIN PERFORM attendance_mark_course(day,'10000000-0000-0000-0000-000000000002','1'); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Unsupported course accepted'; END IF;
 INSERT INTO course_attendance_checks VALUES('Unknown/invalid suffix and unsupported course rejected; leading zeros never coerced',true);
 SELECT memberships INTO old_memberships FROM attendance_roster WHERE register_id=rid AND student_id=cae_sid;
 UPDATE attendance_roster SET memberships='[{"course_id":"20000000-0000-0000-0000-000000000006","force_id":"00000000-0000-0000-0000-000000000002","section":"Air Force","course_name":"Airman"}]' WHERE register_id=rid AND student_id=cae_sid;
 denied:=false; BEGIN PERFORM attendance_mark_course(day,'20000000-0000-0000-0000-000000000003',cae_suffix); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%saved roster%'; END;
 IF NOT denied THEN RAISE EXCEPTION 'Historical roster course mismatch accepted'; END IF;
 UPDATE attendance_roster SET memberships=old_memberships WHERE register_id=rid AND student_id=cae_sid;
 INSERT INTO course_attendance_checks VALUES('Saved historical roster also enforces exact course',true);
 PERFORM attendance_admin('FINALIZE',day,'{"expectedUnmarked":0}');
 denied:=false; BEGIN PERFORM attendance_mark_course(day,'20000000-0000-0000-0000-000000000003',cae_suffix); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Finalized%'; END;
 IF NOT denied THEN RAISE EXCEPTION 'Finalized marking accepted'; END IF;
 SELECT fx.uid INTO uid FROM course_attendance_fixtures fx LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 denied:=false; BEGIN PERFORM attendance_mark_course(day,'20000000-0000-0000-0000-000000000003',cae_suffix); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%administrator%'; END;
 IF NOT denied THEN RAISE EXCEPTION 'Student marking allowed'; END IF;
 SELECT id INTO uid FROM profiles WHERE role='TEACHER' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);
 denied:=false; BEGIN PERFORM attendance_mark_course(day,'20000000-0000-0000-0000-000000000003',cae_suffix); EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%administrator%'; END;
 IF NOT denied THEN RAISE EXCEPTION 'Teacher marking allowed'; END IF;
 INSERT INTO course_attendance_checks VALUES('Finalization restrictions and student/teacher authorization preserved',true);
END $$;
SELECT * FROM course_attendance_checks;
ROLLBACK;
