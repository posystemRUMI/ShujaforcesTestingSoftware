# Pakistan Navy Academic attachment import — 10 October 2026

Source: `C:/Users/user/Downloads/PAK_Navy_Academic_MCQs.md`.

## Counts

| Outcome | Entries |
| --- | ---: |
| Imported new questions | 534 |
| Exact duplicates skipped | 215 |
| — Matching existing Navy Academic records | 13 |
| — Repetitions within the attachment | 202 |
| Excluded unresolved Entry 475 | 1 |
| Total source entries accounted for | 750 |

The Completed MCQs section independently parsed as exactly 749 entries, with four distinct options, exactly one correct option and a nonblank explanation each. Entry 475 is outside that section and excluded. Reference lists, the resolution audit and repeated-question audit were not treated as MCQs.

Deduplication compares the complete statement, all four option texts and correct answer text; option order does not determine duplication. Unicode/quotation/whitespace formatting and case are normalized for comparison. Conditions, dates, quantities and option wording remain significant. Explanations are not used as a reason to create another otherwise identical MCQ. Skipped duplicates preserve their existing explanation and record unchanged. Every skipped entry and its canonical UUID/code or source entry is recorded in the import plan.

## Persistence and numbering

- Existing bank: `PN-CADET-A`, 749 records before import.
- Existing actual course: `PN_CADET`, ID `00000000-0000-0000-0000-000000000103`, Pakistan Navy force ID `00000000-0000-0000-0000-000000000003`.
- Final bank: **1,283 records**.
- New codes: **PN-CADET-A-Q750 through PN-CADET-A-Q1283**, assigned by the existing collision-safe bank-code trigger. Document Entry IDs are only source references.
- All new records use existing Academic subjects and only the PN Cadet course mapping. Reasoning items remain in Navy Academic as requested; none were assigned to Verbal, Army or Air Force banks.
- New statements, all four labelled options, correct markers and explanations match the completed attachment entries exactly after removing Markdown presentation escaping/formatting. Stated dates and conditions remain in their text.
- Editorial status, reconstruction provenance and per-entry references are retained as source metadata. New records are described as Pakistan Navy preparation; no LC-159 tag or verified-exam-recall claim was added.
- Existing question UUIDs, codes, options, explanations, mappings and other metadata were not changed.

Applied migration: `supabase/migrations/20261010000058_import_navy_attachment.sql`. Full parsed source and stable UUID/duplicate ledger are in `supabase/imports/20261010_navy_attachment_{source,plan}.json`.

The existing staff-only `question_import_items` table records all 749 completed source entries and their INSERT/DUPLICATE outcomes. Repeating the identical manifest safely skips previously accounted entries; a changed manifest under the same key is rejected. Existing RLS, exam logic and frontend/backend access controls were preserved.

## Backup

`D:/Ai Agents/Shuja Forces Software/scratch/navy-attachment-20261010-backup.json` contains all 749 original Navy Academic questions, options and mappings, plus other-bank fingerprints. It is excluded from Git because it contains answer keys. This is a question-bank backup, not a complete Auth/storage/database backup. Preserve it separately before cleaning the workspace.

## Verification

| Check | Result |
| --- | --- |
| 749 completed parsed, Entry 475 excluded, source numbering restarts handled | PASS |
| 534 imported, 215 exact duplicates skipped | PASS |
| Every new statement, option, key and explanation preserved | PASS |
| Every new mapping is PN Cadet Academic only | PASS |
| Original 749 question/option/mapping records unchanged | PASS |
| Army, Air Force, Verbal, Non-Verbal and other banks unchanged | PASS |
| Unique continuous codes Q1–Q1283; new numbering starts Q750 | PASS |
| Actual staff bank RPC: filters, total 1283, first/final pages and last-code search | PASS |
| Real builder blueprint RPC saves three imported questions | PASS — rollback-only QA test |
| Actual browser bank filters/previews, refresh, desktop/mobile and manual builder selection | PASS |
| TypeScript (`npm run lint`) | PASS |
| Identical second import does not create duplicates | PASS |

Temporary database mutation verification used rollback fixtures. No real student, test, attempt, fee or attendance record was changed for QA. Hosted database import applied; frontend deployment was not performed. No frontend source changes were required for this import.
