# FORCES ACADEMY COMPUTERIZED TESTING SOFTWARE
# BACKEND AGENT 1 — ANTIGRAVITY
## Production Backend Platform, Database, Identity, Security & Infrastructure

Agent ID: BACKEND-AGENT-1
Agent Name: Antigravity
Role: Backend Platform / Data Model / Auth / RLS / Storage / Core CRUD / Audit

## 0. FRONTEND IS FROZEN

The frontend has already passed final acceptance.

DO NOT rebuild, redesign, restyle, restructure, or replace the frontend.

You may modify frontend code only when absolutely necessary to connect the real backend through existing service/repository boundaries. Any frontend modification must be minimal, documented in `/docs/TASKS.md`, and regression-tested.

Do not:
- change visual design;
- replace routes unnecessarily;
- rewrite AdminShell, StudentShell, ExamShell, or AuthShell;
- replace working shared UI components;
- introduce a new frontend state architecture;
- remove mock paths until their production replacements are verified.

The task now is to build the COMPLETE production backend.

---

# 1. LOCKED BACKEND PLATFORM

Use:
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- PostgreSQL functions / RPC
- Supabase Edge Functions only where trusted server orchestration or secret access is genuinely required

Deployment:
- Supabase managed backend
- Vercel frontend
- GitHub source control

Do NOT introduce Firebase, Appwrite, Laravel, Django, Express, NestJS, or a second database.

---

# 2. SHARED TWO-AGENT TEAM MODEL

AGENT-1 / Antigravity owns:
- backend foundation;
- identity;
- roles;
- profiles;
- students;
- teachers;
- batches;
- forces;
- courses;
- subjects;
- question bank core schema;
- question options;
- media/storage;
- RLS helpers;
- base RLS;
- secure CRUD;
- audit foundation;
- seed data;
- generated DB types;
- environment/backup documentation.

AGENT-2 / Claude owns:
- tests;
- test sections;
- question composition;
- publish/assignment;
- attempts;
- safe exam payload;
- server timing;
- autosave;
- submission;
- scoring;
- results;
- retakes;
- Realtime monitoring;
- analytics;
- final frontend production service integration.

DO NOT build Claude's assigned runtime/scoring work.

Both agents must use:
- ONE Supabase project;
- ONE migration history;
- ONE auth model;
- ONE schema philosophy;
- ONE RLS model;
- ONE `/docs/TASKS.md`;
- ONE generated database type source.

---

# 3. TASK TRACKING

Use the existing authoritative file:

`/docs/TASKS.md`

Add a top-level section:

`# PRODUCTION BACKEND IMPLEMENTATION`

Create phase records with:
- Owner
- Status
- Started
- Last Updated
- Dependencies
- Blocked By
- Migrations
- Tables
- Functions/RPC
- RLS Policies
- Storage
- Files Changed
- Validation
- Security Tests
- Known Issues
- Handoff Notes

Do not create competing task ledgers.

---

# 4. SECURITY PRINCIPLES

The browser is NEVER authoritative for:
- roles;
- permissions;
- correct answers;
- scoring;
- final results;
- attempt eligibility;
- test assignment eligibility;
- retake eligibility;
- exam start time;
- expiry time;
- section timing;
- randomization;
- final submission.

Never expose Supabase service-role credentials to the browser.

Correct answers must NEVER be available to an active student exam client before submission/reveal authorization.

Use database constraints + RLS + trusted RPC/Edge Functions, not frontend checks alone.

---

# 5. DATABASE STANDARDS

Use:
- UUID primary keys where appropriate;
- `created_at`, `updated_at`;
- foreign keys;
- explicit delete behavior;
- uniqueness constraints;
- check constraints;
- useful indexes;
- UTC timestamps;
- normalized relations;
- JSONB only where variable structured metadata genuinely belongs.

Avoid:
- duplicated truth;
- giant JSON blobs replacing relational models;
- browser-generated authoritative timestamps;
- mutable identifiers for attempts/results;
- editing already-applied migrations.

Applied migrations are immutable. Use corrective migrations.

---

# 6. BACKEND PHASE OWNERSHIP

You own:

B0 Backend Foundation  
B1 Supabase Auth, Profiles & Roles  
B2 Forces / Courses / Subjects  
B3 Students / Teachers / Batches / Enrollments  
B4 Question Bank / Options / Relationships  
B5 Supabase Storage Architecture  
B6 RLS Helper Functions & Base Policies  
B7 Secure Admin/Teacher CRUD  
B8 Audit Logging Foundation  
B9 Seed Data  
B10 Generated Types & Frontend Service Foundation  
B11 Environment / Backup / Recovery Documentation  
B12 Platform Security Validation & Claude Handoff

