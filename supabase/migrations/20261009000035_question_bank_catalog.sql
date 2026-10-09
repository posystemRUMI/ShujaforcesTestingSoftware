BEGIN;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS bank_key text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_label text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_course text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_references jsonb NOT NULL DEFAULT '[]';

CREATE OR REPLACE FUNCTION public.question_bank_prefix(sid uuid, cids uuid[]) RETURNS text
LANGUAGE plpgsql STABLE SET search_path=public AS $$
DECLARE sc text; prefix text; kinds integer;
BEGIN
 SELECT code INTO sc FROM subjects WHERE id=sid;
 IF sc='INTELLIGENCE_VERBAL' THEN RETURN 'v'; END IF;
 IF sc='INTELLIGENCE_NON_VERBAL' THEN RETURN 'nv'; END IF;
 SELECT count(DISTINCT CASE WHEN code IN ('PMA_LC','PMA_LONG_COURSE') THEN 'PMA-LC-A' WHEN code='AFNS' THEN 'AFNS-A' ELSE replace(code,'_','-')||'-A' END),
 min(CASE WHEN code IN ('PMA_LC','PMA_LONG_COURSE') THEN 'PMA-LC-A' WHEN code='AFNS' THEN 'AFNS-A' ELSE replace(code,'_','-')||'-A' END)
 INTO kinds,prefix FROM courses WHERE id=ANY(cids);
 IF kinds<>1 OR prefix IS NULL THEN RAISE EXCEPTION 'Select exactly one academic course bank'; END IF;
 RETURN prefix;
END $$;

CREATE OR REPLACE FUNCTION public.assign_question_bank_code() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
DECLARE next_number integer;
BEGIN
 IF NEW.bank_key IS NULL THEN NEW.bank_key:=question_bank_prefix(NEW.subject_id,ARRAY(SELECT course_id FROM question_courses WHERE question_id=NEW.id)); END IF;
 IF TG_OP='INSERT' OR (TG_OP='UPDATE' AND NEW.bank_key IS DISTINCT FROM OLD.bank_key) THEN
  PERFORM pg_advisory_xact_lock(hashtextextended('question-bank-code:'||NEW.bank_key,0));
  SELECT coalesce(max(substring(code FROM '-Q([0-9]+)$')::integer),0)+1 INTO next_number FROM questions WHERE bank_key=NEW.bank_key;
  NEW.code:=NEW.bank_key||'-Q'||next_number;
 END IF;
 IF NEW.code !~ ('^'||NEW.bank_key||'-Q[1-9][0-9]*$') THEN RAISE EXCEPTION 'Invalid question code for bank'; END IF;
 RETURN NEW;
END $$;
-- Installed after the collision-safe legacy renaming in migration 00036.

