# Supported course catalog

Only these five courses are active and selectable:

| Force | Courses |
| --- | --- |
| Pakistan Army | PMA Long Course, AFNS |
| Pakistan Air Force | CAE, Airman |
| Pakistan Navy | PN Cadet |

Hosted migration `20261009000039_supported_course_catalog.sql` deactivated 16 of the 21 previously active rows, including duplicate PMA and PN Cadet aliases. It preserves the existing canonical UUIDs for PMA_LONG_COURSE, AFNS, PAF_CAE, PAF_AIRMEN and PN_CADET. CAE/Airman/AFNS display names were simplified.

Inactive legacy rows and their foreign-key references remain for recovery and historical integrity. Students, tests, fees, attempts, results, question banks and mappings were not deleted or reset. The two existing students, tests and fee accounts reference the retained canonical PMA/AFNS rows. Backups are retained locally in ignored `qa-artifacts/course-cleanup-before.private.json` and `qa-artifacts/course-dependent-before.private.json` (UTF-16 JSON).

A database constraint prevents activating unsupported courses. Enrollment validates an active course belonging to the selected Force. Existing test-creation validation rejects inactive courses. Duplicate/retired Academic course cards are excluded from the bank counts without deleting shared mappings.

Builder/configuration queries, bank and authoring taxonomy, registration course matching, official course definitions, student-form/import choices and settings labels now use the five-course catalog. GDP and Sailor were removed as selectable offerings; CAE and PN Cadet use their correct saved UUIDs.

Verification:

- PASS: five hosted rollback checks verify the 2/2/1 distribution, blocked reactivation, blocked retired-course enrollment/test creation and deduplicated Academic course cards.
- PASS: TypeScript and production build; existing academy-poster/large-chunk warnings remain.
- PASS: all six Admin/Teacher browser checks verify five builder choices, refresh, desktop/mobile layout, bank filters and registration/configuration/authoring adapters. Evidence: `qa-artifacts/course-catalog-browser-verification.json`.

Backend changes are applied to hosted Supabase. Frontend changes are tested locally; production frontend deployment has not been performed.