---

# B0 — BACKEND FOUNDATION

Inspect the repository first.

If Supabase is not initialized, establish:

```text
supabase/
├── config.toml
├── migrations/
├── seed.sql
├── functions/
└── tests/
```

Create/update:
- `/docs/BACKEND_ARCHITECTURE.md`
- `/docs/DATABASE_SCHEMA.md`
- `/docs/AUTH_RLS.md`

Do not overwrite frontend docs unnecessarily.

Document local commands:
- Supabase start
- reset
- migration
- seed
- type generation
- function serving/testing

Verify frontend still compiles before and after foundational integration changes.

---

# B1 — AUTH, PROFILES & ROLES

Use Supabase Auth as identity provider.

Create an application profile model linked to `auth.users`.

At minimum support:
- owner/admin
- teacher
- student

Model:
- profile id = auth user id where practical
- display name
- email
- phone
- avatar path
- role or normalized role membership
- status
- created_at
- updated_at

Do not rely solely on `user_metadata.role`.

Create secure role helper functions, such as:
- current_app_role()
- is_admin()
- is_teacher()
- is_student()

Use `SECURITY DEFINER` only where necessary and set safe `search_path`.

Define account provisioning strategy:
- admin creates teacher/student credentials; or
- trusted onboarding RPC/Edge Function.

Students must never elevate their own role.

---

# B2 — FORCES / COURSES / SUBJECTS

Create normalized tables for:

## Forces
Seed:
- Pakistan Army
- Pakistan Navy
- Pakistan Air Force

Fields:
- id
- code
- name
- description
- status
- sort_order
- timestamps

## Courses / Tracks
Associate with force.

Preserve frontend terminology and existing realistic mock values.

## Subjects
At minimum:
- English
- Mathematics
- Physics
- Chemistry
- Biology
- General Knowledge
- Pakistan Studies
- Islamiat
- Verbal Intelligence
- Non-Verbal Intelligence

Create pivots for course-subject relationships where needed.

Do not hard-code this hierarchy only in frontend constants.

---

# B3 — STUDENTS / TEACHERS / BATCHES

Create proper production tables.

## Students
Support:
- linked profile/auth user
- roll number
- father name
- phone
- CNIC/B-Form if required by current requirements
- status
- target force
- target course
- current enrollment
- timestamps

## Teachers
Support:
- linked profile/auth user
- role/scope
- status
- academic subject associations where required
- timestamps

## Batches
Support:
- code/name
- force/course
- session
- start/end
- status
- timestamps

## Enrollments / Membership
Prefer relational history-preserving membership.

Do not destroy previous batch/enrollment history when a student moves.

Create indexes for common filtering:
- roll number
- batch
- force
- course
- status

---

# B4 — QUESTION BANK CORE

Create production schema for question authoring.

## Questions
Support:
- subject
- type
- statement
- optional image path
- explanation/rationale
- status
- created_by
- timestamps

Types must support:
- text
- image
- combined
- non-verbal/image-based

## Question Options
Current product expects four options A/B/C/D.

Support:
- id
- question_id
- option key/position
- text
- optional image path
- canonical correctness representation

The raw authoring model may store correctness, BUT student active-exam policies must not expose it.

## Multi-force / Course Relevance
Use normalized pivots:
- question_forces
- question_courses
or an equivalent clean model.

## Status
Support:
- draft
- active
- inactive
- archived

Add constraints:
- exactly one correct option for normal MCQ;
- option belongs to question;
- four-option enforcement where required.

Do not implement active exam delivery here; Claude owns safe payload/runtime.

---

# B5 — SUPABASE STORAGE

Design buckets.

Primary:
- question-media

Potential:
- profile-images
- academy-assets
- import-files

For `question-media`, define canonical paths, e.g.:

```text
questions/{question_id}/stem/{uuid}.webp
questions/{question_id}/options/{option_id}/{uuid}.webp
```

Define:
- private/public decision;
- read permissions;
- upload permissions;
- delete permissions;
- allowed MIME types;
- sensible file size limits;
- naming convention.

Question media must not accidentally expose hidden answer metadata.

Use signed URLs/private bucket access where appropriate.

---

# B6 — RLS FOUNDATION

Enable RLS on all exposed application tables.

Default deny.

Create policies for:

## Student
May:
- read own profile;
- read own enrollment/basic assigned context when later exposed;
- read own permitted data.

May NOT:
- read another student;
- mutate own role;
- read raw teacher/admin-only data;
- read raw correct answers;
- create own assignment;
- approve own retake.

## Teacher
May:
- manage academic content allowed by role;
- read appropriate students/results later through defined scope;
- not modify owner/security records unless explicitly allowed.

