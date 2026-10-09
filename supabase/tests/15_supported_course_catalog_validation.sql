BEGIN;
CREATE TEMP TABLE course_checks(name text,passed boolean);
DO $$ DECLARE denied boolean; qcount integer; staff uuid; catalog jsonb; BEGIN
 IF (SELECT count(*) FROM courses WHERE status='ACTIVE')<>5 THEN RAISE EXCEPTION 'Expected five supported courses'; END IF;
 IF (SELECT count(*) FROM courses WHERE status='ACTIVE' AND force_id='00000000-0000-0000-0000-000000000001')<>2
 OR (SELECT count(*) FROM courses WHERE status='ACTIVE' AND force_id='00000000-0000-0000-0000-000000000002')<>2
 OR (SELECT count(*) FROM courses WHERE status='ACTIVE' AND force_id='00000000-0000-0000-0000-000000000003')<>1 THEN RAISE EXCEPTION 'Force course distribution mismatch'; END IF;
 INSERT INTO course_checks VALUES('Exactly five active courses: Army 2, PAF 2, Navy 1',true);
 denied:=false;BEGIN UPDATE courses SET status='ACTIVE' WHERE code='TCC';EXCEPTION WHEN check_violation THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Unsupported course can be reactivated'; END IF;
 INSERT INTO course_checks VALUES('Database blocks unsupported course reactivation',true);
 denied:=false;BEGIN UPDATE students SET target_force_id='00000000-0000-0000-0000-000000000002',target_course_id='00000000-0000-0000-0000-000000000102' WHERE id=(SELECT id FROM students LIMIT 1);EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Unsupported enrollment accepted'; END IF;
 INSERT INTO course_checks VALUES('Enrollment cannot select retired GDP',true);
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 denied:=false;BEGIN PERFORM save_test_blueprint(jsonb_build_object('test',jsonb_build_object('name','Rollback unsupported course check','duration_minutes',1,'passing_threshold',50),'eligibilities',jsonb_build_array(jsonb_build_object('force_id','00000000-0000-0000-0000-000000000002','course_id','00000000-0000-0000-0000-000000000102')),'sections','[]'::jsonb));EXCEPTION WHEN OTHERS THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Test can be created for retired GDP'; END IF;
 INSERT INTO course_checks VALUES('Test creation rejects inactive course',true);
 catalog:=get_staff_question_bank();IF jsonb_array_length(catalog->'academic_courses')<>2 THEN RAISE EXCEPTION 'Duplicate PMA card remains'; END IF;
 SELECT count(*) INTO qcount FROM questions;IF (catalog->>'total')::int<>qcount THEN RAISE EXCEPTION 'Questions lost from total'; END IF;
 INSERT INTO course_checks VALUES('Academic course cards deduplicate PMA while preserving complete bank totals',true);
END $$;
SELECT * FROM course_checks;
ROLLBACK;
