import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO, startOfDay } from 'date-fns'
import { useAvailabilityStore } from '../../stores/availabilityStore'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { Plus, Repeat } from 'lucide-react'
import clsx from 'clsx'

const AVAILABILITY_COLORS = {
  Available: { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-700' },
  Unavailable: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
  Vacation: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
  Sick: { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700' },
  Training: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
  Personal: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
  'On-Call': { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700' },
}

function getEventColor(event) {
  return AVAILABILITY_COLORS[event.availabilityType] || AVAILABILITY_COLORS[event.eventType] || AVAILABILITY_COLORS.Unavailable
}

function EventBlock({ event, onClick, compact = false }) {
  const colors = getEventColor(event)
  const start = parseISO(event.start)
  const end = parseISO(event.end)
  const label = event.availabilityType || event.eventType

  if (compact) {
    return (
      <button
        onClick={() => onClick(event)}
        className={clsx(
          'w-full px-1.5 py-0.5 rounded border text-left transition-all hover:shadow-sm',
          colors.bg, colors.border, colors.text,
        )}
      >
        <div className="text-[9px] font-semibold leading-tight truncate">{label}</div>
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick(event)}
      className={clsx(
        'w-full px-2 py-1 rounded border text-left transition-all hover:shadow-sm',
        colors.bg, colors.border, colors.text,
      )}
    >
      <div className="text-[10px] font-semibold leading-tight truncate">{label}</div>
      {!event.allDay && (
        <div className="text-[9px] opacity-75">
          {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
        </div>
      )}
      {event.allDay && <div className="text-[9px] opacity-75">All day</div>}
    </button>
  )
}

// Small preview block shown during drag-fill
function FillPreview({ sourceEvent }) {
  if (!sourceEvent) return null
  const colors = getEventColor(sourceEvent)
  const label = sourceEvent.availabilityType || sourceEvent.eventType
  return (
    <div className={clsx('w-full px-2 py-1 rounded border opacity-50', colors.bg, colors.border, colors.text)}>
      <div className="text-[10px] font-semibold leading-tight truncate">{label}</div>
    </div>
  )
}

export default function AvailabilityTimeline() {
  const { events, currentDate, viewMode, selectedTechId, openEditor, openRecurringEditor, bulkFillEvents } = useAvailabilityStore()
  const technicians = useSchedulerStore(s => s.technicians)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const today = startOfDay(new Date())

  // Compute days based on view mode
  const days = useMemo(() => {
    if (viewMode === 'week') {
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }
    // Month view: show full weeks that cover the month
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const firstDay = startOfWeek(monthStart, { weekStartsOn: 1 })
    const lastDay = startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 1 })
    const result = []
    let d = firstDay
    while (d <= addDays(lastDay, 6)) {
      result.push(d)
      d = addDays(d, 1)
      if (result.length > 42) break // max 6 weeks
    }
    return result
  }, [viewMode, weekStart, currentDate])

  // Drag-to-fill state
  const [dragFill, setDragFill] = useState(null)
  const dragFillRef = useRef(null)

  const filteredTechs = useMemo(() => {
    const active = technicians.filter(t => t.active)
    if (selectedTechId) return active.filter(t => t.recordId === selectedTechId)
    return active
  }, [technicians, selectedTechId])

  const eventsByTechDay = useMemo(() => {
    const map = {}
    for (const event of events) {
      const key = `${event.technicianId}`
      if (!map[key]) map[key] = {}
      const eventDate = startOfDay(parseISO(event.start))
      for (const day of days) {
        if (isSameDay(eventDate, day)) {
          const dayKey = format(day, 'yyyy-MM-dd')
          if (!map[key][dayKey]) map[key][dayKey] = []
          map[key][dayKey].push(event)
        }
      }
    }
    return map
  }, [events, days])

  const handleCellClick = (techId, day) => {
    if (dragFill) return
    openEditor({
      technicianId: techId,
      start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, 0).toISOString(),
      end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 17, 0).toISOString(),
      eventType: 'Available',
      availabilityType: 'Available',
      allDay: false,
    })
  }

  // ── Drag-to-fill handlers ────────────────────────────────────────────────
  const techIndexOf = useCallback((techId) => filteredTechs.findIndex(t => t.recordId === techId), [filteredTechs])

  const handleFillHandleMouseDown = useCallback((techId, day, sourceEvent, e) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceTechIdx = techIndexOf(techId)
    const sourceDayIdx = days.findIndex(d => format(d, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))

    const state = {
      sourceTechId: techId, sourceDay: day, sourceEvent: { ...sourceEvent },
      sourceTechIdx, sourceDayIdx,
      currentTechIdx: sourceTechIdx, currentDayIdx: sourceDayIdx,
    }
    setDragFill(state)
    dragFillRef.current = state
  }, [filteredTechs, days])

  // Global mousemove / mouseup during drag
  useEffect(() => {
    if (!dragFill) return

    const handleMouseMove = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const cell = el?.closest('[data-grid-cell]')
      if (!cell) return
      const techIdx = parseInt(cell.dataset.techIdx, 10)
      const dayIdx = parseInt(cell.dataset.dayIdx, 10)
      if (isNaN(techIdx) || isNaN(dayIdx)) return

      const prev = dragFillRef.current
      if (prev && (prev.currentTechIdx !== techIdx || prev.currentDayIdx !== dayIdx)) {
        const next = { ...prev, currentTechIdx: techIdx, currentDayIdx: dayIdx }
        setDragFill(next)
        dragFillRef.current = next
      }
    }

    const handleMouseUp = () => {
      const state = dragFillRef.current
      if (!state) return

      const { sourceTechIdx, sourceDayIdx, currentTechIdx, currentDayIdx, sourceEvent } = state
      const minTech = Math.min(sourceTechIdx, currentTechIdx)
      const maxTech = Math.max(sourceTechIdx, currentTechIdx)
      const minDay = Math.min(sourceDayIdx, currentDayIdx)
      const maxDay = Math.max(sourceDayIdx, currentDayIdx)

      const targetCells = []
      for (let ti = minTech; ti <= maxTech; ti++) {
        for (let di = minDay; di <= maxDay; di++) {
          if (ti === sourceTechIdx && di === sourceDayIdx) continue
          const tech = filteredTechs[ti]
          const day = days[di]
          if (tech && day) {
            targetCells.push({ technicianId: tech.recordId, date: day })
          }
        }
      }

      if (targetCells.length > 0) {
        bulkFillEvents(sourceEvent, targetCells)
      }

      setDragFill(null)
      dragFillRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragFill, filteredTechs, days, bulkFillEvents])

  const isCellInFillRange = useCallback((techIdx, dayIdx) => {
    if (!dragFill) return false
    const { sourceTechIdx, sourceDayIdx, currentTechIdx, currentDayIdx } = dragFill
    const minTech = Math.min(sourceTechIdx, currentTechIdx)
    const maxTech = Math.max(sourceTechIdx, currentTechIdx)
    const minDay = Math.min(sourceDayIdx, currentDayIdx)
    const maxDay = Math.max(sourceDayIdx, currentDayIdx)
    return techIdx >= minTech && techIdx <= maxTech && dayIdx >= minDay && dayIdx <= maxDay
  }, [dragFill])

  // ── WEEK VIEW ──
  if (viewMode === 'week') {
    return (
      <div className={clsx('flex-1 overflow-auto', dragFill && 'select-none cursor-crosshair')}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-3 py-2 text-left w-[180px]">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Technician</span>
              </th>
              {days.map(day => (
                <th
                  key={day.toISOString()}
                  className={clsx(
                    'border-b border-r border-gray-200 px-2 py-2 text-center min-w-[120px]',
                    isSameDay(day, today) ? 'bg-blue-50' : 'bg-gray-50',
                  )}
                >
                  <div className="text-[10px] font-semibold text-gray-400 uppercase">{format(day, 'EEE')}</div>
                  <div className={clsx(
                    'text-[13px] font-semibold',
                    isSameDay(day, today) ? 'text-blue-600' : 'text-gray-700',
                  )}>
                    {format(day, 'MMM d')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTechs.map((tech, techIdx) => {
              const techEvents = eventsByTechDay[tech.recordId] || {}
              return (
                <tr key={tech.recordId} className="group">
                  <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: tech.avatarColor }}
                      >
                        {tech.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-gray-800 truncate">{tech.fullName}</div>
                        <div className="text-[10px] text-gray-400">{tech.serviceRegion}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openRecurringEditor(tech.recordId)}
                        className="text-[9px] text-gray-400 hover:text-blue-500 flex items-center gap-0.5 transition-colors"
                        title="Set recurring schedule"
                      >
                        <Repeat size={9} /> Recurring
                      </button>
                    </div>
                  </td>
                  {days.map((day, dayIdx) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const dayEvents = techEvents[dayKey] || []
                    const inFillRange = isCellInFillRange(techIdx, dayIdx)
                    const isSource = dragFill?.sourceTechIdx === techIdx && dragFill?.sourceDayIdx === dayIdx

                    return (
                      <td
                        key={dayKey}
                        data-grid-cell
                        data-tech-idx={techIdx}
                        data-day-idx={dayIdx}
                        className={clsx(
                          'border-b border-r border-gray-200 px-1 py-1 align-top min-w-[120px] relative group/cell',
                          isSameDay(day, today) && 'bg-blue-50/30',
                          inFillRange && !isSource && 'bg-blue-50 ring-1 ring-inset ring-blue-300/25',
                          isSource && dragFill && 'ring-2 ring-inset ring-blue-400/50',
                        )}
                      >
                        <div className="space-y-1">
                          {dayEvents.map(event => (
                            <EventBlock
                              key={event.recordId}
                              event={event}
                              onClick={() => openEditor(event)}
                            />
                          ))}
                        </div>

                        {inFillRange && !isSource && dayEvents.length === 0 && dragFill?.sourceEvent && (
                          <div className="mt-1">
                            <FillPreview sourceEvent={dragFill.sourceEvent} />
                          </div>
                        )}

                        {!dragFill && dayEvents.length === 0 && !inFillRange && (
                          <button
                            onClick={() => handleCellClick(tech.recordId, day)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity bg-gray-50/50"
                          >
                            <Plus size={14} className="text-gray-300" />
                          </button>
                        )}

                        {dayEvents.length > 0 && !dragFill && (
                          <div
                            onMouseDown={(e) => handleFillHandleMouseDown(tech.recordId, day, dayEvents[0], e)}
                            className="absolute bottom-0 right-0 w-[7px] h-[7px] bg-blue-600 rounded-tl-[1px] cursor-crosshair opacity-0 group-hover/cell:opacity-100 transition-opacity z-[6]"
                            title="Drag to fill"
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            {filteredTechs.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-[13px] text-gray-400">
                  No technicians to display
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Legend */}
        <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-3 flex-wrap bg-white">
          {Object.entries(AVAILABILITY_COLORS).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={clsx('w-2.5 h-2.5 rounded-sm border', colors.bg, colors.border)} />
              <span className="text-[10px] text-gray-500">{key}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="w-[7px] h-[7px] bg-blue-600 rounded-tl-[1px]" />
            <span className="text-[10px] text-gray-500">Drag corner to fill</span>
          </div>
        </div>
      </div>
    )
  }

  // ── MONTH VIEW ──
  const monthStart = startOfMonth(currentDate)
  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="flex-1 overflow-auto">
      {filteredTechs.map((tech) => {
        const techEvents = eventsByTechDay[tech.recordId] || {}
        return (
          <div key={tech.recordId} className="border-b border-gray-200">
            {/* Tech header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: tech.avatarColor }}
              >
                {tech.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-[12px] font-semibold text-gray-800">{tech.fullName}</div>
              <div className="text-[10px] text-gray-400">{tech.serviceRegion}</div>
            </div>

            {/* Calendar grid */}
            <div className="px-4 py-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {weekDayHeaders.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Week rows */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-px">
                  {week.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const dayEvents = techEvents[dayKey] || []
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isToday = isSameDay(day, today)

                    return (
                      <div
                        key={dayKey}
                        className={clsx(
                          'border border-gray-100 rounded-sm p-1 min-h-[56px] relative group/cell transition-colors',
                          !isCurrentMonth && 'bg-gray-50/50',
                          isToday && 'bg-blue-50/40 border-blue-200',
                          isCurrentMonth && !isToday && 'hover:bg-gray-50/60',
                        )}
                      >
                        {/* Day number */}
                        <div className={clsx(
                          'text-[10px] font-semibold mb-0.5',
                          isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-600' : 'text-gray-300',
                        )}>
                          {format(day, 'd')}
                        </div>

                        {/* Events */}
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map(event => (
                            <EventBlock
                              key={event.recordId}
                              event={event}
                              onClick={() => openEditor(event)}
                              compact
                            />
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-gray-400 text-center">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Add button on hover */}
                        {dayEvents.length === 0 && isCurrentMonth && (
                          <button
                            onClick={() => handleCellClick(tech.recordId, day)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity"
                          >
                            <Plus size={12} className="text-gray-300" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {filteredTechs.length === 0 && (
        <div className="text-center py-12 text-[13px] text-gray-400">
          No technicians to display
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-3 flex-wrap bg-white">
        {Object.entries(AVAILABILITY_COLORS).map(([key, colors]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={clsx('w-2.5 h-2.5 rounded-sm border', colors.bg, colors.border)} />
            <span className="text-[10px] text-gray-500">{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
