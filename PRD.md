# QB Scheduler — Product Requirements Document

## Overview

QB Scheduler is a Quickbase-native scheduling report type for field service companies. It provides dispatchers with a timeline-based interface to assign work orders to technicians, manage availability, and optimize schedules using AI. The product lives inside the Quickbase platform and re-uses all existing reports permissions and app settings (timezone, locale, etc.).

---

## Target User

**Primary persona: The Dispatcher**

A person at a field service company responsible for assigning work to technicians. They manage 5–40 technicians, sit at a desk with a large monitor, and switch between Quickbase tables and this scheduler throughout the day. Their work is defined by constant interruptions — phones ringing, urgent reschedules, sick calls — and they need to see the full picture at a glance, then drill into specifics fast.

They think in terms of: *"Who goes where, when?"*

**What they need:**
- See all technicians and their schedules on one screen
- Quickly assign unscheduled work to the right person
- Spot conflicts, gaps, and overloads visually
- React fast when things change (cancellations, sick calls, emergencies)
- Trust that the AI suggestions are sound, but maintain full manual control

---

## 1. Setup & Configuration

### 1.1 Setup Wizard

A simple, progressive disclosure wizard guides the user through initial configuration. The wizard uses three steps with clear validation at each stage.

**Step 1 — Report Basics**

The user provides foundational settings for the scheduler report:

- **Report title and description** — a name and optional description for the scheduler report, following the Quickbase report naming convention.
- **Default timeline view** — the user selects whether the scheduler opens in Day, Week, or Month view by default.
- **AI Optimization toggle** — a master on/off switch for AI-powered scheduling. When enabled, the user selects which constraints the AI should consider:
  - **Availability** — always active and cannot be unchecked. The AI always respects technician working days and shift hours.
  - **Skill Matching** — assign jobs only to technicians with the right certifications. Optional.
  - **Cost Optimization** — factor in hourly rates to minimize labor costs. Optional.

**Step 2 — Work Orders**

The scheduler lives on the Work Orders table (or equivalent — Assignments, Tasks, Jobs). The user maps the fields that the scheduler needs to read and write:

- **Required field mappings:**
  - Title — the display name for each work order on the timeline
  - Scheduled Start (date/time) — when the work order begins
  - Scheduled End (date/time) — when the work order ends
  - Assigned Technician — a reference field pointing to the technicians table

- **Conditional field mappings** (appear based on AI constraints selected in Step 1):
  - Required Skills — when Skill Matching is enabled

- **Additional display fields** — the user can optionally map up to 5 extra fields for context (e.g., priority, customer name, location). These appear in work order popovers and cards but are not used in scheduling logic.

- **Table filters** — optional filters to narrow which work orders appear on the scheduler (e.g., only open work orders, only high priority). Filters are built from the mapped fields using simple operators (equals, contains, is one of).

The tab label for this step ("Work Orders") is editable — the user can rename it to match their domain terminology (e.g., "Jobs", "Assignments", "Service Requests").

**Step 3 — Technicians**

The user maps the technicians/resources table:

- **Required field mappings:**
  - Name — the display name for each technician row on the timeline

- **Conditional field mappings:**
  - Skills / Certifications — when Skill Matching is enabled
  - Hourly Rate — when Cost Optimization is enabled

- **Availability (required)** — the user must configure how technician availability is determined. Two options:
  - **Schedule Report Defaults** — applies the same working days, shift hours, and holidays to all technicians (configured via the Schedule Report Defaults modal).
  - **Custom Availability** — allows per-technician or per-group schedule configuration via a dedicated modal with:
    - An optional AI text input where the user describes schedules in plain language (e.g., "Sarah and Mike work Mon–Fri, 8am to 5pm. Carlos is off every Friday."), which AI converts to structured availability data.
    - An interactive grid/timeline view with technicians in rows and days in columns. The user clicks cells to mark each technician as Available (with shift hours) or Unavailable for each day. Supports week and month views, date navigation, and Excel-style drag-to-fill for quickly applying the same setting across rows or columns.

- **Additional display fields** — up to 5 extra fields for context (e.g., region, team, phone number).

- **Table filters** — optional filters to narrow which technicians appear on the scheduler (e.g., only active technicians).

The tab label ("Technicians") is also editable to match domain terminology.

### 1.2 Schedule Report Defaults

Table-level defaults that apply to all technicians when the "Schedule Report Defaults" availability mode is selected:

- **Working Days** — select which days of the week are business days (e.g., Mon–Fri).
- **Working Hours** — standard shift window (e.g., 08:00–17:00).
- **Custom Non-Working Days** — specific dates excluded from scheduling (holidays, company closures), each with a label (e.g., "Independence Day", "Office Closure").

