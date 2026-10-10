# LC-159 practice/preparation import — 10 October 2026

## Actual hosted import

| Measure | Count |
| --- | ---: |
| Supplied entries | 44 |
| Verbal / Academic | 15 / 29 |
| Existing equivalent records reused | 7 |
| Newly inserted | 35 (14 Verbal, 21 Academic) |
| Held for review, outside usable question banks | 2 |
| Accepted tagged questions | 42 |
| Duplicates within this supplied dataset | 0 |
| Explanations added / updated | 35 / 7 |
| Final Verbal bank | 326 |
| Final PMA Long Course Academic bank | 1,632 |

New codes continue existing bank numbering: `v-Q313`–`v-Q326` and `PMA-LC-A-Q1612`–`PMA-LC-A-Q1632`. Existing matched codes/UUIDs remain unchanged. No existing question was deleted or consolidated.

## Reconciled duplicates

| Source | Preserved existing code | Equivalent fact |
| --- | --- | --- |
| V7 | v-Q166 | One-third of 90 = 30 |
| A1 | PMA-LC-A-Q34 | Pakistan's first Governor-General: Muhammad Ali Jinnah |
| A2 | PMA-LC-A-Q1137 | Pakistan's first Foreign Minister: Sir Muhammad Zafrulla Khan |
| A4 | PMA-LC-A-Q5 | Men's Test wicket record: Muttiah Muralitharan |
| A5 | PMA-LC-A-Q710 | Jahangir Khan: squash |
| A12 | PMA-LC-A-Q1143 | Gandhi launched/led the Civil Disobedience Movement |
| A20 | PMA-LC-A-Q1244 | Khilafat leaders: the Ali brothers |

The matched records now use the supplied statement, four options, marked answer and explanation. Existing option UUIDs were preserved by label, even where the correct answer moved to a different label. All seven had zero test-question or attempt-answer references at inspection. Historical attempt snapshots were not modified. The complete original question/option/mapping data is backed up.

Direction items with different starting directions, distances or turn order were kept separate. Questions asking a movement's date, leader and objective were also kept separate rather than merged merely because they share a topic or answer.

## Placement, tags and provenance

- Verbal entries use the existing shared `v` bank and are mapped to actual PMA Long Course ID `00000000-0000-0000-0000-000000000101`. Existing shared intelligence mappings are retained.
- Academic entries use `PMA-LC-A` and have only that active PMA course mapping. Matched Academic records' inactive legacy `PMA_LC` alias mappings were removed; no AFNS, Navy or Air Force Academic mappings were added.
- Every accepted question has persisted `LC-159` in `tags`, a display label containing `LC-159` and its provenance, `source_course = PMA Long Course 159`, an appropriate `source_type`, and a stable source reference.
- The 22 accepted entries before the Top 20 use **Practice — based on LC-159 reported topics**. The supplied Top 20 use **LC-159 preparation**. Neither group is claimed to contain confirmed examination questions.
- The shared QuestionStatement component displays the tag inline beside the statement, followed by muted provenance. Existing bank/author previews, builder previews, active exam statements and submitted reviews already use this component.
- Existing safe payload/snapshot functions persist the display label. No exam logic, timers, permissions or scoring functions were changed.

## Held review items

Both items are saved as `REVIEW_REQUIRED` in staff-only `question_import_items`, with their original source payload and reason, and no question-bank UUID. Students cannot read this table. No new review page or approval workflow was introduced.

- **Academic Q7 — Hajj obligation year:** scholarly datings differ (including 5, 6, 9 and 10 AH). The supplied qualifier supports one view, but the user explicitly requested disputed answers be held before import. [Islam Q&A acknowledges differing datings](https://islamqa.info/en/answers/109291).
- **Academic Q9 — Gwadar purchase-price currency:** supplied references conflict between US dollars and pounds; the MUSLIM Institute reference could not be retrieved for verification. Hold pending an authoritative academy reference. No price assertion was inserted into the usable bank.

## Answer verification references

Arithmetic, directions and operator precedence were solved directly; all supplied accepted keys are correct. Source markup/headings were excluded from student-facing statements. No accepted answer was changed.

Historical and factual checks used primary/reference sources including [Pakistan MOFA's former ministers](https://mofa.gov.pk/profiles/types/former-foreign-ministers?page=2), [Radio Pakistan's dated AJK inauguration](https://radio.gov.pk/24-09-2026/dr-najeeb-naqi-sworn-in-as-ajk-president), [ICC's 800-wicket record](https://www.icc-cricket.com/news/muttiah-muralitharans-rise-to-the-top-of-the-world), [Smithsonian's snake hearing explanation](https://nationalzoo.si.edu/animals/news/do-snakes-have-ears-and-other-sensational-serpent-questions), [Nehru Memorial's book record](https://nehruportal.nic.in/discovery-india-1), [Government of India's Gandhi chronology](https://gandhismriti.gov.in/more/chronology-mahatma-gandhi), [India's Swadeshi history](https://www.pib.gov.in/PressNoteDetails.aspx?ModuleId=3&NoteId=155910&lang=1&reg=3), [NPS's civil-rights history](https://www.nps.gov/subjects/civilrights/martin-luther-king.htm), [NPS's suffragette explanation](https://www.nps.gov/articles/suffragistvssuffragette.htm) and [Mandela Foundation history](https://www.nelsonmandela.org/facing-down-the-enemy-1944-to-1962). Academic Q6 remains explicitly anchored to 9 October 2026.

## Backup and recovery

Local backup: `D:/Ai Agents/Shuja Forces Software/scratch/lc159-20261010-backup.json` — 1,923 original questions, 7,692 options and 4,470 course mappings, including codes, explanations, tags and provenance. It is deliberately excluded from Git because it contains answer keys. Recovery requires a staff-controlled transactional restore of the affected UUIDs/options/mappings; the JSON is not a complete database or Auth/storage backup. Retain it separately if the workspace is cleaned.

Source and stable import manifests are in `supabase/imports/20261010_lc159_practice_preparation_{source,plan}.json`. Applied migration: `20261010000057_import_lc159_practice_preparation.sql`. Replaying the identical manifest skips its already-accounted items; a changed manifest under the same key is rejected.

## Verification

| Check | Result |
| --- | --- |
| All 44 source entries accounted for | PASS |
| Four exact supplied choices, one correct key, nonblank explanation | PASS |
| Correct Verbal/PMA Academic bank and course mappings | PASS |
| Existing matched UUIDs/codes and option UUIDs preserved | PASS |
| Tags/provenance returned by staff catalog | PASS |
| Actual desktop/mobile bank previews: both provenance groups, answers, explanations and refresh | PASS |
| New PMA backend registration and automatic test eligibility | PASS |
| Active student payload contains tags, hides keys/explanations | PASS |
| Saved attempt snapshot/resume preserves provenance | PASS |
| Submission/review retains tags, keys and explanations | PASS |
| Student RLS denies import/review staging | PASS |
| Identical second import: no duplicate IDs, counts or timestamp changes | PASS |
| Other banks, real student/test/attempt counts and historical snapshots unchanged | PASS |
| TypeScript and production build | PASS — existing asset/chunk warnings |
| Disputed Academic Q7/Q9 imported as usable questions | HELD FOR REVIEW |

Mutation verification used dedicated rollback fixtures. Hosted import applied. Frontend deployment was not performed.
