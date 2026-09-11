-- ============================================================================
-- Migration: 20260911040000_seed_100_question_bank_mcqs.sql
-- Description: Seed 100 High-Quality MCQs for Forces Preparation
-- Author: ANTIGRAVITY / DEEPMIND PAIR PROGRAMMING
-- ============================================================================

-- 1. Ensure all required subjects exist
INSERT INTO public.subjects (id, code, name, category, default_time_per_question_sec, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000011', 'INTELLIGENCE_GENERAL', 'General Intelligence', 'INTELLIGENCE', 40, 11),
  ('30000000-0000-0000-0000-000000000012', 'ACADEMIC_COMPUTER_SCIENCE', 'Computer Science', 'ACADEMIC', 45, 12),
  ('30000000-0000-0000-0000-000000000013', 'ACADEMIC_GENERAL_SCIENCE', 'General Science', 'ACADEMIC', 40, 13)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category;

-- 2. Insert 100 Questions & Options & Course Mappings
DO $$
DECLARE
  v_qid UUID;
BEGIN

  -- Question: BANK-VRB-001
  v_qid := '60000000-0000-0000-0000-000000000001';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-001', '30000000-0000-0000-0000-000000000001', 'EASY', 'Book : Read :: Food : ?', 'As a book is meant to be read, food is meant to be eaten.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Cook', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Eat', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Buy', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Serve', false, 4);

  -- Course associations for BANK-VRB-001
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

  -- Question: BANK-VRB-002
  v_qid := '60000000-0000-0000-0000-000000000002';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-002', '30000000-0000-0000-0000-000000000001', 'EASY', 'Doctor : Hospital :: Teacher : ?', 'A doctor works in a hospital; similarly, a teacher works in a school.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Office', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'School', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Library', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Court', false, 4);

  -- Course associations for BANK-VRB-002
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

  -- Question: BANK-VRB-003
  v_qid := '60000000-0000-0000-0000-000000000003';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-003', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Which word is most similar in meaning to CANDID?', 'Candid means open, honest, and straightforward, which is synonymous with Frank.', 45, 'APPROVED', ARRAY['Synonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Frank', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Secretive', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Deceitful', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Hesitant', false, 4);

  -- Course associations for BANK-VRB-003
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

  -- Question: BANK-VRB-004
  v_qid := '60000000-0000-0000-0000-000000000004';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-004', '30000000-0000-0000-0000-000000000001', 'EASY', 'What is the opposite of BRAVE?', 'Cowardly is the direct antonym of brave.', 45, 'APPROVED', ARRAY['Antonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Bold', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Courageous', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Cowardly', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Strong', false, 4);

  -- Course associations for BANK-VRB-004
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

  -- Question: BANK-VRB-005
  v_qid := '60000000-0000-0000-0000-000000000005';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-005', '30000000-0000-0000-0000-000000000001', 'EASY', 'Which word does not belong with the others?', 'Kabul is the capital of Afghanistan, while Islamabad, Karachi, and Lahore are cities in Pakistan.', 45, 'APPROVED', ARRAY['Odd One Out', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Islamabad', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Karachi', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Lahore', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Kabul', true, 4);

  -- Course associations for BANK-VRB-005
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

  -- Question: BANK-VRB-006
  v_qid := '60000000-0000-0000-0000-000000000006';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-006', '30000000-0000-0000-0000-000000000001', 'EASY', 'Find the odd one out among the following items:', 'Sword is a melee cold weapon, while the others are modern firearms.', 45, 'APPROVED', ARRAY['Odd One Out', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-006
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Rifle', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Pistol', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Sword', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Machine Gun', false, 4);

  -- Course associations for BANK-VRB-006
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

  -- Question: BANK-VRB-007
  v_qid := '60000000-0000-0000-0000-000000000007';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-007', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'If ARMY is coded as 1-18-13-25, how is NAVY coded?', 'Each letter is converted to its alphabetical position (N=14, A=1, V=22, Y=25).', 45, 'APPROVED', ARRAY['Coding-Decoding', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-007
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '14-1-22-25', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '14-1-21-25', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '13-1-22-25', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '14-2-22-25', false, 4);

  -- Course associations for BANK-VRB-007
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

  -- Question: BANK-VRB-008
  v_qid := '60000000-0000-0000-0000-000000000008';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-008', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'In a certain code language, PILOT is written as QJMPU. How is TRAIN written in that code?', 'Each letter is shifted forward by 1 position (T->U, R->S, A->B, I->J, N->O).', 45, 'APPROVED', ARRAY['Coding-Decoding', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-008
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'USBJO', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'UQBJM', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'VSBJO', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'USBIN', false, 4);

  -- Course associations for BANK-VRB-008
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

  -- Question: BANK-VRB-009
  v_qid := '60000000-0000-0000-0000-000000000009';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-009', '30000000-0000-0000-0000-000000000001', 'EASY', 'What comes next in the letter series: B, D, F, H, ?', 'The series skips one letter between consecutive terms (B(+2)=D, D(+2)=F, F(+2)=H, H(+2)=J).', 45, 'APPROVED', ARRAY['Alphabet Series', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-009
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'I', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'J', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'K', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'L', false, 4);

  -- Course associations for BANK-VRB-009
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

  -- Question: BANK-VRB-010
  v_qid := '60000000-0000-0000-0000-000000000010';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-010', '30000000-0000-0000-0000-000000000001', 'EASY', 'Complete the series: Z, X, V, T, ?', 'The letters move backward by 2 steps in alphabetical order (T - 2 = R).', 45, 'APPROVED', ARRAY['Alphabet Series', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-010
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'R', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'S', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Q', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'P', false, 4);

  -- Course associations for BANK-VRB-010
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

  -- Question: BANK-VRB-011
  v_qid := '60000000-0000-0000-0000-000000000011';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-011', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Pointing to a photograph, Ali said, "She is the mother of my father''s only son." Who is the woman to Ali?', '"My father''s only son" refers to Ali himself. Therefore, the woman is Ali''s mother.', 45, 'APPROVED', ARRAY['Family Relationship', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-011
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Grandmother', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Mother', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Sister', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Aunt', false, 4);

  -- Course associations for BANK-VRB-011
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

  -- Question: BANK-VRB-012
  v_qid := '60000000-0000-0000-0000-000000000012';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-012', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'If A is B''s brother, B is C''s sister, and C is D''s father, how is A related to D?', 'A and B are siblings of C. Since C is D''s father, C''s brother A is D''s uncle.', 45, 'APPROVED', ARRAY['Family Relationship', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-012
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Father', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Uncle', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Brother', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Grandfather', false, 4);

  -- Course associations for BANK-VRB-012
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

  -- Question: BANK-VRB-013
  v_qid := '60000000-0000-0000-0000-000000000013';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-013', '30000000-0000-0000-0000-000000000001', 'EASY', 'A person walks 5 km North, turns right and walks 3 km, then turns right again and walks 5 km. How far is he from his starting point?', 'The North and South movements of 5 km cancel out, leaving him 3 km East of the starting point.', 45, 'APPROVED', ARRAY['Direction Reasoning', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-013
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '3 km', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '5 km', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '8 km', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '13 km', false, 4);

  -- Course associations for BANK-VRB-013
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

  -- Question: BANK-VRB-014
  v_qid := '60000000-0000-0000-0000-000000000014';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-014', '30000000-0000-0000-0000-000000000001', 'HARD', 'If South-East becomes North, and North-East becomes West, what will West become?', 'The compass directions are rotated 135 degrees counter-clockwise. West rotated 135 degrees counter-clockwise becomes South-East.', 45, 'APPROVED', ARRAY['Direction Reasoning', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-014
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'North-East', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'South-East', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'South-West', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'North-West', false, 4);

  -- Course associations for BANK-VRB-014
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

  -- Question: BANK-VRB-015
  v_qid := '60000000-0000-0000-0000-000000000015';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-015', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Complete the sentence: "Although he studied hard for the test, his results were ________."', '"Although" introduces a contrast. "Studied hard" contrasts with "disappointing" results.', 45, 'APPROVED', ARRAY['Sentence Completion', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-015
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Outstanding', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Disappointing', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Excellent', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Flawless', false, 4);

  -- Course associations for BANK-VRB-015
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

  -- Question: BANK-VRB-016
  v_qid := '60000000-0000-0000-0000-000000000016';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-016', '30000000-0000-0000-0000-000000000001', 'EASY', 'Fire is to Smoke as Virus is to ?', 'Smoke is the effect produced by fire; disease is the effect produced by a virus.', 45, 'APPROVED', ARRAY['Word Relationships', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-016
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Medicine', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Disease', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hospital', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Bacteria', false, 4);

  -- Course associations for BANK-VRB-016
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

  -- Question: BANK-VRB-017
  v_qid := '60000000-0000-0000-0000-000000000017';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-017', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Arrange the words in a logical sequence: 1. Country 2. Village 3. Continent 4. District', 'Arranging from smallest to largest geographic unit: Village (2) -> District (4) -> Country (1) -> Continent (3).', 45, 'APPROVED', ARRAY['Sequence', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-017
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '2, 4, 1, 3', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '1, 2, 3, 4', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '2, 1, 4, 3', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '4, 2, 1, 3', false, 4);

  -- Course associations for BANK-VRB-017
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

  -- Question: BANK-VRB-018
  v_qid := '60000000-0000-0000-0000-000000000018';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-018', '30000000-0000-0000-0000-000000000001', 'EASY', 'Air Force : Pilot :: Navy : ?', 'Air Force operational personnel include pilots; Navy operational personnel include sailors.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-018
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Infantry', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Sailor', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Trooper', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Cadet', false, 4);

  -- Course associations for BANK-VRB-018
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

  -- Question: BANK-VRB-019
  v_qid := '60000000-0000-0000-0000-000000000019';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-019', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Select the synonym of FRUGAL.', 'Frugal means sparing or economical regarding money or resources.', 45, 'APPROVED', ARRAY['Synonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-019
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Wasteful', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Economical', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Generous', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Extravagant', false, 4);

  -- Course associations for BANK-VRB-019
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

  -- Question: BANK-VRB-020
  v_qid := '60000000-0000-0000-0000-000000000020';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-020', '30000000-0000-0000-0000-000000000001', 'EASY', 'Select the antonym of EXPAND.', 'Contract means to decrease in size, which is the direct opposite of expand.', 45, 'APPROVED', ARRAY['Antonym', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-020
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Increase', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Contract', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Extend', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Spread', false, 4);

  -- Course associations for BANK-VRB-020
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

  -- Question: BANK-VRB-021
  v_qid := '60000000-0000-0000-0000-000000000021';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-021', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'Which of the following is the odd one out?', 'Cube is a 3-dimensional solid shape, whereas Square, Circle, and Triangle are 2-dimensional plane figures.', 45, 'APPROVED', ARRAY['Odd One Out', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-021
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Square', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Circle', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Triangle', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Cube', true, 4);

  -- Course associations for BANK-VRB-021
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

  -- Question: BANK-VRB-022
  v_qid := '60000000-0000-0000-0000-000000000022';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-022', '30000000-0000-0000-0000-000000000001', 'EASY', 'If all Cadets are disciplined, and Usman is a Cadet, what can be logically concluded?', 'By syllogism: All Cadets are disciplined + Usman is a Cadet -> Usman is disciplined.', 45, 'APPROVED', ARRAY['Logical Deduction', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-022
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Usman is not disciplined', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Usman is disciplined', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'All disciplined people are Cadets', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Usman is an officer', false, 4);

  -- Course associations for BANK-VRB-022
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

  -- Question: BANK-VRB-023
  v_qid := '60000000-0000-0000-0000-000000000023';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-023', '30000000-0000-0000-0000-000000000001', 'MEDIUM', 'If CAT is coded as 3120, what is DOG coded as?', 'Letter positions: D=4, O=15, G=7 -> 4157.', 45, 'APPROVED', ARRAY['Coding-Decoding', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-023
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '4157', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '4147', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '3157', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '4156', false, 4);

  -- Course associations for BANK-VRB-023
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

  -- Question: BANK-VRB-024
  v_qid := '60000000-0000-0000-0000-000000000024';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-024', '30000000-0000-0000-0000-000000000001', 'HARD', 'Thermometer : Temperature :: Hygrometer : ?', 'Thermometer measures temperature; hygrometer measures atmospheric humidity.', 45, 'APPROVED', ARRAY['Analogy', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-024
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Pressure', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Humidity', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Wind Speed', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Altitude', false, 4);

  -- Course associations for BANK-VRB-024
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

  -- Question: BANK-VRB-025
  v_qid := '60000000-0000-0000-0000-000000000025';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-VRB-025', '30000000-0000-0000-0000-000000000001', 'EASY', 'Choose the correct word: "The officer displayed great ________ during the crisis."', 'Valour means courage in battle or crisis, fitting the sentence context.', 45, 'APPROVED', ARRAY['Sentence Completion', 'Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-VRB-025
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Panic', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Valour', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hesitation', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Confusion', false, 4);

  -- Course associations for BANK-VRB-025
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

  -- Question: BANK-NVR-001
  v_qid := '60000000-0000-0000-0000-000000000026';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-001', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Figure 1 shows a circle with 1 line. Figure 2 has 2 lines. Figure 3 has 3 lines. Which figure should come next in the sequence?', 'The number of lines inside the circle increases by 1 in each step (1 -> 2 -> 3 -> 4).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'A circle with 2 lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'A circle with 4 lines', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'A square with 3 lines', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'An empty circle', false, 4);

  -- Course associations for BANK-NVR-001
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

  -- Question: BANK-NVR-002
  v_qid := '60000000-0000-0000-0000-000000000027';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-002', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Completion: A 2x2 grid has top-left half-black, top-right half-black, bottom-left half-black. Which figure completes the grid pattern?', 'All four quadrants of the grid follow a symmetrical half-black shading rule.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Bottom-right half-black square', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Completely white square', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Circle with cross', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Empty grid', false, 4);

  -- Course associations for BANK-NVR-002
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

  -- Question: BANK-NVR-003
  v_qid := '60000000-0000-0000-0000-000000000028';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-003', '30000000-0000-0000-0000-000000000002', 'EASY', 'Odd Figure Out: Figure A (Triangle, 3 sides), Figure B (Square, 4 sides), Figure C (Pentagon, 5 sides), Figure D (Circle, curved line). Which figure is the odd one out?', 'Figures A, B, and C are composed of straight lines (polygons), while Figure D (Circle) is formed by a curved line.', 45, 'APPROVED', ARRAY['Odd Figure', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);

  -- Course associations for BANK-NVR-003
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

  -- Question: BANK-NVR-004
  v_qid := '60000000-0000-0000-0000-000000000029';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-004', '30000000-0000-0000-0000-000000000002', 'EASY', 'Rotation: An arrow pointing Upward is rotated 90 degrees Clockwise. In which direction will the arrow point?', 'A 90-degree clockwise rotation turns Upward to Right.', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Downward', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Right', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Left', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Upward', false, 4);

  -- Course associations for BANK-NVR-004
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

  -- Question: BANK-NVR-005
  v_qid := '60000000-0000-0000-0000-000000000030';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-005', '30000000-0000-0000-0000-000000000002', 'EASY', 'Mirror Image: A capital letter ''P'' is reflected in a vertical mirror on its right. What does the mirror image look like?', 'A vertical mirror flips the figure horizontally, transferring the loop of ''P'' from right to left.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Reversed letter P with loop on left', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Letter P unchanged', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Inverted letter P upside down', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Letter B', false, 4);

  -- Course associations for BANK-NVR-005
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

  -- Question: BANK-NVR-006
  v_qid := '60000000-0000-0000-0000-000000000031';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-006', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Matrix Reasoning: Row 1 contains [1 dot, 2 dots, 3 dots]. Row 2 contains [2 dots, 3 dots, 4 dots]. Row 3 contains [3 dots, 4 dots, ?]. What figure completes Row 3?', 'Each row increases dot counts progressively by 1 (3 -> 4 -> 5).', 45, 'APPROVED', ARRAY['Matrix', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-006
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '4 dots', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '5 dots', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '6 dots', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '2 dots', false, 4);

  -- Course associations for BANK-NVR-006
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

  -- Question: BANK-NVR-007
  v_qid := '60000000-0000-0000-0000-000000000032';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-007', '30000000-0000-0000-0000-000000000002', 'EASY', 'Embedded Figure: Which option contains a hidden right-angled triangle within its shape outline?', 'Dividing a rectangle diagonally creates two right-angled triangles.', 45, 'APPROVED', ARRAY['Embedded Figure', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-007
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'A simple circle', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'A rectangle divided diagonally', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'A regular hexagon', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'An ellipse', false, 4);

  -- Course associations for BANK-NVR-007
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

  -- Question: BANK-NVR-008
  v_qid := '60000000-0000-0000-0000-000000000033';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-008', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Spatial Folding: A flat square piece of paper is folded in half horizontally, then folded in half vertically, and a circular hole is punched in the center. When unfolded, how many holes will be visible?', 'Folding twice creates 4 layers. Punching 1 hole through 4 layers produces 4 holes when unfolded.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-008
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '1 hole', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '2 holes', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '4 holes', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '8 holes', false, 4);

  -- Course associations for BANK-NVR-008
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

  -- Question: BANK-NVR-009
  v_qid := '60000000-0000-0000-0000-000000000034';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-009', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Analogy: [Solid Square] is to [Hollow Square] as [Solid Circle] is to [?].', 'The transformation rule changes a filled/solid shape into an unfilled/hollow version of the same shape.', 45, 'APPROVED', ARRAY['Figure Analogy', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-009
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Solid Triangle', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Hollow Circle', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hollow Square', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Solid Star', false, 4);

  -- Course associations for BANK-NVR-009
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

  -- Question: BANK-NVR-010
  v_qid := '60000000-0000-0000-0000-000000000035';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-010', '30000000-0000-0000-0000-000000000002', 'HARD', 'Rotation Sequence: A shaded sector in a circle rotates 45 degrees clockwise in each consecutive frame. If Frame 1 is at 12 o''clock, where will the sector be in Frame 4?', 'Frame 1 = 12:00 (0 deg), Frame 2 = 1:30 (45 deg), Frame 3 = 3:00 (90 deg), Frame 4 = 4:30 (135 deg).', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-010
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '1:30 position', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '3:00 position', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '4:30 position', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '6:00 position', false, 4);

  -- Course associations for BANK-NVR-010
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

  -- Question: BANK-NVR-011
  v_qid := '60000000-0000-0000-0000-000000000036';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-011', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Box 1 has 1 triangle inside. Box 2 has 2 triangles. Box 3 has 3 triangles. How many triangles should Box 5 contain?', 'The number of triangles equals the Box position number (Box 5 = 5 triangles).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-011
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '4 triangles', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '5 triangles', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '6 triangles', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '3 triangles', false, 4);

  -- Course associations for BANK-NVR-011
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

  -- Question: BANK-NVR-012
  v_qid := '60000000-0000-0000-0000-000000000037';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-012', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Odd Figure Out: Figure A (4 parallel lines), Figure B (3 parallel lines), Figure C (2 parallel lines), Figure D (2 intersecting lines). Which is the odd figure?', 'Figures A, B, and C consist solely of parallel lines; Figure D contains intersecting lines.', 45, 'APPROVED', ARRAY['Odd Figure', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-012
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Figure A', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Figure B', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Figure C', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Figure D', true, 4);

  -- Course associations for BANK-NVR-012
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

  -- Question: BANK-NVR-013
  v_qid := '60000000-0000-0000-0000-000000000038';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-013', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Synthesis: When a transparent sheet with 3 horizontal lines is overlaid onto a sheet with 3 vertical lines, what pattern is formed?', 'Perpendicular intersecting lines form a grid pattern.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-013
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '6 parallel lines', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'A 3x3 grid pattern', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'A single diagonal line', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'A solid square', false, 4);

  -- Course associations for BANK-NVR-013
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

  -- Question: BANK-NVR-014
  v_qid := '60000000-0000-0000-0000-000000000039';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-014', '30000000-0000-0000-0000-000000000002', 'HARD', 'Horizontal Mirror: A horizontal arrow pointing Left is reflected across a top horizontal mirror line. Which direction does the arrow point in the reflection?', 'A horizontal mirror flips vertical orientation (top/bottom) but preserves left/right directions.', 45, 'APPROVED', ARRAY['Mirror Image', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-014
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Left', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Right', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Up', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Down', false, 4);

  -- Course associations for BANK-NVR-014
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

  -- Question: BANK-NVR-015
  v_qid := '60000000-0000-0000-0000-000000000040';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-015', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Arithmetic: [Square containing Circle] minus [Inner Circle] equals [?].', 'Subtracting the inner circle leaves only the outer square frame.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-015
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Empty Square', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Triangle', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Circle', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Cross', false, 4);

  -- Course associations for BANK-NVR-015
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

  -- Question: BANK-NVR-016
  v_qid := '60000000-0000-0000-0000-000000000041';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-016', '30000000-0000-0000-0000-000000000002', 'EASY', 'Figure Series: Frame 1 = Triangle (3 sides), Frame 2 = Rectangle (4 sides), Frame 3 = Pentagon (5 sides). What shape comes next in Frame 4?', 'The number of polygon sides increases by 1 (3 -> 4 -> 5 -> 6 sides = Hexagon).', 45, 'APPROVED', ARRAY['Figure Series', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-016
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hexagon (6 sides)', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Heptagon (7 sides)', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Octagon (8 sides)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Quadrilateral (4 sides)', false, 4);

  -- Course associations for BANK-NVR-016
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

  -- Question: BANK-NVR-017
  v_qid := '60000000-0000-0000-0000-000000000042';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-017', '30000000-0000-0000-0000-000000000002', 'MEDIUM', '3x3 Matrix: Row 1 = [Plus, Minus, Equals]. Row 2 = [Minus, Equals, Plus]. Row 3 = [Equals, Plus, ?]. What symbol is missing?', 'Each row and column must contain all three symbols (Plus, Minus, Equals).', 45, 'APPROVED', ARRAY['Matrix', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-017
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Plus', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Minus', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Equals', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Multiply', false, 4);

  -- Course associations for BANK-NVR-017
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

  -- Question: BANK-NVR-018
  v_qid := '60000000-0000-0000-0000-000000000043';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-018', '30000000-0000-0000-0000-000000000002', 'EASY', '3D Reasoning: A standard die has opposite faces summing to 7. If the top face shows 2, what number is on the bottom face?', 'Opposite faces sum to 7: 7 - 2 = 5.', 45, 'APPROVED', ARRAY['Spatial Reasoning', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-018
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '4', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '5', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '6', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '1', false, 4);

  -- Course associations for BANK-NVR-018
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

  -- Question: BANK-NVR-019
  v_qid := '60000000-0000-0000-0000-000000000044';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-019', '30000000-0000-0000-0000-000000000002', 'EASY', 'Pattern Alternation: Frame 1 = White Circle, Frame 2 = Black Circle, Frame 3 = White Circle. What is Frame 4?', 'The shading alternates between White and Black in each step.', 45, 'APPROVED', ARRAY['Pattern Completion', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-019
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'White Circle', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Black Circle', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Grey Circle', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'White Square', false, 4);

  -- Course associations for BANK-NVR-019
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

  -- Question: BANK-NVR-020
  v_qid := '60000000-0000-0000-0000-000000000045';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-NVR-020', '30000000-0000-0000-0000-000000000002', 'MEDIUM', 'Figure Rotation: A line segment at 0 degrees (pointing right) rotates 90 degrees counter-clockwise. Where does it point now?', '90 degrees counter-clockwise from 0 degrees (Right) points Upward (90 degrees).', 45, 'APPROVED', ARRAY['Rotation', 'Non-Verbal'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-NVR-020
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Upward', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Downward', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Left', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Right', false, 4);

  -- Course associations for BANK-NVR-020
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

  -- Question: BANK-IQ-001
  v_qid := '60000000-0000-0000-0000-000000000046';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-001', '30000000-0000-0000-0000-000000000011', 'EASY', 'What is the next number in the series: 3, 6, 12, 24, 48, ?', 'Each term is multiplied by 2 (48 x 2 = 96).', 45, 'APPROVED', ARRAY['Number Series', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '60', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '72', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '96', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '108', false, 4);

  -- Course associations for BANK-IQ-001
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

  -- Question: BANK-IQ-002
  v_qid := '60000000-0000-0000-0000-000000000047';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-002', '30000000-0000-0000-0000-000000000011', 'MEDIUM', 'Find the missing number: 2, 5, 10, 17, 26, ?', 'The differences between consecutive terms are odd numbers: +3, +5, +7, +9, so next is +11 (26 + 11 = 37).', 45, 'APPROVED', ARRAY['Number Series', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '35', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '37', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '40', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '42', false, 4);

  -- Course associations for BANK-IQ-002
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

  -- Question: BANK-IQ-003
  v_qid := '60000000-0000-0000-0000-000000000048';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-003', '30000000-0000-0000-0000-000000000011', 'EASY', 'A car travels at a speed of 60 km/h. How far will it travel in 2.5 hours?', 'Distance = Speed x Time = 60 x 2.5 = 150 km.', 45, 'APPROVED', ARRAY['Arithmetic Reasoning', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '120 km', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '150 km', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '180 km', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '200 km', false, 4);

  -- Course associations for BANK-IQ-003
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

  -- Question: BANK-IQ-004
  v_qid := '60000000-0000-0000-0000-000000000049';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-004', '30000000-0000-0000-0000-000000000011', 'MEDIUM', 'A father is 3 times as old as his son. If the sum of their ages is 48 years, how old is the son?', 'Son''s age = x, Father''s age = 3x. x + 3x = 48 -> 4x = 48 -> x = 12.', 45, 'APPROVED', ARRAY['Age Problem', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '10 years', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '12 years', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '14 years', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '16 years', false, 4);

  -- Course associations for BANK-IQ-004
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

  -- Question: BANK-IQ-005
  v_qid := '60000000-0000-0000-0000-000000000050';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-005', '30000000-0000-0000-0000-000000000011', 'EASY', 'What is 15% of 240?', '15% of 240 = (15 / 100) x 240 = 0.15 x 240 = 36.', 45, 'APPROVED', ARRAY['Percentages', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '30', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '36', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '40', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '42', false, 4);

  -- Course associations for BANK-IQ-005
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

  -- Question: BANK-IQ-006
  v_qid := '60000000-0000-0000-0000-000000000051';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-006', '30000000-0000-0000-0000-000000000011', 'EASY', 'If the ratio of boys to girls in a class of 35 students is 3:2, how many boys are there?', 'Total ratio parts = 3 + 2 = 5. Boys = (3 / 5) x 35 = 21.', 45, 'APPROVED', ARRAY['Ratios', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-006
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '14', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '15', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '21', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '24', false, 4);

  -- Course associations for BANK-IQ-006
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

  -- Question: BANK-IQ-007
  v_qid := '60000000-0000-0000-0000-000000000052';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-007', '30000000-0000-0000-0000-000000000011', 'MEDIUM', 'If 6 workers can construct a wall in 4 days, how many days will 3 workers take working at the same rate?', 'Inverse proportion: Workers x Days = Constant (6 x 4 = 24). For 3 workers: 24 / 3 = 8 days.', 45, 'APPROVED', ARRAY['Arithmetic Reasoning', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-007
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '2 days', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '6 days', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '8 days', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '12 days', false, 4);

  -- Course associations for BANK-IQ-007
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

  -- Question: BANK-IQ-008
  v_qid := '60000000-0000-0000-0000-000000000053';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-008', '30000000-0000-0000-0000-000000000011', 'EASY', 'What is the angle between the hour hand and minute hand of a clock at 3:00?', 'At 3:00, the minute hand is at 12 and the hour hand is at 3, forming a 90-degree right angle.', 45, 'APPROVED', ARRAY['Clock Reasoning', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-008
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '45 degrees', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '60 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '90 degrees', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '120 degrees', false, 4);

  -- Course associations for BANK-IQ-008
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

  -- Question: BANK-IQ-009
  v_qid := '60000000-0000-0000-0000-000000000054';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-009', '30000000-0000-0000-0000-000000000011', 'MEDIUM', 'If 1st January of a non-leap year falls on a Monday, what day of the week will 31st December of the same year be?', 'A non-leap year has 365 days (52 weeks + 1 extra day). Thus, the year begins and ends on the same day of the week (Monday).', 45, 'APPROVED', ARRAY['Calendar Reasoning', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-009
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Sunday', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Monday', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Tuesday', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Wednesday', false, 4);

  -- Course associations for BANK-IQ-009
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

  -- Question: BANK-IQ-010
  v_qid := '60000000-0000-0000-0000-000000000055';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-010', '30000000-0000-0000-0000-000000000011', 'MEDIUM', 'The average of 5 consecutive numbers is 20. What is the largest of these numbers?', 'The middle number is the average (20). The 5 consecutive numbers are 18, 19, 20, 21, 22. Largest is 22.', 45, 'APPROVED', ARRAY['Average', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-010
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '21', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '22', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '23', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '24', false, 4);

  -- Course associations for BANK-IQ-010
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

  -- Question: BANK-IQ-011
  v_qid := '60000000-0000-0000-0000-000000000056';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-011', '30000000-0000-0000-0000-000000000011', 'HARD', 'If a tank is 3/4 full and 15 liters are removed, it becomes 1/2 full. What is the total capacity of the tank?', 'Fraction removed = 3/4 - 1/2 = 1/4 of total capacity C. 1/4 C = 15 -> C = 60 liters.', 45, 'APPROVED', ARRAY['Fraction Logic', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-011
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '45 liters', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '60 liters', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '75 liters', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '90 liters', false, 4);

  -- Course associations for BANK-IQ-011
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

  -- Question: BANK-IQ-012
  v_qid := '60000000-0000-0000-0000-000000000057';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-012', '30000000-0000-0000-0000-000000000011', 'HARD', 'Complete the sequence: 100, 99, 95, 86, 70, ?', 'Differences are consecutive square numbers: -1^2, -2^2 (-4), -3^2 (-9), -4^2 (-16), so next is -5^2 (-25). 70 - 25 = 45.', 45, 'APPROVED', ARRAY['Number Series', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-012
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '45', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '50', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '54', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '60', false, 4);

  -- Course associations for BANK-IQ-012
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

  -- Question: BANK-IQ-013
  v_qid := '60000000-0000-0000-0000-000000000058';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-013', '30000000-0000-0000-0000-000000000011', 'EASY', 'A fair six-sided die is rolled. What is the probability of getting an even number?', 'Even numbers on a die are {2, 4, 6} (3 outcomes out of 6). Probability = 3/6 = 1/2.', 45, 'APPROVED', ARRAY['Probability', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-013
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '1/6', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '1/3', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '1/2', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '2/3', false, 4);

  -- Course associations for BANK-IQ-013
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

  -- Question: BANK-IQ-014
  v_qid := '60000000-0000-0000-0000-000000000059';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-014', '30000000-0000-0000-0000-000000000011', 'EASY', 'Which number is prime?', '31 has no positive divisors other than 1 and itself, making it a prime number.', 45, 'APPROVED', ARRAY['Classification', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-014
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '21', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '27', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '31', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '35', false, 4);

  -- Course associations for BANK-IQ-014
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

  -- Question: BANK-IQ-015
  v_qid := '60000000-0000-0000-0000-000000000060';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-IQ-015', '30000000-0000-0000-0000-000000000011', 'MEDIUM', 'Convert 90 km/h into meters per second (m/s):', 'Multiply by 5/18: 90 x (5/18) = 5 x 5 = 25 m/s.', 45, 'APPROVED', ARRAY['Speed Conversion', 'IQ'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-IQ-015
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '20 m/s', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '25 m/s', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '30 m/s', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '35 m/s', false, 4);

  -- Course associations for BANK-IQ-015
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

  -- Question: BANK-MTH-001
  v_qid := '60000000-0000-0000-0000-000000000061';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-001', '30000000-0000-0000-0000-000000000004', 'EASY', 'Solve for x: 3x - 7 = 14', '3x = 14 + 7 = 21 -> x = 7.', 45, 'APPROVED', ARRAY['Algebra', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '5', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '6', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '7', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '8', false, 4);

  -- Course associations for BANK-MTH-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-002
  v_qid := '60000000-0000-0000-0000-000000000062';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-002', '30000000-0000-0000-0000-000000000004', 'EASY', 'What are the roots of the equation x^2 - 5x + 6 = 0?', '(x - 2)(x - 3) = 0 -> x = 2 or x = 3.', 45, 'APPROVED', ARRAY['Quadratic Equation', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'x = 2, 3', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'x = -2, -3', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'x = 1, 6', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'x = -1, -6', false, 4);

  -- Course associations for BANK-MTH-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-003
  v_qid := '60000000-0000-0000-0000-000000000063';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-003', '30000000-0000-0000-0000-000000000004', 'EASY', 'What is the area of a right-angled triangle with base 8 cm and height 6 cm?', 'Area = (1/2) x base x height = (1/2) x 8 x 6 = 24 cm^2.', 45, 'APPROVED', ARRAY['Geometry', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '24 cm^2', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '48 cm^2', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '14 cm^2', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '30 cm^2', false, 4);

  -- Course associations for BANK-MTH-003
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-004
  v_qid := '60000000-0000-0000-0000-000000000064';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-004', '30000000-0000-0000-0000-000000000004', 'EASY', 'What is the value of sin(30 degrees)?', 'The exact value of sin(30 deg) is 0.5 or 1/2.', 45, 'APPROVED', ARRAY['Trigonometry', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '1/2', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'sqrt(3)/2', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '1/sqrt(2)', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '1', false, 4);

  -- Course associations for BANK-MTH-004
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-005
  v_qid := '60000000-0000-0000-0000-000000000065';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-005', '30000000-0000-0000-0000-000000000004', 'MEDIUM', 'Find the determinant of the 2x2 matrix [[4, 2], [1, 3]]:', 'det = (4 x 3) - (2 x 1) = 12 - 2 = 10.', 45, 'APPROVED', ARRAY['Matrices', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '10', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '14', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '8', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '6', false, 4);

  -- Course associations for BANK-MTH-005
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-006
  v_qid := '60000000-0000-0000-0000-000000000066';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-006', '30000000-0000-0000-0000-000000000004', 'EASY', 'What is the value of log10(1000)?', '10^3 = 1000, so log10(1000) = 3.', 45, 'APPROVED', ARRAY['Logarithm', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-006
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '2', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '3', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '4', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '10', false, 4);

  -- Course associations for BANK-MTH-006
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-007
  v_qid := '60000000-0000-0000-0000-000000000067';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-007', '30000000-0000-0000-0000-000000000004', 'MEDIUM', 'What is the derivative of f(x) = 4x^3 with respect to x?', 'd/dx(4x^3) = 4 x 3x^2 = 12x^2.', 45, 'APPROVED', ARRAY['Calculus', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-007
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '12x^2', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '4x^2', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '12x^3', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '8x', false, 4);

  -- Course associations for BANK-MTH-007
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-MTH-008
  v_qid := '60000000-0000-0000-0000-000000000068';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-MTH-008', '30000000-0000-0000-0000-000000000004', 'MEDIUM', 'The sum of interior angles of a polygon with n sides is given by:', 'The standard formula for the sum of interior angles of an n-sided polygon is (n - 2) x 180 deg.', 45, 'APPROVED', ARRAY['Geometry', 'Math'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-MTH-008
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '(n - 2) x 180 degrees', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '(n + 2) x 180 degrees', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'n x 180 degrees', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '(n - 1) x 360 degrees', false, 4);

  -- Course associations for BANK-MTH-008
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-ENG-001
  v_qid := '60000000-0000-0000-0000-000000000069';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ENG-001', '30000000-0000-0000-0000-000000000005', 'EASY', 'Choose the correct preposition: "He has been living in Lahore ________ 2018."', '"Since" is used with a specific point in time (2018).', 45, 'APPROVED', ARRAY['Prepositions', 'English'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ENG-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'For', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Since', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'From', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'In', false, 4);

  -- Course associations for BANK-ENG-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ENG-002
  v_qid := '60000000-0000-0000-0000-000000000070';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ENG-002', '30000000-0000-0000-0000-000000000005', 'EASY', 'Change into passive voice: "The teacher opened the door."', 'Past simple "opened" becomes "was opened" in passive voice.', 45, 'APPROVED', ARRAY['Grammar', 'English'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ENG-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'The door is opened by the teacher', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'The door was opened by the teacher', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'The door has been opened by the teacher', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'The door had opened by the teacher', false, 4);

  -- Course associations for BANK-ENG-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ENG-003
  v_qid := '60000000-0000-0000-0000-000000000071';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ENG-003', '30000000-0000-0000-0000-000000000005', 'EASY', 'Choose the antonym of DILIGENT:', 'Diligent means hardworking; lazy is its opposite.', 45, 'APPROVED', ARRAY['Vocabulary', 'English'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ENG-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Hardworking', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Lazy', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Careful', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Active', false, 4);

  -- Course associations for BANK-ENG-003
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ENG-004
  v_qid := '60000000-0000-0000-0000-000000000072';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ENG-004', '30000000-0000-0000-0000-000000000005', 'MEDIUM', 'Select the grammatically correct option: "Neither Ali nor his friends ________ present yesterday."', 'When subjects are joined by "neither...nor", the verb agrees with the closer subject ("his friends" -> plural -> "were").', 45, 'APPROVED', ARRAY['Grammar', 'English'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ENG-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Was', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Were', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Is', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Are', false, 4);

  -- Course associations for BANK-ENG-004
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ENG-005
  v_qid := '60000000-0000-0000-0000-000000000073';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ENG-005', '30000000-0000-0000-0000-000000000005', 'EASY', 'What is the meaning of the idiom "To burn the midnight oil"?', '"Burn the midnight oil" means to study or work late into the night.', 45, 'APPROVED', ARRAY['Idioms', 'English'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ENG-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'To waste energy', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'To study or work late into the night', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'To cause a fire accident', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'To sleep early', false, 4);

  -- Course associations for BANK-ENG-005
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ENG-006
  v_qid := '60000000-0000-0000-0000-000000000074';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ENG-006', '30000000-0000-0000-0000-000000000005', 'MEDIUM', 'Identify the correct sentence:', 'Adjectives ending in "-ior" (senior, junior, superior) are followed by "to", not "than".', 45, 'APPROVED', ARRAY['Grammar', 'English'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ENG-006
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'She is senior than me', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'She is senior to me', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'She is more senior than me', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'She is senior from me', false, 4);

  -- Course associations for BANK-ENG-006
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-PHY-001
  v_qid := '60000000-0000-0000-0000-000000000075';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PHY-001', '30000000-0000-0000-0000-000000000003', 'EASY', 'Which of Newton''s laws of motion defines force?', 'Newton''s Second Law (F = ma) provides the quantitative definition of force.', 45, 'APPROVED', ARRAY['Motion', 'Physics'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PHY-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'First Law', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Second Law', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Third Law', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Law of Gravitation', false, 4);

  -- Course associations for BANK-PHY-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-PHY-002
  v_qid := '60000000-0000-0000-0000-000000000076';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PHY-002', '30000000-0000-0000-0000-000000000003', 'EASY', 'What is the SI unit of work and energy?', 'The International System of Units (SI) unit of work and energy is the Joule (J).', 45, 'APPROVED', ARRAY['Energy', 'Physics'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PHY-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Newton', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Joule', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Watt', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Pascal', false, 4);

  -- Course associations for BANK-PHY-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-PHY-003
  v_qid := '60000000-0000-0000-0000-000000000077';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PHY-003', '30000000-0000-0000-0000-000000000003', 'EASY', 'According to Ohm''s law, the relationship between voltage (V), current (I), and resistance (R) is:', 'Ohm''s law states that Voltage = Current x Resistance (V = IR).', 45, 'APPROVED', ARRAY['Electricity', 'Physics'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PHY-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'V = I / R', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'V = I * R', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'V = I + R', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'V = R / I', false, 4);

  -- Course associations for BANK-PHY-003
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-PHY-004
  v_qid := '60000000-0000-0000-0000-000000000078';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PHY-004', '30000000-0000-0000-0000-000000000003', 'EASY', 'What is the speed of light in a vacuum?', 'The speed of electromagnetic radiation in vacuum is approximately 3 x 10^8 meters per second.', 45, 'APPROVED', ARRAY['Waves', 'Physics'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PHY-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '3 x 10^8 m/s', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '3 x 10^6 m/s', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '3 x 10^10 m/s', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '3 x 10^5 m/s', false, 4);

  -- Course associations for BANK-PHY-004
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-PHY-005
  v_qid := '60000000-0000-0000-0000-000000000079';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PHY-005', '30000000-0000-0000-0000-000000000003', 'MEDIUM', 'If the distance between two masses is doubled, the gravitational force between them becomes:', 'Gravitational force follows the inverse square law (F proportional to 1/r^2). Doubling distance reduces force to 1/4.', 45, 'APPROVED', ARRAY['Gravitation', 'Physics'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PHY-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Double', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Half', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'One-fourth', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Quadruple', false, 4);

  -- Course associations for BANK-PHY-005
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-CS-001
  v_qid := '60000000-0000-0000-0000-000000000080';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-CS-001', '30000000-0000-0000-0000-000000000012', 'EASY', 'Which type of computer memory is volatile?', 'Random Access Memory (RAM) loses its contents when power is switched off (volatile memory).', 45, 'APPROVED', ARRAY['Memory', 'Computer Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-CS-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'ROM', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'RAM', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hard Disk', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Flash Drive', false, 4);

  -- Course associations for BANK-CS-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-CS-002
  v_qid := '60000000-0000-0000-0000-000000000081';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-CS-002', '30000000-0000-0000-0000-000000000012', 'EASY', 'What does IP stand for in computer networking?', 'IP stands for Internet Protocol.', 45, 'APPROVED', ARRAY['Networking', 'Computer Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-CS-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Internet Protocol', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Internal Process', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Interface Program', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Information Provider', false, 4);

  -- Course associations for BANK-CS-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-CS-003
  v_qid := '60000000-0000-0000-0000-000000000082';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-CS-003', '30000000-0000-0000-0000-000000000012', 'EASY', 'How many bits are in 1 byte?', '1 byte consists of exactly 8 bits.', 45, 'APPROVED', ARRAY['Fundamentals', 'Computer Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-CS-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '4 bits', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '8 bits', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '16 bits', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '32 bits', false, 4);

  -- Course associations for BANK-CS-003
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-CS-004
  v_qid := '60000000-0000-0000-0000-000000000083';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-CS-004', '30000000-0000-0000-0000-000000000012', 'EASY', 'Which of the following is an open-source operating system kernel?', 'Linux is a famous open-source operating system kernel.', 45, 'APPROVED', ARRAY['Operating Systems', 'Computer Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-CS-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Windows', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Linux', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'macOS', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'MS-DOS', false, 4);

  -- Course associations for BANK-CS-004
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000005') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000004') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000016') ON CONFLICT DO NOTHING;

  -- Question: BANK-GSC-001
  v_qid := '60000000-0000-0000-0000-000000000084';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GSC-001', '30000000-0000-0000-0000-000000000013', 'EASY', 'Which organelle is known as the powerhouse of the cell?', 'Mitochondria generate most of the chemical energy (ATP) needed by the cell.', 45, 'APPROVED', ARRAY['Biology', 'General Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GSC-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Nucleus', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Mitochondria', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Ribosome', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Golgi Apparatus', false, 4);

  -- Course associations for BANK-GSC-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GSC-002
  v_qid := '60000000-0000-0000-0000-000000000085';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GSC-002', '30000000-0000-0000-0000-000000000013', 'EASY', 'What is the chemical formula for water?', 'Water consists of two hydrogen atoms bonded to one oxygen atom (H2O).', 45, 'APPROVED', ARRAY['Chemistry', 'General Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GSC-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'H2O', true, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'CO2', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'NaCl', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'H2SO4', false, 4);

  -- Course associations for BANK-GSC-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GSC-003
  v_qid := '60000000-0000-0000-0000-000000000086';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GSC-003', '30000000-0000-0000-0000-000000000013', 'EASY', 'Gas main component in Earth''s atmosphere by volume is:', 'Nitrogen makes up approximately 78% of Earth''s atmosphere by volume.', 45, 'APPROVED', ARRAY['Everyday Science', 'General Science'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GSC-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Oxygen', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Nitrogen', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Carbon Dioxide', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Argon', false, 4);

  -- Course associations for BANK-GSC-003
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-PAK-001
  v_qid := '60000000-0000-0000-0000-000000000087';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PAK-001', '30000000-0000-0000-0000-000000000009', 'EASY', 'In which city was the famous Lahore Resolution (Pakistan Resolution) passed in 1940?', 'The Lahore Resolution was passed at Minto Park (now Iqbal Park), Lahore, on 23rd March 1940.', 45, 'APPROVED', ARRAY['History', 'Pakistan Studies'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PAK-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Karachi', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Lahore', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Dhaka', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Islamabad', false, 4);

  -- Course associations for BANK-PAK-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-PAK-002
  v_qid := '60000000-0000-0000-0000-000000000088';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-PAK-002', '30000000-0000-0000-0000-000000000009', 'EASY', 'Which is the highest mountain peak in Pakistan?', 'K2 is the highest peak in Pakistan and the second-highest peak in the world (8,611 meters).', 45, 'APPROVED', ARRAY['Geography', 'Pakistan Studies'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-PAK-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Nanga Parbat', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'K2 (Godwin-Austen)', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Broad Peak', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Tirich Mir', false, 4);

  -- Course associations for BANK-PAK-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ISL-001
  v_qid := '60000000-0000-0000-0000-000000000089';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ISL-001', '30000000-0000-0000-0000-000000000010', 'MEDIUM', 'In which year of Hijrah was the obligation of Fasting (Saum in Ramadan) prescribed?', 'Fasting during Ramadan was rendered obligatory in the 2nd year of Hijrah (2 AH).', 45, 'APPROVED', ARRAY['Seerah', 'Islamiyat'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ISL-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '1st AH', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '2nd AH', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '3rd AH', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '5th AH', false, 4);

  -- Course associations for BANK-ISL-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-ISL-002
  v_qid := '60000000-0000-0000-0000-000000000090';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-ISL-002', '30000000-0000-0000-0000-000000000010', 'EASY', 'How many Surahs (chapters) are in the Holy Quran?', 'The Holy Quran comprises 114 Surahs.', 45, 'APPROVED', ARRAY['Quran', 'Islamiyat'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-ISL-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '110', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '114', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '120', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '86', false, 4);

  -- Course associations for BANK-ISL-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-001
  v_qid := '60000000-0000-0000-0000-000000000091';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-001', '30000000-0000-0000-0000-000000000008', 'EASY', 'What is the capital city of Turkey?', 'Ankara is the official capital city of Turkey.', 45, 'APPROVED', ARRAY['Geography', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-001
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Istanbul', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Ankara', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Izmir', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Antalya', false, 4);

  -- Course associations for BANK-GK-001
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-002
  v_qid := '60000000-0000-0000-0000-000000000092';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-002', '30000000-0000-0000-0000-000000000008', 'EASY', 'When is Defence Day celebrated annually in Pakistan?', 'Pakistan celebrates Defence Day on 6th September every year.', 45, 'APPROVED', ARRAY['Defence Awareness', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-002
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', '14th August', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', '6th September', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', '23rd March', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', '25th December', false, 4);

  -- Course associations for BANK-GK-002
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-003
  v_qid := '60000000-0000-0000-0000-000000000093';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-003', '30000000-0000-0000-0000-000000000008', 'EASY', 'What is the official currency of Japan?', 'The Japanese Yen (JPY) is the official currency of Japan.', 45, 'APPROVED', ARRAY['Currency', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-003
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Yuan', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Won', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Yen', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Ringgit', false, 4);

  -- Course associations for BANK-GK-003
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-004
  v_qid := '60000000-0000-0000-0000-000000000094';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-004', '30000000-0000-0000-0000-000000000008', 'EASY', 'Where is the headquarters of the United Nations (UN) located?', 'The headquarters of the United Nations is situated in New York City, USA.', 45, 'APPROVED', ARRAY['World Institutions', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-004
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Geneva', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'New York', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'London', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Paris', false, 4);

  -- Course associations for BANK-GK-004
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-005
  v_qid := '60000000-0000-0000-0000-000000000095';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-005', '30000000-0000-0000-0000-000000000008', 'EASY', 'Which port is the largest deep-sea port in Pakistan?', 'Gwadar Port is Pakistan''s largest deep-sea warm-water port.', 45, 'APPROVED', ARRAY['Pakistan Geography', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-005
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Port Qasim', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Gwadar Port', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Pasni Port', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Ormara Port', false, 4);

  -- Course associations for BANK-GK-005
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-006
  v_qid := '60000000-0000-0000-0000-000000000096';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-006', '30000000-0000-0000-0000-000000000008', 'EASY', 'Which planet in our solar system is known as the Red Planet?', 'Mars is called the Red Planet due to the iron oxide prevalent on its surface.', 45, 'APPROVED', ARRAY['Science Facts', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-006
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Venus', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Mars', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Jupiter', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Saturn', false, 4);

  -- Course associations for BANK-GK-006
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-007
  v_qid := '60000000-0000-0000-0000-000000000097';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-007', '30000000-0000-0000-0000-000000000008', 'EASY', 'What is the national animal of Pakistan?', 'The Markhor (Capra falconeri) is the national animal of Pakistan.', 45, 'APPROVED', ARRAY['National Symbols', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-007
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Bengal Tiger', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Markhor', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Snow Leopard', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Chinkara', false, 4);

  -- Course associations for BANK-GK-007
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-008
  v_qid := '60000000-0000-0000-0000-000000000098';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-008', '30000000-0000-0000-0000-000000000008', 'EASY', 'What is the highest military award of Pakistan for bravery?', 'Nishan-e-Haider is Pakistan''s highest military gallantry award.', 45, 'APPROVED', ARRAY['Defence Awareness', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-008
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Sitara-e-Jurat', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Nishan-e-Haider', true, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Hilal-e-Jurat', false, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Tamgha-e-Basalat', false, 4);

  -- Course associations for BANK-GK-008
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-009
  v_qid := '60000000-0000-0000-0000-000000000099';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-009', '30000000-0000-0000-0000-000000000008', 'EASY', 'Which is the largest ocean in the world?', 'The Pacific Ocean is the largest and deepest ocean on Earth.', 45, 'APPROVED', ARRAY['Geography', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-009
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Atlantic Ocean', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Indian Ocean', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Pacific Ocean', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Arctic Ocean', false, 4);

  -- Course associations for BANK-GK-009
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

  -- Question: BANK-GK-010
  v_qid := '60000000-0000-0000-0000-000000000100';
  INSERT INTO public.questions (
    id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags, usage_type
  ) VALUES (
    v_qid, 'BANK-GK-010', '30000000-0000-0000-0000-000000000008', 'EASY', 'Which is the longest river in Pakistan?', 'The Indus River is the longest river in Pakistan (over 3,180 km long).', 45, 'APPROVED', ARRAY['Pakistan Geography', 'General Knowledge'], 'EXAM'
  ) ON CONFLICT (code) DO UPDATE SET
    stem = EXCLUDED.stem,
    explanation = EXCLUDED.explanation,
    status = EXCLUDED.status;

  -- Options for BANK-GK-010
  DELETE FROM public.question_options WHERE question_id = v_qid;
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'A', 'A', 'Jhelum', false, 1);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'B', 'B', 'Chenab', false, 2);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'C', 'C', 'Indus River', true, 3);
  INSERT INTO public.question_options (question_id, option_key, label, text, is_correct, sort_order)
  VALUES (v_qid, 'D', 'D', 'Ravi', false, 4);

  -- Course associations for BANK-GK-010
  DELETE FROM public.question_courses WHERE question_id = v_qid;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000006') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000007') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000013') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000003') ON CONFLICT DO NOTHING;
  INSERT INTO public.question_courses (question_id, course_id) VALUES (v_qid, '20000000-0000-0000-0000-000000000002') ON CONFLICT DO NOTHING;

END $$;