These defaults are accessible from both the Report Basics step (via the Timeline View card) and from the Technicians step (via a link in the Schedule Report Defaults availability card).

### 1.3 AI-Suggested Mappings

During setup, the system analyzes the user's Quickbase table fields and suggests the most likely mappings for each required field. Suggestions appear as pre-selected values that the user can accept or override manually. This reduces setup friction while maintaining full user control over every mapping.

### 1.4 Post-Setup Editing

The user can return to the wizard at any time to edit the scheduler configuration. All three steps remain accessible, and the wizard shows completion indicators for each step. Changes take effect when the user saves.

### 1.5 Entity Renaming

The entities "Work Order" and "Technician" can be renamed via the editable tab labels in the wizard. This renamed terminology propagates throughout the scheduler interface wherever those terms appear.

---

## 2. Timeline View

### 2.1 Core Interface

The timeline is the primary scheduling interface — a time-based grid with technicians as rows and time as columns.

- **Technician column** (left, sticky) — shows each technician's name, avatar, and relevant mapped details (skills, shift times). Scrolls vertically with the grid but remains pinned horizontally.
- **Time grid** (main area) — divided into time slots appropriate for the selected view. Work orders appear as colored blocks positioned by their start/end times.
- **Work order blocks** — display key identifying information (title, time). Level of detail scales with zoom level: full details in Day view, abbreviated in Month view. 

### 2.2 View Modes

Three view modes with appropriate density and time granularity:

- **Day view** — 24-hour timeline, fine-grained scheduling. Highest detail on work order blocks. Hour markers with "now" indicator.
- **Week view** — 7-day overview. Medium detail. Day columns with abbreviated work order information.
- **Month view** — Minimal detail on individual work orders.

### 2.3 Navigation

- **Previous / Next** — step backward or forward by the current view period (day, week, or month).
- **Jump to Today** — return to the current date immediately.
- **Direct date selection** — pick a specific date to navigate to, with period presets (Today, This Week, Next 2 Weeks, This Month, Next 30 Days).

### 2.4 Visual Indicators

- **"Now" line** — a vertical indicator showing the current time on the timeline (Day view).
- **Non-working time** — visually dimmed regions during hours outside the configured shift window, making working hours immediately obvious.
- **Weekends** — shown or hidden based on the "Show weekends" configuration. When shown, weekend columns are visually distinguished from weekdays.
- **Holidays / Custom non-working days** — distinctly styled to differentiate from regular non-working time. 
- **Availability events** — unavailable slots appear as colored blocks on the technician's row, clearly marking unavailable windows.

### 2.5 Work Order Popover

Clicking or hovering on a work order block opens a detail popover showing:

- All mapped fields (title, times, status, priority, skills, customer, etc.)
- Any additional display fields mapped during setup
- Assignment status and assigned technician

---

## 3. Drag-and-Drop Scheduling

### 3.1 Assigning Unassigned Work

The user drags a work order from the Unassigned panel directly onto a technician's row at the desired time. The work order snaps into position and the assignment is recorded as a pending change.

### 3.2 Moving Existing Assignments

The user drags an already-assigned work order block to:

- A different time slot on the same technician (rescheduling)
- A different technician's row (reassignment)
- A different time on a different technician (reassignment + reschedule)

### 3.3 Placement Feedback

During drag, the interface provides real-time visual feedback:

- **Available slots** — highlighted to show where the work order can be placed without conflicts.
- **Conflicts** — unavailable slots (outside shift hours, overlapping with existing assignments, blocked by availability events) are visually marked and placement is warned or blocked.
- **Skill matching** — when Skill Matching is enabled, technician rows are visually marked based on skill matching. 

### 3.4 Draft State

All drag-and-drop and AI optimization changes are in draft mode until the user explicitly saves. The interface indicates unsaved changes clearly, with Save and Cancel actions available in the toolbar.

---

## 4. Unassigned Work Orders Panel

### 4.1 Purpose

The unassigned panel serves as the "inbox" for work that needs scheduling. It lists all work orders that match the configured filters but have no technician assigned.

### 4.2 Display

Each unassigned work order card shows:

- Work order identifier (WO number)
- Title
- Time window (scheduled start/end)
- Required skills (as tags, when mapped)

### 4.3 Search & Filter

- **Search** — free-text search across work order title and identifier.
- **Filter** — by any mapped fields.
- **Sort** — by any mapped fields.

Active filters are displayed clearly so the user always knows that the view is filtered.

### 4.4 Interaction

- Work orders are draggable from the panel onto the timeline grid for assignment.
- The panel can be collapsed to maximize timeline space, and expanded when needed.

---

## 5. Filtering & Search

### 5.1 Technician Filtering

- **Search by name** — real-time text search across technician names in the left column.
- **Filter by skills** — show only technicians with specific skills/certifications.
- **Filter by other mapped fields** — when additional fields like region or team are mapped.
- **Sort** — by mapped fields.


