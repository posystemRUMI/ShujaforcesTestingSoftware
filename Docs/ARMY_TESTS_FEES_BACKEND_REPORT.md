# Army tests, fees and backend verification

Verified on 9 October 2026 against the hosted Supabase database and registration backend. The updated frontend was exercised locally against that hosted backend. Its production build passes; frontend production deployment has not been performed.

## Retained requested records

| Student / roll | Exact published test | Verbal / Non-Verbal / Academic | Saved timing | Successful saved result |
|---|---|---|---|---|
| QA PMA Student 001 / QA-PMA-001 | `ARMY PMA  Test 001` | 5 / 3 / 5 = 13 | 60 seconds each portion; 3 minutes total | 13/13, 100% |
| QA AFNS Student 001 / QA-AFNS-001 | `ARMY AFNS Test 001` | 10 / 2 / 7 = 19 | 60 seconds each portion; 3 minutes total | 19/19, 100% |

Both students were registered through the deployed registration Edge Function and authenticated with their real accounts. Both tests were created using the real frontend test service and atomic backend blueprint API. Existing approved questions were selected; no synthetic bank questions were inserted for these retained tests. All three original PMA students automatically received the new PMA test. Each new student received their designated course's test and was denied the other course's test.

PMA and AFNS intelligence question selections overlap in the shared banks; Academic selections are disjoint and course-specific. The DB rejects Academic questions mapped ambiguously to both course families. Each saved section deadline is exactly 60,000 milliseconds after its saved start. Refresh uses persisted deadlines.

Test IDs:

- PMA: `17ef0850-05a0-4b82-b48a-27beee37268a`; successful attempt `1c488b57-1fd9-49a0-817c-75c31c98bda9`; result `da7dbf82-63b7-4762-a499-25fb6ce94f9f`.
- AFNS: `b54fd5d4-4007-4ce2-8319-45ad069648c1`; successful attempt `c731fcb0-bc75-4829-8068-c27c8e1a089d`; result `cc914793-44a9-4c03-8407-d91eee024ccb`.

Two earlier PMA browser automation attempts were interrupted after the verbal portion and saved 5/13 each. The driver was corrected to click the actual option controls and wait for section transitions. Original attempts were preserved, and staff-authorized retakes produced the successful 13/13 attempt. PMA history therefore contains three finalized attempts, one distinct completed test, and aggregate marks 23/39 (about 58.97%). The latest-attempt test leaderboard correctly shows 100%. AFNS has one finalized attempt and one completed test, both aggregate and test score 100%. Student and staff rankings use these same policies; no attempt or timer was reset to hide the interruptions.

Requested QA students have zero registration fee/payment because no fee amounts were supplied. Payment, monthly fee, waiver and void scenarios ran inside rollback transactions; they left no fictional cash collections behind. Final inventory: five students, eleven tests (two published and nine preserved drafts), four saved results, and no public application tables with RLS disabled.

Local login details: [ignored private QA file](../qa-artifacts/army-qa-login-details.private.json). This file contains passwords; it is excluded from Git. The report and prompt contain no access tokens or service keys.

## Initial audit and changes

The original read-only audit, including every original test's duration/count/bank breakdown, is in [TEST_SYSTEM_AUDIT.md](TEST_SYSTEM_AUDIT.md). Its earlier bank assumptions are superseded by the explicit requirement here that PMA/AFNS intelligence is shared and Academic is separate.

| Initial finding | Implemented behavior |
|---|---|
| Mixed subject banks, missing section bank metadata, ignored course filters, count reductions and non-atomic builder saves | Persisted bank/eligibility metadata, atomic blueprints, strict exact-count/course/subject validation, rejection of insufficient or wrong banks |
| Hardcoded timer fallbacks, expiry/resume resets and optimistic section advancement | DB duration snapshots, immutable attempt selection/rubric, server deadlines, sequential/idempotent section advancement and exact saved section clock |
| Failed answer saves could look successful locally; skipped questions could disappear | Backend-enforced answer ownership/section/deadline, errors surfaced, complete transactional and idempotent submission |
| Test Force/course fields could disagree with eligibility; staff ranking policies differed from students | Eligibility-based filters, saved Force/course context, latest attempt per test and all finalized attempts for aggregate ranking |
| Fees combined local storage, mock expenses and browser-calculated data | Canonical DB fee APIs and a student Fees page; admin/student/dashboard read the same account/payment ledger |
| Fee paid/status values, payment ownership and monthly generation lacked comprehensive guards | Ledger reconciliation triggers, ownership FK, overpayment and immutable-payment guards, unique monthly accounts, atomic/admin-authorized RPCs, preserved void history and waiver accounting |
| Private receipt bucket used public URLs | Private object paths and authorized signed URLs; student signing denied |
| Inactive profiles could retain role authority; anonymous safe-bank bulk RPC and internal helpers were too broadly executable | Active-role checks, staff-only bulk bank reading, revoked direct audit/receipt-helper execution; RLS and private answer keys preserved |
| Runner labels used hardcoded course identifiers and UUID subjects | DB Force/course names and subject codes in safe payload/UI |
| Configured maximum marks could disagree with section rubric | Publication computes and validates exact saved maximum marks |

