# Forces Academy Computerized Testing Software — Design System Specification

---

## 1. Visual Philosophy & Brand Personality

The **Forces Academy Computerized Testing Software** serves high-stakes defence preparation testing where cognitive focus, discipline, and uncompromising institutional trust are paramount.

### Core Visual Attributes
* **Discipline:** Structured predictability, strict tabular alignments, razor-thin division lines, and mathematically consistent spacing.
* **Clarity:** Maximum legibility, high contrast, zero cognitive clutter, and locked typographical hierarchies.
* **Trust & Readiness:** Sober military rigor balanced with modern enterprise software refinement.
* **Institutional Authority:** Grounded in genuine armed forces heritage (Pakistan Army, PAF, Navy) without descending into novelty.

### Target Visual Direction
$$\text{Premium B2B SaaS} + \text{Modern Assessment Platform} + \text{Institutional Software} + \text{Subtle Defence Identity}$$

### Prohibited Aesthetics (Strict Anti-Patterns)
The application must **NEVER** exhibit:
* Gaming aesthetics or esports-style HUDs.
* Military-game interfaces or combat simulator graphics.
* Camouflage patterns, heavy stencils, or novelty military badges.
* Neon borders, glowing highlights, or cyber-hacker themes.
* Excessive glassmorphism, floating cards, or high-blur backdrops.
* Gratuitous 3D scenes, floating meshes, or ambient particle simulations.
* Flashy, bouncy, or lingering entrance animations.
* Generic Bootstrap dashboards or un-customized default shadcn/ui styling.

---

## 2. Integration of UI/UX Design Intelligence (`ui-ux-pro-max-skill`)

The project adopts the design intelligence and best-practice methodology from:
* **Repository:** `nextlevelbuilder/ui-ux-pro-max-skill` (`https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`)

### 2.1. Role of the Skill Repository
The `ui-ux-pro-max` framework is an **evaluative and architectural intelligence layer**, not the frontend framework itself. It provides rigorous design principles to:
1. Preserve the approved visual identity established in the Stitch prototype exports.
2. Resolve missing states (empty states, loading skeletons, error validation).
3. Enforce strict WCAG 2.1 AA accessibility across all custom components.
4. Architect intentional responsive behaviors across Desktop, Tablet, and Mobile.
5. Elevate component craftsmanship (optical alignment, touch target sizes, micro-interaction feedback).

### 2.2. Mandatory Areas of Application
The design intelligence guidelines must be consulted during implementation for:
* **Accessibility:** Keyboard tab indexes, focus trap management, screen-reader text, color contrast ratios.
* **Responsive Layouts:** Multi-breakpoint grid reflows, collapsible inspection drawers, responsive tables.
* **Typography:** Modular type scales, line-length constraints (max 68 characters for exam prompts), tabular numerals.
* **Color Systems:** Semantic state signaling, dark/light surface contrast, tonal layering.
* **Component Consistency:** Uniform button padding, badge dimensions, input heights, and modal envelopes.
* **Form & Table UX:** Inline validation feedback, sticky table headers, sorting indicators, and pagination rhythm.

---

## 3. Design Tokens Architecture

Implementation code must strictly consume centralized tokens from Tailwind theme extensions and CSS variables. Arbitrary inline pixel values and ad-hoc utility classes are strictly prohibited.

### 3.1. Color Tokens (Military Institutional Palette)

```css
:root {
  /* Command Core Swatches */
  --primary: #0E1B2A;                 /* Primary Command Navy (Mastheads, primary actions, active tabs) */
  --primary-foreground: #FFFFFF;
  --primary-container: #0F1C2B;       /* Deep Maritime Midnight */
  --on-primary-container: #788598;

  --secondary: #455D4A;               /* Tactical Field Slate Green (Readiness, verified markers, metrics) */
  --secondary-foreground: #FFFFFF;
  --secondary-container: #CEEAD1;
  --on-secondary-container: #234E35;

  --tertiary: #C6A75E;                /* Academy Muted Brass (Honors, countdown warnings, key distinction) */
  --tertiary-foreground: #FFFFFF;
  --tertiary-container: #FDF7EC;
  --on-tertiary-container: #7A5312;

  --neutral-charcoal: #1F2937;        /* Base text for stems, body copy, and reading panes */
  --neutral-muted: #64748B;           /* Subtitle metadata, secondary labels */

  /* Surface Elevation Hierarchy */
  --background: #F6F8FA;              /* Base Environment (Tinted, glare-reducing clinical canvas) */
  --surface-card: #FFFFFF;            /* Surface Level 1 (Question cards, test sheets, data tables) */
  --surface-recessed: #EDF1F5;        /* Surface Level 2 (Locked panes, telemetry strips, code blocks) */
  --surface-subtle: #F8FAFC;          /* Hover washes, alternating table rows */

  /* Hairlines & Dividers */
  --border-hairline: #D4D9DF;         /* Primary component perimeter border (1px solid) */
  --border-subtle: #E2E6EB;           /* Interior row dividers and secondary separators */
  --border-focus: #0E1B2A;            /* Active input border */
  --ring-focus-offset: #C6A75E;       /* Focus ring accent */

  /* Operational Status & State Signaling */
  --status-pass-text: #234E35;
  --status-pass-bg: #EDF6F0;
  --status-pass-border: #88BE9B;

  --status-fail-text: #782525;
  --status-fail-bg: #FDF2F2;
  --status-fail-border: #E29A9A;

  --status-paused-text: #7A5312;
  --status-paused-bg: #FDF7EC;
  --status-paused-border: #DEC088;

  --status-retake-text: #405364;
  --status-retake-bg: #EEF2F6;
  --status-retake-border: #9BB0C1;
}
```

