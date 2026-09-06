-- ============================================================================
-- Migration: 20260906000002_rls_policies.sql
-- Description: Declarative Deny-by-Default Row Level Security (RLS) Policies
-- Author: BACKEND-AGENT-1 / Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_courses ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- Users can view own profile; Admins view all; Teachers can view students
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (public.is_teacher() AND role = 'STUDENT')
  );

-- Admins can insert; self-insert permitted during auth trigger
CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR id = auth.uid()
  );

-- Users can update non-role fields of their own profile; Admins can update all
CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) -- Prevents role elevation
    )
  );

CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. FORCES, COURSES, SUBJECTS (Catalog data)
-- ----------------------------------------------------------------------------
CREATE POLICY "forces_select_policy"
  ON public.forces FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forces_admin_write"
  ON public.forces FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "courses_select_policy"
  ON public.courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "courses_admin_write"
  ON public.courses FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "subjects_select_policy"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subjects_admin_write"
  ON public.subjects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "course_subjects_select_policy"
  ON public.course_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "course_subjects_admin_write"
  ON public.course_subjects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. BATCHES & ENROLLMENTS
-- ----------------------------------------------------------------------------
CREATE POLICY "batches_select_policy"
  ON public.batches FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.batch_enrollments be
      JOIN public.students s ON s.id = be.student_id
      WHERE be.batch_id = batches.id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "batches_write_policy"
  ON public.batches FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "batch_enrollments_select_policy"
  ON public.batch_enrollments FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = batch_enrollments.student_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "batch_enrollments_write_policy"
  ON public.batch_enrollments FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 5. TEACHERS & SPECIALIZATIONS
-- ----------------------------------------------------------------------------
CREATE POLICY "teachers_select_policy"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teachers_write_policy"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.is_admin() OR (profile_id = auth.uid()))
  WITH CHECK (public.is_admin());

CREATE POLICY "teacher_subjects_select_policy"
  ON public.teacher_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "teacher_subjects_write_policy"
  ON public.teacher_subjects FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. STUDENTS
-- ----------------------------------------------------------------------------
CREATE POLICY "students_select_policy"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR profile_id = auth.uid()
  );

CREATE POLICY "students_write_policy"
  ON public.students FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- ----------------------------------------------------------------------------
-- 7. QUESTIONS & OPTIONS (CRITICAL SECURITY ISOLATION)
-- ----------------------------------------------------------------------------
-- Direct query on questions: Teachers and Admins only
CREATE POLICY "questions_staff_policy"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

-- Direct query on options: Teachers and Admins only!
-- Students are DENIED direct access; questions for active exams are served
-- through trusted RPC which strips 'is_correct' and 'explanation'
CREATE POLICY "question_options_staff_policy"
  ON public.question_options FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());

CREATE POLICY "question_courses_staff_policy"
  ON public.question_courses FOR ALL
  TO authenticated
  USING (public.is_admin() OR public.is_teacher())
  WITH CHECK (public.is_admin() OR public.is_teacher());
