# Configurable Navy test sections

Implemented 10 October 2026 in the existing test builder and connected hosted Supabase database.

## Change

The previous PN Cadet database pattern combined Intelligence into 40 questions with fixed 25/15 subject quotas and locked both that section and Academic to 25 minutes and 40 questions. Its publication validator rejected overrides.

New Navy blueprints now contain three separate sections:

| Section | Default MCQs | Initial minutes | Allowed changes |
| --- | ---: | ---: | --- |
| Verbal Intelligence | 25 | 25 | Question count and duration |
| Non-Verbal Intelligence | 15 | 25 | Question count and duration |
| Academic | 40 | 25 | Question count and duration |

Each duration is an independent editable default, not a fixed examination rule. Positive integer values are required. The total duration is the sum of the chosen section durations. Bank availability still limits which questions can actually be selected; insufficient banks cause an error rather than substitution.

The hosted pattern enables all six controls. The frontend default configuration matches it. The authorized master-pattern writer can also save different default counts and durations while retaining authoritative section/bank bindings. Publication still enforces exact selected-question counts, explicit timing, valid approved MCQs, course eligibility, separate Verbal/Non-Verbal banks and PN Cadet-only Academic questions.

Existing tests, attempts and snapshots were not rewritten. Legacy combined Intelligence remains supported for historical tests. No pages or question records were added.

## Backend application and recovery

Applied `supabase/migrations/20261010000053_configurable_navy_sections.sql` to the hosted project. Before applying it, the affected Navy pattern and both replaced function definitions were backed up locally to `scratch/navy-config-before.private.json` (ignored by Git). This is an affected-configuration backup, not a full database backup; restoring it also requires reverting the matching frontend defaults.

## Verification

| Check | Result |
| --- | --- |
| Hosted defaults: 25 Verbal / 15 Non-Verbal / 40 Academic, all editable | PASS |
| Default composition publishes exactly 80 approved questions | PASS |
| Custom composition: 27 / 17 / 41 questions, 30 / 45 / 60 minutes | PASS |
| Exact database counts, section timings and 135-minute total | PASS |
| Independent runner timers; start/resume preserves saved deadlines | PASS |
| Backend registration and automatic Navy student eligibility | PASS |
| Submission saves 85 answers, marks and three section results; dashboard updates | PASS |
| Wrong-bank selections, count mismatch and zero duration rejected | PASS |
| Answer keys/explanations hidden during active exams; student staff-operation denial | PASS |
| Existing Navy regression: old/new eligibility, results, leaderboard, ownership and RLS | PASS |
| Admin and teacher builder at 1440px and 390px: editable controls, step persistence, refreshed defaults, no horizontal overflow | PASS |
| TypeScript (`npm run lint`) | PASS |
| Production build (`npm run build`) | PASS |

Hosted verification used `supabase/tests/20_configurable_navy_sections.sql` and the updated existing Navy regression suite. All temporary test/student/Auth/attempt/result records rolled back. Browser checks did not save tests. The build retains existing warnings concerning the academy-poster asset and large chunks.

Frontend deployment was not performed by this task.
