import React from 'react'
import { Calendar, Lock, Scale, Zap, AlertTriangle, Filter } from 'lucide-react'
import { format, differenceInCalendarDays } from 'date-fns'
import { useAIScheduleStore } from '../../stores/aiScheduleStore'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { useWizardStore } from '../../stores/wizardStore'
import clsx from 'clsx'

const GOALS = [
  { key: 'balance', label: 'Fair Distribution', icon: Scale, desc: 'Even workload across techs' },
  { key: 'earliest', label: 'Earliest Completion', icon: Zap, desc: 'Finish all tasks ASAP' },
]

export default function ScopeConfigStep({ unassignedCount, totalEligible }) {
  const { scope, setScope, dateRange, setDateRange, optimizationGoal, setOptimizationGoal } = useAIScheduleStore()
  const { workOrders, technicians } = useSchedulerStore()
  const { schedulingConstraints, tableFilters } = useWizardStore()
  const pinnedCount = workOrders.filter(wo => wo.pinned).length
  const activeTechs = technicians.filter(t => t.active).length
  const days = differenceInCalendarDays(dateRange.to, dateRange.from) + 1

  // Build descriptive filter summaries per table
  const operatorLabels = { equals: 'is', contains: 'contains', in: 'is one of' }
  const woFilters = (tableFilters.workOrders || [])
    .filter(f => f.fieldKey && f.value)
    .map(f => `${f.fieldName || f.fieldKey} ${operatorLabels[f.operator] || f.operator} ${f.value}`)
  const techFilters = (tableFilters.technicians || [])
    .filter(f => f.fieldKey && f.value)
    .map(f => `${f.fieldName || f.fieldKey} ${operatorLabels[f.operator] || f.operator} ${f.value}`)

  // Scheduling constraints (shown as secondary info)
  const activeConstraints = []
  if (schedulingConstraints.useSkills) activeConstraints.push('Skill matching')
  if (schedulingConstraints.usePayRate) activeConstraints.push('Pay rate')
  if (schedulingConstraints.useAvailability) activeConstraints.push('Availability')

  const hasAnyFilter = woFilters.length > 0 || techFilters.length > 0 || pinnedCount > 0 || activeConstraints.length > 0

  // Count eligible based on scope (excluding pinned)
  const eligibleCount = scope === 'unassigned'
    ? workOrders.filter(wo => !wo.assignedTechnicianId && !wo.pinned).length
    : workOrders.filter(wo => wo.status !== 'Complete' && wo.status !== 'Cancelled' && !wo.pinned).length

  return (
    <div className="space-y-5">
      {/* Scope selection */}
      <div>
        <label className="text-[13px] font-medium text-ink-secondary block mb-2">Which work orders?</label>
        <div className="flex gap-3">
          <button
            onClick={() => setScope('unassigned')}
            className={clsx(
              'flex-1 p-3 rounded-md border text-left transition-all',
              scope === 'unassigned'
                ? 'border-qb-blue bg-qb-blue-light'
                : 'border-surface-active/60 hover:border-surface-active',
            )}
          >
            <div className="text-[13px] font-semibold text-ink-primary">Unassigned only</div>
            <div className="text-2xs text-ink-tertiary mt-0.5">{unassignedCount} work orders</div>
          </button>
          <button
            onClick={() => setScope('all')}
            className={clsx(
              'flex-1 p-3 rounded-md border text-left transition-all',
              scope === 'all'
                ? 'border-qb-blue bg-qb-blue-light'
                : 'border-surface-active/60 hover:border-surface-active',
            )}
          >
            <div className="text-[13px] font-semibold text-ink-primary">All (allow reschedule)</div>
            <div className="text-2xs text-ink-tertiary mt-0.5">{totalEligible} eligible work orders</div>
          </button>
        </div>
        {pinnedCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-2xs text-ink-tertiary">
            <Lock size={10} className="flex-shrink-0" />
            <span>{pinnedCount} pinned assignment{pinnedCount !== 1 ? 's' : ''} will not be moved</span>
          </div>
        )}
      </div>

      {/* Optimization goal */}
      <div>
        <label className="text-[13px] font-medium text-ink-secondary block mb-2">Optimization goal</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(g => (
            <button
              key={g.key}
              onClick={() => setOptimizationGoal(g.key)}
              className={clsx(
                'flex items-start gap-2.5 p-2.5 rounded-md border text-left transition-all',
                optimizationGoal === g.key
                  ? 'border-qb-blue bg-qb-blue-light'
                  : 'border-surface-active/60 hover:border-surface-active',
              )}
            >
              <g.icon size={14} className={clsx('flex-shrink-0 mt-0.5', optimizationGoal === g.key ? 'text-qb-blue' : 'text-ink-tertiary')} />
              <div>
                <div className="text-[12px] font-semibold text-ink-primary leading-tight">{g.label}</div>
                <div className="text-[10px] text-ink-tertiary mt-0.5">{g.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date range — editable */}
      <div>
        <label className="text-[13px] font-medium text-ink-secondary block mb-2">Date range</label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
            <input
              type="date"
              value={format(dateRange.from, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newFrom = new Date(e.target.value + 'T00:00:00')
                if (!isNaN(newFrom)) setDateRange(newFrom, dateRange.to)
              }}
              className="pl-8 pr-2 py-1.5 rounded-md border border-surface-active/60 text-[13px] text-ink-primary bg-white hover:border-surface-active focus:border-qb-blue focus:ring-1 focus:ring-qb-blue/20 focus:outline-none transition-all"
            />
          </div>
          <span className="text-[13px] text-ink-tertiary">to</span>
          <div className="relative">
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
            <input
              type="date"
              value={format(dateRange.to, 'yyyy-MM-dd')}
              onChange={(e) => {
                const newTo = new Date(e.target.value + 'T00:00:00')
                if (!isNaN(newTo)) setDateRange(dateRange.from, newTo)
              }}
              className="pl-8 pr-2 py-1.5 rounded-md border border-surface-active/60 text-[13px] text-ink-primary bg-white hover:border-surface-active focus:border-qb-blue focus:ring-1 focus:ring-qb-blue/20 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Applied filters summary */}
      <div className="p-3 rounded-md border border-surface-active/40 bg-surface-hover/30">
        <div className="flex items-center gap-1.5 mb-2">
          <Filter size={12} className="text-ink-tertiary" />
          <span className="text-[12px] font-medium text-ink-secondary">Filters applied</span>
        </div>
        {hasAnyFilter ? (
          <div className="space-y-2">
            {/* Work Order filters */}
            {woFilters.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider mb-1">Work Orders</div>
                <div className="flex flex-wrap gap-1.5">
                  {woFilters.map(f => (
                    <span
                      key={f}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-qb-blue-light text-qb-blue border border-qb-blue/10"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technician filters */}
            {techFilters.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider mb-1">Technicians</div>
                <div className="flex flex-wrap gap-1.5">
                  {techFilters.map(f => (
                    <span
                      key={f}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-qb-blue-light text-qb-blue border border-qb-blue/10"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned exclusion */}
            {pinnedCount > 0 && (
              <div className="flex items-center gap-1.5 text-2xs text-ink-tertiary">
                <Lock size={9} className="flex-shrink-0" />
                <span>{pinnedCount} pinned assignment{pinnedCount !== 1 ? 's' : ''} excluded</span>
              </div>
            )}

            {/* Scheduling constraints */}
            {activeConstraints.length > 0 && (
              <div className="text-2xs text-ink-tertiary">
                Constraints: {activeConstraints.join(', ')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-2xs text-ink-tertiary">No filters applied</p>
        )}
      </div>

      {/* Pre-run summary */}
      <div className="p-3 rounded-md bg-surface-hover/50 text-[12px] text-ink-secondary">
        Optimizing <span className="font-semibold text-ink-primary">{eligibleCount} task{eligibleCount !== 1 ? 's' : ''}</span> across{' '}
        <span className="font-semibold text-ink-primary">{activeTechs} resource{activeTechs !== 1 ? 's' : ''}</span> for{' '}
        <span className="font-semibold text-ink-primary">{days} day{days !== 1 ? 's' : ''}</span>
      </div>

      {/* Validation warning */}
      {eligibleCount === 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
          <AlertTriangle size={14} className="flex-shrink-0" />
          No eligible work orders for the selected scope and date range.
        </div>
      )}
    </div>
  )
}
