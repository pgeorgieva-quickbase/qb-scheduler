import { Router } from 'express'
import { technicians, workOrders, availabilityEvents, qbTables } from './data.js'

const router = Router()

// --- Quickbase Mock API ---

// List tables (for wizard)
router.get('/qb/tables', (req, res) => {
  res.json(qbTables.map(t => ({
    tableId: t.tableId,
    name: t.name,
    description: t.description,
    fieldCount: t.fields.length,
  })))
})

// Get table fields
router.get('/qb/tables/:tableId/fields', (req, res) => {
  const table = qbTables.find(t => t.tableId === req.params.tableId)
  if (!table) return res.status(404).json({ error: 'Table not found' })
  res.json(table.fields)
})

// List technicians
router.get('/qb/technicians', (req, res) => {
  res.json(technicians.filter(t => t.active))
})

// List work orders
router.get('/qb/work-orders', (req, res) => {
  const { status, assigned, dateFrom, dateTo } = req.query
  let filtered = [...workOrders]

  if (status) filtered = filtered.filter(wo => wo.status === status)
  if (assigned === 'true') filtered = filtered.filter(wo => wo.assignedTechnicianId)
  if (assigned === 'false') filtered = filtered.filter(wo => !wo.assignedTechnicianId)
  if (dateFrom) filtered = filtered.filter(wo => wo.scheduledStart && wo.scheduledStart >= dateFrom)
  if (dateTo) filtered = filtered.filter(wo => wo.scheduledStart && wo.scheduledStart <= dateTo)

  res.json(filtered)
})

// Update work order (assign, reschedule)
router.put('/qb/work-orders/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = workOrders.findIndex(wo => wo.recordId === id)
  if (idx === -1) return res.status(404).json({ error: 'Work order not found' })

  const updates = req.body
  Object.assign(workOrders[idx], updates)
  res.json(workOrders[idx])
})

// Batch update work orders (for AI schedule apply)
router.put('/qb/work-orders/batch', (req, res) => {
  const { updates } = req.body // Array of { recordId, ...fields }
  const results = []
  const conflicts = []

  for (const update of updates) {
    const idx = workOrders.findIndex(wo => wo.recordId === update.recordId)
    if (idx === -1) {
      results.push({ recordId: update.recordId, success: false, error: 'Not found' })
      continue
    }

    // Version conflict detection
    if (update._version !== undefined && workOrders[idx]._version !== undefined && update._version !== workOrders[idx]._version) {
      conflicts.push({ recordId: update.recordId, serverVersion: workOrders[idx]._version, clientVersion: update._version })
      results.push({ recordId: update.recordId, success: false, error: 'Version conflict' })
      continue
    }

    // Increment version on successful update
    workOrders[idx]._version = (workOrders[idx]._version || 1) + 1
    const { _version: _, ...fieldsToApply } = update
    Object.assign(workOrders[idx], fieldsToApply)
    results.push({ recordId: update.recordId, success: true, _version: workOrders[idx]._version })
  }

  if (conflicts.length > 0) {
    return res.status(409).json({ error: 'Version conflict', conflicts, results })
  }

  res.json({ results, totalUpdated: results.filter(r => r.success).length })
})

// List availability events
router.get('/qb/availability', (req, res) => {
  const { technicianId, dateFrom, dateTo } = req.query
  let filtered = [...availabilityEvents]

  if (technicianId) filtered = filtered.filter(e => e.technicianId === parseInt(technicianId))
  if (dateFrom) filtered = filtered.filter(e => e.end >= dateFrom)
  if (dateTo) filtered = filtered.filter(e => e.start <= dateTo)

  res.json(filtered)
})

// Create availability event
let nextAvailId = 300
router.post('/qb/availability', (req, res) => {
  const event = { recordId: nextAvailId++, ...req.body }
  availabilityEvents.push(event)
  res.json(event)
})

// Update availability event
router.put('/qb/availability/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = availabilityEvents.findIndex(e => e.recordId === id)
  if (idx === -1) return res.status(404).json({ error: 'Event not found' })
  Object.assign(availabilityEvents[idx], req.body)
  res.json(availabilityEvents[idx])
})