### 3.2. Typography Tokens

The typography architecture pairs **Geist** for technical precision and numerals with **Inter** for reading legibility, supported by **JetBrains Mono** for chronometers:

| Token Name | Font Family | Size | Weight | Line Height | Letter Spacing | Primary Usage |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `display-hero` | Geist | 40px | 700 | 48px | -0.025em | Major KPI numbers, score percentages |
| `headline-xl` | Geist | 32px | 600 | 40px | -0.02em | Screen titles, console headers |
| `headline-lg` | Geist | 24px | 600 | 32px | -0.015em | Module headers, card group titles |
| `headline-md` | Geist | 20px | 600 | 28px | -0.01em | Modal headers, batch titles |
| `headline-sm` | Geist | 16px | 600 | 24px | 0em | Subsection titles, table group headers |
| `body-lg` | Inter | 16px | 400 | 26px | -0.005em | Exam question prompts (locked <= 68 chars) |
| `body-md` | Inter | 14px | 400 | 22px | 0em | Standard copy, explanations, descriptions |
| `body-sm` | Inter | 12px | 400 | 18px | +0.01em | Field hints, secondary metadata |
| `label-tabular`| Geist | 13px | 500 | 18px | +0.02em | Buttons, table cell figures (`tabular-nums`) |
| `label-code` | JetBrains Mono | 12px | 500 | 16px | +0.08em | Terminal IDs, hash seals, formula tags |
| `caption-caps` | Geist | 11px | 600 | 14px | +0.10em | Uppercase telemetry tags, status badges |

### 3.3. Spacing Rhythm (4px / 8px Grid)
* `space-2xs`: 2px
* `space-xs`: 4px
* `space-sm`: 8px
* `space-md`: 12px
* `space-base`: 16px
* `space-lg`: 24px
* `space-xl`: 32px
* `space-2xl`: 48px
* `space-3xl`: 64px

### 3.4. Corner Radius Tokens (Precision Disciplined)
* **Base Radius (`rounded-md` / `4px`):** Standard cards, buttons, input fields, and modal containers.
* **Micro Radius (`rounded-xs` / `2px`):** Status badges, question palette tiles, keyboard shortcut tags.
* **Avatars:** Square or soft-squared with 4px radius (`rounded-md`). **Circular avatars are prohibited** for cadet identification dockets to preserve the official military personnel record look.
* **Pill Elements (`rounded-full`):** Strictly restricted to small status dots (`w-2 h-2 rounded-full`) and radio inner indicators. Full pill buttons are prohibited.

### 3.5. Elevation, Depth & Hairline Borders
Spatial layering is articulated exclusively through **tonal surface differences and razor-thin hairline borders**, eliminating diffuse glows and blurred ambient drop shadows:
* **Level 0 (Command Background):** `#F6F8FA`
* **Level 1 (Card / Plate):** `#FFFFFF` paired with 1px border (`#D4D9DF`).
* **Level 2 (Recessed Readout / Telemetry Pane):** `#EDF1F5` border-framed by `#C9CFD6`.
* **Level 3 (High-Alert / Modal Overlay):** `#FFFFFF` reinforced with 1.5px `#0E1B2A` border and hard structural edge `0 4px 0 0 rgba(14, 27, 42, 0.08)` backed by 40% Navy backdrop.

---

## 4. Customizing shadcn/ui to the Forces Academy Design System

Adding shadcn/ui does not automatically make the software look premium. Every shadcn component must be customized to adhere to the Forces Academy tokens:

* **Button Component (`<Button>`):**
  * Primary: Background `#0E1B2A`, foreground `#FFFFFF`, border 1px solid `#0E1B2A`, radius 4px, height 40px (desktop) / 44px (touch). Font: `label-tabular` in 600 weight.
  * Secondary: Background `#FFFFFF`, foreground `#0E1B2A`, border 1px solid `#D4D9DF`. Hover: `#EDF1F5`.
  * Destructive: Background `#FFFFFF`, foreground `#782525`, border 1px solid `#E29A9A`. Hover: `#FDF2F2`.
