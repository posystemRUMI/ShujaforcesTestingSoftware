# Shared banks, Verbal import and LC-159 verification

Hosted Supabase changes are applied. Frontend changes are built and tested locally; frontend production deployment has not been performed.

## Backup and existing inventory

Current bank labels are **Shared Verbal Intelligence** and **Shared Non-Verbal Intelligence**. Migration 00038 removed legacy AFNS/PMA tags from intelligence questions and normalizes future saves. The prefix breakdown below is historical backup inventory only. Hosted verification confirms zero remaining AFNS identifiers/tags on the 311 Verbal and 10 Non-Verbal questions; all retain AFNS and both PMA course mappings.

Verified **60 existing Verbal records**: AFNS-Q- 38, VERBAL-Q- 19, QA-V- 3. The backup contains all 2,401 bank questions, 9,604 options, 4,063 course mappings, bank/course taxonomy and two immutable attempt snapshots. Backup: `qa-artifacts/bank-before.private.json` (local, ignored by Git, UTF-16 JSON). Normalized copy: `scratch/bank-before.json`. Neither is deployed to the frontend.

Recovery can restore original codes, statements, keys, explanations and mappings by UUID. New references created after this import must be reconciled before removing imported records; foreign-key restrictions and immutable historical snapshots must be retained. This is a bank/snapshot backup, not a whole-project/Auth/storage disaster-recovery backup.

Every existing UUID and option UUID was retained. Codes have a globally unique constraint. Existing rows were numbered by creation timestamp and UUID; collision-safe temporary UUID codes and final codes were written in one transaction. No existing questions were consolidated or deleted. Existing stem prefixes such as AFNS--Q no were removed as display identifiers; substantive bank content, keys and explanations were preserved except for the explicitly authorized matching-record corrections below.

## Import accounting

The parser independently confirmed block counts **102 + 28 + 30 + 100 + 32 = 292**. Number restarts were parsed as new blocks.

| Source | Inserted | Matched | Unresolved |
| --- | ---: | ---: | ---: |
| Five supplied Verbal blocks | 249 | 18 source entries matching 11 existing UUIDs | 6 |
| LC-159, 21 Verbal + 31 Academic | 6 (2 Verbal + 4 Academic) | 46 (42 original records + 4 from the Verbal import) | 0 complete MCQs |

Within the 292 source entries, **26 are repeated equivalents**: 7 repeats match the existing bank and 19 repeat a newly imported canonical item. Exclusive accounting is **249 new + 11 first matches + 26 repeats + 6 unresolved = 292**. Option order was ignored when matching. Questions asking for different missing terms, dates, quantities or outputs were retained separately.

**255 explanations added** with new questions; **2 existing explanations updated** for authorized corrections. Valid existing explanations on matched records were retained. Every accepted canonical MCQ has four distinct choices, exactly one marked correct option, a nonblank question-specific explanation and APPROVED status.

The 52 complete LC-159 questions have saved source_label, source_course and source_type metadata. The source is candidate-recalled reconstructed practice content, not an official examination paper. The incomplete oil-supplier, A,G,Z,H, unspecified age/proportion and general day/direction recollections and all Non-Verbal descriptions were excluded as instructed; none were invented. The oil-supplier question already present in the bank was preserved as unrelated existing content.

LC-159 complete-MCQ exclusions: **0 of 52**. Excluded incomplete-recall categories: **6** (oil supplier, incomplete letter series, unspecified age, unspecified proportion, general day-question count and general direction-question count). Non-Verbal descriptions were also excluded; they do not provide a countable complete-MCQ dataset.

## Final bank counts

| Bank | Total unique | Active | Inactive | Code range |
| --- | ---: | ---: | ---: | --- |
| Shared Verbal | 311 | 311 | 0 | v-Q1 … v-Q311 |
| Shared Non-Verbal | 10 | 10 | 0 | nv-Q1 … nv-Q10 |
| AFNS Academic | 724 | 724 | 0 | AFNS-A-Q1 … AFNS-A-Q724 |
| PMA Long Course Academic | 1,611 | 1,524 | 87 | PMA-LC-A-Q1 … PMA-LC-A-Q1611 |
| Combined UUID total | 2,656 | 2,569 | 87 | Globally unique codes |

