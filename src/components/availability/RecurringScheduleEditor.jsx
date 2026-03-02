import React, { useState } from 'react'
import { X, Repeat } from 'lucide-react'
import { useAvailabilityStore } from '../../stores/availabilityStore'
import { useSchedulerStore } from '../../stores/schedulerStore'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DEFAULT_TEMPLATE = Object.fromEntries(
  DAYS.map(d => [d, {
    enabled: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(d),
    start: '08:00',
    end: '17:00',
  }])
)

export default function RecurringScheduleEditor() {
  const { recurringTechId, closeRecurringEditor, applyRecurringSchedule, loading } = useAvailabilityStore()
  const technicians = useSchedulerStore(s => s.technicians)
  const tech = technicians.find(t => t.recordId === recurringTechId)

  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [weeks, setWeeks] = useState(4)

  const updateDay = (day, key, value) => {
    setTemplate(t => ({
      ...t,
      [day]: { ...t[day], [key]: value },
    }))
  }

  const handleApply = () => {
    applyRecurringSchedule(recurringTechId, template, weeks)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-blue-600" />
            <h2 className="text-[14px] font-semibold text-gray-800">
              Recurring Schedule{tech ? ` — ${tech.fullName}` : ''}
            </h2>
          </div>
          <button onClick={closeRecurringEditor} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Template */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px] text-gray-500">
            Define a weekly template. This will generate availability blocks for the next {weeks} weeks.
          </p>

          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3">
                <label className="flex items-center gap-2 w-[80px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template[day].enabled}
                    onChange={(e) => updateDay(day, 'enabled', e.target.checked)}
                    className="rounded border-gray-300 accent-blue-600"
                  />
                  <span className="text-[13px] font-medium text-gray-700">{day}</span>
                </label>
                {template[day].enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={template[day].start}
                      onChange={(e) => updateDay(day, 'start', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-200"
                    />
                    <span className="text-[12px] text-gray-400">to</span>
                    <input
                      type="time"
                      value={template[day].end}
                      onChange={(e) => updateDay(day, 'end', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                ) : (
                  <span className="text-[12px] text-gray-400 italic">Off</span>
                )}
              </div>
            ))}
          </div>

          {/* Weeks selector */}
          <div className="flex items-center gap-2 pt-2">
            <label className="text-[12px] font-medium text-gray-600">Generate for</label>
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-[12px] text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-200"
            >
              {[1, 2, 4, 8, 12].map(w => (
                <option key={w} value={w}>{w} week{w > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-200">
          <button
            onClick={closeRecurringEditor}
            className="px-3 py-2 rounded-md text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Apply Schedule
          </button>
        </div>
      </div>
    </div>
  )
}
