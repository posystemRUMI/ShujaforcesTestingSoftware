# Forces Academy Computerized Testing Software — Frontend Engineering & Implementation Rules

---

## 1. Fundamental Architectural Rule: Student vs. Admin Design Partitioning

The application strictly partitions user experience into two completely independent architectural models:

```text
┌────────────────────────────────────────────────────────┐
│               FORCES ACADEMY PLATFORM                  │
└──────────────────────────┬─────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│     ADMIN / TEACHER     │       │     STUDENT / CADET     │
│       `AdminShell`      │       │       `ExamShell`       │
├─────────────────────────┤       ├─────────────────────────┤
│ • Operational & Dense   │       │ • Calm & Minimal        │
│ • Persistent Sidebar    │       │ • Zero Admin Distraction│
│ • Analytical Cockpits   │       │ • High Contrast Canvas  │
│ • Faculty Interventions │       │ • Realtime Chronometer  │
│ • High Telemetry Load   │       │ • Question Palette Grid │
└─────────────────────────┘       └─────────────────────────┘
```

### 1.1. Admin & Faculty Experience (`AdminShell`)
* **Role:** Operations, monitoring, assessment assembly, marked script audits, retake remediation.
* **Atmosphere:** Operational, analytical, information-dense, and management-oriented.
* **Layout Structure:** Fixed 240px navigation sidebar, 64px command topbar with omnibox search, responsive multi-column data grids.

### 1.2. Student Examination Experience (`ExamShell`)
* **Role:** Active candidate testing, timed multi-section examination, encrypted autosave telemetry.
* **Atmosphere:** Calm, focused, minimal, exam-centered, zero cognitive stress.
* **Strict Architectural Isolation Rule:**
  > [!IMPORTANT]
  > Under **NO circumstances** may an active examination screen inherit the administrative dashboard shell, sidebar, or faculty navigation menus. All student testing routes (`/exam/*`) must render inside the dedicated `ExamShell`.

---

## 2. Stitch Design System Integration Rule

The Stitch-generated HTML files and PNG screenshots located in `/docs` represent the **authoritative visual reference for all approved screens**.

### 2.1. Rule of Synthesis
During frontend implementation, engineering decisions must synthesize:
$$\text{Stitch Visual Source} + \text{Academy Functional Spec} + \text{DESIGN\_SYSTEM.md} + \text{ui-ux-pro-max Guidance}$$

### 2.2. Authority & Overrides
* **Do NOT arbitrarily redesign approved Stitch layouts:** The visual compositions, card hierarchies, and typographic proportions in approved Stitch screens (e.g., Command Dashboard, Result Review, Live Proctoring Radar, Question Studio) are intentionally approved.
* **Role of `ui-ux-pro-max-skill`:** The intelligence layer must **not** override an approved Stitch design. Instead, it must be consulted to:
  * Fill in missing interactive states (hover, focus, disabled, loading, empty).
  * Enforce strict WCAG 2.1 AA accessibility and ARIA roles.
  * Implement mobile and tablet responsive reflows.
  * Optimize React component structure, performance, and state hygiene.

---

## 3. Reusable Component Architecture

The frontend implementation must prioritize reusable, domain-aware components rather than duplicating layout code across route files:

### 3.1. Foundation & Layout Components
* `AdminShell`: Persistent sidebar, command topbar, main content container with breadcrumbs.
* `ExamShell`: Fullscreen, zero-scroll container with chronometer strip and right-hand question matrix rail.
* `PageHeader`: Standardized view header with title, subtitle, breadcrumbs, and primary CTA actions.
* `Breadcrumb`: Accessible navigation trail (`Console / Question Bank / Add Question Studio`).

### 3.2. Data & Telemetry Components
* `MetricCard`: Standardized KPI card with icon container, headline figure, subtitle, and progress bar.
* `StatusBadge`: 2px-radius badge rendering Pass, Fail, Verified, Active, Paused, or Retake states.
* `DataTable`: Generic TanStack Table wrapper featuring sticky headers, sorting, filtering, and pagination.
* `FilterBar`: Segmented force pills (All, Army, PAF, Navy), subject dropdowns, and search omnibox.

### 3.3. Examination Engine Components
* `ExamChronometer`: Tabular-numeral countdown timer with warning state transitions (< 5m Brass, < 1m Red).
* `QuestionStem`: High-legibility prompt canvas supporting KaTeX mathematical formulas and SVG diagrams.
* `OptionCardMCQ`: Standardized 4-option selection tile (A, B, C, D) with distinct default, hover, and active states.
* `QuestionMatrix`: 40-cell persistent grid with color-coded Answered, Unanswered, Flagged, and Current tiles.
* `DerivationProof`: Collapsible post-exam explanation box showing mathematical proofs and coaching pitfalls.

