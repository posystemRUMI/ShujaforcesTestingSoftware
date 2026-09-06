-- ============================================================================
-- Supabase Seed Data: seed.sql
-- Description: Deterministic Foundation & Domain Seed for Forces Academy CBT
-- Author: BACKEND-AGENT-1 / Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FORCES SEED
-- ----------------------------------------------------------------------------
INSERT INTO public.forces (id, code, name, description, motto, headquarters, sort_order)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'PAKISTAN_ARMY',
    'Pakistan Army',
    'Primary land warfare branch of the Pakistan Armed Forces.',
    'Iman, Taqwa, Jihad fi Sabilillah',
    'General Headquarters (GHQ), Rawalpindi',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'PAKISTAN_AIR_FORCE',
    'Pakistan Air Force',
    'Aerial warfare and air defence branch of the Pakistan Armed Forces.',
    'Sehraast ke Daryaast Tah-e-Bal-o-Par-e-Maast',
    'Air Headquarters (AHQ), Islamabad',
    2
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'PAKISTAN_NAVY',
    'Pakistan Navy',
    'Naval warfare and coastal defence branch of the Pakistan Armed Forces.',
    'Himmat-e-Mardan, Madad-e-Khuda',
    'Naval Headquarters (NHQ), Islamabad',
    3
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  motto = EXCLUDED.motto,
  headquarters = EXCLUDED.headquarters;

-- ----------------------------------------------------------------------------
-- 2. COURSES SEED
-- ----------------------------------------------------------------------------
INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'PMA_LONG_COURSE',
    'PMA Long Course (154 LC)',
    'Regular Commission officer cadet training at the Pakistan Military Academy Kakul.',
    104,
    1
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'GDP',
    'General Duty Pilot (GDP 158)',
    'Commissioned pilot training at the PAF Academy Asghar Khan, Risalpur.',
    156,
    2
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    'PN_CADET',
    'PN Cadet Term 2026-A',
    'Executive and technical officer cadet training at the Pakistan Naval Academy, Manora.',
    104,
    3
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'TCC',
    'Technical Cadet Course (TCC 36)',
    'Engineering corps commission via NUST military colleges (EME, MCE, MCS).',
    208,
    4
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'CAE',
    'College of Aeronautical Engineering (CAE 102)',
    'Aerospace and avionics engineering commission at CAE Risalpur.',
    208,
    5
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    'LCC',
    'Lady Cadet Course (LCC 24)',
    'Direct short service commission for female graduates at PMA Kakul.',
    26,
    6
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  duration_weeks = EXCLUDED.duration_weeks;

-- ----------------------------------------------------------------------------
-- 3. SUBJECTS SEED
-- ----------------------------------------------------------------------------
INSERT INTO public.subjects (id, code, name, category, default_time_per_question_sec, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'INTELLIGENCE_VERBAL', 'Verbal Intelligence', 'INTELLIGENCE', 35, 1),
  ('30000000-0000-0000-0000-000000000002', 'INTELLIGENCE_NON_VERBAL', 'Non-Verbal Intelligence', 'INTELLIGENCE', 40, 2),
  ('30000000-0000-0000-0000-000000000003', 'ACADEMIC_PHYSICS', 'Physics', 'ACADEMIC', 50, 3),
  ('30000000-0000-0000-0000-000000000004', 'ACADEMIC_MATH', 'Mathematics', 'ACADEMIC', 55, 4),
  ('30000000-0000-0000-0000-000000000005', 'ACADEMIC_ENGLISH', 'English', 'ACADEMIC', 30, 5),
  ('30000000-0000-0000-0000-000000000006', 'ACADEMIC_CHEMISTRY', 'Chemistry', 'ACADEMIC', 45, 6),
  ('30000000-0000-0000-0000-000000000007', 'ACADEMIC_BIOLOGY', 'Biology', 'ACADEMIC', 40, 7),
  ('30000000-0000-0000-0000-000000000008', 'GENERAL_KNOWLEDGE', 'General Knowledge', 'ACADEMIC', 30, 8),
  ('30000000-0000-0000-0000-000000000009', 'PAKISTAN_STUDIES', 'Pakistan Studies', 'ACADEMIC', 30, 9),
  ('30000000-0000-0000-0000-000000000010', 'ISLAMIAT', 'Islamiat & Ethics', 'ACADEMIC', 30, 10)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category;

