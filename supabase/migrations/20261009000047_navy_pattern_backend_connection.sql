BEGIN;
CREATE FUNCTION save_pn_cadet_test_pattern(p_template jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE saved jsonb; sections jsonb:=p_template->'sections'; updated jsonb;
BEGIN
 IF NOT is_admin() THEN RAISE EXCEPTION 'Only administrators can modify master patterns'; END IF;
 IF p_template->>'id'<>'00000000-0000-0000-0000-000000000103' OR p_template->>'entryCourseId'<>'00000000-0000-0000-0000-000000000103' THEN RAISE EXCEPTION 'Invalid PN Cadet pattern owner'; END IF;
 SELECT configuration INTO saved FROM course_test_patterns WHERE course_id='00000000-0000-0000-0000-000000000103' FOR UPDATE;
 IF saved IS NULL THEN RAISE EXCEPTION 'PN Cadet pattern is missing'; END IF;
 IF jsonb_array_length(sections)<>2 OR sections#>>'{0,sectionCode}'<>'INTEL_PN_CADET' OR sections#>>'{1,sectionCode}'<>'ACADEMIC_PN_CADET' OR EXISTS(SELECT 1 FROM jsonb_array_elements(sections) s WHERE (s->>'defaultQuestionCount')::integer<>40 OR (s->>'defaultDurationMinutes')::integer<>25) THEN RAISE EXCEPTION 'The designated PN Cadet pattern requires Intelligence 25 Verbal + 15 Non-Verbal and Academic 40, with 25 minutes per test'; END IF;
 IF coalesce(trim(p_template->>'name'),'')='' OR (p_template->>'version')::integer<1 THEN RAISE EXCEPTION 'Pattern name and positive version are required'; END IF;
 -- Subject quotas, bank bindings, section IDs and exam specifications are authoritative.
 updated:=saved||jsonb_build_object('name',p_template->>'name','description',p_template->'description','stage',coalesce(p_template->>'stage','INITIAL'),'version',(p_template->>'version')::integer);
 UPDATE course_test_patterns SET configuration=updated,updated_at=now() WHERE course_id='00000000-0000-0000-0000-000000000103' AND configuration IS DISTINCT FROM updated;
END $$;
REVOKE ALL ON FUNCTION save_pn_cadet_test_pattern(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION save_pn_cadet_test_pattern(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION exam_validate_test(tid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record; v integer; nv integer; cfg jsonb; intel jsonb; academic jsonb; expected_v integer; expected_nv integer;
BEGIN
 PERFORM exam_validate_test_before_navy(tid);
 IF EXISTS(SELECT 1 FROM test_eligible_courses e JOIN courses c ON c.id=e.course_id WHERE e.test_id=tid AND c.code='PN_CADET') THEN
  SELECT configuration INTO cfg FROM course_test_patterns WHERE course_id='00000000-0000-0000-0000-000000000103';
  SELECT value INTO intel FROM jsonb_array_elements(cfg->'sections') WHERE value->>'sectionCode'='INTEL_PN_CADET';
  SELECT value INTO academic FROM jsonb_array_elements(cfg->'sections') WHERE value->>'sectionCode'='ACADEMIC_PN_CADET';
  SELECT (intel->'subjectQuotas'->>id::text)::integer INTO expected_v FROM subjects WHERE code='INTELLIGENCE_VERBAL';
  SELECT (intel->'subjectQuotas'->>id::text)::integer INTO expected_nv FROM subjects WHERE code='INTELLIGENCE_NON_VERBAL';
  IF intel IS NULL OR academic IS NULL OR expected_v IS NULL OR expected_nv IS NULL THEN RAISE EXCEPTION 'A complete saved PN Cadet pattern is required'; END IF;
  FOR s IN SELECT ts.* FROM test_sections ts WHERE ts.test_id=tid LOOP
   IF s.section_code='INTEL_PN_CADET' OR s.name ILIKE '%Intelligence%' THEN
    SELECT count(*) FILTER(WHERE sub.code='INTELLIGENCE_VERBAL'),count(*) FILTER(WHERE sub.code='INTELLIGENCE_NON_VERBAL') INTO v,nv FROM test_section_questions x JOIN questions q ON q.id=x.question_id JOIN subjects sub ON sub.id=q.subject_id WHERE x.test_section_id=s.id;
    IF s.question_count<>(intel->>'defaultQuestionCount')::integer OR s.duration_minutes<>(intel->>'defaultDurationMinutes')::integer OR v<>expected_v OR nv<>expected_nv THEN RAISE EXCEPTION 'PN Cadet Intelligence requires exactly % Verbal + % Non-Verbal questions in % minutes',expected_v,expected_nv,intel->>'defaultDurationMinutes'; END IF;
   ELSIF s.section_code='ACADEMIC_PN_CADET' OR s.name ILIKE '%Academic%' THEN
    IF s.question_count<>(academic->>'defaultQuestionCount')::integer OR s.duration_minutes<>(academic->>'defaultDurationMinutes')::integer THEN RAISE EXCEPTION 'PN Cadet Academic requires exactly % questions in % minutes',academic->>'defaultQuestionCount',academic->>'defaultDurationMinutes'; END IF;
   ELSE RAISE EXCEPTION 'Select a designated PN Cadet Intelligence or Academic section'; END IF;
  END LOOP;
 END IF;
END $$;
REVOKE ALL ON FUNCTION exam_validate_test(uuid) FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
