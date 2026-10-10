# Student attendance implementation

Implemented against the existing Supabase project on 10 October 2026.

## Inspection and eligibility

No attendance tables or screens existed. This is a single-academy application with no tenant ID in its student/course schema. Authentication uses Supabase Auth linked through `profiles.id = students.profile_id`; active student resolution remains the existing `portal_student_id()` function. Admission eligibility uses `students.admission_date`, falling back to the Pakistan date of `created_at` for legacy records.

The existing primary assignment is `target_force_id / target_course_id`. Additional memberships come from actual active `batch_enrollments → batches.course_id` records and enrollment dates. Attendance is grouped by force/course, not by batch. No new course records or course naming heuristics were introduced.

| Attendance section | Actual canonical course | Course UUID |
| --- | --- | --- |
| Army | PMA Long Course | `00000000-0000-0000-0000-000000000101` |
| Army | AFNS | `10000000-0000-0000-0000-000000000004` |
| Air Force | CAE (`PAF_CAE`) | `20000000-0000-0000-0000-000000000003` |
| Air Force | Airman (`PAF_AIRMEN`) | `20000000-0000-0000-0000-000000000006` |
| Navy | PN Cadet | `00000000-0000-0000-0000-000000000103` |

Inactive duplicate/legacy courses were inspected and excluded. A matching general force alone never grants attendance eligibility. The existing registration guard also rejects unsupported course assignments.

## Pages and operations

- `/admin/attendance`: admin-only daily register; Army, Navy and Air Force visible together; date selector; explicit creation; roll marking by Enter/button; section search and pagination; unique totals; roster synchronization; finalization; reason-required corrections; reopening; holidays/non-class days; audited assignment-conflict resolution.
- History/reporting lives on this same admin page: date range, force/course, name/roll and status filters; register states; individual history via name/roll search; monthly summaries; absent lists; full filtered CSV suitable for Excel; monthly CSV; browser print/Save PDF.
- `/student/attendance`: own monthly history, daily statuses, arrival times and official percentages.
- Existing student dashboard: attendance card, live today status, monthly Present/Absent/Excused counts and View Attendance action.
- Admin navigation includes Attendance; teacher navigation and route access do not.

Inputs preserve roll-number text, including leading zeros, and trim only surrounding whitespace. Errors retain input; confirmed success clears it and restores focus. Existing optional photos render with an initials fallback; no photo-upload workflow was added.

## Hosted database and security

Applied additive migration `supabase/migrations/20261010000054_student_attendance.sql`, with final function/constraint refinements verified on the hosted database.

Tables:

- `attendance_course_rules`: five inspected course/force bindings with foreign keys.
- `attendance_registers`: unique academy date; Open/Finalized/Non-class state; creation, finalization and reopening metadata.
- `attendance_roster`: one snapshot per register/student, including membership, identity and enrollment date; eligibility/conflict markers.
- `attendance_records`: unique `(register_id, student_id)` regardless of force; Unmarked/Present/Absent/Excused; original arrival and separate update time; Present requires an arrival timestamp.
- `attendance_audit`: immutable through authenticated APIs; register/status changes, acting user, reason and UTC timestamp.

Foreign keys preserve attendance history and prevent deleting referenced students; use existing student deactivation/archival rather than hard deletion once attendance exists. Primary/unique keys and student, membership and audit indexes support reads.

Public RPCs:

- `attendance_today()` — academy date in Asia/Karachi.
- `attendance_admin(action, date, data)` — authorized atomic CREATE, SYNC, MARK, FINALIZE, CORRECT, RESOLVE_CONFLICT, REOPEN and NON_CLASS operations.
- `attendance_report(...)` — admin-only filtered records, totals, register history, monthly summaries and recent audit.
- `attendance_student(month)` — resolves the authenticated student internally and returns only their own sanitized history and summary.

Internal membership/synchronization helpers are not callable by authenticated users. All mutations verify active admin identity from server authentication. Security-definer functions use fixed search paths. RLS permits admin reads and student reads of their own roster/records; register configuration, rules and audit remain admin-only. Authenticated users have no direct table-write grants. Teachers have no attendance management/read permissions.

Register row locks serialize marking, finalization and corrections. Unique constraints prevent duplicate daily records. Successful marking retries and finalization retries do not append duplicate audit events. Finalization checks the confirmed unmarked count and rejects stale confirmations or unresolved eligibility conflicts before saving any absences.

## History, synchronization and calculations

Today’s Open roster can synchronize new enrollment idempotently. Unmarked students who become ineligible are excluded without receiving absences. Marked students retain their snapshot and get an explicit conflict when membership changes; staff must restore assignments or perform a reason-required, audited exclusion. Current-day Present corrections cannot bypass a changed/ineligible assignment.

Historical rosters are not automatically reconstructed. Creating a missing past register requires an explicit confirmation; the UI explains that the legacy schema cannot reconstruct former active/archive status before attendance snapshots existed. Historical membership stays fixed after capture.

Finalization preserves Present and Excused, converts only eligible Unmarked entries to Absent, and stores acting-user/timestamp metadata atomically. Reopening retains statuses. Non-class conversion with recorded entries requires explicit audited resolution; records remain stored and that day is excluded from calculations. Midnight never finalizes a register automatically.

Official percentage is `Present / (Present + Absent) × 100`, rounded to two decimals, on finalized class days only. Excused, Unmarked, non-class, pre-enrollment and missing-register days are excluded. A zero denominator returns null / “No attendance recorded.” Overall daily totals are distinct students; range reports distinguish distinct students from student-days. Status-filtered monthly summaries retain complete finalized history for the matching students within the selected date range.

