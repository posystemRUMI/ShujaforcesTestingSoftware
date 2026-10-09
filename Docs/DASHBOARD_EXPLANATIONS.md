# Dashboard and saved answer explanations

Removed the 30 Days Score Trend and Recent Submissions widgets from the shared Admin/Teacher dashboard, including their fixture data, selection state, filtering and unused imports. The branch summary uses the available width and stacks its cards below the desktop breakpoint.

Authorized staff question previews, completed practice reviews and finalized original-test reviews now show the correct answer followed by the saved database explanation. Active original-exam payloads remain free of answers and explanations. Existing ownership, finalized-result and RLS checks are unchanged.

The hosted audit found 2,401 bank questions, all with nonblank, single-line explanations. **New bank explanations added: 0.** All existing question text, options, marked correct answers and explanations were preserved and compared with the pre-change snapshot.

Migration `20261009000034_saved_review_explanations.sql` was applied to hosted Supabase. It restored **25 missing explanation entries in two older attempt snapshots**, copying existing bank explanations only where the question ID and stored correct answer match. It preserves existing review explanations and immutable attempt questions/options/keys. These are restored result metadata, not newly authored bank explanations.

Browser verification exposed a teacher question-bank query timeout. The loader now fetches paginated questions, options and course mappings separately and resolves subject/visible author data once. Every read continues through the same authenticated table policies; no security policy or permission was relaxed.

Verification evidence is retained locally under the ignored `qa-artifacts` directory:

- `explanation-persistence-verification.json`: bank content unchanged; zero missing explanations; 25 saved review explanations restored.
- `explanation-review-security-validation.json`: seven hosted checks passed for active-exam privacy, finalized owner review, snapshot immutability, other-student denial, invalidated-result denial, authenticated RLS and anonymous denial. Test transactions were rolled back.
- `dashboard-explanation-browser-verification.json`: all 12 checks passed. Admin and Teacher dashboards reflow without horizontal overflow at 1440, 1024, 768 and 390 pixels; both roles' answer previews retain correct answers/explanations after refresh; both existing student reviews retain all 6 and 19 saved explanations after refresh. Safe exam payloads expose neither explanations nor correct-answer flags.

TypeScript (`npm run lint`), production build and diff whitespace checks pass. Existing build warnings concern the academy-poster asset and large bundles. Backend migration is applied live; frontend production deployment has not been performed.
