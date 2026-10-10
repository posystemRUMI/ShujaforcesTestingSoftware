BEGIN;

-- Course-specific entry labels; existing student roll numbers remain unchanged.
ALTER TABLE attendance_course_rules ADD COLUMN roll_prefix text;
UPDATE attendance_course_rules SET roll_prefix=CASE course_id
 WHEN '00000000-0000-0000-0000-000000000101' THEN 'SFA-PMA-'
 WHEN '10000000-0000-0000-0000-000000000004' THEN 'SFA-AFNS-'
 WHEN '20000000-0000-0000-0000-000000000003' THEN 'SFA-CAE-'
 WHEN '20000000-0000-0000-0000-000000000006' THEN 'SFA-AIRMAN-'
 WHEN '00000000-0000-0000-0000-000000000103' THEN 'SFA-PNCADET-'
 END;
ALTER TABLE attendance_course_rules ALTER COLUMN roll_prefix SET NOT NULL;
ALTER TABLE attendance_course_rules ADD CONSTRAINT attendance_course_prefix_unique UNIQUE(roll_prefix);
ALTER TABLE attendance_course_rules ADD CONSTRAINT attendance_course_prefix_format CHECK(roll_prefix ~ '^SFA-[A-Z]+-$');

CREATE FUNCTION attendance_mark_course(p_date date,p_course uuid,p_suffix text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rule attendance_course_rules%ROWTYPE; student students%ROWTYPE;
 suffix text:=btrim(p_suffix); candidates text[]; matches integer; memberships jsonb;
 actual text; rid uuid; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT is_admin() THEN RAISE EXCEPTION 'Active administrator required for attendance'; END IF;
 IF p_date IS NULL OR p_date>attendance_today() THEN RAISE EXCEPTION 'Future attendance is not allowed (Asia/Karachi)'; END IF;
 SELECT a.* INTO rule FROM attendance_course_rules a JOIN courses c ON c.id=a.course_id AND c.force_id=a.force_id AND c.status='ACTIVE' WHERE a.course_id=p_course;
 IF rule.course_id IS NULL THEN RAISE EXCEPTION 'Choose a valid attendance course'; END IF;
 IF suffix IS NULL OR suffix !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Enter only the numeric roll-number suffix after %; leading zeros are preserved',rule.roll_prefix; END IF;
 SELECT id INTO rid FROM attendance_registers WHERE attendance_date=p_date FOR UPDATE;
 IF rid IS NULL THEN RAISE EXCEPTION 'No register recorded. Create the register explicitly first.'; END IF;
 -- Resolve both the requested course label and the existing registration prefix.
 -- Never cast suffixes to numbers or alter historical roll identifiers.
 candidates:=ARRAY[rule.roll_prefix||suffix,student_roll_prefix(rule.force_id,rule.course_id)||'-'||suffix];
 -- Also support a saved additional course enrollment without issuing another
 -- roll number. Reject ambiguous suffixes rather than choosing a student.
 SELECT array_agg(st.roll_number) INTO candidates FROM students st
 WHERE st.roll_number=ANY(candidates) OR
 (right(st.roll_number,length(suffix)+1)='-'||suffix AND EXISTS(
  SELECT 1 FROM jsonb_array_elements(attendance_memberships(st.id,p_date)) x
  WHERE x->>'course_id'=rule.course_id::text AND x->>'force_id'=rule.force_id::text));
 SELECT count(*) INTO matches FROM students WHERE roll_number=ANY(candidates);
 IF matches=0 THEN RAISE EXCEPTION 'Roll number % not found in the selected course',rule.roll_prefix||suffix; END IF;
 IF matches>1 THEN RAISE EXCEPTION 'Ambiguous roll-number suffix for this course; resolve the saved identifiers before marking'; END IF;
 SELECT * INTO student FROM students WHERE roll_number=ANY(candidates) FOR SHARE;
 memberships:=attendance_memberships(student.id,p_date);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(memberships) x WHERE x->>'course_id'=rule.course_id::text AND x->>'force_id'=rule.force_id::text) THEN
  SELECT c.name||coalesce(' (correct attendance section: '||a.section||')','') INTO actual FROM courses c LEFT JOIN attendance_course_rules a ON a.course_id=c.id WHERE c.id=student.target_course_id;
  RAISE EXCEPTION 'Student % is not eligible for the selected course on %. Actual course: %',student.roll_number,p_date,coalesce(actual,'No eligible course');
 END IF;
 result:=attendance_admin('MARK',p_date,jsonb_build_object('section',rule.section,'roll',student.roll_number));
 -- Recheck the persisted historical roster too. Any failure rolls back the mark,
 -- roster synchronization and audit together, including already-present retries.
 IF NOT EXISTS(SELECT 1 FROM attendance_roster ro CROSS JOIN LATERAL jsonb_array_elements(ro.memberships) x WHERE ro.register_id=rid AND ro.student_id=student.id AND ro.eligible AND NOT ro.conflict AND x->>'course_id'=rule.course_id::text AND x->>'force_id'=rule.force_id::text) THEN
  RAISE EXCEPTION 'Student is not eligible for this course in the saved roster; resolve the assignment conflict';
 END IF;
 RETURN result||jsonb_build_object('roll_number',student.roll_number,'course_id',rule.course_id);
END $$;
REVOKE ALL ON FUNCTION attendance_mark_course(date,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION attendance_mark_course(date,uuid,text) TO authenticated;

-- Extend the existing authorized report catalog, preserving its queries/counts.
DO $$ DECLARE definition text; revised text;
BEGIN
 definition:=pg_get_functiondef('attendance_report(date,date,text,uuid,text,text,integer,integer,boolean)'::regprocedure);
 revised:=replace(definition,'''name'',c.name,''section'',a.section)', '''name'',c.name,''section'',a.section,''roll_prefix'',a.roll_prefix)');
 IF revised=definition THEN RAISE EXCEPTION 'Attendance report catalog did not match the inspected schema'; END IF;
 EXECUTE revised;
END $$;
COMMIT;