Hosted follow-up migrations `20261009000023` through `20261009000031` were applied. Earlier portal/test integrity migrations remain applied. Fee mutations require an active authenticated admin; students can read only their own accounts/payment history. Internal helper revocation was followed by payment/submission regressions to confirm owner-executed backend calls still work.

## Verification scope and outcome

- Live retained flow: real registration/Auth -> builder/backend -> bank selection/counts -> automatic eligibility -> exam UI -> persisted section deadlines -> answers/submission -> complete results -> student/admin rankings -> refreshed dashboard/history/fees. PASS.
- Hosted matrix: 36 Force/course, section and 15/30/60-minute configurations, with 72 old/new student attempts and exactly 16 recorded questions per attempt. Uses rollback bank fixtures for courses without authored content. PASS.
- Portal regression: four-cohort isolation, failed-result-save rollback, resume, retakes, fee reconciliation, 105 future registrations, ranking ties and authenticated RLS. PASS.
- Security/timing: 14 cases covering ownership, immutable selection, expiry, wrong bank, direct publication bypass, insufficient banks, exact generation, safe results and staff submission. PASS.
- Fees/shared-bank suite: 10 positive/negative cases including attempted forged Academic course membership. PASS.
- Internal audit/receipt helper access: anonymous/student direct execution denied. PASS.
- `npm run lint` (TypeScript checking), production build and diff whitespace checks. PASS. Existing build warnings remain for an unresolved academy-poster asset and large bundles.

The first private receipt QA upload used an unsupported text MIME type and was correctly rejected. The fixture was corrected to an accepted PDF upload; admin access, student denial and cleanup passed. The tightened Academic rule also rejected an old regression fixture that mapped an Academic question across courses; the fixture was changed to an explicitly mapped intelligence question, and the regression passed. These were verification fixture corrections, not weakened backend rules.

Per-check PASS/FAIL tables follow below, generated from the actual saved verification outputs.

## Remaining issues and practical limits

1. Nine original tests remain drafts awaiting staff correction/review of their exact selections and bank metadata. Their records and configured timings/counts were preserved. They were not republished by substituting questions.
2. Some Air Force/Navy course banks have no authored course-linked questions; AFNS Biology/Chemistry curriculum content is also incomplete. Runtime support was tested with rollback fixtures, but staff must supply real bank content before publishing those tests.
3. `PMA_LONG_COURSE` and `PMA_LC` are separate course identifiers. Eligibility follows saved IDs. Select all intended eligible courses explicitly; similarly named courses are not automatically interchangeable.
4. Older general student CRUD/detail paths still contain `studentStore` fallbacks (`studentService.ts`, `StudentDetailPage.tsx`). The atomic registration flow and updated test/fees portal do not depend on them. These older paths were identified by static review and were not comprehensively rewritten or runtime-certified in this scope.
5. Legacy reporting functions need follow-up: `report_student_performance` joins active batch enrollments and can multiply result counts for students in multiple active batches; `report_test_performance` inner-joins single Force/course fields and can omit multi-course tests. The updated leaderboard/dashboard APIs were verified independently. These legacy report edge cases were identified from SQL review and were not runtime-certified here.
6. Backend inventory covered the public routines present at audit time (97), table RLS/privileges and storage policies. This is not a claim that every unrelated module has received exhaustive runtime testing.
7. The backend/database is updated live. Production website users need the built frontend deployed to receive these UI changes. No Git commit/push or frontend hosting deployment was performed.


### Retained live PMA/AFNS browser and backend checks

| Verification | Result |
|---|---|
| PMA live registration and login | PASS |
| AFNS live registration and login | PASS |
| PMA exact blueprint saved through real frontend/backend | PASS |
| AFNS exact blueprint saved through real frontend/backend | PASS |
| PMA correct automatic assignment and cross-course isolation | PASS |
| PMA finalized exact count, score and force/course context verified from DB | PASS |
| PMA persisted statistics and student/admin leaderboards updated | PASS |
| PMA admin/student fees agree from same ledger | PASS |
| PMA dashboard, result history and fee page survive refresh without runtime errors | PASS |
| AFNS correct automatic assignment and cross-course isolation | PASS |
| AFNS finalized exact count, score and force/course context verified from DB | PASS |
| AFNS persisted statistics and student/admin leaderboards updated | PASS |
| AFNS admin/student fees agree from same ledger | PASS |
| AFNS dashboard, result history and fee page survive refresh without runtime errors | PASS |
| Admin finance page loads both retained student accounts | PASS |
| Private finance attachments open for admin and are denied to students | PASS |
| Anonymous bulk question-bank reading denied | PASS |