-- Course Subjects Mapping
INSERT INTO public.course_subjects (course_id, subject_id, is_mandatory, minimum_pass_percentage)
VALUES
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, 60),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', true, 60),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', true, 50),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', true, 50),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', true, 65),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', true, 65),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', true, 60),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', true, 60)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. BATCHES SEED
-- ----------------------------------------------------------------------------
INSERT INTO public.batches (id, code, name, course_id, session_name, start_date, end_date, status, max_cadets)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '154-PMA-ALPHA',
    'PMA 154 Long Course Alpha Wing',
    '20000000-0000-0000-0000-000000000001',
    'Spring 2026 Intake',
    '2026-01-15',
    '2026-06-30',
    'ACTIVE',
    60
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '154-PMA-BRAVO',
    'PMA 154 Long Course Bravo Wing',
    '20000000-0000-0000-0000-000000000001',
    'Spring 2026 Intake',
    '2026-02-01',
    '2026-07-15',
    'ACTIVE',
    60
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '158-GDP-ALPHA',
    '158 GDP Alpha Squadron',
    '20000000-0000-0000-0000-000000000002',
    'Spring 2026 Intake',
    '2026-01-10',
    '2026-07-01',
    'ACTIVE',
    45
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- ----------------------------------------------------------------------------
-- 5. QUESTIONS & 4 OPTIONS SEED
-- ----------------------------------------------------------------------------

-- Q1: Verbal Coding
INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  'INT-V-0101',
  '30000000-0000-0000-0000-000000000001',
  'EASY',
  'If RADAR is coded as 18-1-4-1-18, what is the code for SONAR?',
  'Each letter corresponds directly to its alphabetical position: S=19, O=15, N=14, A=1, R=18.',
  45,
  'APPROVED',
  ARRAY['Coding-Decoding', 'Verbal Intelligence']
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'opt-a', 'A', '19-15-14-1-18', true),
  ('50000000-0000-0000-0000-000000000001', 'opt-b', 'B', '18-14-1-15-19', false),
  ('50000000-0000-0000-0000-000000000001', 'opt-c', 'C', '19-14-15-1-18', false),
  ('50000000-0000-0000-0000-000000000001', 'opt-d', 'D', '20-15-14-1-19', false)
ON CONFLICT DO NOTHING;

