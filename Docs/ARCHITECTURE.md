# Forces Academy Computerized Testing Software — System Architecture & Technology Stack

---

## 1. Architectural Overview & System Demeanor

The **Forces Academy Computerized Testing Software** is a high-stakes, institutional examination and evaluation platform designed for armed forces induction preparation across the **Pakistan Army**, **Pakistan Air Force (PAF)**, and **Pakistan Navy (PN)**.

The software architecture is engineered for:
* **High Reliability & Determinism:** Exam sessions, timers, autosaves, and score telemetry must function flawlessly under stress.
* **Low Latency & High Concurrency:** Support for local network proctoring and rapid live workstation telemetry.
* **Separation of Concerns:** Strict isolation between the Administrative/Faculty Command Shell and the Candidate Examination Environment.
* **Offline / Air-Gapped Deployability:** Architectural capability to run within isolated local area testing networks (CBT test centers) without external CDN dependencies.

---

## 2. Authoritative Technology Stack

The table below defines the formally locked and approved technical stack across all application tiers:

| Tier / Subsystem | Approved Technology | Purpose & Architectural Role |
| :--- | :--- | :--- |
| **Frontend Core Framework** | **React** | Component-driven UI architecture with concurrent rendering. |
| **Language** | **TypeScript** | Strict type safety across test schemas, candidate state, and API models. |
| **Build Tool & Bundler** | **Vite** | Fast HMR development server, optimized ESM production builds, and code splitting. |
| **Styling Framework** | **Tailwind CSS** | Utility-first styling tied strictly to design system tokens. |
| **Component Architecture** | **shadcn/ui** | Accessible, copy-and-own component patterns customized into the academy theme. |
| **Headless UI Primitives** | **Radix UI** | Unstyled, accessible primitives (dialogs, dropdowns, tooltips, popovers, tabs). |
| **Class Utilities** | **clsx**, **tailwind-merge**, **CVA** | Predictable conditional class composition (`class-variance-authority`). |
| **Iconography** | **Lucide React** | **Single authoritative icon library** across the entire application. |
| **3D & Advanced Visuals** | **Three.js**, **React Three Fiber**, **Drei** | Selective branding enhancement (landing, login, insignia); strictly forbidden in exams. |
| **Motion & Transitions** | **Motion** (Framer Motion) | Restrained, purposeful micro-interactions (150–250ms) respecting reduced motion. |
| **Form Management** | **React Hook Form** | High-performance, un-controlled form state for question authoring and test builders. |
| **Schema Validation** | **Zod** | Runtime validation for form inputs, question blueprints, and API payloads. |
| **Data Tables** | **TanStack Table** | Headless sorting, filtering, pagination, and virtualization for dense rosters. |
| **Data Visualization / Charts**| **Recharts** | Declarative SVG charting for Stanine curves, wing pass rates, and latency analytics. |
| **Toast Notifications** | **Sonner** | Clean, non-intrusive operational and autosave feedback toasts. |
| **Global Command & Search** | **cmdk** | Fast keyboard-driven omnibox command palette (`Ctrl+K` / `/ Console`). |
| **Carousels & Sliders** | **Embla Carousel** | Touch-friendly carousels only where multi-item review flows genuinely require it. |
| **Backend Platform** | **Supabase** | Backend-as-a-Service providing database, auth, realtime, and storage infrastructure. |
| **Database Engine** | **Supabase PostgreSQL** | Relational database modeling candidates, questions, tests, attempts, and results. |
| **Authentication** | **Supabase Auth** | Secure session management with role-based access control (Admin, Teacher, Student). |
| **Realtime Telemetry** | **Supabase Realtime** | WebSocket state sync for live examination progress and proctor terminal monitoring. |
| **Object / Asset Storage** | **Supabase Storage** | Secure cloud/LAN storage for cadet photos, question diagrams, and SVG vector assets. |
| **Deployment Platform** | **Vercel** | Edge-optimized CI/CD hosting and production frontend deployment. |
| **Source Control** | **GitHub** | Canonical Git version control repository. |
| **UI/UX Design Intelligence** | **`nextlevelbuilder/ui-ux-pro-max-skill`** | Design intelligence, accessibility, responsive, and component quality reference. |

---

## 3. Frontend Architecture

### 3.1. Core Application Structure
The application is built on **React 18+**, **TypeScript 5+**, and **Vite**, utilizing a modular feature-based folder hierarchy:

