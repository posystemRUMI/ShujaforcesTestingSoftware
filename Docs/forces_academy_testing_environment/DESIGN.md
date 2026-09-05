---
name: Forces Academy Testing Environment
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#44474c'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cc'
  surface-tint: '#535f71'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0f1c2b'
  on-primary-container: '#788598'
  inverse-primary: '#bac7dc'
  secondary: '#4c6451'
  on-secondary: '#ffffff'
  secondary-container: '#ceead1'
  on-secondary-container: '#526a56'
  tertiary: '#745b19'
  on-tertiary: '#ffffff'
  tertiary-container: '#c6a75e'
  on-tertiary-container: '#513c00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3f8'
  primary-fixed-dim: '#bac7dc'
  on-primary-fixed: '#0f1c2b'
  on-primary-fixed-variant: '#3b4858'
  secondary-fixed: '#ceead1'
  secondary-fixed-dim: '#b2cdb6'
  on-secondary-fixed: '#092011'
  on-secondary-fixed-variant: '#354c3a'
  tertiary-fixed: '#ffdf98'
  tertiary-fixed-dim: '#e4c377'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4301'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-xl:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-code:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-tabular:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  caption-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 2px
  space-xs: 4px
  space-sm: 8px
  space-md: 12px
  space-base: 16px
  space-lg: 24px
  space-xl: 32px
  space-2xl: 48px
  space-3xl: 64px
  grid-gutter: 16px
  grid-margin: 24px
---

## Brand & Style

This design system serves high-stakes defence preparation testing software where discipline, technical precision, and mental clarity are vital. The design aesthetic balances military-grade operational rigor with the refinement of modern enterprise evaluation platforms.

- **Demeanor:** Authoritative, uncompromisingly structured, focused, and institutional. It strips away gamification and superficial visual noise in favor of sober clarity and operational readiness.
- **Target Users:** Defence academy cadets, tactical flight/command applicants, proctors, psychometric evaluators, and military testing administrators.
- **Atmosphere & Emotional Response:** Cadets must feel calm vigilance, psychological focus, and high accountability. Proctors and instructors experience immediate situational awareness through structured data hierarchies, pristine telemetry, and dense, unyielding layout logic.
- **Design Movement:** Technical Modernism hybridized with Institutional Minimalist architecture—characterized by sharp division lines, strict tabular alignments, razor-thin framing, and deliberate, low-luminance military color accents.

## Colors

The palette establishes an atmosphere of controlled operational readiness, utilizing deep maritime navy, field slate green, and muted brass hardware accents against sterile clinical light surfaces.

### Core Swatches
- **Primary Navy (`#0E1B2A`):** The primary command color used for system mastheads, high-priority navigation frames, dominant active tabs, and primary action controls.
- **Secondary Slate Green (`#455D4A`):** Derived from military field equipment and instrument panels; used for verified readiness states, module categories, secondary focal anchors, and operational metrics.
- **Tertiary Muted Brass (`#C6A75E`):** Represents academy honors, timing warnings, flagship distinctions, and high-value exam conditions. It must be deployed sparingly to preserve its impact.
- **Neutral Charcoal (`#1F2937`):** The base tone for primary body text, question content, and analytical reading panes.

### Surface Architecture
- **Base Environment (`#F6F8FA`):** A tinted, glare-reducing light background that reduces eye strain during long-duration assessment sessions.
- **Surface Elevation High (`#FFFFFF`):** High-contrast exam canvas cards, test sheet modules, and input enclosures.
- **Subtle Surface Tint (`#EDF1F5`):** Locked question partitions, proctor control bars, and read-only candidate telemetry blocks.

### System & State Signaling
- **Active / Operational:** `#0E1B2A` with `#EDF1F5` bounding highlights.
- **Pass / Standard Met:** Deep Forest `#234E35` over Tint `#EDF6F0` (Border: `#88BE9B`).
- **Fail / Standard Unmet:** Ordnance Crimson `#782525` over Tint `#FDF2F2` (Border: `#E29A9A`).
- **Paused / Under Review:** Tactical Amber `#7A5312` over Tint `#FDF7EC` (Border: `#DEC088`).
- **Retake / Re-evaluate:** Slate Slate `#405364` over Tint `#EEF2F6` (Border: `#9BB0C1`).
- **Cadet Attention / Warning:** Tactical Amber `#9A7528` over `#FFF8EB`.

