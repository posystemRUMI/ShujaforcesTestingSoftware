# Teacher salary update, eligibility and dashboard

Applied and verified on the connected hosted Supabase database on 10 October 2026.

The salary update failed because the frontend sent an `updated_at` column absent from `teacher_salary_payments`. It also recalculated partial updates using zeros for omitted values, did not synchronize the linked expense and duplicated the error prefix. Teachers had no own-salary read policy or salary panel.

The database now supplies `updated_at`. Salary edits use an administrator-authorized RPC, retain untouched values and recalculate net pay from persisted base salary, bonus and deduction. Transactional triggers keep the linked expense amount, notes, date and void status aligned. Inconsistent expense amount/category/teacher edits are rejected. The edit payment-type menu now uses the actual DB-supported REGULAR, BONUS and ADJUSTMENT values.

The salary dropdown queries all applicable database teacher profiles, including legacy teachers without a faculty docket and saved faculty mappings. It is not filtered to ACTIVE profiles only or limited to a client page. Selection reloads for the selected year and month. Teachers with an ACTIVE payment for that period are excluded. A unique partial index enforces one active payout per teacher/year/month for every payment type, including concurrent requests. Additional changes to an already-paid month use the saved payroll editor. Voiding the linked expense also voids the salary and restores eligibility.

The teacher dashboard now displays their own salary history, base salary, bonus, deduction, net pay, payment date, payment type, status, notes and yearly totals. It reads from the authenticated user's backend records, refreshes on the dashboard Refresh button/window focus and polls every 30 seconds while visible. No teacher/profile ID supplied by the client can select another teacher's salary. Own-read RLS was added; administrator-only writes and private finance access remain enforced.

| Check | Result |
| --- | --- |
| Existing teacher excluded for paid month, available in another month | PASS |
| Dropdown count agrees with complete backend eligibility | PASS |
| Real browser salary edit succeeds without schema-cache error | PASS |
| Saved DB timestamp updates | PASS |
| Partial updates preserve unchanged salary values | PASS |
| Linked expense amount/notes and salary stay consistent | PASS |
| Duplicate payouts rejected for all types | PASS |
| Void restores eligibility and synchronizes statuses | PASS |
| Teacher dashboard retrieves saved owned salary details | PASS |
| Dashboard refresh and desktop/mobile layout | PASS |
| Teacher cannot edit salary or read another teacher's salary | PASS |
| Student denied teacher salary RPC | PASS |
| TypeScript and production build | PASS |
| Existing payment values preserved, no extra payments created | PASS |
| Temporary verification Auth users remaining | 0 |
| Hosted database migration | APPLIED |
| Frontend deployment | NOT PERFORMED |

Financial changes used for backend tests were transactionally rolled back. The browser editor saved the existing payment without changing financial values; the final payment data was compared with its backup. Salary/expense timestamps and valid update audit events are retained. No fictional salary payout, student payment or receipt was created. Final salary count remains one.

Implementation: `supabase/migrations/20261010000052_salary_payment_consistency.sql`, `supabase/tests/19_teacher_salary_consistency.sql`, finance service/modal and teacher salary dashboard panel. Private affected-record backups are `scratch/salary-before.private.json`, `scratch/salary-functions.private.json` and `scratch/salary-writers.private.json`; verification evidence and screenshots are under `qa-artifacts/salary-*` and `qa-artifacts/teacher-salary-*`. These are affected-record exports, not a complete project backup. Preserve ignored private artifacts separately before removing the workspace.

The production build retains the existing academy-poster asset and large-chunk warnings. Verification covers this payroll flow, not unrelated system features.
