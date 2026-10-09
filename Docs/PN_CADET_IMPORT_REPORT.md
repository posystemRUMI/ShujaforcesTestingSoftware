# PN Cadet question import and exam pattern verification

Completed against the connected hosted Supabase database on 9–10 October 2026. All accepted supplied questions were imported into **PN Cadet Academic**, as explicitly confirmed by the user. No supplied reasoning entries were imported into shared Verbal or Non-Verbal.

## Initial audit

The existing database contained **2,656 questions**: 311 shared Verbal, 10 shared Non-Verbal, 724 AFNS Academic and 1,611 PMA Long Course Academic. PN Cadet Academic contained **zero** questions. Existing student/test/result counts were **2 / 2 / 2**.

The Navy frontend pattern still specified 20-minute stages, the combined Intelligence allocator did not enforce the required subject split, and the legacy master-template table was absent in this hosted database. The Navy configuration now uses a real DB pattern and authorized save RPC. Custom section titles could previously bypass an Academic-bank check; enforcement now uses the section code and bank/category together. A database trigger also prevents relabeling shared intelligence records as Academic.

## Source accounting and final inventory

| Source | Independently parsed entries |
| --- | ---: |
| Attachment F1, block 1 | 211 |
| Attachment F2, blocks 1–5 | 397 + 77 + 250 + 70 + 211 = 1,005 |
| Both attachments | 1,216 |
| Inline repeated ranges, including the repeated 351–437 range | 881 |
| All occurrences | **2,097** |

Repeated numbering starts a new source block. F1/F2 identify the attachments; B identifies the block and Q the source number. INLINE-B identifies an inline range. Every occurrence is recorded in [the source ledger](../supabase/imports/20261009_pn_cadet_source_ledger.csv).

| Outcome | Count |
| --- | ---: |
| Newly inserted canonical questions | **749** |
| Valid duplicate occurrences, attachments | 392 |
| Valid duplicate occurrences, inline | 812 |
| Total valid duplicate occurrences | **1,204** |
| Unresolved attachment occurrences | 75 |
| Unresolved inline occurrences of those source items | 69 |
| Total unresolved occurrences | **144** |
| Matched pre-existing PN Academic questions | 0 |
| New import equivalents consolidated after staging | 16 |
| Pre-existing questions deleted or consolidated | 0 |
| New explanations saved | **749** |
| Pre-existing explanations changed | 0 |

749 + 1,204 + 144 = 2,097. Unresolved counts include repeated occurrences and must not be read as counts of unique unresolved questions. The initial staging set had 765 records; 16 equivalent new records were consolidated, their audit references moved to the canonical UUID, and all source references retained. No historical test/attempt references pointed to those staging duplicates.

Final Navy codes are **PN-CADET-A-Q1 through PN-CADET-A-Q749**; the next available number is **750**. All 749 have four distinct options, one correct option, a saved question-specific explanation, APPROVED status and only the actual PN Cadet Academic course mapping. Science questions are organized using Chemistry/Biology as well as existing Academic subjects.

| Bank | Final unique questions |
| --- | ---: |
| Shared Verbal | 311 |
| Shared Non-Verbal | 10 |
| AFNS Academic | 724 |
| PMA Long Course Academic | 1,611 |
| PN Cadet Academic | 749 |
| Total | **3,405** |
| Active / inactive | **3,318 / 87** |

The 321 existing shared intelligence questions are mapped to PN Cadet without copying their UUIDs or counting them twice. The staff question writer includes PN Cadet in shared intelligence mappings for new and edited records. The active course catalog remains PMA Long Course, AFNS, CAE, Airman and PN Cadet; unsupported historical courses remain inactive to preserve references.

## Saved Navy pattern and implementation

| Stage | Questions | Saved duration |
| --- | --- | --- |
| Intelligence | 25 shared Verbal + 15 shared Non-Verbal | **25 minutes total** |
| Academic | 40 PN Cadet Academic | **25 minutes** |

