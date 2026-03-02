import React, { useRef, useState } from 'react'
import { useDrag } from 'react-dnd'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { Lock } from 'lucide-react'
import clsx from 'clsx'
import { useSchedulerStore } from '../../stores/schedulerStore'
import ContextMenu from './ContextMenu'

export default function WorkOrderBlock({ workOrder, hourWidth, dayStartHour, overrideLeft, overrideWidth, compact }) {
  const selectWorkOrder = useSchedulerStore(s => s.selectWorkOrder)
  const blockRef = useRef(null)
  const [contextMenu, setContextMenu] = useState(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'WORK_ORDER',
    item: { ...workOrder, source: 'timeline' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const start = parseISO(workOrder.scheduledStart)
  const end = parseISO(workOrder.scheduledEnd)
  const startMinutes = (start.getHours() - dayStartHour) * 60 + start.getMinutes()
  const durationMinutes = differenceInMinutes(end, start)

  const computedLeft = overrideLeft != null ? overrideLeft : (startMinutes / 60) * hourWidth
  const computedWidth = overrideWidth != null ? overrideWidth : Math.max((durationMinutes / 60) * hourWidth, 60)
  const left = computedLeft
  const width = computedWidth

  const handleClick = (e) => {
    e.stopPropagation()
    const rect = blockRef.current?.getBoundingClientRect()
    selectWorkOrder(workOrder, rect ? { top: rect.bottom + 4, left: rect.left } : null)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        ref={(node) => {
          drag(node)
          blockRef.current = node
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-dragging={isDragging}
        className={clsx('b-event b-event-blue', workOrder.pinned && 'b-event-pinned')}
        style={{ left: `${left}px`, width: `${width}px` }}
      >
        {compact ? (
          /* Compact mode for month view — just a colored bar with tooltip */
          <div className="b-event-title" style={{ fontSize: '9px' }}>
            {width > 30 ? workOrder.workOrderNumber : ''}
          </div>
        ) : (
          <>
            {/* Pin icon */}
            {workOrder.pinned && (
              <Lock size={9} className="absolute top-1 right-1 opacity-70" style={{ color: 'inherit' }} />
            )}
            {/* ID line */}
            <div className="text-[9px] font-semibold opacity-60 leading-none mb-0.5 truncate">
              {workOrder.workOrderNumber}
            </div>
            {/* Title */}
            <div className="b-event-title">
              {workOrder.title}
            </div>
            {/* Time */}
            {width > 90 && (
              <div className="b-event-time">
                {format(start, 'h:mm')}–{format(end, 'h:mm a')}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <ContextMenu
          workOrder={workOrder}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
