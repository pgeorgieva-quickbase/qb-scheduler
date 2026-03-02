import React, { useState, useMemo, useRef, useEffect } from 'react'
import { X, ChevronDown, Search } from 'lucide-react'
import { useSchedulerStore } from '../../stores/schedulerStore'
import clsx from 'clsx'

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Critical', color: '#DE350B' },
  { value: 2, label: 'High', color: '#FF991F' },
  { value: 3, label: 'Medium', color: '#5E6C84' },
  { value: 4, label: 'Low', color: '#97A0AF' },
]

const STATUS_OPTIONS = [
  { value: 'New', color: '#0052CC' },
  { value: 'Scheduled', color: '#00875A' },
  { value: 'In Progress', color: '#FF991F' },
  { value: 'Complete', color: '#97A0AF' },
]

function FilterDropdown({ label, children, count }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'filter-chip',
          count > 0 ? 'filter-chip-active' : 'filter-chip-inactive',
        )}
      >
        {label}
        {count > 0 && (
          <span className="w-4 h-4 rounded-full bg-qb-blue text-white text-[9px] font-bold flex items-center justify-center">
            {count}
          </span>
        )}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-popover border border-surface-active/40 py-1 z-50 min-w-[180px] animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

export default function FilterBar() {
  const { filters, setFilter, technicians } = useSchedulerStore()

  // Collect all unique skills from technicians and work orders
  const allSkills = useMemo(() => {
    const skills = new Set()
    technicians.forEach(t => (t.skills || []).forEach(s => skills.add(s)))
    return [...skills].sort()
  }, [technicians])

  const activeFilterCount =
    (filters.skills?.length || 0) +
    (filters.priority ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.search ? 1 : 0)

  const clearAll = () => {
    setFilter('skills', [])
    setFilter('priority', null)
    setFilter('status', null)
    setFilter('search', '')
  }

  const toggleSkill = (skill) => {
    const current = filters.skills || []
    const next = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill]
    setFilter('skills', next)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-surface-active/40">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => setFilter('search', e.target.value)}
          placeholder="Search technicians..."
          className="w-44 bg-surface-hover rounded-md pl-8 pr-2 py-1.5 text-[12px] text-ink-primary placeholder:text-ink-tertiary focus:bg-white focus:outline-none focus:ring-2 focus:ring-qb-blue/20 transition-all"
        />
      </div>

      <div className="w-px h-5 bg-surface-active/60" />

      {/* Skills filter */}
      <FilterDropdown label="Skills" count={filters.skills?.length || 0}>
        {allSkills.map(skill => (
          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left',
              (filters.skills || []).includes(skill)
                ? 'bg-qb-blue-light text-qb-blue font-medium'
                : 'text-ink-secondary hover:bg-surface-hover',
            )}
          >
            <div className={clsx(
              'w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0',
              (filters.skills || []).includes(skill)
                ? 'bg-qb-blue border-qb-blue'
                : 'border-surface-active',
            )}>
              {(filters.skills || []).includes(skill) && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            {skill}
          </button>
        ))}
      </FilterDropdown>

      {/* Priority filter */}
      <FilterDropdown label="Priority" count={filters.priority ? 1 : 0}>
        <button
          onClick={() => setFilter('priority', null)}
          className={clsx(
            'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
            !filters.priority ? 'bg-qb-blue-light text-qb-blue font-medium' : 'text-ink-secondary hover:bg-surface-hover',
          )}
        >
          All priorities
        </button>
        {PRIORITY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter('priority', opt.value)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
              filters.priority === opt.value
                ? 'bg-qb-blue-light text-qb-blue font-medium'
                : 'text-ink-secondary hover:bg-surface-hover',
            )}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
            {opt.label}
          </button>
        ))}
      </FilterDropdown>

      {/* Status filter */}
      <FilterDropdown label="Status" count={filters.status ? 1 : 0}>
        <button
          onClick={() => setFilter('status', null)}
          className={clsx(
            'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
            !filters.status ? 'bg-qb-blue-light text-qb-blue font-medium' : 'text-ink-secondary hover:bg-surface-hover',
          )}
        >
          All statuses
        </button>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter('status', opt.value)}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-left transition-colors',
              filters.status === opt.value
                ? 'bg-qb-blue-light text-qb-blue font-medium'
                : 'text-ink-secondary hover:bg-surface-hover',
            )}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.color }} />
            {opt.value}
          </button>
        ))}
      </FilterDropdown>

      {/* Active filter count + clear */}
      {activeFilterCount > 0 && (
        <>
          <div className="w-px h-5 bg-surface-active/60" />
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[12px] text-ink-tertiary hover:text-status-critical transition-colors"
          >
            <X size={12} />
            Clear filters
          </button>
        </>
      )}
    </div>
  )
}
