# Forces Academy Computerized Testing Software
## Agent-Specific Frontend Implementation Directive

This document is an execution prompt for one agent working as part of a three-agent frontend engineering team.

The project is a **frontend-first production implementation** based on the approved Forces Academy requirements, completed Stitch UI audit, Stitch screenshots/HTML exports, DESIGN.md, and the locked frontend stack.

---

# 1. SHARED PROJECT RULES

All three agents must behave as one engineering team.

They share:

- ONE repository
- ONE architecture
- ONE design system
- ONE route architecture
- ONE component philosophy
- ONE visual language
- ONE `/docs/TASKS.md`
- ONE final frontend

Do not create parallel implementations of the same module.

The shared authoritative task ledger is:

`/docs/TASKS.md`

Every agent MUST read it before starting work and MUST update it after every completed phase.

---

# 2. SOURCE OF TRUTH

When sources conflict, follow this priority:

1. Explicit current project instructions
2. Original Forces Academy functional requirements
3. `/docs/ARCHITECTURE.md`
4. `/docs/DESIGN_SYSTEM.md`
5. `/docs/FRONTEND_RULES.md`
6. Completed Stitch forensic audit
7. Approved Stitch screenshots
8. Stitch HTML exports
9. ui-ux-pro-max recommendations
10. General frontend conventions

The Stitch screenshots are the visual reference for existing screens.

The Stitch HTML is reference material only. Do not paste it directly into React and call the page complete.

---

# 3. LOCKED FRONTEND STACK

Frontend:
- React
- TypeScript
- Vite

Styling / Design System:
- Tailwind CSS
- shadcn/ui
- Radix UI primitives
- class-variance-authority
- clsx
- tailwind-merge

Icons:
- Lucide React

3D / Advanced Visuals:
- Three.js
- React Three Fiber
- Drei

Motion:
- Motion / Framer Motion

Forms:
- React Hook Form
- Zod

Tables:
- TanStack Table

Charts:
- Recharts

Notifications:
- Sonner

Command / Global Search:
- cmdk

Carousels:
- Embla Carousel

Future backend:
- Supabase
- Supabase PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Storage

Deployment:
- Vercel

Source control:
- GitHub

---

# 4. UI/UX INTELLIGENCE LAYER

Use the repository:

`https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git`

Relevant skills:

- ui-ux-pro-max
- design-system
- design
- ui-styling
- brand

Consult stack guidance when useful:

- react
- shadcn
- threejs
- html-tailwind

Apply its guidance to:

- accessibility
- responsive layout
- typography
- color systems
- spacing
- hierarchy
- component consistency
- form UX
- navigation UX
- charts
- touch targets
- keyboard interaction
- focus management
- loading feedback
- error feedback
- micro-interactions
- motion
- reduced motion
- performance
- React implementation
- shadcn implementation
- Three.js implementation

Do not let skill recommendations override approved Forces Academy requirements or approved Stitch visual direction.

---

# 5. PREMIUM UI TARGET

The application must feel like:

- premium enterprise SaaS
- modern assessment software
- disciplined academy operations software
- institutional and trustworthy
- highly polished
- calm and focused for students
- information-dense but controlled for staff

It must NOT look like:

- a military video game
- a hacker terminal
- a cyberpunk dashboard
- a neon command center
- a cheap admin template
- a generic school ERP
- a Bootstrap dashboard
- a default shadcn showcase

---

# 6. VISUAL LANGUAGE

Primary palette:

- Deep Navy: `#0E1B2A`
- Military/Slate Green: `#455D4A`
- Muted Brass/Gold: `#C6A75E`
- Canvas: `#F6F8FA`
- Surface: `#FFFFFF`
- Main Text: `#17202A`
- Muted Text: `#667085`
- Border: `#E6E8EC`

Use semantic design tokens rather than scattered hard-coded hex values.

Typography:

- Geist: headings, metrics, operational UI
- Inter: body, forms, questions
- JetBrains Mono: timers and terminal identifiers only

Motion:

- restrained
- purposeful
- normally ~150–250ms
- no distracting exam animation
- honor `prefers-reduced-motion`

