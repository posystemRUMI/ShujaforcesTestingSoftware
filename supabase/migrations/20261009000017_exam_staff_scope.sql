BEGIN;
CREATE FUNCTION can_manage_test(tid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT is_admin() OR (is_teacher() AND EXISTS(SELECT 1 FROM tests WHERE id=tid AND created_by=auth.uid()));
$$;
REVOKE ALL ON FUNCTION can_manage_test(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION can_manage_test(uuid) TO authenticated;
COMMIT;
