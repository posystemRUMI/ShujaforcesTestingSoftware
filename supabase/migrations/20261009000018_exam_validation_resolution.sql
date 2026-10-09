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
 FOR s IN SELECT * FROM test_sections WHERE test_id=tid LOOP
 IF s.question_count<=0 OR s.duration_minutes<=0 OR s.question_count<>(SELECT count(*) FROM test_section_questions WHERE test_section_id=s.id) THEN RAISE EXCEPTION 'Section % must contain exactly % questions',s.name,s.question_count; END IF;
 IF NOT EXISTS(SELECT 1 FROM test_section_subjects WHERE test_section_id=s.id) THEN RAISE EXCEPTION 'Section % requires designated subjects',s.name; END IF;
 IF EXISTS(SELECT 1 FROM test_section_questions x JOIN questions q ON q.id=x.question_id WHERE x.test_section_id=s.id AND
 (q.status<>'APPROVED' OR NOT EXISTS(SELECT 1 FROM test_section_subjects m WHERE m.test_section_id=s.id AND m.subject_id=q.subject_id)
 OR (s.name ILIKE '%Non%Verbal%' AND q.subject_id<>(SELECT id FROM subjects WHERE code='INTELLIGENCE_NON_VERBAL'))
 OR (s.name ILIKE '%Verbal%' AND s.name NOT ILIKE '%Non%Verbal%' AND q.subject_id<>(SELECT id FROM subjects WHERE code='INTELLIGENCE_VERBAL'))
 OR (s.name ILIKE '%Academic%' AND q.subject_id IN(SELECT id FROM subjects WHERE code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL')))
 OR EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=tid AND NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=e.course_id))
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id)<>4
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id AND is_correct)<>1)) THEN RAISE EXCEPTION 'Section % contains unapproved, invalid or wrong-bank questions',s.name; END IF;
 END LOOP;
 IF EXISTS(SELECT question_id FROM test_section_questions x JOIN test_sections ts ON ts.id=x.test_section_id WHERE ts.test_id=tid GROUP BY question_id HAVING count(*)>1) THEN RAISE EXCEPTION 'A question cannot appear in multiple sections'; END IF;
END $$;

DO $$ DECLARE t record; BEGIN FOR t IN SELECT test_id FROM exam_configuration_issues LOOP BEGIN PERFORM exam_validate_test(t.test_id);UPDATE tests SET status='PUBLISHED' WHERE id=t.test_id;DELETE FROM exam_configuration_issues WHERE test_id=t.test_id;EXCEPTION WHEN OTHERS THEN UPDATE exam_configuration_issues SET reason=SQLERRM WHERE test_id=t.test_id;END;END LOOP;END $$;
COMMIT;