Realtime publication covers attendance records/registers. Components invalidate attendance queries on permitted changes and remove subscriptions on unmount. Fifteen-second refetching plus focus/reconnect refetch covers disconnects and register-state events students cannot directly subscribe to under RLS. Student responses contain no internal correction reasons or audit metadata.

## Verification

`supabase/tests/21_attendance_validation.sql` uses rollback fixtures. Nonempty browser/concurrency checks used dedicated Auth/student records and a date before all real student enrollments; no real student was marked Present or Absent. All QA attendance, students, automatic test assignments and Auth accounts were removed. QA-only roll-counter increments were conservatively restored.

| Required check | Result |
| --- | --- |
| Valid roll persists Present; Enter and button use the same backend | PASS |
| Unknown roll creates no attendance change | PASS |
| Wrong force/course rejected with actual course/correct section message | PASS |
| Duplicate marking is idempotent, including audit | PASS |
| Concurrent arrivals produce one daily record | PASS — actual simultaneous hosted requests |
| Multi-force membership produces one global daily record | PASS |
| Overall totals do not double-count memberships | PASS |
| Refresh and a second authenticated client retrieve saved records | PASS |
| Actual student logout and login preserve saved attendance | PASS — existing login/logout UI, dedicated QA account |
| Student history/dashboard receive saved changes automatically | PASS |
| Student ownership RLS and attendance write denial | PASS — actual authenticated role |
| Teacher backend and frontend access denial | PASS |
| Finalization affects only eligible Unmarked; Present/Excused retained | PASS |
| Simultaneous finalization/arrival stays consistent | PASS — actual simultaneous hosted requests |
| Corrections preserve original arrival and append reasoned audit | PASS — SQL and actual browser dialog |
| Non-class/pre-enrollment exclusions and reopening | PASS |
| Backend percentages and filtered summaries | PASS |
| Aborted database request remains an error; no false saved state | PASS — actual browser network abort |
| Asia/Karachi midnight boundary and future-date rejection | PASS |
| Desktop/tablet/mobile layouts, navigation, pagination and CSV | PASS |
| Print / Save PDF | PASS — generated report PDF for the clean empty dataset; nonempty CSV separately verified |
| TypeScript (`npm run lint`) and production build | PASS |

Browser evidence is stored in ignored `qa-artifacts/attendance-*` files. Existing build warnings about the academy poster asset and large chunks remain unrelated to attendance.

## Delivery status and limitations

- Hosted migration and final schema/policy/function verification: applied.
- Frontend deployment: not performed; source changes are in this workspace.
- No migration-access blockers remain.
- Historical active/archive transitions from before this module cannot be recovered from the old schema; explicit historical creation uses known enrollment data and then preserves its snapshot.
- Physical printer output and browsers other than the tested Chromium desktop/mobile viewports were not tested.

## Hosted follow-up verification — 10 October 2026

- The authenticated student attendance RPC returned today's saved `PRESENT` status, an `OPEN` register and the persisted arrival timestamp `09:26:01 UTC` (`14:26:01 Asia/Karachi`).
- Its October summary returned zero finalized Present/Absent/Excused days and a null percentage. This is expected while no eligible finalized class-day records exist; today's live status is reported separately.
- Clarified the student summary label to “Finalized attendance” and its empty percentage text to “No finalized attendance percentage yet.” Backend calculations were preserved.
- Reran the hosted rollback regression: all nine returned check groups passed, including course eligibility, duplicate marking, finalization, corrections, percentages, non-class days, timezone handling and actual authenticated RLS. The existing live-day synchronization scenario was skipped because today's register already exists.
- Confirmed no rollback-fixture Auth users remained. No live register was finalized or real student attendance changed for this verification. Live administrator activity may continue during read-only checks.

## Course-specific attendance entry — 10 October 2026

The existing admin page now shows five course panels instead of three force panels: PMA Long Course, AFNS, CAE, Airman and PN Cadet. Each panel obtains its actual course ID, force relationship and fixed prefix from the hosted report catalog, filters its records/counts by that course, and accepts only a numeric suffix.

| Course | Fixed entry prefix |
| --- | --- |
| PMA Long Course | SFA-PMA- |
| AFNS | SFA-AFNS- |
| CAE | SFA-CAE- |
| Airman | SFA-AIRMAN- |
| PN Cadet | SFA-PNCADET- |

Applied migration `20261010000055_course_attendance_entry.sql` adds unique, constrained `attendance_course_rules.roll_prefix` values and the admin-only `attendance_mark_course(date, course, suffix)` RPC. The backend validates the actual saved course/force eligibility and historical roster before completing a mark; failures roll back marking, roster synchronization and audit together. Register locking, one daily student record, finalization restrictions, RLS and student dashboard calculations remain intact.

Existing Navy `SFA-NAVY-*` and Air Force `SFA-PAF-*` identifiers are preserved and resolved server-side under the corresponding course label. The entry prefixes do not rename students or change registration numbering. Saved additional course enrollments can resolve the same original roll; ambiguous suffixes are rejected rather than guessing a student. Suffixes remain strings, preserving leading zeros.

Verification: all seven hosted course regression groups and nine existing attendance regression groups passed using rollback-only fixtures. The browser verified all five database prefixes, reload persistence, suffix-only inputs, leading-zero preservation and no horizontal overflow at 1440, 768 and 390px. Enter submits the exact course ID/suffix; an aborted write displays an error and retains input without saving. TypeScript and production build passed, with the existing asset/chunk warnings. No real student attendance was changed for QA. Hosted migration applied; frontend deployment was not performed.
