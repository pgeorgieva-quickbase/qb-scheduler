# QB Scheduler — Product Specification

**Quickbase-native scheduling application for field service dispatchers.**
Feels like a first-party Quickbase report type. Timeline-based, drag-and-drop, AI-optimized.

---

## 1. Information Architecture

### 1.1 Application Layers

```
┌─────────────────────────────────────────────────┐
│  Setup Wizard (one-time configuration)          │
│  Connect tables → Map fields → Set constraints  │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Scheduler Report (daily use)                   │
│  Timeline + Unassigned panel + Filters          │
└─────────────────────┬───────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Schedule with AI (on-demand optimization)      │
│  Gather → Solve → Preview → Confirm             │
└─────────────────────────────────────────────────┘
```

### 1.2 Navigation Model

The scheduler operates as a **single-page report** embedded in the Quickbase Work Orders table. No separate app navigation — it's a report type like "Grid", "Calendar", or "Chart."

**Entry points:**
- Work Orders table → Reports → "Timeline Scheduler" (new report type)
- Direct URL: `/{appId}/table/{tableId}/report/{reportId}`

**Persistent chrome:**
- Quickbase global nav bar (top) — untouched
- Report toolbar: date range selector, view mode (day/week), filters, "Schedule with AI" button
- Report body: timeline + side panel

---

## 2. UX Flows

### 2.1 Setup Wizard Flow

Triggered on first use (no config saved) or via Settings gear icon.

```
Step 1: Connect Tables
  ├── AI scans available Quickbase tables
  ├── Proposes: "Work Orders" / "Technicians" / "Time Off"
  ├── User confirms or overrides each
  └── [Show more] → manual table picker

Step 2: Map Work Order Fields
  ├── AI reads field names/types, proposes mappings:
  │   ├── Title → "Work Order Name" (text)
  │   ├── Start → "Scheduled Start" (datetime)
  │   ├── End → "Scheduled End" (datetime)
  │   ├── Duration → "Est. Duration" (numeric, hours)
  │   ├── Status → "Status" (text/dropdown)
  │   ├── Priority → "Priority" (numeric)
  │   ├── Location → "Address" (text) or "Lat/Lng" (numeric pair)
  │   ├── Skills Required → "Required Skills" (multi-select text)
  │   └── Assigned Technician → "Assigned To" (reference field)
  ├── Each mapping shows: AI confidence badge + field type match indicator
  ├── User can accept/reject each individually
  └── [Show more] → optional fields (cost estimate, notes, SLA deadline)

Step 3: Map Technician Fields
  ├── AI proposes:
  │   ├── Name → "Full Name" (text)
  │   ├── Skills → "Certifications" (multi-select text)
  │   ├── Pay Rate → "Hourly Rate" (currency)
  │   ├── Working Hours → "Shift Start" + "Shift End" (time fields)
  │   ├── Home Base → "Home Address" (text) or "Home Lat/Lng"
  │   └── Region → "Service Area" (text)
  └── [Show more] → max hours/week, overtime rate, preferred zones

Step 4: Availability Setup
  ├── AI checks for related tables that look like time-off/events
  ├── Proposes single "Availability Events" table approach
  │   ├── Event Type → "Type" (vacation/sick/personal/training)
  │   ├── Start → datetime
  │   ├── End → datetime
  │   └── Technician → reference to Technicians table
  ├── OR: "No availability table yet" → offers to create one
  └── [Show more] → recurring events, partial-day blocks

Step 5: Review & Save
  ├── Summary card showing all mappings
  ├── "Test Connection" button → fetches 5 sample records
  ├── Preview: mini scheduler with sample data
  └── Save Configuration
```

**Progressive disclosure rules:**
- Each step shows 3-5 essential fields by default
- "Show more" expander for optional/advanced fields
- AI suggestion badges: green (high confidence), amber (medium), gray (manual)
- Tooltip on each AI suggestion: "Matched because field name contains 'start' and type is datetime"