### 5.2 Active Filter Display

All active filters are shown clearly in the interface (badge counts, or other filter indicator).

---

## 6. AI Scheduler (Solvice Integration)

### 6.1 Triggering Optimization

The user clicks the "Schedule with AI" button in the toolbar to open the AI scheduling modal. This is an on-demand action — the user decides when to run optimization.

### 6.2 Optimization Scope

Before running, the user configures the scope of the optimization:

- **Work order scope:**
  - *Schedule only unassigned work* — the AI assigns unscheduled work orders without touching existing assignments.
  - *Re-optimize all assignments* — the AI can reassign and reschedule existing work orders for a globally better solution.

- **Date range** — defaults to the currently applied timeline date range, but the user can adjust the start and end dates here.


### 6.3 Processing State

While the optimization is running, the modal shows a loading state with clear indication that processing is in progress. 

### 6.4 Results Preview

Once complete, the AI presents its proposed schedule with a breaf outcome summary:

- **Summary statistics:**
  - Number of work orders assigned / left unassigned
  - Any other relevant outcome metrics


### 6.5 Applying Changes

When the user confirms, the accepted changes are applied to the draft state. These changes follow the same Save/Cancel pattern as manual edits — they are not written to the Quickbase table until the user explicitly saves.

### 6.6 Optimization Run Logs

Each optimization run should be logged with key metadata for auditing;
These logs provide a history of AI-assisted scheduling decisions for accountability and review.

---

## 7. Data Sync & Persistence

### 7.1 Draft State Model

All changes made in the scheduler — whether manual (drag-and-drop, popover edits) or AI-generated — are held in a local draft state. The scheduler clearly indicates when there are unsaved changes.

### 7.2 Save Action

Changes are written to the Quickbase table only when the user clicks **Save**. This follows the grid-edit pattern familiar to Quickbase users: make changes freely, review the accumulated edits, then commit them all at once.

### 7.3 Discard Action

The user can discard all pending changes to revert to the last saved state.

---

## 8. Permissions & Governance

### 8.1 Report Permissions

Since the scheduler is implemented as a new Quickbase report type, it re-uses all existing reports permissions. Users who can view reports on the work orders table can view the scheduler. Users who can edit records can make scheduling changes.

### 8.2 App Settings

The scheduler honors all Quickbase app-level settings:

- **Timezone** — all times are displayed and stored in the app's configured timezone.
- **User roles and field-level permissions** 

---

## Requirements Priority Summary

| Area | Requirement | Priority |
|------|-------------|----------|
| **Permissions** | Re-use all existing reports permissions; honor app settings (timezone, locale) | Must |
| **Setup** | 3-step progressive disclosure wizard (Report Basics → Work Orders → Technicians) | Must |
| **Setup** | Schedule Report Defaults (working days, hours, holidays) at table level | Must |
| **Setup** | AI-suggested field mappings with full manual override | Should |
| **Setup** | Editable entity names (rename "Work Order" / "Technician" labels) | Nice to have |
| **Setup** | Additional display-only fields per table (up to N) | Nice to have |
| **Setup** | Post-setup editing of all configuration | Must |
| **Timeline** | Day / Week / Month views with appropriate density | Must |
| **Timeline** | Date navigation (prev/next, jump to today, date picker) | Must |
| **Timeline** | Work order blocks with detail scaling by zoom level; popover on hover | Must |
| **Timeline** | Technician column with mapped context (skills, shift) | Must |
| **Timeline** | Visual distinction for non-working time, weekends, holidays, "now" indicator | Must |
| **Drag & Drop** | Assign unassigned work to technician + time slot | Must |
| **Drag & Drop** | Move/reschedule existing assignments across technicians and time | Must |
| **Drag & Drop** | Placement feedback (available/unavailable, skill matching glow) | Must |
| **Unassigned Panel** | List with key fields, search, filter, sort | Must |
| **Unassigned Panel** | Drag from panel to timeline for assignment | Must |
| **Unassigned Panel** | Collapsible panel | Must |
| **Filtering** | Search technicians by name | Must |
| **Filtering** | Filter and sort by mapped attributes; show active filters | Must |
| **AI Scheduler** | Trigger optimization with configurable scope (unassigned only vs. re-optimize all) | Must |
| **AI Scheduler** | Date range control, applied filters summary | Must |
| **AI Scheduler** | Loading state during optimization | Must |
| **AI Scheduler** | Results preview with summary stats and per-change toggle | Must |
| **AI Scheduler** | Optimization run logs for auditing | Must |
| **AI Scheduler** | Optimization goal selection (cost, fairness, travel, priority) | Must |
| **Data Sync** | Draft state — changes saved only on explicit Save action | Must |
