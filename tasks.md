# Student portal implementation tasks

Updated: 9 October 2026 (Asia/Karachi).

## Database and backend

- [x] Inspect registration, profiles, courses, forces, assignments, attempts, results, fees, ranking RPCs and RLS.
- [x] Resolve the student from the authenticated session; reject cross-student profile, fee and result access.
- [x] Match the single stored force/course identifiers, including AFNS course isolation within Army.
- [x] Replace batch delivery with persisted course delivery rules and individual student assignments.
- [x] Generate eligible assignments when a student registers or an eligible course test is published.
- [x] Respect availability windows; remove finalized original tests from pending lists.
- [x] Require explicit retake permission and consume it when a retake starts.
- [x] Guard direct test opening, starting, resuming, answering and submission on the backend.
- [x] Link results to the exact attempt, student and test with a composite foreign key.
- [x] Persist distinct completed tests, attempt count, average percentage, aggregate percentage and supporting marks totals.
- [x] Recalculate statistics on result insertion/correction/deletion and attempt status changes.
- [x] Backfill existing statistics only from valid saved finalized results.
- [x] Rank by unrounded percentages, tie equal scores, and order tied rows consistently.
- [x] Provide course and latest-attempt test rankings with pagination beyond 40 students.
- [x] Restrict leaderboard output to position, name, roll number, percentage and current-user flag.
- [x] Save registration, fees, initial payment, statistics and assignments in one database transaction.
- [x] Preserve registration fields and exact roll-number case; eliminate mandatory batch enrollment.
- [x] Deploy authenticated registration Edge Function with compensating Auth cleanup on database failure.
- [x] Make subsequent fee payments use the atomic backend RPC; remove fake successful browser-ledger fallbacks.
- [x] Sum active payment records once; exclude voided payments; use the saved registration fee.
- [x] Repair pre-test orientation using persisted, explicitly unscored curriculum, separate from exam questions and scores.
- [x] Persist orientation completion rather than treating browser storage as authoritative.
- [x] Apply SQL migrations `20261009000003` through `20261009000013` to hosted Supabase.
- [x] Restore saved answers, review flags, current section and section deadlines on exam resume.
- [x] Enable ownership-protected realtime updates and periodically refresh course standings.
- [x] Prevent an Auth session-lock deadlock when students sign in or refresh tokens.

## Student pages

- [x] Dashboard: real pending count, distinct completion count, average score and academy summary position.
- [x] Dashboard: course-only Your Standings and working View Leaderboard link.
- [x] Dashboard: separate total, paid and remaining registration fees.
- [x] Dashboard: remove Mandatory Test Sequence and standalone course banner.
- [x] Dashboard: recent finalized examination history with saved timestamps, marks and percentages.
- [x] Assigned Tests: remove branch filters; show eligible pending assignments and authorized retakes.
- [x] My Results: finalized attempts and retakes, newest first, with saved completion date/time and protected details.
- [x] Leaderboard: My Course Positions and Test-wise Leaderboard; remove academy mode and top-40 cap.
- [x] Leaderboard: eligible test dropdown, own row highlighting, true position and unranked empty results.
- [x] Profile: saved personal fields, exact roll number and one actual force; neutral optional-field blanks.
- [x] Profile: completed tests, average and aggregate; course position only.
- [x] Profile: comment out internal reference section; remove Best Score, batch/academy standings and Recent Assessments.
- [x] All portal pages: loading/error/empty states without mock student details or fabricated statistics.
- [x] Times consistently display in Asia/Karachi.
- [x] Refresh/re-entry retrieves backend records; realtime changes invalidate student queries.

## Verification

