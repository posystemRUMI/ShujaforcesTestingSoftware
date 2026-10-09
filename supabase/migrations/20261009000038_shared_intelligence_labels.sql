BEGIN;
-- Course eligibility belongs to question_courses, not shared-bank labels.
CREATE OR REPLACE FUNCTION public.normalize_shared_intelligence_labels()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE bank_code text; bank_label text;
BEGIN
 SELECT code INTO bank_code FROM subjects WHERE id=NEW.subject_id;
 IF bank_code IN ('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL') THEN
  bank_label:=CASE WHEN bank_code='INTELLIGENCE_VERBAL' THEN 'Verbal Intelligence' ELSE 'Non-Verbal Intelligence' END;
  SELECT ARRAY(SELECT DISTINCT tag FROM (
   SELECT tag FROM unnest(coalesce(NEW.tags,'{}')) tag
   WHERE tag !~* '^(AFNS|PMA)([[:space:]]+Academic)?$'
   UNION ALL SELECT bank_label UNION ALL SELECT 'Shared Intelligence'
  ) normalized ORDER BY tag) INTO NEW.tags;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS shared_intelligence_labels ON public.questions;
CREATE TRIGGER shared_intelligence_labels BEFORE INSERT OR UPDATE OF tags,subject_id
ON public.questions FOR EACH ROW EXECUTE FUNCTION public.normalize_shared_intelligence_labels();
UPDATE public.questions q SET tags=q.tags FROM public.subjects s
WHERE s.id=q.subject_id AND s.code IN ('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL')
AND (EXISTS(SELECT 1 FROM unnest(q.tags) tag WHERE tag ~* '^(AFNS|PMA)([[:space:]]+Academic)?$')
 OR NOT coalesce(q.tags,'{}') @> ARRAY['Shared Intelligence',CASE WHEN s.code='INTELLIGENCE_VERBAL' THEN 'Verbal Intelligence' ELSE 'Non-Verbal Intelligence' END]);
COMMIT;
