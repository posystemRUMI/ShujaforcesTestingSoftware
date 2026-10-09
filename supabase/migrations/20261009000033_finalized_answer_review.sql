BEGIN;
-- Private review metadata is captured with the immutable exam, never in its safe payload.
ALTER TABLE public.exam_attempt_snapshots ADD COLUMN review_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER FUNCTION public.exam_capture_attempt(uuid) RENAME TO exam_capture_attempt_internal;
REVOKE ALL ON FUNCTION public.exam_capture_attempt_internal(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.exam_capture_attempt(aid uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM exam_capture_attempt_internal(aid);
 UPDATE exam_attempt_snapshots snapshot SET review_metadata=coalesce((
  SELECT jsonb_object_agg(q.id::text,jsonb_build_object('explanation',q.explanation,'subject_id',q.subject_id))
  FROM questions q WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(snapshot.payload->'sections') s
   CROSS JOIN LATERAL jsonb_array_elements(s->'questions') item WHERE item->>'id'=q.id::text)
 ),'{}'::jsonb) WHERE attempt_id=aid AND review_metadata='{}'::jsonb;
END $$;
REVOKE ALL ON FUNCTION public.exam_capture_attempt(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_result_detail(p_result_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r test_results%ROWTYPE; t tests%ROWTYPE; snapshot exam_attempt_snapshots%ROWTYPE; sid uuid;
 section jsonb; item jsonb; options jsonb; questions jsonb; sections jsonb:='[]'; answer attempt_answers%ROWTYPE; key text;
BEGIN
 IF is_admin() OR is_teacher() THEN RETURN exam_staff_result_detail_internal(p_result_id); END IF;
 sid:=portal_student_id();
 SELECT result.* INTO r FROM test_results result JOIN portal_valid_results valid ON valid.id=result.id
 WHERE result.id=p_result_id AND result.student_id=sid;
 IF r.id IS NULL THEN RAISE EXCEPTION 'No valid finalized result owned by this student'; END IF;
 SELECT * INTO t FROM tests WHERE id=r.test_id;
 SELECT * INTO snapshot FROM exam_attempt_snapshots WHERE attempt_id=r.attempt_id;
 IF snapshot.attempt_id IS NOT NULL THEN
  FOR section IN SELECT value FROM jsonb_array_elements(snapshot.payload->'sections') LOOP
   questions:='[]';
   FOR item IN SELECT value FROM jsonb_array_elements(section->'questions') LOOP
    SELECT * INTO answer FROM attempt_answers WHERE attempt_id=r.attempt_id AND question_id=(item->>'id')::uuid;
    key:=snapshot.answer_keys->>(item->>'id');
    SELECT coalesce(jsonb_agg(opt || jsonb_build_object('is_correct',opt->>'id'=key) ORDER BY ord),'[]') INTO options
    FROM jsonb_array_elements(item->'options') WITH ORDINALITY entries(opt,ord);
    questions:=questions || jsonb_build_array(jsonb_build_object(
     'question_id',item->>'id','code',item->>'code','stem',item->>'stem','stem_image_url',item->>'stem_image_url',
     'subject_id',snapshot.review_metadata#>>ARRAY[item->>'id','subject_id'],
     'explanation',snapshot.review_metadata#>>ARRAY[item->>'id','explanation'],
     'marks',item->'marks','selected_option_id',answer.selected_option_id,'marked_for_review',coalesce(answer.marked_for_review,false),
     'options',options,'status',CASE WHEN answer.selected_option_id IS NULL THEN 'skipped'
       WHEN answer.selected_option_id::text=key THEN 'correct' ELSE 'incorrect' END));
   END LOOP;
   sections:=sections || jsonb_build_array(jsonb_build_object('section_id',section->>'id','section_name',section->>'name','questions',questions));
  END LOOP;
 END IF;
 RETURN jsonb_build_object('result',to_jsonb(r),'test',jsonb_build_object('id',t.id,
  'name',coalesce(snapshot.payload#>>'{test,name}',t.name),
  'passing_threshold',coalesce((snapshot.payload#>>'{test,passing_threshold}')::numeric,t.passing_threshold)),
  'student',jsonb_build_object('id',sid,'roll_number',(SELECT roll_number FROM students WHERE id=sid)),
  'sections',sections,'answer_review_enabled',snapshot.attempt_id IS NOT NULL);
END $$;
REVOKE ALL ON FUNCTION public.get_result_detail(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_result_detail(uuid) TO authenticated;
COMMIT;
