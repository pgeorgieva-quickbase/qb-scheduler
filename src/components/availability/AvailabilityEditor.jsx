import React, { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useAvailabilityStore } from '../../stores/availabilityStore'
import { useSchedulerStore } from '../../stores/schedulerStore'

const AVAILABILITY_TYPES = [
  'Available', 'Unavailable', 'Vacation', 'Sick', 'Training', 'Personal', 'On-Call',
]

export default function AvailabilityEditor() {
  const { editingEvent, closeEditor, saveEvent, removeEvent, loading } = useAvailabilityStore()
  const technicians = useSchedulerStore(s => s.technicians)

  const isNew = !editingEvent?.recordId
  const [form, setForm] = useState({
    technicianId: editingEvent?.technicianId || technicians[0]?.recordId || '',
    date: editingEvent?.start ? format(parseISO(editingEvent.start), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: editingEvent?.start && !editingEvent?.allDay ? format(parseISO(editingEvent.start), 'HH:mm') : '08:00',
    endTime: editingEvent?.end && !editingEvent?.allDay ? format(parseISO(editingEvent.end), 'HH:mm') : '17:00',
    allDay: editingEvent?.allDay || false,
    availabilityType: editingEvent?.availabilityType || editingEvent?.eventType || 'Available',
  })

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSave = () => {
    const [startH, startM] = form.startTime.split(':').map(Number)
    const [endH, endM] = form.endTime.split(':').map(Number)
    const date = new Date(form.date + 'T00:00:00')

    const eventData = {
      ...(editingEvent?.recordId ? { recordId: editingEvent.recordId } : {}),
      technicianId: parseInt(form.technicianId),
      eventType: form.availabilityType === 'Available' ? 'Available' : 'Unavailable',
      availabilityType: form.availabilityType,
      start: form.allDay
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0).toISOString()
        : new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM).toISOString(),
      end: form.allDay
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59).toISOString()
        : new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM).toISOString(),
      allDay: form.allDay,
      recurring: 'None',
    }

    saveEvent(eventData)
  }

  const handleDelete = () => {
    if (editingEvent?.recordId) {
      removeEvent(editingEvent.recordId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h2 className="text-[14px] font-semibold text-gray-800">
            {isNew ? 'Add Availability Event' : 'Edit Availability Event'}
          </h2>
          <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">
          {/* Technician */}
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Technician</label>
            <select
              value={form.technicianId}
              onChange={(e) => update('technicianId', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300"
            >
              {technicians.filter(t => t.active).map(t => (
                <option key={t.recordId} value={t.recordId}>{t.fullName}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Type</label>
            <select
              value={form.availabilityType}
              onChange={(e) => update('availabilityType', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300"
            >
              {AVAILABILITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300"
            />
          </div>

          {/* All day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update('allDay', e.target.checked)}
              className="rounded border-gray-300 accent-blue-600"
            />
            <span className="text-[13px] text-gray-700">All day</span>
          </label>

          {/* Time range (if not all day) */}
          {!form.allDay && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[12px] font-medium text-gray-600 block mb-1">Start time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] font-medium text-gray-600 block mb-1">End time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-200">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1.5 text-[12px] font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={closeEditor}
              className="px-3 py-2 rounded-md text-[13px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
