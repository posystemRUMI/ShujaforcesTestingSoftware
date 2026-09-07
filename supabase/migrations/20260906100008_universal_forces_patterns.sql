-- ============================================================================
-- Migration: 20260906100008_universal_forces_patterns.sql
-- Description: Universal Forces Pattern System (Army, PAF, Navy)
--              Data-driven Test Pattern Templates, Pattern Sections,
--              Subject Associations, Admin-Only Test Creation, Results Auditing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED / ENSURE ALL ENTRY COURSES ACROSS ARMY, PAF, NAVY
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_army_id UUID := '10000000-0000-0000-0000-000000000001';
  v_paf_id UUID := '10000000-0000-0000-0000-000000000002';
  v_navy_id UUID := '10000000-0000-0000-0000-000000000003';
BEGIN
  -- 1. Army Entries
  INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
  VALUES
    ('20000000-0000-0000-0000-000000000001', v_army_id, 'PMA_LONG_COURSE', 'PMA Long Course', 'Regular Commission officer cadet training at PMA Kakul.', 104, 1),
    ('20000000-0000-0000-0000-000000000004', v_army_id, 'TCC', 'Technical Cadet Course', 'Engineering corps commission via NUST military colleges.', 208, 2),
    ('20000000-0000-0000-0000-000000000006', v_army_id, 'LCC', 'Lady Cadet Course', 'Short service commission for female graduates at PMA Kakul.', 26, 3),
    ('20000000-0000-0000-0000-000000000007', v_army_id, 'AFNS', 'Armed Forces Nursing Services (AFNS)', 'BSc Nursing & Trained Nurse commission in Armed Forces hospitals.', 208, 4),
    ('20000000-0000-0000-0000-000000000008', v_army_id, 'AMC', 'Medical Cadet (AMC)', 'MBBS / BDS commission via Army Medical College Rawalpindi.', 260, 5),
    ('20000000-0000-0000-0000-000000000009', v_army_id, 'SOLDIER', 'Soldier / Clerk / Technical', 'Junior commissioned cadre, clerical and technical recruitment.', 36, 6)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_weeks = EXCLUDED.duration_weeks,
    sort_order = EXCLUDED.sort_order;

  -- 2. Air Force Entries
  INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
  VALUES
    ('20000000-0000-0000-0000-000000000002', v_paf_id, 'GDP', 'General Duty Pilot (GDP)', 'Commissioned pilot officer training at PAF Academy Risalpur.', 156, 1),
    ('20000000-0000-0000-0000-000000000010', v_paf_id, 'AIR_DEFENCE', 'Air Defence Branch', 'Ground-based air defence controller and missile systems officer training.', 156, 2),
    ('20000000-0000-0000-0000-000000000005', v_paf_id, 'CAE', 'College of Aeronautical Engineering (CAE)', 'Aerospace and Avionics engineering commission at CAE Risalpur.', 208, 3),
    ('20000000-0000-0000-0000-000000000011', v_paf_id, 'PAF_SSC', 'Short Service Commission (SSC)', 'Direct officer entry for specialized degree holders in PAF.', 24, 4),
    ('20000000-0000-0000-0000-000000000012', v_paf_id, 'PAF_SPSSC', 'Special Purpose Short Service Commission', 'Professional specialist intake (Medical, Legal, IT) in PAF.', 24, 5),
    ('20000000-0000-0000-0000-000000000013', v_paf_id, 'AIRMEN', 'Airmen / Airwomen Induction', 'Aero-trade, provost, and ground combat cadre induction.', 48, 6)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_weeks = EXCLUDED.duration_weeks,
    sort_order = EXCLUDED.sort_order;

  -- 3. Navy Entries
  INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
  VALUES
    ('20000000-0000-0000-0000-000000000003', v_navy_id, 'PN_CADET', 'PN Cadet Term', 'Executive and technical officer cadet training at Pakistan Naval Academy.', 104, 1),
    ('20000000-0000-0000-0000-000000000014', v_navy_id, 'NAVY_SSC', 'Short Service Commission (Navy SSC)', 'Direct graduate officer induction in Executive, Supply, and Education branches.', 24, 2),
    ('20000000-0000-0000-0000-000000000015', v_navy_id, 'M_CADET', 'M-Cadet (Medical Cadet Navy)', 'Medical officer commission for studying medical undergraduates.', 260, 3),
    ('20000000-0000-0000-0000-000000000016', v_navy_id, 'SAILOR_TECH', 'Sailor Technical', 'Naval technical, marine engineering, and weapons electrical sailor entry.', 72, 4),
    ('20000000-0000-0000-0000-000000000017', v_navy_id, 'MARINES', 'Pakistan Marines', 'Amphibious coastal defence and special naval infantry induction.', 52, 5),
    ('20000000-0000-0000-0000-000000000018', v_navy_id, 'FMT', 'Female Medical Technician (FMT)', 'Naval paramedical and nursing technician staff cadre.', 48, 6)
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    duration_weeks = EXCLUDED.duration_weeks,
    sort_order = EXCLUDED.sort_order;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TEST PATTERN TEMPLATES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_pattern_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  force_id UUID NOT NULL REFERENCES public.forces(id) ON DELETE RESTRICT,
  entry_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'INITIAL',
  description TEXT,
  version INT NOT NULL DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (entry_course_id, name, version)
);