PMA_LONG_COURSE, PMA_LC and AFNS use the same Verbal and Non-Verbal UUIDs. Academic mappings remain isolated: the LC-159 Academic records map only to both actual PMA course variants. Shared questions are counted once in combined totals; course-specific cards can show the same shared pool for each applicable course. Academic subject counts are computed from the database. Existing Non-Verbal and Academic substantive content/options/keys were preserved; their identifiers were standardized under Task 2. Four LC-159 Academic questions were added.

## Existing-record corrections

- **LC159-V20 / VERBAL-Q-014**: the existing marked option text `TWSWT` became `TWTWT`; S lacks vertical mirror symmetry. Its option UUID and marked key were retained, and its explanation became the supplied T/W symmetry explanation. Existing historical snapshots were not edited.
- **LC159-A3 / PMA-Q-725**: the unanchored “current Foreign Minister” question became “Who was Pakistan’s Foreign Minister in October 2026?” with the supplied dated explanation. Its saved Ishaq Dar key/options/UUID were retained. Existing Sindh/Balochistan questions already specify 6 October 2026 and retain that precise date.

## Supplied-source corrections

Each change below identifies the source block/item and records original and final values. Decorative headings, numbering, check marks and embedded Answer lines were removed during parsing for all supplied entries. B4Q21 removes Yard; B4Q34 removes Meter to reduce five choices to four while retaining the correct area unit.