- [x] TypeScript check and production build.
- [x] Database acceptance suite: all four cohorts, ownership/eligibility denial and direct URLs/API protection.
- [x] Actual start/submission RPCs, pending removal, authorized retakes and distinct completed-test counts.
- [x] Inject a result-save failure; verify no completed attempt/result/statistics survive the failed submission.
- [x] Correction/invalidation: average 65%, aggregate 60%; latest test attempt 50%.
- [x] Initial/later payments, voids, remaining balance and registration retry idempotency.
- [x] 105 new cohort fixtures receive assignments; students beyond the first 100 remain accessible.
- [x] Equal aggregate percentages with different marks totals receive equal positions.
- [x] Positive registration database RPC for Army, AFNS, Air Force and Navy with no batch.
- [x] Invalid registration fee rolls back student, assignments, statistics and fee records together.
- [x] Authenticated HTTP APIs, second-client persistence and student/anonymous registration denial.
- [x] Raw assigned-test metadata permissions and all nine currently assigned orientation payloads.
- [x] Browser: dashboard, assignments, results, course/test leaderboard, profile, orientation and refresh; no page errors.
- [x] Local desktop/mobile screenshots inspected.
- [x] Confirm zero remaining fixture students, Auth users, tests or injected failure triggers after rollback.

## Remaining / not performed

- [ ] Deploy the frontend build to the production website. Repository changes and the production build are ready; the database and registration backend are already updated.
- [x] Follow-up live Edge/Auth registration and exam flow passed with temporary accounts registered before and after publication; all fixtures cleaned up.

Git commit/push was not requested. Existing build warnings about the academy poster reference and large bundles are unrelated to these portal data changes.

Details: [implementation report](Docs/STUDENT_PORTAL_REPORT.md).

## Test system audit and enforcement follow-up

- [x] Read-only audit and report before code/DB changes.
- [x] Atomic blueprint publication, exact questions, persisted bank mappings and course/Force validation.
- [x] Backend deadlines, sequential section advance, stable expired resume, immutable scoring, complete transactional answer/result records.
- [x] Hosted DB matrix: 36 configurations / 72 old-and-new student attempts; 15/30/60 minutes.
- [x] Security/timing, portal/registration regression, live Edge/Auth/browser verification and fixture cleanup.
- [x] TypeScript, production build, diff check.
- [ ] Staff correct exact bank selections for nine preserved draft tests and supply missing Air Force/Navy curricula.
- [ ] Deploy updated frontend to production.

Details: [initial audit](Docs/TEST_SYSTEM_AUDIT.md), [changes and every verification result](Docs/TEST_SYSTEM_VERIFICATION.md).

## Requested PMA/AFNS tests and DB fees follow-up

- [x] Shared PMA/AFNS intelligence with strict separate Academic banks, exact marks/count/timing enforcement.
- [x] Canonical admin/student fee ledger, ownership/reconciliation guards, private receipts and security fixes.
- [x] Register and retain QA-PMA-001 and QA-AFNS-001; publish exact 13/19-question tests with 1 minute per portion.
- [x] Complete browser submission, persisted results, student/admin ranking consistency and refreshed dashboard/history/fees checks.
- [x] Hosted rollback fee/security/portal regressions, TypeScript, production build and backend audit report.
- [x] Preserve interrupted PMA attempts and approved retake history; successful latest score 13/13.
- [x] Write reusable task prompt and every-check verification report.
- [ ] Staff correct/review nine legacy drafts and supply missing curricula; review older CRUD/reporting issues listed in report.
- [ ] Deploy updated frontend to production.

Details: [report](Docs/ARMY_TESTS_FEES_BACKEND_REPORT.md), [reusable prompt](Docs/ARMY_TEST_AND_FEES_TASK_PROMPT.md).

## Authorized student/test reset and authentication verification

- [x] Audit Auth/profile/student/status/role/RLS chain; identify 41 orphan student profiles.
- [x] Apply active-session identity and registration linkage enforcement migration to hosted DB.
- [x] Back up original records, Auth identities and five exclusive photos; prepare and rehearse rollback recovery.
- [x] Delete five original students, twelve tests and 45 student-only Auth accounts with all dependencies.
- [x] Preserve four staff accounts and one mixed-role account without changing permissions; report exception.
- [x] Fresh PMA/AFNS actual registration, all student pages, empty states, zero fees, refresh/logout/login and ownership checks.
- [x] Temporary exact 13/19-question exams, persisted timers, submission/results/history/leaderboards and orientation/instructions.
- [x] Remove both QA students/Auth accounts/tests/dependencies; final zero students/tests and 98-FK orphan check.
- [x] TypeScript, production build and diff checks.
- [ ] Administratively review the protected mixed-role account.
- [ ] Deploy updated frontend to production.

