BEGIN;
CREATE FUNCTION exam_question_course_eligible(qid uuid,cid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM question_courses WHERE question_id=qid AND course_id=cid)
 OR EXISTS(SELECT 1 FROM questions q JOIN subjects sub ON sub.id=q.subject_id JOIN courses target ON target.id=cid JOIN question_courses qc ON qc.question_id=q.id JOIN courses source ON source.id=qc.course_id
 WHERE q.id=qid AND sub.code IN('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL') AND target.code IN('PMA_LONG_COURSE','PMA_LC','AFNS') AND source.code IN('PMA_LONG_COURSE','PMA_LC','AFNS') AND source.force_id=target.force_id);
$$;
REVOKE ALL ON FUNCTION exam_question_course_eligible(uuid,uuid) FROM PUBLIC,anon,authenticated;
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
 OR EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=tid AND NOT exam_question_course_eligible(q.id,e.course_id))
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id)<>4
 OR (SELECT count(*) FROM question_options WHERE question_id=q.id AND is_correct)<>1)) THEN RAISE EXCEPTION 'Section % contains unapproved, invalid or wrong-bank questions',s.name; END IF;
 END LOOP;
 IF EXISTS(SELECT question_id FROM test_section_questions x JOIN test_sections ts ON ts.id=x.test_section_id WHERE ts.test_id=tid GROUP BY question_id HAVING count(*)>1) THEN RAISE EXCEPTION 'A question cannot appear in multiple sections'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.generate_test_section_questions(p_section_id uuid, p_subject_id uuid, p_count integer, p_force_id uuid DEFAULT NULL::uuid, p_course_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_test_id UUID;
  v_existing_count INT;
  v_inserted INT := 0;
  v_question RECORD;
  v_position INT;
BEGIN
  -- Authorization
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can generate question composition.';
  END IF;

  -- Get test_id from section
  SELECT ts.test_id INTO v_test_id
  FROM public.test_sections ts
  WHERE ts.id = p_section_id;

  IF v_test_id IS NULL THEN
    RAISE EXCEPTION 'Section % not found.', p_section_id;
  END IF;

  -- Verify test is in DRAFT status
  IF NOT EXISTS (
    SELECT 1 FROM public.tests WHERE id = v_test_id AND status = 'DRAFT'
  ) THEN
    RAISE EXCEPTION 'Can only generate questions for DRAFT tests.';
  END IF;

  IF NOT can_manage_test(v_test_id) THEN RAISE EXCEPTION 'Test management denied'; END IF;
  IF p_count IS DISTINCT FROM (SELECT question_count FROM test_sections WHERE id=p_section_id) THEN RAISE EXCEPTION 'Generator count must exactly match configured section count'; END IF;
  -- Clear existing composition for this section
  DELETE FROM public.test_section_questions WHERE test_section_id = p_section_id;

  -- Get next position
  v_position := 0;

  -- Select random approved questions matching criteria
  FOR v_question IN
    SELECT q.id
    FROM public.questions q
    WHERE q.subject_id = p_subject_id
      AND q.status = 'APPROVED'
 AND EXISTS(SELECT 1 FROM test_section_subjects m WHERE m.test_section_id=p_section_id AND m.subject_id=q.subject_id)
 AND NOT EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=v_test_id AND NOT exam_question_course_eligible(q.id,e.course_id))
 AND (p_force_id IS NULL OR EXISTS(SELECT 1 FROM question_courses qc JOIN courses c ON c.id=qc.course_id WHERE qc.question_id=q.id AND c.force_id=p_force_id))
      -- Filter by force if provided (via question_courses ? courses ? force)
      AND (p_course_id IS NULL OR exam_question_course_eligible(q.id,p_course_id))
      -- Ensure 4 valid options with exactly 1 correct
      AND (
        SELECT COUNT(*) FROM public.question_options qo
        WHERE qo.question_id = q.id
      ) = 4
      AND (
        SELECT COUNT(*) FROM public.question_options qo
        WHERE qo.question_id = q.id AND qo.is_correct = true
      ) = 1
      -- Exclude questions already used in other sections of the same test
      AND NOT EXISTS (
        SELECT 1 FROM public.test_section_questions tsq
        JOIN public.test_sections ts ON ts.id = tsq.test_section_id
        WHERE ts.test_id = v_test_id AND tsq.question_id = q.id
      )
    ORDER BY q.code,q.id
    LIMIT p_count
  LOOP
    v_position := v_position + 1;
    INSERT INTO public.test_section_questions (test_section_id, question_id, position)
    VALUES (p_section_id, v_question.id, v_position);
    v_inserted := v_inserted + 1;
  END LOOP;

  IF v_inserted <> p_count THEN RAISE EXCEPTION 'Bank has % valid questions; exactly % required',v_inserted,p_count; END IF;
  -- Preserve configured count
  UPDATE public.test_sections
  SET question_count = p_count
  WHERE id = p_section_id;

  RETURN v_inserted;
END;
$function$;



COMMIT;
