# Student/test reset and fresh-registration verification

Completed 9 October 2026 against connected hosted Supabase project cxnfxxtlnsypajwqmfni. This reset supersedes the earlier retained QA records and test reports. Backend migration 20261009000032_student_session_integrity.sql is applied live. Frontend changes are local, built and browser-tested against the hosted backend; production deployment was not performed.

## Root cause and authentication fix

The strict portal_student_id() resolver requires students.profile_id = auth.uid(), profile role STUDENT, profile status ACTIVE and student status ACTIVE. The audit found 41 active STUDENT profiles linked to Auth accounts but without any student record. Those accounts could previously pass frontend login because missing student lookup results were ignored. Portal RPCs then correctly raised Active authenticated student required. All five existing linked student records satisfied the role/status/Auth linkage conditions; the missing-record condition explains the audited orphan accounts. No arbitrary student/Force information was invented for incomplete accounts.

Login and session restoration now call the authenticated student_session_identity() RPC, which resolves the current student solely from auth.uid() using the existing strict resolver. It accepts no supplied student ID. Incomplete, inactive or wrong-role identities cannot become authenticated portal users. Login signs out incomplete registrations and gives a configuration error before loading student pages. Refresh clears stale frontend user state if backend identity resolution fails. Profile ACTIVE status is checked on both initial login and restoration. RLS and ownership checks remain enabled.

The registration backend now checks that the Auth account/email match, refuses conversion of a staff profile or linked teacher, requires ACTIVE initial registration, and verifies the Auth -> profile -> student linkage and both ACTIVE statuses before returning success. This check wraps the existing atomic registration transaction; failure rolls back its records and the deployed Edge Function compensates by deleting its newly created Auth account. Direct student/anonymous execution remains denied; only the service role may call registration after the Edge Function's active-staff authorization.

## Backup and recovery

Primary backup directory: qa-artifacts/student-test-reset-backup-2026-10-09T08-04-20-507Z

[Recovery instructions](../qa-artifacts/student-test-reset-backup-2026-10-09T08-04-20-507Z/RECOVERY.md) explain the files and limitations. The backup includes a consistent repeatable-read JSON snapshot of all public base tables, Auth users/identities and relevant MFA tables, storage metadata, all five affected student-photo files, SHA-256 checksums, before counts, deletion/protection manifests and the executed reset SQL. It contains sensitive personal data/password hashes and is ignored by Git. Credentials and hashes are not included in this report.

A deleted-row SQL restore is provided inside that private directory. Its privileged rollback rehearsal successfully restored the original five students, twelve tests and affected Auth/application rows, then rolled back. The rehearsal confirms SQL compatibility and restored Auth/profile/student/test counts; final database integrity and preservation were separately checked after cleanup. Storage file bytes were downloaded and checksum-verified; actual storage re-upload was not necessary and was not performed.

This is a local logical backup, not provider-managed PITR or an encrypted/off-site backup. Restore requires a compatible schema, preserved references and review of any later data collisions. Auth sessions/refresh tokens/magic links and MFA challenges are not restored; recovered accounts require fresh login and possibly MFA/credential recovery. The original incomplete profiles/legacy draft data are restored as originally recorded, so application validation will still reject them. Recovery SQL uses transaction-local privileged trigger suppression and is not an application migration.

A second private backup of the two temporary QA students/tests was taken before their final cleanup. It is separate from the original recoverable backup.

## Reset and preservation

The actual foreign keys, base tables, audit entity types and storage references were inspected first. All dedicated student/test dependent records were removed in one locked DB transaction in dependency order, with counts checked against the backup to reject stale inventory. Student-only profiles were removed, then Auth Admin API hard-deleted the designated users and their identities/session dependencies. Exclusive student files were removed using the Storage API. No blind deletion of Auth users by linked student ID was used.

One mixed-role account was found: its authoritative profile is STUDENT, while editable Auth metadata says ADMIN. It has no student or teacher row. Its Auth account and profile were conservatively preserved and its existing permissions were not elevated. It needs administrative review of the intended role. Consequently five Auth accounts/profiles remain: two ADMIN profiles, two TEACHER profiles and this one protected mixed-role profile. Zero student records/tests remain, and zero student-only Auth accounts remain. The remaining STUDENT-labelled profile is this documented mixed-role exception, not a usable registered student.

