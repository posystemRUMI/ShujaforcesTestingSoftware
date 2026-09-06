# Forces Academy Computerized Testing Software — Database Schema Reference

## 1. Schema Overview

The database is built on PostgreSQL 15 within Supabase. All primary entity tables utilize UUID v4 keys, foreign key constraints with explicit referential integrity actions, `TIMESTAMPTZ` audit timestamps, and column-level `CHECK` constraints.

---

## 2. Core Enumerations

```sql
-- Application User Roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- Question Difficulty Classification
CREATE TYPE public.question_difficulty AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- Question Status
CREATE TYPE public.question_status AS ENUM ('DRAFT', 'APPROVED', 'INACTIVE', 'ARCHIVED');

-- Subject Classification
CREATE TYPE public.subject_category AS ENUM ('INTELLIGENCE', 'ACADEMIC');

-- Batch Lifecycle Status
CREATE TYPE public.batch_status AS ENUM ('ACTIVE', 'UPCOMING', 'COMPLETED', 'ARCHIVED');

-- Student Roster Status
CREATE TYPE public.student_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DISQUALIFIED');

-- Teacher Active Status
CREATE TYPE public.teacher_status AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');
```

---

## 3. Entity Tables

### 3.1. `public.profiles`
Links directly 1:1 with `auth.users(id)`.
* `id`: `UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
* `role`: `app_role NOT NULL DEFAULT 'STUDENT'`
* `display_name`: `TEXT NOT NULL`
* `email`: `TEXT UNIQUE NOT NULL`
* `phone`: `TEXT`
* `avatar_url`: `TEXT`
* `status`: `TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))`
* `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
* `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.2. `public.forces`
Armed forces branches (Pakistan Army, Pakistan Air Force, Pakistan Navy).
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `code`: `TEXT UNIQUE NOT NULL` ('PAKISTAN_ARMY', 'PAKISTAN_AIR_FORCE', 'PAKISTAN_NAVY')
* `name`: `TEXT NOT NULL`
* `description`: `TEXT`
* `motto`: `TEXT`
* `headquarters`: `TEXT`
* `status`: `TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))`
* `sort_order`: `INT NOT NULL DEFAULT 0`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.3. `public.courses`
Commissioning programs (PMA Long Course, GDP, PN Cadet, TCC, CAE, LCC).
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `force_id`: `UUID NOT NULL REFERENCES public.forces(id) ON DELETE RESTRICT`
* `code`: `TEXT UNIQUE NOT NULL`
* `name`: `TEXT NOT NULL`
* `description`: `TEXT`
* `duration_weeks`: `INT NOT NULL DEFAULT 24`
* `eligibility_criteria`: `JSONB DEFAULT '{}'::jsonb`
* `status`: `TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))`
* `sort_order`: `INT NOT NULL DEFAULT 0`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.4. `public.subjects`
Academic and Intelligence test subjects.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `code`: `TEXT UNIQUE NOT NULL` ('INTELLIGENCE_VERBAL', 'INTELLIGENCE_NON_VERBAL', 'ACADEMIC_PHYSICS', 'ACADEMIC_MATH', etc.)
* `name`: `TEXT NOT NULL`
* `category`: `subject_category NOT NULL DEFAULT 'ACADEMIC'`
* `description`: `TEXT`
* `default_time_per_question_sec`: `INT NOT NULL DEFAULT 45`
* `status`: `TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))`
* `sort_order`: `INT NOT NULL DEFAULT 0`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.5. `public.course_subjects`
Pivot associating subjects with courses.
* `course_id`: `UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE`
* `subject_id`: `UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE`
* `is_mandatory`: `BOOLEAN NOT NULL DEFAULT true`
* `minimum_pass_percentage`: `INT NOT NULL DEFAULT 50`
* `PRIMARY KEY (course_id, subject_id)`

### 3.6. `public.batches`
Cadre and wing cohorts.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `code`: `TEXT UNIQUE NOT NULL` (e.g., '154-PMA-ALPHA')
* `name`: `TEXT NOT NULL`
* `course_id`: `UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT`
* `session_name`: `TEXT NOT NULL`
* `start_date`: `DATE NOT NULL`
* `end_date`: `DATE`
* `status`: `batch_status NOT NULL DEFAULT 'ACTIVE'`
* `max_cadets`: `INT NOT NULL DEFAULT 100`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.7. `public.teachers`
Faculty officers, invigilators, and board psychologists.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `profile_id`: `UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
* `service_number`: `TEXT UNIQUE NOT NULL`
* `rank`: `TEXT NOT NULL`
* `branch_code`: `TEXT NOT NULL REFERENCES public.forces(code) ON DELETE RESTRICT`
* `role_title`: `TEXT NOT NULL` ('CHIEF_PROCTOR', 'SENIOR_FACULTY', 'PSYCHOLOGIST', 'INVIGILATOR')
* `status`: `teacher_status NOT NULL DEFAULT 'ACTIVE'`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.8. `public.teacher_subjects`
Faculty subject assignments.
* `teacher_id`: `UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE`
* `subject_id`: `UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE`
* `PRIMARY KEY (teacher_id, subject_id)`

