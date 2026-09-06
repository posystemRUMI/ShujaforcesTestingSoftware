# BACKEND-HANDOFF-001: FOUNDATION TO ASSESSMENT RUNTIME HANDOFF

**Project:** Forces Academy Computerized Testing Software  
**Handoff ID:** BACKEND-HANDOFF-001  
**From:** BACKEND-AGENT-1 (Antigravity)  
**To:** BACKEND-AGENT-2 (Claude)  
**Date:** 2026-09-06  
**Status:** COMPLETED & VERIFIED  
**Scope Delivered:** Phases B0 through B12  
**Target Scope for Claude:** Phases B13 through B28 (Assessment Runtime, Scoring Engine, Retake Workflow, Realtime Monitoring)  

---

## 1. Executive Summary

`BACKEND-AGENT-1` has completed the entire backend foundation infrastructure for the Forces Academy Computerized Testing Software. This delivers a robust, air-gappable Supabase PostgreSQL platform enforcing strict role-based access control (RBAC), multi-tenant isolation across military branches, tamper-resistant audit logging, deterministic seed data, enterprise-grade storage buckets, and TypeScript type safety.

All frontend compilation constraints have been strictly satisfied:
- **TypeScript Errors:** `0` (`npx tsc --noEmit` PASS)
- **Production Build:** `PASS` (`npm run build` PASS)
- **Frontend Freeze:** The approved frontend UI components, routes, and styling remain 100% frozen and intact.

---

## 2. Migration Sequence & Applied Database Objects

The database migrations are located in `supabase/migrations/` and must be executed in order:

| File | Applied Phase | Description | Key Objects Created |
|------|---------------|-------------|---------------------|
| `20260906000001_core_schema.sql` | B1, B2, B3, B4 | Core schema, enums, triggers, multi-branch tables, question bank | `app_role`, `question_difficulty`, `question_status`, `subject_category`, `batch_status`, `student_status`, `teacher_status`<br>`profiles`, `forces`, `courses`, `subjects`, `course_subjects`, `batches`, `teachers`, `teacher_subjects`, `students`, `batch_enrollments`, `questions`, `question_options`, `question_courses`<br>`current_app_role()`, `is_admin()`, `is_teacher()`, `is_student()`, `enforce_single_correct_option()` trigger |
| `20260906000002_rls_policies.sql` | B6 | Row Level Security (RLS) policies | Deny-by-default on all 12 tables. Dynamic branch isolation for teachers, read policies for students, full admin bypass. `question_options` table explicitly denies student direct SELECT (`false`) |
| `20260906000003_storage_setup.sql` | B5 | Supabase Storage buckets & policies | Buckets: `question-media` (public, 5MB), `profile-images` (public, 2MB), `academy-assets` (public, 10MB), `import-files` (private, 20MB). RLS on `storage.objects` for admin/teacher upload |
| `20260906000004_crud_rpc_audit.sql` | B7, B8 | Compound RPC functions & Append-only Audit Log | `audit_logs` table (read-only except insert), `log_audit_event()`, `admin_create_student()`, `admin_create_teacher()`, `admin_upsert_question()`, `get_safe_exam_questions()` |

---

## 3. Seed Data Specification (`supabase/seed.sql`)

Deterministic, stable UUIDs are established to allow seamless testing and foreign key linking:

### 3.1 Forces (`forces`)
- **Pakistan Army:** `10000000-0000-0000-0000-000000000001` (`PAKISTAN_ARMY`)
- **Pakistan Air Force:** `10000000-0000-0000-0000-000000000002` (`PAKISTAN_AIR_FORCE`)
- **Pakistan Navy:** `10000000-0000-0000-0000-000000000003` (`PAKISTAN_NAVY`)

### 3.2 Flagship Courses (`courses`)
- **154 PMA Long Course (Army):** `20000000-0000-0000-0000-000000000001`
- **158 GDP / CAE (PAF):** `20000000-0000-0000-0000-000000000002`
- **PN Cadet 2026-A (Navy):** `20000000-0000-0000-0000-000000000003`

### 3.3 Subjects (`subjects`)
- **Intelligence Verbal:** `30000000-0000-0000-0000-000000000001` (`INTELLIGENCE_VERBAL`)
- **Intelligence Non-Verbal:** `30000000-0000-0000-0000-000000000002` (`INTELLIGENCE_NON_VERBAL`)
- **Academic - Physics:** `30000000-0000-0000-0000-000000000003` (`ACADEMIC_PHYSICS`)
- **Academic - Mathematics:** `30000000-0000-0000-0000-000000000004` (`ACADEMIC_MATHEMATICS`)
- **Academic - English:** `30000000-0000-0000-0000-000000000005` (`ACADEMIC_ENGLISH`)

