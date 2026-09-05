# FORCES ACADEMY COMPUTERIZED TESTING SOFTWARE
# BACKEND AGENT 2 — CLAUDE
## Production Assessment Runtime, Scoring, Results, Monitoring & Integration

Agent ID: BACKEND-AGENT-2
Agent Name: Claude
Role: Assessment Engine / Attempts / Timing / Scoring / Results / Retakes / Realtime / Integration

## 0. FRONTEND IS FROZEN

The frontend has already passed final acceptance.

DO NOT rebuild, redesign, restyle, restructure, or replace the frontend.

You may modify frontend code only when necessary to connect real backend services through existing service/repository boundaries.

Do not:
- change visual design;
- replace shared UI components;
- rewrite shells;
- restructure routes without a necessary backend reason;
- remove existing mock flows before production replacements work;
- duplicate Antigravity's backend foundation.

The task now is to complete the trusted production assessment backend and connect it to the frozen frontend.

---

# 1. LOCKED BACKEND PLATFORM

Use:
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage
- PostgreSQL RPC/functions
- Supabase Edge Functions only when trusted orchestration, secret access, or external integration truly requires them

Do NOT introduce Firebase, Appwrite, Laravel, Django, Express, NestJS, or a second backend.

---

# 2. DEPENDENCY ON ANTIGRAVITY

Before creating schema or runtime logic, read:

- `/docs/TASKS.md`
- Antigravity's backend handoff
- `/docs/BACKEND_ARCHITECTURE.md`
- `/docs/DATABASE_SCHEMA.md`
- `/docs/AUTH_RLS.md`
- current Supabase migrations
- generated Supabase TypeScript types
- role helper functions
- question/option schema
- audit log contract
- storage conventions
- seed IDs

You MUST consume the foundation already created by Antigravity.

Do NOT duplicate:
- profiles;
- roles;
- students;
- teachers;
- batches;
- forces;
- courses;
- subjects;
- question tables;
- option tables;
- storage buckets;
- RLS helper functions;
- audit framework.

If a foundation correction is required:
- create a new corrective migration;
- document it in `/docs/TASKS.md`;
- preserve existing contracts where possible.

---

# 3. SHARED TASK LEDGER

Use the SAME:

`/docs/TASKS.md`

Your phases must record:
- Owner
- Status
- Started
- Last Updated
- Dependencies
- Blocked By
- Migrations
- Functions/RPC
- RLS
- Realtime
- Files Changed
- Validation
- Security Tests
- Integration Tests
- Known Issues
- Handoff Notes

Do not create a competing task file.

---

# 4. TRUST MODEL

The browser must NEVER be authoritative for:
- question answer keys;
- scoring;
- final result;
- attempt eligibility;
- retake eligibility;
- start time;
- expiry time;
- section timing;
- randomization;
- final submission;
- publish/assignment rules.

Correct answers must not be exposed to the active exam client.

Use transactional RPC/database logic for sensitive operations.

---

# 5. YOUR BACKEND PHASE OWNERSHIP

You own:

B13 Test & Section Schema  
B14 Test Question Composition  
B15 Test Publishing & Assignment  
B16 Attempt Creation & Eligibility  
B17 Safe Exam Payload  
B18 Server-Authoritative Timing & Section Rules  
B19 Autosave & Answer Persistence  
B20 Final Submission & Idempotency  
B21 Trusted Scoring Engine  
B22 Results & Answer Review  
B23 Retake Authorization & Consumption  
B24 Live Monitoring / Realtime  
B25 Reports / Analytics Backend  
B26 Frozen Frontend → Production Backend Integration  
B27 End-to-End Security & Functional Regression  
B28 Final Production Backend Acceptance

---

# B13 — TEST & SECTION SCHEMA

Create normalized tables for tests and sections.

## Tests
Support:
- id
- name
- force_id
- course_id
- passing threshold
- status
- created_by
- published_at
- timestamps
- configuration flags required by current frontend

Statuses:
- draft
- published
- active
- completed
- archived

Do not let the browser directly publish a test without trusted validation.

## Test Sections
Support:
- id
- test_id
- name
- position/order
- question_count
- duration
- timestamps
- section settings

Support:
- Verbal Intelligence
- Non-Verbal Intelligence
- Academic
- Personality
- custom sections

Keep structure compatible with the frozen five-step Test Builder.

---

# B14 — TEST QUESTION COMPOSITION

Create relational composition:
- test section ↔ question
- stable order
- marks/weight if requirements use them
- source/manual-vs-automatic metadata if useful

Support:
- manual question selection
- automatic question selection

Automatic selection must be trusted.

Implement RPC or equivalent such as:
`generate_test_section_questions(...)`

Validate:
- subject
- force
- course
- quantity
- active question status
- no unintended duplicates
- section capacity
- valid option count

Persist selected composition before publish.

Do not reshuffle published composition unexpectedly.

---

# B15 — PUBLISHING & ASSIGNMENTS

Create trusted publish flow.

