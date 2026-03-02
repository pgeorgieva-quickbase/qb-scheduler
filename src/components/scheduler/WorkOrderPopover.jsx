import React, { useEffect, useRef } from 'react'
import { X, Clock, MapPin, Wrench, User, ArrowUpRight, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import Badge from '../shared/Badge'
import { useSchedulerStore } from '../../stores/schedulerStore'

const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' }

export default function WorkOrderPopover() {
  const { selectedWorkOrder: wo, popoverPosition, clearSelection, unassignWorkOrder, technicians } = useSchedulerStore()
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        clearSelection()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!wo || !popoverPosition) return null

  const tech = technicians.find(t => t.recordId === wo.assignedTechnicianId)

  return (
    <div
      ref={ref}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-popover animate-fade-in"
      style={{ top: popoverPosition.top, left: popoverPosition.left }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b border-surface-active/40">
        <div>
          <span className="text-2xs text-ink-tertiary font-medium">{wo.workOrderNumber}</span>
          <h4 className="text-[13px] font-semibold text-ink-primary mt-0.5">{wo.title}</h4>
        </div>
        <button onClick={clearSelection} className="text-ink-tertiary hover:text-ink-secondary p-0.5">
          <X size={14} />
        </button>
      </div>

      {/* Details */}
      <div className="p-3 space-y-2">
        {wo.scheduledStart && (
          <div className="flex items-center gap-2 text-[12px]">
            <Clock size={13} className="text-ink-tertiary flex-shrink-0" />
            <span className="text-ink-secondary">
              {format(parseISO(wo.scheduledStart), 'MMM d, h:mm a')} – {format(parseISO(wo.scheduledEnd), 'h:mm a')}
            </span>
            <Badge variant="duration">{wo.estDuration}h</Badge>
          </div>
        )}

        {tech && (
          <div className="flex items-center gap-2 text-[12px]">
            <User size={13} className="text-ink-tertiary flex-shrink-0" />
            <span className="text-ink-secondary">{tech.fullName}</span>
            <span className="text-2xs text-ink-tertiary">${tech.hourlyRate}/hr</span>
          </div>
        )}

        {wo.locationAddress && (
          <div className="flex items-center gap-2 text-[12px]">
            <MapPin size={13} className="text-ink-tertiary flex-shrink-0" />
            <span className="text-ink-secondary truncate">{wo.locationAddress}</span>
          </div>
        )}

        {wo.skillsRequired?.length > 0 && (
          <div className="flex items-center gap-2 text-[12px]">
            <Wrench size={13} className="text-ink-tertiary flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {wo.skillsRequired.map(s => (
                <Badge key={s} variant="skill">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Priority — plain text, no coloring */}
        {wo.priority && (
          <div className="text-[12px] text-ink-secondary">
            Priority: {PRIORITY_LABELS[wo.priority] || wo.priority}
          </div>
        )}

        {wo.customer && (
          <div className="text-2xs text-ink-tertiary mt-1">
            Customer: {wo.customer}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-3 border-t border-surface-active/40">
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] font-medium text-qb-blue hover:bg-qb-blue-light transition-colors">
          <ArrowUpRight size={13} />
          Open Record
        </button>
        {wo.assignedTechnicianId && (
          <button
            onClick={() => unassignWorkOrder(wo.recordId)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[12px] font-medium text-status-critical hover:bg-status-critical/5 transition-colors"
          >
            <Trash2 size={13} />
            Unassign
          </button>
        )}
      </div>
    </div>
  )
}