// Delete availability event
router.delete('/qb/availability/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const idx = availabilityEvents.findIndex(e => e.recordId === id)
  if (idx === -1) return res.status(404).json({ error: 'Event not found' })
  availabilityEvents.splice(idx, 1)
  res.json({ success: true })
})

// Bulk create availability events
router.post('/qb/availability/bulk', (req, res) => {
  const { events } = req.body
  const created = events.map(e => {
    const event = { recordId: nextAvailId++, ...e }
    availabilityEvents.push(event)
    return event
  })
  res.json({ created, count: created.length })
})

// --- Solvice Mock API ---

let solveJobs = {}

// Mock VRP solve
router.post('/solvice/vrp/solve', (req, res) => {
  const { resources, jobs } = req.body
  const jobId = `mock-${Date.now()}`

  // Simulate async solve — immediately produce a solution
  const trips = []
  const unassigned = []
  const jobPool = [...jobs]

  // Simple greedy assignment: assign jobs to resources by skill match
  for (const resource of resources) {
    const resourceJobs = []
    let currentTime = new Date(resource.shifts[0]?.from || new Date())

    const assignable = jobPool.filter(j => {
      if (!j.skills || j.skills.length === 0) return true
      return j.skills.every(s => (resource.skills || []).includes(s))
    })

    for (const job of assignable) {
      const arrival = new Date(currentTime.getTime() + Math.random() * 1800000) // random 0-30 min travel
      const departure = new Date(arrival.getTime() + (job.duration || 3600) * 1000)

      const shiftEnd = new Date(resource.shifts[resource.shifts.length - 1]?.to || '2099-01-01')
      if (departure > shiftEnd) continue

      resourceJobs.push({
        name: job.name,
        arrival: arrival.toISOString(),
        departure: departure.toISOString(),
        travelTimeInSeconds: Math.floor(Math.random() * 1800),
      })

      currentTime = departure
      const poolIdx = jobPool.indexOf(job)
      if (poolIdx > -1) jobPool.splice(poolIdx, 1)
    }

    if (resourceJobs.length > 0) {
      trips.push({
        resource: resource.name,
        jobs: resourceJobs,
        totalDistance: Math.floor(Math.random() * 50000 + 5000),
        totalDuration: resourceJobs.reduce((sum, j) => {
          return sum + (new Date(j.departure) - new Date(j.arrival)) / 1000
        }, 0),
      })
    }
  }

  // Remaining jobs are unassigned
  for (const job of jobPool) {
    unassigned.push({ name: job.name, reason: 'No qualified resource available' })
  }

  solveJobs[jobId] = {
    id: jobId,
    status: 'SOLVED',
    score: {
      hardScore: 0,
      mediumScore: 0,
      softScore: -(Math.floor(Math.random() * 5000)),
      feasible: true,
    },
    trips,
    unassigned,
  }

  // Return queued status (client polls)
  res.json({ id: jobId, status: 'QUEUED' })
})

// Rationale templates for mock AI explanations
const RATIONALE_TEMPLATES = [
  'Closest available resource with matching skills',
  'Best skill match within travel distance',
  'Balances workload across team',
  'Only resource with required certification',
  'Minimizes total travel time for the day',
  'Available in the requested time window',
  'Preferred resource based on past assignments',
  'Fills gap in schedule efficiently',
]

const UNASSIGNABLE_REASONS = [
  'No qualified resource available',
  'All technicians fully booked during SLA window',
  'Required skills not available in date range',
  'Exceeds maximum daily hours for all resources',
]

