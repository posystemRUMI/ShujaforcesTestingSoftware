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