Each stage can be created separately. Selecting both stages produces 80 questions and 50 minutes across the two timed sections. The intelligence split is enforced in the builder and backend; wrong duration, replacement quotas or unrelated bank questions are rejected. Timing comes from saved backend configuration and attempt deadlines, not question counts. Refresh/resume retains the attempt and original deadline.

Staff counts and filters cover all DB records: Navy Academic shows 749 total and 50 rows on the first page; page 15 shows the last 49. Authorized answer previews display the stored answer and explanation and survive refresh. Active exam payloads omit keys and explanations. Student RLS, ownership and staff-operation denial remain enforced. Private backup/import/SQL directories are denied by the development server (HTTP 403).

Full Intelligence publication and submission are **BLOCKED**: only **10 approved Non-Verbal questions** are available, so **5 more legitimate approved Non-Verbal questions** are needed. The builder shows the shortage and the backend rejects substituting extra Verbal questions. No fake, unrelated or fallback questions were added.

## Verification results

| Check | Result | Evidence / limitation |
| --- | --- | --- |
| All original questions preserved without edits | PASS |  |
| All original options preserved without edits | PASS |  |
| All original course mappings and attempt snapshots preserved | PASS |  |
| Original student/test/result counts preserved and temporary Auth accounts removed | PASS |  |
| 749 sequential PN Academic questions with valid persisted options, keys and explanations | PASS |  |
| All 2,097 source occurrences accounted for and accepted provenance persisted | PASS |  |
| Canonical import replay makes no question, option or mapping writes | PASS |  |
| Imported questions, explanations, four distinct options, one key and PN-only Academic mappings | PASS | 749 questions |
| Navy filter counts cover every page | PASS | 749 total; 50 first page; 49 final page |
| Old and backend-registered Navy students automatically eligible | PASS | Zero fees; no manual assignments |
| Academic start/resume has exact questions, 25-minute persisted timer and no keys | PASS | 40 questions; 1,500 seconds; same attempt/deadline on resume |
| Submission, saved answers, marks, explanations and dashboard records | PASS | 40 answers; 40/40 marks; completed_tests=1 for both students |
| Cross-student result access rejected | PASS | Ownership retained |
| Backend Navy leaderboard updated | PASS | Both submitted Navy students ranked from saved results |
| Staff shared-bank writer includes Navy and preserves codes/option UUIDs | PASS | The same default course set is used for new and edited intelligence records |
| Database rejects relabeling shared Verbal as an Academic bank | PASS | Direct writes cannot bypass subject/bank consistency |
| Administrator master-pattern save uses the hosted authorized writer | PASS | Fixed banks, quotas and durations retained |
| Backend rejects wrong Academic duration | PASS | 30-minute substitution rejected |
| Backend rejects 30 Verbal + 10 Non-Verbal replacement | PASS | Requires exact 25 + 15 |
| Section-code bank enforcement survives a changed section title | PASS | Verbal questions cannot be disguised as Academic |
| Full Intelligence publication | BLOCKED | BLOCKED: 10 approved Non-Verbal available; 15 required; no fallback questions inserted |
| Actual authenticated student role retains RLS and staff-operation denial | PASS | Raw keys/private snapshots/staff configuration hidden; staff read/write RPCs denied |
| ADMIN Navy filters, counts, final page, explanations, subjects and saved pattern | PASS |  |
| ADMIN authorized answer/explanation preview, refresh and responsive bank layout | PASS |  |
| ADMIN builder exact 25/15 split, full Academic allocation and explicit Non-Verbal shortage | PASS |  |
| TEACHER Navy filters, counts, final page, explanations, subjects and saved pattern | PASS |  |
| TEACHER authorized answer/explanation preview, refresh and responsive bank layout | PASS |  |
| TEACHER builder exact 25/15 split, full Academic allocation and explicit Non-Verbal shortage | PASS |  |
| TypeScript checks, npm run lint | PASS | Completed successfully |
| Production build, npm run build | PASS | Completed successfully |
| New-student browser signup and login | NOT RUN | Registration, authenticated student RPCs and RLS were verified against the DB; browser verification used existing Admin and Teacher accounts |
| Frontend deployment | NOT PERFORMED | Built locally; no deployment claimed |

