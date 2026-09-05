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

# AGENT-1 — ANTIGRAVITY

Agent ID: `AGENT-1`  
Agent Name: `Antigravity`  
Role: **Platform + Admin Management**

You are the primary frontend platform owner.

---

# ASSIGNED PHASES

You own:

- Phase 0 — Project Foundation
- Phase 1 — Design System & Shared Components
- Phase 2 — Authentication
- Phase 3 — Admin Dashboard
- Phase 4 — Student Management
- Phase 5 — Teachers
- Phase 6 — Batches
- Phase 15 — Configuration

Do not implement phases assigned to Claude or Antigravity IDE unless an explicit handoff is recorded in TASKS.md.

---

# PRIMARY FILE OWNERSHIP

You primarily own:

- `src/app/`
- `src/components/ui/`
- `src/components/layout/`
- `src/styles/`
- `src/lib/`
- `src/constants/`
- common schemas/types
- routing foundation
- providers
- design tokens
- shared dialogs
- shared table primitives
- shared form primitives
- shared empty/loading/error states
- app-level error boundaries

Feature ownership:

- `src/features/auth/`
- `src/features/students/`
- `src/features/teachers/`
- `src/features/batches/`
- `src/features/configuration/`

---

# PHASE 0 — PROJECT FOUNDATION

Read all project documentation and inspect current source before editing.

Implement or verify:

- React + TypeScript + Vite setup
- Tailwind configuration
- shadcn/Radix integration
- route architecture
- providers
- route lazy loading
- Sonner
- app error boundary
- semantic token system
- asset structure
- domain-oriented folder structure
- common utility helpers
- mock service architecture
- common TypeScript types
- frontend adapter interfaces
- responsive baseline
- reduced-motion helpers
- accessibility baseline

Production code must not depend on:

- `cdn.tailwindcss.com`
- Google Material Symbols
- random Google-hosted images
- Stitch runtime CDN

Do not delete Stitch references from `/docs`.

Acceptance:
- app runs
- build passes
- TypeScript passes
- no Stitch runtime dependency
- frontend renders without production backend

---

# PHASE 1 — DESIGN SYSTEM & SHARED COMPONENTS

This phase is foundational for all three agents.

Before building components, consult ui-ux-pro-max design-system guidance.

Create one authoritative design token system for:

- colors
- typography
- spacing
- radii
- borders
- shadows
- motion
- focus states
- semantic status colors
- breakpoints

Unify the Material-token vs `brand.*` divergence identified by the audit.

Build reusable foundations:

- AppLogo
- AdminShell
- AuthShell
- PageHeader
- Breadcrumbs
- Sidebar
- Topbar
- MetricCard
- StatusBadge
- ForceBadge
- SubjectBadge
- ScoreBadge
- ProgressBar
- DataTable base
- FilterBar
- SearchInput
- EmptyState
- ErrorState
- LoadingState
- SkeletonTable
- ConfirmDialog
- FormSection
- ImageUploader
- Avatar
- Pagination
- Tabs
- ResponsiveDrawer
- CommandSearch
- NotificationPanel

Use CVA for meaningful variants.

All shared components require:

- semantic HTML
- focus-visible states
- keyboard behavior where applicable
- disabled states
- hover/active states
- responsive treatment
- accessible labels for icon-only actions

This phase should create stable primitives for Claude and Antigravity IDE.

---

# PHASE 2 — AUTHENTICATION

Create `/login`.

Build a premium AuthShell with:

- academy insignia
- Forces Academy identity
- computerized testing portal title
- username/email/roll number
- password
- show/hide password
- role-aware mock behavior
- loading
- disabled submission
- inline validation
- invalid credentials
- generic network error
- keyboard submission
- accessible labels

Optional Three.js:
- subtle institutional visual only
- lazy-loaded
- non-WebGL fallback
- reduced-motion safe
- must not delay login

Use realistic academy copy. No Lorem Ipsum.

---

# PHASE 3 — ADMIN DASHBOARD

