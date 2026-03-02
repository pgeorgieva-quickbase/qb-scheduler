import React from 'react'
import { ArrowRight, Clock, User, AlertCircle, Lightbulb } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import Badge from '../shared/Badge'
import clsx from 'clsx'

const changeTypeConfig = {
  new: { label: 'New', variant: 'change', icon: '→' },
  reassigned: { label: 'Reassigned', variant: 'warning', icon: '↻' },
  rescheduled: { label: 'Rescheduled', variant: 'ai', icon: '↕' },
  unassignable: { label: 'Unassignable', variant: 'error', icon: '✗' },
}

export default function ChangeRow({ change, index, onToggle }) {
  const config = changeTypeConfig[change.changeType]

  return (
    <div
      className={clsx(
        'px-3 py-2 rounded-md transition-all',
        change.accepted ? 'bg-white' : 'bg-surface-hover/50 opacity-60',
        change.changeType === 'unassignable' && 'opacity-50',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Accept/reject toggle */}
        {change.changeType !== 'unassignable' ? (
          <input
            type="checkbox"
            checked={change.accepted}
            onChange={() => onToggle(index)}
            className="rounded border-surface-active accent-qb-blue flex-shrink-0"
          />
        ) : (
          <AlertCircle size={16} className="text-status-critical flex-shrink-0" />
        )}

        {/* Change type badge */}
        <Badge variant={config.variant}>{config.label}</Badge>

        {/* WO info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xs text-ink-tertiary font-medium">
              {change.workOrder.workOrderNumber}
            </span>
            <span className="text-[13px] font-medium text-ink-primary truncate">
              {change.workOrder.title}
            </span>
          </div>
        </div>

        {/* Assignment */}
        {change.technician && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <ArrowRight size={12} className="text-ink-tertiary" />
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-ink-tertiary" />
              <span className="text-[12px] text-ink-secondary font-medium">
                {change.technician.fullName}
              </span>
            </div>
          </div>
        )}

        {/* Time */}
        {change.proposedStart && (
          <div className="flex items-center gap-1.5 flex-shrink-0 text-[12px] text-ink-secondary">
            <Clock size={12} className="text-ink-tertiary" />
            <span>
              {format(parseISO(change.proposedStart), 'MMM d h:mm a')}
            </span>
          </div>
        )}

        {/* Unassignable reason */}
        {change.reason && (
          <span className="text-2xs text-status-critical italic flex-shrink-0">
            {change.reason}
          </span>
        )}
      </div>

      {/* Per-assignment rationale */}
      {change.rationale && (
        <div className="flex items-center gap-1.5 mt-1 ml-8 text-[10px] text-ink-tertiary italic">
          <Lightbulb size={10} className="flex-shrink-0 text-ai-purple" />
          <span>{change.rationale}</span>
        </div>
      )}
    </div>
  )
}