### Portal regression

| Verification | Result |
|---|---|
| Army / AFNS / Air Force / Navy isolation and direct start/leaderboard denial | PASS |
| Exam resume restores saved answers, review flags, section deadlines, current section and real rubric | PASS |
| Injected result-save failure leaves attempt in progress with no result or completed statistic | PASS |
| Real backend start, atomic submission, pending removal, authorized retake and distinct test count | PASS |
| Correction/invalidation synchronization; average 65 vs weighted aggregate 60; latest test score 50 | PASS |
| Persisted registration fee, initial/later payments, void recalculation, balance and retry idempotency | PASS |
| 105 future registrations receive assignments; all accessible after first 100; no invented ranks | PASS |
| Equal aggregate percentages with unequal marks totals receive equal ranks | PASS |
| Authenticated role RLS: private students, profiles, results, fees; snapshot works | PASS |

### Registration atomicity

| Verification | Result |
|---|---|
| Actual registration RPC: all four course cohorts, no batch, exact roll, personal fields, initial fees, null scores/ranks | PASS |
| Invalid fee rolls back student, assignments, statistics, fee account and payment together | PASS |

### Exact-count/timing matrix

| Verification | Result |
|---|---|
| PMA_LONG_COURSE / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS |
| PMA_LONG_COURSE / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS |
| PMA_LONG_COURSE / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS |
| PMA_LONG_COURSE / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS |
| PMA_LONG_COURSE / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS |
| PMA_LONG_COURSE / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS |
| PMA_LONG_COURSE / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS |
| PMA_LONG_COURSE / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS |
| PMA_LONG_COURSE / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS |
| GDP / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS |
| GDP / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS |
| GDP / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS |
| GDP / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS |
| GDP / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS |
| GDP / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS |
| GDP / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS |
| GDP / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS |
| GDP / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS |
| PN_CADET / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS |
| PN_CADET / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS |
| PN_CADET / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS |
| PN_CADET / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS |
| PN_CADET / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS |
| PN_CADET / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS |
| PN_CADET / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS |
| PN_CADET / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS |
| PN_CADET / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS |
| AFNS / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS |
| AFNS / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS |
| AFNS / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS |
| AFNS / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS |
| AFNS / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS |
| AFNS / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS |
| AFNS / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS |
| AFNS / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS |
| AFNS / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS |
| Exact count mismatch rejected and entire blueprint rolled back | PASS |
| Wrong Force/course pair rejected | PASS |

### Security and timing

| Verification | Result |
|---|---|
| Future section answers rejected by backend | PASS |
| Saved questions/options/rubric remain immutable after live edits | PASS |
| Section advance uses saved duration; repeat is idempotent; earlier section locked | PASS |
| Expired section answer denied despite unexpired overall test | PASS |
| Expired resume returns same attempt and never resets time | PASS |
| Wrong student cannot read or submit attempt | PASS |
| Expiry auto-submits with immutable original answer key and all 16 recorded questions | PASS |
| Finalized student result preserves totals and sections without answer keys | PASS |
| Wrong subject bank rejected atomically | PASS |
| Direct published-table bypass rejected by deferred DB constraint | PASS |
| Generator rejects a requested count different from configured count | PASS |
| Insufficient bank rejected with original configured count and selected questions intact | PASS |
| Authorized staff force submission remains functional and records all 16 questions | PASS |
| Actual authenticated RLS: private keys/banks hidden; own safe payload and section metadata available | PASS |

### Shared banks and fee ledger

| Verification | Result |
|---|---|
| Registration account and initial receipt reconcile atomically | PASS |
| Monthly generation is idempotent and includes newly registered eligible students | PASS |
| Partial/full payments, discount and fine produce exact ledger totals | PASS |
| Waiver removes remaining obligation; voided receipt retained and excluded from totals | PASS |
| Overpayment and missing account rejected by backend | PASS |
| Direct paid/status edits cannot fabricate collected money | PASS |
| Payment student/account ownership enforced in DB | PASS |
| PMA/AFNS intelligence is shared; academic banks stay isolated even with a forged second mapping | PASS |
| Student dashboard matches all fee types; admin finances and mutations denied to students | PASS |
| Actual authenticated RLS: own accounts/history readable; fee mutations denied | PASS |

### Additional final checks

| Verification | Result |
|---|---|
| Internal audit/receipt helpers reject direct anonymous and authenticated execution | PASS |
| TypeScript lint | PASS |
| Production build | PASS |
| Whitespace diff check | PASS |
