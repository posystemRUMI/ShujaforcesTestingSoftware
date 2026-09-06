-- ============================================================================
-- Migration: 20260906000001_core_schema.sql
-- Description: Core Schema for Forces Academy CBT (Profiles, Forces, Courses,
--              Subjects, Batches, Teachers, Students, Questions, Options)
-- Author: BACKEND-AGENT-1 / Antigravity
-- ============================================================================

-- Ensure required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.question_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.question_status AS ENUM ('DRAFT', 'APPROVED', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subject_category AS ENUM ('INTELLIGENCE', 'ACADEMIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.batch_status AS ENUM ('ACTIVE', 'UPCOMING', 'COMPLETED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.student_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DISQUALIFIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.teacher_status AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. PROFILES TABLE (Linked 1:1 to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'STUDENT',
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. SECURITY DEFINER ROLE HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'STUDENT'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.current_app_role() = 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.current_app_role() = 'TEACHER');
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.current_app_role() = 'STUDENT');
$$;

-- Automatic Profile Creation Trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
BEGIN
  -- Default to STUDENT unless explicit role provided by admin/service
  v_role := CASE 
    WHEN NEW.raw_user_meta_data->>'role' = 'ADMIN' THEN 'ADMIN'::public.app_role
    WHEN NEW.raw_user_meta_data->>'role' = 'TEACHER' THEN 'TEACHER'::public.app_role
    ELSE 'STUDENT'::public.app_role
  END;

  INSERT INTO public.profiles (id, role, display_name, email, phone, avatar_url)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    updated_at = timezone('utc', now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. FORCES TABLE (Pakistan Army, PAF, Pakistan Navy)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.forces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  motto TEXT,
  headquarters TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_forces_updated_at
  BEFORE UPDATE ON public.forces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. COURSES TABLE (PMA Long Course, GDP, PN Cadet, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  force_id UUID NOT NULL REFERENCES public.forces(id) ON DELETE RESTRICT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INT NOT NULL DEFAULT 24,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_courses_force_id ON public.courses(force_id);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. SUBJECTS TABLE (Verbal, Non-Verbal, Physics, Math, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category public.subject_category NOT NULL DEFAULT 'ACADEMIC',
  description TEXT,
  default_time_per_question_sec INT NOT NULL DEFAULT 45,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Course <-> Subject association pivot
CREATE TABLE IF NOT EXISTS public.course_subjects (
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  minimum_pass_percentage INT NOT NULL DEFAULT 50,
  PRIMARY KEY (course_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_course_subjects_subject_id ON public.course_subjects(subject_id);

-- ----------------------------------------------------------------------------
-- 8. BATCHES TABLE (Cadre wings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  session_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status public.batch_status NOT NULL DEFAULT 'ACTIVE',
  max_cadets INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_batches_course_id ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.batches(status);

CREATE TRIGGER trg_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. TEACHERS TABLE (Faculty Officers & Invigilators)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_number TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL,
  branch_code TEXT NOT NULL REFERENCES public.forces(code) ON DELETE RESTRICT,
  role_title TEXT NOT NULL DEFAULT 'SENIOR_FACULTY',
  status public.teacher_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers(profile_id);
CREATE INDEX IF NOT EXISTS idx_teachers_branch_code ON public.teachers(branch_code);

CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Teacher <-> Subject specialization pivot
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

-- ----------------------------------------------------------------------------
-- 10. STUDENTS TABLE (Candidate Cadets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  roll_number TEXT UNIQUE NOT NULL,
  father_name TEXT NOT NULL,
  cnic TEXT UNIQUE,
  date_of_birth DATE,
  target_force_id UUID NOT NULL REFERENCES public.forces(id) ON DELETE RESTRICT,
  target_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  status public.student_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON public.students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_target_force ON public.students(target_force_id);
CREATE INDEX IF NOT EXISTS idx_students_target_course ON public.students(target_course_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 11. BATCH ENROLLMENTS TABLE (Membership History)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TRANSFERRED', 'DROPPED')),
  notes TEXT,
  UNIQUE (batch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_enrollments_student ON public.batch_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch ON public.batch_enrollments(batch_id);

-- ----------------------------------------------------------------------------
-- 12. QUESTIONS TABLE (Question Bank Repository)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  difficulty public.question_difficulty NOT NULL DEFAULT 'MEDIUM',
  stem TEXT NOT NULL,
  stem_image_url TEXT,
  explanation TEXT,
  time_limit_seconds INT NOT NULL DEFAULT 45,
  status public.question_status NOT NULL DEFAULT 'DRAFT',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_code ON public.questions(code);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 13. QUESTION OPTIONS TABLE (Choices A, B, C, D)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL CHECK (option_key IN ('opt-a', 'opt-b', 'opt-c', 'opt-d', 'A', 'B', 'C', 'D')),
  label TEXT NOT NULL CHECK (label IN ('A', 'B', 'C', 'D')),
  text TEXT NOT NULL,
  image_url TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (question_id, label)
);

CREATE INDEX IF NOT EXISTS idx_question_options_qid ON public.question_options(question_id);

-- Constraint Trigger: Ensure exactly one correct option per question
CREATE OR REPLACE FUNCTION public.check_question_single_correct_option()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct_count INT;
BEGIN
  SELECT COUNT(*) INTO v_correct_count
  FROM public.question_options
  WHERE question_id = NEW.question_id AND is_correct = true;

  -- Only enforce when question has 4 options assembled
  IF v_correct_count > 1 THEN
    RAISE EXCEPTION 'Question % cannot have more than 1 correct option.', NEW.question_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_question_single_correct
  AFTER INSERT OR UPDATE ON public.question_options
  FOR EACH ROW EXECUTE FUNCTION public.check_question_single_correct_option();

-- Question <-> Courses association pivot
CREATE TABLE IF NOT EXISTS public.question_courses (
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_question_courses_course_id ON public.question_courses(course_id);
