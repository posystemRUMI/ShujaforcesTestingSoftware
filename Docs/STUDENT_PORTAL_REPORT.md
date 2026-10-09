# Student portal implementation report

The five logged-in student pages now use authenticated backend queries. Registration values, assignments, attempt history, fees and ranks come from saved database records. Browser mock statistics and invented student details were removed from these pages.

## Database changes

Applied to hosted Supabase on 9 October 2026:

| Migration | Purpose |
| --- | --- |
| `20261009000003_student_portal.sql` | Authenticated snapshot/ranking APIs, persisted performance, ownership RLS, retake/start guards and atomic registration fee setup. |
| `20261009000004_portal_delivery_integrity.sql` | Persisted course delivery rules and individual assignments for existing/future students; result ownership foreign key. |
| `20261009000005_portal_attempt_order.sql` | Resolve equal completion timestamps using saved attempt number. |
| `20261009000006_atomic_portal_registration.sql` | Atomic registration database operation; optional batch, exact roll number and resume/answer/submission guards. |
| `20261009000007_portal_read_integrity.sql` | Old views honor RLS; total fee comes from the registration account; result details require a valid owned finalized result. |
| `20261009000008_portal_orientation.sql` | Saved unscored orientation curriculum and database completion records. |
| `20261009000009_portal_score_integrity.sql` | Correct stored percentages on marks changes, validate marks, preserve case-insensitive roll uniqueness and rank tests without rounding. |
| `20261009000010_portal_orientation_curriculum.sql` | Existing authored subject curriculum plus general-knowledge orientation content, kept outside the examination question bank. |
| `20261009000011_portal_metadata_rls.sql` | Resolve a policy recursion cycle so authorized students can open their own assigned tests. |
| `20261009000012_portal_realtime.sql` | Publish protected portal tables for realtime updates; periodically refetch standings when other students' private results change. |
| `20261009000013_portal_exam_resume.sql` | Restore the complete saved exam state, real rubric and section deadlines; require active student/profile status. |

The registration Edge Function was deployed and reports ACTIVE. It verifies active staff credentials, creates the Auth account, invokes the atomic database registration operation, and compensates by deleting the Auth account when that operation fails. The frontend no longer reports local-only registration or fee-payment success.

Previously published, explicitly course-targeted tests now have persisted delivery rules and per-student assignments. New registrations inherit only matching rules. No batch membership or test-name inference controls delivery. No students, results, payments or scores were fabricated by migrations. Existing historical statistics were recalculated from real records.

## Calculations

- Valid results require a matching owned attempt, a finalized status, saved completion timestamp and positive possible marks.
- Completed Tests counts distinct test IDs; history includes every valid finalized attempt, including retakes.
- Average = sum of saved finalized attempt percentages / finalized attempt count.
- Aggregate = total obtained marks / total possible marks × 100, using all valid finalized attempts. Aggregate and supporting totals are persisted.
- Course/academy aggregate positions use unrounded weighted percentages. Test positions use the latest valid attempt, ordered by completion time, attempt number and a stable ID; the percentage used for ranking is calculated without rounding from saved marks.
- Equal percentages receive equal dense ranks. Roll number and ID only stabilize display order.
- Scores without results are null, with no rank. Display rounds percentages consistently to two decimals.
- Total Fee uses the registration fee account; Paid Fee sums active payment records once; Remaining Fee is calculated on the backend. Voids are excluded.
- Completion times come from saved attempts and display in Asia/Karachi.

## Verification performed

`supabase/tests/06_student_portal_validation.sql` and `07_portal_registration_validation.sql` passed against the hosted database. All fixtures run in transactions ending in ROLLBACK. The suites cover four course groups, direct-request denial, actual start/submission, failure injection, retakes, corrections, invalidation, average versus aggregate, fee/payment/void accounting, equal ranks, and 105 future registrations with pagination beyond 100.

Positive database registration tests verified each cohort without a batch, exact roll-number case, saved personal fields, initial fees and null performance/ranks. Invalid fee input rolled back all student-side registration records. Authenticated-role tests exercised real RLS rather than relying on superuser-visible queries.

Live authenticated HTTP checks passed for snapshot/ranking consistency, private ownership, saved data in a second client, raw assigned-test metadata, anonymous/student registration denial and all nine currently assigned orientation payloads.

Browser checks rendered all five pages, course/test leaderboard modes, test orientation, profile refresh and a fresh signed-in session with no JavaScript page errors. Invalid result URLs show an error instead of fabricated scores or verification hashes. Desktop/mobile evidence is saved under `qa-artifacts/student-portal-*`. TypeScript and the production build passed.

Final cleanup queries confirmed zero fixture students, Auth users, tests or failure-injection triggers remained. Existing production exam results were not created or altered by the verification suites.

## Remaining limitations

The frontend website has not been deployed. Backend migrations and registration deployment are live; local frontend source/build is ready.

A successful new Auth account through the deployed Edge Function was not committed as a production test student. Positive registration was verified at the database transaction boundary; deployed HTTP authorization was verified separately. A staging end-to-end registration/compensation run remains advisable.

Existing build warnings remain for an academy poster asset reference and large bundles. They do not prevent the build. No Git commit or push was requested.