---

# 7. SHARED TASKS.MD PROTOCOL

Before starting a phase:

1. Open `/docs/TASKS.md`
2. Confirm the phase is assigned to you
3. Set:
   - Owner ID
   - Owner Name
   - Status: `IN PROGRESS`
   - Started
   - Last Updated
   - Dependencies
   - Blocked By

After implementation and validation:

1. Tick completed checklist items
2. Set `Status: COMPLETE`
3. Record:
   - Completed
   - Files Created
   - Files Modified
   - Validation
   - Known Issues
   - Handoff Notes
4. Add completion log entry
5. Update Agent Status table
6. Update overall completed phase count
7. Update overall progress

Do not mark a phase complete merely because files were created.

---

# 8. SHARED CHANGE / DEPENDENCY FORMAT

If you need another agent to change a shared file or shared component, add a request to `/docs/TASKS.md`.

Example:

CR-001

Requested By:
AGENT-X / Agent Name

Requested From:
AGENT-Y / Agent Name

Component/File:
...

Requirement:
...

Reason:
...

Status:
PENDING

Do not silently duplicate the component.

---

# 9. QA ISSUE FORMAT

QA-001

Found By:
AGENT-X / Agent Name

Owner:
AGENT-Y / Agent Name

Area:
...

Severity:
P0 / P1 / P2 / P3

Issue:
...

Status:
PENDING

---

# 10. HIGH-CONFLICT FILES

Primary owner of high-conflict shared files is:

`AGENT-1 / Antigravity`

High-conflict files include:

- `package.json`
- lockfile
- `vite.config.*`
- `tsconfig.*`
- Tailwind configuration
- `src/app/*`
- `src/styles/*`
- `src/components/ui/*`
- `src/constants/routes*`
- `/docs/TASKS.md`

AGENT-2 and AGENT-3 must minimize direct changes to these files.

If a change is required, preserve other agents' work and log it.

---

# 11. FRONTEND-ONLY BOUNDARY

Do NOT implement:

- production Supabase database migrations
- production RLS
- production authentication policies
- cloud functions
- backend APIs
- database deployment

You MAY create:

- TypeScript types
- DTOs
- service interfaces
- adapters
- mock repositories
- mock persistence/state
- frontend-ready Supabase boundaries

Do not block frontend development waiting for backend work.

---

# 12. GLOBAL IMPLEMENTATION QUALITY

Avoid:

- giant page components
- `any`
- duplicated JSX
- arbitrary colors
- arbitrary spacing
- page-local mock-data monoliths
- inline style spaghetti
- multiple competing component systems
- decorative buttons that do nothing

Prefer:

- feature-oriented modules
- strict TypeScript
- reusable components
- service boundaries
- realistic mock behavior
- reusable schemas
- accessible primitives
- route-level lazy loading

---

# 13. QUALITY GATES

Before marking any phase complete, run applicable:

- `npm run build`
- `npm run lint`
- `tsc --noEmit`

Also verify:

- route works
- no console-breaking errors
- core interactions work
- loading state exists where required
- empty state exists where required
- error state exists where required
- desktop rendering works
- responsive behavior is reasonable
- keyboard basics work
- no obvious accessibility regression

If a command does not exist, record that fact in TASKS.md. Never fake a passing result.

---

# AGENT-2 — CLAUDE

Agent ID: `AGENT-2`  
Agent Name: `Claude`  
Role: **Assessment + Operations**

You own the assessment-authoring, testing-operations, faculty-results, retake, and reporting domains.

Consume the shared design system and primitives created by AGENT-1. Do not create a second shared UI framework.

---

# ASSIGNED PHASES

You own:

- Phase 7 — Question Bank
- Phase 8 — Question Authoring
- Phase 9 — Test Management
- Phase 10 — Complete Test Builder
- Phase 11 — Live Monitoring
- Phase 12 — Results List
- Phase 13 — Result Detail
- Phase 14 — Retakes
- Phase 16 — Reports

Do not implement AGENT-1 or AGENT-3 phases unless TASKS.md contains an explicit handoff.

---

# PRIMARY FILE OWNERSHIP