## Typography

The typography architecture uses **Geist** for technical precision in headlines, numerals, time-readouts, telemetry, and status indicators, while **Inter** delivers high optical legibility across multi-clause examination prompts and technical evaluation manuals.

### Rules of Application
- **Tabular Numerals:** All exam timers, candidate roll IDs, question indices, section counts, and psychometric scores must render with monospaced/tabular figures (`font-variant-numeric: tabular-nums`).
- **Telemetry & Section Headers:** Use `caption-caps` transformed to uppercase with elevated letter-spacing (`0.1em`) to identify module codes, test status markers, and operational metadata (e.g., `SECTION 03 // SPATIAL REASONING`).
- **Exam Question Readability:** Main question stems must employ `body-lg` at 400 weight with strict 26px line height, locked at a maximum line length of 68 characters to prevent reader fatigue.
- **Display Weights:** Never exceed 700 weight. The system emphasizes clarity over heavy graphic impact.

## Layout & Spacing

Testing environments rely on structured predictability. The layout employs a strict 4px baseline sub-grid tied to an 8px architectural layout rhythm.

### Grid Framework
- **Desktop Primary (1280px - 1920px+):** Fixed full-height operational shell (`100vh` zero-scroll outer boundary).
  - Left Structural Navigation: 72px collapsed / 240px proctor expansion.
  - Main Test Console: 12-column grid, 16px gutter, centered question view constrained to 860px for focused test taking.
  - Right Operational Rail: 320px persistent panel for Question Matrix navigation, timer telemetry, and marking flags.
- **Tablet Landscape (1024px - 1279px):** 8-column layout, 16px gutters, collapsible secondary diagnostic panel into an off-canvas drawer.
- **Restricted Mobile / Field Slate (Below 1024px):** 4-column layout, 12px gutters, stacked test panel, and fixed sticky bottom navigation controls for section progression.

### Operational Margins and Panes
- Screen margins are fixed at `24px` on desktop and `16px` on tablet/mobile devices.
- Internal component containers follow an inside-out rhythm: `8px` between related tactical rows, `16px` between decoupled component groups, and `24px` outer interior card padding.

## Elevation & Depth

This system intentionally eliminates blurred drop shadows, diffuse glows, and non-structural ambient lighting. Instead, spatial hierarchy is articulated purely through **tonal layers, precise 1px hairline borders, and tactical inset surfaces**.

### Surface Hierarchy
- **Level 0 (Command Background):** `#F6F8FA`. The foundational canvas behind operational units.
- **Level 1 (Card/Console Plate):** `#FFFFFF` paired with an unambiguous 1px border (`#D4D9DF`). This is the primary interactive tier for question containers, option modules, and data tables.
- **Level 2 (Recessed Readout / Active Matrix):** `#EDF1F5` border-framed by `#C9CFD6`. Used for timer counters, code test panes, locked items, and contextual command strips.
- **Level 3 (Modal / High Alert Overlay):** `#FFFFFF` backed by a 40% opacity Navy backdrop (`#0E1B2A`). Border reinforcement increases to a 1.5px `#0E1B2A` perimeter. Shadow is limited to a single hard-cast structural edge: `0 4px 0 0 rgba(14, 27, 42, 0.08)`.

### Hairline Rules
All element dividers, row separators, and navigation edges use a 1px border (`#E2E6EB`). No floating elements exist; every component attaches cleanly to surrounding layout borders.

## Shapes

The interface projects precision, order, and physical equipment discipline. 

- **Base Radius Token (`1` - Soft / Controlled Corner):** Buttons, inputs, standard cards, segmented selectors, and option blocks utilize a 4px (`0.25rem`) corner radius.
- **Internal Groupings (`rounded-xs` / 2px):** Badges, tabular micro-indicators, and operational keyboard shortcut triggers use an almost-squared 2px corner radius.
- **No Circular Avatars:** Cadet identification tokens and profile badges are squared with a subtle 4px radius, preserving the military personnel docket aesthetic.
- **Zero Ellipses:** Absolute avoidance of pill buttons (`rounded-full`) or circular interaction targets, except for native radio center points.