### 3.9. `public.students`
Candidate dockets.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `profile_id`: `UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`
* `roll_number`: `TEXT UNIQUE NOT NULL`
* `father_name`: `TEXT NOT NULL`
* `cnic`: `TEXT UNIQUE`
* `date_of_birth`: `DATE`
* `target_force_id`: `UUID NOT NULL REFERENCES public.forces(id) ON DELETE RESTRICT`
* `target_course_id`: `UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT`
* `status`: `student_status NOT NULL DEFAULT 'ACTIVE'`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.10. `public.batch_enrollments`
Cadet batch membership history.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `batch_id`: `UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT`
* `student_id`: `UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT`
* `enrolled_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
* `status`: `TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'TRANSFERRED', 'DROPPED'))`
* `notes`: `TEXT`
* `UNIQUE (batch_id, student_id)`

### 3.11. `public.questions`
Item repository for screening exams.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `code`: `TEXT UNIQUE NOT NULL` (e.g. 'INT-V-0101')
* `subject_id`: `UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT`
* `difficulty`: `question_difficulty NOT NULL DEFAULT 'MEDIUM'`
* `stem`: `TEXT NOT NULL`
* `stem_image_url`: `TEXT`
* `explanation`: `TEXT`
* `time_limit_seconds`: `INT NOT NULL DEFAULT 45`
* `status`: `question_status NOT NULL DEFAULT 'DRAFT'`
* `author_id`: `UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
* `tags`: `TEXT[] DEFAULT '{}'::text[]`
* `created_at`, `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`

### 3.12. `public.question_options`
Item choices A, B, C, D.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `question_id`: `UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE`
* `option_key`: `TEXT NOT NULL CHECK (option_key IN ('opt-a', 'opt-b', 'opt-c', 'opt-d', 'A', 'B', 'C', 'D'))`
* `label`: `TEXT NOT NULL CHECK (label IN ('A', 'B', 'C', 'D'))`
* `text`: `TEXT NOT NULL`
* `image_url`: `TEXT`
* `is_correct`: `BOOLEAN NOT NULL DEFAULT false`
* `sort_order`: `INT NOT NULL DEFAULT 0`
* `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
* `UNIQUE (question_id, label)`

### 3.13. `public.question_courses`
Pivot connecting questions to applicable courses.
* `question_id`: `UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE`
* `course_id`: `UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE`
* `PRIMARY KEY (question_id, course_id)`

### 3.14. `public.audit_logs`
Immutable security and operational event journal.
* `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
* `actor_id`: `UUID REFERENCES auth.users(id) ON DELETE SET NULL`
* `actor_role`: `TEXT NOT NULL`
* `action`: `TEXT NOT NULL`
* `entity_type`: `TEXT NOT NULL`
* `entity_id`: `TEXT`
* `metadata`: `JSONB DEFAULT '{}'::jsonb`
* `ip_address`: `TEXT`
* `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())`
