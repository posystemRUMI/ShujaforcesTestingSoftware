BEGIN;
CREATE OR REPLACE FUNCTION advance_section(p_attempt_id uuid,p_next_section_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a test_attempts%ROWTYPE; nxt jsonb; p attempt_section_progress%ROWTYPE; section_started timestamptz;
BEGIN SELECT * INTO a FROM test_attempts WHERE id=p_attempt_id FOR UPDATE;
 IF a.id IS NULL OR a.student_id<>portal_student_id() OR NOT portal_eligible(a.student_id,a.test_id) THEN RAISE EXCEPTION 'Attempt ownership denied'; END IF;
 IF a.status<>'IN_PROGRESS' OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Attempt closed or expired'; END IF;
 IF p_next_section_id=a.current_section_id THEN SELECT * INTO p FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=p_next_section_id;
 ELSE
 SELECT s.item INTO nxt FROM exam_attempt_snapshots snap CROSS JOIN LATERAL jsonb_array_elements(snap.payload->'sections') WITH ORDINALITY s(item,n) WHERE snap.attempt_id=a.id AND s.n=(SELECT c.n+1 FROM jsonb_array_elements(snap.payload->'sections') WITH ORDINALITY c(item,n) WHERE c.item->>'id'=a.current_section_id::text);
 IF (nxt->>'id')::uuid IS NULL OR (nxt->>'id')::uuid<>p_next_section_id THEN RAISE EXCEPTION 'Only the next section may be started'; END IF;
 UPDATE attempt_section_progress SET completed_at=clock_timestamp() WHERE attempt_id=a.id AND section_id=a.current_section_id AND completed_at IS NULL;
 section_started:=clock_timestamp();
 INSERT INTO attempt_section_progress(attempt_id,section_id,started_at,expires_at) VALUES(a.id,(nxt->>'id')::uuid,section_started,least(a.expires_at,section_started+(nxt->>'duration_minutes')::int*interval '1 minute')) ON CONFLICT(attempt_id,section_id) DO NOTHING;
 SELECT * INTO p FROM attempt_section_progress WHERE attempt_id=a.id AND section_id=(nxt->>'id')::uuid;
 IF p.completed_at IS NOT NULL THEN RAISE EXCEPTION 'Completed section cannot be reopened'; END IF;
 UPDATE test_attempts SET current_section_id=(nxt->>'id')::uuid WHERE id=a.id;
 END IF;
 RETURN jsonb_build_object('section_id',p.section_id,'started_at',p.started_at,'expires_at',p.expires_at,'server_time',clock_timestamp());
END $$;

CREATE OR REPLACE FUNCTION public.current_app_role()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid() AND status='ACTIVE'),
    'STUDENT'::public.app_role
  );
$function$
;
COMMIT;
