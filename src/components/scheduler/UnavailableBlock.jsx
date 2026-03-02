import React, { useRef, useState } from 'react'
import { parseISO, differenceInMinutes, format } from 'date-fns'
import { Ban, Clock } from 'lucide-react'

const UNAVAIL_STYLE = {
  bg: 'rgba(156, 163, 175, 0.10)',
  border: '#9ca3af',
  color: '#6b7280',
  hatching: 'rgba(156, 163, 175, 0.06)',
}

function UnavailPopover({ event, position }) {
  const start = parseISO(event.start)
  const end = parseISO(event.end)

  return (
    <div
      className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 p-0 animate-fade-in"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '220px',
        pointerEvents: 'none',
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 border-b rounded-t-lg flex items-center gap-2"
        style={{ background: UNAVAIL_STYLE.bg, borderColor: UNAVAIL_STYLE.border + '33' }}
      >
        <Ban size={13} style={{ color: UNAVAIL_STYLE.color }} />
        <span className="text-[13px] font-bold" style={{ color: UNAVAIL_STYLE.color }}>
          Unavailable
        </span>
      </div>

      {/* Details */}
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-gray-400 flex-shrink-0" />
          <span className="text-[12px] text-gray-700">
            {event.allDay
              ? `${format(start, 'MMM d')} – ${format(end, 'MMM d')} (all day)`
              : `${format(start, 'MMM d, h:mm a')} – ${format(end, 'h:mm a')}`}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function UnavailableBlock({ event, hourWidth, dayStartHour, dayDate, overrideLeft, overrideWidth }) {
  const blockRef = useRef(null)
  const [hoverPos, setHoverPos] = useState(null)
  const hoverTimeout = useRef(null)

  // When overrides are provided (week/month view), use them directly
  const useOverride = overrideLeft != null && overrideWidth != null

  let left, width

  if (useOverride) {
    left = overrideLeft
    width = overrideWidth
  } else {
    const start = parseISO(event.start)
    const end = parseISO(event.end)

    // Clamp to day boundaries
    const dayStart = new Date(dayDate)
    dayStart.setHours(dayStartHour, 0, 0, 0)
    const dayEnd = new Date(dayDate)
    dayEnd.setHours(dayStartHour + 24, 0, 0, 0)

    const effectiveStart = start < dayStart ? dayStart : start
    const effectiveEnd = end > dayEnd ? dayEnd : end

    const startMinutes = (effectiveStart.getHours() - dayStartHour) * 60 + effectiveStart.getMinutes()
    const durationMinutes = differenceInMinutes(effectiveEnd, effectiveStart)

    if (durationMinutes <= 0) return null

    left = (startMinutes / 60) * hourWidth
    width = (durationMinutes / 60) * hourWidth
  }

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      const rect = blockRef.current?.getBoundingClientRect()
      if (rect) {
        const top = rect.bottom + 6
        const left = Math.min(rect.left, window.innerWidth - 240)
        setHoverPos({ top, left })
      }
    }, 400)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current)
    setHoverPos(null)
  }

  return (
    <>
      <div
        ref={blockRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="unavail-event"
        style={{
          left: `${left}px`,
          width: `${width}px`,
          background: `repeating-linear-gradient(-45deg, ${UNAVAIL_STYLE.bg}, ${UNAVAIL_STYLE.bg} 4px, ${UNAVAIL_STYLE.hatching} 4px, ${UNAVAIL_STYLE.hatching} 8px)`,
          borderLeft: `3px solid ${UNAVAIL_STYLE.border}`,
          borderRight: `1px solid ${UNAVAIL_STYLE.border}33`,
        }}
      >
        {width > 50 && (
          <div className="flex items-center gap-1.5 px-2 overflow-hidden">
            <Ban size={11} style={{ color: UNAVAIL_STYLE.color, flexShrink: 0 }} />
            <span
              className="text-[10px] font-semibold truncate"
              style={{ color: UNAVAIL_STYLE.color }}
            >
              Unavailable
            </span>
          </div>
        )}
        {width <= 50 && (
          <div className="flex items-center justify-center">
            <Ban size={11} style={{ color: UNAVAIL_STYLE.color }} />
          </div>
        )}
      </div>

      {/* Hover popover */}
      {hoverPos && (
        <UnavailPopover event={event} position={hoverPos} />
      )}
    </>
  )
}
