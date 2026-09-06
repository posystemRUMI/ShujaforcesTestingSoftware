# Forces Academy Computerized Testing Software — Auth & Row Level Security (RLS) Blueprint

## 1. Security Principles & Threat Model

The platform operates in high-stakes military exam environments. The primary security objective is preventing unauthorized answer leakage, privilege escalation, and exam tampering:

1. **Deny-By-Default:** Every table has Row Level Security enabled.
2. **Role Integrity:** Student candidates can never elevate their own role or modify other candidates' records.
3. **Question Answer Secrecy:** Raw correct answers (`is_correct` in `public.question_options`) and explanations must never be queryable by candidates prior to official submission and score finalization.
4. **Audit Immutability:** Audit logs are append-only.

---

## 2. Helper Functions (SECURITY DEFINER)

All helper functions run with `SECURITY DEFINER` and set explicit `search_path = public`:

```sql
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
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
```

---

## 3. Detailed Table RLS Policies Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | Own profile OR Admin OR Teacher (if Student) | Admin OR Auth Trigger | Own profile (non-role fields) OR Admin | Admin |
| **`forces`** | Authenticated | Admin | Admin | Admin |
| **`courses`** | Authenticated | Admin | Admin | Admin |
| **`subjects`** | Authenticated | Admin | Admin | Admin |
| **`course_subjects`**| Authenticated | Admin | Admin | Admin |
| **`batches`** | Admin OR Teacher OR Student (Enrolled) | Admin OR Teacher | Admin OR Teacher | Admin |
| **`batch_enrollments`**| Admin OR Teacher OR Student (Own) | Admin OR Teacher | Admin OR Teacher | Admin |
| **`teachers`** | Authenticated | Admin | Admin OR Own record | Admin |
| **`teacher_subjects`**| Authenticated | Admin | Admin | Admin |
| **`students`** | Admin OR Teacher OR Student (Own docket) | Admin OR Teacher | Admin OR Teacher | Admin |
| **`questions`** | Admin OR Teacher | Admin OR Teacher | Admin OR Teacher | Admin |
| **`question_options`**| Admin OR Teacher | Admin OR Teacher | Admin OR Teacher | Admin |
| **`question_courses`**| Admin OR Teacher | Admin OR Teacher | Admin OR Teacher | Admin |
| **`audit_logs`** | Admin only | Service / RPC only | **FORBIDDEN** | **FORBIDDEN** |

---

## 4. Student Active Exam Safe Question Interface

To prevent active candidates from reading `question_options.is_correct` via Supabase REST queries:
- Direct `SELECT` on `public.question_options` is granted **only to `is_admin() OR is_teacher()`**.
- For examinees taking active tests, a trusted RPC procedure `public.get_student_exam_questions(p_test_id UUID)` or safe database view is used, strictly excluding `is_correct` and `explanation`.
