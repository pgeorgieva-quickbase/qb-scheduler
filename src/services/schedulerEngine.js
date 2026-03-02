import { parseISO, areIntervalsOverlapping, isWithinInterval, differenceInMinutes } from 'date-fns'

function getSchedulingConstraints() {
  try {
    const saved = localStorage.getItem('qb-scheduler-config')
    if (saved) return JSON.parse(saved).schedulingConstraints || {}
  } catch { /* ignore */ }
  return {}
}

function getMaxDailyHours() {
  try {
    const saved = localStorage.getItem('qb-scheduler-config')
    if (saved) {
      const config = JSON.parse(saved)
      return config.constraints?.maxDailyHours || 10
    }
  } catch { /* ignore */ }
  return 10
}

/**
 * Check if a work order can be placed at a given time for a given technician.
 * Returns { allowed: boolean, warnings: string[], errors: string[] }
 */
export function validatePlacement(workOrder, technicianId, startTime, endTime, allWorkOrders, technicians, availability) {
  const errors = []
  const warnings = []
  const tech = technicians.find(t => t.recordId === technicianId)
  if (!tech) {
    errors.push('Technician not found')
    return { allowed: false, warnings, errors }
  }

  const constraints = getSchedulingConstraints()
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime

  // 1. Check double-booking
  const techWOs = allWorkOrders.filter(wo =>
    wo.assignedTechnicianId === technicianId &&
    wo.recordId !== workOrder.recordId &&
    wo.scheduledStart && wo.scheduledEnd
  )
  for (const existing of techWOs) {
    const exStart = parseISO(existing.scheduledStart)
    const exEnd = parseISO(existing.scheduledEnd)
    if (areIntervalsOverlapping({ start, end }, { start: exStart, end: exEnd })) {
      errors.push(`Overlaps with ${existing.workOrderNumber}: ${existing.title}`)
    }
  }

  // 2. Check availability (time off) — only when useAvailability is enabled
  if (constraints.useAvailability) {
    const techAvail = availability.filter(e => e.technicianId === technicianId)
    for (const event of techAvail) {
      const eStart = parseISO(event.start)
      const eEnd = parseISO(event.end)
      if (areIntervalsOverlapping({ start, end }, { start: eStart, end: eEnd })) {
        errors.push(`${tech.fullName} is unavailable: ${event.eventType} (${event.notes || ''})`)
      }
    }

    // 3. Check shift hours
    if (tech.shiftStart && tech.shiftEnd) {
      const [shiftStartH, shiftStartM] = tech.shiftStart.split(':').map(Number)
      const [shiftEndH, shiftEndM] = tech.shiftEnd.split(':').map(Number)
      const woStartHour = start.getHours() + start.getMinutes() / 60
      const woEndHour = end.getHours() + end.getMinutes() / 60
      const shiftStartDecimal = shiftStartH + shiftStartM / 60
      const shiftEndDecimal = shiftEndH + shiftEndM / 60

      if (woStartHour < shiftStartDecimal || woEndHour > shiftEndDecimal) {
        warnings.push(`Outside shift hours (${tech.shiftStart}–${tech.shiftEnd})`)
      }
    }
  }

  // 4. Check skill match — only when useSkills is enabled
  if (constraints.useSkills) {
    const requiredSkills = workOrder.skillsRequired || []
    const techSkills = tech.skills || []
    const missingSkills = requiredSkills.filter(s => !techSkills.includes(s))
    if (missingSkills.length > 0) {
      warnings.push(`Missing skills: ${missingSkills.join(', ')}`)
    }
  }

  // 5. Check daily hours
  const dayStart = new Date(start)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const dailyMinutes = techWOs
    .filter(wo => {
      const s = parseISO(wo.scheduledStart)
      return s >= dayStart && s < dayEnd
    })
    .reduce((sum, wo) => sum + differenceInMinutes(parseISO(wo.scheduledEnd), parseISO(wo.scheduledStart)), 0)

  const newDuration = differenceInMinutes(end, start)
  const totalDailyHours = (dailyMinutes + newDuration) / 60

  const maxHours = getMaxDailyHours()
  if (totalDailyHours > maxHours) {
    warnings.push(`Would exceed ${maxHours}h for today (${totalDailyHours.toFixed(1)}h total)`)
  }

  return {
    allowed: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Calculate skill match score for a technician and work order.
 * Returns 'full' | 'partial' | 'none'
 */
export function skillMatchLevel(workOrder, technician) {
  const required = workOrder.skillsRequired || []
  if (required.length === 0) return 'full'

  const techSkills = technician.skills || []
  const matched = required.filter(s => techSkills.includes(s))

  if (matched.length === required.length) return 'full'
  if (matched.length > 0) return 'partial'
  return 'none'
}

/**
 * Check if a technician is available at a specific time.
 */
export function isTechAvailable(technicianId, time, availability) {
  const t = typeof time === 'string' ? parseISO(time) : time
  return !availability.some(e => {
    if (e.technicianId !== technicianId) return false
    const eStart = parseISO(e.start)
    const eEnd = parseISO(e.end)
    return isWithinInterval(t, { start: eStart, end: eEnd })
  })
}