CREATE OR REPLACE FUNCTION public.get_staff_question_bank(
 p_force_id uuid DEFAULT NULL,p_course_id uuid DEFAULT NULL,p_bank text DEFAULT NULL,
 p_subject_id uuid DEFAULT NULL,p_search text DEFAULT '',p_status text DEFAULT 'ALL',
 p_page integer DEFAULT 1,p_page_size integer DEFAULT 50
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Staff authentication required'; END IF;
 IF p_page<1 OR p_page_size<1 OR p_page_size>100 THEN RAISE EXCEPTION 'Invalid pagination'; END IF;
 WITH matching AS MATERIALIZED (
 SELECT q.*,s.code subject_code,s.name subject_name FROM questions q JOIN subjects s ON s.id=q.subject_id
 WHERE (p_bank IS NULL OR p_bank='ALL' OR p_bank='v' AND s.code='INTELLIGENCE_VERBAL' OR p_bank='nv' AND s.code='INTELLIGENCE_NON_VERBAL' OR p_bank='ACADEMIC' AND s.category='ACADEMIC')
 AND (p_subject_id IS NULL OR q.subject_id=p_subject_id)
 AND (p_status='ALL' OR p_status='ACTIVE' AND q.status='APPROVED' OR p_status='INACTIVE' AND q.status<>'APPROVED')
 AND (coalesce(trim(p_search),'')='' OR q.stem ILIKE '%'||trim(p_search)||'%' OR q.code ILIKE '%'||trim(p_search)||'%')
 AND (p_force_id IS NULL AND p_course_id IS NULL OR EXISTS(SELECT 1 FROM question_courses m JOIN courses c ON c.id=m.course_id WHERE m.question_id=q.id AND (p_force_id IS NULL OR c.force_id=p_force_id) AND (p_course_id IS NULL OR c.id=p_course_id)))
 ), page AS (
 SELECT * FROM matching ORDER BY CASE bank_key WHEN 'v' THEN 0 WHEN 'nv' THEN 1 ELSE 2 END,bank_key,substring(code FROM '-Q([0-9]+)$')::integer,id LIMIT p_page_size OFFSET (p_page-1)*p_page_size
 )
 SELECT jsonb_build_object(
 'total',(SELECT count(*) FROM matching),'active',(SELECT count(*) FROM matching WHERE status='APPROVED'),'inactive',(SELECT count(*) FROM matching WHERE status<>'APPROVED'),
 'verbal',(SELECT count(*) FROM matching WHERE subject_code='INTELLIGENCE_VERBAL'),'non_verbal',(SELECT count(*) FROM matching WHERE subject_code='INTELLIGENCE_NON_VERBAL'),'academic',(SELECT count(*) FROM matching WHERE subject_code NOT IN ('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL')),
 'academic_courses',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT c.id,c.code,c.name,count(DISTINCT q.id) total,count(DISTINCT q.id) FILTER(WHERE q.status='APPROVED') active,count(DISTINCT q.id) FILTER(WHERE q.status<>'APPROVED') inactive FROM courses c JOIN question_courses m ON m.course_id=c.id JOIN matching q ON q.id=m.question_id WHERE q.subject_code NOT IN ('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL') AND (p_force_id IS NULL OR c.force_id=p_force_id) AND (p_course_id IS NULL OR c.id=p_course_id) GROUP BY c.id,c.code,c.name ORDER BY c.sort_order,c.code) x),
 'subjects',(SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT subject_id id,subject_code code,subject_name name,count(*) total FROM matching WHERE subject_code NOT IN ('INTELLIGENCE_VERBAL','INTELLIGENCE_NON_VERBAL') GROUP BY subject_id,subject_code,subject_name ORDER BY subject_name) x),
 'questions',(SELECT coalesce(jsonb_agg(to_jsonb(q)||jsonb_build_object(
 'question_options',(SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY o.label),'[]') FROM question_options o WHERE o.question_id=q.id),
 'question_courses',(SELECT coalesce(jsonb_agg(jsonb_build_object('course_id',m.course_id)),'[]') FROM question_courses m WHERE m.question_id=q.id),
 'author_name',(SELECT display_name FROM profiles WHERE id=q.author_id))),'[]') FROM page q)
 ) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_staff_question_bank(uuid,uuid,text,uuid,text,text,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_staff_question_bank(uuid,uuid,text,uuid,text,text,integer,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_question(p_id uuid,p_code text,p_subject_id uuid,p_difficulty question_difficulty,p_stem text,p_stem_image_url text,p_explanation text,p_time_limit_seconds integer,p_status question_status,p_tags text[],p_course_ids uuid[],p_options jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE qid uuid; prefix text; opt jsonb; old_code text; cids uuid[];
BEGIN
 IF NOT (is_admin() OR is_teacher()) THEN RAISE EXCEPTION 'Staff authentication required'; END IF;
 IF jsonb_array_length(p_options)<>4 OR (SELECT count(*) FROM jsonb_array_elements(p_options) o WHERE (o->>'is_correct')::boolean)<>1
 OR (SELECT count(DISTINCT coalesce(nullif(lower(trim(o->>'text')),''),nullif(o->>'image_url',''))) FROM jsonb_array_elements(p_options) o)<>4
 OR (SELECT count(DISTINCT o->>'label') FROM jsonb_array_elements(p_options) o WHERE o->>'label' IN ('A','B','C','D'))<>4 THEN RAISE EXCEPTION 'Four distinct choices and one correct answer are required'; END IF;
 IF trim(p_stem)='' OR coalesce(trim(p_explanation),'')='' THEN RAISE EXCEPTION 'Question and explanation are required'; END IF;
 cids:=coalesce(p_course_ids,'{}');prefix:=question_bank_prefix(p_subject_id,cids);
 IF prefix IN ('v','nv') THEN cids:=ARRAY(SELECT DISTINCT id FROM courses WHERE id=ANY(cids) OR code IN ('PMA_LONG_COURSE','PMA_LC','AFNS')); END IF;
 IF p_id IS NOT NULL THEN
  SELECT code INTO old_code FROM questions WHERE id=p_id FOR UPDATE;
  IF old_code IS NULL THEN RAISE EXCEPTION 'Question not found'; END IF;
  UPDATE questions SET subject_id=p_subject_id,bank_key=prefix,difficulty=p_difficulty,stem=p_stem,stem_image_url=p_stem_image_url,explanation=p_explanation,time_limit_seconds=p_time_limit_seconds,status=p_status,tags=p_tags,updated_at=now() WHERE id=p_id;
  qid:=p_id;
 ELSE
  INSERT INTO questions(code,bank_key,subject_id,difficulty,stem,stem_image_url,explanation,time_limit_seconds,status,tags,author_id)
  VALUES(coalesce(p_code,''),prefix,p_subject_id,p_difficulty,p_stem,p_stem_image_url,p_explanation,p_time_limit_seconds,p_status,p_tags,auth.uid()) RETURNING id INTO qid;
 END IF;
 FOR opt IN SELECT value FROM jsonb_array_elements(p_options) LOOP
  INSERT INTO question_options(question_id,option_key,label,text,image_url,is_correct,sort_order)
  VALUES(qid,'opt-'||lower(opt->>'label'),opt->>'label',opt->>'text',opt->>'image_url',(opt->>'is_correct')::boolean,ascii(opt->>'label')-65)
  ON CONFLICT(question_id,label) DO UPDATE SET text=excluded.text,image_url=excluded.image_url,is_correct=excluded.is_correct;
 END LOOP;
 DELETE FROM question_courses WHERE question_id=qid AND NOT(course_id=ANY(cids));
 INSERT INTO question_courses(question_id,course_id) SELECT qid,unnest(cids) ON CONFLICT DO NOTHING;
 PERFORM log_audit_event('QUESTION_UPSERTED','QUESTION',qid::text,jsonb_build_object('bank',prefix));
 RETURN qid;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