Before publish validate:
- test metadata complete
- force/course valid
- sections exist
- question counts match
- duration valid
- passing threshold valid
- selected questions active
- four options valid where required
- correct-answer integrity exists server-side

Create assignment model.

Support:
- batch assignment
- individual student assignment if required
- availability start/end
- attempt limit
- status

Students cannot self-assign.

Create trusted RPC:
- publish_test(...)
- assign_test(...)
or equivalent.

Audit these actions.

---

# B16 — ATTEMPT CREATION & ELIGIBILITY

Implement trusted attempt start.

Suggested RPC:
`start_test_attempt(test_id)`

Server verifies:
- authenticated user is student;
- active student profile;
- assignment exists;
- test published and available;
- availability window valid;
- attempt limit not exceeded;
- no prohibited active duplicate;
- retake permission exists if this is an additional attempt.

Atomically create attempt.

Persist:
- attempt_id
- student_id
- test_id
- assignment_id
- attempt_number
- started_at
- expires_at
- status
- persisted question order
- persisted option order if shuffled
- current section state if needed

Return only safe initialization data.

Do not accept `started_at`, `expires_at`, or attempt number from browser.

---

# B17 — SAFE EXAM PAYLOAD

Create a student-safe RPC/view.

Return only:
- attempt metadata
- test title/context
- section metadata
- server time
- expiry time
- safe question statement/image
- safe option text/images
- persisted question order
- persisted option order
- student's saved answers
- marked-for-review state
- progress metadata

MUST NOT return:
- `correct_option_id`
- `is_correct`
- hidden rationale
- answer key
- moderation fields
- scoring secrets
- other students' data

Do not allow student SELECT on raw authoring tables if those expose correct answers.

This is a P0 security requirement.

---

# B18 — SERVER-AUTHORITATIVE TIMING

Use server/database timestamps.

Attempt should include:
- started_at
- expires_at
- submitted_at

If section timing is individual, also persist:
- section_started_at
- section_expires_at
or equivalent.

Backend must reject:
- answer writes after expiry;
- progression to invalid section;
- attempts after submission;
- client attempts to extend time.

Frontend timer is only a display derived from:
- server_now
- expires_at
- section_expires_at

Never trust client remaining seconds.

---

# B19 — AUTOSAVE / ANSWER PERSISTENCE

Create `attempt_answers` or equivalent.

Fields:
- attempt_id
- question_id
- selected_option_id nullable
- mark_for_review/flag
- answered_at
- updated_at
- version if needed

Constraints:
- unique(attempt_id, question_id)
- selected option belongs to question
- question belongs to attempt composition
- attempt belongs to student
- attempt active
- attempt not expired/submitted

Implement safe upsert/RPC.

Support:
- answer select
- answer change
- clear answer
- mark/unmark for review

Frontend may keep a retry queue, but backend validates every write.

---

# B20 — SUBMISSION & IDEMPOTENCY

Implement trusted final submission.

Suggested RPC:
`submit_test_attempt(attempt_id)`

Transaction steps:
1. identify authenticated caller;
2. lock attempt row;
3. verify ownership/authorized force-submit;
4. reject invalid state;
5. determine authoritative expiry;
6. set submitted_at exactly once;
7. reject future answer writes;
8. calculate trusted score;
9. create result exactly once;
10. consume retake permission if required;
11. write audit event;
12. return result summary.

Requirements:
- duplicate submit must not create duplicate results;
- retries return same final result or safe already-submitted response;
- use unique constraint on result(attempt_id);
- handle concurrent submit race safely.

Do not accept score from frontend.

---

# B21 — TRUSTED SCORING ENGINE

Compute from server-owned data.

Calculate:
- total questions
- correct
- incorrect
- skipped
- marks
- max marks
- percentage
- pass/fail
- section breakdown
- subject/domain breakdown where supported

Use:
- persisted attempt composition
- persisted answers
- canonical correct option
- test passing rule

Do NOT trust client:
- percentage
- correct count
- result
- answer key
- section score

Do not invent negative marking unless requirements define it.

If Stanine remains in product:
- implement a documented rule/formula;
- otherwise label it clearly as a derived/mock presentation metric until formalized.
Do not fabricate random Stanine values.

---

# B22 — RESULTS & ANSWER REVIEW

Create result schema.

At minimum:
- id
- attempt_id UNIQUE
- student_id
- test_id
- total_questions
- correct_count
- incorrect_count
- skipped_count
- marks_obtained
- max_marks
- percentage
- result/pass-fail
- generated_at

Create section/domain result data if needed.

Student permissions:
- own results only
- answer review only after submission
- correct answer/explanation only if reveal policy allows

Teacher/Admin:
- appropriate result visibility

Create safe result review RPC/view returning:
- question
- selected answer
- correct answer
- status
- explanation
only after authorization.

Preserve every attempt.

---

# B23 — RETAKES

Create retake authorization.

Fields:
- id
- student_id
- test_id
- original_attempt_id
- approved_by
- approved_at
- expires_at
- status
- optional notes

