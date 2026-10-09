BEGIN;
CREATE OR REPLACE FUNCTION exam_question_course_eligible(qid uuid,cid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM questions q JOIN subjects sub ON sub.id=q.subject_id JOIN courses target ON target.id=cid WHERE q.id=qid AND (
  (sub.code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL') AND (
   EXISTS(SELECT 1 FROM question_courses WHERE question_id=qid AND course_id=cid)
   OR (target.code IN('PMA_LONG_COURSE','PMA_LC','AFNS') AND EXISTS(SELECT 1 FROM question_courses qc JOIN courses source ON source.id=qc.course_id WHERE qc.question_id=qid AND source.code IN('PMA_LONG_COURSE','PMA_LC','AFNS') AND source.force_id=target.force_id))))
  OR (sub.code NOT IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL') AND EXISTS(SELECT 1 FROM question_courses WHERE question_id=qid AND course_id=cid)
   AND NOT EXISTS(SELECT 1 FROM question_courses qc JOIN courses source ON source.id=qc.course_id WHERE qc.question_id=qid AND ((target.code IN('PMA_LONG_COURSE','PMA_LC') AND source.code='AFNS') OR (target.code='AFNS' AND source.code IN('PMA_LONG_COURSE','PMA_LC')))))
 ));
$$;
COMMIT;
