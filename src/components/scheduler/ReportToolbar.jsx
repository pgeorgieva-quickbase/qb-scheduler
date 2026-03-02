import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Home, FileText, BarChart3, Pencil,
  Settings, Plus, Calendar, Trash2, MoreHorizontal, Undo2, Redo2, ArrowLeft, ArrowRight, SlidersHorizontal,
  Save, Loader2,
} from 'lucide-react'
import { format, startOfDay, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth } from 'date-fns'
import AISparkleIcon from '../shared/AISparkleIcon'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { useAIScheduleStore } from '../../stores/aiScheduleStore'
import { useWizardStore } from '../../stores/wizardStore'
import { useUndoStore } from '../../stores/undoStore'
import clsx from 'clsx'

// Preset period options
const PERIOD_PRESETS = [
  { label: 'Today', getValue: () => { const t = startOfDay(new Date()); return { start: t, end: t } } },
  { label: 'This Week', getValue: () => { const t = startOfDay(new Date()); const ws = startOfWeek(t, { weekStartsOn: 1 }); return { start: ws, end: addDays(ws, 6) } } },
  { label: 'Next 2 Weeks', getValue: () => { const t = startOfDay(new Date()); const ws = startOfWeek(t, { weekStartsOn: 1 }); return { start: ws, end: addDays(ws, 13) } } },
  { label: 'This Month', getValue: () => { const t = startOfDay(new Date()); return { start: startOfMonth(t), end: endOfMonth(t) } } },
  { label: 'Next 30 Days', getValue: () => { const t = startOfDay(new Date()); return { start: t, end: addDays(t, 29) } } },
]

// Date range picker with period presets and two-click range selection
function DatePickerDropdown({ currentDate, endDate, onSelectRange, onClose }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(currentDate))
  const [rangeStart, setRangeStart] = useState(null)
  const [hoveredDate, setHoveredDate] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const weeks = []
  let day = calStart
  while (day <= calEnd) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day))
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  const today = startOfDay(new Date())

  const handleDayClick = (d) => {
    if (!rangeStart) {
      setRangeStart(d)
    } else {
      const start = d < rangeStart ? d : rangeStart
      const end = d < rangeStart ? rangeStart : d
      onSelectRange(start, end)
      onClose()
    }
  }

  const isInRange = (d) => {
    if (rangeStart && hoveredDate) {
      const s = hoveredDate < rangeStart ? hoveredDate : rangeStart
      const e = hoveredDate < rangeStart ? rangeStart : hoveredDate
      return d >= s && d <= e
    }
    if (currentDate && endDate) {
      return d >= currentDate && d <= endDate
    }
    return false
  }

  const isRangeEnd = (d) => {
    if (rangeStart) return isSameDay(d, rangeStart)
    return (currentDate && isSameDay(d, currentDate)) || (endDate && isSameDay(d, endDate))
  }

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in flex" style={{ width: '400px' }}>
      {/* Presets sidebar */}
      <div className="w-[130px] border-r border-gray-100 py-2 flex flex-col">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">Quick Select</span>
        {PERIOD_PRESETS.map(preset => (
          <button
            key={preset.label}
            onClick={() => { const { start, end } = preset.getValue(); onSelectRange(start, end); onClose() }}
            className="text-left px-3 py-1.5 text-[12px] text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="flex-1 p-3">
        {rangeStart && (
          <div className="text-[10px] text-blue-600 font-medium mb-1.5">
            Click another date to complete the range
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setViewMonth(addMonths(viewMonth, -1))} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-[13px] font-semibold text-gray-800">{format(viewMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((d, di) => {
              const isCurrentMonth = isSameMonth(d, viewMonth)
              const inRange = isInRange(d)
              const isEnd = isRangeEnd(d)
              const isToday = isSameDay(d, today)
              return (
                <button
                  key={di}
                  onClick={() => handleDayClick(d)}
                  onMouseEnter={() => setHoveredDate(d)}
                  className={clsx(
                    'w-8 h-7 flex items-center justify-center text-[12px] transition-colors mx-auto',
                    !isCurrentMonth && 'text-gray-300',
                    isCurrentMonth && !isEnd && !inRange && 'text-gray-700 hover:bg-gray-100 rounded-full',
                    inRange && !isEnd && 'bg-blue-50 text-blue-700',
                    isEnd && 'bg-blue-600 text-white font-semibold rounded-full',
                    isToday && !isEnd && !inRange && 'ring-1 ring-blue-400 font-semibold rounded-full',
                  )}
                >
                  {format(d, 'd')}
                </button>
              )
            })}
          </div>
        ))}
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
          <button onClick={() => { onSelectRange(today, today); onClose() }} className="flex-1 py-1.5 rounded text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition-colors">Today</button>
        </div>
      </div>
    </div>
  )
}

