# Admin and teacher interface redesign

Updated existing pages only. No routes, pages or modules were added. The existing React/TypeScript/Tailwind/Lucide application now uses a scoped navy, emerald, gold and light-surface management theme matching the student portal, with locally available Geist Sans typography.

## Existing pages covered

| Module | Existing screens / views |
|---|---|
| Shared staff shell | Desktop sidebar, mobile navigation drawer, header search, notification panel and account menu |
| Dashboard | Admin overview, financial activity/distribution, existing academy metrics and actions; teacher dashboard and own salary history |
| Students | Roster, search/filters/selection/pagination, registration, edit, detail and all detail tabs, import screen, archive confirmation |
| Faculty | List, filters/pagination, enrollment form, edit form, detail and empty/error states |
| Question bank | DB counts, Force/Course/Bank/Status filters, Academic breakdowns, question list, selection, pagination and preview |
| Question authoring | New/edit editor, classification, question/options/images, correct-answer selection, explanations and preview |
| Tests | Existing new/edit builder routes and all six existing stages: details, eligibility, pattern, questions, review and publish; summary panel |
| Results | Filters, summary cards, result table, script inspection, section metrics and existing print/CSV controls |
| Leaderboard | Existing Force/course/test/search filters and ranking table |
| Finance (admin only) | Overview/charts, Cadet Fees, Expenses, Salaries, Master Ledger, fee details/history, entry/edit dialogs and actual printable receipts |
| Supporting screens | Staff not-found page; shared login retains its completed matching design |

Reports/analytics and dedicated monitoring/settings/configuration/user-management modules are not active routed pages in the current application. Several legacy paths redirect to the dashboard. These routes and removed modules were preserved, not recreated. `/admin/students/new` continues to use the existing registration page.

## Shared presentation changes

`src/styles/management-portal.css` centralizes the palette, typography, navigation states, cards, forms, controls, tables, tabs, dialogs, chart styling, responsive layouts, focus and reduced-motion treatment. Every selector is scoped to `.academy-management`.

Existing shared components received styling hooks: Sidebar, Topbar, PageHeader, MetricCard, DataTable, FormSection, FilterBar, Pagination, SkeletonTable, loading/empty/error states. Existing feature pages received scoped styling hooks rather than replacement pages. The search opener now uses a native button with the original handler, improving keyboard accessibility. Existing icon-only dialog close controls received accessible labels. Dialog semantics were added without changing confirmations or handlers.

Primary actions use emerald, navigation/headings navy and academy accents restrained gold. Financial/semantic states retain distinct labels and colours. Dense tables scroll inside their existing containers. Mobile action groups and editor fields reflow; long dialogs scroll; printed receipts retain their actual information and handlers.

## Boundaries preserved

No services, APIs, database schema/migrations/policies, authentication implementation, routing, role guards, queries, calculations, validation rules, timers, autosave or exam engine logic changed. No new statistics or sample records were introduced. No real record was created, edited or deleted for styling verification.

The AST verification covered 32 changed TSX files and found no differences in service calls, state/query/effect/callback/memo hooks, event handlers, links, values, checked bindings, required fields or disabled conditions. Student portal/layout, exam engine, shared login and student stylesheet match the saved pre-task source copies. Shared component styling hooks have no effect outside the staff root.

## Verification

| Check | Result | Scope |
|---|---|---|
| TypeScript / available lint | PASS | `npm run lint` is `tsc --noEmit`; no separate ESLint command exists. |
| Production build | PASS | `npm run build` completed after final presentation refinements. |
| Staff routes and interactions | PASS | 46 checks across ADMIN/TEACHER, including all existing routed management pages and aliases represented by their shared page. |
| Responsive pages | PASS | Desktop 1440px and mobile 390px; detailed builder stages, tabs, finance editors and receipt also checked at tablet 768px. No page/content horizontal overflow. |
| Navigation/menus | PASS | Role-specific sidebar, mobile drawer, search, notifications and account controls. |
| Question filters/preview/pagination | PASS | Actual hosted records; shared Verbal selection and second page; authorized explanations retained. |
| Test builder | PASS | Existing eligibility/section controls and all six stages using real saved test data; no save/publish performed. |
| Detail views | PASS | Existing student tabs and result script inspection; faculty unavailable states checked. |
| Finance | PASS | All existing tabs, entry dialogs, existing expense/salary/fee editors and receipt printing; no financial save/void/payment. |
| Role isolation | PASS | Teacher has no Finance destination; direct finance navigation redirects through the unchanged guard; admin financial content absent from teacher dashboard. |
| Student regression | PASS | Dashboard content/style matched the baseline; protected student/exam/login source unchanged; student main pages reviewed separately. |
| Database preservation | PASS | Before/after counts below match; no mutation requests were attempted in the successful read-only review. |

Before/after counts: students **2**, faculty rows **0**, tests **2**, questions **3,416**, options **13,664**, attempts **2**, saved answers **25**, results **2**, student fee payments **4**, salary payments **1**, finance expenses **5**. Browser verification blocked write endpoints as an additional safeguard. Only real existing records and unsaved local form state were used.

Evidence: `qa-artifacts/staff-ui-review.json`, `staff-ui-detail-review.json`, `staff-ui-logic-check.json`, final smoke results and desktop/mobile screenshots. Private QA sessions remain in ignored scratch storage and are not application code.

## Existing limitations retained

- Faculty has zero saved faculty rows. New-form and unavailable detail/edit states were reviewed; populated faculty detail/edit could not be verified without creating a record, which this task prohibits for styling QA. Existing legacy teacher profiles and their salary data remain visible according to current workflows.
- Bulk student import already uses `SAMPLE_CSV_ROWS`, a simulated upload and browser `studentStore`, rather than a real file/backend import. Its existing presentation was restyled; this UI-only task did not change parsing/persistence or introduce those sample records. Import execution was not tested or claimed as backend-connected.
- Command search advertises Escape but its existing close shortcut is Ctrl+K. The handler and advertised content were preserved; Ctrl+K was verified.
- Conditional Collect/Adjust/Waive fee actions depend on an unpaid account. Current saved fee accounts are paid, so positive mutation dialogs for those states were not invoked. Their existing render conditions/handlers and common dialog styling remain intact.
- No mutation was submitted solely to test styling. Persistence/business workflows are preserved by unchanged services/handlers, not claimed as newly executed transactions.
- The production build retains the existing missing academy-poster asset and large-chunk warnings.

## Delivery status

Changes are implemented and built in the project. No new page/module was created, no hosted DB change was applied for this task, and no frontend deployment was performed.
