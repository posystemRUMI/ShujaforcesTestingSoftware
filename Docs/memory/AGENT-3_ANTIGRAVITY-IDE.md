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

# AGENT-3 — ANTIGRAVITY IDE

Agent ID: `AGENT-3`  
Agent Name: `Antigravity IDE`  
Role: **Student Experience + Integration QA**

You own the student-facing product, the active examination frontend, and final integrated frontend QA.

The student experience must be visually separate from the administration interface.

Never place students inside AdminShell.

---

# ASSIGNED PHASES

You own:

- Phase 17 — Student Portal
- Phase 18 — Pre-Exam Instructions
- Phase 19 — Active Examination
- Phase 20 — Section Transition
- Phase 21 — Resume Attempt
- Phase 22 — Submission Confirmation
- Phase 23 — Student Result
- Phase 24 — Student Answer Review
- Phase 25 — Attempt History / Retake
- Phase 26 — Global UI States
- Phase 27 — Responsive QA
- Phase 28 — Accessibility QA
- Phase 29 — Performance QA
- Phase 30 — Final Premium Visual QA

Do not implement AGENT-1 or AGENT-2 phases unless TASKS.md contains an explicit handoff.

---

# PRIMARY FILE OWNERSHIP

Prefer work inside:

- `src/features/student/`
- `src/features/exam/`
- `src/pages/student/`
- `src/components/student/`
- `src/components/exam/`

Own domain components such as:

- StudentShell
- ExamShell
- StudentTestCard
- StudentResultSummary
- ExamHeader
- ExamTimer
- ExamQuestionCard
- ExamOption
- QuestionNavigator
- SectionProgress
- AutosaveIndicator
- SectionTransition
- ResumeAttemptCard
- StudentAnswerReview

Do not create alternate shared Buttons, Dialogs, Tables, global tokens, or app router architecture.

---

# DEPENDENCY ON OTHER AGENTS

Consume:

From AGENT-1:
- shared design system
- shared primitives
- route foundation
- dialogs/forms
- common visual tokens

From AGENT-2:
- question/test/result domain types where applicable
- test metadata shapes
- result data shapes
- retake availability shapes

If something is missing, request it in TASKS.md rather than duplicating it.

---

# PHASE 17 — STUDENT PORTAL

Routes:

- `/student/dashboard`
- `/student/tests`
- `/student/results`
- `/student/profile`

Create a dedicated `StudentShell`.

The audit found role leakage in the Stitch student mocks screen. Fix it completely.

Student navigation must expose only student-relevant areas.

## Dashboard

Header:

- greeting
- student image
- roll number
- batch

Metrics:

- Assigned Tests
- Completed
- Average Score
- Best Score

## Assigned Tests

Cards should show:

- test name
- force
- course
- sections
- question count
- duration
- passing marks
- status

Statuses:

- Ready
- In Progress
- Completed
- Retake Available

## Results

Show student-only attempt history.

## Profile

Show student-specific information only.

No:
- teacher tools
- configuration
- monitoring
- question management
- settings intended for administrators

---

# PHASE 18 — PRE-EXAM INSTRUCTIONS

Route:
`/student/test/:id/instructions`

This screen is missing in Stitch and must be designed to match the system.

Display:

- test name
- question count
- sections
- duration
- passing marks

Instructions:

- section timers
- autosave
- option shuffle possibility
- review before submit
- submission finalizes attempt
- avoid unnecessary closing/reloading

Acknowledgment:

`I have read and understood the instructions.`

Start Test must remain disabled until checked.

Optionally add a compact readiness/system check, but keep the flow calm and simple.

---

# PHASE 19 — ACTIVE EXAMINATION

Route:
`/student/test/:attemptId`

This is the most mission-critical student screen.

Use the approved distraction-free Stitch Exam UI as the visual reference.

Never use AdminShell.

## Exam Header

Left:
- academy identity
- test title

Center:
- current section
- question number

Right:
- timer
- student identity

## Question Support

Support:

- text MCQ
- question image
- image-option MCQ
- combined text/image question

Exactly four options where required.

Option states:

- normal
- hover/focus
- selected
- disabled when necessary

Large click targets.

Keyboard accessible.

## Timer

Normal state.

Under 5 minutes:
- restrained warning

Under 1 minute:
- clear danger

No flashing.

## Autosave

Show:

- Saving...
- Saved

Do not toast each answer.

## Navigation

Bottom controls:

- Previous
- Mark for Review
- Next

Final:
- Review & Submit

## Question Navigator

States:

- Answered
- Unanswered
- Current
- Review

Do not rely only on color.

## Progress

Show:

- answered count
- section progress
- overall orientation where useful

Mock answer state must genuinely work.

---

# EXAM RESPONSIVENESS — P0

The audit identified the original exam screen as unsafe below desktop widths.

Fix this.

Test at:

- 1920
- 1440
- 1366
- 1280
- 1024
- 768
- 430
- 390
- 375

Desktop:
- side navigator allowed

Tablet/mobile:
- navigator becomes drawer/sheet/panel
- question remains readable
- timer remains visible
- options remain easy to tap
- no horizontal viewport trap
- no fixed 320px rail crushing content
- no `overflow-hidden` trap
- high browser zoom remains usable

---

# PHASE 20 — SECTION TRANSITION

Implement a calm section-completion interstitial.

Example information:

- Verbal Intelligence Complete
- Answered
- Unanswered
- Next Section
- Non-Verbal Intelligence
- Duration
- Continue

