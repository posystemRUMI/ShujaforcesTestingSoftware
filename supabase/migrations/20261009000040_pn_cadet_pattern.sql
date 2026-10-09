BEGIN;
CREATE TABLE IF NOT EXISTS course_test_patterns (
 course_id uuid PRIMARY KEY REFERENCES courses(id),
 force_id uuid NOT NULL REFERENCES forces(id),
 configuration jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE course_test_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_patterns_staff_read ON course_test_patterns FOR SELECT TO authenticated USING(is_admin() OR is_teacher());
GRANT SELECT ON course_test_patterns TO authenticated;
INSERT INTO course_test_patterns(course_id,force_id,configuration)
SELECT c.id,c.force_id,jsonb_build_object('name','PN Cadet','stage','INITIAL','version',1,'isDefault',true,'isActive',true,'sections',jsonb_build_array(
 jsonb_build_object('id','pn-intelligence','sectionCode','INTEL_PN_CADET','sectionName','Intelligence','displayOrder',1,'defaultEnabled',true,'defaultQuestionCount',40,'minQuestionCount',40,'maxQuestionCount',40,'defaultDurationMinutes',25,'minDurationMinutes',25,'maxDurationMinutes',25,'isMandatory',false,'teacherCanDisable',true,'teacherCanOverrideQuestionCount',false,'teacherCanOverrideDuration',false,'passingPercentage',60,'sectionType','INTELLIGENCE','subjects',(SELECT jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,'isDefault',true) ORDER BY code) FROM subjects WHERE code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL')),'subjectQuotas',(SELECT jsonb_object_agg(id,CASE code WHEN 'INTELLIGENCE_VERBAL' THEN 25 ELSE 15 END) FROM subjects WHERE code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL'))),
 jsonb_build_object('id','pn-academic','sectionCode','ACADEMIC_PN_CADET','sectionName','Academic','displayOrder',2,'defaultEnabled',true,'defaultQuestionCount',40,'minQuestionCount',40,'maxQuestionCount',40,'defaultDurationMinutes',25,'minDurationMinutes',25,'maxDurationMinutes',25,'isMandatory',false,'teacherCanDisable',true,'teacherCanOverrideQuestionCount',false,'teacherCanOverrideDuration',false,'passingPercentage',60,'sectionType','ACADEMIC','subjects',(SELECT jsonb_agg(jsonb_build_object('id',id,'code',code,'name',name,'isDefault',true) ORDER BY code) FROM subjects WHERE category='ACADEMIC' AND status='ACTIVE'))
)) FROM courses c WHERE c.code='PN_CADET'
ON CONFLICT(course_id) DO UPDATE SET configuration=excluded.configuration,updated_at=now();
-- Designate the existing shared intelligence records; no question copies or keys change.
INSERT INTO question_courses(question_id,course_id) SELECT q.id,c.id FROM questions q CROSS JOIN courses c WHERE q.bank_key IN('v','nv') AND c.code='PN_CADET' ON CONFLICT DO NOTHING;
DO $$ BEGIN
 IF to_regprocedure('exam_validate_test_before_navy(uuid)') IS NULL THEN ALTER FUNCTION exam_validate_test(uuid) RENAME TO exam_validate_test_before_navy; END IF;
END $$;
REVOKE ALL ON FUNCTION exam_validate_test_before_navy(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION exam_validate_test(tid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record; v integer; nv integer;
BEGIN
 PERFORM exam_validate_test_before_navy(tid);
 IF EXISTS(SELECT 1 FROM test_eligible_courses e JOIN courses c ON c.id=e.course_id WHERE e.test_id=tid AND c.code='PN_CADET') THEN
  FOR s IN SELECT ts.* FROM test_sections ts WHERE ts.test_id=tid LOOP
   IF s.section_code='INTEL_PN_CADET' OR s.name ILIKE '%Intelligence%' THEN
    SELECT count(*) FILTER(WHERE sub.code='INTELLIGENCE_VERBAL'),count(*) FILTER(WHERE sub.code='INTELLIGENCE_NON_VERBAL') INTO v,nv FROM test_section_questions x JOIN questions q ON q.id=x.question_id JOIN subjects sub ON sub.id=q.subject_id WHERE x.test_section_id=s.id;
    IF s.question_count<>40 OR s.duration_minutes<>25 OR v<>25 OR nv<>15 THEN RAISE EXCEPTION 'PN Cadet Intelligence requires exactly 25 Verbal + 15 Non-Verbal questions in 25 minutes'; END IF;
   ELSIF s.section_code='ACADEMIC_PN_CADET' OR s.name ILIKE '%Academic%' THEN
    IF s.question_count<>40 OR s.duration_minutes<>25 THEN RAISE EXCEPTION 'PN Cadet Academic requires exactly 40 questions in 25 minutes'; END IF;
   ELSE RAISE EXCEPTION 'Select a designated PN Cadet Intelligence or Academic section';
   END IF;
  END LOOP;
 END IF;
END $$;
REVOKE ALL ON FUNCTION exam_validate_test(uuid) FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