export default function ReportToolbar() {
  const { viewMode, currentDate, endDate, setViewMode, setCurrentDate, setDateRange, navigateDate, pendingChanges, saving, saveChanges, discardChanges } = useSchedulerStore()
  const openAI = useAIScheduleStore(s => s.open)
  const { reportTitle, openWizard } = useWizardStore()
  const canUndo = useUndoStore(s => s.past.length > 0)
  const canRedo = useUndoStore(s => s.future.length > 0)
  const { executeUndo, executeRedo } = useSchedulerStore()
  const changeCount = Object.keys(pendingChanges).length
  const hasChanges = changeCount > 0
  const [showDatePicker, setShowDatePicker] = useState(false)

  const displayTitle = reportTitle || 'Scheduler Report'

  const dateLabel = endDate
    ? `${format(currentDate, 'MMM d')} – ${format(endDate, 'MMM d, yyyy')}`
    : viewMode === 'day'
      ? format(currentDate, 'MMM d, yyyy')
      : viewMode === 'week'
        ? `${format(currentDate, 'MMM d')} – ${format(addDays(currentDate, 6), 'MMM d, yyyy')}`
        : format(currentDate, 'MMMM yyyy')

  return (
    <div className="flex-shrink-0">
      {/* Top bar: Quickbase-style breadcrumb + actions */}
      <div className="bg-white border-b border-gray-200 flex items-center justify-between px-3 flex-shrink-0" style={{ height: '54px' }}>
        {/* Left: breadcrumb navigation */}
        <div className="flex items-center min-w-0">
          {/* Back arrow */}
          <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mr-1">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>

          {/* Home icon */}
          <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Home size={18} strokeWidth={1.5} />
          </button>

          <ChevronRight size={14} className="text-gray-300 mx-1.5 flex-shrink-0" />

          {/* Table icon block with title + sub-links */}
          <button className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[14px] font-semibold text-gray-800 leading-tight">Work Orders</span>
              <div className="flex items-center gap-0.5">
                <span className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer">Reports</span>
                <span className="text-[11px] text-gray-300 mx-0.5">▸</span>
                <span className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer">Settings</span>
              </div>
            </div>
          </button>

          <ChevronRight size={14} className="text-gray-300 mx-1.5 flex-shrink-0" />

          {/* Report title */}
          <div className="flex items-center gap-1.5 px-2 py-1 min-w-0">
            <span className="text-[14px] font-medium text-gray-800 truncate">{displayTitle}</span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Primary action: New button (blue pill) */}
          <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={15} strokeWidth={2.5} />
            New Work Order
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 mx-0.5" />

          {/* Settings */}
          <button onClick={openWizard} className="p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Scheduler Settings">
            <SlidersHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Second row: Tab toggle + Date nav + View switcher (left) + AI Schedule (right) */}
      <div className="h-9 bg-white border-b border-gray-200 flex items-center px-3 gap-2 flex-shrink-0">
        {/* Left group: prev/next + date picker + view switcher */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigateDate('prev')} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={14} />
          </button>

          <div className="relative">
            <button onClick={() => setShowDatePicker(!showDatePicker)} className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
              <Calendar size={13} className="text-gray-500" />
              <span className="text-[12px] font-semibold text-gray-800">{dateLabel}</span>
            </button>
            {showDatePicker && (
              <DatePickerDropdown
                currentDate={currentDate}
                endDate={endDate}
                onSelectRange={(start, end) => setDateRange(start, end)}
                onClose={() => setShowDatePicker(false)}
              />
            )}
          </div>

          <button onClick={() => navigateDate('next')} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronRight size={14} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* View mode: Day / Week / Month */}
          <div className="flex items-center bg-gray-100 rounded p-0.5">
            {['day', 'week', 'month'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'px-3 py-1 rounded text-[11px] font-medium transition-all capitalize',
                  viewMode === mode
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Right: Save/Cancel + AI Schedule */}
        <div className="flex items-center gap-1.5">
          {/* Cancel — only visible when there are pending changes */}
          {hasChanges && !saving && (
            <button
              onClick={discardChanges}
              className="px-3 py-1 rounded text-[12px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Save button */}
          <div className="relative">
            <button
              onClick={saveChanges}
              disabled={!hasChanges || saving}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-semibold transition-all',
                hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              {saving
                ? <Loader2 size={13} className="animate-spin" />
                : <Save size={13} />
              }
              {saving ? 'Saving...' : hasChanges ? `Save (${changeCount})` : 'Save'}
            </button>
            {hasChanges && !saving && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white" />
            )}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          {/* Undo / Redo */}
          <button
            onClick={executeUndo}
            disabled={!canUndo}
            className={clsx(
              'p-1 rounded transition-colors',
              canUndo
                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed',
            )}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={executeRedo}
            disabled={!canRedo}
            className={clsx(
              'p-1 rounded transition-colors',
              canRedo
                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed',
            )}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          {/* AI Scheduler */}
          <button onClick={openAI} className="ai-btn flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-semibold">
            <AISparkleIcon size={14} />
            AI Scheduler
          </button>
        </div>
      </div>
    </div>
  )
}