* **Badge Component (`<Badge>`):**
  * Height 22px, radius 2px, font `caption-caps`, uppercase, tabular numerals, 2px vertical / 6px horizontal padding.
* **Input Component (`<Input>`):**
  * Height 40px, background `#FFFFFF`, border 1px solid `#D4D9DF`, radius 4px, font Inter 14px. Focus: border `#0E1B2A` with 1px solid `#C6A75E` offset ring.
* **Dialog / Modal Component (`<Dialog>`):**
  * Radius 4px, border 1.5px solid `#0E1B2A`, shadow `0 4px 0 0 rgba(14, 27, 42, 0.08)`, backdrop Navy 40% blur-xs.

---

## 5. Iconography Standards (Lucide React)

**Lucide React is the single approved icon library across the entire software.**
* **Consistency Rules:**
  * Default icon bounding box: 18x18px (`className="w-[18px] h-[18px]"`).
  * Default stroke width: `1.75px` or `2.0px`.
  * Heavy fills are avoided; icons maintain clean line geometry.
* **Harmonization from Stitch Prototype:**
  * Where the Stitch prototype utilized Material Symbols Outlined, the implementation replaces them directly with equivalent Lucide React icons:
    * `dashboard` -> `<LayoutDashboard />`
    * `group` / `groups` -> `<Users />`
    * `badge` -> `<IdCard />`
    * `military_tech` -> `<Award />` / `<Medal />`
    * `inventory_2` -> `<Boxes />` / `<FolderGit2 />`
    * `quiz` -> `<FileQuestion />`
    * `videocam` -> `<Video />`
    * `analytics` -> `<BarChart3 />`
    * `replay` -> `<RotateCcw />`
    * `summarize` -> `<FileText />`
    * `verified` / `task_alt` -> `<CheckCircle2 />`
    * `warning` -> `<AlertTriangle />`
    * `lock_clock` -> `<Lock />`
    * `notifications` -> `<Bell />`
    * `cached` -> `<RefreshCw />`

---

## 6. Three.js / Advanced Visual Guidelines

**Three.js, React Three Fiber, and Drei represent an enhancement layer, not a core UI dependency.**

### Permitted & Suitable Areas:
* **Academy Insignia 3D Crest:** Subtle, interactive 3D brass/navy insignia on the Authentication login portal.
* **Academy Landing Visualization:** Architectural 3D wireframe or subtle low-polygon terrain map representing tactical testing commands.
* **Certificates & Transcripts:** High-fidelity 3D holographic seal rendering for official candidate verification dockets.

### Strictly Prohibited Areas:
* **Active Examination Interface (`ExamShell`):** Absolute prohibition. Zero 3D canvases or WebGL loops during test taking.
* **Question Bank & Authoring Studios:** Strictly prohibited.
* **Live Monitoring Radar:** Strictly prohibited (radar is rendered via fast 2D SVG/Canvas).
* **Data Tables & Forms:** Strictly prohibited.
* **Performance Rule:** Three.js bundles must be code-split and dynamically imported (`React.lazy`). They must never load on examination or operational monitoring routes.

---

## 7. Motion & Micro-interaction Rules

Motion is deployed strictly to provide cognitive feedback, not decorative spectacle:
* **Standard Duration:** **150ms to 250ms** for all UI state transitions (e.g., hover washes, drawer slides, accordion expands).
* **Easing Curve:** Standard cubic-bezier `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out quint) for crisp, responsive physical stops.
* **Reduced Motion:** All animations must wrap inside `@media (prefers-reduced-motion: reduce)` or Framer Motion `reducedMotion="always"`.
* **Prohibited Animations:**
  * Constant looping background animations.
  * Bouncing buttons or pulsing text.
  * Dramatic 3D page flips or camera swoops.
  * Animated distractions during an active test session.

---

## 8. Accessibility Requirements (WCAG 2.1 AA)

Accessibility is treated as a core institutional engineering requirement:
* **Keyboard Navigation:** Every interactive element (question options, palette cells, modals, table rows) must be fully navigable via `Tab`, `Arrow keys`, `Space`, and `Enter`.
* **Visible Focus Rings:** Strict 2px solid `#0E1B2A` focus ring with a 1px `#C6A75E` offset. Focus outlines must never be suppressed via `outline: none` without a custom replacement ring.
* **Color Contrast:** All body text (`#1F2937` or `#0F172A`) against canvas (`#FFFFFF` / `#F6F8FA`) achieves a contrast ratio exceeding **7:1** (AAA standard). Secondary metadata text exceeds **4.5:1** (AA standard).
* **Non-Color State Signaling:** Status signals must combine color with icons and text labels (e.g., Pass is indicated by green background, a checkmark icon, and the uppercase word `QUALIFIED (PASS)`).
* **Touch & Click Targets:** Minimum interaction target size is **40x40px** on desktop and **44x44px** on touch surfaces.