Academic verification created a student before publication and another through the real backend registration RPC after publication, both with zero registration fees and automatic eligibility. Both submitted 40-question Academic attempts with 40 saved answers and 40/40 marks. Results, explanations, dashboard completion counts and the backend leaderboard updated correctly; repeat submission was idempotent. All temporary verification accounts, fees, tests, attempts and results were transactionally rolled back. Existing students/tests/results remain **2 / 2 / 2** and temporary Navy Auth accounts remaining are **zero**.

The current frontend build emits existing warnings for a missing academy-poster asset and large chunks. Other courses' legacy master-template storage was not redesigned in this task; the absent legacy table remains a separate backend limitation. These checks establish the Navy changes listed here, not a blanket audit of every unrelated backend feature.

## Backup and recovery

Private, ignored local copies are stored under qa-artifacts/:

- navy-before.private.json — pre-change questions, options, UUIDs, codes, mappings, subjects, courses and attempt snapshots.
- navy-final.private.json — the 765-record staging state before equivalent-record consolidation.
- navy-audit-logs-before-consolidation.private.json — audit rows before consolidation.
- navy-completed.private.json — final hosted question-bank snapshot.
- navy-final-verification.json, navy-db-verification.json and navy-browser-verification.json — check evidence.

These are recoverable question-related exports, not a complete Supabase project/PITR, Auth or Storage backup. Restoring requires a deliberate transactional SQL recovery respecting current foreign keys; no one-command full restoration was claimed. Preserve these ignored files separately before removing this checkout. Student, staff, fee and storage data were not reset or deleted. All original 2,656 questions, 10,624 options, original course mappings and historical snapshots were compared with the final export and preserved.

The final canonical [JSON manifest](../supabase/imports/20261009_pn_cadet_academic.json) contains stable UUIDs, questions, options, keys, explanations, course mappings, corrections and source provenance. [The canonical SQL replay](../supabase/imports/20261009_pn_cadet_academic.sql) was run again against the hosted DB and changed no question, option or mapping row versions. Preparatory staging migrations describe the historical sequence; use the final canonical replay for an idempotent re-import.

## Corrections

The following **43 field corrections** apply to supplied source items. They do not rewrite unrelated original question-bank records. Repeated equivalent source items retain their individual ledger references to the corrected canonical question.