### 2.2 Scheduler Interaction Model

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ ◀ Today ▶  │ Day │ Week │  Filters ▼  │  ✦ Schedule with AI │
├──────────────┬───────────────────────────────────────────────┤
│              │  8:00  9:00  10:00  11:00  12:00  1:00  2:00 │
│ John Smith   │  ████████  │    ██████████████████            │
│ Sarah Chen   │       ███████████  │                          │
│ Mike Torres  │  ░░░░░░░░░░░░░░░░  │  ████████               │
│ Lisa Park    │            ████████████████                    │
├──────────────┴───────────────────────────────────────────────┤
│ Unassigned Work Orders (12)                    🔍 Search     │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ WO-1042  HVAC Repair  ⏱ 2h  ⚡ High  🔧 HVAC          │  │
│ │ WO-1043  Electrical   ⏱ 1h  ○ Med   🔧 Electrical     │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Legend:
████  = Assigned work order
░░░░  = Unavailable / time off
```

**Core interactions:**

| Action | Behavior |
|--------|----------|
| Drag from unassigned → timeline | Assign WO to technician at dropped time |
| Drag WO between rows | Reassign to different technician |
| Drag WO left/right | Reschedule to different time |
| Drag right edge of WO | Resize duration |
| Click WO block | Open detail popover (edit, unassign, view) |
| Hover WO block | Show tooltip: title, time, duration, skills, status |
| Click technician name | Expand to show availability details |

**Conflict states:**

| Conflict | Visual | Behavior |
|----------|--------|----------|
| Schedule during time-off | Red dashed overlay on drop zone | Block drop + toast: "Sarah is on PTO Dec 23-24" |
| Schedule outside shift hours | Amber border on drop zone | Warn but allow: "Outside working hours (ends 5PM)" |
| Skill mismatch | Orange highlight on WO block | Warn but allow: "Mike lacks HVAC certification" |
| Double-booking | Red pulse on overlapping blocks | Block drop + toast: "Overlaps with WO-1038" |
| Exceeds daily hours | Amber badge on technician row | Warn: "John would exceed 10h today" |

**Skill matching visualization:**
When dragging a WO, technician rows highlight:
- **Green glow** = has all required skills
- **Amber glow** = has some required skills
- **No highlight** = no matching skills
- **Gray overlay** = unavailable during WO window

### 2.3 "Schedule with AI" Flow

```
1. Click "✦ Schedule with AI" button
   └── Opens modal overlay

2. Configure Scope
   ├── Which work orders? □ Unassigned only  □ All (allow reschedule)
   ├── Date range: [Today] to [+7 days]
   ├── Optimization priority:
   │   ├── ○ Minimize travel time (default)
   │   ├── ○ Minimize cost (consider pay rates)
   │   ├── ○ Balance workload (distribute evenly)
   │   └── ○ Respect priorities (high-priority first)
   └── [Show more] → max overtime, locked assignments, excluded techs

3. AI Processing
   ├── Progress bar: "Gathering data..." → "Optimizing..." → "Done"
   ├── Stats: "Scheduling 23 work orders across 8 technicians"
   └── Cancel button available

4. Preview Diff
   ├── Split view: "Current" vs "Proposed"
   ├── Change summary:
   │   ├── 18 new assignments
   │   ├── 3 rescheduled (moved earlier)
   │   ├── 2 unassignable (no qualified tech available)
   │   └── Estimated travel reduction: 34%
   ├── Per-change detail list:
   │   ├── ✅ WO-1042 → John Smith, Dec 23 9:00-11:00
   │   ├── 🔄 WO-1038 → moved from 2PM to 10AM (saves 45min travel)
   │   ├── ❌ WO-1055 → No technician with "Crane Operator" skill
   │   └── Each row: [Accept] [Reject] toggle
   ├── Mini timeline preview showing proposed schedule
   └── Overall: [Apply All] [Apply Selected] [Cancel]

5. Confirm & Apply
   ├── Write changes back to Quickbase (update WO records)
   ├── Progress: "Updating 18 work orders..."
   ├── Success toast: "18 work orders scheduled"
   └── Timeline refreshes with new assignments

