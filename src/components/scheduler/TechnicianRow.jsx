import React, { useCallback, useMemo } from 'react'
import { useDrop } from 'react-dnd'
import { addHours, parseISO, format, startOfDay, isSameDay, differenceInMinutes } from 'date-fns'
import WorkOrderBlock from './WorkOrderBlock'
import UnavailableBlock from './UnavailableBlock'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { validatePlacement, skillMatchLevel } from '../../services/schedulerEngine'
import clsx from 'clsx'

export default function TechnicianRow({
  technician,
  hourWidth,
  hours,
  dayStartHour,
  dayDate,
  draggedWO,
  viewMode = 'day',
  days = [],
}) {
  const { workOrders, technicians, availability, assignWorkOrder, bulkAssignWorkOrders, addToast, pendingChanges } = useSchedulerStore()

  const dayEndHour = 24
  const hoursPerDay = dayEndHour - dayStartHour

  // Day column width (same for all views)
  const dayColumnWidth = hoursPerDay * hourWidth

  // Total timeline width
  const totalWidth = viewMode === 'day'
    ? hoursPerDay * hourWidth
    : days.length * dayColumnWidth

  // ── Day View: filter WOs + availability for this single day ──
  const techWOs = useMemo(() => {
    if (viewMode !== 'day') return []
    return workOrders.filter(wo =>
      wo.assignedTechnicianId === technician.recordId &&
      wo.scheduledStart &&
      isSameDay(parseISO(wo.scheduledStart), dayDate)
    )
  }, [viewMode, workOrders, technician.recordId, dayDate])

  const techAvail = useMemo(() => {
    if (viewMode !== 'day') return []
    return availability.filter(e =>
      e.technicianId === technician.recordId &&
      parseISO(e.start) < addHours(startOfDay(dayDate), 24) &&
      parseISO(e.end) > startOfDay(dayDate)
    )
  }, [viewMode, availability, technician.recordId, dayDate])

  // ── Week / Month View: gather WOs + availability across all visible days ──
  const multiDayWOs = useMemo(() => {
    if (viewMode === 'day') return []
    return workOrders.filter(wo =>
      wo.assignedTechnicianId === technician.recordId &&
      wo.scheduledStart &&
      days.some(d => isSameDay(parseISO(wo.scheduledStart), d))
    )
  }, [viewMode, workOrders, technician.recordId, days])

  const multiDayAvail = useMemo(() => {
    if (viewMode === 'day') return []
    if (!days.length) return []
    const rangeStart = startOfDay(days[0])
    const rangeEnd = addHours(startOfDay(days[days.length - 1]), 24)
    return availability.filter(e =>
      e.technicianId === technician.recordId &&
      parseISO(e.start) < rangeEnd &&
      parseISO(e.end) > rangeStart
    )
  }, [viewMode, availability, technician.recordId, days])

  // Compute non-working hour zones (day view only)
  const nonWorkingZones = useMemo(() => {
    if (viewMode !== 'day') return []
    const zones = []
    if (technician.shiftStart && technician.shiftEnd) {
      const [shiftStartH, shiftStartM] = technician.shiftStart.split(':').map(Number)
      const [shiftEndH, shiftEndM] = technician.shiftEnd.split(':').map(Number)
      const shiftStartDecimal = shiftStartH + (shiftStartM || 0) / 60
      const shiftEndDecimal = shiftEndH + (shiftEndM || 0) / 60
      const dayEnd = hours[hours.length - 1] + 1

      if (shiftStartDecimal > dayStartHour) {
        zones.push({ left: 0, width: (shiftStartDecimal - dayStartHour) * hourWidth })
      }
      if (shiftEndDecimal < dayEnd) {
        const left = (shiftEndDecimal - dayStartHour) * hourWidth
        zones.push({ left, width: (dayEnd - shiftEndDecimal) * hourWidth })
      }
    }
    return zones
  }, [viewMode, technician.shiftStart, technician.shiftEnd, dayStartHour, hourWidth, hours])

  const handleDrop = useCallback((item, monitor) => {
    const clientOffset = monitor.getClientOffset()
    const rowElement = document.querySelector(`[data-tech-row="${technician.recordId}"]`)
    if (!rowElement || !clientOffset) return

    const rowRect = rowElement.getBoundingClientRect()
    const offsetX = clientOffset.x - rowRect.left

    let dropDate, snappedHour
    if (viewMode === 'day') {
      dropDate = dayDate
      const droppedHour = dayStartHour + offsetX / hourWidth
      snappedHour = Math.round(droppedHour * 4) / 4
    } else {
      // week/month: determine which day column was dropped on
      const dayIndex = Math.floor(offsetX / dayColumnWidth)
      const clampedIndex = Math.max(0, Math.min(dayIndex, days.length - 1))
      dropDate = days[clampedIndex]
      const inDayOffset = offsetX - clampedIndex * dayColumnWidth
      const droppedHour = dayStartHour + (inDayOffset / dayColumnWidth) * hoursPerDay
      snappedHour = Math.round(droppedHour * 4) / 4
    }

    const start = new Date(dropDate)
    start.setHours(Math.floor(snappedHour), (snappedHour % 1) * 60, 0, 0)

    // Batch drop: multiple selected cards
    if (item.source === 'unassigned-batch' && item.recordIds) {
      bulkAssignWorkOrders(item.recordIds, technician.recordId, start)
      addToast(`${item.recordIds.length} work orders assigned to ${technician.fullName}`, 'success')
      return
    }

    const end = addHours(start, item.estDuration || 1)

    const { allowed, warnings, errors } = validatePlacement(
      item, technician.recordId, start, end, workOrders, technicians, availability
    )

    if (!allowed) {
      addToast(errors[0], 'error')
      return
    }
    if (warnings.length > 0) {
      addToast(warnings[0], 'warning')
    }

    assignWorkOrder(item.recordId, technician.recordId, start.toISOString(), end.toISOString())
    addToast(`${item.workOrderNumber} assigned to ${technician.fullName}`, 'success')
  }, [technician, dayDate, dayStartHour, hourWidth, dayColumnWidth, hoursPerDay, workOrders, technicians, availability, viewMode, days])

  const [{ isOver, canDrop, dragItem }, drop] = useDrop({
    accept: 'WORK_ORDER',
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      dragItem: monitor.getItem(),
    }),
  })

  const dropZoneClass = useMemo(() => {
    if (!isOver || !dragItem) return ''
    const matchLvl = skillMatchLevel(dragItem, technician)
    if (matchLvl === 'none') return 'drop-zone-blocked'
    if (matchLvl === 'partial') return 'drop-zone-warning'
    return 'drop-zone-valid'
  }, [isOver, dragItem, technician])

  // ── Helper: compute left/width for a WO in multi-day view ──
  const getMultiDayPosition = (wo) => {
    const start = parseISO(wo.scheduledStart)
    const dayIndex = days.findIndex(d => isSameDay(d, start))
    if (dayIndex < 0) return null

    const startMinutes = (start.getHours() - dayStartHour) * 60 + start.getMinutes()
    const durationMinutes = wo.scheduledEnd
      ? differenceInMinutes(parseISO(wo.scheduledEnd), start)
      : (wo.estDuration || 1) * 60

    const left = dayIndex * dayColumnWidth + (startMinutes / (hoursPerDay * 60)) * dayColumnWidth
    const width = Math.max((durationMinutes / (hoursPerDay * 60)) * dayColumnWidth, viewMode === 'week' ? 12 : 6)

    return { left, width }
  }

  // ── Helper: compute left/width for an availability event in multi-day view ──
  const getMultiDayAvailPosition = (event) => {
    const start = parseISO(event.start)
    const end = parseISO(event.end)
    const positions = []

    for (let di = 0; di < days.length; di++) {
      const d = days[di]
      const dayStart = new Date(d)
      dayStart.setHours(dayStartHour, 0, 0, 0)
      const dayEnd = new Date(d)
      dayEnd.setHours(dayStartHour + hoursPerDay, 0, 0, 0)

      if (start >= dayEnd || end <= dayStart) continue

      const effectiveStart = start < dayStart ? dayStart : start
      const effectiveEnd = end > dayEnd ? dayEnd : end
      const startMin = (effectiveStart.getHours() - dayStartHour) * 60 + effectiveStart.getMinutes()
      const durMin = differenceInMinutes(effectiveEnd, effectiveStart)
      if (durMin <= 0) continue

      const left = di * dayColumnWidth + (startMin / (hoursPerDay * 60)) * dayColumnWidth
      const width = Math.max((durMin / (hoursPerDay * 60)) * dayColumnWidth, viewMode === 'week' ? 8 : 4)
      positions.push({ left, width, key: `${event.recordId}-${di}` })
    }
    return positions
  }

  // Check if this row has any pending (unsaved) changes
  const hasPendingChanges = useMemo(() => {
    const pendingIds = Object.keys(pendingChanges).map(Number)
    return workOrders.some(wo =>
      wo.assignedTechnicianId === technician.recordId && pendingIds.includes(wo.recordId)
    )
  }, [pendingChanges, workOrders, technician.recordId])

  return (
    <div className={clsx('b-row', hasPendingChanges && 'b-row-unsaved')}>
      {/* Resource label (sticky left) */}
      <div className="b-resource-cell">
        <div
          className="b-resource-avatar"
          style={{ background: technician.avatarColor || '#6b7280' }}
        >
          {technician.fullName.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="b-resource-info">
          <div className="b-resource-name">{technician.fullName}</div>
          <div className="b-resource-skills">
            {(technician.skills || []).slice(0, 2).map(s => (
              <span key={s} className="b-skill-tag">{s}</span>
            ))}
            {(technician.skills || []).length > 2 && (
              <span className="text-[9px] text-gray-400">
                +{technician.skills.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline area */}
      <div
        ref={drop}
        data-tech-row={technician.recordId}
        className={clsx('b-timeline-area', dropZoneClass)}
        style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}
      >
        {/* ── Day view content ── */}
        {viewMode === 'day' && (
          <>
            {/* Non-working hour shading */}
            {nonWorkingZones.map((zone, i) => (
              <div
                key={`nw-${i}`}
                className="absolute top-0 bottom-0 pointer-events-none z-[1]"
                style={{
                  left: `${zone.left}px`,
                  width: `${zone.width}px`,
                  background: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 6px)',
                }}
              />
            ))}

            {/* Hour grid lines */}
            {hours.map((h, i) => (
              <div
                key={i}
                className={`b-grid-line ${h % 3 === 0 ? 'b-major' : ''}`}
                style={{ left: `${i * hourWidth}px` }}
              />
            ))}

            {/* Unavailable blocks */}
            {techAvail.map(event => (
              <UnavailableBlock
                key={event.recordId}
                event={event}
                hourWidth={hourWidth}
                dayStartHour={dayStartHour}
                dayDate={dayDate}
              />
            ))}

            {/* Work order blocks */}
            {techWOs.map(wo => (
              <WorkOrderBlock
                key={wo.recordId}
                workOrder={wo}
                hourWidth={hourWidth}
                dayStartHour={dayStartHour}
              />
            ))}
          </>
        )}

        {/* ── Week / Month view content ── */}
        {viewMode !== 'day' && (
          <>
            {/* Day separator grid lines */}
            {days.map((d, i) => (
              <div
                key={`dl-${i}`}
                className={clsx('b-grid-line', (d.getDay() === 1) && 'b-major')}
                style={{ left: `${i * dayColumnWidth}px` }}
              />
            ))}

            {/* Weekend shading */}
            {days.map((d, i) => {
              if (d.getDay() !== 0 && d.getDay() !== 6) return null
              return (
                <div
                  key={`we-${i}`}
                  className="absolute top-0 bottom-0 pointer-events-none z-[1]"
                  style={{
                    left: `${i * dayColumnWidth}px`,
                    width: `${dayColumnWidth}px`,
                    background: 'rgba(0,0,0,0.02)',
                  }}
                />
              )
            })}

            {/* Availability events (multi-day) */}
            {multiDayAvail.map(event => {
              const positions = getMultiDayAvailPosition(event)
              return positions.map(pos => (
                <UnavailableBlock
                  key={pos.key}
                  event={event}
                  hourWidth={hourWidth}
                  dayStartHour={dayStartHour}
                  dayDate={days.find(d => {
                    const s = parseISO(event.start)
                    const e = parseISO(event.end)
                    const ds = new Date(d); ds.setHours(dayStartHour, 0, 0, 0)
                    const de = new Date(d); de.setHours(dayStartHour + hoursPerDay, 0, 0, 0)
                    return s < de && e > ds
                  }) || days[0]}
                  overrideLeft={pos.left}
                  overrideWidth={pos.width}
                />
              ))
            })}

            {/* Work orders (multi-day) */}
            {multiDayWOs.map(wo => {
              const pos = getMultiDayPosition(wo)
              if (!pos) return null
              return (
                <WorkOrderBlock
                  key={wo.recordId}
                  workOrder={wo}
                  hourWidth={hourWidth}
                  dayStartHour={dayStartHour}
                  overrideLeft={pos.left}
                  overrideWidth={pos.width}
                  compact={viewMode === 'month'}
                />
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
