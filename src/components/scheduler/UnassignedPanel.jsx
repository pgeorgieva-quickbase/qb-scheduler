import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useDrag } from 'react-dnd'
import { Search, ChevronLeft, ChevronRight, Inbox, SlidersHorizontal, ArrowUpDown, X, Calendar, Clock, MapPin, Wrench, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { useAIScheduleStore } from '../../stores/aiScheduleStore'
import { AlertTriangle } from 'lucide-react'
import Badge from '../shared/Badge'
import clsx from 'clsx'

// Uniform blue for all unassigned cards
const CARD_BORDER_COLOR = '#3b82f6'

const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' }

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Critical' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Low' },
]

const STATUS_OPTIONS = ['New', 'Scheduled', 'In Progress']

function UnassignedCard({ workOrder, aiReason }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'WORK_ORDER',
    item: () => ({ ...workOrder, source: 'unassigned' }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const cardRef = useRef(null)
  const [hoverPos, setHoverPos] = useState(null)
  const hoverTimeout = useRef(null)

  const handleMouseEnter = useCallback(() => {
    hoverTimeout.current = setTimeout(() => {
      const rect = cardRef.current?.getBoundingClientRect()
      if (rect) {
        const top = rect.top
        const left = rect.left - 324
        setHoverPos({
          top: Math.max(8, Math.min(top, window.innerHeight - 320)),
          left: left < 8 ? rect.right + 8 : left,
        })
      }
    }, 350)
  }, [])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimeout.current)
    setHoverPos(null)
  }, [])

  return (
    <>
      <div
        ref={(node) => {
          drag(node)
          cardRef.current = node
        }}
        className={clsx(
          'b-unassigned-card group',
          isDragging && 'opacity-40',
        )}
        style={{ borderLeftColor: CARD_BORDER_COLOR }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="min-w-0">
          {/* Title */}
          <div className="text-[12px] font-semibold text-gray-800 leading-tight mb-1.5">
            {workOrder.title}
          </div>

          {/* Skills */}
          {(workOrder.skillsRequired || []).length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mb-1.5">
              {(workOrder.skillsRequired || []).slice(0, 3).map(s => (
                <span key={s} className="b-skill-tag">{s}</span>
              ))}
              {(workOrder.skillsRequired || []).length > 3 && (
                <span className="b-skill-tag">+{workOrder.skillsRequired.length - 3}</span>
              )}
            </div>
          )}

          {/* Start / End date-time */}
          {workOrder.scheduledStart && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-0.5">
              <Calendar size={9} className="flex-shrink-0" />
              <span>Start: {format(new Date(workOrder.scheduledStart), 'MMM d, h:mm a')}</span>
            </div>
          )}
          {workOrder.scheduledEnd && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Calendar size={9} className="flex-shrink-0" />
              <span>End: {format(new Date(workOrder.scheduledEnd), 'MMM d, h:mm a')}</span>
            </div>
          )}

          {/* AI failure reason */}
          {aiReason && (
            <div className="flex items-start gap-1 mt-1.5 text-[10px] text-red-500 italic leading-tight">
              <AlertTriangle size={10} className="flex-shrink-0 mt-px" />
              <span>{aiReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover popover */}
      {hoverPos && !isDragging && (
        <div
          className="fixed z-50 w-80 bg-white rounded-lg shadow-popover animate-fade-in pointer-events-none"
          style={{ top: hoverPos.top, left: hoverPos.left }}
        >
          {/* Header */}
          <div className="p-3 border-b border-surface-active/40">
            <span className="text-2xs text-ink-tertiary font-medium">{workOrder.workOrderNumber}</span>
            <h4 className="text-[13px] font-semibold text-ink-primary mt-0.5">{workOrder.title}</h4>
          </div>

          {/* Details */}
          <div className="p-3 space-y-2">
            {workOrder.scheduledStart && (
              <div className="flex items-center gap-2 text-[12px]">
                <Clock size={13} className="text-ink-tertiary flex-shrink-0" />
                <span className="text-ink-secondary">
                  {format(new Date(workOrder.scheduledStart), 'MMM d, h:mm a')} – {format(new Date(workOrder.scheduledEnd), 'MMM d, h:mm a')}
                </span>
              </div>
            )}

            {workOrder.locationAddress && (
              <div className="flex items-center gap-2 text-[12px]">
                <MapPin size={13} className="text-ink-tertiary flex-shrink-0" />
                <span className="text-ink-secondary truncate">{workOrder.locationAddress}</span>
              </div>
            )}

            {workOrder.skillsRequired?.length > 0 && (
              <div className="flex items-center gap-2 text-[12px]">
                <Wrench size={13} className="text-ink-tertiary flex-shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {workOrder.skillsRequired.map(s => (
                    <Badge key={s} variant="skill">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Priority — plain text, no coloring */}
            {workOrder.priority && (
              <div className="text-[12px] text-ink-secondary">
                Priority: {PRIORITY_LABELS[workOrder.priority] || workOrder.priority}
              </div>
            )}

            {workOrder.customer && (
              <div className="text-2xs text-ink-tertiary mt-1">
                Customer: {workOrder.customer}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 p-3 border-t border-surface-active/40">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-qb-blue">
              <ArrowUpRight size={13} />
              Open Record
            </span>
          </div>
        </div>
      )}
    </>
  )
}

export default function UnassignedPanel() {
  const workOrders = useSchedulerStore(s => s.workOrders)
  const unassignableReasons = useAIScheduleStore(s => s.unassignableReasons)
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [filterPriority, setFilterPriority] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const sortRef = useRef(null)
  const filterRef = useRef(null)

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeFilterCount = (filterPriority ? 1 : 0) + (filterStatus ? 1 : 0)

  const unassigned = useMemo(() => {
    let items = workOrders.filter(wo => !wo.assignedTechnicianId && wo.status !== 'Complete' && wo.status !== 'Cancelled')

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(wo =>
        wo.title.toLowerCase().includes(q) ||
        wo.workOrderNumber.toLowerCase().includes(q) ||
        (wo.skillsRequired || []).some(s => s.toLowerCase().includes(q))
      )
    }

    if (filterPriority) {
      items = items.filter(wo => wo.priority === filterPriority)
    }

    if (filterStatus) {
      items = items.filter(wo => wo.status === filterStatus)
    }

    items.sort((a, b) => {
      if (sortBy === 'priority') return a.priority - b.priority
      if (sortBy === 'duration') return (b.estDuration || 0) - (a.estDuration || 0)
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })

    return items
  }, [workOrders, search, sortBy, filterPriority, filterStatus])

  return (
    <div className={clsx(
      'b-unassigned-panel transition-all flex-shrink-0 flex flex-col h-full',
      collapsed ? 'w-10' : 'w-[280px]',
    )}>
      {/* Header */}
      <div className={clsx(
        'b-unassigned-header flex items-center flex-shrink-0',
        collapsed ? 'flex-col py-2 px-1 gap-2' : 'gap-1',
      )}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-0.5"
        >
          {collapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Inbox size={14} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">
              {unassigned.length}
            </span>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 text-[13px]">Unassigned</span>
              <span className="text-[10px] text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5 font-semibold">
                {unassigned.length}
              </span>
            </div>

            {/* Filter button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false) }}
                className={clsx(
                  'p-1 rounded transition-colors',
                  activeFilterCount > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                )}
                title="Filter tasks"
              >
                <SlidersHorizontal size={13} />
              </button>
              {showFilterMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[180px] animate-fade-in">
                  {/* Priority section */}
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Priority
                  </div>
                  <button
                    onClick={() => setFilterPriority(null)}
                    className={clsx(
                      'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
                      !filterPriority ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    All
                  </button>
                  {PRIORITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterPriority(filterPriority === opt.value ? null : opt.value)}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
                        filterPriority === opt.value
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <div className={`b-priority-dot b-priority-${opt.value}`} />
                      {opt.label}
                    </button>
                  ))}

                  <div className="border-t border-gray-100 my-1" />

                  {/* Status section */}
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Status
                  </div>
                  <button
                    onClick={() => setFilterStatus(null)}
                    className={clsx(
                      'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
                      !filterStatus ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    All
                  </button>
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(filterStatus === status ? null : status)}
                      className={clsx(
                        'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
                        filterStatus === status
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      {status}
                    </button>
                  ))}

                  {activeFilterCount > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setFilterPriority(null); setFilterStatus(null) }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                        Clear filters
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sort button */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false) }}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Sort tasks"
              >
                <ArrowUpDown size={13} />
              </button>
              {showSortMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[140px] animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Sort by
                  </div>
                  {[
                    { key: 'priority', label: 'Priority' },
                    { key: 'duration', label: 'Duration' },
                    { key: 'title', label: 'Title' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSortBy(opt.key); setShowSortMenu(false) }}
                      className={clsx(
                        'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
                        sortBy === opt.key
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Search (only when expanded) */}
      {!collapsed && (
        <div className="px-2 py-2 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search work orders..."
              className="w-full bg-gray-50 rounded pl-7 pr-2 py-1.5 text-[11px] text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 transition-all border border-transparent focus:border-blue-200"
            />
          </div>
        </div>
      )}

      {/* Scrollable card list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
          {unassigned.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Inbox size={28} className="text-gray-300 mb-2" />
              <p className="text-[12px] text-gray-400">
                {search || activeFilterCount > 0 ? 'No matching work orders' : 'All work orders are assigned'}
              </p>
            </div>
          ) : (
            unassigned.map(wo => (
              <UnassignedCard
                key={wo.recordId}
                workOrder={wo}
                aiReason={unassignableReasons[wo.recordId]}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
