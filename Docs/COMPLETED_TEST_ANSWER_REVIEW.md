# Completed-test answer review

The completed original-test result page now shows Questions & Answer Review immediately below Score & Threshold Benchmark. It shows the saved question/options, the correct answer, the student's answer, correct/incorrect/skipped status, diagrams and captured explanations where available. Filters, hide/show and refresh were verified in the browser.

The new request authorizes correct-answer disclosure for the active student's own valid finalized results. Hosted migration `20261009000033_finalized_answer_review.sql` implements that policy. Active exams and raw question banks remain private. Anonymous requests, another student's result and invalidated results are denied. Review uses immutable attempt questions/options/answer keys and privately captured explanation metadata, rather than current bank contents. Repeated snapshot capture cannot overwrite original review metadata. Older snapshots can show saved questions/keys but may lack historical explanations; the backend does not fabricate them from later bank edits.

Verification:

- Seven hosted rollback checks passed: no active-exam review leakage, complete saved question/status/answer mapping, immutability after bank edits, cross-student denial, invalidated-result denial, actual authenticated RLS and anonymous denial.
- The 14-case exam security/timing regression passed with its finalized-result assertion updated for the newly authorized review policy.
- Actual browser registration, a three-question exam submission (correct, incorrect and skipped), answer labels, placement beneath the benchmark, filters, hide/show, refresh and no runtime errors passed.
- Existing hosted results were checked for complete saved review counts and enabled review.
- TypeScript checks, production build and whitespace diff checks passed. Existing asset/bundle build warnings remain.

The temporary review student, Auth account, test, answers, result, fee account and automatic assignments were removed. Two real students/tests appeared after the previous reset and during verification; they were preserved. The prior reset's zero-count report describes its completion time, not a permanent restriction on new registrations/tests.

Backend changes are applied live. The updated frontend is built and tested locally against hosted Supabase; production frontend deployment has not been performed.