Exactly 45 original student-only Auth accounts were removed, including the five linked students and 40 student-only orphan profiles. The two subsequently registered QA Auth accounts were also hard-deleted after testing. Current Auth total is five.

Preservation was verified by comparing complete rows against the original snapshot: 2,401 questions, 9,604 options (including answer-key flags), 4,063 question-course mappings, Forces/courses/subjects/curricula/shared orientation, teacher records and permissions, unrelated expenses/salary records and configuration metadata. Protected profiles and Auth password hashes/role metadata match the snapshot. Auth sign-in timestamps/session tokens may naturally change during authorized staff verification. All 98 public foreign keys were checked after cleanup: zero orphan rows.

## Before/after counts

After counts are final, after removing verification data.

| Table | Before original reset | Final after QA cleanup |
|---|---:|---:|
| auth.users | 50 | 5 |
| public.tests | 12 | 0 |
| public.forces | 3 | 3 |
| public.batches | 0 | 0 |
| public.courses | 21 | 21 |
| auth.identities | 50 | 5 |
| public.profiles | 50 | 5 |
| public.students | 5 | 0 |
| public.subjects | 6 | 6 |
| public.teachers | 1 | 1 |
| storage.objects | 5 | 0 |
| public.fee_types | 9 | 9 |
| public.questions | 2401 | 2401 |
| public.audit_logs | 34 | 4 |
| public.test_results | 4 | 0 |
| public.test_attempts | 4 | 0 |
| public.test_sections | 36 | 0 |
| public.attempt_answers | 58 | 0 |
| public.course_subjects | 0 | 0 |
| public.question_topics | 0 | 0 |
| public.finance_expenses | 3 | 3 |
| public.question_courses | 4063 | 4063 |
| public.question_options | 9604 | 9604 |
| public.teacher_subjects | 0 | 0 |
| public.test_assignments | 36 | 0 |
| public.batch_enrollments | 0 | 0 |
| public.finance_audit_log | 6 | 3 |
| public.question_passages | 0 | 0 |
| public.attempt_heartbeats | 2 | 0 |
| public.expense_categories | 13 | 13 |
| public.question_audit_log | 0 | 0 |
| public.retake_permissions | 2 | 0 |
| public.student_performance | 5 | 0 |
| public.student_fee_accounts | 5 | 0 |
| public.student_fee_payments | 3 | 0 |
| public.test_eligible_courses | 12 | 0 |
| public.test_section_subjects | 66 | 0 |
| public.exam_attempt_snapshots | 4 | 0 |
| public.test_course_deliveries | 12 | 0 |
| public.test_section_questions | 268 | 0 |
| public.question_import_batches | 0 | 0 |
| public.teacher_salary_payments | 1 | 1 |
| public.attempt_section_progress | 10 | 0 |
| public.exam_configuration_issues | 9 | 0 |
| public.portal_practice_questions | 43 | 43 |
| public.familiarization_completions | 0 | 0 |

Storage objects/files: 5 -> 0, all exclusive student photos; no receipt objects were present in hosted storage. Student payment/receipt rows and student-specific finance audit entries were removed. Unrelated expense audits and question audits were preserved.

## Fresh verification

Two temporary students were registered through the actual frontend registration service -> deployed Edge Function -> atomic DB RPC, with zero registration fee/payment. Real browser login forms and logout were exercised. Dashboard, tests, results, leaderboard, profile and fees loaded with proper empty states before publication. Scores/positions were null/unranked and attempts/completed tests were zero. Fee totals matched the saved zero-fee accounts. Refresh and logout/login preserved data. Ownership and staff-operation denials were verified.

