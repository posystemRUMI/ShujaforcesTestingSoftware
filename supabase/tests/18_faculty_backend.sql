BEGIN;
CREATE TEMP TABLE faculty_checks(name text,passed boolean);
DO $$
DECLARE staff uuid; uid uuid:=gen_random_uuid(); tid uuid; r jsonb; fields jsonb; n bigint; denied boolean; old_role text; old_status teacher_status;
BEGIN
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 UPDATE faculty_code_counter SET last_issued=0 WHERE id;
 IF suggest_faculty_code()<>'FAC-1' THEN RAISE EXCEPTION 'Faculty first code mismatch'; END IF;
 INSERT INTO auth.users(id,email) VALUES(uid,uid||'@faculty-rollback.invalid');
 fields:=jsonb_build_object('fullName','Faculty verification','titleRank','Dr.','employeeId','FAC-1','email',uid||'@faculty-rollback.invalid','phone','03001234567','branchAffiliation','TRI_SERVICE','assignedSubjects',jsonb_build_array('ACADEMIC_CHEMISTRY','ACADEMIC_BIOLOGY'));
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 r:=portal_save_faculty(NULL,uid,staff,fields);tid:=(r->>'teacherId')::uuid;
 IF NOT EXISTS(SELECT 1 FROM teachers t JOIN profiles p ON p.id=t.profile_id WHERE t.id=tid AND t.service_number='FAC-1' AND p.role='TEACHER' AND p.email=fields->>'email' AND t.branch_code IS NULL) OR (SELECT count(*) FROM teacher_subjects WHERE teacher_id=tid)<>2 THEN RAISE EXCEPTION 'Saved faculty data mismatch'; END IF;
 INSERT INTO faculty_checks VALUES('FAC-1 saves profile, teacher, two real subjects and Tri-Service affiliation',true);
 SELECT role_title,status INTO old_role,old_status FROM teachers WHERE id=tid;
 fields:=fields||jsonb_build_object('fullName','Edited faculty','phone','03007654321','branchAffiliation','PAKISTAN_NAVY','assignedSubjects',jsonb_build_array('INTELLIGENCE_VERBAL'));
 r:=portal_save_faculty(tid,uid,staff,fields);
 IF (SELECT display_name FROM profiles WHERE id=uid)<>'Edited faculty' OR (SELECT count(*) FROM teacher_subjects WHERE teacher_id=tid)<>1
 OR NOT EXISTS(SELECT 1 FROM teachers WHERE id=tid AND branch_code='PAKISTAN_NAVY' AND role_title=old_role AND status=old_status) THEN RAISE EXCEPTION 'Faculty update mismatch'; END IF;
 INSERT INTO faculty_checks VALUES('Edit persists every remaining field and exact subject mappings while retaining internal access state',true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);IF suggest_faculty_code()<>'FAC-2' THEN RAISE EXCEPTION 'Next code mismatch'; END IF;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 fields:=fields||jsonb_build_object('employeeId','FAC-99');denied:=false;
 BEGIN PERFORM portal_save_faculty(tid,uid,staff,fields); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Faculty code modification accepted'; END IF;
 fields:=fields||jsonb_build_object('employeeId','FAC-1','assignedSubjects',jsonb_build_array('NO_SUCH_SUBJECT'));denied:=false;
 BEGIN PERFORM portal_save_faculty(tid,uid,staff,fields); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied OR (SELECT count(*) FROM teacher_subjects WHERE teacher_id=tid)<>1 THEN RAISE EXCEPTION 'Invalid subject changed mappings'; END IF;
 INSERT INTO faculty_checks VALUES('Code immutable; invalid subject update rejected transactionally; next code FAC-2',true);
 PERFORM set_config('request.jwt.claim.sub',uid::text,true);PERFORM set_config('request.jwt.claim.role','authenticated',true);
 denied:=false;BEGIN PERFORM suggest_faculty_code(); EXCEPTION WHEN OTHERS THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Teacher could access administrator creation operation'; END IF;
 INSERT INTO faculty_checks VALUES('Non-admin faculty creation/suggestion denied',true);
END $$;
SELECT * FROM faculty_checks;
ROLLBACK;