| Source | Field | Original | Final | Reason |
| --- | --- | --- | --- | --- |
| F1B1Q21 | stem | If log₆ 36 = 2, then x = ? | If logₓ 36 = 2, what is the positive value of x? | The unknown must be the logarithm base; x² = 36 gives x = 6. |
| F1B1Q58 | stem | “I have seen _____ good plays yesterday.” | I saw _____ good plays yesterday. | Yesterday requires simple past rather than present perfect. |
| F1B1Q75 | stem | Which is the largest and oldest barrage in Pakistan? | Which of the following is a barrage rather than a dam? | Sukkur is a barrage; the other choices are dams. The unsupported oldest superlative was removed. |
| F1B1Q96 | stem | How many districts were in FATA before its merger with Khyber Pakhtunkhwa? | How many tribal agencies did FATA have before its 2018 merger with Khyber Pakhtunkhwa? | The seven administrative units were agencies, not pre-merger districts. |
| F1B1Q104 | options | [{"label":"A","text":"Wednesday"},{"label":"B","text":"Tuesday"},{"label":"C","text":"Monday"},{"label":"D","text":"Sunday"}] | [{"label":"A","text":"Friday"},{"label":"B","text":"Tuesday"},{"label":"C","text":"Monday"},{"label":"D","text":"Sunday"}] | The 61st day is 60 days after Monday, and 60 modulo 7 is 4: Friday. |
| F1B1Q120 | stem | Who is the Chief Minister of Sindh? | Who was the Chief Minister of Sindh on 9 October 2026? | Date-anchor the officeholder question. |
| F1B1Q149 | stem | Complete the alphabet series: P, W, V, U, ?, S. | Complete the alphabet series: X, W, V, U, ?, S. | Replace the inconsistent first letter with X to retain the descending-letter pattern. |
| F1B1Q153 | stem | If “Rose” is coded as “Search”, with each letter shifted one step forward, how is “Rose” coded? | If each letter is shifted one step forward in the alphabet, how is ROSE coded? | The unrelated “Search” example contradicts the stated coding rule. |
| F1B1Q201 | stem | What is the language of Gilgit-Baltistan? | Which of these is an indigenous language spoken in Gilgit-Baltistan? | The region is multilingual; Balti is one of its indigenous languages. |
| F2B1Q14 | stem | Who composed the national anthem of Pakistan? | Who wrote the lyrics of Pakistan’s national anthem? | The marked answer is the lyricist, not the composer of the music. |
| F2B1Q45 | answer | A | C | Naval Headquarters is in Islamabad; Karachi houses major naval bases. |
| F2B1Q76 | stem | In which year was Alfred Nobel awarded the Nobel Prize for the first time? | In which year were the Nobel Prizes first awarded? | Alfred Nobel founded the prizes and was not a recipient. |
| F2B1Q86 | options | [{"label":"A","text":"Northeast"},{"label":"B","text":"Northwest"},{"label":"C","text":"Southeast"},{"label":"D","text":"Southwest"}] | [{"label":"A","text":"Northeast"},{"label":"B","text":"West"},{"label":"C","text":"Southeast"},{"label":"D","text":"Southwest"}] | The Arabian Sea lies west of India, rather than northwest. |
| F2B1Q143 | stem | Who discovered the photoelectric effect? | Who explained the photoelectric effect using light quanta? | Hertz first observed the effect; Einstein explained it. |
| F2B1Q147 | stem | Which one is different from the rest? | Which of these sports is normally played as singles or doubles rather than by a larger team? | State the singles/doubles distinction explicitly. |
| F2B1Q211 | stem | Who discovered the photoelectric effect? | Who explained the photoelectric effect using light quanta? | Hertz first observed the effect; Einstein explained it. |
| F2B1Q279 | stem | Which one is different from the rest? | Which of these sports is normally played as singles or doubles rather than by a larger team? | State the singles/doubles distinction explicitly. |
| F2B1Q303 | options | [{"label":"A","text":"1,250 km"},{"label":"B","text":"1,800 km"},{"label":"C","text":"2,250 km"},{"label":"D","text":"3,000 km"}] | [{"label":"A","text":"1,250 km"},{"label":"B","text":"1,800 km"},{"label":"C","text":"2,640 km"},{"label":"D","text":"3,000 km"}] | Use the commonly cited approximate Durand Line length, consistent with the complete companion source. |
| F2B1Q355 | stem | A is the father of B but is not B's son. What is B's relationship to A? | A is the father of B, but B is not A’s son. What is B’s relationship to A? | The original statement said A was not B’s son, which did not establish B’s sex. |
| F2B1Q359 | answer | B | B | Today is Tuesday, so the day after tomorrow is Thursday. |
| F2B1Q369 | stem | Which one is different from the rest? | Which of these languages originated in Europe? | State the geographic-origin distinction explicitly. |
| F2B1Q410 | stem | Which is the longest lake in Europe? | Which is the largest lake in Europe by surface area? | Ladoga is largest by surface area; longest is not the stated measurement. |
| F2B1Q433 | stem | Who was the first person to receive a Nobel Prize? | Who received the first Nobel Prize in Physics in 1901? | The first awards spanned multiple categories; specify Physics for Röntgen. |
| F2B2Q5 | stem | Which one is different from the others? | Which of these languages originated in Europe? | State the geographic-origin distinction explicitly. |
| F2B2Q8 | stem | Which one is different from the others? | Which letter group contains three distinct letters? | Make the repeated-letter distinction explicit. |
| F2B2Q20 | answer | A | D | Naval Headquarters is in Islamabad; Karachi houses major naval bases. |
| F2B2Q23 | stem | When were Pakistan's general elections held in 1985? | On which date were Pakistan’s National Assembly elections held in 1985? | Specify the election being dated. |
| F2B2Q23 | options | [{"label":"A","text":"5 July 1985"},{"label":"B","text":"14 August 1985"},{"label":"C","text":"28 February 1985"},{"label":"D","text":"23 March 1985"}] | [{"label":"A","text":"5 July 1985"},{"label":"B","text":"14 August 1985"},{"label":"C","text":"25 February 1985"},{"label":"D","text":"23 March 1985"}] | National Assembly elections took place on 25 February, not 28 February. |
| F2B3Q7 | answer | A | C | The first prizes were awarded in 1901; the Curies received Physics in 1903. |
| F2B3Q8 | stem | What is the highly reflective part of an optical fibre called? | Which layer surrounds the core of an optical fibre and enables total internal reflection? | Cladding has a lower refractive index; it is not a reflective coating. |
| F2B3Q9 | options | [{"label":"A","text":"Real"},{"label":"B","text":"Inverted"},{"label":"C","text":"Virtual"},{"label":"D","text":"Always diminished"}] | [{"label":"A","text":"Real"},{"label":"B","text":"Real and upright"},{"label":"C","text":"Virtual"},{"label":"D","text":"Always diminished"}] | An astronomical telescope’s final image can be both virtual and inverted; replace the overlapping distractor. |
| F2B3Q24 | stem | Who discovered the photoelectric effect? | Who explained the photoelectric effect using light quanta? | Hertz first observed the effect; Einstein explained it. |
| F2B3Q67 | answer | D | C | Carbon reaches +4; fluorine is −1 in its compounds. |
| F2B3Q72 | options | [{"label":"A","text":"Force and momentum"},{"label":"B","text":"Force and acceleration"},{"label":"C","text":"Force and velocity"},{"label":"D","text":"Force and speed"}] | [{"label":"A","text":"Work and energy"},{"label":"B","text":"Force and acceleration"},{"label":"C","text":"Force and velocity"},{"label":"D","text":"Force and speed"}] | Work and energy have dimensions ML²T⁻²; force and momentum do not. |
| F2B5Q21 | stem | If log₆ 36 = 2, then x = ? | If logₓ 36 = 2, what is the positive value of x? | The unknown must be the logarithm base; x² = 36 gives x = 6. |
| F2B5Q58 | stem | “I have seen _____ good plays yesterday.” | I saw _____ good plays yesterday. | Yesterday requires simple past rather than present perfect. |
| F2B5Q75 | stem | Which is the largest and oldest barrage in Pakistan? | Which of the following is a barrage rather than a dam? | Sukkur is a barrage; the other choices are dams. The unsupported oldest superlative was removed. |
| F2B5Q96 | stem | How many districts were in FATA before its merger with Khyber Pakhtunkhwa? | How many tribal agencies did FATA have before its 2018 merger with Khyber Pakhtunkhwa? | The seven administrative units were agencies, not pre-merger districts. |
| F2B5Q104 | options | [{"label":"A","text":"Wednesday"},{"label":"B","text":"Tuesday"},{"label":"C","text":"Monday"},{"label":"D","text":"Sunday"}] | [{"label":"A","text":"Friday"},{"label":"B","text":"Tuesday"},{"label":"C","text":"Monday"},{"label":"D","text":"Sunday"}] | The 61st day is 60 days after Monday, and 60 modulo 7 is 4: Friday. |
| F2B5Q120 | stem | Who is the Chief Minister of Sindh? | Who was the Chief Minister of Sindh on 9 October 2026? | Date-anchor the officeholder question. |
| F2B5Q149 | stem | Complete the alphabet series: P, W, V, U, ?, S. | Complete the alphabet series: X, W, V, U, ?, S. | Replace the inconsistent first letter with X to retain the descending-letter pattern. |
| F2B5Q153 | stem | If “Rose” is coded as “Search”, with each letter shifted one step forward, how is “Rose” coded? | If each letter is shifted one step forward in the alphabet, how is ROSE coded? | The unrelated “Search” example contradicts the stated coding rule. |
| F2B5Q201 | stem | What is the language of Gilgit-Baltistan? | Which of these is an indigenous language spoken in Gilgit-Baltistan? | The region is multilingual; Balti is one of its indigenous languages. |