Using existing approved questions, temporary PMA and AFNS tests used the requested 5/3/5 and 10/2/7 section counts (13/19 total), 1 minute per section and 3 minutes total. Intelligence banks were shared; Academic selection was course-specific. Automatic eligibility, exact DB selections, safe payloads, browser answer saves, refreshed persisted deadlines, full submissions, 13/13 and 19/19 results, DB statistics, student/admin rankings and dashboard/history updates passed. Result detail, orientation completion and instructions pages were also checked. Staff-authorized temporary retake eligibility was used to exercise orientation/instructions after the completed attempt; no extra attempt was started. These retake/completion records were removed during cleanup. No fictional live fee payments were created. Approved question counts were sufficient; no fake questions were inserted.

The backend negative tests prove that an orphan Auth/profile, an inactive student, an inactive profile and a wrong role remain rejected. Staff account conversion through registration is denied.

| Verification | Result |
|---|---|
| Orphan Auth/profile cannot resolve student identity | PASS |
| Atomic registration creates active Auth/profile/student linkage | PASS |
| Inactive student/profile and wrong role remain denied | PASS |
| Registration refuses conversion of staff Auth accounts | PASS |
| PMA live registration and login | PASS |
| AFNS live registration and login | PASS |
| PMA Auth/profile/student linkage and active role | PASS |
| PMA empty assignments/history, zero attempts, null score/rank and zero registration fees | PASS |
| PMA all six student pages, empty states, refresh and real UI logout/login | PASS |
| PMA cross-student RLS/fee ownership and staff registration/finance denial | PASS |
| AFNS Auth/profile/student linkage and active role | PASS |
| AFNS empty assignments/history, zero attempts, null score/rank and zero registration fees | PASS |
| AFNS all six student pages, empty states, refresh and real UI logout/login | PASS |
| AFNS cross-student RLS/fee ownership and staff registration/finance denial | PASS |
| PMA exact blueprint saved through real frontend/backend | PASS |
| AFNS exact blueprint saved through real frontend/backend | PASS |
| PMA correct automatic assignment and cross-course isolation | PASS |
| PMA payload contains exact section counts and persisted timing | PASS |
| PMA active browser refresh preserves attempt and section deadlines | PASS |
| PMA browser submission persisted every answer, section, mark and exact 60-second deadline | PASS |
| PMA finalized exact count, score and force/course context verified from DB | PASS |
| PMA persisted statistics and student/admin leaderboards updated | PASS |
| PMA admin/student fees agree from same ledger | PASS |
| PMA dashboard, result history and fee page survive refresh without runtime errors | PASS |
| AFNS correct automatic assignment and cross-course isolation | PASS |
| AFNS payload contains exact section counts and persisted timing | PASS |
| AFNS active browser refresh preserves attempt and section deadlines | PASS |
| AFNS browser submission persisted every answer, section, mark and exact 60-second deadline | PASS |
| AFNS finalized exact count, score and force/course context verified from DB | PASS |
| AFNS persisted statistics and student/admin leaderboards updated | PASS |
| AFNS admin/student fees agree from same ledger | PASS |
| AFNS dashboard, result history and fee page survive refresh without runtime errors | PASS |
| Admin finance page loads both retained student accounts | PASS |
| Private finance attachments open for admin and are denied to students | PASS |
| Anonymous bulk question-bank reading denied | PASS |
| PMA result detail privacy/ownership, orientation completion and instruction page refresh | PASS |
| AFNS result detail privacy/ownership, orientation completion and instruction page refresh | PASS |
| Final ZERO students/tests and every dependent table | PASS |
| Deleted student Auth users/identities removed; four staff plus mixed account retained | PASS |
| Question banks/options/keys/maps, metadata/orientation and unrelated finances unchanged | PASS |
| Protected staff/mixed profiles and Auth passwords/metadata unchanged | PASS |
| Every public foreign key checked for orphan rows | PASS |
| All exclusive student storage files removed | PASS |
| Deleted temporary students cannot log in | PASS |
| Deleted Auth and application rows restored inside rollback transaction | PASS |
| TypeScript checks (npm run lint) | PASS |
| Production build (npm run build) | PASS |
| Whitespace diff check | PASS |
| Approved-bank sufficiency | PASS |
| Frontend production deployment | NOT PERFORMED |

No verification checks remain FAIL or BLOCKED. Existing build warnings about the academy-poster asset and large bundles remain unrelated to this reset. No production frontend deployment, Git commit or push was performed.
