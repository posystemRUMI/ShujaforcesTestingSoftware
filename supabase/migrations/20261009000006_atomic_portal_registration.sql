BEGIN;
-- Preserve existing registration validation and data fields, making batch optional.
DO $fix$
DECLARE fn record; d text;
BEGIN
 SELECT oid INTO fn FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='create_registered_student_profile';
 d:=pg_get_functiondef(fn.oid);
 d:=regexp_replace(d,'IF p_batch_id IS NULL THEN[[:space:]]+RAISE EXCEPTION ''VALIDATION_ERROR: Batch enrollment is mandatory.'';[[:space:]]+END IF;','');
 d:=replace(d,'v_clean_roll := upper(trim(p_roll_number));','v_clean_roll := trim(p_roll_number);');
 d:=replace(d,'upper(roll_number) = v_clean_roll','upper(roll_number) = upper(v_clean_roll)');
 d:=regexp_replace(d,'IF NOT EXISTS \([[:space:]]+SELECT 1 FROM public.batches','IF p_batch_id IS NOT NULL AND NOT EXISTS ( SELECT 1 FROM public.batches');
 d:=regexp_replace(d,'(INSERT INTO public.batch_enrollments[\s\S]*?ON CONFLICT \(batch_id, student_id\) DO NOTHING;)','IF p_batch_id IS NOT NULL THEN \1 END IF;');
 EXECUTE d;
END $fix$;

-- This RPC is exclusively for the verified Edge Function's service role.
CREATE OR REPLACE FUNCTION public.portal_register_student(p_auth_user_id uuid,p_creator_id uuid,p_input jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; sid uuid; previous_sub text:=current_setting('request.jwt.claim.sub',true);
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM profiles WHERE id=p_creator_id AND role IN ('ADMIN','TEACHER') AND status='ACTIVE') THEN RAISE EXCEPTION 'Active staff creator required'; END IF;
 PERFORM set_config('request.jwt.claim.sub',p_creator_id::text,true);
 r:=create_registered_student_profile(
 p_auth_user_id=>p_auth_user_id,p_email=>p_input->>'email',p_display_name=>p_input->>'fullName',p_father_name=>p_input->>'fatherName',
 p_cnic=>p_input->>'cnic',p_phone=>p_input->>'phone',p_target_force_id=>(p_input->>'targetForceId')::uuid,
 p_target_course_id=>(p_input->>'targetCourseId')::uuid,p_batch_id=>null,p_roll_number=>p_input->>'rollNumber',p_education=>p_input->>'education',
 p_education_details=>p_input->>'educationDetails',p_gender=>coalesce(p_input->>'gender','Male'),p_date_of_birth=>nullif(p_input->>'dateOfBirth','')::date,
 p_alternate_phone=>p_input->>'alternatePhone',p_address=>p_input->>'address',p_guardian_name=>p_input->>'guardianName',
 p_guardian_relationship=>p_input->>'guardianRelationship',p_guardian_phone=>p_input->>'guardianPhone',
 p_admission_date=>coalesce(nullif(p_input->>'admissionDate','')::date,current_date),p_status=>coalesce(p_input->>'status','ACTIVE'),
 p_notes=>p_input->>'notes',p_photo_url=>p_input->>'photoUrl',p_creator_id=>p_creator_id);
 sid:=(r->>'student_id')::uuid;
 IF sid IS NULL THEN RAISE EXCEPTION 'Registration returned no student'; END IF;
 PERFORM portal_registration_fee(sid,coalesce((p_input->>'courseFeeAmount')::numeric,0),coalesce((p_input->>'initialPaymentAmount')::numeric,0),coalesce(p_input->>'paymentMethod','CASH'));
 PERFORM set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
 RETURN jsonb_build_object('success',true,'studentId',sid,'profileId',p_auth_user_id,'rollNumber',r->>'roll_number',
 'email',r->>'email','displayName',r->>'display_name');
END $$;
REVOKE ALL ON FUNCTION portal_register_student(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION portal_register_student(uuid,uuid,jsonb) TO service_role;

-- Defense in depth for exam resume and answer writes following a course change.
DO $guard$
DECLARE fn record; d text;
BEGIN
 FOR fn IN SELECT oid,proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN
 ('get_safe_exam_payload','save_attempt_answer','save_attempt_answers','advance_attempt_section','submit_test_attempt') LOOP
 d:=pg_get_functiondef(fn.oid);
 IF position('p_attempt_id' in d)>0 THEN
 d:=regexp_replace(d,'\mBEGIN\M',$body$BEGIN
 IF public.is_student() AND NOT EXISTS(SELECT 1 FROM public.test_attempts a JOIN public.students s ON s.id=a.student_id
 WHERE a.id=p_attempt_id AND s.profile_id=auth.uid() AND public.portal_eligible(s.id,a.test_id)) THEN
 RAISE EXCEPTION 'Attempt ownership or course eligibility denied'; END IF;$body$);
 EXECUTE d;
 END IF;
 END LOOP;
END $guard$;
NOTIFY pgrst,'reload schema';
COMMIT;