### 3.4. Feedback & Overlay Components
* `ConfirmDialog`: Hard-edged accessible confirmation dialog for high-stakes actions (submitting tests, retakes).
* `EmptyState`: Institutional empty graphic with informative message and action button.
* `SkeletonLoader`: Hairline rectangular shimmer placeholder matching exact component boundaries.

---

## 4. Form Implementation Rules (React Hook Form + Zod)

1. **Schema-First Validation:** Every form must define a strict Zod schema before component creation.
2. **Four-Option Standard:** MCQ question authoring must validate for **exactly four alternatives** (A, B, C, D) with exactly one designated correct answer.
3. **Explicit Label Associations:** All inputs must have unique `id` attributes bound to matching `<label htmlFor="...">`. Placeholder text must never substitute for a visible label.
4. **Inline Validation Feedback:** Validation errors must appear directly below the affected input in high-contrast red (`#BA1A1A`) with an accompanying alert icon.
5. **Autosave Debouncing:** Long-form inputs (e.g., question stems, explanations) must implement debounced autosaving (500ms) to prevent data loss on unexpected blur.

---

## 5. Table Implementation Rules (TanStack Table)

1. **Horizontal Scroll Containment:** Every table must be wrapped in an explicit container:
   ```tsx
   <div className="w-full overflow-x-auto border border-border-hairline rounded-md">
     <table className="w-full text-left border-collapse min-w-[800px]">
       ...
     </table>
   </div>
   ```
2. **Sticky Header Row:** All tables with more than 10 rows must implement `sticky top-0 bg-surface-card z-10` to preserve column context during scrolling.
3. **Tabular Numerals:** All numeric table cells (scores, roll IDs, dates, percentages) must declare `font-variant-numeric: tabular-nums` or `font-label-tabular`.
4. **Empty State Handling:** When zero rows match current filters, tables must render a dedicated `<EmptyState />` row rather than collapsing to an empty white space.

---

## 6. Responsive Design Rules

Responsive adaptation must be **intentionally engineered**, not simply stacked:

* **Desktop First (`>= 1280px`):** Primary operational viewport. Full sidebars, multi-column grids, and persistent rails.
* **Tablet Landscape (`1024px – 1279px`):** Sidebars collapse to 72px icon rail; right inspection rails convert to slide-over drawers.
* **Mobile & Small Tablet (`< 1024px`):**
  * Admin sidebar moves into an accessible off-canvas hamburger drawer.
  * In the exam engine, the 320px Question Matrix converts into a sticky bottom sheet or toggle drawer, giving 100% viewport width to the question stem and option cards.
  * Tables collapse into stacked tactical cards or enable smooth horizontal touch scrolling.

---

## 7. Performance & Offline CBT LAN Readiness

Forces Academy testing centers frequently operate in secure, air-gapped intranet environments:

1. **Zero External CDN Reliance:**
   * Tailwind CSS must be pre-compiled via Vite build tools (`postcss` / `tailwindcss`). The CDN runtime script (`https://cdn.tailwindcss.com`) is **strictly prohibited in production**.
   * Web fonts (`Geist`, `Inter`, `JetBrains Mono`) must be self-hosted locally in `/src/assets/fonts/`.
   * Lucide React icons must be bundled directly into the JavaScript chunk.
   * All cadet photos and insignia graphics must reside in local storage or local Supabase instances.
2. **Code Splitting & Lazy Loading:**
   * Route-level code splitting via `React.lazy()` and `<Suspense>`.
   * Three.js visual modules must reside in independent asynchronous chunks and never block the initial bundle.
3. **Exam Engine Resilience:**
   * Candidate examination state (selected answers, flags, elapsed seconds) must be mirrored to local client storage (`localStorage` / `IndexedDB`) on every tick.
   * If the network heartbeat drops, the client continues uninterrupted and queues answers for background synchronization.

---

## 8. Accessibility Verification Checklist (WCAG 2.1 AA)

Before any screen or component is considered ready for production, verify:
* [ ] Focus is clearly visible on all interactive elements using the 2px Navy / Gold offset ring.
* [ ] All clickable elements are native `<button>` or `<a>` elements with keyboard trigger handlers (`Enter` and `Space`).
* [ ] Modals and drawers implement `aria-modal="true"` and trap keyboard focus while open.
* [ ] All status indicators combine color with text and icons (no color-only state).
* [ ] Form fields have explicit `<label>` tags with descriptive validation messages.
* [ ] Stems and body text maintain a contrast ratio of >= 7:1 against their backgrounds.
* [ ] Animation transitions respect `prefers-reduced-motion`.
