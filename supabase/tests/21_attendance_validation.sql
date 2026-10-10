-- Use dates before every real student's enrollment. Every fixture and mutation
-- rolls back; real students are never marked for QA.
BEGIN;
CREATE TEMP TABLE attendance_checks(name text,passed boolean);
CREATE TEMP TABLE attendance_fixtures(student_id uuid,uid uuid,course_id uuid,roll text);
CREATE TEMP TABLE attendance_context(day date,student_uid uuid,other_uid uuid,teacher_uid uuid);
DO $$
DECLARE day date; staff uuid; teacher uuid; c record; uid uuid; sid uuid; roll text; fixture_prefix text; r jsonb; n integer; denied boolean; multi uuid; multi_uid uuid; cae uuid; afns uuid; other_uid uuid; rid uuid; bid uuid:=gen_random_uuid(); before_audit integer; first_arrival timestamptz; future_student uuid;
BEGIN
 SELECT least(attendance_today()-2,min(coalesce(admission_date,(created_at AT TIME ZONE 'Asia/Karachi')::date))-1) INTO day FROM students;
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 SELECT id INTO teacher FROM profiles WHERE role='TEACHER' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 IF EXISTS(SELECT 1 FROM attendance_registers WHERE attendance_date BETWEEN day-2 AND day) THEN RAISE EXCEPTION 'Fixture dates already contain live attendance; choose isolated dates'; END IF;
 FOR c IN SELECT * FROM courses WHERE id IN(SELECT course_id FROM attendance_course_rules) ORDER BY code LOOP
  uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(uid,uid||'@attendance-rollback.invalid');
  UPDATE profiles SET display_name='Attendance fixture '||c.code WHERE id=uid;
  fixture_prefix:=student_roll_prefix(c.force_id,c.id);SELECT fixture_prefix||'-'||(last_issued+1) INTO roll FROM student_roll_counters WHERE student_roll_counters.prefix=fixture_prefix;
  INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id,admission_date) VALUES(uid,roll,'Fixture',c.force_id,c.id,day-3) RETURNING id INTO sid;
  INSERT INTO attendance_fixtures VALUES(sid,uid,c.id,roll);
 END LOOP;
 SELECT f.student_id,f.uid INTO multi,multi_uid FROM attendance_fixtures f WHERE f.course_id='00000000-0000-0000-0000-000000000101';
 SELECT f.student_id,f.uid INTO cae,other_uid FROM attendance_fixtures f WHERE f.course_id='20000000-0000-0000-0000-000000000003';
 SELECT student_id INTO afns FROM attendance_fixtures WHERE course_id='10000000-0000-0000-0000-000000000004';
 INSERT INTO batches(id,code,name,course_id,session_name,start_date,status) VALUES(bid,'ATTENDANCE-ROLLBACK-'||bid,'Attendance fixture course enrollment','00000000-0000-0000-0000-000000000103','QA rollback',day-3,'ACTIVE');
 INSERT INTO batch_enrollments(batch_id,student_id,enrolled_at,status) VALUES(bid,multi,(day-2)::timestamptz,'ACTIVE');
 -- Extra valid-registration fixtures subsequently assigned to an unsupported
 -- legacy course, inactive, or not enrolled yet: all must stay out of the roster.
 FOR n IN 1..3 LOOP
  uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(uid,uid||'@attendance-rollback.invalid');
  fixture_prefix:='SFA-PMA';SELECT fixture_prefix||'-'||(last_issued+1) INTO roll FROM student_roll_counters WHERE student_roll_counters.prefix=fixture_prefix;
  INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id,admission_date) VALUES(uid,roll,'Fixture','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',CASE WHEN n=3 THEN day+1 ELSE day-3 END) RETURNING id INTO sid;
  IF n=1 THEN
   denied:=false; BEGIN UPDATE students SET target_course_id='10000000-0000-0000-0000-000000000002' WHERE id=sid; EXCEPTION WHEN OTHERS THEN denied:=true; END;
   IF NOT denied OR EXISTS(SELECT 1 FROM attendance_course_rules WHERE course_id='10000000-0000-0000-0000-000000000002') THEN RAISE EXCEPTION 'Unsupported same-force course accepted'; END IF;
   UPDATE students SET status='INACTIVE' WHERE id=sid;
  ELSIF n=2 THEN UPDATE students SET status='INACTIVE' WHERE id=sid; ELSE future_student:=sid; END IF;
  INSERT INTO attendance_fixtures VALUES(sid,uid,NULL,roll);
 END LOOP;
 PERFORM attendance_admin('CREATE',day,jsonb_build_object('historicalConfirmed',true));
 SELECT id INTO rid FROM attendance_registers WHERE attendance_date=day;
 IF (SELECT count(*) FROM attendance_roster WHERE register_id=rid AND eligible)<>5 THEN RAISE EXCEPTION 'Strict canonical roster failed'; END IF;
 r:=attendance_report(day,day);
 IF (r#>>'{totals,eligible}')::integer<>5 OR (r#>>'{totals,unmarked}')::integer<>5 THEN RAISE EXCEPTION 'Distinct totals failed'; END IF;
 IF (attendance_report(day,day,'Navy')#>>'{totals,eligible}')::integer<>2 THEN RAISE EXCEPTION 'Saved multi-force enrollment not included'; END IF;
 INSERT INTO attendance_checks VALUES('Strict five-course roster, distinct totals and multi-force enrollment',true);
 SELECT count(*) INTO before_audit FROM attendance_audit WHERE register_id=rid;
 denied:=false;BEGIN PERFORM attendance_admin('MARK',day,'{"section":"Army","roll":"UNKNOWN"}');EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%not found%';END;IF NOT denied THEN RAISE EXCEPTION 'Unknown roll accepted'; END IF;
 denied:=false;BEGIN PERFORM attendance_admin('MARK',day,jsonb_build_object('section','Army','roll',(SELECT f.roll FROM attendance_fixtures f WHERE f.student_id=cae)));EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%CAE%Air Force%'; IF NOT denied THEN RAISE EXCEPTION 'Unexpected wrong-force error: %',SQLERRM; END IF;END;IF NOT denied THEN RAISE EXCEPTION 'Wrong force accepted or correct-course message missing'; END IF;
 FOR roll IN SELECT f.roll FROM attendance_fixtures f WHERE f.course_id IS NULL LOOP
  denied:=false;BEGIN PERFORM attendance_admin('MARK',day,jsonb_build_object('section','Army','roll',roll));EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Unsupported/inactive/future fixture accepted'; END IF;
 END LOOP;
 IF (SELECT count(*) FROM attendance_audit WHERE register_id=rid)<>before_audit OR EXISTS(SELECT 1 FROM attendance_records WHERE register_id=rid AND status<>'UNMARKED') THEN RAISE EXCEPTION 'Rejected writes changed attendance'; END IF;
 INSERT INTO attendance_checks VALUES('Unknown, wrong force, unsupported same-force course, inactive and pre-enrollment marking rejected without changes',true);
 r:=attendance_admin('MARK',day,jsonb_build_object('section','Army','roll','  '||(SELECT f.roll FROM attendance_fixtures f WHERE f.student_id=multi)||'  '));
 SELECT arrival_at INTO first_arrival FROM attendance_records WHERE register_id=rid AND student_id=multi;
 SELECT count(*) INTO before_audit FROM attendance_audit WHERE register_id=rid;
 r:=attendance_admin('MARK',day,jsonb_build_object('section','Navy','roll',(SELECT f.roll FROM attendance_fixtures f WHERE f.student_id=multi)));
 IF NOT (r->>'already_present')::boolean OR (SELECT count(*) FROM attendance_records WHERE register_id=rid AND student_id=multi)<>1 OR (SELECT count(*) FROM attendance_audit WHERE register_id=rid)<>before_audit THEN RAISE EXCEPTION 'Repeat/multi-force not idempotent'; END IF;
 IF (attendance_report(day,day,'Navy')#>>'{totals,present}')::integer<>1 OR (attendance_report(day,day)#>>'{totals,present}')::integer<>1 THEN RAISE EXCEPTION 'Multi-force global status wrong'; END IF;
 INSERT INTO attendance_checks VALUES('Present persists by trimmed roll; multi-force repeat has one record and one marking audit',true);
 PERFORM attendance_admin('CORRECT',day,jsonb_build_object('studentId',afns,'status','EXCUSED','reason','QA authorized excuse'));
 PERFORM attendance_admin('FINALIZE',day,'{"expectedUnmarked":3}');
 IF EXISTS(SELECT 1 FROM attendance_records a JOIN attendance_roster ro USING(register_id,student_id) WHERE a.register_id=rid AND ro.eligible AND a.status='UNMARKED') OR EXISTS(SELECT 1 FROM attendance_records WHERE register_id=rid AND student_id=afns AND status<>'EXCUSED') OR EXISTS(SELECT 1 FROM attendance_records WHERE register_id=rid AND student_id IN(SELECT student_id FROM attendance_fixtures WHERE course_id IS NULL)) THEN RAISE EXCEPTION 'Finalization included wrong students'; END IF;
 SELECT count(*) INTO before_audit FROM attendance_audit WHERE register_id=rid;
 PERFORM attendance_admin('FINALIZE',day,'{"expectedUnmarked":3}');
 IF (SELECT count(*) FROM attendance_audit WHERE register_id=rid)<>before_audit THEN RAISE EXCEPTION 'Repeated finalization audited twice'; END IF;
 denied:=false;BEGIN PERFORM attendance_admin('MARK',day,jsonb_build_object('section','Air Force','roll',(SELECT f.roll FROM attendance_fixtures f WHERE f.student_id=cae)));EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%Finalized%';END;IF NOT denied THEN RAISE EXCEPTION 'Finalized ordinary marking accepted'; END IF;
 INSERT INTO attendance_checks VALUES('Atomic finalization preserves Present/Excused, excludes unsupported and pre-enrollment students; retry is idempotent',true);
 PERFORM attendance_admin('CORRECT',day,jsonb_build_object('studentId',cae,'status','PRESENT','reason','QA late arrival'));
 PERFORM attendance_admin('CORRECT',day,jsonb_build_object('studentId',multi,'status','ABSENT','reason','QA correction'));
 PERFORM attendance_admin('CORRECT',day,jsonb_build_object('studentId',multi,'status','PRESENT','reason','QA correction restored'));
 IF (SELECT arrival_at FROM attendance_records WHERE register_id=rid AND student_id=multi)<>first_arrival OR NOT EXISTS(SELECT 1 FROM attendance_audit WHERE register_id=rid AND action='CORRECT' AND reason='QA correction restored') THEN RAISE EXCEPTION 'Correction lost arrival or audit'; END IF;
 r:=attendance_report(day,day);
 IF (r#>>'{totals,percentage}')::numeric<>50 THEN RAISE EXCEPTION 'Official percentage wrong'; END IF;
 IF (r#>>'{totals,unique_students}')::integer<>5 THEN RAISE EXCEPTION 'Distinct report total wrong'; END IF;
 r:=attendance_report(day,day,NULL,NULL,'','ABSENT');
 IF jsonb_array_length(r->'rows')<>2 OR jsonb_array_length(r->'monthly')<>2 THEN RAISE EXCEPTION 'Absent report filter not applied to daily and monthly exports'; END IF;
 PERFORM set_config('request.jwt.claim.sub',multi_uid::text,true);
 r:=attendance_student(day);
 IF (r#>>'{totals,percentage}')::numeric<>100 OR r::text LIKE '%QA correction%' OR r::text LIKE '%actor_id%' THEN RAISE EXCEPTION 'Student summary/privacy failed'; END IF;
 INSERT INTO attendance_checks VALUES('Corrections retain original arrival and append audit; backend percentages exclude Excused',true);
 denied:=false;BEGIN PERFORM attendance_admin('FINALIZE',day,'{}');EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Student managed attendance'; END IF;
 denied:=false;BEGIN PERFORM attendance_report(day,day);EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Student accessed admin report'; END IF;
 PERFORM set_config('request.jwt.claim.sub',teacher::text,true);
 denied:=false;BEGIN PERFORM attendance_admin('SYNC',day);EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Teacher managed attendance'; END IF;
 INSERT INTO attendance_checks VALUES('Student and teacher management/report writes denied',true);
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 denied:=false;BEGIN PERFORM attendance_admin('NON_CLASS',day,'{"reason":"QA holiday"}');EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Holiday silently excluded recorded attendance'; END IF;
 PERFORM attendance_admin('NON_CLASS',day,'{"reason":"QA holiday resolution","resolveRecorded":true}');
 IF (attendance_report(day,day)#>>'{totals,percentage}') IS NOT NULL OR (attendance_report(day,day)#>>'{totals,absent}')::integer<>0 THEN RAISE EXCEPTION 'Non-class counted'; END IF;
 IF jsonb_array_length(attendance_report(day,day,NULL,NULL,'','ABSENT')->'rows')<>0 THEN RAISE EXCEPTION 'Non-class day included in absent-student list'; END IF;
 PERFORM set_config('request.jwt.claim.sub',multi_uid::text,true);
 IF (attendance_student(day)#>>'{totals,percentage}') IS NOT NULL THEN RAISE EXCEPTION 'Student non-class counted'; END IF;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 PERFORM attendance_admin('REOPEN',day,'{"reason":"QA restore class day"}');
 IF (SELECT status FROM attendance_records WHERE register_id=rid AND student_id=multi)<>'PRESENT' THEN RAISE EXCEPTION 'Reopen reset statuses'; END IF;
 INSERT INTO attendance_checks VALUES('Non-class requires audited resolution, retains records, excludes percentages; reopening preserves statuses',true);
 denied:=false;BEGIN PERFORM attendance_admin('CREATE',attendance_today()+1,'{}');EXCEPTION WHEN OTHERS THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Future date accepted'; END IF;
 IF attendance_today()<>(now() AT TIME ZONE 'Asia/Karachi')::date OR ('2026-10-09 19:00:00+00'::timestamptz AT TIME ZONE 'Asia/Karachi')::date<>'2026-10-10'::date THEN RAISE EXCEPTION 'Pakistan midnight wrong'; END IF;
 INSERT INTO attendance_checks VALUES('Future marking rejected; Asia/Karachi day boundary verified',true);
 IF NOT EXISTS(SELECT 1 FROM attendance_registers WHERE attendance_date=attendance_today()) THEN
  -- Today's roster can contain real Unmarked students, but this check only marks
  -- its dedicated fixture and rejects finalization before any absences are saved.
  PERFORM attendance_admin('CREATE',attendance_today());
  uid:=gen_random_uuid();INSERT INTO auth.users(id,email) VALUES(uid,uid||'@attendance-rollback.invalid');
  fixture_prefix:='SFA-PMA';SELECT fixture_prefix||'-'||(last_issued+1) INTO roll FROM student_roll_counters WHERE student_roll_counters.prefix=fixture_prefix;
  INSERT INTO students(profile_id,roll_number,father_name,target_force_id,target_course_id,admission_date) VALUES(uid,roll,'New enrollment fixture','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000101',attendance_today()) RETURNING id INTO sid;
  PERFORM attendance_admin('SYNC',attendance_today());PERFORM attendance_admin('SYNC',attendance_today());
  IF (SELECT count(*) FROM attendance_roster ro JOIN attendance_registers ar ON ar.id=ro.register_id WHERE ar.attendance_date=attendance_today() AND ro.student_id=sid AND ro.eligible)<>1 THEN RAISE EXCEPTION 'New enrollment not synchronized idempotently'; END IF;
  PERFORM attendance_admin('MARK',attendance_today(),jsonb_build_object('section','Army','roll',(SELECT f.roll FROM attendance_fixtures f WHERE f.student_id=multi)));
  UPDATE students SET target_course_id='20000000-0000-0000-0000-000000000003',target_force_id='00000000-0000-0000-0000-000000000002' WHERE id=multi;
  denied:=false; BEGIN PERFORM attendance_admin('CORRECT',attendance_today(),jsonb_build_object('studentId',multi,'status','PRESENT','reason','QA cannot bypass assignment check'));EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%assignment changed%'; END;IF NOT denied THEN RAISE EXCEPTION 'Correction bypassed current force/course eligibility'; END IF;
  PERFORM attendance_admin('SYNC',attendance_today());
  IF NOT EXISTS(SELECT 1 FROM attendance_roster ro JOIN attendance_registers ar ON ar.id=ro.register_id WHERE ar.attendance_date=attendance_today() AND ro.student_id=multi AND ro.conflict AND ro.memberships @> '[{"section":"Army"}]') THEN RAISE EXCEPTION 'Changed marked assignment silently rewrote roster'; END IF;
  denied:=false; BEGIN PERFORM attendance_admin('FINALIZE',attendance_today(),'{}');EXCEPTION WHEN OTHERS THEN denied:=SQLERRM LIKE '%conflicts%'; END;IF NOT denied THEN RAISE EXCEPTION 'Conflict did not block finalization'; END IF;
  PERFORM attendance_admin('RESOLVE_CONFLICT',attendance_today(),jsonb_build_object('studentId',multi,'reason','QA explicit assignment exclusion'));
  PERFORM attendance_admin('SYNC',attendance_today());
  IF EXISTS(SELECT 1 FROM attendance_roster ro JOIN attendance_registers ar ON ar.id=ro.register_id WHERE ar.attendance_date=attendance_today() AND ro.student_id=multi AND (ro.eligible OR ro.conflict)) THEN RAISE EXCEPTION 'Explicit exclusion not preserved'; END IF;
  IF NOT ((SELECT memberships FROM attendance_roster WHERE register_id=rid AND student_id=multi) @> '[{"section":"Army"}]') THEN RAISE EXCEPTION 'Historical assignment changed'; END IF;
  INSERT INTO attendance_checks VALUES('New enrollment sync is idempotent; marked snapshots survive assignment changes; conflicts require audited resolution',true);
 END IF;
 INSERT INTO attendance_context VALUES(day,multi_uid,other_uid,teacher);
END $$;
GRANT SELECT ON attendance_context,attendance_checks,attendance_fixtures TO authenticated;
SELECT set_config('request.jwt.claim.sub',(SELECT student_uid::text FROM attendance_context),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM attendance_records WHERE student_id<>(SELECT student_id FROM attendance_fixtures WHERE uid=auth.uid())) OR EXISTS(SELECT 1 FROM attendance_audit) OR EXISTS(SELECT 1 FROM attendance_registers) THEN RAISE EXCEPTION 'Student RLS leaks others/internal audit'; END IF;
 BEGIN UPDATE attendance_records SET status='PRESENT'; RAISE EXCEPTION 'Direct student write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',(SELECT teacher_uid::text FROM attendance_context),true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM attendance_records) OR EXISTS(SELECT 1 FROM attendance_roster) THEN RAISE EXCEPTION 'Teacher reads attendance'; END IF; END $$;
RESET ROLE;
INSERT INTO attendance_checks VALUES('Actual authenticated RLS hides other student records and admin audit; direct writes and teacher reads denied',true);
SELECT * FROM attendance_checks;
ROLLBACK;
