-- =============================================================================
-- REPAIR SCRIPT: Populate test_section_questions for sections missing assignments
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- Date: 2026-10-09
-- =============================================================================

-- SECTION 1: Official Armed Forces Full Mock Pattern - Verbal Intelligence Section
-- subject_id: 9f9debd0-3e40-4f38-9067-2d8005313de2 (Intelligence Verbal)
-- needs: 20 questions | available in bank: 57
INSERT INTO public.test_section_questions (test_section_id, question_id, position)
SELECT 
  '2bb64bdd-4357-4eab-a1e5-82acc26fff5c'::uuid AS test_section_id,
  q.id AS question_id,
  ROW_NUMBER() OVER (ORDER BY q.created_at) AS position
FROM public.questions q
WHERE q.subject_id = '9f9debd0-3e40-4f38-9067-2d8005313de2'
  AND q.status = 'APPROVED'
  AND NOT EXISTS (
    SELECT 1 FROM public.test_section_questions tsq
    WHERE tsq.test_section_id = '2bb64bdd-4357-4eab-a1e5-82acc26fff5c'
      AND tsq.question_id = q.id
  )
ORDER BY q.created_at
LIMIT 20;

-- SECTION 2: Verification Test Pattern Alpha - Verbal Intelligence Section
-- subject_id: 9f9debd0-3e40-4f38-9067-2d8005313de2 (Intelligence Verbal)
-- needs: 20 questions | available: 57
INSERT INTO public.test_section_questions (test_section_id, question_id, position)
SELECT 
  '6c31775d-dec2-4d4c-835d-3b9f6fcddd2f'::uuid AS test_section_id,
  q.id AS question_id,
  ROW_NUMBER() OVER (ORDER BY q.created_at) AS position
FROM public.questions q
WHERE q.subject_id = '9f9debd0-3e40-4f38-9067-2d8005313de2'
  AND q.status = 'APPROVED'
  AND NOT EXISTS (
    SELECT 1 FROM public.test_section_questions tsq
    WHERE tsq.test_section_id = '6c31775d-dec2-4d4c-835d-3b9f6fcddd2f'
      AND tsq.question_id = q.id
  )
ORDER BY q.created_at
LIMIT 20;

-- SECTIONS 3-8: "demo" tests
-- These sections have NO subject_id configured, so subject-based auto-fill is impossible.
-- The demo tests need to be RECREATED using the Test Builder with proper subject selection.
-- Or their subject_id must be set first, then re-run this script.

-- Verify results:
SELECT 
  t.name as test_name, ts.name as section_name, ts.question_count as configured,
  COUNT(tsq.question_id) as assigned,
  CASE WHEN COUNT(tsq.question_id) = ts.question_count THEN 'OK' ELSE 'STILL MISSING' END as status
FROM public.tests t
JOIN public.test_sections ts ON ts.test_id = t.id
LEFT JOIN public.test_section_questions tsq ON tsq.test_section_id = ts.id
GROUP BY t.name, ts.name, ts.question_count
ORDER BY t.name, ts.name;
