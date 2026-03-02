import { create } from 'zustand'
import { startOfDay, addDays, addMonths, startOfWeek, startOfMonth, endOfWeek, format, parseISO } from 'date-fns'
import {
  fetchAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  bulkCreateAvailability,
} from '../services/quickbaseApi.js'

const today = startOfDay(new Date())

export const useAvailabilityStore = create((set, get) => ({
  // Data
  events: [],
  loading: false,
  error: null,

  // View state
  viewMode: 'week', // 'week' | 'month'
  currentDate: startOfWeek(today, { weekStartsOn: 1 }),
  selectedTechId: null, // null = all technicians

  // Editor modal state
  editorOpen: false,
  editingEvent: null, // null = creating new, object = editing existing

  // Recurring schedule editor
  recurringEditorOpen: false,
  recurringTechId: null,

  // Actions
  async loadEvents() {
    set({ loading: true, error: null })
    try {
      const events = await fetchAvailability()
      set({ events, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  setCurrentDate(date) {
    set({ currentDate: startOfDay(date) })
  },

  setViewMode(mode) {
    set({ viewMode: mode })
  },

  navigateWeek(direction) {
    set(state => ({
      currentDate: addDays(state.currentDate, direction === 'next' ? 7 : -7),
    }))
  },

  navigateMonth(direction) {
    set(state => ({
      currentDate: addMonths(state.currentDate, direction === 'next' ? 1 : -1),
    }))
  },

  setSelectedTech(techId) {
    set({ selectedTechId: techId })
  },

  // Editor
  openEditor(event = null) {
    set({ editorOpen: true, editingEvent: event })
  },

  closeEditor() {
    set({ editorOpen: false, editingEvent: null })
  },

  async saveEvent(eventData) {
    set({ loading: true })
    try {
      if (eventData.recordId) {
        await updateAvailability(eventData.recordId, eventData)
      } else {
        await createAvailability(eventData)
      }
      await get().loadEvents()
      set({ editorOpen: false, editingEvent: null, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  async removeEvent(recordId) {
    set({ loading: true })
    try {
      await deleteAvailability(recordId)
      set(state => ({
        events: state.events.filter(e => e.recordId !== recordId),
        loading: false,
        editorOpen: false,
        editingEvent: null,
      }))
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Bulk: copy a day's events to another day for a tech
  async copyDay(techId, fromDate, toDate) {
    const fromStr = format(fromDate, 'yyyy-MM-dd')
    const toStr = format(toDate, 'yyyy-MM-dd')
    const dayEvents = get().events.filter(e => {
      if (e.technicianId !== techId) return false
      return e.start.startsWith(fromStr)
    })

    if (dayEvents.length === 0) return

    const newEvents = dayEvents.map(e => ({
      technicianId: techId,
      eventType: e.eventType,
      start: e.start.replace(fromStr, toStr),
      end: e.end.replace(fromStr, toStr),
      allDay: e.allDay,
      recurring: 'None',
      notes: e.notes,
      availabilityType: e.availabilityType || 'Available',
    }))

    set({ loading: true })
    try {
      await bulkCreateAvailability(newEvents)
      await get().loadEvents()
      set({ loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Mark unavailable for a range
  async markUnavailable(techId, fromDate, toDate, reason = 'Unavailable') {
    const events = []
    let d = startOfDay(fromDate)
    const end = startOfDay(toDate)
    while (d <= end) {
      events.push({
        technicianId: techId,
        eventType: 'Unavailable',
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).toISOString(),
        allDay: true,
        recurring: 'None',
        notes: reason,
        availabilityType: 'Vacation',
      })
      d = addDays(d, 1)
    }

    set({ loading: true })
    try {
      await bulkCreateAvailability(events)
      await get().loadEvents()
      set({ loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // Recurring schedule: generate blocks from template
  openRecurringEditor(techId) {
    set({ recurringEditorOpen: true, recurringTechId: techId })
  },

  closeRecurringEditor() {
    set({ recurringEditorOpen: false, recurringTechId: null })
  },

  // Drag-to-fill: copy a source event to multiple target cells
  async bulkFillEvents(sourceEvent, targetCells) {
    if (!targetCells.length) return

    // Extract time-of-day from source event
    const srcStart = parseISO(sourceEvent.start)
    const srcEnd = parseISO(sourceEvent.end)
    const startH = srcStart.getHours(), startM = srcStart.getMinutes()
    const endH = srcEnd.getHours(), endM = srcEnd.getMinutes()

    const newEvents = targetCells.map(({ technicianId, date }) => {
      const d = startOfDay(date)
      return {
        technicianId,
        eventType: sourceEvent.eventType,
        availabilityType: sourceEvent.availabilityType || 'Available',
        start: sourceEvent.allDay
          ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0).toISOString()
          : new Date(d.getFullYear(), d.getMonth(), d.getDate(), startH, startM).toISOString(),
        end: sourceEvent.allDay
          ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59).toISOString()
          : new Date(d.getFullYear(), d.getMonth(), d.getDate(), endH, endM).toISOString(),
        allDay: sourceEvent.allDay,
        recurring: 'None',
        notes: sourceEvent.notes || '',
      }
    })

    set({ loading: true })
    try {
      await bulkCreateAvailability(newEvents)
      await get().loadEvents()
      set({ loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  async applyRecurringSchedule(techId, template, weeks = 4) {
    // template: { Mon: { enabled, start, end }, Tue: {...}, ... }
    const events = []
    const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
    const start = startOfWeek(get().currentDate, { weekStartsOn: 1 })

    for (let w = 0; w < weeks; w++) {
      for (const [day, config] of Object.entries(template)) {
        if (!config.enabled) continue
        const dayNum = dayMap[day]
        // Calculate offset from Monday
        const offset = dayNum === 0 ? 6 : dayNum - 1
        const date = addDays(start, w * 7 + offset)
        const dateStr = format(date, 'yyyy-MM-dd')

        const [startH, startM] = config.start.split(':').map(Number)
        const [endH, endM] = config.end.split(':').map(Number)

        events.push({
          technicianId: techId,
          eventType: 'Available',
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM).toISOString(),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM).toISOString(),
          allDay: false,
          recurring: 'Weekly',
          notes: 'Recurring schedule',
          availabilityType: 'Available',
        })
      }
    }

    set({ loading: true })
    try {
      await bulkCreateAvailability(events)
      await get().loadEvents()
      set({ loading: false, recurringEditorOpen: false, recurringTechId: null })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))
