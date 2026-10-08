-- Migration: 20261007000001_repair_missing_section_questions.sql
-- Description: Adds a diagnostic/repair helper for existing tests with missing question assignments.
-- Run: SELECT * FROM public.check_test_question_assignments() to identify broken tests.
-- No auto-generation — teachers must re-save those tests via the test builder.

CREATE OR REPLACE FUNCTION public.check_test_question_assignments()
RETURNS TABLE (
  test_id UUID,
  test_name TEXT,
  section_id UUID,
  section_name TEXT,
  configured_count INT,
  assigned_count BIGINT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_teacher()) THEN
    RAISE EXCEPTION 'Access Denied: Only staff can run this check.';
  END IF;

  RETURN QUERY
  SELECT
    t.id AS test_id,
    t.name AS test_name,
    ts.id AS section_id,
    ts.name AS section_name,
    ts.question_count AS configured_count,
    COUNT(tsq.question_id) AS assigned_count,
    CASE
      WHEN COUNT(tsq.question_id) = ts.question_count THEN 'OK'
      WHEN COUNT(tsq.question_id) = 0 THEN 'MISSING ALL QUESTIONS'
      WHEN COUNT(tsq.question_id) < ts.question_count THEN 'INSUFFICIENT QUESTIONS'
      ELSE 'EXCESS QUESTIONS'
    END AS status
  FROM public.tests t
  JOIN public.test_sections ts ON ts.test_id = t.id
  LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
  GROUP BY t.id, t.name, ts.id, ts.name, ts.question_count
  HAVING COUNT(tsq.question_id) <> ts.question_count
  ORDER BY t.name, ts.position;
END;
$$;

REVOKE ALL ON FUNCTION public.check_test_question_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_test_question_assignments() TO authenticated;
