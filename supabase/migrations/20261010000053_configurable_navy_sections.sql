BEGIN;

-- New Navy blueprints have separate editable parts. Existing tests and snapshots
-- retain their saved composition and deadlines.
UPDATE course_test_patterns p SET configuration = configuration || jsonb_build_object(
 'sections', (
  SELECT jsonb_agg(jsonb_build_object(
   'id',x.id,'sectionCode',x.code,'sectionName',x.name,'displayOrder',x.position,
   'defaultEnabled',true,'defaultQuestionCount',x.questions,
   'minQuestionCount',1,'maxQuestionCount',2147483647,
   'defaultDurationMinutes',25,'minDurationMinutes',1,'maxDurationMinutes',2147483647,
   'isMandatory',false,'teacherCanDisable',true,
   'teacherCanOverrideQuestionCount',true,'teacherCanOverrideDuration',true,
   'passingPercentage',60,'sectionType',x.kind,
   'subjects',(SELECT jsonb_agg(jsonb_build_object('id',s.id,'code',s.code,'name',s.name,'isDefault',true) ORDER BY s.code)
    FROM subjects s WHERE (x.subject_code IS NOT NULL AND s.code=x.subject_code)
     OR (x.kind='ACADEMIC' AND s.category='ACADEMIC' AND s.status='ACTIVE'))
  ) ORDER BY x.position)
  FROM (VALUES
   ('pn-verbal','VERBAL_PN_CADET','Verbal Intelligence',1,25,'INTELLIGENCE','INTELLIGENCE_VERBAL'),
   ('pn-non-verbal','NON_VERBAL_PN_CADET','Non-Verbal Intelligence',2,15,'INTELLIGENCE','INTELLIGENCE_NON_VERBAL'),
   ('pn-academic','ACADEMIC_PN_CADET','Academic',3,40,'ACADEMIC',NULL)
  ) x(id,code,name,position,questions,kind,subject_code)
 )
), updated_at=now() WHERE course_id='00000000-0000-0000-0000-000000000103';

CREATE OR REPLACE FUNCTION exam_validate_test(tid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record; required_bank text;
BEGIN
 -- Retain exact counts, positive durations, total duration, approved questions,
 -- eligibility, valid options, duplicate prevention and section subject checks.
 PERFORM exam_validate_test_before_navy(tid);
 IF EXISTS(SELECT 1 FROM test_eligible_courses e JOIN courses c ON c.id=e.course_id WHERE e.test_id=tid AND c.code='PN_CADET') THEN
  FOR s IN SELECT * FROM test_sections WHERE test_id=tid LOOP
   required_bank:=CASE s.section_code
    WHEN 'VERBAL_PN_CADET' THEN 'v'
    WHEN 'NON_VERBAL_PN_CADET' THEN 'nv'
    WHEN 'ACADEMIC_PN_CADET' THEN 'PN-CADET-A'
    ELSE NULL END;
   -- Legacy combined Intelligence remains valid for existing saved tests.
   IF s.section_code='INTEL_PN_CADET' THEN
    IF EXISTS(SELECT 1 FROM test_section_questions x JOIN questions q ON q.id=x.question_id
      WHERE x.test_section_id=s.id AND q.bank_key NOT IN('v','nv')) THEN
     RAISE EXCEPTION 'PN Cadet Intelligence can only use shared intelligence banks';
    END IF;
   ELSIF required_bank IS NULL THEN
    RAISE EXCEPTION 'Select a designated PN Cadet Verbal, Non-Verbal or Academic section';
   ELSIF EXISTS(SELECT 1 FROM test_section_questions x JOIN questions q ON q.id=x.question_id
     WHERE x.test_section_id=s.id AND q.bank_key IS DISTINCT FROM required_bank) THEN
    RAISE EXCEPTION 'PN Cadet section % can only use its designated % bank',s.section_code,required_bank;
   END IF;
  END LOOP;
 END IF;
END $$;
REVOKE ALL ON FUNCTION exam_validate_test(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION save_pn_cadet_test_pattern(p_template jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved jsonb; proposed jsonb; original jsonb; updated jsonb; sections jsonb:='[]'; n integer; count_value integer; minute_value integer;
BEGIN
 IF NOT is_admin() THEN RAISE EXCEPTION 'Only administrators can modify master patterns'; END IF;
 IF p_template->>'id' IS DISTINCT FROM '00000000-0000-0000-0000-000000000103'
  OR p_template->>'entryCourseId' IS DISTINCT FROM '00000000-0000-0000-0000-000000000103' THEN RAISE EXCEPTION 'Invalid PN Cadet pattern owner'; END IF;
 SELECT configuration INTO saved FROM course_test_patterns WHERE course_id='00000000-0000-0000-0000-000000000103' FOR UPDATE;
 IF saved IS NULL THEN RAISE EXCEPTION 'PN Cadet pattern is missing'; END IF;
 IF jsonb_typeof(p_template->'sections') IS DISTINCT FROM 'array' OR jsonb_array_length(p_template->'sections')<>3 THEN RAISE EXCEPTION 'Navy requires three designated pattern sections'; END IF;
 FOR n IN 0..2 LOOP
  proposed:=p_template->'sections'->n; original:=saved->'sections'->n;
  IF proposed->'sectionCode' IS DISTINCT FROM original->'sectionCode'
   OR proposed->'subjects' IS DISTINCT FROM original->'subjects' THEN RAISE EXCEPTION 'Navy section bank bindings cannot be changed'; END IF;
  IF coalesce(proposed->>'defaultQuestionCount','') !~ '^[1-9][0-9]*$'
   OR coalesce(proposed->>'defaultDurationMinutes','') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'Positive integer question counts and minutes required'; END IF;
  count_value:=(proposed->>'defaultQuestionCount')::integer; minute_value:=(proposed->>'defaultDurationMinutes')::integer;
  sections:=sections||jsonb_build_array(original||jsonb_build_object('defaultQuestionCount',count_value,'defaultDurationMinutes',minute_value));
 END LOOP;
 IF coalesce(trim(p_template->>'name'),'')='' OR coalesce((p_template->>'version')::integer,0)<1 THEN RAISE EXCEPTION 'Pattern name and positive version are required'; END IF;
 updated:=saved||jsonb_build_object('name',p_template->>'name','description',p_template->'description','stage',coalesce(p_template->>'stage','INITIAL'),'version',(p_template->>'version')::integer,'sections',sections);
 UPDATE course_test_patterns SET configuration=updated,updated_at=now() WHERE course_id='00000000-0000-0000-0000-000000000103' AND configuration IS DISTINCT FROM updated;
END $$;
REVOKE ALL ON FUNCTION save_pn_cadet_test_pattern(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION save_pn_cadet_test_pattern(jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