CREATE INDEX IF NOT EXISTS idx_pattern_templates_course ON public.test_pattern_templates(entry_course_id);
CREATE INDEX IF NOT EXISTS idx_pattern_templates_force ON public.test_pattern_templates(force_id);

CREATE TRIGGER trg_test_pattern_templates_updated_at
  BEFORE UPDATE ON public.test_pattern_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. TEST PATTERN SECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_pattern_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.test_pattern_templates(id) ON DELETE CASCADE,
  section_code TEXT NOT NULL,
  section_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 1,
  default_enabled BOOLEAN NOT NULL DEFAULT true,
  default_question_count INT NOT NULL DEFAULT 30 CHECK (default_question_count > 0),
  min_question_count INT NOT NULL DEFAULT 5 CHECK (min_question_count > 0),
  max_question_count INT NOT NULL DEFAULT 150 CHECK (max_question_count >= min_question_count),
  default_duration_minutes INT NOT NULL DEFAULT 30 CHECK (default_duration_minutes > 0),
  min_duration_minutes INT NOT NULL DEFAULT 5 CHECK (min_duration_minutes > 0),
  max_duration_minutes INT NOT NULL DEFAULT 120 CHECK (max_duration_minutes >= min_duration_minutes),
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  teacher_can_disable BOOLEAN NOT NULL DEFAULT true,
  teacher_can_override_question_count BOOLEAN NOT NULL DEFAULT true,
  teacher_can_override_duration BOOLEAN NOT NULL DEFAULT true,
  teacher_can_reorder BOOLEAN NOT NULL DEFAULT true,
  question_type TEXT NOT NULL DEFAULT 'MCQ_SINGLE',
  section_type TEXT NOT NULL DEFAULT 'STANDARD',
  passing_percentage INT NOT NULL DEFAULT 50 CHECK (passing_percentage BETWEEN 1 AND 100),
  negative_marking BOOLEAN NOT NULL DEFAULT false,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_pattern_sections_template ON public.test_pattern_sections(template_id);

