# Test system initial audit � 9 October 2026

Read-only audit completed before code or database changes for this request. Hosted DB, SQL functions, RLS, builder/services/runner inspected.

All nine published tests target Pakistan Army / PMA_LONG_COURSE via test_eligible_courses; tests.force_id and course_id themselves are NULL. All three existing active students match this course and currently have nine assignments/pending tests each. Registration triggers automatically create assignments for this exact force/course. This design intentionally uses course eligibility within each Force; selecting all courses under a Force reaches all those students. Duplicate PMA course IDs exist and are not interchangeable.

| Test | DB total minutes | Section minutes V / NV / Academic | Configured / saved questions V / NV / Academic | Actual banks by section |
|---|---:|---|---|---|
| demo test 01 for pMA | 6 | 3 / 2 / 1 | 10/10 / 6/6 / 10/10 | Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Academic Test: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL |
| demo pma 2 | 3 | 1 / 1 / 1 | 8/8 / 6/6 / 1/1 | Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Academic Test: INTELLIGENCE_VERBAL |
| demo 3 pma | 3 | 1 / 1 / 1 | 1/1 / 1/1 / 1/1 | Verbal Intelligence: INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL; Academic Test: ACADEMIC_PHYSICS |
| pma demo 4 | 3 | 1 / 1 / 1 | 10/10 / 6/6 / 3/3 | Verbal Intelligence: INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL; Academic Test: ACADEMIC_PHYSICS |
| pma 5 | 90 | 30 / 30 / 30 | 57/57 / 10/10 / 50/50 | Verbal Intelligence: INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL; Academic Test: ACADEMIC_PHYSICS, GENERAL_KNOWLEDGE |
| demo 112 | 90 | 30 / 30 / 30 | 13/13 / 1/1 / 2/2 | Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL; Academic Test: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL |
| boss pma | 3 | 1 / 1 / 1 | 10/10 / 5/5 / 2/2 | Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL; Academic Test: INTELLIGENCE_NON_VERBAL, INTELLIGENCE_VERBAL |
| test 1 | 3 | 1 / 1 / 1 | 8/8 / 1/1 / 1/1 | Verbal Intelligence: INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL; Academic Test: ACADEMIC_PHYSICS |
| test 22 | 3 | 1 / 1 / 1 | 8/8 / 1/1 / 1/1 | Verbal Intelligence: INTELLIGENCE_VERBAL; Non-Verbal Intelligence: INTELLIGENCE_NON_VERBAL; Academic Test: ACADEMIC_PHYSICS |

Confirmed failures:

- Every section lacks persisted subject_id; no test_section_subjects table exists. Intelligence sections are mixed in several tests; Academic includes intelligence questions in several tests. Course membership is not enforced for assigned questions. PMA has only 19 course-linked Verbal questions while pma 5 selects 57. No course-linked banks currently exist for Air Force/Navy; never borrow PMA/AFNS questions to fill these.
- Builder classifies bank from question text/code/tags and auto allocation ignores selected courses. Multi-subject metadata writes target missing schema. Saving/editing spans non-atomic requests. Publish references missing is_enabled column; frontend catches failure and directly publishes anyway, then hides publish errors. Publish count condition permits extra questions. Generator silently reduces configured count to available count, ignores Force parameter, uses random selection; frontend retries without course filter. Subject resolver can choose the first unrelated subject.
- Backend start saves selected IDs and overall DB duration but includes 30-minute fallbacks. Runner initial timer 1800, section fallback 30, max fallback180, expired deadline rejected then replaced by fresh configured time; local time rather than server offset; timer pauses while dialogs open; section advance happens optimistically and frontend fabricates 20-minute success on RPC failure.
- Actual save_answer RPC checks overall deadline and test membership but no active section or section deadline; prior ownership guards were attached to differently named functions. Frontend converts failed answer save into successful sessionStorage-only save. Clear answer sends invalid empty UUID. Submission does not flush pending saves. advance_section permits revisiting any section and rewrites deadline on conflict.
- Backend scoring uses current mutable section composition/answer keys, not immutable attempt selection. Question ordering is saved but edits can change payload/scoring. No row recorded for skipped questions. Submission is otherwise transactional/idempotent and persists per-section totals, marks, status and elapsed time.
- RLS keeps question_options / questions staff-only. Safe RPC removes answer keys. Preserve this. Student direct test_sections policy still expects batch enrollment, mismatching automatic individual assignments.

Fix policy: retain configured counts/durations and authored question choices. Do not invent replacements for invalid published tests. Invalid tests must be withheld until staff correct exact bank selections; preserve their records for editing. Validate publication and start through DB, transactional composition writes, immutable attempt snapshot, section/overall deadlines, authenticated answer saving, and persisted complete submission.

Final result-review trace also confirmed get_result_detail returned is_correct option flags after submission when show_answer_review was enabled. The follow-up privacy migration closes this student path while retaining saved result totals and section summaries.
