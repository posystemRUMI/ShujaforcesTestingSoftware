# Reusable implementation prompt

Audit the existing student portal before changing it. Trace Test Builder -> Database -> Backend -> Force/course eligibility -> Exam Runner -> Timer -> Answer saving -> Submission -> Results, leaderboards and dashboard history. Report every active test's stored duration, section durations, configured and saved question counts, actual banks, Force/course mappings and old/new student visibility. Identify hardcoded timings/counts, fallback questions, browser-only persistence, missing backend validation and DB/UI mismatches. Preserve unrelated features and existing records.

Implement these requirements through database/backend enforcement and the corresponding admin, teacher and student interfaces:

1. Save the exact selected questions and section counts atomically. A configuration of 16 MCQs must save, deliver and record exactly 16. Reject shortages, extras, wrong banks and invalid publication; never silently replace authored selections or add fallback questions.
2. Save the configured duration in the DB. Use server-backed persisted attempt/section deadlines: 15, 30 and 60 minutes must remain exactly those configured durations. Never derive time from question count. Refresh/resume must preserve the same attempt and deadline. Enforce ownership, active section and expiry on answer saving and submission.
3. PMA and AFNS share the Verbal Intelligence bank and share the Non-Verbal Intelligence bank. Verbal sections use only Verbal; Non-Verbal sections use only Non-Verbal. Their Academic banks are separate: PMA Academic questions cannot appear in AFNS Academic, or vice versa. Reject ambiguous academic membership. Every other Force/course uses its designated banks. Force/course selection must determine the entire downstream configuration and eligibility.
4. Automatically deliver published tests to every eligible existing and newly registered student under the selected Force and course eligibility rules. Do not require manual individual assignments. Reject mismatched Force/course pairs and cross-course access. Make any duplicate course identifiers explicit.
5. Save immutable selected questions, answers (including skipped questions), sections, scoring rubric, marks, timestamps, timing data and completion status transactionally. Submission must be idempotent. Retain authorized retakes and history, update DB performance statistics and use consistent student/admin leaderboard policies. Preserve RLS; never expose answer keys to students.
6. Complete the admin and student fees module using the DB ledger exclusively. Include registration fees, fee accounts, monthly generation, discounts/fines, payments/receipts, voids, waivers, balances and history. Enforce account ownership, positive payments, no overpayment, authoritative paid/status totals and authorized mutations. Remove local/mock success fallbacks. Use authenticated signed links for private receipt attachments. Student dashboards and admin finances must agree.
7. Audit backend routines, table privileges/RLS, storage policies and older code paths. Fix issues within this test/fees scope, and explicitly report remaining issues and untested areas. Do not claim unrelated modules are verified solely from static review.

Register and retain one PMA and one AFNS QA student. Then create these exact published tests using real approved bank questions:

| Exact test name | Verbal | Non-Verbal | Academic | Duration |
|---|---:|---:|---:|---|
| `ARMY PMA  Test 001` | 5 | 3 | 5 | 1 minute per portion; 3 minutes total |
| `ARMY AFNS Test 001` | 10 | 2 | 7 | 1 minute per portion; 3 minutes total |

Verify actual registration/Auth, builder writes, automatic assignment, exact DB question IDs/counts, correct shared/separate banks, student visibility, persisted timers, refresh/resume, browser answer saving/submission, complete DB results, leaderboards and dashboard histories. Verify an existing student and newly registered students, multiple Forces/types, negative authorization cases and fee ledger reconciliation. Keep the requested QA students/tests/results; use rollback fixtures for unrelated financial/security scenarios. Do not create fictional live payments when QA fee amounts were not supplied.

Deliver the initial audit, implementation summary, PASS/FAIL for every verification, remaining backend/content issues, deployment status and local QA login details without exposing API keys or database credentials.