CREATE TRIGGER trg_test_pattern_sections_updated_at
  BEFORE UPDATE ON public.test_pattern_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. TEST PATTERN SECTION SUBJECTS (Many-to-Many Pivot)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_pattern_section_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_section_id UUID NOT NULL REFERENCES public.test_pattern_sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_question_distribution INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (pattern_section_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_sec_subj_sec ON public.test_pattern_section_subjects(pattern_section_id);

-- ----------------------------------------------------------------------------
-- 5. ACTUAL TEST SECTION SUBJECTS MAPPING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_section_subjects (
  test_section_id UUID NOT NULL REFERENCES public.test_sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (test_section_id, subject_id)
);

-- ----------------------------------------------------------------------------
-- 6. EXTEND TESTS AND TEST_SECTIONS WITH TEMPLATE SNAPSHOT FIELDS
-- ----------------------------------------------------------------------------
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.test_pattern_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version INT,
  ADD COLUMN IF NOT EXISTS test_type TEXT NOT NULL DEFAULT 'FULL';

ALTER TABLE public.test_sections
  ADD COLUMN IF NOT EXISTS source_template_section_id UUID REFERENCES public.test_pattern_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_code TEXT,
  ADD COLUMN IF NOT EXISTS passing_percentage INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- 7. RLS SECURITY POLICIES: ADMIN-ONLY TEST CREATION & MANAGEMENT
-- ----------------------------------------------------------------------------
ALTER TABLE public.test_pattern_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_pattern_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_pattern_section_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_section_subjects ENABLE ROW LEVEL SECURITY;

-- Pattern Templates: Admin full CRUD, Teacher SELECT
DROP POLICY IF EXISTS "templates_admin_full" ON public.test_pattern_templates;
CREATE POLICY "templates_admin_full"
  ON public.test_pattern_templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "templates_teacher_read" ON public.test_pattern_templates;
CREATE POLICY "templates_teacher_read"
  ON public.test_pattern_templates FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- Pattern Sections: Admin full CRUD, Teacher SELECT
DROP POLICY IF EXISTS "pattern_sections_admin_full" ON public.test_pattern_sections;
CREATE POLICY "pattern_sections_admin_full"
  ON public.test_pattern_sections FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pattern_sections_teacher_read" ON public.test_pattern_sections;
CREATE POLICY "pattern_sections_teacher_read"
  ON public.test_pattern_sections FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- Pattern Section Subjects: Admin full CRUD, Teacher SELECT
DROP POLICY IF EXISTS "pattern_sec_subj_admin_full" ON public.test_pattern_section_subjects;
CREATE POLICY "pattern_sec_subj_admin_full"
  ON public.test_pattern_section_subjects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pattern_sec_subj_teacher_read" ON public.test_pattern_section_subjects;
CREATE POLICY "pattern_sec_subj_teacher_read"
  ON public.test_pattern_section_subjects FOR SELECT
  TO authenticated
  USING (public.is_teacher());

-- Test Section Subjects: Staff access
DROP POLICY IF EXISTS "test_sec_subj_staff_access" ON public.test_section_subjects;
CREATE POLICY "test_sec_subj_staff_access"
  ON public.test_section_subjects FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ENFORCE: Only ADMIN can insert, update, or delete actual tests (per institutional requirement)
DROP POLICY IF EXISTS "tests_staff_insert" ON public.tests;
CREATE POLICY "tests_staff_insert"
  ON public.tests FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "tests_staff_update" ON public.tests;
CREATE POLICY "tests_staff_update"
  ON public.tests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Ensure Admin can inspect all results records
DROP POLICY IF EXISTS "test_attempts_admin_all" ON public.test_attempts;
CREATE POLICY "test_attempts_admin_all"
  ON public.test_attempts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. SEED ACADEMY DEFAULT TEST PATTERNS FOR ALL 18 ENTRIES
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_army_id UUID := '10000000-0000-0000-0000-000000000001';
  v_paf_id UUID := '10000000-0000-0000-0000-000000000002';
  v_navy_id UUID := '10000000-0000-0000-0000-000000000003';

  v_sub_verbal UUID := '30000000-0000-0000-0000-000000000001';
  v_sub_nonverbal UUID := '30000000-0000-0000-0000-000000000002';
  v_sub_physics UUID := '30000000-0000-0000-0000-000000000003';
  v_sub_math UUID := '30000000-0000-0000-0000-000000000004';
  v_sub_english UUID := '30000000-0000-0000-0000-000000000005';
  v_sub_chemistry UUID := '30000000-0000-0000-0000-000000000006';
  v_sub_biology UUID := '30000000-0000-0000-0000-000000000007';
  v_sub_gk UUID := '30000000-0000-0000-0000-000000000008';
  v_sub_pakstudy UUID := '30000000-0000-0000-0000-000000000009';
  v_sub_islamiat UUID := '30000000-0000-0000-0000-000000000010';

  v_tpl_id UUID;
  v_sec_id UUID;
BEGIN
  -- Ensure forces exist
  INSERT INTO public.forces (id, code, name, description, motto, headquarters, sort_order)
  VALUES
    (v_army_id, 'PAKISTAN_ARMY', 'Pakistan Army', 'Primary land warfare branch of the Pakistan Armed Forces.', 'Iman, Taqwa, Jihad fi Sabilillah', 'General Headquarters (GHQ), Rawalpindi', 1),
    (v_paf_id, 'PAKISTAN_AIR_FORCE', 'Pakistan Air Force', 'Aerial warfare and air defence branch of the Pakistan Armed Forces.', 'Sehraast ke Daryaast Tah-e-Bal-o-Par-e-Maast', 'Air Headquarters (AHQ), Islamabad', 2),
    (v_navy_id, 'PAKISTAN_NAVY', 'Pakistan Navy', 'Naval warfare and coastal defence branch of the Pakistan Armed Forces.', 'Himmat-e-Mardan, Madad-e-Khuda', 'Naval Headquarters (NHQ), Islamabad', 3)
  ON CONFLICT (code) DO NOTHING;

  -- Ensure courses exist
  INSERT INTO public.courses (id, force_id, code, name, description, duration_weeks, sort_order)
  VALUES
    ('20000000-0000-0000-0000-000000000001', v_army_id, 'PMA_LONG_COURSE', 'PMA Long Course (154 LC)', 'Regular Commission officer cadet training at PMA Kakul.', 104, 1),
    ('20000000-0000-0000-0000-000000000002', v_paf_id, 'GDP', 'General Duty Pilot (GDP 158)', 'Commissioned pilot training at PAF Academy Asghar Khan.', 156, 2),
    ('20000000-0000-0000-0000-000000000003', v_navy_id, 'PN_CADET', 'PN Cadet Term 2026-A', 'Executive and technical officer cadet training at PNA Manora.', 104, 3),
    ('20000000-0000-0000-0000-000000000004', v_army_id, 'TCC', 'Technical Cadet Course (TCC 36)', 'Engineering corps commission via NUST military colleges.', 208, 4),
    ('20000000-0000-0000-0000-000000000005', v_paf_id, 'CAE', 'College of Aeronautical Engineering (CAE 102)', 'Aerospace and avionics engineering commission at CAE Risalpur.', 208, 5),
    ('20000000-0000-0000-0000-000000000006', v_army_id, 'LCC', 'Lady Cadet Course (LCC 24)', 'Direct short service commission for female graduates at PMA Kakul.', 26, 6),
    ('20000000-0000-0000-0000-000000000007', v_army_id, 'AFNS', 'Armed Forces Nursing Services (AFNS 2026)', 'BSc Nursing training at AFPGMI Rawalpindi and CMH institutions.', 208, 7)
  ON CONFLICT (code) DO NOTHING;

  -- Ensure subjects exist
  INSERT INTO public.subjects (id, code, name, category, default_time_per_question_sec, sort_order)
  VALUES
    (v_sub_verbal, 'INTELLIGENCE_VERBAL', 'Verbal Intelligence', 'INTELLIGENCE', 35, 1),
    (v_sub_nonverbal, 'INTELLIGENCE_NON_VERBAL', 'Non-Verbal Intelligence', 'INTELLIGENCE', 40, 2),
    (v_sub_physics, 'ACADEMIC_PHYSICS', 'Physics', 'ACADEMIC', 50, 3),
    (v_sub_math, 'ACADEMIC_MATH', 'Mathematics', 'ACADEMIC', 55, 4),
    (v_sub_english, 'ACADEMIC_ENGLISH', 'English', 'ACADEMIC', 30, 5),
    (v_sub_chemistry, 'ACADEMIC_CHEMISTRY', 'Chemistry', 'ACADEMIC', 45, 6),
    (v_sub_biology, 'ACADEMIC_BIOLOGY', 'Biology', 'ACADEMIC', 40, 7),
    (v_sub_gk, 'GENERAL_KNOWLEDGE', 'General Knowledge', 'ACADEMIC', 30, 8),
    (v_sub_pakstudy, 'PAKISTAN_STUDIES', 'Pakistan Studies', 'ACADEMIC', 30, 9),
    (v_sub_islamiat, 'ISLAMIAT', 'Islamiat & Ethics', 'ACADEMIC', 30, 10)
  ON CONFLICT (code) DO NOTHING;

  -- ==========================================================================
  -- 1. PAKISTAN ARMY PATTERNS
  -- ==========================================================================

  -- PMA Long Course
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000001', v_army_id, '20000000-0000-0000-0000-000000000001', 'PMA Long Course Screening Pattern', 'INITIAL', 'Academy Default Pattern for PMA Regular Commission Initial CBT.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000001', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000002', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000003', v_tpl_id, 'ACADEMIC', 'Academic Evaluation', 3, true, 50, 15, 60, 30, 15, 45, false, true, true, true)
  ON CONFLICT DO NOTHING;

  -- Map Academic subjects for PMA
  INSERT INTO public.test_pattern_section_subjects (pattern_section_id, subject_id, is_default)
  VALUES
    ('60000000-0000-0000-0000-000000000003', v_sub_english, true),
    ('60000000-0000-0000-0000-000000000003', v_sub_math, true),
    ('60000000-0000-0000-0000-000000000003', v_sub_pakstudy, true),
    ('60000000-0000-0000-0000-000000000003', v_sub_islamiat, true),
    ('60000000-0000-0000-0000-000000000003', v_sub_gk, true)
  ON CONFLICT DO NOTHING;

  -- Technical Cadet Course (TCC)
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000002', v_army_id, '20000000-0000-0000-0000-000000000004', 'TCC Engineering Screening Pattern', 'INITIAL', 'Academy Default Pattern for Technical Cadet Course.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000004', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000005', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000006', v_tpl_id, 'ACADEMIC', 'Academic (Pre-Engineering)', 3, true, 50, 15, 60, 30, 15, 45, false, true, true, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.test_pattern_section_subjects (pattern_section_id, subject_id, is_default)
  VALUES
    ('60000000-0000-0000-0000-000000000006', v_sub_math, true),
    ('60000000-0000-0000-0000-000000000006', v_sub_physics, true),
    ('60000000-0000-0000-0000-000000000006', v_sub_english, true)
  ON CONFLICT DO NOTHING;

  -- Lady Cadet Course (LCC)
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000003', v_army_id, '20000000-0000-0000-0000-000000000006', 'LCC Screening Pattern', 'INITIAL', 'Academy Default Pattern for Lady Cadet Course.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000007', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000008', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000009', v_tpl_id, 'ACADEMIC', 'General Academic & English', 3, true, 40, 10, 50, 25, 10, 35, false, true, true, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.test_pattern_section_subjects (pattern_section_id, subject_id, is_default)
  VALUES
    ('60000000-0000-0000-0000-000000000009', v_sub_english, true),
    ('60000000-0000-0000-0000-000000000009', v_sub_gk, true)
  ON CONFLICT DO NOTHING;

  -- Armed Forces Nursing Services (AFNS)
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000004', v_army_id, '20000000-0000-0000-0000-000000000007', 'AFNS Nursing Screening Pattern', 'INITIAL', 'Academy Default Pattern for Armed Forces Nursing Services.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000010', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000011', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000012', v_tpl_id, 'ACADEMIC', 'Academic (Pre-Medical Science)', 3, true, 50, 15, 60, 30, 15, 45, false, true, true, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.test_pattern_section_subjects (pattern_section_id, subject_id, is_default)
  VALUES
    ('60000000-0000-0000-0000-000000000012', v_sub_biology, true),
    ('60000000-0000-0000-0000-000000000012', v_sub_chemistry, true),
    ('60000000-0000-0000-0000-000000000012', v_sub_physics, true),
    ('60000000-0000-0000-0000-000000000012', v_sub_english, true)
  ON CONFLICT DO NOTHING;

  -- ==========================================================================
  -- 2. PAKISTAN AIR FORCE PATTERNS
  -- ==========================================================================

  -- General Duty Pilot (GDP)
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000005', v_paf_id, '20000000-0000-0000-0000-000000000002', 'GD Pilot Screening Pattern', 'INITIAL', 'Academy Default Pattern for PAF General Duty Pilot Screening.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000013', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000014', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000015', v_tpl_id, 'PHYSICS', 'Physics', 3, true, 40, 10, 50, 25, 10, 40, false, true, true, true),
    ('60000000-0000-0000-0000-000000000016', v_tpl_id, 'ENGLISH', 'English', 4, true, 40, 10, 50, 25, 10, 40, false, true, true, true)
  ON CONFLICT DO NOTHING;

  -- College of Aeronautical Engineering (CAE)
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000006', v_paf_id, '20000000-0000-0000-0000-000000000005', 'CAE Engineering Pattern', 'INITIAL', 'Academy Default Pattern for Aeronautical Engineering.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000017', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000018', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000019', v_tpl_id, 'PHYSICS', 'Physics', 3, true, 30, 10, 40, 25, 10, 35, false, true, true, true),
    ('60000000-0000-0000-0000-000000000020', v_tpl_id, 'MATH', 'Mathematics', 4, true, 30, 10, 40, 25, 10, 35, false, true, true, true),
    ('60000000-0000-0000-0000-000000000021', v_tpl_id, 'ENGLISH', 'English', 5, true, 30, 10, 40, 20, 10, 30, false, true, true, true)
  ON CONFLICT DO NOTHING;

  -- ==========================================================================
  -- 3. PAKISTAN NAVY PATTERNS
  -- ==========================================================================

  -- PN Cadet
  INSERT INTO public.test_pattern_templates (id, force_id, entry_course_id, name, stage, description, version, is_default)
  VALUES ('50000000-0000-0000-0000-000000000007', v_navy_id, '20000000-0000-0000-0000-000000000003', 'PN Cadet Entrance Pattern', 'INITIAL', 'Academy Default Pattern for PN Cadet Officer Induction.', 1, true)
  ON CONFLICT (entry_course_id, name, version) DO UPDATE SET is_default = true
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.test_pattern_sections (id, template_id, section_code, section_name, display_order, default_enabled, default_question_count, min_question_count, max_question_count, default_duration_minutes, min_duration_minutes, max_duration_minutes, is_mandatory, teacher_can_disable, teacher_can_override_question_count, teacher_can_override_duration)
  VALUES
    ('60000000-0000-0000-0000-000000000022', v_tpl_id, 'VERBAL', 'Verbal Intelligence', 1, true, 84, 20, 100, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000023', v_tpl_id, 'NON_VERBAL', 'Non-Verbal Intelligence', 2, true, 64, 20, 90, 30, 15, 45, false, true, true, true),
    ('60000000-0000-0000-0000-000000000024', v_tpl_id, 'ACADEMIC', 'Academic Evaluation', 3, true, 50, 15, 60, 35, 15, 50, false, true, true, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.test_pattern_section_subjects (pattern_section_id, subject_id, is_default)
  VALUES
    ('60000000-0000-0000-0000-000000000024', v_sub_physics, true),
    ('60000000-0000-0000-0000-000000000024', v_sub_math, true),
    ('60000000-0000-0000-0000-000000000024', v_sub_english, true),
    ('60000000-0000-0000-0000-000000000024', v_sub_gk, true)
  ON CONFLICT DO NOTHING;

END $$;
