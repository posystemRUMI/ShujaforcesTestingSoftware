BEGIN;
CREATE OR REPLACE FUNCTION exam_validate_test(tid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t tests%ROWTYPE; s record;
BEGIN
 SELECT * INTO t FROM tests WHERE id=tid;
 IF NOT FOUND OR t.duration_minutes IS NULL OR t.duration_minutes<=0 THEN RAISE EXCEPTION 'Test requires an explicit positive duration'; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_eligible_courses WHERE test_id=tid) THEN RAISE EXCEPTION 'Select eligible Force/course'; END IF;
 IF EXISTS(SELECT 1 FROM test_eligible_courses e LEFT JOIN courses c ON c.id=e.course_id AND c.force_id=e.force_id AND c.status='ACTIVE' WHERE e.test_id=tid AND c.id IS NULL) THEN RAISE EXCEPTION 'Invalid Force/course eligibility'; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_sections WHERE test_id=tid) THEN RAISE EXCEPTION 'Select sections'; END IF;
 IF t.duration_minutes<>(SELECT sum(duration_minutes) FROM test_sections WHERE test_id=tid) THEN RAISE EXCEPTION 'Test duration must equal configured section duration total'; END IF;
 IF t.total_marks IS DISTINCT FROM (SELECT sum(question_count*marks_per_question) FROM test_sections WHERE test_id=tid) THEN RAISE EXCEPTION 'Test maximum marks must match saved section rubric'; END IF;
 FOR s IN SELECT * FROM test_sections WHERE test_id=tid LOOP
 IF s.question_count<=0 OR s.duration_minutes<=0 OR s.question_count<>(SELECT count(*) FROM test_section_questions WHERE test_section_id=s.id) THEN RAISE EXCEPTION 'Section % must contain exactly % questions',s.name,s.question_count; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_section_subjects WHERE test_section_id=s.id) THEN RAISE EXCEPTION 'Section % requires designated subjects',s.name; END IF;
 IF EXISTS(SELECT 1 FROM test_section_questions x JOIN questions q ON q.id=x.question_id WHERE x.test_section_id=s.id AND
 (q.status<>'APPROVED' OR NOT EXISTS(SELECT 1 FROM test_section_subjects m WHERE m.test_section_id=s.id AND m.subject_id=q.subject_id)
 OR (s.name ILIKE '%Non%Verbal%' AND q.subject_id<>(SELECT id FROM subjects WHERE code='INTELLIGENCE_NON_VERBAL'))
 OR (s.name ILIKE '%Verbal%' AND s.name NOT ILIKE '%Non%Verbal%' AND q.subject_id<>(SELECT id FROM subjects WHERE code='INTELLIGENCE_VERBAL'))
 OR (s.name ILIKE '%Academic%' AND q.subject_id IN(SELECT id FROM subjects WHERE code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL')))
 OR EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=tid AND NOT exam_question_course_eligible(q.id,e.course_id))
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id)<>4
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id AND is_correct)<>1)) THEN RAISE EXCEPTION 'Section % contains unapproved, invalid or wrong-bank questions',s.name; END IF;
 END LOOP;
 IF EXISTS(SELECT question_id FROM test_section_questions x JOIN test_sections ts ON ts.id=x.test_section_id WHERE ts.test_id=tid GROUP BY question_id HAVING count(*)>1) THEN RAISE EXCEPTION 'A question cannot appear in multiple sections'; END IF;
END $$;
CREATE OR REPLACE FUNCTION publish_test(p_test_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT can_manage_test(p_test_id) THEN RAISE EXCEPTION 'Test management denied'; END IF;
 UPDATE tests SET total_marks=(SELECT sum(question_count*marks_per_question) FROM test_sections WHERE test_id=p_test_id) WHERE id=p_test_id;
 PERFORM exam_validate_test(p_test_id);
 UPDATE tests SET status='PUBLISHED',published_at=now(),published_by=auth.uid(),total_marks=(SELECT sum(s.question_count*s.marks_per_question) FROM test_sections s WHERE test_id=p_test_id) WHERE id=p_test_id;
 DELETE FROM exam_configuration_issues WHERE test_id=p_test_id;
 RETURN true;
END $$;

COMMIT;