// Sync solve (for small problems)
router.post('/solvice/vrp/solve/sync', (req, res) => {
  const { resources, jobs } = req.body
  const trips = []
  const unassigned = []
  const jobPool = [...jobs]

  for (const resource of resources) {
    const resourceJobs = []
    let currentTime = new Date(resource.shifts[0]?.from || new Date())

    const assignable = jobPool.filter(j => {
      if (!j.skills || j.skills.length === 0) return true
      return j.skills.every(s => (resource.skills || []).includes(s))
    })

    for (const job of assignable) {
      const travelSec = Math.floor(300 + Math.random() * 1500)
      const arrival = new Date(currentTime.getTime() + travelSec * 1000)
      const departure = new Date(arrival.getTime() + (job.duration || 3600) * 1000)

      const shiftEnd = new Date(resource.shifts[resource.shifts.length - 1]?.to || '2099-01-01')
      if (departure > shiftEnd) continue

      resourceJobs.push({
        name: job.name,
        arrival: arrival.toISOString(),
        departure: departure.toISOString(),
        travelTimeInSeconds: travelSec,
        rationale: RATIONALE_TEMPLATES[Math.floor(Math.random() * RATIONALE_TEMPLATES.length)],
      })

      currentTime = departure
      const poolIdx = jobPool.indexOf(job)
      if (poolIdx > -1) jobPool.splice(poolIdx, 1)
    }

    if (resourceJobs.length > 0) {
      trips.push({
        resource: resource.name,
        jobs: resourceJobs,
        totalDistance: Math.floor(Math.random() * 50000 + 5000),
        totalDuration: resourceJobs.reduce((sum, j) => {
          return sum + (new Date(j.departure) - new Date(j.arrival)) / 1000
        }, 0),
      })
    }
  }

  for (const job of jobPool) {
    unassigned.push({ name: job.name, reason: UNASSIGNABLE_REASONS[Math.floor(Math.random() * UNASSIGNABLE_REASONS.length)] })
  }

  res.json({
    id: `sync-${Date.now()}`,
    status: 'SOLVED',
    score: { hardScore: 0, mediumScore: 0, softScore: -Math.floor(Math.random() * 5000), feasible: true },
    trips,
    unassigned,
  })
})

// Poll status
router.get('/solvice/vrp/status/:id', (req, res) => {
  const job = solveJobs[req.params.id]
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json({ id: job.id, status: job.status })
})

// Get solution
router.get('/solvice/vrp/solution/:id', (req, res) => {
  const job = solveJobs[req.params.id]
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json(job)
})

// --- AI Field Suggestion Mock ---

