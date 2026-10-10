BEGIN;
-- Single academy: existing student/course tables have no tenant scope.
CREATE TABLE attendance_course_rules (
 course_id uuid PRIMARY KEY REFERENCES courses(id) ON DELETE RESTRICT,
 force_id uuid NOT NULL REFERENCES forces(id) ON DELETE RESTRICT,
 section text NOT NULL CHECK(section IN('Army','Navy','Air Force'))
);
INSERT INTO attendance_course_rules SELECT id,force_id,CASE force_id
 WHEN '00000000-0000-0000-0000-000000000001' THEN 'Army'
 WHEN '00000000-0000-0000-0000-000000000002' THEN 'Air Force' ELSE 'Navy' END
 FROM courses WHERE id IN('00000000-0000-0000-0000-000000000101','10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000103');
DO $$ BEGIN IF (SELECT count(*) FROM attendance_course_rules)<>5 THEN RAISE EXCEPTION 'Expected five inspected attendance courses'; END IF; END $$;
CREATE TABLE attendance_registers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attendance_date date NOT NULL UNIQUE,
 state text NOT NULL DEFAULT 'OPEN' CHECK(state IN('OPEN','FINALIZED','NON_CLASS')),
 reason text, created_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
 finalized_at timestamptz, finalized_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
 reopened_at timestamptz, reopened_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);
CREATE TABLE attendance_roster (
 register_id uuid NOT NULL REFERENCES attendance_registers(id) ON DELETE RESTRICT,
 student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
 roll_number text NOT NULL, student_name text NOT NULL, photo_url text,
 enrollment_date date NOT NULL, memberships jsonb NOT NULL CHECK(jsonb_typeof(memberships)='array'),
 eligible boolean NOT NULL DEFAULT true, conflict boolean NOT NULL DEFAULT false,
 PRIMARY KEY(register_id,student_id)
);
CREATE TABLE attendance_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), register_id uuid NOT NULL,
 student_id uuid NOT NULL, status text NOT NULL DEFAULT 'UNMARKED' CHECK(status IN('UNMARKED','PRESENT','ABSENT','EXCUSED')),
 arrival_at timestamptz, recording_section text CHECK(recording_section IN('Army','Navy','Air Force')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
 UNIQUE(register_id,student_id), FOREIGN KEY(register_id,student_id) REFERENCES attendance_roster(register_id,student_id) ON DELETE RESTRICT
 ,CONSTRAINT attendance_present_arrival_required CHECK(status<>'PRESENT' OR arrival_at IS NOT NULL)
);
CREATE INDEX attendance_records_student_date ON attendance_records(student_id,register_id);
CREATE INDEX attendance_roster_memberships ON attendance_roster USING gin(memberships);
CREATE TABLE attendance_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, register_id uuid NOT NULL REFERENCES attendance_registers(id) ON DELETE RESTRICT,
 student_id uuid REFERENCES students(id) ON DELETE RESTRICT, action text NOT NULL,
 previous_status text, new_status text, reason text,
 actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL, occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX attendance_audit_register ON attendance_audit(register_id,occurred_at);
ALTER TABLE attendance_course_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendance_rules_admin ON attendance_course_rules FOR SELECT TO authenticated USING(is_admin());
CREATE POLICY attendance_register_admin ON attendance_registers FOR SELECT TO authenticated USING(is_admin());
CREATE POLICY attendance_roster_read ON attendance_roster FOR SELECT TO authenticated USING(is_admin() OR EXISTS(SELECT 1 FROM students s JOIN profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.id=auth.uid() AND p.role='STUDENT' AND p.status='ACTIVE'));
CREATE POLICY attendance_record_read ON attendance_records FOR SELECT TO authenticated USING(is_admin() OR EXISTS(SELECT 1 FROM students s JOIN profiles p ON p.id=s.profile_id WHERE s.id=student_id AND p.id=auth.uid() AND p.role='STUDENT' AND p.status='ACTIVE'));
CREATE POLICY attendance_audit_admin ON attendance_audit FOR SELECT TO authenticated USING(is_admin());
REVOKE ALL ON attendance_course_rules,attendance_registers,attendance_roster,attendance_records,attendance_audit FROM anon,authenticated;
GRANT SELECT ON attendance_course_rules,attendance_registers,attendance_roster,attendance_records,attendance_audit TO authenticated;

