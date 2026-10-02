-- ============================================================================
-- Migration: 20261003000001_add_can_manage_test_function.sql
-- Description: Define helper function can_manage_test(uuid)
-- Author: ANTIGRAVITY / DEEPMIND PAIR PROGRAMMING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_manage_test(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.is_admin() OR (
    public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = p_test_id AND t.created_by = auth.uid()
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_test(UUID) TO authenticated;