### 3.4 Batches (`batches`)
- **Batch 154-PMA-LC:** `40000000-0000-0000-0000-000000000001`
- **Batch 158-GDP-PAF:** `40000000-0000-0000-0000-000000000002`
- **Batch PNC-2026-A:** `40000000-0000-0000-0000-000000000003`

### 3.5 Seed Questions
Six verified questions (`50000000-0000-0000-0000-000000000001` through `50000000-0000-0000-0000-000000000006`) are pre-loaded across Verbal, Non-Verbal, and Physics, each with 4 options and strict single-correct-answer verification.

---

## 4. Security Architecture & Secrets Management

### 4.1 Zero-Trust Candidate Option Secrecy (P0 Constraint)
To prevent candidates from opening browser DevTools / Network tab and inspecting `is_correct` flags:
1. **Direct SELECT on `question_options` is DENIED for STUDENTS:**
   ```sql
   CREATE POLICY "question_options_student_deny" ON public.question_options
     FOR SELECT USING (NOT public.is_student());
   ```
2. **Safe Exam Question RPC (`get_safe_exam_questions`):**
   When Claude builds the candidate exam delivery interface in Phase B14:
   ```sql
   SELECT * FROM public.get_safe_exam_questions(ARRAY['50000000-0000-0000-0000-000000000001'::uuid]);
   ```
   This RPC returns JSON options **explicitly excluding** `is_correct` and `explanation`. It only exposes `option_key`, `label`, `text`, and `image_url`.

### 4.2 Append-Only Audit Trail
The `audit_logs` table disallows `UPDATE` and `DELETE` for all roles including administrators. Every security-critical action (user creation, question authoring, grade alterations) invokes `log_audit_event()`.

---

## 5. Generated Types & Frontend Integration Service Layer

The frontend codebase is fully wired with fallback-safe TypeScript services:
- **Database Types:** `src/types/database.types.ts`
- **Supabase Client:** `src/lib/supabaseClient.ts` (auto-detects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, falls back gracefully to in-memory mock stores if credentials are absent or unconfigured).
- **Service Modules:**
  - `src/services/authService.ts`: Profile retrieval, login, logout.
  - `src/services/studentService.ts`: Cadets listing, RPC student onboarding.
  - `src/services/teacherService.ts`: Faculty listing, RPC faculty creation.
  - `src/services/batchService.ts`: Batch creation and listing.
  - `src/services/configurationService.ts`: Forces, courses, subjects retrieval.
  - `src/services/questionService.ts`: Question bank listing, compound upsert RPC.

---

## 6. Contract & Architecture for Claude (Phases B13–B28)

Claude is responsible for building the **Assessment Engine, Exam Sessions, Realtime Telemetry, Scoring, and Retake Protocols**. Below are the architectural requirements and table contracts expected by the foundation:

### 6.1 Expected Tables to be Created by Claude (Phase B13)
Claude should create migration `20260906000005_assessment_schema.sql` containing:
1. `exams`: Exam configurations (`course_id`, `title`, `duration_minutes`, `passing_percentage`, `status`).
2. `exam_sections`: Sections within an exam (`exam_id`, `subject_id`, `sort_order`, `question_count`, `time_limit_seconds`, `is_time_locked`).
3. `exam_questions`: Mapping of questions to exams/sections (`exam_section_id`, `question_id`, `marks`, `negative_marks`).
4. `student_exams`: Candidate exam sessions (`student_id`, `exam_id`, `status: IN_PROGRESS | COMPLETED | EXPIRED | TERMINATED`, `started_at`, `submitted_at`, `total_score`, `passed`).
5. `student_exam_responses`: Candidate answers (`student_exam_id`, `question_id`, `selected_option_id`, `is_correct`, `time_spent_seconds`, `marked_for_review`).

### 6.2 Key Instructions for Claude
1. **Never Calculate Exam Scores Client-Side:**
   Implement a Postgres RPC `submit_exam_session(p_student_exam_id uuid)` with `SECURITY DEFINER` that grades candidate answers against `question_options.is_correct` server-side and locks the session timestamp.
2. **Preserve Deny-by-Default RLS:**
   Ensure candidates can only view their own `student_exams` and `student_exam_responses`.
3. **Use Supabase Realtime:**
   Set `REPLICA IDENTITY FULL` on `student_exams` and broadcast session status changes for the proctor live-monitoring screen.
4. **Preserve Frozen Frontend:**
   Do not modify existing frontend routing or layouts unless integrating the live assessment backend service hooks.

---

**Signed by BACKEND-AGENT-1 / Antigravity**  
*Verification: PASS (TypeScript 0 errors, Production Build 0 errors)*  
`BACKEND FOUNDATION READY FOR ASSESSMENT RUNTIME HANDOFF`
