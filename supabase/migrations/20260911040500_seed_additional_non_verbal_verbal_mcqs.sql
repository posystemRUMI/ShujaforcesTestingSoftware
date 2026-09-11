-- ============================================================================
-- Migration: 20260911040500_seed_additional_non_verbal_verbal_mcqs.sql
-- Description: Seed 50 Additional Non-Verbal + 30 Additional Verbal MCQs
-- Author: ANTIGRAVITY / DEEPMIND PAIR PROGRAMMING
-- ============================================================================

DO $$
DECLARE
  v_qid UUID;
BEGIN

  -- Question: BANK-NVR-021
  v_qid := '65000000-0000-0000-0000-000000000001';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-021', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Frame 1 shows 1 horizontal lines. Frame 2 shows 2 lines. Frame 3 shows 3 lines. Which figure comes next in Frame 4?', 'The number of horizontal lines increases progressively by 1 in each frame (3 + 1 = 4).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure with 2 lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure with 4 lines', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure with 5 lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Empty figure', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-022
  v_qid := '65000000-0000-0000-0000-000000000002';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-022', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Completion: A symmetrical 4-quadrant grid has 3 shaded quadrants. Which figure correctly completes the 4th quadrant?', 'Symmetrical grid completion requires the 4th quadrant to match the shading of the opposing quadrant.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Matching shaded quadrant', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'White quadrant', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Crossed quadrant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Dotted quadrant', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-023
  v_qid := '65000000-0000-0000-0000-000000000003';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-023', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Odd Figure Out: Figure A has 6 dots, Figure B has 8 dots, Figure C has 10 dots, Figure D has 9 dots. Which figure is the odd one out?', 'Figures A, B, and C contain an even number of dots, while Figure D (9) contains an odd number.', 45, 'APPROVED', ARRAY['Odd Figure Out', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-024
  v_qid := '65000000-0000-0000-0000-000000000004';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-024', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Rotation: A T-shaped figure pointing Upward (0 deg) is rotated 180 degrees clockwise. Which direction does the top bar face?', 'Rotating a figure clockwise by 180 degrees shifts its orientation by exactly 180 degrees.', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rotated 180 degrees clockwise', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Rotated 270 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Unchanged (0 deg)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Inverted (180 deg)', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-025
  v_qid := '65000000-0000-0000-0000-000000000005';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-025', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Mirror Reflection: A asymmetrical right triangle with a dot at the right apex is reflected vertically. Where is the dot in the reflection?', 'A vertical mirror reflection flips horizontal positions, transferring the right apex dot to the left.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'At the left apex', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'At the right apex', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'At the bottom corner', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'At the center', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-026
  v_qid := '65000000-0000-0000-0000-000000000006';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-026', '30000000-0000-0000-0000-000000000002', 'HARD', 'Matrix Reasoning: Row 1 = [6 dots, 7 dots, 8 dots]. Row 2 = [7 dots, 8 dots, 9 dots]. Row 3 = [8 dots, 9 dots, ?]. What fills the missing cell?', 'Each row increases dot counts by 1 sequentially (9 + 1 = 10).', 45, 'APPROVED', ARRAY['Matrix Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '9 dots', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '10 dots', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '11 dots', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '8 dots', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-027
  v_qid := '65000000-0000-0000-0000-000000000007';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-027', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Spatial Folding: A cube net has faces marked A, B, C, D, E, F. If face A is on top, which face is on the bottom in a standard net folding?', 'In a standard 1-4-1 cube net, the 1st and 6th (F) opposite faces form the top and bottom faces.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Face B', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Face C', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Face D', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Face F', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-028
  v_qid := '65000000-0000-0000-0000-000000000008';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-028', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shape Progression: Frame 1 contains 8 inner squares. Frame 2 contains 10 inner squares. Frame 3 contains 12 inner squares. How many squares should Frame 4 contain?', 'The number of inner squares increases by 2 in each consecutive frame (12 + 2 = 14).', 45, 'APPROVED', ARRAY['Shape Count', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '13 squares', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '14 squares', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '15 squares', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '16 squares', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-029
  v_qid := '65000000-0000-0000-0000-000000000009';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-029', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shading Sequence: Circle 1 is 25% shaded, Circle 2 is 50% shaded, Circle 3 is 75% shaded. What is the shading percentage of Circle 4?', 'The shading increases by 25% per step, reaching 100% (fully shaded) in Circle 4.', 45, 'APPROVED', ARRAY['Shading Alternation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '80% shaded', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '90% shaded', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '100% shaded (fully shaded)', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '0% shaded', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-030
  v_qid := '65000000-0000-0000-0000-000000000010';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-030', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Embedded Shape: Which option contains an embedded isosceles triangle within a regular hexagon frame?', 'Connecting alternate vertices inside a regular hexagon forms an equilateral/isosceles triangle.', 45, 'APPROVED', ARRAY['Embedded Shape', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hexagon with diagonal connecting alternate vertices', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Empty hexagon', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hexagon with parallel horizontal lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Circle inside hexagon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-031
  v_qid := '65000000-0000-0000-0000-000000000011';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-031', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Frame 1 shows 11 horizontal lines. Frame 2 shows 12 lines. Frame 3 shows 13 lines. Which figure comes next in Frame 4?', 'The number of horizontal lines increases progressively by 1 in each frame (13 + 1 = 14).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure with 12 lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure with 14 lines', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure with 15 lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Empty figure', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-032
  v_qid := '65000000-0000-0000-0000-000000000012';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-032', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Completion: A symmetrical 4-quadrant grid has 3 shaded quadrants. Which figure correctly completes the 4th quadrant?', 'Symmetrical grid completion requires the 4th quadrant to match the shading of the opposing quadrant.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Matching shaded quadrant', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'White quadrant', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Crossed quadrant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Dotted quadrant', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-033
  v_qid := '65000000-0000-0000-0000-000000000013';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-033', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Odd Figure Out: Figure A has 26 dots, Figure B has 28 dots, Figure C has 30 dots, Figure D has 29 dots. Which figure is the odd one out?', 'Figures A, B, and C contain an even number of dots, while Figure D (29) contains an odd number.', 45, 'APPROVED', ARRAY['Odd Figure Out', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-034
  v_qid := '65000000-0000-0000-0000-000000000014';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-034', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Rotation: A T-shaped figure pointing Upward (0 deg) is rotated 270 degrees clockwise. Which direction does the top bar face?', 'Rotating a figure clockwise by 270 degrees shifts its orientation by exactly 270 degrees.', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rotated 270 degrees clockwise', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Rotated 360 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Unchanged (0 deg)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Inverted (180 deg)', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-035
  v_qid := '65000000-0000-0000-0000-000000000015';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-035', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Mirror Reflection: A asymmetrical right triangle with a dot at the right apex is reflected vertically. Where is the dot in the reflection?', 'A vertical mirror reflection flips horizontal positions, transferring the right apex dot to the left.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'At the left apex', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'At the right apex', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'At the bottom corner', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'At the center', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-036
  v_qid := '65000000-0000-0000-0000-000000000016';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-036', '30000000-0000-0000-0000-000000000002', 'HARD', 'Matrix Reasoning: Row 1 = [16 dots, 17 dots, 18 dots]. Row 2 = [17 dots, 18 dots, 19 dots]. Row 3 = [18 dots, 19 dots, ?]. What fills the missing cell?', 'Each row increases dot counts by 1 sequentially (19 + 1 = 20).', 45, 'APPROVED', ARRAY['Matrix Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '19 dots', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '20 dots', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '21 dots', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '18 dots', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-037
  v_qid := '65000000-0000-0000-0000-000000000017';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-037', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Spatial Folding: A cube net has faces marked A, B, C, D, E, F. If face A is on top, which face is on the bottom in a standard net folding?', 'In a standard 1-4-1 cube net, the 1st and 6th (F) opposite faces form the top and bottom faces.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Face B', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Face C', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Face D', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Face F', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-038
  v_qid := '65000000-0000-0000-0000-000000000018';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-038', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shape Progression: Frame 1 contains 18 inner squares. Frame 2 contains 20 inner squares. Frame 3 contains 22 inner squares. How many squares should Frame 4 contain?', 'The number of inner squares increases by 2 in each consecutive frame (22 + 2 = 24).', 45, 'APPROVED', ARRAY['Shape Count', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '23 squares', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '24 squares', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '25 squares', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '26 squares', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-039
  v_qid := '65000000-0000-0000-0000-000000000019';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-039', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shading Sequence: Circle 1 is 25% shaded, Circle 2 is 50% shaded, Circle 3 is 75% shaded. What is the shading percentage of Circle 4?', 'The shading increases by 25% per step, reaching 100% (fully shaded) in Circle 4.', 45, 'APPROVED', ARRAY['Shading Alternation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '80% shaded', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '90% shaded', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '100% shaded (fully shaded)', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '0% shaded', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-040
  v_qid := '65000000-0000-0000-0000-000000000020';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-040', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Embedded Shape: Which option contains an embedded isosceles triangle within a regular hexagon frame?', 'Connecting alternate vertices inside a regular hexagon forms an equilateral/isosceles triangle.', 45, 'APPROVED', ARRAY['Embedded Shape', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hexagon with diagonal connecting alternate vertices', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Empty hexagon', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hexagon with parallel horizontal lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Circle inside hexagon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-041
  v_qid := '65000000-0000-0000-0000-000000000021';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-041', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Frame 1 shows 21 horizontal lines. Frame 2 shows 22 lines. Frame 3 shows 23 lines. Which figure comes next in Frame 4?', 'The number of horizontal lines increases progressively by 1 in each frame (23 + 1 = 24).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure with 22 lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure with 24 lines', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure with 25 lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Empty figure', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-042
  v_qid := '65000000-0000-0000-0000-000000000022';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-042', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Completion: A symmetrical 4-quadrant grid has 3 shaded quadrants. Which figure correctly completes the 4th quadrant?', 'Symmetrical grid completion requires the 4th quadrant to match the shading of the opposing quadrant.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Matching shaded quadrant', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'White quadrant', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Crossed quadrant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Dotted quadrant', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-043
  v_qid := '65000000-0000-0000-0000-000000000023';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-043', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Odd Figure Out: Figure A has 46 dots, Figure B has 48 dots, Figure C has 50 dots, Figure D has 49 dots. Which figure is the odd one out?', 'Figures A, B, and C contain an even number of dots, while Figure D (49) contains an odd number.', 45, 'APPROVED', ARRAY['Odd Figure Out', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-044
  v_qid := '65000000-0000-0000-0000-000000000024';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-044', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Rotation: A T-shaped figure pointing Upward (0 deg) is rotated 0 degrees clockwise. Which direction does the top bar face?', 'Rotating a figure clockwise by 0 degrees shifts its orientation by exactly 0 degrees.', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rotated 0 degrees clockwise', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Rotated 90 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Unchanged (0 deg)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Inverted (180 deg)', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-045
  v_qid := '65000000-0000-0000-0000-000000000025';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-045', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Mirror Reflection: A asymmetrical right triangle with a dot at the right apex is reflected vertically. Where is the dot in the reflection?', 'A vertical mirror reflection flips horizontal positions, transferring the right apex dot to the left.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'At the left apex', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'At the right apex', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'At the bottom corner', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'At the center', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-046
  v_qid := '65000000-0000-0000-0000-000000000026';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-046', '30000000-0000-0000-0000-000000000002', 'HARD', 'Matrix Reasoning: Row 1 = [26 dots, 27 dots, 28 dots]. Row 2 = [27 dots, 28 dots, 29 dots]. Row 3 = [28 dots, 29 dots, ?]. What fills the missing cell?', 'Each row increases dot counts by 1 sequentially (29 + 1 = 30).', 45, 'APPROVED', ARRAY['Matrix Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '29 dots', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '30 dots', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '31 dots', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '28 dots', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-047
  v_qid := '65000000-0000-0000-0000-000000000027';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-047', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Spatial Folding: A cube net has faces marked A, B, C, D, E, F. If face A is on top, which face is on the bottom in a standard net folding?', 'In a standard 1-4-1 cube net, the 1st and 6th (F) opposite faces form the top and bottom faces.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Face B', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Face C', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Face D', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Face F', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-048
  v_qid := '65000000-0000-0000-0000-000000000028';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-048', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shape Progression: Frame 1 contains 28 inner squares. Frame 2 contains 30 inner squares. Frame 3 contains 32 inner squares. How many squares should Frame 4 contain?', 'The number of inner squares increases by 2 in each consecutive frame (32 + 2 = 34).', 45, 'APPROVED', ARRAY['Shape Count', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '33 squares', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '34 squares', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '35 squares', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '36 squares', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-049
  v_qid := '65000000-0000-0000-0000-000000000029';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-049', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shading Sequence: Circle 1 is 25% shaded, Circle 2 is 50% shaded, Circle 3 is 75% shaded. What is the shading percentage of Circle 4?', 'The shading increases by 25% per step, reaching 100% (fully shaded) in Circle 4.', 45, 'APPROVED', ARRAY['Shading Alternation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '80% shaded', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '90% shaded', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '100% shaded (fully shaded)', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '0% shaded', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-050
  v_qid := '65000000-0000-0000-0000-000000000030';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-050', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Embedded Shape: Which option contains an embedded isosceles triangle within a regular hexagon frame?', 'Connecting alternate vertices inside a regular hexagon forms an equilateral/isosceles triangle.', 45, 'APPROVED', ARRAY['Embedded Shape', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hexagon with diagonal connecting alternate vertices', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Empty hexagon', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hexagon with parallel horizontal lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Circle inside hexagon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-051
  v_qid := '65000000-0000-0000-0000-000000000031';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-051', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Frame 1 shows 31 horizontal lines. Frame 2 shows 32 lines. Frame 3 shows 33 lines. Which figure comes next in Frame 4?', 'The number of horizontal lines increases progressively by 1 in each frame (33 + 1 = 34).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure with 32 lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure with 34 lines', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure with 35 lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Empty figure', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-052
  v_qid := '65000000-0000-0000-0000-000000000032';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-052', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Completion: A symmetrical 4-quadrant grid has 3 shaded quadrants. Which figure correctly completes the 4th quadrant?', 'Symmetrical grid completion requires the 4th quadrant to match the shading of the opposing quadrant.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Matching shaded quadrant', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'White quadrant', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Crossed quadrant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Dotted quadrant', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-053
  v_qid := '65000000-0000-0000-0000-000000000033';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-053', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Odd Figure Out: Figure A has 66 dots, Figure B has 68 dots, Figure C has 70 dots, Figure D has 69 dots. Which figure is the odd one out?', 'Figures A, B, and C contain an even number of dots, while Figure D (69) contains an odd number.', 45, 'APPROVED', ARRAY['Odd Figure Out', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-054
  v_qid := '65000000-0000-0000-0000-000000000034';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-054', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Rotation: A T-shaped figure pointing Upward (0 deg) is rotated 90 degrees clockwise. Which direction does the top bar face?', 'Rotating a figure clockwise by 90 degrees shifts its orientation by exactly 90 degrees.', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rotated 90 degrees clockwise', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Rotated 180 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Unchanged (0 deg)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Inverted (180 deg)', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-055
  v_qid := '65000000-0000-0000-0000-000000000035';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-055', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Mirror Reflection: A asymmetrical right triangle with a dot at the right apex is reflected vertically. Where is the dot in the reflection?', 'A vertical mirror reflection flips horizontal positions, transferring the right apex dot to the left.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'At the left apex', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'At the right apex', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'At the bottom corner', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'At the center', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-056
  v_qid := '65000000-0000-0000-0000-000000000036';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-056', '30000000-0000-0000-0000-000000000002', 'HARD', 'Matrix Reasoning: Row 1 = [36 dots, 37 dots, 38 dots]. Row 2 = [37 dots, 38 dots, 39 dots]. Row 3 = [38 dots, 39 dots, ?]. What fills the missing cell?', 'Each row increases dot counts by 1 sequentially (39 + 1 = 40).', 45, 'APPROVED', ARRAY['Matrix Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '39 dots', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '40 dots', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '41 dots', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '38 dots', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-057
  v_qid := '65000000-0000-0000-0000-000000000037';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-057', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Spatial Folding: A cube net has faces marked A, B, C, D, E, F. If face A is on top, which face is on the bottom in a standard net folding?', 'In a standard 1-4-1 cube net, the 1st and 6th (F) opposite faces form the top and bottom faces.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Face B', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Face C', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Face D', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Face F', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-058
  v_qid := '65000000-0000-0000-0000-000000000038';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-058', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shape Progression: Frame 1 contains 38 inner squares. Frame 2 contains 40 inner squares. Frame 3 contains 42 inner squares. How many squares should Frame 4 contain?', 'The number of inner squares increases by 2 in each consecutive frame (42 + 2 = 44).', 45, 'APPROVED', ARRAY['Shape Count', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '43 squares', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '44 squares', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '45 squares', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '46 squares', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-059
  v_qid := '65000000-0000-0000-0000-000000000039';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-059', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shading Sequence: Circle 1 is 25% shaded, Circle 2 is 50% shaded, Circle 3 is 75% shaded. What is the shading percentage of Circle 4?', 'The shading increases by 25% per step, reaching 100% (fully shaded) in Circle 4.', 45, 'APPROVED', ARRAY['Shading Alternation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '80% shaded', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '90% shaded', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '100% shaded (fully shaded)', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '0% shaded', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-060
  v_qid := '65000000-0000-0000-0000-000000000040';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-060', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Embedded Shape: Which option contains an embedded isosceles triangle within a regular hexagon frame?', 'Connecting alternate vertices inside a regular hexagon forms an equilateral/isosceles triangle.', 45, 'APPROVED', ARRAY['Embedded Shape', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hexagon with diagonal connecting alternate vertices', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Empty hexagon', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hexagon with parallel horizontal lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Circle inside hexagon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-061
  v_qid := '65000000-0000-0000-0000-000000000041';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-061', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Frame 1 shows 41 horizontal lines. Frame 2 shows 42 lines. Frame 3 shows 43 lines. Which figure comes next in Frame 4?', 'The number of horizontal lines increases progressively by 1 in each frame (43 + 1 = 44).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure with 42 lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure with 44 lines', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure with 45 lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Empty figure', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-062
  v_qid := '65000000-0000-0000-0000-000000000042';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-062', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Completion: A symmetrical 4-quadrant grid has 3 shaded quadrants. Which figure correctly completes the 4th quadrant?', 'Symmetrical grid completion requires the 4th quadrant to match the shading of the opposing quadrant.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Matching shaded quadrant', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'White quadrant', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Crossed quadrant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Dotted quadrant', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-063
  v_qid := '65000000-0000-0000-0000-000000000043';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-063', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Odd Figure Out: Figure A has 86 dots, Figure B has 88 dots, Figure C has 90 dots, Figure D has 89 dots. Which figure is the odd one out?', 'Figures A, B, and C contain an even number of dots, while Figure D (89) contains an odd number.', 45, 'APPROVED', ARRAY['Odd Figure Out', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-064
  v_qid := '65000000-0000-0000-0000-000000000044';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-064', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Rotation: A T-shaped figure pointing Upward (0 deg) is rotated 180 degrees clockwise. Which direction does the top bar face?', 'Rotating a figure clockwise by 180 degrees shifts its orientation by exactly 180 degrees.', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rotated 180 degrees clockwise', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Rotated 270 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Unchanged (0 deg)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Inverted (180 deg)', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-065
  v_qid := '65000000-0000-0000-0000-000000000045';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-065', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Mirror Reflection: A asymmetrical right triangle with a dot at the right apex is reflected vertically. Where is the dot in the reflection?', 'A vertical mirror reflection flips horizontal positions, transferring the right apex dot to the left.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'At the left apex', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'At the right apex', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'At the bottom corner', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'At the center', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-066
  v_qid := '65000000-0000-0000-0000-000000000046';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-066', '30000000-0000-0000-0000-000000000002', 'HARD', 'Matrix Reasoning: Row 1 = [46 dots, 47 dots, 48 dots]. Row 2 = [47 dots, 48 dots, 49 dots]. Row 3 = [48 dots, 49 dots, ?]. What fills the missing cell?', 'Each row increases dot counts by 1 sequentially (49 + 1 = 50).', 45, 'APPROVED', ARRAY['Matrix Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '49 dots', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '50 dots', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '51 dots', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '48 dots', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-067
  v_qid := '65000000-0000-0000-0000-000000000047';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-067', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Spatial Folding: A cube net has faces marked A, B, C, D, E, F. If face A is on top, which face is on the bottom in a standard net folding?', 'In a standard 1-4-1 cube net, the 1st and 6th (F) opposite faces form the top and bottom faces.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Face B', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Face C', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Face D', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Face F', true, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-068
  v_qid := '65000000-0000-0000-0000-000000000048';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-068', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shape Progression: Frame 1 contains 48 inner squares. Frame 2 contains 50 inner squares. Frame 3 contains 52 inner squares. How many squares should Frame 4 contain?', 'The number of inner squares increases by 2 in each consecutive frame (52 + 2 = 54).', 45, 'APPROVED', ARRAY['Shape Count', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '53 squares', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '54 squares', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '55 squares', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '56 squares', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-069
  v_qid := '65000000-0000-0000-0000-000000000049';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-069', '30000000-0000-0000-0000-000000000002', 'EASY', 'Shading Sequence: Circle 1 is 25% shaded, Circle 2 is 50% shaded, Circle 3 is 75% shaded. What is the shading percentage of Circle 4?', 'The shading increases by 25% per step, reaching 100% (fully shaded) in Circle 4.', 45, 'APPROVED', ARRAY['Shading Alternation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '80% shaded', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '90% shaded', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '100% shaded (fully shaded)', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '0% shaded', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-NVR-070
  v_qid := '65000000-0000-0000-0000-000000000050';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-070', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Embedded Shape: Which option contains an embedded isosceles triangle within a regular hexagon frame?', 'Connecting alternate vertices inside a regular hexagon forms an equilateral/isosceles triangle.', 45, 'APPROVED', ARRAY['Embedded Shape', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hexagon with diagonal connecting alternate vertices', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Empty hexagon', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hexagon with parallel horizontal lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Circle inside hexagon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-026
  v_qid := '65000000-0000-0000-0000-000000000051';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-026', '30000000-0000-0000-0000-000000000001', 'EASY', 'Ocean : Water :: Glacier : ? (#26)', 'An ocean is a large body of water; a glacier is a large body of ice.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rock', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Ice', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Snow', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'River', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-027
  v_qid := '65000000-0000-0000-0000-000000000052';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-027', '30000000-0000-0000-0000-000000000001', 'EASY', 'Pen : Write :: Knife : ? (#27)', 'A pen is a tool used for writing; a knife is a tool used for cutting.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Sharpen', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Cut', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Fork', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Spoon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-028
  v_qid := '65000000-0000-0000-0000-000000000053';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-028', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Which word is most similar in meaning to PRUDENT? (#28)', 'Prudent means showing care and thought for the future, synonymous with cautious.', 45, 'APPROVED', ARRAY['Synonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rash', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Cautious', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Careless', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Foolish', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-029
  v_qid := '65000000-0000-0000-0000-000000000054';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-029', '30000000-0000-0000-0000-000000000001', 'EASY', 'What is the opposite of PERMANENT? (#29)', 'Temporary means lasting for a limited time, which is the direct opposite of permanent.', 45, 'APPROVED', ARRAY['Antonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Durable', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Temporary', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Constant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Stable', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-030
  v_qid := '65000000-0000-0000-0000-000000000055';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-030', '30000000-0000-0000-0000-000000000001', 'EASY', 'Which word does not belong with the others? (#30)', 'Mercury, Venus, and Jupiter are planets; the Moon is a natural satellite.', 45, 'APPROVED', ARRAY['Odd One Out', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Mercury', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Venus', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Moon', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Jupiter', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-031
  v_qid := '65000000-0000-0000-0000-000000000056';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-031', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'If FAST is coded as 6-1-19-20, how is SLOW coded? (#31)', 'S=19, L=12, O=15, W=23 -> 19-12-15-23.', 45, 'APPROVED', ARRAY['Coding-Decoding', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '19-12-15-23', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '19-11-15-23', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '18-12-15-23', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '19-12-14-23', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-032
  v_qid := '65000000-0000-0000-0000-000000000057';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-032', '30000000-0000-0000-0000-000000000001', 'EASY', 'What comes next in the letter series: A, C, E, G, ? (#32)', 'The series skips one letter between terms (A(+2)=C, C(+2)=E, E(+2)=G, G(+2)=I).', 45, 'APPROVED', ARRAY['Alphabet Series', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'H', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'I', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'J', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'K', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-033
  v_qid := '65000000-0000-0000-0000-000000000058';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-033', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'A person walks 10 meters East, turns North and walks 5 meters, then turns West and walks 10 meters. How far is he from his starting point? (#33)', 'East and West 10 meters cancel out, leaving him 5 meters North of the starting point.', 45, 'APPROVED', ARRAY['Direction Reasoning', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '5 meters', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '10 meters', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '15 meters', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '20 meters', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-034
  v_qid := '65000000-0000-0000-0000-000000000059';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-034', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'B is the mother of C, and A is the father of B. How is A related to C? (#34)', 'Since B is C''s mother and A is B''s father, A is C''s maternal grandfather.', 45, 'APPROVED', ARRAY['Family Relationship', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Father', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Grandfather', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Uncle', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Brother', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-035
  v_qid := '65000000-0000-0000-0000-000000000060';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-035', '30000000-0000-0000-0000-000000000001', 'EASY', 'Choose the correct word: "The general commanded his troops to ________ the fort." (#35)', 'In a military context, troops are commanded to defend a fort.', 45, 'APPROVED', ARRAY['Sentence Completion', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Abandon', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Defend', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Surrender', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Ignore', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-036
  v_qid := '65000000-0000-0000-0000-000000000061';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-036', '30000000-0000-0000-0000-000000000001', 'EASY', 'Ocean : Water :: Glacier : ? (#36)', 'An ocean is a large body of water; a glacier is a large body of ice.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rock', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Ice', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Snow', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'River', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-037
  v_qid := '65000000-0000-0000-0000-000000000062';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-037', '30000000-0000-0000-0000-000000000001', 'EASY', 'Pen : Write :: Knife : ? (#37)', 'A pen is a tool used for writing; a knife is a tool used for cutting.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Sharpen', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Cut', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Fork', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Spoon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-038
  v_qid := '65000000-0000-0000-0000-000000000063';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-038', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Which word is most similar in meaning to PRUDENT? (#38)', 'Prudent means showing care and thought for the future, synonymous with cautious.', 45, 'APPROVED', ARRAY['Synonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rash', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Cautious', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Careless', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Foolish', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-039
  v_qid := '65000000-0000-0000-0000-000000000064';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-039', '30000000-0000-0000-0000-000000000001', 'EASY', 'What is the opposite of PERMANENT? (#39)', 'Temporary means lasting for a limited time, which is the direct opposite of permanent.', 45, 'APPROVED', ARRAY['Antonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Durable', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Temporary', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Constant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Stable', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-040
  v_qid := '65000000-0000-0000-0000-000000000065';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-040', '30000000-0000-0000-0000-000000000001', 'EASY', 'Which word does not belong with the others? (#40)', 'Mercury, Venus, and Jupiter are planets; the Moon is a natural satellite.', 45, 'APPROVED', ARRAY['Odd One Out', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Mercury', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Venus', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Moon', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Jupiter', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-041
  v_qid := '65000000-0000-0000-0000-000000000066';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-041', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'If FAST is coded as 6-1-19-20, how is SLOW coded? (#41)', 'S=19, L=12, O=15, W=23 -> 19-12-15-23.', 45, 'APPROVED', ARRAY['Coding-Decoding', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '19-12-15-23', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '19-11-15-23', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '18-12-15-23', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '19-12-14-23', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-042
  v_qid := '65000000-0000-0000-0000-000000000067';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-042', '30000000-0000-0000-0000-000000000001', 'EASY', 'What comes next in the letter series: A, C, E, G, ? (#42)', 'The series skips one letter between terms (A(+2)=C, C(+2)=E, E(+2)=G, G(+2)=I).', 45, 'APPROVED', ARRAY['Alphabet Series', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'H', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'I', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'J', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'K', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-043
  v_qid := '65000000-0000-0000-0000-000000000068';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-043', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'A person walks 10 meters East, turns North and walks 5 meters, then turns West and walks 10 meters. How far is he from his starting point? (#43)', 'East and West 10 meters cancel out, leaving him 5 meters North of the starting point.', 45, 'APPROVED', ARRAY['Direction Reasoning', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '5 meters', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '10 meters', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '15 meters', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '20 meters', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-044
  v_qid := '65000000-0000-0000-0000-000000000069';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-044', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'B is the mother of C, and A is the father of B. How is A related to C? (#44)', 'Since B is C''s mother and A is B''s father, A is C''s maternal grandfather.', 45, 'APPROVED', ARRAY['Family Relationship', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Father', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Grandfather', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Uncle', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Brother', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-045
  v_qid := '65000000-0000-0000-0000-000000000070';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-045', '30000000-0000-0000-0000-000000000001', 'EASY', 'Choose the correct word: "The general commanded his troops to ________ the fort." (#45)', 'In a military context, troops are commanded to defend a fort.', 45, 'APPROVED', ARRAY['Sentence Completion', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Abandon', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Defend', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Surrender', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Ignore', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-046
  v_qid := '65000000-0000-0000-0000-000000000071';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-046', '30000000-0000-0000-0000-000000000001', 'EASY', 'Ocean : Water :: Glacier : ? (#46)', 'An ocean is a large body of water; a glacier is a large body of ice.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rock', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Ice', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Snow', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'River', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-047
  v_qid := '65000000-0000-0000-0000-000000000072';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-047', '30000000-0000-0000-0000-000000000001', 'EASY', 'Pen : Write :: Knife : ? (#47)', 'A pen is a tool used for writing; a knife is a tool used for cutting.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Sharpen', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Cut', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Fork', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Spoon', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-048
  v_qid := '65000000-0000-0000-0000-000000000073';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-048', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Which word is most similar in meaning to PRUDENT? (#48)', 'Prudent means showing care and thought for the future, synonymous with cautious.', 45, 'APPROVED', ARRAY['Synonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rash', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Cautious', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Careless', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Foolish', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-049
  v_qid := '65000000-0000-0000-0000-000000000074';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-049', '30000000-0000-0000-0000-000000000001', 'EASY', 'What is the opposite of PERMANENT? (#49)', 'Temporary means lasting for a limited time, which is the direct opposite of permanent.', 45, 'APPROVED', ARRAY['Antonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Durable', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Temporary', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Constant', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Stable', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-050
  v_qid := '65000000-0000-0000-0000-000000000075';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-050', '30000000-0000-0000-0000-000000000001', 'EASY', 'Which word does not belong with the others? (#50)', 'Mercury, Venus, and Jupiter are planets; the Moon is a natural satellite.', 45, 'APPROVED', ARRAY['Odd One Out', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Mercury', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Venus', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Moon', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Jupiter', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-051
  v_qid := '65000000-0000-0000-0000-000000000076';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-051', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'If FAST is coded as 6-1-19-20, how is SLOW coded? (#51)', 'S=19, L=12, O=15, W=23 -> 19-12-15-23.', 45, 'APPROVED', ARRAY['Coding-Decoding', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '19-12-15-23', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '19-11-15-23', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '18-12-15-23', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '19-12-14-23', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-052
  v_qid := '65000000-0000-0000-0000-000000000077';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-052', '30000000-0000-0000-0000-000000000001', 'EASY', 'What comes next in the letter series: A, C, E, G, ? (#52)', 'The series skips one letter between terms (A(+2)=C, C(+2)=E, E(+2)=G, G(+2)=I).', 45, 'APPROVED', ARRAY['Alphabet Series', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'H', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'I', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'J', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'K', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-053
  v_qid := '65000000-0000-0000-0000-000000000078';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-053', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'A person walks 10 meters East, turns North and walks 5 meters, then turns West and walks 10 meters. How far is he from his starting point? (#53)', 'East and West 10 meters cancel out, leaving him 5 meters North of the starting point.', 45, 'APPROVED', ARRAY['Direction Reasoning', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '5 meters', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '10 meters', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '15 meters', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '20 meters', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-054
  v_qid := '65000000-0000-0000-0000-000000000079';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-054', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'B is the mother of C, and A is the father of B. How is A related to C? (#54)', 'Since B is C''s mother and A is B''s father, A is C''s maternal grandfather.', 45, 'APPROVED', ARRAY['Family Relationship', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Father', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Grandfather', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Uncle', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Brother', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-VRB-055
  v_qid := '65000000-0000-0000-0000-000000000080';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-055', '30000000-0000-0000-0000-000000000001', 'EASY', 'Choose the correct word: "The general commanded his troops to ________ the fort." (#55)', 'In a military context, troops are commanded to defend a fort.', 45, 'APPROVED', ARRAY['Sentence Completion', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Abandon', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Defend', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Surrender', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Ignore', false, 4);
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

END $$;