6. Rollback (if needed)
   ├── Undo button in toast (30 seconds)
   └── "Schedule History" in settings → revert to snapshot
```

---

## 3. Data Model (Quickbase Tables)

### 3.1 Core Tables

**Work Orders** (primary table — scheduler report lives here)
| Field | Type | Purpose |
|-------|------|---------|
| Record ID | Auto | Primary key |
| Work Order # | Text | Display identifier (WO-XXXX) |
| Title | Text | Short description |
| Description | Rich Text | Full details |
| Status | Text (Multi-choice) | New / Scheduled / In Progress / Complete / Cancelled |
| Priority | Numeric | 1 (Critical) - 4 (Low) |
| Scheduled Start | DateTime | When work begins |
| Scheduled End | DateTime | When work ends |
| Est. Duration | Duration (hours) | Estimated time to complete |
| Location Address | Text | Street address |
| Location Lat | Numeric | Latitude (for routing) |
| Location Lng | Numeric | Longitude (for routing) |
| Skills Required | Text (Multi-select) | Required certifications/skills |
| Assigned Technician | Reference | → Technicians table |
| Customer | Reference | → Customers table (optional) |
| SLA Deadline | DateTime | Latest acceptable completion |
| Cost Estimate | Currency | Estimated cost |
| AI Scheduled | Checkbox | Was this scheduled by AI optimization? |
| AI Schedule Batch | Text | Batch ID for grouped AI scheduling |

**Technicians**
| Field | Type | Purpose |
|-------|------|---------|
| Record ID | Auto | Primary key |
| Full Name | Text | Display name |
| Email | Email | Contact |
| Phone | Phone | Contact |
| Skills | Text (Multi-select) | Certifications held |
| Hourly Rate | Currency | Pay rate |
| Shift Start | Time of Day | Default shift start |
| Shift End | Time of Day | Default shift end |
| Max Hours/Week | Numeric | Weekly hour cap |
| Home Address | Text | Starting location |
| Home Lat | Numeric | Latitude |
| Home Lng | Numeric | Longitude |
| Service Region | Text | Assigned area |
| Active | Checkbox | Currently available for scheduling |

**Availability Events** (single table approach — simplest for 80% of use cases)
| Field | Type | Purpose |
|-------|------|---------|
| Record ID | Auto | Primary key |
| Technician | Reference | → Technicians table |
| Event Type | Text (Multi-choice) | Vacation / Sick / Personal / Training / Other |
| Start | DateTime | Block start |
| End | DateTime | Block end |
| All Day | Checkbox | Full day block |
| Recurring | Text (Multi-choice) | None / Weekly / Biweekly / Monthly |
| Notes | Text | Reason/details |

### 3.2 Scheduler Configuration (App-level, not a QB table)

Stored as JSON in a Quickbase app variable or dedicated config table:

```json
{
  "version": 1,
  "tables": {
    "workOrders": { "tableId": "bqr4x5m3n", "name": "Work Orders" },
    "technicians": { "tableId": "bqr4x5m4p", "name": "Technicians" },
    "availability": { "tableId": "bqr4x5m5q", "name": "Availability Events" }
  },
  "fieldMappings": {
    "workOrders": {
      "title": { "fieldId": 6, "fieldName": "Title" },
      "scheduledStart": { "fieldId": 12, "fieldName": "Scheduled Start" },
      "scheduledEnd": { "fieldId": 13, "fieldName": "Scheduled End" },
      "duration": { "fieldId": 14, "fieldName": "Est. Duration" },
      "status": { "fieldId": 8, "fieldName": "Status" },
      "priority": { "fieldId": 9, "fieldName": "Priority" },
      "location": { "fieldId": 15, "fieldName": "Location Address" },
      "locationLat": { "fieldId": 16, "fieldName": "Location Lat" },
      "locationLng": { "fieldId": 17, "fieldName": "Location Lng" },
      "skillsRequired": { "fieldId": 18, "fieldName": "Skills Required" },
      "assignedTechnician": { "fieldId": 19, "fieldName": "Assigned Technician" }
    },
    "technicians": {
      "name": { "fieldId": 6, "fieldName": "Full Name" },
      "skills": { "fieldId": 10, "fieldName": "Skills" },
      "payRate": { "fieldId": 11, "fieldName": "Hourly Rate" },
      "shiftStart": { "fieldId": 12, "fieldName": "Shift Start" },
      "shiftEnd": { "fieldId": 13, "fieldName": "Shift End" },
      "homeLat": { "fieldId": 16, "fieldName": "Home Lat" },
      "homeLng": { "fieldId": 17, "fieldName": "Home Lng" }
    },
    "availability": {
      "technician": { "fieldId": 6, "fieldName": "Technician" },
      "eventType": { "fieldId": 7, "fieldName": "Event Type" },
      "start": { "fieldId": 8, "fieldName": "Start" },
      "end": { "fieldId": 9, "fieldName": "End" }
    }
  },
  "constraints": {
    "maxDailyHours": 10,
    "maxWeeklyHours": 40,
    "bufferMinutes": 15,
    "allowOvertimeWithWarning": true,
    "blockDoubleBooking": true,
    "requireSkillMatch": false
  }
}
```

### 3.3 Quickbase Relationships

```
Technicians ──┬──< Work Orders     (one tech has many WOs)
              └──< Availability    (one tech has many events)