-- Q2: Verbal Odd One Out
INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags)
VALUES (
  '50000000-0000-0000-0000-000000000002',
  'INT-V-0102',
  '30000000-0000-0000-0000-000000000001',
  'EASY',
  'Which word does NOT belong with the others: Frigate, Destroyer, Artillery, Corvette?',
  'Frigate, Destroyer, and Corvette are naval surface combatants; Artillery is a land arm.',
  30,
  'APPROVED',
  ARRAY['Classification', 'Odd One Out']
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
VALUES
  ('50000000-0000-0000-0000-000000000002', 'opt-a', 'A', 'Frigate', false),
  ('50000000-0000-0000-0000-000000000002', 'opt-b', 'B', 'Destroyer', false),
  ('50000000-0000-0000-0000-000000000002', 'opt-c', 'C', 'Artillery', true),
  ('50000000-0000-0000-0000-000000000002', 'opt-d', 'D', 'Corvette', false)
ON CONFLICT DO NOTHING;

-- Q3: Non-Verbal Matrix Rotation
INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags)
VALUES (
  '50000000-0000-0000-0000-000000000003',
  'INT-NV-0201',
  '30000000-0000-0000-0000-000000000002',
  'MEDIUM',
  'In an analog dial sequence, a pointer rotates 45 degrees clockwise in step 1, 90 degrees in step 2, and 135 degrees in step 3. How many degrees must it rotate in step 4?',
  'The progression adds 45 degrees each step: 45, 90, 135, 180 degrees.',
  40,
  'APPROVED',
  ARRAY['Angular Rotation', 'Matrix Reasoning']
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
VALUES
  ('50000000-0000-0000-0000-000000000003', 'opt-a', 'A', '150 degrees clockwise', false),
  ('50000000-0000-0000-0000-000000000003', 'opt-b', 'B', '180 degrees clockwise', true),
  ('50000000-0000-0000-0000-000000000003', 'opt-c', 'C', '225 degrees clockwise', false),
  ('50000000-0000-0000-0000-000000000003', 'opt-d', 'D', '270 degrees clockwise', false)
ON CONFLICT DO NOTHING;

-- Q4: Physics Kinematics
INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags)
VALUES (
  '50000000-0000-0000-0000-000000000004',
  'ACAD-PHY-0301',
  '30000000-0000-0000-0000-000000000003',
  'MEDIUM',
  'A projectile is launched from ground level at 45 degrees with initial velocity 20 m/s. Assuming g = 9.8 m/s^2, what is its theoretical maximum horizontal range?',
  'Horizontal range R = (v^2 * sin(2*theta)) / g. For theta = 45, sin(90) = 1. R = 400 / 9.8 = 40.82 meters.',
  60,
  'APPROVED',
  ARRAY['Kinematics', 'Projectile Motion']
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
VALUES
  ('50000000-0000-0000-0000-000000000004', 'opt-a', 'A', '20.4 meters', false),
  ('50000000-0000-0000-0000-000000000004', 'opt-b', 'B', '40.8 meters', true),
  ('50000000-0000-0000-0000-000000000004', 'opt-c', 'C', '61.2 meters', false),
  ('50000000-0000-0000-0000-000000000004', 'opt-d', 'D', '81.6 meters', false)
ON CONFLICT DO NOTHING;

-- Q5: Mathematics Calculus
INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags)
VALUES (
  '50000000-0000-0000-0000-000000000005',
  'ACAD-MATH-0401',
  '30000000-0000-0000-0000-000000000004',
  'EASY',
  'Evaluate the limit as x approaches 0 of sin(5x) / (3x):',
  'Using the standard limit lim (x->0) [sin(ax)/(bx)] = a/b, we have 5/3.',
  45,
  'APPROVED',
  ARRAY['Calculus', 'Limits']
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
VALUES
  ('50000000-0000-0000-0000-000000000005', 'opt-a', 'A', '1', false),
  ('50000000-0000-0000-0000-000000000005', 'opt-b', 'B', '3/5', false),
  ('50000000-0000-0000-0000-000000000005', 'opt-c', 'C', '5/3', true),
  ('50000000-0000-0000-0000-000000000005', 'opt-d', 'D', 'Undefined', false)
ON CONFLICT DO NOTHING;

-- Q6: English Grammar
INSERT INTO public.questions (id, code, subject_id, difficulty, stem, explanation, time_limit_seconds, status, tags)
VALUES (
  '50000000-0000-0000-0000-000000000006',
  'ACAD-ENG-0501',
  '30000000-0000-0000-0000-000000000005',
  'EASY',
  'Choose the correct preposition: The commanding officer insisted ________ maintaining strict radio silence during the sortie.',
  'The verb "insist" takes the fixed preposition "on" (or "upon").',
  25,
  'APPROVED',
  ARRAY['Prepositions', 'English Grammar']
) ON CONFLICT (code) DO NOTHING;

INSERT INTO public.question_options (question_id, option_key, label, text, is_correct)
VALUES
  ('50000000-0000-0000-0000-000000000006', 'opt-a', 'A', 'for', false),
  ('50000000-0000-0000-0000-000000000006', 'opt-b', 'B', 'on', true),
  ('50000000-0000-0000-0000-000000000006', 'opt-c', 'C', 'at', false),
  ('50000000-0000-0000-0000-000000000006', 'opt-d', 'D', 'over', false)
ON CONFLICT DO NOTHING;