Rebuild the approved dashboard Stitch screen faithfully.

Implement:

- KPI metrics
- active tests
- students testing
- average score
- retake attention
- performance chart
- force-performance comparison
- recent submissions
- attention-required panel
- search/navigation integration
- loading/empty/error states
- responsive behavior

Fix the old active-route bug.

Use canonical sidebar label:
`Live Monitoring`

Do not reintroduce Material Symbols.

---

# PHASE 4 — STUDENT MANAGEMENT

## Students List

Route:
`/admin/students`

Implement:

- search
- force filter
- batch filter
- course filter
- status filter
- sorting
- pagination
- row selection
- row actions
- responsive table/card treatment

Columns:

- Student
- Roll Number
- Father Name
- Batch
- Target Forces
- Phone
- Recent Score
- Status
- Actions

## Add Student

Route:
`/admin/students/new`

Use React Hook Form + Zod.

Sections:

Personal:
- image
- full name
- father name
- phone
- CNIC/B-Form

Academy:
- roll number
- temporary credential
- batch
- target forces
- target course
- status

Mock creation must update the list.

## Edit Student

Route:
`/admin/students/:id/edit`

Reuse the schema/form.

Mock updates must persist in frontend state.

## Student Detail

Route:
`/admin/students/:id`

Include:

- identity header
- batch/force information
- attempted tests
- average score
- highest score
- pass rate

Tabs:
- Overview
- Results
- Attempts
- Assigned Tests

## Student Import

Route:
`/admin/students/import`

Flow:
Upload → Preview → Validation → Import Result

Mock CSV/Excel handling is sufficient.

---

# PHASE 5 — TEACHERS

Routes:

- `/admin/teachers`
- `/admin/teachers/new`
- `/admin/teachers/:id`
- `/admin/teachers/:id/edit`

Implement:

- teacher table
- search/filter
- add form
- edit form
- detail page
- role
- status
- email
- phone
- questions created
- last activity
- actions

Use same design system, but do not make the page a copy of Students.

---

# PHASE 6 — BATCHES

Rebuild and extend the approved batch Stitch UI.

Routes:

- `/admin/batches`
- `/admin/batches/:id`

Batches page:

- batch cards/table
- student count
- force/course
- performance
- active tests
- status/actions

Batch detail tabs:

- Students
- Tests
- Performance

Include:

- roster
- assigned tests
- analytics
- recent submissions
- proper responsive table handling

---

# PHASE 15 — CONFIGURATION

Own:

- `/admin/forces`
- `/admin/forces/:id`
- `/admin/courses`
- `/admin/subjects`
- `/admin/settings`

## Forces

Support:

- Pakistan Army
- Pakistan Navy
- Pakistan Air Force

Display:

- courses
- students
- question counts
- active tests

## Force Detail

Show associated courses and useful summary data.

## Courses

Provide management UI and mock add/edit behavior.

## Subjects

Include at minimum:

- English
- Mathematics
- Physics
- Chemistry
- Biology
- General Knowledge
- Pakistan Studies
- Islamiat
- Verbal Intelligence
- Non-Verbal Intelligence

Support:
- Add
- Edit
- Activate/Deactivate

## Settings

Use restrained, professional settings organization.

Frontend-safe settings may cover:

- academy profile
- exam defaults
- notification preferences
- interface/session preferences
- system information

Do not invent infrastructure credentials or dangerous settings.

---

# CROSS-AGENT RESPONSIBILITIES

You are the primary owner of shared components.

If Claude or Antigravity IDE requests a shared-component enhancement:

1. inspect the request in TASKS.md
2. implement it in the shared primitive when appropriate
3. preserve backward compatibility
4. update the request status
5. record changed files

Do not redesign their feature domains.

---

# COMPLETION CONDITION

Your workstream is complete only when Phases:

`0, 1, 2, 3, 4, 5, 6, 15`

are complete and validated.

Before ending any work session:

- update `/docs/TASKS.md`
- record any handoff
- record open dependencies
- leave shared primitives stable for other agents
