# Test system changes and verification � 9 October 2026

Initial read-only audit: [TEST_SYSTEM_AUDIT.md](TEST_SYSTEM_AUDIT.md). The audit was reported before system changes.

## Changes applied

- Hosted Supabase migrations 20261009000014-00022 applied through its Management API. Publication and direct published-table writes now validate exact counts, explicit section minutes and total duration, approved four-option questions, subject mappings, course/Force membership, and unique composition. Invalid writes roll back. The database rejects a short bank rather than shrinking the configured count.
- Test Builder now saves eligibility, sections, subject mappings, selected IDs and publication in one transaction through save_test_blueprint. Publication errors are surfaced. No direct-publish fallback, unrestricted bank retry, random generation or fabricated save success. Entered counts/minutes are preserved; pattern values provide defaults. A Force-wide selection button selects all its existing course eligibility rules.
- Exact force/course matching remains the existing design. Every matching active student receives a persisted assignment automatically, both on publication and subsequent registration. Course membership within a Force is intentional: AFNS does not automatically receive a PMA-only test.
- A private immutable attempt snapshot retains selected questions, displayed options, sections and scoring rubric. Answer keys stay private under RLS. Safe exam and finalized student result payloads omit them; keyed result review is staff-only. later live content/answer-key edits cannot change an existing attempt.
- Backend answer saving enforces own student, active attempt, active section and both section/overall deadlines. Invalid option IDs, future/completed sections, expired saves and another student are rejected. Section advancement is sequential and idempotent and uses saved section duration; it cannot reset deadlines. Expired resume returns the same attempt.
- Runner uses saved backend deadlines and server clock offset; dialogs and refresh do not pause/reset time. Section advancement waits for backend confirmation. Saves are serialized, failed/pending changes remain marked unsaved and retained locally for retry, clear selection sends NULL, and final submission waits for saves.
- Server scoring uses the immutable snapshot. All selected questions receive answer records, including explicit cleared/skipped questions. Sections, marks, elapsed time, submission status and completed progress are persisted transactionally. Repeat submit returns the existing result.

## Data readiness � FAIL where staff content needs correction

All nine original published tests failed subject/course bank validation and were preserved as DRAFT with their selected question IDs, counts and durations unchanged. Reasons are stored in exam_configuration_issues. They are withheld from students until a staff member selects the exact valid questions and saves the blueprint. No authored questions or original tests were deleted.

| Original test | Result | Action still needed |
|---|---|---|
| demo test 01 for pMA | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 26 configured questions and 6 minutes |
| demo pma 2 | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 15 configured questions and 3 minutes |
| demo 3 pma | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 3 configured questions and 3 minutes |
| pma demo 4 | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 19 configured questions and 3 minutes |
| pma 5 | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 117 configured questions and 90 minutes |
| demo 112 | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 16 configured questions and 90 minutes |
| boss pma | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 17 configured questions and 3 minutes |
| test 1 | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 10 configured questions and 3 minutes |
| test 22 | FAIL bank readiness; withheld as draft | Correct subject/course question selections, retaining 10 configured questions and 3 minutes |

Air Force GDP and Navy PN Cadet have no authored question-course bank mappings in the production DB. AFNS has no Biology/Chemistry subject banks. These missing curricula cannot be verified as production-ready without staff supplying/designating approved content. The system now rejects missing banks and never fills them with another Force�s questions. The DB test matrix uses isolated rollback bank fixtures to verify all these flows; it does not claim that missing production curriculum exists.

## Verification results

The matrix below ran on the hosted database against actual builder/registration/start/payload/save/submit functions. Fixtures and Auth rows were rolled back. Each of the 36 configurations used 16 MCQs with an existing student and a student created after publication through portal_register_student: 72 attempts. Checks include automatic visibility, exact saved/payload question counts, explicit 15/30/60-minute deadline, stable resume, saved flags, clear answers, complete 16-row submission, scoring (14 correct / 2 skipped), idempotency and rejecting post-submission edits.

| Configuration | Result | Detail |
|---|---|---|
| PMA_LONG_COURSE / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PMA_LONG_COURSE / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| GDP / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| PN_CADET / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / INTELLIGENCE_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / INTELLIGENCE_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / INTELLIGENCE_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / INTELLIGENCE_NON_VERBAL / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / INTELLIGENCE_NON_VERBAL / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / INTELLIGENCE_NON_VERBAL / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / ACADEMIC_ENGLISH / 15 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / ACADEMIC_ENGLISH / 30 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| AFNS / ACADEMIC_ENGLISH / 60 min / old + registered student | PASS | 16 configured/saved/displayed/submitted; old + new student |
| Exact count mismatch rejected and entire blueprint rolled back | PASS | Invalid write rejected with no partial record |
| Wrong Force/course pair rejected | PASS | Invalid write rejected with no partial record |

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

### Registration regression

| Verification | Result |
|---|---|
| Actual registration RPC: all four course cohorts, no batch, exact roll, personal fields, initial fees, null scores/ranks | PASS |
| Invalid fee rolls back student, assignments, statistics, fee account and payment together | PASS |

### Live HTTP/Auth/browser verification

An isolated temporary course under Pakistan Army used 16 approved questions from the actual PMA bank. Two real accounts were registered through the deployed Edge Function, one before publication and one after it. The browser invoked the actual frontend testService, authenticated student UI and real exam RPCs; no examination response was mocked. One answer-save HTTP failure was intentionally injected to verify error recovery. All temporary accounts, course, test, attempts, results and extra bank mappings were removed in finally cleanup.

| Verification | Result |
|---|---|
| Live Edge/Auth registration before publication succeeds | PASS |
| Real browser testService saves and publishes exact blueprint through backend RPC | PASS |
| Live Edge/Auth registration after publication succeeds | PASS |
| Existing and newly registered students automatically see designated test | PASS |
| Existing student real HTTP start/save/submit complete | PASS |
| Student UI displays newly assigned test | PASS |
| Browser timer comes from saved 15-minute backend deadline | PASS |
| Failed save shown as unsaved; explicit retry persists answer | PASS |
| Refresh restores actual saved answer and does not reset timer | PASS |
| Confirmation dialog does not pause deadline | PASS |
| Browser submission persists all 16 questions, answers, sections, marks, elapsed time and finalized status | PASS |
| Browser has no runtime errors | PASS |

### Build and final cleanup

- PASS � TypeScript check (`npm run lint`).
- PASS � Production build (`npm run build`). Existing unrelated poster reference / bundle-size warnings remain.
- PASS � `git diff --check`.
- PASS � Three original students remain; zero temporary QA courses/accounts/test-bank fixtures; no invalid published test.
- Frontend production deployment: NOT PERFORMED. Backend changes are live; frontend changes are implemented and tested locally. No deployment destination was specified in this request.

Relevant sources: [builder](../src/features/test-builder/TestBuilderPage.tsx), [test service](../src/services/testService.ts), [runner](../src/features/exam-engine/ExamRunnerPage.tsx), [attempt service](../src/services/attemptService.ts), [question service](../src/services/questionService.ts), [DB matrix](../supabase/tests/08_exam_contract_validation.sql), [security/timing tests](../supabase/tests/09_exam_security_timing_validation.sql).