Primary references used for factual corrections include [Pakistan Navy headquarters](https://www.paknavy.gov.pk/PR12-10.PDF), [Nobel Physics history](https://www.nobelprize.org/prizes/themes/the-nobel-prize-in-physics-1901-2000/), [National Assembly history](https://na.gov.pk/en/content.php?id=75), [President Zardari's ordinal](https://president.gov.pk/news/asif-ali-zardari-sworn-in-as-president-of-pakistan-2), [Sindh Chief Minister profile](https://cm.sindh.gov.pk/cm-profile) and [WAPDA Tarbela information](https://wapda.gov.pk/hydro-power-and-water-projects/tarbela-dam/). Date-sensitive items are anchored in the stored wording where necessary.

## Unresolved attachment entries

These 75 occurrences were excluded rather than given invented wording or unsupported answers. The CSV also lists their 69 inline repetitions and exact source relationships. No review queue, pending-review record or student-facing warning was created.

| Source | Exact exclusion reason |
| --- | --- |
| F1B1Q7 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F1B1Q26 | The source has multiple valid choices or lacks measurement uncertainty needed to choose a unique answer. |
| F1B1Q64 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F1B1Q89 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F1B1Q94 | The source has multiple valid choices or lacks measurement uncertainty needed to choose a unique answer. |
| F1B1Q119 | The stated ages 16 and 64 would make the sister twice Ali’s age 32 years in the future, not any listed years ago. |
| F1B1Q121 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F1B1Q136 | The source does not state a precise comparison or criterion that establishes one answer. |
| F1B1Q145 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F1B1Q175 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F1B1Q200 | The source does not state a precise comparison or criterion that establishes one answer. |
| F2B1Q20 | The source does not supply four distinct options and exactly one usable answer. |
| F2B1Q171 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q176 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q180 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B1Q184 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q185 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q186 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q187 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B1Q189 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B1Q206 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q207 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q217 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q221 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q222 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q224 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q225 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q226 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q227 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q228 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q229 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q230 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q231 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q280 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B1Q285 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B1Q300 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B1Q351 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B1Q357 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B1Q364 | The analogy does not define a consistent relationship with exactly one listed answer. |
| F2B1Q368 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B1Q370 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B1Q371 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q372 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q373 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q374 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q376 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q377 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q378 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q384 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q385 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B1Q402 | The ordinal and supplied key conflict with the official presidency record; no supported 15th-President interpretation is supplied. |
| F2B1Q417 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B2Q1 | The analogy does not define a consistent relationship with exactly one listed answer. |
| F2B2Q6 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B2Q7 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B2Q15 | The odd-one-out criterion is unspecified or inconsistent, so the supplied key is not uniquely defensible. |
| F2B2Q39 | The source does not state a precise comparison or criterion that establishes one answer. |
| F2B2Q42 | The first presiding officers were Jogendra Nath Mandal (temporary) and Muhammad Ali Jinnah (elected President); neither is offered. |
| F2B2Q43 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B2Q60 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B2Q62 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B2Q65 | The source contains replacement characters where essential formulas, expressions or options should be; the original data cannot be recovered. |
| F2B2Q67 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B3Q3 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q7 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q26 | The source has multiple valid choices or lacks measurement uncertainty needed to choose a unique answer. |
| F2B5Q64 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q89 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q94 | The source has multiple valid choices or lacks measurement uncertainty needed to choose a unique answer. |
| F2B5Q119 | The stated ages 16 and 64 would make the sister twice Ali’s age 32 years in the future, not any listed years ago. |
| F2B5Q121 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q136 | The source does not state a precise comparison or criterion that establishes one answer. |
| F2B5Q145 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q175 | The intended rule, measurement, administrative year or convention is unspecified, so a unique defensible answer cannot be established. |
| F2B5Q200 | The source does not state a precise comparison or criterion that establishes one answer. |