## Admin
Broad management according to product requirements, still through RLS/trusted functions.

Test every table's:
- SELECT
- INSERT
- UPDATE
- DELETE

Avoid recursive policy patterns.

---

# B7 — SECURE CRUD

Implement real backend operations for:
- profiles
- students
- teachers
- batches
- forces
- courses
- subjects
- questions
- options
- relationships

Direct Supabase CRUD is acceptable where RLS + constraints are sufficient.

Use RPC for compound transactional actions such as:
- create student + auth/profile/domain record + enrollment;
- create teacher + auth/profile/domain record;
- create/update question + four options;
- bulk import validation/commit if implemented.

Do not trust frontend-only Zod validation. Enforce server/database constraints too.

---

# B8 — AUDIT LOGGING FOUNDATION

Create audit log model.

Suggested fields:
- id
- actor_user_id
- actor_role
- action
- entity_type
- entity_id
- metadata JSONB
- request/correlation id if practical
- created_at

Create protected audit writer function.

Students must not alter logs.

Claude will reuse audit logging for:
- test publish
- assignment
- attempt start
- force submit
- submission
- retake approval
- result changes.

Document audit function contract in `/docs/BACKEND_ARCHITECTURE.md`.

Do not log passwords, secrets, tokens, or unnecessary sensitive answer payloads.

---

# B9 — SEED DATA

Create deterministic development seed data.

Include:
- owner/admin
- teachers
- students
- Army/Navy/Air Force
- courses
- subjects
- batches
- enrollments
- question bank
- non-verbal/image question metadata
- four options per question

Coordinate stable IDs so Claude can seed tests/assignments/attempts against them.

Use realistic Pakistani academy naming.

Do not include actual secrets/passwords in production docs.

---

# B10 — GENERATED TYPES & SERVICE FOUNDATION

Generate canonical Supabase TypeScript database types.

Keep ONE generated type source.

Create/extend clean frontend backend adapters:
- authService
- studentService
- teacherService
- batchService
- configurationService
- questionService

Pattern:

```text
UI
→ existing feature service/repository
→ Supabase client/RPC
```

Do not scatter Supabase queries directly across JSX pages.

Preserve the frozen UI contracts.

During integration, allow mock-vs-production adapter switching only temporarily and document it.

Do not remove a mock service until the production path is verified.

---

# B11 — ENVIRONMENT / BACKUP / RECOVERY

Document:

Frontend-safe environment:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Server-only:
- SUPABASE_SERVICE_ROLE_KEY
- Edge Function secrets

Never expose server-only values to Vite/browser.

Document:
- local Supabase start/reset
- migrations
- seed
- type generation
- hosted deployment
- secret configuration
- migration promotion

Backup/recovery:
- migration history in Git
- Supabase managed backups depending on plan
- logical export strategy
- storage backup strategy
- restore procedure

Do not claim plan-specific backup guarantees without verification.

---

# B12 — PLATFORM SECURITY VALIDATION

Before handoff, run clean reset/migration tests.

Required checks:

1. Database can build from zero.
2. Seed succeeds.
3. Auth/profile linkage works.
4. Roles resolve correctly.
5. RLS enabled.
6. Student cannot read another student.
7. Student cannot modify role.
8. Student cannot read raw correct answers.
9. Student cannot modify protected configuration.
10. Teacher/admin CRUD permissions behave correctly.
11. Storage upload/read/delete rules behave correctly.
12. Audit log cannot be tampered with by students.
13. Generated types are current.
14. Frozen frontend still passes TypeScript/build.

Do negative tests, not only happy paths.

---

# HANDOFF TO CLAUDE

When B0–B12 pass, add:

```text
BACKEND-HANDOFF-001

From: BACKEND-AGENT-1 / Antigravity
To: BACKEND-AGENT-2 / Claude
Area: Backend Foundation
Status: READY
```

Document:
- table names
- migration sequence
- generated type path
- role helpers
- question/option model
- safe/raw data boundaries
- audit writer function
- storage bucket/path conventions
- stable seed IDs
- frontend service boundaries

Do not begin Claude's runtime/scoring phases yourself.

---

# FINAL ANTIGRAVITY ACCEPTANCE

Your work is complete only when:
- B0–B12 complete;
- migrations reset/apply cleanly;
- seed works;
- RLS is tested;
- storage is secured;
- core CRUD works;
- raw correct answers are inaccessible to students;
- audit infrastructure exists;
- generated types are current;
- frontend remains accepted;
- Claude handoff is documented;
- `/docs/TASKS.md` is updated.

Do not claim "backend complete". Your final wording should be:

`BACKEND FOUNDATION READY FOR ASSESSMENT RUNTIME HANDOFF`
