import React, { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Plus, RefreshCw } from 'lucide-react'
import { format, addDays, startOfWeek } from 'date-fns'
import { useAvailabilityStore } from '../../stores/availabilityStore'
import { useSchedulerStore } from '../../stores/schedulerStore'
import AvailabilityTimeline from './AvailabilityTimeline'
import AvailabilityEditor from './AvailabilityEditor'
import RecurringScheduleEditor from './RecurringScheduleEditor'
import clsx from 'clsx'

export default function AvailabilityReport() {
  const {
    currentDate, loading, navigateWeek, setCurrentDate,
    selectedTechId, setSelectedTech, openEditor, loadEvents,
    editorOpen, recurringEditorOpen,
  } = useAvailabilityStore()
  const technicians = useSchedulerStore(s => s.technicians)

  useEffect(() => {
    loadEvents()
  }, [])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)
  const dateLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="h-9 bg-white border-b border-gray-200 flex items-center px-3 gap-2 flex-shrink-0">
        {/* Date nav */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigateWeek('prev')} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Calendar size={13} className="text-gray-500" />
            <span className="text-[12px] font-semibold text-gray-800">{dateLabel}</span>
          </div>
          <button onClick={() => navigateWeek('next')} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 rounded text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Today
          </button>
        </div>

        <div className="w-px h-5 bg-gray-200 mx-1" />

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

        {/* Actions */}
        <button
          onClick={loadEvents}
          disabled={loading}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={() => openEditor(null)}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} />
          Add Event
        </button>
      </div>

      {/* Timeline */}
      <AvailabilityTimeline />

      {/* Modals */}
      {editorOpen && <AvailabilityEditor />}
      {recurringEditorOpen && <RecurringScheduleEditor />}
    </div>
  )
}