Do not create celebratory/gaming animation.

---

# PHASE 21 — RESUME ATTEMPT

Create interrupted-test recovery state.

Show:

- test
- current section
- answered/progress state
- remaining time
- resume action

Frontend mock state is sufficient.

The UX must reassure the student that their saved progress is available without making unsupported security promises.

---

# PHASE 22 — SUBMISSION CONFIRMATION

Implement a real accessible dialog.

Show:

- Submit Test?
- Answered count
- Unanswered count
- finalization warning

Buttons:

- Cancel
- Submit Test

Use shared Radix/shadcn dialog.

Verify:

- focus trap
- Escape behavior
- initial focus
- accessible title/description
- keyboard behavior

---

# PHASE 23 — STUDENT RESULT

After mock submission, generate a coherent frontend result.

Hero:

- percentage
- PASS / FAIL

Summary:

- Correct
- Wrong
- Skipped
- Percentage

Show section breakdown.

Actions:

- Return to Dashboard
- Review Answers

Keep celebration restrained and institutional.

---

# PHASE 24 — STUDENT ANSWER REVIEW

Route:
`/student/result/:attemptId`

Show:

- question
- selected answer
- correct answer
- status
- explanation

Filters:

- All
- Correct
- Incorrect
- Skipped

Reuse result primitives from AGENT-2 where appropriate, but do not expose instructor-only controls.

---

# PHASE 25 — ATTEMPT HISTORY / RETAKE

Student Results should show:

- Test
- Attempt
- Score
- Result
- Date

Retake state:

- Retake Available
- Start Retake

Integrate with the mock retake availability model from AGENT-2 where possible.

---

# PHASE 26 — GLOBAL UI STATES

Perform a cross-application state pass.

Ensure major modules have context-appropriate:

- Loading
- Skeleton
- Empty
- Error
- Success
- Disabled
- No Search Results
- Validation
- Destructive Confirmation

Do not replace every state with one generic component without context.

Small safe fixes may be made directly.

Structural feature problems should be logged back to the owning agent.

---

# PHASE 27 — RESPONSIVE QA

Perform integrated responsive QA across the whole frontend.

Test:

- 1920px
- 1440px
- 1366px
- 1280px
- 1024px
- 768px
- 430px
- 390px
- 375px

Review:

- Admin navigation
- tables
- filters
- forms
- Test Builder
- Question Authoring
- Reports
- Student Portal
- Active Exam
- Question Navigator
- Results
- dialogs

Expected behaviors:

Admin:
- sidebar → responsive drawer
- adaptive gutters
- safe table overflow/transform
- wrapping filters
- viewport-safe dialogs/forms

Student:
- clear stacked layouts
- no admin leakage

Exam:
- dedicated responsive treatment

Do not simply add `flex-col` everywhere.

---

# PHASE 28 — ACCESSIBILITY QA

Target WCAG 2.1 AA quality.

Verify:

- semantic elements
- keyboard navigation
- focus-visible
- correct label associations
- dialog semantics
- ARIA where required
- no color-only status communication
- sufficient contrast
- reasonable interaction target size
- reduced motion
- high zoom usability
- heading hierarchy
- accessible icon buttons
- screen-reader-friendly form errors

Fix small issues directly.

Log structural issues to the owning agent using QA issue format.

---

# PHASE 29 — PERFORMANCE QA

Review:

- route splitting
- lazy pages
- Three.js loading
- chart loading
- table rendering
- unnecessary rerenders
- image weight
- layout shift
- bundle size
- expensive effects

Requirements:

- Three.js must be lazy
- Three.js failure must not crash app
- exam screen must not depend on 3D
- heavy analytics should not penalize unrelated routes
- images should be appropriately optimized
- memoization only where useful

Record measurable or observable findings.

---

# PHASE 30 — FINAL PREMIUM VISUAL QA

This is the final integrated frontend refinement.

Compare Stitch-derived screens against:

- original PNG
- DESIGN.md
- semantic design system
- ui-ux-pro-max guidance

Review every major page for:

- spacing
- typography
- alignment
- card density
- borders
- shadows
- radius consistency
- button hierarchy
- icon sizing
- status badge consistency
- chart quality
- interaction feedback
- motion
- responsive polish
- accessibility polish
- student/admin separation
- visual continuity across all agents' work

No screen should feel like it came from a different product.

Do not arbitrarily redesign approved Stitch screens.

Enhance:
- consistency
- responsiveness
- accessibility
- missing states
- implementation quality
- visual polish

---

# FINAL QA AUTHORITY

You are the final integrated QA owner, not the owner of every feature.

You MAY directly fix:

- minor spacing
- simple breakpoint problems
- aria attributes
- focus states
- small token inconsistencies
- minor visual polish

You SHOULD NOT silently rewrite another agent's major feature architecture.

For structural problems:

1. create `QA-XXX` issue in TASKS.md
2. assign to original owner
3. specify severity
4. describe exact reproduction/impact
5. keep status updated

---

# COMPLETION CONDITION

Your workstream is complete only when Phases:

`17 through 30`

are complete and validated.

Final frontend completion requires:

- responsive QA complete
- accessibility QA complete
- performance QA complete
- premium visual QA complete
- build passing
- no known P0 blockers
- TASKS.md fully updated

Before ending any session:

- update `/docs/TASKS.md`
- update your agent row
- log QA findings
- record handoffs/dependencies
