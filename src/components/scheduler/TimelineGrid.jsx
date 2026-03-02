import React, { useMemo, useRef, useEffect, useState } from 'react'
import { format, addHours, addDays, startOfDay, startOfWeek, startOfMonth, endOfMonth, isSameDay, differenceInCalendarDays, getDay } from 'date-fns'
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'
import TechnicianRow from './TechnicianRow'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { useWizardStore } from '../../stores/wizardStore'
import clsx from 'clsx'

export default function TimelineGrid() {
  const { technicians, currentDate, viewMode, filters, setFilter } = useSchedulerStore()
  const { timelineSettings } = useWizardStore()
  const scrollRef = useRef(null)
  const [techSearch, setTechSearch] = useState('')
  const [showTechFilter, setShowTechFilter] = useState(false)
  const [techSortBy, setTechSortBy] = useState('name')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortRef = useRef(null)
  const filterRef = useRef(null)

  // ── View-mode-aware time axis config ──
  const dayStartHour = 0
  const dayEndHour = 24
  const hoursPerDay = dayEndHour - dayStartHour // 24

  // Non-working day set for quick lookup
  const nonWorkingDaySet = useMemo(() => {
    const set = new Set()
    for (const nwd of timelineSettings.customNonWorkingDays || []) {
      set.add(nwd.date) // 'YYYY-MM-DD'
    }
    return set
  }, [timelineSettings.customNonWorkingDays])

  const isNonWorkingDay = (d) => nonWorkingDaySet.has(format(d, 'yyyy-MM-dd'))
  const isWeekend = (d) => { const dow = getDay(d); return dow === 0 || dow === 6 }

  // Compute days + hourWidth based on viewMode
  const { days, hourWidth, timeColumns } = useMemo(() => {
    if (viewMode === 'day') {
      const cols = []
      for (let h = dayStartHour; h < dayEndHour; h++) cols.push(h)
      return { days: [currentDate], hourWidth: 80, timeColumns: cols }
    }
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
      let d = []
      for (let i = 0; i < 7; i++) d.push(addDays(weekStart, i))
      // Filter weekends if setting is off
      if (!timelineSettings.showWeekends) {
        d = d.filter(day => !isWeekend(day))
      }
      return { days: d, hourWidth: 10, timeColumns: null }
    }
    // month
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const numDays = differenceInCalendarDays(monthEnd, monthStart) + 1
    let d = []
    for (let i = 0; i < numDays; i++) d.push(addDays(monthStart, i))
    if (!timelineSettings.showWeekends) {
      d = d.filter(day => !isWeekend(day))
    }
    return { days: d, hourWidth: 4, timeColumns: null }
  }, [viewMode, currentDate, timelineSettings.showWeekends])

  // Width per day-column for week/month
  const dayColumnWidth = viewMode === 'day' ? hoursPerDay * hourWidth : hoursPerDay * hourWidth
  const totalWidth = viewMode === 'day'
    ? hoursPerDay * hourWidth
    : days.length * dayColumnWidth

  // Collect all unique skills
  const allSkills = useMemo(() => {
    const skills = new Set()
    technicians.forEach(t => (t.skills || []).forEach(s => skills.add(s)))
    return [...skills].sort()
  }, [technicians])

  // Filter + sort technicians
  const filteredTechnicians = useMemo(() => {
    let techs = [...technicians]

    if (filters.skills && filters.skills.length > 0) {
      techs = techs.filter(t =>
        filters.skills.some(s => (t.skills || []).includes(s))
      )
    }

    if (techSearch) {
      const q = techSearch.toLowerCase()
      techs = techs.filter(t =>
        t.fullName.toLowerCase().includes(q) ||
        (t.skills || []).some(s => s.toLowerCase().includes(q))
      )
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      techs = techs.filter(t =>
        t.fullName.toLowerCase().includes(q) ||
        (t.skills || []).some(s => s.toLowerCase().includes(q))
      )
    }

    techs.sort((a, b) => {
      if (techSortBy === 'name') return a.fullName.localeCompare(b.fullName)
      if (techSortBy === 'skills') return (b.skills || []).length - (a.skills || []).length
      if (techSortBy === 'shift') return (a.shiftStart || '').localeCompare(b.shiftStart || '')
      return 0
    })

    return techs
  }, [technicians, filters.skills, filters.search, techSearch, techSortBy])

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowTechFilter(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Scroll to current time on mount (day view only)
  useEffect(() => {
    if (scrollRef.current && viewMode === 'day') {
      const now = new Date()
      const currentHour = now.getHours()
      if (currentHour >= dayStartHour && currentHour < dayEndHour) {
        const scrollTo = (currentHour - dayStartHour) * hourWidth - 100
        scrollRef.current.scrollLeft = Math.max(0, scrollTo)
      }
    }
  }, [currentDate, viewMode])

  // Now line position (day + week view)
  const now = new Date()
  const nowMinutes = (now.getHours() - dayStartHour) * 60 + now.getMinutes()
  const nowFractionOfDay = nowMinutes / (hoursPerDay * 60)

  const showNowLineDay = viewMode === 'day' && now.getHours() >= dayStartHour && now.getHours() < dayEndHour && isSameDay(currentDate, now)
  const nowLeftDay = (nowMinutes / 60) * hourWidth

  // Week view now line
  const nowDayIndex = days.findIndex(d => isSameDay(d, now))
  const showNowLineWeek = viewMode === 'week' && nowDayIndex >= 0
  const nowLeftWeek = showNowLineWeek
    ? nowDayIndex * dayColumnWidth + nowFractionOfDay * dayColumnWidth
    : 0

  const toggleSkillFilter = (skill) => {
    const current = filters.skills || []
    const next = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill]
    setFilter('skills', next)
  }

  const activeSkillCount = filters.skills?.length || 0

  // ── Header rendering helpers — two rows: date label + hours ──
  const renderDayTimeAxis = () => (
    <div style={{ minWidth: `${totalWidth}px` }}>
      {/* Row 1: Date label */}
      <div className="b-header-date-row">
        <div className="b-header-date-cell" style={{ flex: 1 }}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </div>
      </div>
      {/* Row 2: Hour columns */}
      <div className="b-header-hour-row">
        {timeColumns.map(h => (
          <div
            key={h}
            className={`b-header-hour-cell ${h % 6 === 0 ? 'b-major' : ''}`}
            style={{ width: `${hourWidth}px`, flexShrink: 0 }}
          >
            {format(addHours(startOfDay(currentDate), h), 'h a')}
          </div>
        ))}
      </div>
    </div>
  )

  // Get non-working day label
  const getNonWorkingLabel = (d) => {
    const key = format(d, 'yyyy-MM-dd')
    const nwd = (timelineSettings.customNonWorkingDays || []).find(n => n.date === key)
    return nwd?.label || null
  }

  const renderWeekTimeAxis = () => (
    <div style={{ minWidth: `${totalWidth}px` }}>
      {/* Row 1: Day names */}
      <div className="b-header-date-row">
        {days.map(d => {
          const nwLabel = getNonWorkingLabel(d)
          return (
            <div
              key={d.toISOString()}
              className={clsx(
                'b-header-date-cell',
                isSameDay(d, new Date()) && 'bg-blue-50 font-bold',
                isNonWorkingDay(d) && 'b-nonworking-day',
              )}
              style={{ width: `${dayColumnWidth}px`, flexShrink: 0 }}
            >
              <span>{format(d, 'EEE, MMM d')}</span>
              {nwLabel && <span className="b-nonworking-label">{nwLabel}</span>}
            </div>
          )
        })}
      </div>
      {/* Row 2: Sub-hour labels */}
      <div className="b-header-hour-row">
        {days.map(d => {
          const subHours = [0, 6, 12, 18]
          return subHours.map(h => (
            <div
              key={`${d.toISOString()}-${h}`}
              className={clsx('b-header-hour-cell', h === 0 && 'b-major')}
              style={{ width: `${dayColumnWidth / subHours.length}px`, flexShrink: 0 }}
            >
              {format(addHours(startOfDay(d), h), 'ha')}
            </div>
          ))
        })}
      </div>
    </div>
  )

  const renderMonthTimeAxis = () => (
    <div style={{ minWidth: `${totalWidth}px` }}>
      {/* Row 1: Day numbers */}
      <div className="b-header-date-row">
        {days.map(d => (
          <div
            key={d.toISOString()}
            className={clsx(
              'b-header-date-cell',
              isSameDay(d, new Date()) && 'bg-blue-50 font-bold',
              (d.getDay() === 0 || d.getDay() === 6) && 'text-gray-400',
            )}
            style={{ width: `${dayColumnWidth}px`, flexShrink: 0 }}
          >
            {format(d, 'd')}
          </div>
        ))}
      </div>
      {/* Row 2: Day-of-week abbreviation */}
      <div className="b-header-hour-row">
        {days.map(d => (
          <div
            key={`dow-${d.toISOString()}`}
            className={clsx(
              'b-header-hour-cell',
              (d.getDay() === 0 || d.getDay() === 6) && 'text-gray-400',
              d.getDay() === 1 && 'b-major',
            )}
            style={{ width: `${dayColumnWidth}px`, flexShrink: 0 }}
          >
            {format(d, 'EEE')}
          </div>
        ))}
      </div>
    </div>
  )

  // hours array for TechnicianRow (day view)
  const hours = useMemo(() => {
    const h = []
    for (let i = dayStartHour; i < dayEndHour; i++) h.push(i)
    return h
  }, [])

  return (
    <div ref={scrollRef} className="timeline-grid flex-1 overflow-auto">
      {/* ── Header ── */}
      <div className="b-header" style={{ minWidth: `${220 + totalWidth}px` }}>
        {/* Resource column header — two rows: title+icons, then search */}
        <div className="b-header-resource-col">
          {/* Row 1: Technicians label + filter/sort icons */}
          <div className="flex items-center gap-1 px-3">
            <span className="font-semibold text-gray-800 text-[13px] flex-1">Technicians</span>

            {/* Filter button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setShowTechFilter(!showTechFilter); setShowSortMenu(false) }}
                className={clsx(
                  'p-1 rounded transition-colors flex-shrink-0',
                  activeSkillCount > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                )}
                title="Filter technicians"
              >
                <SlidersHorizontal size={13} />
              </button>
              {showTechFilter && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[180px] animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Filter by Skill
                  </div>
                  {allSkills.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkillFilter(skill)}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors text-left',
                        (filters.skills || []).includes(skill)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <div className={clsx(
                        'w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0',
                        (filters.skills || []).includes(skill)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300',
                      )}>
                        {(filters.skills || []).includes(skill) && (
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      {skill}
                    </button>
                  ))}
                  {activeSkillCount > 0 && (
                    <>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => setFilter('skills', [])}
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
                onClick={() => { setShowSortMenu(!showSortMenu); setShowTechFilter(false) }}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Sort technicians"
              >
                <ArrowUpDown size={13} />
              </button>
              {showSortMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 min-w-[140px] animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Sort by
                  </div>
                  {[
                    { key: 'name', label: 'Name' },
                    { key: 'skills', label: 'Skills count' },
                    { key: 'shift', label: 'Shift start' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setTechSortBy(opt.key); setShowSortMenu(false) }}
                      className={clsx(
                        'w-full px-3 py-1.5 text-[12px] text-left transition-colors',
                        techSortBy === opt.key
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
          </div>

          {/* Row 2: Search input */}
          <div className="px-3">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                placeholder="Search technicians..."
                className="w-full h-[26px] bg-gray-50 rounded-md pl-7 pr-2 text-[12px] text-gray-700 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 transition-all border border-gray-200 focus:border-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Time axis — view-mode-aware */}
        <div className="b-header-timeaxis">
          {viewMode === 'day' && renderDayTimeAxis()}
          {viewMode === 'week' && renderWeekTimeAxis()}
          {viewMode === 'month' && renderMonthTimeAxis()}
        </div>
      </div>

      {/* ── Technician Rows ── */}
      <div className="relative" style={{ minWidth: `${220 + totalWidth}px` }}>
        {filteredTechnicians.map(tech => (
          <TechnicianRow
            key={tech.recordId}
            technician={tech}
            hourWidth={hourWidth}
            hours={hours}
            dayStartHour={dayStartHour}
            dayDate={currentDate}
            draggedWO={null}
            viewMode={viewMode}
            days={days}
          />
        ))}

        {/* Now line (day view) */}
        {showNowLineDay && (
          <div
            className="now-line"
            style={{ left: `${220 + nowLeftDay}px` }}
          />
        )}
        {/* Now line (week view) */}
        {showNowLineWeek && (
          <div
            className="now-line"
            style={{ left: `${220 + nowLeftWeek}px` }}
          />
        )}
      </div>

      {/* Empty state */}
      {filteredTechnicians.length === 0 && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <p className="text-sm">
            {technicians.length === 0
              ? 'No technicians loaded. Check your configuration.'
              : 'No technicians match your filters.'}
          </p>
        </div>
      )}
    </div>
  )
}
