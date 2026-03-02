import React, { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ArrowLeft } from 'lucide-react'
import { format, addDays, startOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { useAvailabilityStore } from '../../stores/availabilityStore'
import { useSchedulerStore } from '../../stores/schedulerStore'
import { useNavigationStore } from '../../stores/navigationStore'
import AvailabilityTimeline from './AvailabilityTimeline'
import AvailabilityEditor from './AvailabilityEditor'
import RecurringScheduleEditor from './RecurringScheduleEditor'
import clsx from 'clsx'

export default function AvailabilityPage() {
  const {
    currentDate, viewMode, setViewMode,
    navigateWeek, navigateMonth, setCurrentDate,
    selectedTechId, setSelectedTech, loadEvents,
    editorOpen, recurringEditorOpen,
  } = useAvailabilityStore()
  const technicians = useSchedulerStore(s => s.technicians)
  const navigateTo = useNavigationStore(s => s.navigateTo)

  useEffect(() => {
    loadEvents()
  }, [])

  // Date label varies by view mode
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)
  const dateLabel = viewMode === 'week'
    ? `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
    : format(startOfMonth(currentDate), 'MMMM yyyy')

  const handleNavigate = (dir) => {
    if (viewMode === 'week') navigateWeek(dir)
    else navigateMonth(dir)
  }

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0" style={{ height: '54px' }}>
        {/* Back button */}
        <button
          onClick={() => navigateTo('scheduler')}
          className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded transition-colors mr-3"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
          Back to Scheduler
        </button>

        <div className="w-px h-6 bg-gray-200 mr-3" />

        {/* Title */}
        <h1 className="text-[15px] font-semibold text-gray-800 mr-6">Availability</h1>

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded p-0.5 mr-3">
          <button
            onClick={() => setViewMode('week')}
            className={clsx(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
              viewMode === 'week'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={clsx(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
              viewMode === 'month'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Month
          </button>
        </div>

        {/* Date nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => handleNavigate('prev')} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Calendar size={13} className="text-gray-500" />
            <span className="text-[12px] font-semibold text-gray-800">{dateLabel}</span>
          </div>
          <button onClick={() => handleNavigate('next')} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 rounded text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-2" />

        {/* Tech filter */}
        <select
          value={selectedTechId || ''}
          onChange={(e) => setSelectedTech(e.target.value ? parseInt(e.target.value) : null)}
          className="text-[12px] text-gray-700 border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-200"
        >
          <option value="">All technicians</option>
          {technicians.filter(t => t.active).map(t => (
            <option key={t.recordId} value={t.recordId}>{t.fullName}</option>
          ))}
        </select>

        <div className="flex-1" />
      </div>

      {/* Timeline */}
      <AvailabilityTimeline />

      {/* Modals */}
      {editorOpen && <AvailabilityEditor />}
      {recurringEditorOpen && <RecurringScheduleEditor />}
    </div>
  )
}