CREATE FUNCTION attendance_today() RETURNS date LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$ SELECT (now() AT TIME ZONE 'Asia/Karachi')::date $$;
-- No frontend labels participate in eligibility. Primary assignment and existing
-- saved course enrollments are resolved to the inspected course/force IDs.
CREATE FUNCTION attendance_memberships(sid uuid,day date) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('force_id',x.force_id,'course_id',x.course_id,'section',x.section,'course_name',x.name) ORDER BY x.section,x.course_id),'[]') FROM (
 SELECT DISTINCT r.force_id,r.course_id,r.section,c.name FROM attendance_course_rules r JOIN courses c ON c.id=r.course_id AND c.force_id=r.force_id AND c.status='ACTIVE'
 JOIN students s ON s.id=sid JOIN profiles p ON p.id=s.profile_id AND p.role='STUDENT' AND p.status='ACTIVE'
 WHERE s.status='ACTIVE' AND coalesce(s.admission_date,(s.created_at AT TIME ZONE 'Asia/Karachi')::date)<=day
 AND ((s.target_course_id=c.id AND s.target_force_id=c.force_id) OR EXISTS(SELECT 1 FROM batch_enrollments e JOIN batches b ON b.id=e.batch_id WHERE e.student_id=s.id AND e.status='ACTIVE' AND b.course_id=c.id AND (e.enrolled_at AT TIME ZONE 'Asia/Karachi')::date<=day))
 ) x $$;