```text
src/
├── app/                  # Application router, providers, and global layout wrappers
├── assets/               # Local static assets, logos, fonts, watermarks (zero CDN dependency)
├── components/           # Shared, domain-agnostic UI components
│   ├── ui/               # shadcn/ui primitives (Button, Input, Dialog, Dropdown, Table, etc.)
│   └── feedback/         # Toast containers, skeleton loaders, error boundaries
├── features/             # Domain-specific functional feature modules
│   ├── auth/             # Login, role gate, session guards
│   ├── dashboard/        # Academy command console, wing benchmark metrics
│   ├── batches/          # Batch performance, cadet attendance, wing cadres
│   ├── question-bank/    # Question repository, filtering, moderation queue
│   ├── question-author/  # 4-section question studio, LaTeX/SVG editor, simulator
│   ├── test-builder/     # 5-step test creation wizard, blueprint generator
│   ├── live-proctor/     # Workstation radar matrix, terminal inspection, anomaly alerts
│   ├── results/          # Granular answer review, derivation proofs, scoring
│   ├── retakes/          # Remediation compliance chamber, hash re-seeding
│   ├── student-portal/   # Student mock history, unlocked solutions, study dossiers
│   └── exam-engine/      # Distraction-free exam runner, chronometer, question palette
├── hooks/                # Custom React hooks (useExamTimer, useAutosave, useProctorStream)
├── lib/                  # Library configurations (supabaseClient, utils, tokens)
├── styles/               # Global CSS, Tailwind base layers, typography font-face definitions
└── types/                # TypeScript interface declarations, database models, exam state
```

### 3.2. Role-Based Layout Shells
The frontend explicitly separates the user experience into two completely isolated layout shells:

1. **`AdminShell` (`/admin/*` & `/teacher/*`):**
   * High-density, operational command interface.
   * Persistent 240px left structural navigation sidebar.
   * 64px fixed header with global omnibox search (`cmdk`), academic cycle indicator, and role badge.
   * Designed for high information density, deep analytics, and management workflows.
2. **`ExamShell` (`/exam/*`):**
   * Ultra-clean, distraction-free examination interface.
   * **Zero administrative menus, zero sidebar, zero external links.**
   * Locked upper telemetry strip (48px) with large-numeral synchronized chronometer, cadet docket, and encrypted autosave indicators.
   * Centered, maximum 860px reading pane for optimal optical stamina.
   * Persistent right-hand Question Matrix drawer (320px) indicating answered, unanswered, and flagged question states.

---

## 4. Backend Platform & Infrastructure (Supabase)

The backend infrastructure is powered by **Supabase**, providing an enterprise-grade PostgreSQL foundation:

### 4.1. Relational Database (Supabase PostgreSQL)
A relational schema designed for high relational integrity, transactional evaluation logs, and cryptographic auditability:
* **Academic & Structure:** `forces`, `courses`, `subjects`, `batches`, `cadets`, `instructors`.
* **Question Bank:** `questions`, `question_options`, `question_media`, `taxonomies`, `derivations`.
* **Testing Engine:** `tests`, `test_sections`, `test_blueprints`, `test_assignments`.
* **Execution & Telemetry:** `exam_sessions`, `session_events`, `cadet_answers`, `flagged_items`.
* **Evaluation & Remediation:** `exam_results`, `section_scores`, `retake_tickets`, `remediation_logs`.

### 4.2. Role-Aware Authentication (Supabase Auth)
* Session security managed via JSON Web Tokens (JWT) with custom claims.
* Roles enforced at both database Row-Level Security (RLS) and React Route Guards:
  * `Admin`: Full institutional access across all wings, settings, and faculty.
  * `Teacher` / `Instructor`: Question bank management, test construction, marked script review, retake dispatch.
  * `Student` / `Cadet`: Access limited strictly to assigned tests, active examination engine, and unlocked personal solution dossiers.

### 4.3. Realtime Telemetry Layer (Supabase Realtime)
* High-speed WebSocket channels connect cadet workstations to the proctor console:
  * **Cadet -> Proctor:** Pacing telemetry, active question index, latency heartbeats, window focus loss events.
  * **Proctor -> Cadet:** Emergency freeze commands, 30-second breath pauses, warning whispers, session terminations.

### 4.4. Storage Buckets (Supabase Storage)
* `cadet-portraits`: Standardized institutional cadet and instructor docket images.
* `question-media`: High-resolution SVG diagrams, formula sheets, non-verbal matrix assets.
* `solution-dossiers`: Auto-generated candidate solution PDFs and cryptographic exam transcripts.

---

## 5. Deployment & Source Control

* **Hosting & CI/CD:** **Vercel**
  * Automated preview deployments on branch pull requests.
  * Production deployment linked directly to the `main` branch.
  * Environment configuration partitioned into `Development`, `Staging`, and `Production`.
* **Source Control:** **GitHub**
  * Authoritative remote Git repository.
  * Feature-branch workflow with automated linting, type-checking, and build validation prior to merge.

---

## 6. UI/UX Design Intelligence Layer

The project formally integrates the methodology and design intelligence from:
* **Repository:** `nextlevelbuilder/ui-ux-pro-max-skill`
* **URL:** `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`
* **Core Domains Applied:**
  * `ui-ux-pro-max`: Advanced UX patterns, information architecture, cognitive load reduction.
  * `design-system`: Token governance, component API composition, visual hierarchy.
  * `ui-styling`: Color contrast formulas, typography scale ratios, optical spacing.
  * `brand`: Institutional military discipline, dignified aesthetic balance.

> [!IMPORTANT]
> **Relationship to Existing Stitch Designs:**
> The `ui-ux-pro-max-skill` is an **intelligence and refinement layer**, not an application replacement. It does not overwrite the approved visual direction captured in the Stitch prototype; rather, it guides the implementation of missing states, accessibility compliance, responsive mechanics, and production React components.
