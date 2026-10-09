BEGIN;
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
 AND NOT EXISTS(SELECT 1 FROM test_eligible_courses e WHERE e.test_id=v_test_id AND NOT EXISTS(SELECT 1 FROM question_courses qc WHERE qc.question_id=q.id AND qc.course_id=e.course_id))
 AND (p_force_id IS NULL OR EXISTS(SELECT 1 FROM question_courses qc JOIN courses c ON c.id=qc.course_id WHERE qc.question_id=q.id AND c.force_id=p_force_id))
      -- Filter by force if provided (via question_courses ? courses ? force)
      AND (p_course_id IS NULL OR EXISTS (
        SELECT 1 FROM public.question_courses qc
        WHERE qc.question_id = q.id AND qc.course_id = p_course_id
      ))
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
