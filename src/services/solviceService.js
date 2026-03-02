import axios from 'axios'
import { addDays, setHours, setMinutes, parseISO, startOfDay } from 'date-fns'

const api = axios.create({ baseURL: '/api/solvice' })

function getSchedulingConstraints() {
  try {
    const saved = localStorage.getItem('qb-scheduler-config')
    if (saved) return JSON.parse(saved).schedulingConstraints || {}
  } catch { /* ignore */ }
  return {}
}

/**
 * Convert a Quickbase technician + availability events into a Solvice VRP resource.
 */
function technicianToResource(tech, availabilityEvents, dateRange, constraints) {
  const shifts = []

  for (const date of dateRange) {
    // Default to full working day if shift times not mapped
    const shiftStartStr = tech.shiftStart || '08:00'
    const shiftEndStr = tech.shiftEnd || '17:00'
    const [startH, startM] = shiftStartStr.split(':').map(Number)
    const [endH, endM] = shiftEndStr.split(':').map(Number)

    const shiftStart = setMinutes(setHours(date, startH), startM)
    const shiftEnd = setMinutes(setHours(date, endH), endM)

    if (constraints.useAvailability) {
      // Find blocking events for this tech on this date
      const dayStart = startOfDay(date)
      const dayEnd = addDays(dayStart, 1)
      const blocks = availabilityEvents
        .filter(e => e.technicianId === tech.recordId)
        .filter(e => {
          const eStart = parseISO(e.start)
          const eEnd = parseISO(e.end)
          return eStart < dayEnd && eEnd > dayStart
        })
        .map(e => ({
          from: parseISO(e.start) < shiftStart ? shiftStart : parseISO(e.start),
          to: parseISO(e.end) > shiftEnd ? shiftEnd : parseISO(e.end),
        }))

      // Subtract blocks from shift to get available windows
      const windows = subtractBlocks({ from: shiftStart, to: shiftEnd }, blocks)
      shifts.push(...windows.map(w => ({
        from: w.from.toISOString(),
        to: w.to.toISOString(),
      })))
    } else {
      shifts.push({
        from: shiftStart.toISOString(),
        to: shiftEnd.toISOString(),
      })
    }
  }

  const resource = {
    name: `tech-${tech.recordId}`,
    shifts,
  }

  if (constraints.useSkills) {
    resource.skills = tech.skills || []
  }
  if (constraints.usePayRate) {
    resource.costs = { perHour: tech.hourlyRate || 40 }
  }

  return resource
}

/**
 * Subtract time blocks from a window, returning remaining available segments.
 */
function subtractBlocks(window, blocks) {
  if (blocks.length === 0) return [window]

  const sorted = [...blocks].sort((a, b) => a.from - b.from)
  const results = []
  let cursor = window.from

  for (const block of sorted) {
    if (block.from > cursor) {
      results.push({ from: new Date(cursor), to: new Date(Math.min(block.from, window.to)) })
    }
    cursor = Math.max(cursor, block.to)
  }

  if (cursor < window.to) {
    results.push({ from: new Date(cursor), to: window.to })
  }

  return results.filter(r => r.to > r.from)
}

/**
 * Convert a Quickbase work order into a Solvice VRP job.
 * Note: location and priority fields are intentionally excluded per user requirement.
 * The solver assigns based on skills, availability, and cost only.
 */
function workOrderToJob(wo, constraints) {
  const job = {
    name: `wo-${wo.recordId}`,
    duration: (wo.estDuration || 1) * 3600, // hours to seconds
    windows: wo.slaDeadline ? [{
      from: new Date().toISOString(),
      to: wo.slaDeadline,
    }] : undefined,
    // If already assigned and rescheduling, prefer current tech
    assignTo: wo.assignedTechnicianId ? `tech-${wo.assignedTechnicianId}` : undefined,
  }

  if (constraints.useSkills) {
    job.skills = wo.skillsRequired || []
  }

  return job
}

/**
 * Build the full Solvice VRP request from Quickbase data.
 */
export function buildSolviceRequest(technicians, workOrders, availability, dateRange) {
  const constraints = getSchedulingConstraints()
  const resources = technicians.map(t => technicianToResource(t, availability, dateRange, constraints))
  const jobs = workOrders.map(wo => workOrderToJob(wo, constraints))

  return { resources, jobs }
}

/**
 * Submit a VRP solve job (async workflow).
 */
export async function submitSolve(request) {
  const { data } = await api.post('/vrp/solve', request)
  return data // { id, status: 'QUEUED' }
}

/**
 * Submit a synchronous VRP solve (for small problems / demo).
 */
export async function syncSolve(request) {
  const { data } = await api.post('/vrp/solve/sync', request)
  return data
}

/**
 * Poll for job status.
 */
export async function getJobStatus(jobId) {
  const { data } = await api.get(`/vrp/status/${jobId}`)
  return data
}

/**
 * Get the full solution.
 */
export async function getSolution(jobId) {
  const { data } = await api.get(`/vrp/solution/${jobId}`)
  return data
}

/**
 * Poll until SOLVED or ERROR. Returns the full solution.
 */
export async function waitForSolution(jobId, maxAttempts = 30, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getJobStatus(jobId)
    if (status.status === 'SOLVED') {
      return await getSolution(jobId)
    }
    if (status.status === 'ERROR') {
      throw new Error('Solvice solve job failed')
    }
    await new Promise(r => setTimeout(r, intervalMs))
  }
  throw new Error('Solvice solve timed out')
}

/**
 * Convert Solvice solution back into Quickbase update format.
 */
export function solutionToChanges(solution, workOrders, technicians) {
  const changes = []

  for (const trip of solution.trips) {
    const techId = parseInt(trip.resource.replace('tech-', ''))
    const tech = technicians.find(t => t.recordId === techId)

    for (const job of trip.jobs) {
      const woId = parseInt(job.name.replace('wo-', ''))
      const wo = workOrders.find(w => w.recordId === woId)
      if (!wo) continue

      const wasAssigned = !!wo.assignedTechnicianId
      const techChanged = wo.assignedTechnicianId !== techId
      const timeChanged = wo.scheduledStart !== job.arrival

      changes.push({
        workOrder: wo,
        technician: tech,
        proposedStart: job.arrival,
        proposedEnd: job.departure,
        travelTimeSeconds: job.travelTimeInSeconds,
        changeType: !wasAssigned ? 'new' : techChanged ? 'reassigned' : 'rescheduled',
        rationale: job.rationale || null,
        accepted: true,
      })
    }
  }

  for (const u of solution.unassigned || []) {
    const woId = parseInt(u.name.replace('wo-', ''))
    const wo = workOrders.find(w => w.recordId === woId)
    if (wo) {
      changes.push({
        workOrder: wo,
        technician: null,
        proposedStart: null,
        proposedEnd: null,
        travelTimeSeconds: 0,
        changeType: 'unassignable',
        reason: u.reason || 'No qualified technician available',
        accepted: false,
      })
    }
  }

  return changes
}

/**
 * Calculate summary stats from changes.
 */
export function calculateStats(changes) {
  return {
    totalAssigned: changes.filter(c => c.changeType !== 'unassignable').length,
    newAssignments: changes.filter(c => c.changeType === 'new').length,
    rescheduled: changes.filter(c => c.changeType === 'rescheduled').length,
    reassigned: changes.filter(c => c.changeType === 'reassigned').length,
    unassignable: changes.filter(c => c.changeType === 'unassignable').length,
  }
}