CREATE FUNCTION attendance_sync_internal(rid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r attendance_registers%ROWTYPE; s record; m jsonb;
BEGIN
 SELECT * INTO r FROM attendance_registers WHERE id=rid FOR UPDATE;
 IF r.state<>'OPEN' THEN RAISE EXCEPTION 'Only an Open register can synchronize its roster'; END IF;
 -- Historical snapshots are never silently rebuilt.
 IF r.attendance_date<>attendance_today() AND EXISTS(SELECT 1 FROM attendance_roster WHERE register_id=rid) THEN RETURN; END IF;
 FOR s IN SELECT st.*,p.display_name FROM students st JOIN profiles p ON p.id=st.profile_id LOOP
  m:=attendance_memberships(s.id,r.attendance_date);
  IF jsonb_array_length(m)>0 THEN
   INSERT INTO attendance_roster(register_id,student_id,roll_number,student_name,photo_url,enrollment_date,memberships)
   VALUES(rid,s.id,s.roll_number,s.display_name,s.photo_url,coalesce(s.admission_date,(s.created_at AT TIME ZONE 'Asia/Karachi')::date),m) ON CONFLICT DO NOTHING;
   INSERT INTO attendance_records(register_id,student_id,updated_by) VALUES(rid,s.id,auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  UPDATE attendance_roster ro SET
   memberships=CASE WHEN a.status='UNMARKED' AND jsonb_array_length(m)>0 THEN m ELSE ro.memberships END,
   eligible=CASE WHEN a.status='UNMARKED' THEN jsonb_array_length(m)>0 ELSE ro.eligible END,
   conflict=CASE WHEN NOT ro.eligible AND a.status<>'UNMARKED' THEN false WHEN a.status='UNMARKED' THEN false ELSE ro.memberships IS DISTINCT FROM m END
  FROM attendance_records a WHERE ro.register_id=rid AND ro.student_id=s.id AND a.register_id=rid AND a.student_id=s.id;
 END LOOP;
END $$;

CREATE FUNCTION attendance_admin(p_action text,p_date date,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r attendance_registers%ROWTYPE; ro attendance_roster%ROWTYPE; a attendance_records%ROWTYPE; s students%ROWTYPE;
 m jsonb; section text:=p_data->>'section'; change_reason text:=trim(p_data->>'reason'); new_status text:=p_data->>'status'; now_at timestamptz:=clock_timestamp(); n integer; actual text;
BEGIN
 IF auth.uid() IS NULL OR NOT is_admin() THEN RAISE EXCEPTION 'Active administrator required for attendance'; END IF;
 IF p_date IS NULL OR p_date>attendance_today() THEN RAISE EXCEPTION 'Future attendance is not allowed (Asia/Karachi)'; END IF;
 SELECT * INTO r FROM attendance_registers WHERE attendance_date=p_date FOR UPDATE;
 IF p_action='CREATE' THEN
  IF r.id IS NOT NULL THEN RETURN jsonb_build_object('message','Register already recorded'); END IF;
  IF p_date<attendance_today() AND coalesce((p_data->>'historicalConfirmed')::boolean,false)=false THEN RAISE EXCEPTION 'Explicit confirmation required to create a past register from currently known enrollment data'; END IF;
  INSERT INTO attendance_registers(attendance_date,created_by) VALUES(p_date,auth.uid()) ON CONFLICT(attendance_date) DO NOTHING RETURNING * INTO r;
  IF r.id IS NULL THEN RETURN jsonb_build_object('message','Register already recorded'); END IF;
  PERFORM attendance_sync_internal(r.id);
  INSERT INTO attendance_audit(register_id,action,actor_id,reason) VALUES(r.id,'CREATE',auth.uid(),change_reason);
  RETURN jsonb_build_object('message','Daily register created');
 END IF;
 IF r.id IS NULL THEN RAISE EXCEPTION 'No register recorded. Create the register explicitly first.'; END IF;
 IF p_action='SYNC' THEN PERFORM attendance_sync_internal(r.id); RETURN jsonb_build_object('message','Roster synchronized; inspect eligibility conflicts'); END IF;
 IF p_action='MARK' THEN
  IF r.state='FINALIZED' THEN RAISE EXCEPTION 'Attendance is Finalized; use a correction with a reason'; END IF;
  IF r.state='NON_CLASS' THEN RAISE EXCEPTION 'Non-class day: attendance is not required'; END IF;
  SELECT * INTO s FROM students WHERE roll_number=trim(p_data->>'roll');
  IF s.id IS NULL THEN RAISE EXCEPTION 'Roll number not found'; END IF;
  m:=attendance_memberships(s.id,p_date);
  SELECT string_agg(DISTINCT x->>'course_name',', ')||' — correct attendance section: '||string_agg(DISTINCT x->>'section',', ') INTO actual FROM jsonb_array_elements(m) x;
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(m) x WHERE x->>'section'=section) THEN
   IF actual IS NULL THEN SELECT coalesce(c.name,'No valid course') INTO actual FROM students st LEFT JOIN courses c ON c.id=st.target_course_id WHERE st.id=s.id; END IF;
   RAISE EXCEPTION 'Student is not eligible for % on %. Actual course: %',coalesce(section,'this section'),p_date,actual;
  END IF;
  PERFORM attendance_sync_internal(r.id);
  SELECT * INTO ro FROM attendance_roster WHERE register_id=r.id AND student_id=s.id;
  IF ro.student_id IS NULL OR NOT ro.eligible OR ro.conflict OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(ro.memberships) x WHERE x->>'section'=section) THEN RAISE EXCEPTION 'Student is not eligible for this saved roster; resolve any assignment conflict'; END IF;
  SELECT * INTO a FROM attendance_records WHERE register_id=r.id AND student_id=s.id FOR UPDATE;
  IF a.status='PRESENT' THEN RETURN jsonb_build_object('message','Already marked present on '||p_date,'student_name',ro.student_name,'already_present',true); END IF;
  IF a.status<>'UNMARKED' THEN RAISE EXCEPTION 'Saved attendance requires an explicit correction with a reason'; END IF;
  UPDATE attendance_records SET status='PRESENT',arrival_at=now_at,recording_section=section,updated_at=now_at,updated_by=auth.uid() WHERE id=a.id;
  INSERT INTO attendance_audit(register_id,student_id,action,previous_status,new_status,actor_id) VALUES(r.id,s.id,'MARK','UNMARKED','PRESENT',auth.uid());
  RETURN jsonb_build_object('message',ro.student_name||' marked Present','student_name',ro.student_name,'already_present',false);
 END IF;
 IF p_action='FINALIZE' THEN
  IF r.state='FINALIZED' THEN RETURN jsonb_build_object('message','Already finalized'); END IF;
  IF r.state<>'OPEN' THEN RAISE EXCEPTION 'Non-class days cannot be finalized'; END IF;
  PERFORM attendance_sync_internal(r.id);
  IF EXISTS(SELECT 1 FROM attendance_roster WHERE register_id=r.id AND conflict AND eligible) THEN RAISE EXCEPTION 'Resolve marked-student eligibility conflicts before finalization'; END IF;
  SELECT count(*) INTO n FROM attendance_records entry JOIN attendance_roster roster USING(register_id,student_id) WHERE entry.register_id=r.id AND roster.eligible AND entry.status='UNMARKED';
  IF coalesce((p_data->>'expectedUnmarked')::integer,-1)<>n THEN RAISE EXCEPTION 'Roster changed: % students remain unmarked. Refresh and confirm again.',n; END IF;
  INSERT INTO attendance_audit(register_id,student_id,action,previous_status,new_status,actor_id)
   SELECT r.id,entry.student_id,'FINALIZE','UNMARKED','ABSENT',auth.uid() FROM attendance_records entry JOIN attendance_roster roster USING(register_id,student_id) WHERE entry.register_id=r.id AND roster.eligible AND entry.status='UNMARKED';
  UPDATE attendance_records entry SET status='ABSENT',updated_at=now_at,updated_by=auth.uid() FROM attendance_roster roster WHERE entry.register_id=r.id AND roster.register_id=r.id AND roster.student_id=entry.student_id AND roster.eligible AND entry.status='UNMARKED';
  UPDATE attendance_registers SET state='FINALIZED',finalized_at=now_at,finalized_by=auth.uid() WHERE id=r.id;
  INSERT INTO attendance_audit(register_id,action,previous_status,new_status,actor_id) VALUES(r.id,'FINALIZE',r.state,'FINALIZED',auth.uid());
  RETURN jsonb_build_object('message','Attendance finalized','new_absent',n);
 END IF;
 IF change_reason IS NULL OR change_reason='' THEN RAISE EXCEPTION 'A reason is required'; END IF;
 IF p_action IN('CORRECT','RESOLVE_CONFLICT') THEN
  SELECT * INTO ro FROM attendance_roster WHERE register_id=r.id AND student_id=(p_data->>'studentId')::uuid;
  IF ro.student_id IS NULL THEN RAISE EXCEPTION 'Student not in this saved register'; END IF;
  SELECT * INTO a FROM attendance_records WHERE register_id=r.id AND student_id=ro.student_id FOR UPDATE;
  IF p_action='RESOLVE_CONFLICT' THEN
   IF NOT ro.conflict THEN RAISE EXCEPTION 'No eligibility conflict to resolve'; END IF;
   UPDATE attendance_roster SET eligible=false,conflict=false WHERE register_id=r.id AND student_id=ro.student_id;
   INSERT INTO attendance_audit(register_id,student_id,action,previous_status,new_status,reason,actor_id) VALUES(r.id,ro.student_id,'EXCLUDE_CONFLICT',a.status,a.status,change_reason,auth.uid());
   RETURN jsonb_build_object('message','Conflict resolved by explicit roster exclusion; attendance retained');
  END IF;
  IF r.state='NON_CLASS' THEN RAISE EXCEPTION 'Reopen this non-class day before correcting attendance'; END IF;
  IF new_status NOT IN('PRESENT','ABSENT','EXCUSED','UNMARKED') OR new_status IS NULL OR (new_status='UNMARKED' AND r.state<>'OPEN') THEN RAISE EXCEPTION 'Invalid correction status for this register'; END IF;
  IF NOT ro.eligible THEN RAISE EXCEPTION 'Excluded students cannot be marked through this attendance workflow'; END IF;
  IF new_status='PRESENT' AND p_date=attendance_today() AND ro.memberships IS DISTINCT FROM attendance_memberships(ro.student_id,p_date) THEN
   RAISE EXCEPTION 'The saved force/course assignment changed or is no longer eligible. Synchronize and resolve the roster conflict before marking Present.';
  END IF;
  IF a.status=new_status THEN RETURN jsonb_build_object('message','Status already saved; no change'); END IF;
  UPDATE attendance_records SET status=new_status,arrival_at=CASE WHEN new_status='PRESENT' THEN coalesce(arrival_at,now_at) ELSE arrival_at END,updated_at=now_at,updated_by=auth.uid() WHERE id=a.id;
  INSERT INTO attendance_audit(register_id,student_id,action,previous_status,new_status,reason,actor_id) VALUES(r.id,ro.student_id,'CORRECT',a.status,new_status,change_reason,auth.uid());
 ELSIF p_action='REOPEN' THEN
  IF r.state='OPEN' THEN RETURN jsonb_build_object('message','Already Open'); END IF;
  UPDATE attendance_registers SET state='OPEN',reopened_at=now_at,reopened_by=auth.uid(),reason=NULL WHERE id=r.id;
  INSERT INTO attendance_audit(register_id,action,previous_status,new_status,reason,actor_id) VALUES(r.id,'REOPEN',r.state,'OPEN',change_reason,auth.uid());
 ELSIF p_action='NON_CLASS' THEN
  IF r.state='NON_CLASS' THEN RETURN jsonb_build_object('message','Already a non-class day'); END IF;
  IF EXISTS(SELECT 1 FROM attendance_records WHERE register_id=r.id AND status<>'UNMARKED') AND coalesce((p_data->>'resolveRecorded')::boolean,false)=false THEN RAISE EXCEPTION 'Recorded attendance exists. Explicit audited exclusion from calculations is required; records will be retained.'; END IF;
  UPDATE attendance_registers SET state='NON_CLASS',reason=change_reason WHERE id=r.id;
  INSERT INTO attendance_audit(register_id,action,previous_status,new_status,reason,actor_id) VALUES(r.id,'NON_CLASS',r.state,'NON_CLASS',change_reason,auth.uid());
 ELSE RAISE EXCEPTION 'Unknown attendance action'; END IF;
 RETURN jsonb_build_object('message','Attendance updated');
END $$;

CREATE FUNCTION attendance_report(p_from date,p_to date,p_section text DEFAULT NULL,p_course uuid DEFAULT NULL,p_search text DEFAULT '',p_status text DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 50,p_include_unmarked boolean DEFAULT true) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT is_admin() THEN RAISE EXCEPTION 'Active administrator required for attendance reports'; END IF;
 IF p_from IS NULL OR p_to IS NULL OR p_to<p_from OR p_to-p_from>366 THEN RAISE EXCEPTION 'Choose a date range of at most 367 days'; END IF;
 WITH source_records AS (
 SELECT r.attendance_date,r.state,ro.*,a.status,a.arrival_at,a.updated_at,a.recording_section
 FROM attendance_roster ro JOIN attendance_registers r ON r.id=ro.register_id JOIN attendance_records a USING(register_id,student_id)
 WHERE r.attendance_date BETWEEN p_from AND p_to AND ro.eligible
 AND (p_section IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(ro.memberships) x WHERE x->>'section'=p_section))
 AND (p_course IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(ro.memberships) x WHERE x->>'course_id'=p_course::text AND (p_section IS NULL OR x->>'section'=p_section)))
 AND (coalesce(p_search,'')='' OR ro.roll_number ILIKE '%'||p_search||'%' OR ro.student_name ILIKE '%'||p_search||'%')
 ), matching AS (SELECT * FROM source_records WHERE p_status IS NULL OR (state<>'NON_CLASS' AND status=p_status)), stats AS (
 SELECT count(DISTINCT student_id) FILTER(WHERE state<>'NON_CLASS') AS unique_students,count(*) FILTER(WHERE state<>'NON_CLASS') AS eligible,count(*) FILTER(WHERE state<>'NON_CLASS' AND status='PRESENT') AS present,count(*) FILTER(WHERE state<>'NON_CLASS' AND status='ABSENT') AS absent,
 count(*) FILTER(WHERE state<>'NON_CLASS' AND status='EXCUSED') AS excused,count(*) FILTER(WHERE state<>'NON_CLASS' AND status='UNMARKED') AS unmarked,count(*) FILTER(WHERE conflict) AS conflicts,
 (SELECT count(*) FROM source_records WHERE state='FINALIZED' AND status='PRESENT' AND student_id IN(SELECT student_id FROM matching)) AS official_present,
 (SELECT count(*) FROM source_records WHERE state='FINALIZED' AND status='ABSENT' AND student_id IN(SELECT student_id FROM matching)) AS official_absent FROM matching
 ), monthly AS (
 SELECT student_id,student_name,roll_number,to_char(attendance_date,'YYYY-MM') AS month,
 count(*) FILTER(WHERE state='FINALIZED' AND status='PRESENT') AS present,count(*) FILTER(WHERE state='FINALIZED' AND status='ABSENT') AS absent,count(*) FILTER(WHERE state='FINALIZED' AND status='EXCUSED') AS excused,
 round(100.0*count(*) FILTER(WHERE state='FINALIZED' AND status='PRESENT')/nullif(count(*) FILTER(WHERE state='FINALIZED' AND status IN('PRESENT','ABSENT')),0),2) AS percentage
 FROM source_records WHERE student_id IN(SELECT student_id FROM matching) GROUP BY student_id,student_name,roll_number,to_char(attendance_date,'YYYY-MM')
 ) SELECT jsonb_build_object(
 'today',attendance_today(),'totals',(SELECT to_jsonb(stats)||jsonb_build_object('percentage',round(100.0*official_present/nullif(official_present+official_absent,0),2)) FROM stats),
 'total',(SELECT count(*) FROM matching WHERE p_include_unmarked OR status<>'UNMARKED'),
 'rows',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT * FROM matching WHERE p_include_unmarked OR status<>'UNMARKED' ORDER BY attendance_date DESC,arrival_at DESC NULLS LAST,student_name,student_id LIMIT least(greatest(p_limit,1),200) OFFSET greatest(p_offset,0)) x),'[]'),
 'registers',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY attendance_date DESC) FROM attendance_registers r WHERE attendance_date BETWEEN p_from AND p_to),'[]'),
 'monthly',coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM monthly x),'[]'),
 'courses',(SELECT jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'section',a.section)) FROM attendance_course_rules a JOIN courses c ON c.id=a.course_id),
 'audit',CASE WHEN p_from=p_to THEN coalesce((SELECT jsonb_agg(to_jsonb(x)) FROM (SELECT a.*,p.display_name AS actor_name FROM attendance_audit a LEFT JOIN profiles p ON p.id=a.actor_id JOIN attendance_registers r ON r.id=a.register_id WHERE r.attendance_date=p_from ORDER BY a.id DESC LIMIT 100)x),'[]') ELSE '[]' END
 ) INTO result;
 RETURN result;