Prefer feature-local work inside:

- `src/features/questions/`
- `src/features/tests/`
- `src/features/monitoring/`
- `src/features/results/`
- `src/features/retakes/`
- `src/features/reports/`

Domain components may include:

- QuestionCard
- QuestionPreview
- QuestionOptionEditor
- QuestionImagePreview
- TestSectionCard
- TestBlueprint
- TestWizardStep
- ResultAnswerCard
- MonitoringTerminalCard
- MonitoringDetailDrawer
- ReportChartCard

Domain types:

- question.ts
- test.ts
- monitoring.ts
- result.ts
- report.ts
- retake.ts

Do not create alternate Sidebar/Topbar/Button/Dialog/Table frameworks.

---

# DEPENDENCY ON AGENT-1

Before beginning feature implementation:

- read TASKS.md
- inspect Phase 1 status
- consume existing tokens/components
- do not replace shared primitives because of personal preference

If shared components are missing, create a Shared Component Request in TASKS.md.

You may still prepare domain types, mock data, page-level feature components, and Stitch analysis while waiting for a shared primitive.

---

# PHASE 7 — QUESTION BANK

Route:
`/admin/questions`

Rebuild approved Question Bank Stitch UI.

Implement:

- summary metrics
- search
- force filter
- subject filter
- status filter
- question type filter
- sorting
- pagination
- multi-select
- row actions
- multi-force badges
- loading
- empty
- error
- no-results state

Actions:

- View
- Edit
- Deactivate
- Archive
- Add to Test

Replace the old browser `alert()` preview with a proper accessible preview dialog/drawer.

Use TanStack Table and shared table primitives.

---

# PHASE 8 — QUESTION AUTHORING

Routes:

- `/admin/questions/new`
- `/admin/questions/:id`
- `/admin/questions/:id/edit`

Use the approved Question Authoring Studio Stitch screen as the visual reference.

Desktop layout:
- left: authoring form
- right: live student preview

Use React Hook Form + Zod.

Support:

- question statement
- optional question image
- exactly four options A/B/C/D
- text-only options
- image-only options
- combined option content where appropriate
- image upload preview
- replace/remove
- correct answer
- subject
- forces multi-select
- status
- explanation/rationale
- inline validation
- live preview

Do not fake image-question support.

Local frontend file preview is sufficient until Supabase Storage is integrated.

Mock add/edit must update the Question Bank.

---

# PHASE 9 — TEST MANAGEMENT

Routes:

- `/admin/tests`
- `/admin/tests/:id`
- `/admin/tests/:id/edit`

Tests list must include:

- test name
- force
- course
- batch
- sections
- questions
- passing marks
- attempts
- status
- actions

Statuses:

- Draft
- Published
- Active
- Completed
- Archived

Test Detail:

Header:
- test
- force
- course
- status

Metrics:
- assigned students
- attempts
- average
- pass rate

Tabs:
- Overview
- Sections
- Questions
- Students
- Results

---

# PHASE 10 — COMPLETE FIVE-STEP TEST BUILDER

Route:
`/admin/tests/new`

This is one of the highest-priority domain workflows.

The Stitch export currently has a strong Step 3. Preserve its richness while completing Steps 1, 2, 4, and 5.

## Step 1 — Details & Cadre

Fields:
- Test Name
- Force
- Course
- Batch
- Passing Marks

Use proper validation.

## Step 2 — Module Sections

Teacher can:

- add section
- edit section
- remove section
- reorder if appropriate

Each section:
- name
- question count
- duration

Presets:
- Verbal Intelligence
- Non-Verbal Intelligence
- Academic
- Personality

Allow custom sections.

## Step 3 — Question Assembly

Preserve the Stitch blueprint/assembly quality.

Support:

Manual:
- filters
- selection
- per-section selected count
- sticky summary
- allocation validation

Automatic:
- section
- force
- subject
- quantity
- generate
- review
- regenerate

Mock algorithm is sufficient but must behave.

## Step 4 — Timing & Rules

Implement:

- timing review
- passing rule
- question shuffle
- option shuffle
- section lock behavior
- key-release preference where permitted by the requirements