| Source | Field | Original | Final | Reason |
| --- | --- | --- | --- | --- |
| B1Q7 | stem | How many months in a year have 30 days? | How many months in a year have exactly 30 days? | Clarify exactly 30 days, rather than at least 30. |
| B1Q15 | stem | Which one is different from the rest? | Which sport is different because players primarily move the ball using their feet? | Use a defensible distinguishing property; football uses feet. |
| B1Q15 | answer | D) Baseball | B) Football | Use a defensible distinguishing property; football uses feet. |
| B2Q17 | stem | Which one of the following is the odd one out? | Which sport is different because players primarily move the ball using their feet? | Use a defensible distinguishing property; football uses feet. |
| B2Q17 | answer | D) Baseball | C) Football | Use a defensible distinguishing property; football uses feet. |
| B1Q16 | stem | Which one is different from the rest? | Which sport can be played as singles rather than only as opposing teams? | Make the distinguishing property explicit. |
| B1Q38 | stem | A bat cannot see and a snake cannot _____. | Which statement about bats and snakes is correct? | Correct the false claims about bat vision and snake hearing. |
| B1Q38 | options | A) Swim; B) Walk; C) Hear; D) Fly | A) All bats are blind; B) Snakes cannot detect any sound; C) Bats can see, and snakes detect vibrations and some airborne sounds; D) Snakes have external ear openings | Correct the false claims about bat vision and snake hearing. |
| B3Q7 | stem | A bat cannot see, and a snake cannot hear. Which of the following statements is correct? | Which statement about bats and snakes is correct? | Correct the false claims about bat vision and snake hearing. |
| B3Q7 | options | A) A bat cannot see and a snake cannot hear; B) A bat cannot hear and a snake cannot see; C) Both can see and hear normally; D) Neither can see nor hear | A) All bats are blind; B) Snakes cannot detect any sound; C) Bats can see, and snakes detect vibrations and some airborne sounds; D) Snakes have external ear openings | Correct the false claims about bat vision and snake hearing. |
| B3Q7 | answer | A) A bat cannot see and a snake cannot hear | C) Bats can see, and snakes detect vibrations and some airborne sounds | Correct the false claims about bat vision and snake hearing. |
| B1Q57 | stem | If my brother's sister is your mother, who am I to you? | I am a man. My brother's only sister is your mother. How am I related to you? | Specify the speaker is male and exclude mother/aunt ambiguity. |
| B2Q19 | stem | If my brother's sister is your mother, what is my relationship to you? | I am a man. My brother's only sister is your mother. How am I related to you? | Specify the speaker is male and exclude mother/aunt ambiguity. |
| B2Q19 | options | A) Father; B) Uncle; C) Maternal Uncle; D) Brother | A) Father; B) Cousin; C) Maternal Uncle; D) Brother | Uncle and maternal uncle were both valid choices; remove the duplicate meaning. |
| B1Q58 | answer | C) Saturday | B) Friday | Monday + 11 days is Friday. |
| B1Q59 | answer | A) 1 minute | C) 5 minutes | One man takes five minutes per paper. |
| B1Q61 | options | A) 0.9 minutes; B) 1.0 minute; C) 1.2 minutes; D) 1.5 minutes | A) Approximately 1.11 minutes; B) 1.0 minute; C) 1.2 minutes; D) 1.5 minutes | 100 minutes Ã· 90 km â‰ˆ 1.11 minutes per km. |
| B1Q63 | answer | B) Friday | A) Thursday | Monday + 10 days is Thursday. |
| B1Q74 | options | A) 20 km; B) 25 km; C) 30 km; D) 40 km | A) 20 km; B) 25 km; C) 18 km; D) 40 km | 120 Ã— 15 Ã· 100 = 18 km, omitted from the original options. |
| B1Q76 | answer | B) Monday | D) Wednesday | Sunday + 10 days is Wednesday. |
| B1Q87 | stem | After arranging “RAPIS” alphabetically, it is the name of a _____. | Rearranging the letters RAPIS forms the name of a _____. | Anagrams require rearrangement, not alphabetical sorting. |
| B1Q91 | answer | C) G | B) E | The third alphabetically sorted MANAGEMENT letter is E. |
| B1Q98 | options | A) 120; B) 130; C) 140; D) 150 | A) 170; B) 130; C) 140; D) 150 | 6 Ã— 70 âˆ’ 5 Ã— 50 = 170, omitted from the options. |
| B1Q101 | answer | B) 20 | A) 18 | The sister is 12 + 6 = 18. |
| B2Q2 | options | A) 9; B) 3; C) -3; D) 0 | A) 9; B) 3; C) âˆ’27; D) 0 | Doubling decrements require subtracting 48 from 21. |
| B2Q15 | stem | Which one of the following is different from the others: Peshawar, Rawalpindi, Sindh, Quetta, Lahore? | Which place is a province rather than a city? | The stem listed five places but only four choices; retain the existing four choices. |
| B2Q16 | answer | D) Square | A) Angle | Angle is the non-polygon; square is a polygon. |
| B2Q20 | answer | B) 25 | A) 24 | 10 + 15 âˆ’ 1 = 24. |
| B2Q22 | stem | Which of the following letters is symmetrical when viewed in a vertical mirror? | Which of these uppercase letters has vertical reflection symmetry in a standard symmetrical block font? | All three letters are symmetric; All of these is the single correct choice. |
| B2Q22 | answer | A) M | D) All of these | All three letters are symmetric; All of these is the single correct choice. |
| B2Q24 | options | A) A bat cannot see.; B) A snake cannot hear through external ears.; C) A snake has external ears.; D) A bat is completely blind. | A) A bat cannot see.; B) Snakes lack external ear openings but can detect vibrations and some airborne sounds.; C) A snake has external ears.; D) A bat is completely blind. | Avoid implying that snakes cannot hear. |
| B3Q2 | options | A) 4.8; B) 4.8; C) 9.6; D) 48 | A) 2.4; B) 4.8; C) 9.6; D) 48 | Replace the repeated 4.8 distractor, preserving the correct B choice. |
| B3Q8 | stem | If 25 butterflies were caught by Ahmed and Ahmed caught four times as many butterflies as Ali, how many butterflies did Ali catch? | Ahmed caught 24 butterflies, four times as many as Ali. How many butterflies did Ali catch? | Individual butterflies require an integer count; minimally change 25 to 24. |
| B3Q8 | options | A) 4; B) 6.25; C) 8; D) 10 | A) 4; B) 6; C) 8; D) 10 | 24 Ã· 4 = 6 butterflies. |
| B3Q9 | stem | If cows are twice as many as horses and cats are three times as many as cows, and there are 5 cows, how many animals are there in total? | Cows are twice as numerous as horses, and cats are three times as numerous as cows. If there are 10 cows, how many animals are there in total? | Five cows imply fractional horses; use ten cows for integer animals. |
| B3Q9 | options | A) 25; B) 30; C) 35; D) 40 | A) 25; B) 30; C) 45; D) 40 | 10 cows + 5 horses + 30 cats = 45. |
| B3Q11 | options | A) Sunday; B) Thursday; C) Friday; D) Saturday | A) Sunday; B) Tuesday; C) Friday; D) Saturday | Friday âˆ’ 17 days is Tuesday. |
| B3Q14 | stem | Which of the following sports is different from the others? | Which sport can be played as singles rather than only as opposing teams? | Tennis has singles; the other listed sports are team sports. |
| B3Q14 | answer | D) Cricket | A) Tennis | Tennis has singles; the other listed sports are team sports. |
| B3Q16 | options | A) Liberated; B) Equalized; C) Dictatorial; D) Modernized | A) Liberated; B) Equalized; C) Made dictatorial; D) Modernized | Use a phrase matching the grammatical form of democratized. |
| B3Q23 | options | A) 49; B) 57; C) 61; D) 69 | A) 49; B) âˆ’25; C) 61; D) 69 | 12 + 45 + 6 + 2 âˆ’ 2 Ã— 45 = âˆ’25. |
| B3Q24 | stem | Which of the following patterns would look the same in a mirror? | Which uppercase pattern remains unchanged in a vertical mirror, assuming a standard symmetrical block font? | State the font and reflection axis. |
| B3Q30 | options | A) 7th; B) 8th; C) 9th; D) 22nd اہم | A) 7th; B) 8th; C) 9th; D) 22nd | Remove the decorative trailing Urdu heading, not part of the option. |
| B4Q9 | stem | In a class of 60 male and 35 female students, 80% of the class failed in Chemistry and 30% in English. Which one is true? | In a class of 60 male and 35 female students, 80% failed Chemistry. Which statement about those Chemistry failures must be true? | The English rate is irrelevant and cannot determine the sex distribution of English failures. |
| B4Q14 | stem | Saw is to Seed as Reap is to ______? | Sow is to Seed as Reap is to _____? | Correct Saw to Sow, the agricultural verb. |
| B4Q14 | options | A) Crop; B) Sunshine; C) Rain; D) Grain | A) Crop; B) Sunshine; C) Rain; D) Stone | Grain and crop overlapped as valid harvested products. |
| B4Q21 | options | A) Mile; B) Inch; C) Foot; D) Yard; E) Acre | A) Mile; B) Inch; C) Foot; D) Acre | Convert five choices to four; remove distractor Yard and relabel the area unit as D. |
| B4Q21 | answer | E) Acre | D) Acre | Convert five choices to four; remove distractor Yard and relabel the area unit as D. |
| B4Q34 | options | A) Foot; B) Yard; C) Centimeter; D) Meter; E) Square Yard | A) Foot; B) Yard; C) Centimeter; D) Square Yard | Convert five choices to four; remove distractor Meter and relabel the area unit as D. |
| B4Q34 | answer | E) Square Yard | D) Square Yard | Convert five choices to four; remove distractor Meter and relabel the area unit as D. |
| B4Q37 | options | A) 22, 23; B) 24, 23; C) 22, 21; D) 20, 21 | A) 23, 21; B) 24, 23; C) 22, 21; D) 20, 21 | The alternating âˆ’2,+1 pattern gives 23 then 21. |
| B4Q41 | stem | We wear clothes because ______. | What is a main protective purpose of wearing clothes? | Use an objective protective purpose rather than subjective appearance. |
| B4Q41 | answer | C) To look nice | B) To keep warm | Use an objective protective purpose rather than subjective appearance. |
| B4Q43 | stem | If the second of the following numbers is added to the shortest number and divided by the third number, the answer will be: 2, 14, 4 | Add the second number to the smallest number, then divide by the third number: 2, 14, 4. | Replace shortest with smallest and clarify the order. |
| B4Q45 | stem | AB, DEF, HIJK, MNOP, ______? | Complete the letter groups: AB, DEF, HIJK, MNOPQ, _____? | Restore the missing Q to make group lengths 2,3,4,5,6 with one skipped letter between groups. |
| B4Q45 | answer | B) STUVW X | A) STUVWX | Restore the missing Q to make group lengths 2,3,4,5,6 with one skipped letter between groups. |
| B4Q45 | options | A) STUVWX; B) STUVW X; C) STUVXZ; D) SUTV XW | A) STUVWX; B) STUVWY; C) STUVXZ; D) SUTV XW | Remove the duplicated correct choice STUVWX. |
| B4Q51 | options | A) Sadness; B) Anger; C) Happiness; D) Sorrow | A) Excitement; B) Anger; C) Happiness; D) Sorrow | Sadness and sorrow were synonyms, giving two correct choices. |
| B4Q51 | stem | Laughter is to Joy as Tears are to ______? | Laughter is to Joy as Tears of grief are to _____? | Specify tears of grief to exclude tears of happiness. |
| B4Q55 | stem | Fish is to Water as Animal is to ______? | Fish is to Water as a terrestrial animal is to _____? | Animals include fish; specify terrestrial for a defensible habitat comparison. |
| B4Q64 | answer | D) Madrid | C) New York | New York is the only non-national-capital city. |
| B4Q66 | stem | Fowl is to Hen as Cub is to ______? | Chick is to Hen as Cub is to _____? | Use matching young-to-adult relationships instead of Fowl-to-Hen. |
| B4Q67 | stem | If Mushed is smaller than Azhar, but taller than Aqeel, who is the tallest of the three? | Mushed is shorter than Azhar but taller than Aqeel. Who is tallest? | Replace smaller with shorter to specify height. |
| B4Q73 | stem | Find the odd-man out. | Which vehicle travels on land rather than water? | Specify the defensible boat-versus-land-vehicle distinction. |
| B4Q73 | options | A) Junk; B) Packet; C) Rickshaw; D) Dhow | A) Junk; B) Packet boat; C) Rickshaw; D) Dhow | Clarify the nautical meaning of packet. |
| B4Q75 | stem | Find the odd-man out. | Which item is specifically an enclosure for a small child to play in? | Playpens are also furniture; specify the distinct use. |
| B4Q79 | options | A) 20; B) 21; C) 19; D) 23 | A) 7; B) 21; C) 19; D) 23 | The next odd-position term is 7, omitted from the supplied choices. |
| B4Q79 | answer | C) 19 | A) 7 | 19 is the following even-position term, not the next term. |
| B4Q84 | stem | Which one is different from the rest? | Which animal name explicitly refers to a male? | Clarify the sex distinction. |
| B4Q84 | options | A) Duck; B) Cow; C) Bull; D) Mare | A) Female duck; B) Cow; C) Bull; D) Mare | Duck can refer to either sex; specify female to ensure one correct choice. |
| B4Q85 | stem | A cake is cut so that one piece, which is half of the cake, is twice as large as the other piece. How many pieces are there? | A cake is cut into one half-size piece and equal remaining pieces, each half the size of that first piece. How many pieces are there? | Clarify that the remaining half forms two quarters. |
| B4Q89 | options | A) T; B) P; C) K; D) U | A) T; B) P; C) N; D) U | J is two places from L; K is only one place away. |
| B4Q89 | stem | Which letter is as far from L as J is? | Which letter is two positions after L, just as J is two positions before L? | Specify the opposite direction of equal alphabet distance. |
| B4Q91 | stem | Find the odd man out. | Which vehicle runs on runners rather than wheels? | Make the sleigh distinction explicit. |
| B4Q93 | stem | Scooter is to Petrol as Truck is to ____? | In a conventional comparison, a petrol-powered scooter is to Petrol as a diesel-powered truck is to _____? | Some trucks use petrol; specify the intended fuel types. |
| B5Q2 | options | A) 17; B) 5; C) 20; D) 9 | A) 17; B) 5; C) 19; D) 9 | Interleaved sequences +5 and +4 make the next even-position term 19. |
| B5Q6 | stem | Find the missing number: 3, 7, 16 6, 13, 28 9, 19, ____ | Complete the third row using the same rule in each row: (3, 7, 16); (6, 13, 28); (9, 19, _____). | Preserve the three-row structure lost in pasted formatting. |
| B5Q12 | stem | What do all books have? | What do all ordinary printed books contain? | Exclude audiobooks and clarify the intended printed-book context. |

