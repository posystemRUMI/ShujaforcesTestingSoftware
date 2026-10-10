# Random automatic question selection

The builder's all-section allocation and per-section Auto-Fill previously selected the first eligible records. The hosted `generate_test_section_questions` RPC also sorted eligible candidates by question code before applying its limit.

Both paths now sample randomly. The builder uses Fisher-Yates on a copy of the filtered bank before taking the configured number, preserving subject quotas and shuffling the quota-selected result. Existing cross-section duplicate exclusion remains intact. Manual selection and list sorting are unchanged.

Applied hosted migration `20261010000056_random_test_question_selection.sql` changes the generator's candidate ordering to `random()` while retaining staff authorization, test ownership, draft-only generation, bank/course eligibility, valid options, exact configured counts and cross-section duplicate exclusion. Existing published tests and attempts were not regenerated. Saved mappings and exam snapshots continue to preserve the selected questions on refresh/resume.

Verification:

- Hosted rollback regression: eight draws per available bank produced varying selections with four unique saved questions, correct course/subject eligibility, unchanged section timing and atomic rejection of count mismatches. All nine bank/course combinations for AFNS, PMA Long Course and PN Cadet passed.
- CAE and Airman each have zero approved eligible questions in the current database: live sampling for those courses is BLOCKED by bank availability. The same shared builder and hosted generator code applies when those banks are populated.
- Actual frontend allocator exercised for 100 draws: varying samples, exact 16-question counts, uniqueness, exact 5/3 subject quotas and no mutation of the source bank passed.
- Actual authenticated browser builder: repeated Auto-Allocate All Sections changed the selected questions, retained exact four-question counts in all three Navy sections, and per-section Auto-Fill worked. No test was saved for browser QA.
- Existing hosted configurable Navy regression passed: configured counts/timings, saved selections, eligibility, resume deadlines, submission, dashboard completion and answer-key privacy.
- TypeScript and production build passed; existing poster-asset and chunk-size warnings remain.

All hosted mutation tests used rollback-only fixtures. No real test or student attempt was changed for verification. Hosted migration applied; frontend deployment not performed.
