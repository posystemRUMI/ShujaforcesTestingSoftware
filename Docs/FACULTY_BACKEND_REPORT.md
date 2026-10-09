# Faculty backend and form cleanup

Implemented and verified on the hosted Supabase backend on 10 October 2026.

The existing faculty form saved to browser local storage, while the faculty list independently read Supabase. Editing and detail views could therefore disagree with the saved database. The local store and its fallback were removed. Create, edit, list and detail now use the hosted backend, and success is shown only after the save returns a persisted teacher UUID.

Faculty codes now use `FAC-1`, `FAC-2` and onwards. The database counter and insert trigger enforce the next number under a transactional row lock. Codes are immutable during editing. A failed registration rolls back its number. The initial hosted faculty table contained zero records, so the first real faculty code remains **FAC-1** after verification cleanup. Existing Auth teacher profiles and administrator accounts were preserved.

Removed faculty duty roles, operational status controls, service-record/professional-bio input, related list filters/columns and detail sections. Internal `TEACHER` permissions and account status remain in the database for security; editing identity/contact/subjects does not change them. New faculty accounts receive the existing ACTIVE teacher access state. No existing permissions were removed to hide these fields.

Remaining data saved: title/rank, full name, faculty code, email, contact phone, affiliation and actual assigned-subject mappings. The new-account login password is saved by Supabase Auth, never in a profile, local storage, audit payload or report. Existing account passwords are retained on edit. Edited emails are synchronized with Auth and profiles. Tri-Service affiliation is represented by a nullable force FK rather than a fabricated force.

The administrator-only `save-faculty` Edge Function was deployed and verified live. It validates the administrator session, creates or updates Auth, then calls a service-role-only transactional database RPC. On database failure it deletes a newly created Auth account or restores changed account data. Database checks reject invalid subjects, wrong accounts and code modification. Existing RLS remains enabled; sequence tables and service RPCs are not exposed to students or teachers.

| Verification | Result |
| --- | --- |
| Backend first code FAC-1; next code FAC-2 | PASS |
| Actual browser creation through deployed Edge Function | PASS |
| Auth, TEACHER profile, faculty UUID and subject mappings linked | PASS |
| New faculty login | PASS |
| All remaining form fields save to DB | PASS |
| Tri-Service affiliation and Chemistry/Biology assignments | PASS |
| List/detail/edit retrieve persisted data after refresh | PASS |
| Edited email synchronized with Auth; login succeeds | PASS |
| Existing access role/status retained during edit | PASS |
| Exact changed subject mappings persist | PASS |
| Invalid subject/code change rejected transactionally | PASS |
| Teacher denied administrator creation and private counter access | PASS |
| Requested sections absent | PASS |
| Desktop/mobile form layout | PASS |
| TypeScript and production build | PASS |
| Temporary teacher/Auth/profile/subject records removed | PASS |
| Frontend deployment | NOT PERFORMED |

Database-only fixtures were rolled back. The real browser QA account was removed through the Auth administrator API after verifying its profile/teacher/subject cascade foreign keys. Its counter allocation was restored only after checking that no real faculty had been created concurrently. Final faculty count is zero, temporary faculty Auth users are zero and the next code is FAC-1. Existing students, tests and original accounts were not reset.

Backend changes are in migration `20261010000051_faculty_backend.sql` and `supabase/functions/save-faculty/index.ts`. Verification SQL is `supabase/tests/18_faculty_backend.sql`. Private pre-change teacher/function/schema metadata is retained in the ignored file `scratch/faculty-before.private.json`; browser, database and cleanup evidence is under `qa-artifacts/faculty-*`. This is an affected-record export, not a full Supabase project backup.

The build retains existing academy-poster and large-chunk warnings. Verification covers these faculty flows; it is not a claim that every unrelated application backend was audited.