router.post('/ai/suggest-mappings', (req, res) => {
  const { tableId, role } = req.body // role: 'workOrders' | 'technicians' | 'availability'
  const table = qbTables.find(t => t.tableId === tableId)
  if (!table) return res.status(404).json({ error: 'Table not found' })

  const mappings = {}

  if (role === 'workOrders') {
    const fieldMap = {
      title: { patterns: ['title', 'name', 'subject'], types: ['text'] },
      scheduledStart: { patterns: ['start', 'scheduled', 'begin'], types: ['datetime'] },
      scheduledEnd: { patterns: ['end', 'finish', 'complete'], types: ['datetime'] },
      duration: { patterns: ['duration', 'hours', 'time'], types: ['duration', 'numeric'] },
      status: { patterns: ['status', 'state'], types: ['text-multi-choice', 'text'] },
      priority: { patterns: ['priority', 'urgency', 'severity'], types: ['numeric'] },
      location: { patterns: ['address', 'location', 'site'], types: ['text'] },
      locationLat: { patterns: ['lat', 'latitude'], types: ['numeric'] },
      locationLng: { patterns: ['lng', 'longitude', 'long'], types: ['numeric'] },
      skillsRequired: { patterns: ['skill', 'certification', 'requirement'], types: ['text-multi-select', 'text'] },
      assignedTechnician: { patterns: ['assign', 'technician', 'worker', 'resource'], types: ['reference'] },
    }

    for (const [key, { patterns, types }] of Object.entries(fieldMap)) {
      const match = table.fields.find(f => {
        const nameMatch = patterns.some(p => f.name.toLowerCase().includes(p))
        const typeMatch = types.includes(f.type)
        return nameMatch && typeMatch
      })
      if (match) {
        const nameScore = patterns.some(p => f => f.name.toLowerCase().includes(p)) ? 80 : 60
        mappings[key] = {
          fieldId: match.fieldId,
          fieldName: match.name,
          confidence: Math.min(98, nameScore + (types.includes(match.type) ? 15 : 0)),
          reason: `Field name contains "${patterns.find(p => match.name.toLowerCase().includes(p))}" and type is ${match.type}`,
        }
      }
    }
  }

  // Simplified: return pre-built mappings for the demo
  if (role === 'workOrders') {
    res.json({
      title: { fieldId: 7, fieldName: 'Title', confidence: 95, reason: 'Field name "Title" matches, type is text' },
      scheduledStart: { fieldId: 12, fieldName: 'Scheduled Start', confidence: 97, reason: 'Contains "Scheduled" + "Start", type is datetime' },
      scheduledEnd: { fieldId: 13, fieldName: 'Scheduled End', confidence: 97, reason: 'Contains "Scheduled" + "End", type is datetime' },
      duration: { fieldId: 14, fieldName: 'Est. Duration', confidence: 88, reason: 'Contains "Duration", type is duration' },
      status: { fieldId: 9, fieldName: 'Status', confidence: 96, reason: 'Exact match "Status", type is multi-choice' },
      priority: { fieldId: 10, fieldName: 'Priority', confidence: 94, reason: 'Exact match "Priority", type is numeric' },
      location: { fieldId: 15, fieldName: 'Location Address', confidence: 92, reason: 'Contains "Location" + "Address"' },
      locationLat: { fieldId: 16, fieldName: 'Location Lat', confidence: 90, reason: 'Contains "Lat", type is numeric' },
      locationLng: { fieldId: 17, fieldName: 'Location Lng', confidence: 90, reason: 'Contains "Lng", type is numeric' },
      skillsRequired: { fieldId: 18, fieldName: 'Skills Required', confidence: 93, reason: 'Contains "Skills" + "Required"' },
      assignedTechnician: { fieldId: 19, fieldName: 'Assigned Technician', confidence: 96, reason: 'Contains "Assigned" + "Technician", type is reference' },
    })
  } else if (role === 'technicians') {
    res.json({
      name: { fieldId: 6, fieldName: 'Full Name', confidence: 94, reason: 'Contains "Name", type is text' },
      skills: { fieldId: 10, fieldName: 'Skills', confidence: 95, reason: 'Exact match "Skills", type is multi-select' },
      payRate: { fieldId: 11, fieldName: 'Hourly Rate', confidence: 87, reason: 'Contains "Rate", type is currency' },
      shiftStart: { fieldId: 12, fieldName: 'Shift Start', confidence: 92, reason: 'Contains "Shift" + "Start", type is timeofday' },
      shiftEnd: { fieldId: 13, fieldName: 'Shift End', confidence: 92, reason: 'Contains "Shift" + "End", type is timeofday' },
      homeLat: { fieldId: 16, fieldName: 'Home Lat', confidence: 85, reason: 'Contains "Home" + "Lat"' },
      homeLng: { fieldId: 17, fieldName: 'Home Lng', confidence: 85, reason: 'Contains "Home" + "Lng"' },
    })
  } else if (role === 'availability') {
    res.json({
      technician: { fieldId: 6, fieldName: 'Technician', confidence: 96, reason: 'Exact match "Technician", type is reference' },
      eventType: { fieldId: 7, fieldName: 'Event Type', confidence: 93, reason: 'Contains "Type", type is multi-choice' },
      start: { fieldId: 8, fieldName: 'Start', confidence: 95, reason: 'Exact match "Start", type is datetime' },
      end: { fieldId: 9, fieldName: 'End', confidence: 95, reason: 'Exact match "End", type is datetime' },
    })
  }
})

// AI table detection
router.post('/ai/suggest-tables', (req, res) => {
  const tables = qbTables.map(t => ({ tableId: t.tableId, name: t.name, description: t.description }))

  res.json({
    workOrders: {
      tableId: 'bqr4x5m3n', name: 'Work Orders', confidence: 98,
      reason: 'Table name "Work Orders" matches, contains datetime and reference fields typical of scheduling',
    },
    technicians: {
      tableId: 'bqr4x5m4p', name: 'Technicians', confidence: 96,
      reason: 'Table name "Technicians" matches, contains skills and shift fields',
    },
    availability: {
      tableId: 'bqr4x5m5q', name: 'Availability Events', confidence: 91,
      reason: 'Contains "Availability", has datetime start/end and technician reference',
    },
  })
})

export default router