## Components

### Buttons & Operational Actions
- **Primary Command Button:** Background `#0E1B2A`, foreground `#FFFFFF`, border 1px solid `#0E1B2A`, 4px corner radius. Height: 40px (Desktop), 44px (Tactile Field Tablet). Typographic label: `label-tabular` in 600 weight. Hover state: `#1B2D42`. Active: `#0A131E`.
- **Secondary Utility Button:** Background `#FFFFFF`, foreground `#0E1B2A`, border 1px solid `#D4D9DF`. Hover: `#EDF1F5`.
- **Destructive / Flag Button:** Background `#FFFFFF`, foreground `#782525`, border 1px solid `#E29A9A`. Hover: `#FDF2F2`.
- **Tertiary Link / Plain Action:** High-contrast text `#455D4A`, hover underline, zero padding offset.

### Badges & Status Signals
All badges are rectangular (2px corner radius), set in `caption-caps`, using tabular uppercase typography with 4px vertical / 8px horizontal padding:
- **Pass:** Text `#234E35`, BG `#EDF6F0`, Border 1px solid `#88BE9B`.
- **Fail:** Text `#782525`, BG `#FDF2F2`, Border 1px solid `#E29A9A`.
- **Active:** Text `#0E1B2A`, BG `#EDF1F5`, Border 1px solid `#0E1B2A`.
- **Paused:** Text `#7A5312`, BG `#FDF7EC`, Border 1px solid `#DEC088`.
- **Retake:** Text `#405364`, BG `#EEF2F6`, Border 1px solid `#9BB0C1`.

### Question Multiple-Choice Option Cards
- Unselected: Surface `#FFFFFF`, border 1px solid `#D4D9DF`, radius 4px. Left-side index key (`A`, `B`, `C`, `D`) set inside a dedicated 32x32px `#EDF1F5` box with 1px border divider.
- Hover: Border color transitions to `#455D4A`, subtle light wash `#F4F7F5`.
- Selected: Border 1.5px solid `#0E1B2A`, surface `#F8FAFC`. The option key indicator turns `#0E1B2A` with white lettering.

### Checkboxes & Radio Elements
- Standard 16x16px boxes with 2px radius (checkbox) or 16x16px ring (radio).
- Border: 1.5px solid `#828E9E`.
- Selected: Background `#0E1B2A`, border `#0E1B2A`, sharp geometric checkmark or 6px inner solid dot.

### Input Fields & Search Bars
- Base height 40px, surface `#FFFFFF`, border 1px solid `#D4D9DF`, radius 4px.
- Typography: Inter 14px (`body-md`), text color `#1F2937`.
- Focus State: Border color `#0E1B2A`, explicit 1px outline offset in `#C6A75E` without soft blurred glow.
- Disabled: Surface `#EDF1F5`, border `#E2E6EB`, text `#8A94A0`.

### Question Matrix Navigation Grid (Exam-Specific Component)
- A persistent cluster of numbered cells indicating exam progress.
- 32x32px squared interactive tiles with 2px corner radius.
- States:
  - *Unanswered:* Surface `#FFFFFF`, border 1px solid `#D4D9DF`, text `#5B6675`.
  - *Answered:* Surface `#0E1B2A`, border `#0E1B2A`, text `#FFFFFF`.
  - *Flagged for Review:* Surface `#FFF8EB`, border 1.5px solid `#C6A75E`, top-right triangle accent in brass `#C6A75E`.
  - *Current Active Question:* Outlined with a high-contrast 2px exterior `#455D4A` frame.

### Chronometer & Telemetry Header
- Persistent upper strip (48px height) locked with a 1px border-bottom (`#D4D9DF`).
- Features real-time synchronized clock displaying elapsed/remaining test time using `label-tabular` in `16px` Geist mono font with warning transitions to Muted Brass (`#C6A75E`) at < 5 minutes and Ordnance Crimson (`#782525`) at < 1 minute.