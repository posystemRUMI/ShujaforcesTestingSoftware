BEGIN;
-- Preserve existing snapshot explanations and every question/option/answer key.
-- These legacy review entries predate explanation snapshots; copy the authored DB
-- explanation only when it belongs to the same stored correct answer.
UPDATE public.exam_attempt_snapshots snapshot
SET review_metadata=snapshot.review_metadata || (
 SELECT jsonb_object_agg(q.id::text,
  coalesce(snapshot.review_metadata->q.id::text,'{}'::jsonb) ||
  jsonb_build_object('explanation',q.explanation,'subject_id',q.subject_id))
 FROM jsonb_array_elements(snapshot.payload->'sections') section
 CROSS JOIN LATERAL jsonb_array_elements(section->'questions') item
 JOIN public.questions q ON q.id=(item->>'id')::uuid
 WHERE coalesce(snapshot.review_metadata#>>ARRAY[q.id::text,'explanation'],'') !~ '[^[:space:]]'
  AND q.explanation ~ '[^[:space:]]'
  AND EXISTS(SELECT 1 FROM public.question_options opt WHERE opt.question_id=q.id
   AND opt.id::text=snapshot.answer_keys->>q.id::text AND opt.is_correct)
)
WHERE EXISTS(
 SELECT 1 FROM jsonb_array_elements(snapshot.payload->'sections') section
 CROSS JOIN LATERAL jsonb_array_elements(section->'questions') item
 JOIN public.questions q ON q.id=(item->>'id')::uuid
 WHERE coalesce(snapshot.review_metadata#>>ARRAY[q.id::text,'explanation'],'') !~ '[^[:space:]]'
  AND q.explanation ~ '[^[:space:]]'
  AND EXISTS(SELECT 1 FROM public.question_options opt WHERE opt.question_id=q.id
   AND opt.id::text=snapshot.answer_keys->>q.id::text AND opt.is_correct)
);
COMMIT;