Work Orders ───── Customers        (optional, many WOs per customer)
```

Lookup fields:
- Work Orders: "Technician Name" (lookup from Technicians via Assigned Technician)
- Work Orders: "Technician Skills" (lookup for display)
- Technicians: "Assigned WO Count" (summary count of active WOs)

---

## 4. Solvice Integration Design

### 4.1 API Key Storage

**Store the Solvice API key as an environment variable on the server that hosts the scheduler's backend proxy.**

Recommended approach:
```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Browser UI  │────▶│  Proxy Backend   │────▶│ Solvice API │
│  (React app) │     │  (Node/Express)  │     │             │
└─────────────┘     └──────────────────┘     └─────────────┘
                     ▲
                     │ SOLVICE_API_KEY stored here
                     │ in .env (never sent to browser)
```

- **`.env`** file on the backend: `SOLVICE_API_KEY=sk_live_...`
- **Never** expose the key to the frontend/browser
- For Quickbase Code Pages deployment: store in a Quickbase app variable accessible only by admin roles, and proxy calls through a Quickbase Pipeline or external backend
- For production: use secret managers (AWS Secrets Manager, Railway variables, etc.)

### 4.2 Data Translation: Quickbase → Solvice VRP

The scheduler uses the **VRP solver** because field service scheduling is fundamentally a vehicle routing problem: assign jobs to resources with time windows, skills, and travel.

**Mapping: Quickbase Technicians → Solvice Resources**

```javascript
function technicianToResource(tech) {
  return {
    name: `tech-${tech.recordId}`,
    start: {
      latitude: tech.homeLat,
      longitude: tech.homeLng
    },
    end: {
      latitude: tech.homeLat,
      longitude: tech.homeLng
    },
    shifts: buildShifts(tech, dateRange),  // from shift start/end + availability
    skills: tech.skills,                    // ["HVAC", "Electrical", "Plumbing"]
    costs: {
      perHour: tech.payRate               // $45/hr
    },
    capacity: {
      items: tech.maxDailyJobs || 8       // max jobs per day
    }
  }
}
```

**Building shifts (removing unavailable blocks):**

```javascript
function buildShifts(tech, dateRange) {
  const shifts = []
  for (const date of dateRange) {
    const shiftStart = combineDateTime(date, tech.shiftStart)  // "2024-12-23T08:00:00"
    const shiftEnd = combineDateTime(date, tech.shiftEnd)      // "2024-12-23T17:00:00"

    // Subtract availability events (PTO, sick, etc.)
    const availableWindows = subtractBlocks(
      { from: shiftStart, to: shiftEnd },
      tech.availabilityEvents.filter(e => overlaps(e, date))
    )

    shifts.push(...availableWindows.map(w => ({
      from: w.from.toISOString(),
      to: w.to.toISOString()
    })))
  }
  return shifts
}
```

**Mapping: Quickbase Work Orders → Solvice Jobs**

```javascript
function workOrderToJob(wo) {
  return {
    name: `wo-${wo.recordId}`,
    location: {
      latitude: wo.locationLat,
      longitude: wo.locationLng
    },
    duration: wo.durationHours * 3600,    // convert hours → seconds
    windows: wo.slaDeadline ? [{
      from: new Date().toISOString(),
      to: wo.slaDeadline
    }] : undefined,
    skills: wo.skillsRequired,            // must match tech skills
    priority: mapPriority(wo.priority),   // QB 1-4 → Solvice 1-10
    assignTo: wo.assignedTechnician       // prefer current tech if rescheduling
      ? `tech-${wo.assignedTechnicianId}`
      : undefined
  }
}
```

### 4.3 Full Solvice VRP Request Shape

```json
{
  "resources": [
    {
      "name": "tech-101",
      "start": { "latitude": 40.7128, "longitude": -74.0060 },
      "end": { "latitude": 40.7128, "longitude": -74.0060 },
      "shifts": [
        { "from": "2024-12-23T08:00:00", "to": "2024-12-23T12:00:00" },
        { "from": "2024-12-23T13:00:00", "to": "2024-12-23T17:00:00" }
      ],
      "skills": ["HVAC", "Electrical"],
      "costs": { "perHour": 45 }
    }
  ],
  "jobs": [
    {
      "name": "wo-1042",
      "location": { "latitude": 40.7580, "longitude": -73.9855 },
      "duration": 7200,
      "windows": [
        { "from": "2024-12-23T08:00:00", "to": "2024-12-23T17:00:00" }
      ],
      "skills": ["HVAC"],
      "priority": 8
    }
  ]
}
```

### 4.4 Solvice Response → Schedule Preview

```javascript
function solutionToPreview(solution, workOrders, technicians) {
  const changes = []

  for (const trip of solution.trips) {
    const tech = technicians.find(t => `tech-${t.recordId}` === trip.resource)

    for (const job of trip.jobs) {
      const wo = workOrders.find(w => `wo-${w.recordId}` === job.name)
      const wasAssigned = !!wo.assignedTechnicianId
      const techChanged = wo.assignedTechnicianId !== tech.recordId
      const timeChanged = wo.scheduledStart !== job.arrival

      changes.push({
        workOrder: wo,
        technician: tech,
        proposedStart: job.arrival,
        proposedEnd: job.departure,
        changeType: !wasAssigned ? 'new' : (techChanged ? 'reassigned' : 'rescheduled'),
        travelTime: job.travelTimeInSeconds,
        accepted: true  // user can toggle per-item
      })
    }
  }

  // Add unassigned
  for (const unassigned of solution.unassigned) {
    const wo = workOrders.find(w => `wo-${w.recordId}` === unassigned.name)
    changes.push({
      workOrder: wo,
      technician: null,
      changeType: 'unassignable',
      reason: 'No qualified technician available',
      accepted: false
    })
  }

  return {
    changes,
    stats: {
      totalAssigned: changes.filter(c => c.changeType !== 'unassignable').length,
      newAssignments: changes.filter(c => c.changeType === 'new').length,
      rescheduled: changes.filter(c => c.changeType === 'rescheduled').length,
      reassigned: changes.filter(c => c.changeType === 'reassigned').length,
      unassignable: changes.filter(c => c.changeType === 'unassignable').length,
      feasible: solution.score.feasible,
      travelReduction: calculateTravelReduction(solution, workOrders)
    }
  }
}
```

### 4.5 Optimization Objectives

| User Selection | Solvice Constraint Weighting |
|----------------|------------------------------|
| Minimize travel time | Default VRP objective (soft: travel distance/time) |
| Minimize cost | Weight `costs.perHour` heavily; prefer cheaper techs for simple jobs |
| Balance workload | Add soft constraint: even distribution of job count across resources |
| Respect priorities | Set high-priority jobs as HARD constraints on time windows |

### 4.6 Rollback Strategy

Before applying AI schedule:
1. Snapshot all affected WO records: `{ recordId, assignedTech, start, end, status }`
2. Store snapshot in `localStorage` with batch ID and timestamp
3. Apply changes to Quickbase
4. Show undo toast for 30 seconds
5. If undo: restore snapshot values via Quickbase API
6. Snapshot expires after 1 hour

---

## 5. Progressive Disclosure & AI Suggestions

### 5.1 Where AI Helps

| Context | AI Action | User Override |
|---------|-----------|---------------|
| Setup: Table detection | Scans table names/descriptions, ranks match likelihood | Manual dropdown to pick any table |
| Setup: Field mapping | Matches by name similarity + type compatibility | Click field to pick different one |
| Setup: Availability | Detects time-off patterns in related tables | Manual table/field selection |
| Scheduler: Drag target | Highlights compatible technicians during drag | Drop anywhere (with warning) |
| Scheduler: Conflict | Explains why a drop is blocked/warned | "Schedule anyway" option for warnings |
| Schedule with AI | Full route optimization via Solvice | Per-item accept/reject in preview |
| Schedule with AI | Explains each decision (Solvice AI explanations) | Manual reassignment after apply |

### 5.2 AI Suggestion UX Pattern

Every AI suggestion follows this pattern:
```
┌─────────────────────────────────────────┐
│ ✦ Scheduled Start                       │
│ ┌─────────────────────────────┐         │
│ │ "Scheduled Start" (DateTime) │  ✓ 94% │
│ └─────────────────────────────┘         │
│ ⓘ Matched: field name contains          │
│   "scheduled" + "start", type=DateTime  │
│                         [Change field ▾] │
└─────────────────────────────────────────┘
```

- **Confidence badge**: green (>80%), amber (50-80%), gray (<50%)
- **Explanation tooltip**: always visible, explains matching logic
- **Override**: single click to open field picker
- **Bulk accept**: "Accept all AI suggestions" button at step level

### 5.3 Progressive Disclosure Pattern

Each wizard step:
```
┌────────────────────────────────────────────────┐
│ Step 2: Map Work Order Fields                  │
│                                                │
│ Essential fields (always visible):             │
│   Title ............... [Work Order Name  ▾]   │
│   Start Time .......... [Scheduled Start  ▾]   │
│   End Time ............ [Scheduled End    ▾]   │
│   Assigned Tech ....... [Assigned To      ▾]   │
│   Duration ............ [Est. Duration    ▾]   │
│                                                │
│ ┌─ Show 6 more fields ────────────────────┐    │
│ │  Priority, Status, Location, Skills,    │    │
│ │  SLA Deadline, Cost Estimate            │    │
│ └─────────────────────────────────────────┘    │
│                                                │
│                    [Back]  [Next: Technicians →]│
└────────────────────────────────────────────────┘
```

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| UI Framework | React 18 | Quickbase ecosystem, component reuse |
| State | Zustand | Lightweight, no boilerplate |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Timeline | Custom (react-dnd + CSS Grid) | Full control over Quickbase-native feel |
| HTTP | Axios | Consistent with existing FastField code |
| Build | Vite | Fast HMR, modern bundling |
| Mock Backend | Express.js (local) | Simulates Quickbase + Solvice APIs |

### 6.2 Component Tree

```
<App>
├── <SetupWizard>                    (conditional: no config)
│   ├── <WizardProgress>             (step indicator)
│   ├── <TableConnectionStep>        (step 1)
│   │   └── <AITableSuggestion>
│   ├── <WorkOrderMappingStep>       (step 2)
│   │   └── <FieldMapper>
│   │       └── <AISuggestionBadge>
│   ├── <TechnicianMappingStep>      (step 3)
│   ├── <AvailabilitySetupStep>      (step 4)
│   └── <ReviewStep>                 (step 5)
│       └── <MiniSchedulerPreview>
│
├── <SchedulerReport>                (main view after setup)
│   ├── <ReportToolbar>
│   │   ├── <DateNavigator>
│   │   ├── <ViewModeToggle>
│   │   ├── <FilterBar>
│   │   └── <ScheduleWithAIButton>
│   │
│   ├── <TimelineGrid>
│   │   ├── <TimelineHeader>         (hour columns)
│   │   ├── <TechnicianRow>          (per technician)
│   │   │   ├── <TechnicianLabel>
│   │   │   ├── <WorkOrderBlock>     (draggable)
│   │   │   └── <UnavailableBlock>   (grayed zones)
│   │   └── <CurrentTimeLine>        (red vertical line)
│   │
│   ├── <UnassignedPanel>            (bottom or side)
│   │   ├── <PanelSearch>
│   │   ├── <SortControls>
│   │   └── <UnassignedCard>         (draggable)
│   │
│   └── <WorkOrderPopover>           (on click)
│       ├── <WODetailView>
│       └── <WOQuickActions>
│
└── <AIScheduleModal>                (overlay)
    ├── <ScopeConfigStep>
    ├── <ProcessingStep>
    ├── <DiffPreviewStep>
    │   ├── <ChangesSummary>
    │   ├── <ChangesList>
    │   │   └── <ChangeRow>          (accept/reject toggle)
    │   └── <MiniTimelinePreview>
    └── <ApplyingStep>
