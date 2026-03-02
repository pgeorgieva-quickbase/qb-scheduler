# QB Scheduler — Design System

## Direction

**Who is this human?** A dispatcher at a field service company — managing 5-40 technicians, sitting at a desk with a large monitor, switching between Quickbase tables and this scheduler. They think in terms of "who goes where, when." They need to see the whole picture at a glance, then drill into specifics. Their day is interruptions — phones ringing, urgent reschedules, sick calls.

**What must they accomplish?** Assign work orders to technicians across a timeline. Spot conflicts. Fill gaps. Optimize routes. React fast when things change.

**What should this feel like?** A control tower — dense but calm. Information-rich without being overwhelming. The confidence of a well-organized dispatch board, not the anxiety of a cluttered whiteboard. Quickbase-native: it should feel like it was always part of the platform.

## Domain Exploration

**Domain concepts:** Dispatch board, shift roster, timeline gantt, route optimization, availability grid, skill matrix, coverage map.

**Color world:** The world of dispatch is steel-gray control rooms, amber status lights, green "all-clear" signals, blue map pins on white territory, red alerts on dark monitoring screens. Blue-collar reliability meets white-collar software.

**Signature element:** The **skill-matching glow** — when dragging a work order, technician rows illuminate with gradient intensity based on skill compatibility. Green-to-amber luminance tells you instantly where this job belongs, like a heat map of capability. No other scheduler does this.

**Defaults rejected:**
1. ~~Pastel event blocks on white timeline~~ → **Saturated, high-contrast blocks on neutral-warm canvas** — dispatch needs instant visual parsing at distance
2. ~~Generic sidebar with nav links~~ → **No sidebar. Report-level toolbar + bottom unassigned panel** — matches Quickbase's report paradigm
3. ~~Card-heavy layout~~ → **Dense, borderless timeline rows** — dispatchers scan rows, not cards

## Depth Strategy

**Borders-only with selective shadow.** The timeline grid uses ultra-thin 1px borders for cell delineation (dispatchers need the grid). Popovers and modals use subtle shadows. The unassigned panel separates via a single top border. Consistent with Quickbase's own low-shadow approach.

## Palette

```css
/* Quickbase-native — matches QB's own palette direction */
--qb-blue: #1A73E8;            /* QB primary blue */
--qb-blue-hover: #1557B0;
--qb-blue-light: rgba(26, 115, 232, 0.08);
--qb-blue-ring: rgba(26, 115, 232, 0.25);

/* Canvas */
--canvas: #FAFBFC;              /* Slightly cool white, like QB report bg */
--surface: #FFFFFF;
--surface-hover: #F4F5F7;
--surface-active: #EBECF0;

/* Text */
--ink-primary: #172B4D;         /* Dark navy — QB heading color */
--ink-secondary: #5E6C84;       /* Muted for labels */
--ink-tertiary: #97A0AF;        /* Placeholders, timestamps */
--ink-inverse: #FFFFFF;

/* Timeline-specific */
--grid-line: rgba(23, 43, 77, 0.06);
--grid-line-hour: rgba(23, 43, 77, 0.12);
--now-line: #EB5A46;            /* Red "current time" marker */

/* Status — derived from dispatch monitor aesthetics */
--status-new: #0052CC;          /* Deep blue — new/unassigned */
--status-scheduled: #00875A;    /* Green — assigned */
--status-in-progress: #FF991F;  /* Amber — active */
--status-complete: #97A0AF;     /* Gray — done */
--status-critical: #DE350B;     /* Red — urgent/SLA risk */

/* Conflict/validation */
--conflict-bg: rgba(222, 53, 11, 0.06);
--conflict-border: #DE350B;
--warning-bg: rgba(255, 153, 31, 0.08);
--warning-border: #FF991F;
--match-glow: rgba(0, 135, 90, 0.15);  /* Skill match highlight */
--mismatch-glow: rgba(255, 153, 31, 0.12);

/* AI elements — FastField design system */
--ai-purple: #8B5CF6;
--ai-indigo: #6366F1;
--ai-blue: #1FB6FF;
--ai-gradient: linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #1FB6FF 100%);
--ai-gradient-hover: linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #009EEB 100%);
--ai-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
```

## Typography

```css
/* Matches Quickbase's own typeface */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
```

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Report title | 20px | 600 | --ink-primary |
| Toolbar labels | 13px | 500 | --ink-secondary |
| Technician name | 13px | 600 | --ink-primary |
| WO block title | 12px | 500 | --ink-inverse (on colored block) |
| WO block time | 11px | 400 | rgba(255,255,255,0.8) |
| Timeline hours | 11px | 500 | --ink-tertiary |
| Unassigned card title | 13px | 500 | --ink-primary |
| Badge text | 11px | 600 | varies |
| Wizard step title | 16px | 600 | --ink-primary |
| Wizard field label | 13px | 500 | --ink-secondary |

## Spacing

Base unit: **4px**. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.

- Timeline row height: 48px
- WO block vertical padding: 4px
- Grid cell: 60px per hour (week view), 120px per hour (day view)
- Technician label width: 180px
- Unassigned panel height: 200px (resizable)
- Toolbar height: 48px

## Border Radius

```css
--radius-sm: 3px;    /* WO blocks, badges */
--radius-md: 6px;    /* Cards, inputs */
--radius-lg: 8px;    /* Modals, popovers */
```

## Shadows

```css
--shadow-popover: 0 4px 16px rgba(23, 43, 77, 0.12), 0 0 1px rgba(23, 43, 77, 0.15);
--shadow-modal: 0 8px 32px rgba(23, 43, 77, 0.16), 0 0 1px rgba(23, 43, 77, 0.12);
--shadow-toast: 0 4px 12px rgba(23, 43, 77, 0.15);
```

## WO Block Color Mapping

Work order blocks on the timeline are colored by status:
- **New/Unassigned**: `--status-new` bg, white text
- **Scheduled**: `--status-scheduled` bg, white text
- **In Progress**: `--status-in-progress` bg, `--ink-primary` text
- **Complete**: `--surface-active` bg, `--ink-tertiary` text (faded)
- **Critical/Urgent**: `--status-critical` bg, white text, subtle pulse animation

Priority shown as left-edge accent:
- P1: 3px left border `--status-critical`
- P2: 3px left border `--status-in-progress`
- P3: no accent
- P4: no accent

## Component Patterns

### Timeline Grid
- CSS Grid: columns = hours, rows = technicians
- Horizontal scroll for day view (24 columns)
- Sticky left column (technician labels)
- Alternating row background: transparent / rgba(23, 43, 77, 0.02)

### WO Block (on timeline)
- `position: absolute` within row, left/width calculated from time
- `border-radius: 3px`, no border, solid background
- Truncated text with tooltip on hover
- Grab cursor, draggable via react-dnd

### Unassigned Card
- Compact row: [priority dot] [WO#] [title] [duration badge] [skills tags]
- Draggable, shows ghost when dragging
- Hover: subtle background shift

### AI Button
- Uses FastField `--ai-gradient` background
- White sparkle icon (FastField standard SVG)
- Hover: `--ai-gradient-hover` + `--ai-shadow`
- Text: "Schedule with AI" — 13px, weight 600, white
