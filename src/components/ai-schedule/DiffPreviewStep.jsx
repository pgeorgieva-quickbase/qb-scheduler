import React from 'react'
import { CheckCircle, RefreshCw, ArrowUpRight, AlertCircle } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import { useAIScheduleStore } from '../../stores/aiScheduleStore'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-hover/50">
      <Icon size={14} className={color} />
      <span className="text-[12px] text-ink-secondary">{label}</span>
      <span className="text-[13px] font-semibold text-ink-primary ml-auto">{value}</span>
    </div>
  )
}

export default function DiffPreviewStep() {
  const { changes, stats } = useAIScheduleStore()

  const assignableCount = changes.filter(c => c.changeType !== 'unassignable').length
  const unassignableChanges = changes.filter(c => c.changeType === 'unassignable')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <AISparkleIcon size={18} className="text-ai-purple" />
        <h3 className="text-[15px] font-semibold text-ink-primary">Optimization Results</h3>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={CheckCircle} label="New assignments" value={stats?.newAssignments || 0} color="text-status-scheduled" />
        <StatCard icon={RefreshCw} label="Rescheduled" value={stats?.rescheduled || 0} color="text-ai-purple" />
        <StatCard icon={ArrowUpRight} label="Reassigned" value={stats?.reassigned || 0} color="text-status-in-progress" />
        <StatCard icon={AlertCircle} label="Unassignable" value={stats?.unassignable || 0} color="text-status-critical" />
      </div>

      {/* Summary line */}
      {assignableCount > 0 && (
        <div className="p-3 rounded-md bg-status-scheduled/5 border border-status-scheduled/15 text-[13px] text-ink-secondary">
          <span className="font-semibold text-ink-primary">{assignableCount}</span> work order{assignableCount !== 1 ? 's' : ''} scheduled — close and <span className="font-semibold text-ink-primary">Save</span> to persist.
        </div>
      )}

      {/* Unassignable section */}
      {unassignableChanges.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} className="text-status-critical" />
            <span className="text-[13px] font-medium text-ink-secondary">
              Could not assign ({unassignableChanges.length})
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
            {unassignableChanges.map((change, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-status-critical/5 border border-status-critical/10"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-ink-tertiary font-medium">
                      {change.workOrder.workOrderNumber}
                    </span>
                    <span className="text-[12px] font-medium text-ink-primary truncate">
                      {change.workOrder.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-status-critical mt-0.5">
                    {change.reason || 'No qualified technician available'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {changes.length === 0 && (
        <div className="text-center py-8 text-[13px] text-ink-tertiary">
          No changes proposed. All work orders may already be optimally assigned.
        </div>
      )}
    </div>
  )
}