## Unresolved source items

- **B3Q13**: All choices are overlapping primate categories; the supplied Baboon key has no unique defensible distinction.
- **B4Q26**: Differences are 6,8,5,7; neither the stem nor the keyed fourth pair defines a unique odd-one-out rule.
- **B4Q52**: No consistent simple rule determines the supplied next term from this sequence without guessing.
- **B4Q57**: Trip, Pair, Peer and Rips have no specified unique odd-one-out relationship.
- **B4Q92**: Two letter groups do not determine a unique permutation rule; the keyed next group requires guessing.
- **B4Q94**: The sequence 16,8,24,32,16 has no specified coherent rule selecting 40 uniquely.

These six entries were not inserted and have no pending-review status, approval queue or student-facing warning. All 292 entries are accounted for in `supabase/imports/20261009_source_ledger.csv`.

## Verification

- PASS: full before/after audit; existing question/option UUIDs and correct keys retained; original attempt snapshot JSON unchanged; two students, two tests and two results retained. No student, Auth, test, attempt, fee or unrelated records were deleted/reset.
- PASS: all bank codes follow the required formats, are unique and sequential; no AFNS-/VERBAL-/QA- prefixes remain in the Verbal bank. Existing Verbal occupies v-Q1 … v-Q60; new numbering starts at v-Q61.
- PASS: all accepted imported/matched records have four distinct options, one correct choice, a relevant explanation, approved status and correct course mappings.
- PASS: a second import run changed **zero question, option or mapping rows**, checked using PostgreSQL row versions, not only counts.
- PASS: 12 hosted rollback checks cover shared counts, course isolation, pagination, v-Q312 allocation, preserved option UUIDs, source-label snapshots, finalized review, ownership/RLS and active-exam answer secrecy. All fixture records and mutations were rolled back.
- PASS: TypeScript and production build. Existing warnings concern the academy-poster asset and large chunks.
- PASS: ten Admin/Teacher browser checks cover database counts, connected filters, last-code search, pagination, status counts, source labels, explanation refresh and four responsive widths (1440, 1024, 768 and 390 px). Two actual PMA/AFNS builder checks select v-Q311 with its source label, without saving new tests. Evidence is in `qa-artifacts/bank-import-browser-verification.json` and `qa-artifacts/bank-builder-browser-verification.json`.
- BLOCKED: the six incoherent source entries listed above; remaining valid entries imported normally.

