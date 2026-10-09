BEGIN;
CREATE FUNCTION enforce_shared_bank_subject() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE subject_code text; subject_category text;
BEGIN
 SELECT code,category INTO subject_code,subject_category FROM subjects WHERE id=NEW.subject_id;
 IF (subject_code='INTELLIGENCE_VERBAL' AND NEW.bank_key IS DISTINCT FROM 'v') OR (subject_code='INTELLIGENCE_NON_VERBAL' AND NEW.bank_key IS DISTINCT FROM 'nv') OR (subject_category='ACADEMIC' AND NEW.bank_key IN('v','nv')) THEN RAISE EXCEPTION 'Question bank must match its designated intelligence or Academic subject'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER question_bank_subject_integrity BEFORE INSERT OR UPDATE OF bank_key,subject_id ON questions FOR EACH ROW EXECUTE FUNCTION enforce_shared_bank_subject();
COMMIT;
