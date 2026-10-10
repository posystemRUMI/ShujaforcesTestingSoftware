-- Exercise real eligible banks; all temporary draft tests roll back.
BEGIN;
CREATE TEMP TABLE random_selection_checks(course text,bank text,result text);
DO $$
DECLARE staff uuid; c record; b record; tid uuid; section_id uuid;
 first_ids uuid[]; current_ids uuid[]; changed boolean; n integer; denied boolean;
BEGIN
 SELECT id INTO staff FROM profiles WHERE role='ADMIN' AND status='ACTIVE' LIMIT 1;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 FOR c IN SELECT * FROM courses WHERE status='ACTIVE' ORDER BY code LOOP
  FOR b IN
   SELECT DISTINCT ON (q.bank_key) q.bank_key,q.subject_id,count(*) AS available
   FROM questions q WHERE q.status='APPROVED' AND exam_question_course_eligible(q.id,c.id)
    AND (SELECT count(*) FROM question_options o WHERE o.question_id=q.id)=4
    AND (SELECT count(*) FROM question_options o WHERE o.question_id=q.id AND o.is_correct)=1
   GROUP BY q.bank_key,q.subject_id HAVING count(*)>=8 ORDER BY q.bank_key,count(*) DESC
  LOOP
   INSERT INTO tests(name,force_id,course_id,created_by,duration_minutes) VALUES('Random selection rollback QA',c.force_id,c.id,staff,7) RETURNING id INTO tid;
   INSERT INTO test_eligible_courses(test_id,force_id,course_id) VALUES(tid,c.force_id,c.id);
   INSERT INTO test_sections(test_id,name,position,question_count,duration_minutes,subject_id) VALUES(tid,'Random sampling QA',1,4,7,b.subject_id) RETURNING id INTO section_id;
   INSERT INTO test_section_subjects(test_section_id,subject_id) VALUES(section_id,b.subject_id);
   changed:=false;first_ids:=NULL;
   FOR n IN 1..8 LOOP
    IF generate_test_section_questions(section_id,b.subject_id,4,c.force_id,c.id)<>4 THEN RAISE EXCEPTION 'Exact configured count failed'; END IF;
    SELECT array_agg(question_id ORDER BY position) INTO current_ids FROM test_section_questions WHERE test_section_id=section_id;
    IF cardinality(current_ids)<>4 OR (SELECT count(DISTINCT question_id) FROM test_section_questions WHERE test_section_id=section_id)<>4 THEN RAISE EXCEPTION 'Missing/duplicate questions'; END IF;
    IF EXISTS(SELECT 1 FROM questions WHERE id=ANY(current_ids) AND (subject_id<>b.subject_id OR NOT exam_question_course_eligible(id,c.id))) THEN RAISE EXCEPTION 'Wrong bank/course'; END IF;
    IF first_ids IS NULL THEN first_ids:=current_ids; ELSIF current_ids IS DISTINCT FROM first_ids THEN changed:=true; END IF;
   END LOOP;
   IF NOT changed THEN RAISE EXCEPTION 'Eight random samples were identical for %/%',c.name,b.bank_key; END IF;
   IF (SELECT duration_minutes FROM test_sections WHERE id=section_id)<>7 THEN RAISE EXCEPTION 'Duration changed'; END IF;
   denied:=false; BEGIN PERFORM generate_test_section_questions(section_id,b.subject_id,3,c.force_id,c.id); EXCEPTION WHEN OTHERS THEN denied:=true; END;
   IF NOT denied OR (SELECT count(*) FROM test_section_questions WHERE test_section_id=section_id)<>4 THEN RAISE EXCEPTION 'Count mismatch not rejected atomically'; END IF;
   INSERT INTO random_selection_checks VALUES(c.name,b.bank_key,'PASS: varying random samples, four unique saved questions, correct eligibility and unchanged timing');
  END LOOP;
  IF NOT EXISTS(SELECT 1 FROM random_selection_checks checks WHERE checks.course=c.name) THEN
   INSERT INTO random_selection_checks VALUES(c.name,NULL,'BLOCKED: no approved eligible subject pool with at least eight valid questions');
  END IF;
 END LOOP;
END $$;
SELECT * FROM random_selection_checks;
ROLLBACK;