Statuses:
- available
- used
- expired
- revoked if needed

Rules:
- student cannot self-authorize;
- previous attempt/result immutable;
- retake creates new attempt number;
- permission consumed atomically;
- permission cannot be reused;
- approval/use audited.

Expose student-safe retake availability.

---

# B24 — LIVE MONITORING / REALTIME

Build realistic Realtime architecture.

Track:
- attempt id
- student summary
- test
- section
- answered count
- progress
- started_at
- expires_at
- last_seen
- status
- connection state
- current question index only if product allows

Heartbeat:
- use sensible interval
- derive stale/connection issue from last_seen

Realtime subscribers:
- teacher/admin monitoring dashboard

Trusted operations:
- force submit
- pause/resume only if genuinely supported by product
- view attempt

Every privileged action must:
- authorize;
- log audit event.

Do NOT implement fake screen mirroring with Supabase.
60FPS screen streaming is out of scope.

---

# B25 — REPORTS / ANALYTICS BACKEND

Create efficient SQL views/RPCs for:

- Batch Performance
- Student Performance
- Test Performance
- Pass/Fail Summary
- Force Performance

Filters:
- date range
- batch
- force
- test

Use SQL aggregation.

Avoid N+1 frontend requests.

Add indexes for real filter/join patterns.

Protect analytics with teacher/admin policies.

Students must not receive other students' report data.

---

# B26 — FROZEN FRONTEND PRODUCTION INTEGRATION

Replace frontend mock services deliberately.

Integrate:
- authService
- studentService
- teacherService
- batchService
- configurationService
- questionService
- testService
- attemptService
- resultService
- retakeService
- monitoringService
- reportService

Pattern:

```text
Frozen UI
→ existing feature service/repository
→ Supabase client / RPC
```

Do NOT scatter raw Supabase queries throughout page components.

Use adapters so existing frontend data shapes remain stable.

Minimal frontend modifications only.

Do not redesign.

During transition:
- allow mock fallback only when documented;
- remove/deactivate mock path after production path passes;
- preserve local retry queue for autosave if useful;
- backend remains authoritative.

---

# B27 — END-TO-END REGRESSION

Test the full production backend.

## Admin
- login
- create student
- create teacher
- create batch
- configure forces/courses/subjects

## Question Bank
- create text question
- create image question
- upload stem/option images
- edit
- archive/deactivate
- verify student cannot read answer key

## Test Builder
- create test
- configure sections
- manual selection
- automatic selection
- timing/rules
- review
- publish
- assign to batch/student

## Student
- login
- assigned test appears
- instructions
- start attempt
- safe exam payload
- answer
- autosave
- reload/resume
- section transition
- submit
- trusted score
- result
- answer review
- history

## Retake
- admin approves
- student sees availability
- new attempt created
- old result preserved

## Monitoring
- active attempt appears
- progress/heartbeat updates
- stale connection shows issue
- force submit works
- audit event created

## Negative security tests
Student attempts to:
- query raw correct answers
- query another student's result
- update role
- self-assign test
- self-approve retake
- update submitted answer
- start unavailable test
- extend expiry

All must fail safely.

---

# B28 — FINAL BACKEND ACCEPTANCE

Required final checks:

- clean database reset/migrations: PASS
- seed: PASS
- generated DB types current
- RLS enabled and tested
- no correct-answer leakage
- student isolation passes
- publish/assignment trusted
- attempt start trusted
- server-authoritative timing passes
- autosave passes
- duplicate submit safe
- trusted scoring correct
- result persists
- answer review secure
- retake preserves history
- Realtime monitoring works
- audit logs generated
- no service-role key in browser
- frontend TypeScript passes
- frontend lint passes
- frontend production build passes

Produce:

# FINAL PRODUCTION BACKEND ACCEPTANCE REPORT

Include:
- migration inventory
- table inventory
- views
- RPC/functions
- Edge Functions
- RLS policies
- storage buckets
- Realtime channels/tables
- generated type path
- security tests
- functional tests
- integration tests
- known risks
- deployment/environment steps
- final verdict

Final verdict must be:
PASS or FAIL

PASS requires:
- zero unresolved P0 backend/security defects;
- full end-to-end exam flow operating on Supabase;
- correct answers protected;
- submission/scoring server-authoritative;
- frontend still accepted visually and technically.

---

# CLAUDE NO-DUPLICATION RULE

Before creating any:
- table
- enum
- RPC
- helper
- storage bucket
- service
- type
- Edge Function

search the existing repository and migrations first.

Reuse Antigravity foundation.

Never create a second representation of the same truth.

---

# FINAL COMPLETION STATEMENT

Do not say "backend complete" until B13–B28 and end-to-end regression pass.

Your final successful statement should be:

`PRODUCTION BACKEND COMPLETE — END-TO-END SUPABASE INTEGRATION VERIFIED`

and `/docs/TASKS.md` must be fully updated before stopping.
