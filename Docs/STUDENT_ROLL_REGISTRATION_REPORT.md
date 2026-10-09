# Sequential student rolls and editable email suggestions

Applied to the connected hosted Supabase database on 10 October 2026.

The registration form previously generated a random year-prefixed roll number and derived the email from that entire roll string. It now requests suggestions from a staff-authorized backend RPC. Navy starts at `SFA-NAVY-1`, followed by `SFA-NAVY-2` and onwards. Suggestions use the first name and numeric suffix: `ali.1@gmail.com`, `ali.23@gmail.com`.

The email remains editable. Once typed personally, it is not overwritten by name changes or Auto-Suggest. The actual entered email is passed through the existing Edge Function and saved in Supabase Auth and the linked profile. No Gmail-only validation was added. Clear/Reset re-enables suggestions.

Database counters use transactional row locks. Every new student insert must use the next number; skipped or stale rolls are rejected with the expected next number. The counter advances only when the student transaction succeeds. Deleted numbers are not reused. Unchanged historical rolls are preserved when editing other fields. Roll reassignments also obey the sequence.

Existing prefixes are retained: PMA `SFA-PMA`, AFNS `SFA-AFNS`, Air Force `SFA-PAF`, Navy `SFA-NAVY`. The two existing students retain `SFA-PMA-1` and `SFA-AFNS-1`, so their next numbers are 2. Navy and Air Force currently begin at 1. Existing students were not renumbered or deleted.

| Verification | Result |
| --- | --- |
| Hosted suggestions for suffixes 1 and 23 | PASS |
| Real registration RPC saves consecutive Navy rolls 1 and 2 | PASS |
| Personal email preserved in Auth/profile and student linkage | PASS |
| Skipped/duplicate rolls rejected | PASS |
| Failed registration does not consume a number or leave student data | PASS |
| Non-staff suggestion RPC access denied | PASS |
| Browser suggestions update until email is manually edited | PASS |
| Personal email survives name changes and Auto-Suggest | PASS |
| Browser reload retrieves the same unconsumed next number | PASS |
| Desktop and mobile layout; no student photo upload | PASS |
| Navy Academic exam/registration regression | PASS; existing full Intelligence shortage remains BLOCKED |
| TypeScript and production build | PASS |
| Temporary registration and exam records removed | PASS; transactions rolled back |
| Final existing students / temporary Auth accounts | 2 / 0 |
| Final Navy counter / next number | 0 / 1 |
| Frontend deployment | NOT PERFORMED |

Changes are in migration `20261010000050_sequential_student_rolls.sql`, the registration service and registration form. Hosted backend enforcement applies to the existing registration Edge Function without replacing its authentication or fee logic. Original roll records and registration-function definitions were exported to the ignored private file `scratch/roll-backup.private.json`; verification outputs and responsive screenshots are under `qa-artifacts/roll-*`. These exports are not a complete project backup.

Production build retains the existing missing academy-poster and large-chunk warnings.