```

### 6.3 File Structure

```
qb-scheduler/
├── src/
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── SetupWizard.jsx
│   │   │   ├── WizardProgress.jsx
│   │   │   ├── TableConnectionStep.jsx
│   │   │   ├── WorkOrderMappingStep.jsx
│   │   │   ├── TechnicianMappingStep.jsx
│   │   │   ├── AvailabilitySetupStep.jsx
│   │   │   ├── ReviewStep.jsx
│   │   │   ├── FieldMapper.jsx
│   │   │   └── AISuggestionBadge.jsx
│   │   ├── scheduler/
│   │   │   ├── SchedulerReport.jsx
│   │   │   ├── ReportToolbar.jsx
│   │   │   ├── TimelineGrid.jsx
│   │   │   ├── TechnicianRow.jsx
│   │   │   ├── WorkOrderBlock.jsx
│   │   │   ├── UnavailableBlock.jsx
│   │   │   ├── UnassignedPanel.jsx
│   │   │   ├── UnassignedCard.jsx
│   │   │   ├── WorkOrderPopover.jsx
│   │   │   ├── DateNavigator.jsx
│   │   │   ├── ViewModeToggle.jsx
│   │   │   └── FilterBar.jsx
│   │   ├── ai-schedule/
│   │   │   ├── AIScheduleModal.jsx
│   │   │   ├── ScopeConfigStep.jsx
│   │   │   ├── ProcessingStep.jsx
│   │   │   ├── DiffPreviewStep.jsx
│   │   │   ├── ChangeRow.jsx
│   │   │   └── ApplyingStep.jsx
│   │   └── shared/
│   │       ├── AISparkleIcon.jsx
│   │       ├── Badge.jsx
│   │       ├── Toast.jsx
│   │       └── Tooltip.jsx
│   ├── services/
│   │   ├── quickbaseApi.js          (mock QB API client)
│   │   ├── solviceService.js        (Solvice VRP integration)
│   │   ├── schedulerEngine.js       (conflict detection, validation)
│   │   └── aiSuggestionService.js   (field mapping AI logic)
│   ├── stores/
│   │   ├── schedulerStore.js        (Zustand: WOs, techs, timeline state)
│   │   ├── wizardStore.js           (Zustand: setup config)
│   │   └── aiScheduleStore.js       (Zustand: AI modal state)
│   ├── types/
│   │   └── index.js                 (JSDoc type definitions)
│   ├── mock-api/
│   │   ├── server.js                (Express mock server)
│   │   ├── data.js                  (seed data generators)
│   │   └── routes.js                (QB + Solvice mock routes)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                    (Tailwind + custom tokens)
├── public/
│   └── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── SPEC.md                          (this file)
└── .interface-design/
    └── system.md                    (design system decisions)
```
