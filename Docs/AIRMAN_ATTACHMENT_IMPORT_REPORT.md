# Airman Academic attachment import — 11 October 2026

Applied to the connected hosted Supabase project `cxnfxxtlnsypajwqmfni`.

| Outcome | Count |
| --- | ---: |
| Completed source MCQs independently parsed | 692 |
| Imported | 692 |
| Existing-bank duplicates skipped | 0 |
| Within-attachment duplicates skipped | 0 |
| Failed | 0 |
| English | 305 |
| Physics and related science | 290 |
| Mathematics | 97 |

Only the completed question sections were parsed. Audit tables, references, notes and duplicate-removal summaries were excluded. The document's 119 previously removed duplicates are already absent from its 692 completed entries; they are not additional skipped questions in this import.

## Placement and preservation

- Existing course: `PAF_AIRMEN` / Airman, UUID `20000000-0000-0000-0000-000000000006`; existing Pakistan Air Force relationship.
- Existing bank convention: `PAF-AIRMEN-A`; previously empty. Final count: **692**. Codes **PAF-AIRMEN-A-Q1 through PAF-AIRMEN-A-Q692**, assigned by the existing database numbering trigger independently of source numbering.
- Existing subjects: `ACADEMIC_ENGLISH`, `ACADEMIC_PHYSICS`, `ACADEMIC_MATH`. The document's three completed sections determine these classifications.
- Every question has exactly four distinct options, exactly one supplied correct answer, its exact supplied explanation and statement/conditions, approved usable status and exactly one course mapping: Airman.
- Duplicate comparison uses normalized statement, the four option texts independent of option order, and correct-answer text. No matching completed entries were found in the attachment or the existing Airman bank. Existing questions were not overwritten or copied from another course bank.
- Source document SHA-256, source IDs, document numbers and condition notes are persisted as provenance, separate from system codes. Full stable source manifest: `supabase/imports/20261011_airman_attachment.json`.
- Other bank counts remained unchanged: Verbal 326, Non-Verbal 20, AFNS Academic 724, PMA Long Course Academic 1,632, PN Cadet Academic 1,283. The migration inserts only new Airman records and source ledger entries; it contains no existing-question update/deletion operations.

## Implementation

Migration `supabase/migrations/20261011000059_import_airman_attachment.sql` was applied to the hosted database transactionally, using existing questions/options/course mapping tables and the staff-only import ledger. Existing RLS and answer-key access controls remain unchanged.

The existing test builder's official Airman fallback sections had no explicit subject mappings and were not recognized by its subject matcher. A small frontend fix resolves English, Physics and Mathematics sections against the existing subject codes while retaining the prior course-eligibility filter. No routes, scoring, timer or exam persistence rules were changed.

Backup of the affected pre-import empty bank and other-bank inventory: `scratch/airman-attachment-20261011-backup.json` (local, ignored by Git). This is an import-scope backup, not a full database backup. Its question/options/mapping arrays are empty because the Airman bank was empty.

## Verification

| Check | Result |
| --- | --- |
| All 692 source entries accounted for and exact text/options/keys/explanations persisted | PASS |
| Existing subject mappings and Airman-only course ownership | PASS |
| Sequential unique codes; 2,768 options and 692 course mappings | PASS |
| Hosted staff question-bank filtering, total counts, pagination and final-code search | PASS |
| Actual backend builder saves six imported questions across three Academic sections | PASS |
| Fresh Airman registration automatically eligible for temporary test | PASS |
| Safe active student exam receives saved questions without keys or explanations | PASS |
| Browser question-bank filtering, preview, refresh, desktop/mobile overflow and builder selection | PASS |
| Replaying the migration produces no duplicates or record changes | PASS |
| Other bank counts unchanged | PASS |
| TypeScript (`npm run lint`) and production build (`npm run build`) | PASS |

Backend mutation checks are in `supabase/tests/26_airman_attachment_import.sql`; all temporary registrations, Auth users, tests and attempts roll back. Browser checks do not save a test or change real academy records.

Existing build warnings remain for the unresolved academy poster asset and large bundled chunks. Academic import completeness does not establish availability of separate Airman Intelligence questions.

**Deployment:** hosted database import complete. The frontend builder matcher fix is local; no frontend deployment was performed.