Staff views use the authenticated backend count/page RPC, with no mock counts. Source labels render inline in muted text in the bank, builder and exam/review statement components. New snapshots capture the label; historical snapshots remain unchanged. Keys/explanations are exposed only through authorized staff/finalized-result flows. The normal authoring RPC assigns the next bank code transactionally and updates options by label while retaining their UUIDs.

Migrations: 00035 catalog/authoring; 00036 idempotent import/renaming; 00037 immutable source-label payloads. Stable UUIDs and canonical/source mappings are in `supabase/imports/20261009_verbal_lc159.json`; every existing code change is in `supabase/imports/20261009_code_changes.csv`.

The migration SQL was applied through the Supabase Management API and verified against the hosted database. This project has no `supabase_migrations.schema_migrations` table, so these results confirm the live schema/data rather than a Supabase CLI migration-history entry.

## Fact-check references

Bat vision was checked against [USGS](https://www.usgs.gov/faqs/are-bats-blind?items_per_page=6&page=0&qt-news_science_products=4&tltagv_gid=466); snake airborne hearing against [University of Queensland research](https://news.uq.edu.au/2023-02-15-snakes-can-hear-more-you-think). Date-anchored officeholders were checked using the [Foreign Ministry](https://mofa.gov.pk/minister-for-foreign-affairs), [Balochistan government](https://sngad.balochistan.gov.pk/) and [Sindh government](https://www.sindh.gov.pk/chief-minster). Article 25-A was checked against the [National Assembly Constitution](https://na.gov.pk/uploads/documents/63ea176f52421_610.pdf). Arithmetic, calendar, coding and series corrections were solved from the stated quantities/rules individually.
