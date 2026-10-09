BEGIN;
-- Retain legacy UUIDs/FKs for historical records; only five courses are selectable.
UPDATE public.courses SET status='INACTIVE'
WHERE id NOT IN (
 '00000000-0000-0000-0000-000000000101'::uuid,
 '10000000-0000-0000-0000-000000000004'::uuid,
 '20000000-0000-0000-0000-000000000003'::uuid,
 '20000000-0000-0000-0000-000000000006'::uuid,
 '00000000-0000-0000-0000-000000000103'::uuid
) AND status='ACTIVE';
UPDATE public.courses SET name=CASE code WHEN 'AFNS' THEN 'AFNS' WHEN 'PAF_CAE' THEN 'CAE' WHEN 'PAF_AIRMEN' THEN 'Airman' ELSE name END
WHERE code IN ('AFNS','PAF_CAE','PAF_AIRMEN');
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_supported_active_catalog;
ALTER TABLE public.courses ADD CONSTRAINT courses_supported_active_catalog CHECK(status<>'ACTIVE' OR
 (force_id='00000000-0000-0000-0000-000000000001'::uuid AND
  (id='00000000-0000-0000-0000-000000000101'::uuid AND code='PMA_LONG_COURSE' OR id='10000000-0000-0000-0000-000000000004'::uuid AND code='AFNS')) OR
 (force_id='00000000-0000-0000-0000-000000000002'::uuid AND
  (id='20000000-0000-0000-0000-000000000003'::uuid AND code='PAF_CAE' OR id='20000000-0000-0000-0000-000000000006'::uuid AND code='PAF_AIRMEN')) OR
 (force_id='00000000-0000-0000-0000-000000000003'::uuid AND id='00000000-0000-0000-0000-000000000103'::uuid AND code='PN_CADET'));

CREATE OR REPLACE FUNCTION public.require_active_enrollment_course() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.target_course_id IS DISTINCT FROM OLD.target_course_id OR NEW.target_force_id IS DISTINCT FROM OLD.target_force_id THEN
  IF NOT EXISTS(SELECT 1 FROM courses WHERE id=NEW.target_course_id AND force_id=NEW.target_force_id AND status='ACTIVE') THEN
   RAISE EXCEPTION 'Select an active supported course for this Force';
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS active_enrollment_course ON public.students;
CREATE TRIGGER active_enrollment_course BEFORE INSERT OR UPDATE OF target_course_id,target_force_id ON public.students
FOR EACH ROW EXECUTE FUNCTION public.require_active_enrollment_course();

-- Hide duplicate/retired course cards, keeping all question mappings intact.
DO $$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef(oid) INTO definition FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='get_staff_question_bank';
 definition:=replace(definition,'FROM courses c JOIN question_courses m ON m.course_id=c.id JOIN matching q','FROM (SELECT * FROM courses WHERE status=''ACTIVE'') c JOIN question_courses m ON m.course_id=c.id JOIN matching q');
 definition:=replace(definition,'GROUP BY c.id,c.code,c.name ORDER BY','GROUP BY c.id,c.code,c.name,c.sort_order ORDER BY');
 EXECUTE definition;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