This reset supersedes the retained QA records described in previous sections. See [reset report](Docs/STUDENT_TEST_RESET_REPORT.md).

## Completed original-test answer review

- [x] Add saved answers/correct answers below Score & Threshold Benchmark.
- [x] Enforce own valid finalized result only; keep active exam/bank keys private.
- [x] Capture immutable explanations privately and retain saved question/key ordering.
- [x] Verify hosted security/immutability, real browser review/filters/refresh and existing results.
- [x] Remove temporary review QA data and preserve new real registrations/tests.
- [x] TypeScript, production build and diff checks.
- [ ] Deploy frontend to production.

Details: [completed-test review report](Docs/COMPLETED_TEST_ANSWER_REVIEW.md).

## System-wide heading text cleanup

- [x] Audit all 83 TSX files and remove descriptive heading subtitles/paragraphs across Admin, Teacher, Student and shared UI.
- [x] Preserve actual data, headings, handlers, validations, empty states and important instructions.
- [x] Tighten shared headers/form sections and selection-card spacing.
- [x] Add student-detail loading guard exposed by browser verification.
- [x] TypeScript, production build, diff checks and 38 read-only desktop/mobile browser checks.
- [ ] Deploy updated frontend to production.

Details: [UI heading cleanup](Docs/UI_HEADING_CLEANUP.md).

## Dashboard and database answer explanations

- [x] Remove score trend and recent submissions widgets and their exclusive code; reflow dashboard.
- [x] Show correct answers followed by saved explanations in authorized reviews.
- [x] Audit all 2,401 bank explanations; none missing, preserve all question content and keys.
- [x] Restore 25 missing legacy snapshot explanations through hosted migration 00034.
- [x] Preserve active-exam privacy, ownership and RLS; pass hosted security checks.
- [x] Resolve teacher bank query timeout using paginated policy-protected reads.
- [x] Pass all 12 browser layout, staff preview and student review refresh checks.
- [x] TypeScript checks and production build.
- [ ] Deploy updated frontend to production.

Details: [dashboard and explanation report](Docs/DASHBOARD_EXPLANATIONS.md).

## Shared banks and LC-159 import

- [x] Back up hosted bank records/options/mappings and historical snapshots; confirm 60 existing Verbal records and all 292 source entries.
- [x] Solve, correct and deduplicate supplied MCQs; account for six unresolved source entries without creating review queues.
- [x] Apply stable, collision-safe codes and idempotent import; preserve UUIDs and historical snapshots.
- [x] Import 52 complete LC-159 recalls by inserting six and matching 46; save provenance and isolated PMA Academic mappings.
- [x] Add database counts, Force/Course/Bank filters, active/inactive totals and pagination.
- [x] Persist/render inline source labels in bank, builder and new exam/review snapshots; keep active-exam answers private.
- [x] Pass hosted persistence/idempotence/security checks, Admin/Teacher browser checks, actual PMA/AFNS builder selection, TypeScript and production build.
- [ ] Deploy updated frontend to production.

Details: [complete source accounting and correction report](Docs/VERBAL_LC159_IMPORT_REPORT.md).

## Remove Reports & Analytics

- [x] Delete Reports page, lazy import, route and dedicated report service/export.
- [x] Remove shared Admin/Teacher navigation entry and unused icon import.
- [x] Browser: both roles have no Reports menu link; former /admin/reports URL returns 404.
- [x] TypeScript and production build; no remaining app-source references or Reports build chunk.
- [ ] Deploy updated frontend to production.