Do not invent unsupported exam-security policies.

## Step 5 — Review & Publish

Show:

- test
- force
- course
- batch
- passing marks
- sections
- duration
- question counts
- question coverage

Publish action must create/update mock test data.

Success state:

`Test Published Successfully`

Actions:
- View Test
- Back to Tests

No confetti.

---

# PHASE 11 — LIVE MONITORING

Route:
`/admin/live`

Rebuild approved Live Monitoring Stitch screen.

Top metrics:
- active
- paused
- completed
- average progress

Each terminal/student record may show:

- student
- roll
- test
- section
- progress
- time
- status
- actions

Statuses:
- Active
- Paused
- Completed
- Connection Issue

Actions:
- Pause
- Resume
- Force Submit
- View Student

Use confirmations for destructive actions.

Implement believable mock realtime status changes.

Preserve command-center quality without turning it into a game.

Optional Hall Grid 3D:
- only if useful
- lazy-loaded
- secondary to 2D operations
- non-WebGL fallback
- must not affect core monitoring performance

---

# PHASE 12 — RESULTS LIST

Route:
`/admin/results`

Filters:

- Test
- Batch
- Force
- Date
- Result
- Student

Summary metrics:

- Attempts
- Average
- Pass Rate
- Highest Score

Table:

- Student
- Roll Number
- Test
- Attempt
- Correct
- Wrong
- Skipped
- Score
- Result
- Submitted
- Actions

Actions:

- View Attempt
- Print
- Export
- Allow Retake

Print/Export may be frontend mock interactions for now.

---

# PHASE 13 — RESULT DETAIL

Route:
`/admin/results/:attemptId`

Rebuild approved result review Stitch UI.

Header:

- student
- roll
- test
- attempt
- score
- pass/fail

Metrics:

- Correct
- Wrong
- Skipped
- Total

Include:

- section performance
- complete item-by-item answer review

Each answer review must show:

- question
- options
- student answer
- official answer
- status
- explanation/rationale

Styling:

- correct: restrained success accent
- incorrect: restrained danger accent
- skipped: neutral

Do not flood the page with full-card red/green fills.

---

# PHASE 14 — RETAKES

Route:
`/admin/retakes`

Rebuild approved Retakes Stitch screen, while remaining aligned with the product requirements.

Show:

- student
- test
- previous attempt
- score
- retake status
- approver
- action

Statuses:

- Available
- Used
- Expired

Approval interaction:

`Allow Retake?`

Mock behavior:
- preserve previous result
- create retake availability
- update UI state

Do not erase earlier attempts.

---

# PHASE 16 — REPORTS

Route:
`/admin/reports`

Use the existing analytics Stitch screen as design inspiration.

Report categories:

- Batch Performance
- Student Performance
- Test Performance
- Pass/Fail Summary
- Force Performance

Filters:

- Date Range
- Batch
- Force
- Test

Use Recharts appropriately.

Charts must:

- use design tokens
- remain readable
- be responsive
- use accessible tooltips
- avoid misleading scales
- avoid decorative chartjunk

Include:

- summary cards
- relevant tables
- export UI
- loading
- empty
- error states

---

# DOMAIN MOCK BEHAVIOR

Your pages must not be static.

At minimum:

- add/edit question updates bank
- search/filters actually work
- pagination actually changes rows
- Test Builder state persists across steps
- question allocation counts update
- automatic generation simulates selection
- publish creates a mock test
- monitoring actions update statuses
- retake approval updates state
- result filters work

---

# CROSS-AGENT INTEGRATION

AGENT-3 will later consume assessment/result data for Student Portal and Exam flows.

Keep domain models coherent.

Do not create contradictory IDs or duplicate test/question definitions.

If AGENT-3 needs a domain contract change, coordinate through TASKS.md.

---

# COMPLETION CONDITION

Your workstream is complete only when Phases:

`7, 8, 9, 10, 11, 12, 13, 14, 16`

are complete and validated.

Before ending any work session:

- update `/docs/TASKS.md`
- record handoff notes
- record dependencies
- preserve compatibility with shared components