END $$;

CREATE FUNCTION attendance_student(p_month date DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE sid uuid:=portal_student_id(); first_day date:=date_trunc('month',coalesce(p_month,attendance_today()))::date; last_day date; result jsonb;
BEGIN
 last_day:=least((first_day+interval '1 month - 1 day')::date,attendance_today());
 WITH days AS (
 SELECT d::date AS date,CASE WHEN r.state='NON_CLASS' THEN 'NON_CLASS' WHEN r.id IS NULL THEN 'NO_REGISTER' WHEN ro.student_id IS NULL OR NOT ro.eligible THEN 'NOT_ELIGIBLE' ELSE a.status END AS status,r.state,a.arrival_at
 FROM generate_series(first_day,last_day,'1 day') d LEFT JOIN attendance_registers r ON r.attendance_date=d::date LEFT JOIN attendance_roster ro ON ro.register_id=r.id AND ro.student_id=sid LEFT JOIN attendance_records a ON a.register_id=r.id AND a.student_id=sid
 ), stats AS (
 SELECT count(*) FILTER(WHERE state='FINALIZED' AND status='PRESENT') AS present,count(*) FILTER(WHERE state='FINALIZED' AND status='ABSENT') AS absent,count(*) FILTER(WHERE state='FINALIZED' AND status='EXCUSED') AS excused FROM days
 ) SELECT jsonb_build_object('today',attendance_today(),'month',first_day,'totals',(SELECT to_jsonb(stats)||jsonb_build_object('percentage',round(100.0*present/nullif(present+absent,0),2)) FROM stats),
 'today_status',(SELECT CASE WHEN r.state='NON_CLASS' THEN 'NON_CLASS' WHEN r.id IS NULL THEN 'NO_REGISTER' WHEN ro.student_id IS NULL OR NOT ro.eligible THEN 'NOT_ELIGIBLE' ELSE a.status END FROM (SELECT 1)x LEFT JOIN attendance_registers r ON r.attendance_date=attendance_today() LEFT JOIN attendance_roster ro ON ro.register_id=r.id AND ro.student_id=sid LEFT JOIN attendance_records a ON a.register_id=r.id AND a.student_id=sid),
 'days',coalesce((SELECT jsonb_agg(to_jsonb(days) ORDER BY date DESC) FROM days),'[]')) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION attendance_memberships(uuid,date),attendance_sync_internal(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION attendance_today(),attendance_admin(text,date,jsonb),attendance_report(date,date,text,uuid,text,text,integer,integer,boolean),attendance_student(date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION attendance_today(),attendance_admin(text,date,jsonb),attendance_report(date,date,text,uuid,text,text,integer,integer,boolean),attendance_student(date) TO authenticated;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
 ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
 ALTER PUBLICATION supabase_realtime ADD TABLE attendance_registers;
 END IF; END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
