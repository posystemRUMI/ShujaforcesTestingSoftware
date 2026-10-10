# PAF Verbal attachment import — 11 October 2026

Applied to hosted Supabase project `cxnfxxtlnsypajwqmfni`.

| Outcome | Count |
| --- | ---: |
| Completed MCQs independently parsed | 282 |
| Imported | 270 |
| Saved-question duplicates skipped | 12 |
| Additional duplicates within completed attachment | 0 |
| Failed | 0 |

Only `## MCQs` was processed. Editorial text, duplicate audit, references and import notes were excluded. The document's 28 previously removed duplicates are already absent from the 282 completed entries and are not counted again.

## Bank and eligibility

The actual system uses the `INTELLIGENCE_VERBAL` subject (`9f9debd0-3e40-4f38-9067-2d8005313de2`) and sequential `v-Q<number>` codes; force/course mappings scope the bank. Existing Verbal count was 326. The 270 new questions received **v-Q327 through v-Q596** from the existing numbering trigger. Final global Verbal count: 596; PAF-filtered Verbal count: 270 unique questions, not 540 despite two course mappings each.

Each imported question has exactly four distinct supplied options, exactly one correct answer, its exact supplied explanation, approved status, and only these existing active PAF mappings:

- `PAF_CAE` / CAE: `20000000-0000-0000-0000-000000000003`.
- `PAF_AIRMEN` / Airman: `20000000-0000-0000-0000-000000000006`.

Both courses belong to the existing Pakistan Air Force record `00000000-0000-0000-0000-000000000002`. No inactive/removed courses were re-enabled. No Army, Navy, Academic or Non-Verbal mapping was added to the imported questions.

Duplicate comparison normalizes case, Unicode and whitespace, comparing statement, all four option texts independent of option order, and correct-answer text against saved questions across banks. No duplicate records were overwritten or remapped. Consequently, skipped questions remain available under their original eligibility rather than being added to PAF.

| Source MCQ | Existing duplicate code |
| --- | --- |
| 111 | PN-CADET-A-Q95 |
| 112 | PN-CADET-A-Q350 |
| 115 | PN-CADET-A-Q353 |
| 117 | PMA-LC-A-Q415 |
| 119 | PMA-LC-A-Q386 |
| 125 | PN-CADET-A-Q215 |
| 129 | PN-CADET-A-Q368 |
| 130 | PN-CADET-A-Q360 |
| 131 | PN-CADET-A-Q285 |
| 135 | PN-CADET-A-Q776 |
| 253 | PN-CADET-A-Q480 |
| 270 | PN-CADET-A-Q327 |

## Implementation and preservation

Stable complete source manifest and per-item outcomes: `supabase/imports/20261011_paf_verbal_attachment.json`. Source numbers and document SHA-256 are provenance, not database codes. Migration `supabase/migrations/20261011000060_import_paf_verbal_attachment.sql` transactionally persists questions, options, course mappings and import ledger entries. Rerunning the migration leaves saved question, option and mapping records identical.

The existing editor automatically added Army/Navy courses to intelligence questions. A narrowly scoped backend safeguard now retains the PAF-only mappings of **only records inserted by this import**, identified by its persisted ledger, and rejects attempts to map them to foreign courses. Every other question retains the original editor branch. Correct-answer validation and staff authorization remain intact.

The existing Airman/CAE `Intelligence` fallback sections were not recognized by the frontend subject matcher. They now accept existing Intelligence subject codes after the existing strict selected-course checks. No question ordering, timing, scoring, attempt handling or active-answer visibility was changed.

Local backup: `scratch/paf-verbal-20261011-backup.json`, containing all pre-import question records, options and course mappings. It is ignored by Git and is not a full database/Auth/storage backup. All **4,677** existing questions and their options/mappings were compared against this backup and remain identical. No real student, test, attempt or financial records were modified for verification.

## Verification

| Check | Result |
| --- | --- |
| All 282 completed entries accounted for | PASS |
| Exact four options, key, explanation and statement persisted for all 270 inserts | PASS |
| Unique sequential v-Q codes | PASS |
| PAF-only eligibility; Army/Navy rejected | PASS |
| Airman and CAE bank filters show 270 unique questions | PASS |
| Actual backend builder saves selected imported Verbal questions for each PAF course | PASS |
| Fresh Airman and CAE registration automatically eligible for temporary tests | PASS |
| Active student exam receives questions without keys or explanations | PASS |
| Editing imported questions preserves PAF isolation; foreign-course edits rejected | PASS |
| Browser previews, saved explanations after refresh, mobile overflow and manual selection in both builders | PASS |
| Existing questions/options/mappings unchanged | PASS |
| Second import run produces no duplicates or changes | PASS |
| TypeScript and production build (`npm run build`) | PASS |

Hosted integration tests: `supabase/tests/27_paf_verbal_attachment_import.sql`. All temporary Auth users, student registrations, tests and attempts roll back; browser verification saves no test.

Existing build warnings remain for the academy poster asset and large bundle chunks. Hosted database changes are applied. Frontend changes are local; no frontend deployment was performed.
