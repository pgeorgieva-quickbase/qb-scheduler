import { create } from 'zustand'
import { startOfDay, addDays, addMonths, startOfWeek, endOfWeek } from 'date-fns'
import { fetchTechnicians, fetchWorkOrders, fetchAvailability, batchUpdateWorkOrders } from '../services/quickbaseApi.js'
import { useUndoStore } from './undoStore.js'

const today = startOfDay(new Date())

export const useSchedulerStore = create((set, get) => ({
  // Data
  technicians: [],
  workOrders: [],
  availability: [],
  loading: false,
  error: null,

  // Pending changes: map of recordId → updated fields (local-only until saved)
  pendingChanges: {},
  saving: false,

  // View state
  viewMode: 'day', // 'day' | 'week' | 'month'
  currentDate: today,
  endDate: null,    // null = single date mode; Date = range mode
  selectedWorkOrder: null,
  popoverPosition: null,

  // Filters
  filters: {
    status: null,
    priority: null,
    skills: [],
    region: null,
    search: '',
  },

  // Multi-select (unassigned panel)
  selectedUnassignedIds: [],

  // Toast notifications
  toasts: [],

  // Persistent notifications (bell icon)
  notifications: [],
  get unreadNotificationCount() {
    return get().notifications.filter(n => !n.read).length
  },

  // Derived: unassigned work orders
  get unassignedOrders() {
    return get().workOrders.filter(wo => !wo.assignedTechnicianId)
  },

  // Actions
  async loadData() {
    set({ loading: true, error: null })
    try {
      const [technicians, workOrders, availability] = await Promise.all([
        fetchTechnicians(),
        fetchWorkOrders(),
        fetchAvailability(),
      ])
      set({ technicians, workOrders, availability, loading: false, pendingChanges: {} })

      // Generate overdue alerts
      const now = new Date()
      const overdueUnassigned = workOrders.filter(wo =>
        !wo.assignedTechnicianId &&
        wo.dueDate &&
        new Date(wo.dueDate) < now &&
        wo.status !== 'Complete' && wo.status !== 'Cancelled'
      )
      if (overdueUnassigned.length > 0) {
        get().addNotification(
          `${overdueUnassigned.length} unassigned work order${overdueUnassigned.length > 1 ? 's are' : ' is'} past due`,
          'warning'
        )
      }

      // Check for past-due scheduled orders
      const pastDueScheduled = workOrders.filter(wo =>
        wo.assignedTechnicianId &&
        wo.scheduledEnd &&
        new Date(wo.scheduledEnd) < now &&
        wo.status !== 'Complete' && wo.status !== 'Cancelled'
      )
      if (pastDueScheduled.length > 0) {
        get().addNotification(
          `${pastDueScheduled.length} scheduled work order${pastDueScheduled.length > 1 ? 's' : ''} not completed by deadline`,
          'error'
        )
      }
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  setViewMode(mode) {
    set({ viewMode: mode })
  },

  navigateDate(direction) {
    const { currentDate, viewMode } = get()
    if (direction === 'today') {
      set({ currentDate: today })
      return
    }
    if (viewMode === 'month') {
      const newDate = direction === 'next'
        ? addMonths(currentDate, 1)
        : addMonths(currentDate, -1)
      set({ currentDate: startOfDay(newDate) })
    } else {
      const days = viewMode === 'week' ? 7 : 1
      const newDate = direction === 'next'
        ? addDays(currentDate, days)
        : addDays(currentDate, -days)
      set({ currentDate: startOfDay(newDate) })
    }
  },

  setCurrentDate(date) {
    set({ currentDate: startOfDay(date), endDate: null })
  },

  setDateRange(start, end) {
    const s = startOfDay(start)
    const e = startOfDay(end)
    if (s.getTime() === e.getTime()) {
      set({ currentDate: s, endDate: null, viewMode: 'day' })
    } else {
      set({ currentDate: s, endDate: e })
    }
  },

  setFilter(key, value) {
    set(state => ({
      filters: { ...state.filters, [key]: value },
    }))
  },

  selectWorkOrder(wo, position) {
    set({ selectedWorkOrder: wo, popoverPosition: position })
  },

  clearSelection() {
    set({ selectedWorkOrder: null, popoverPosition: null })
  },

  // Internal: apply fields to a WO without undo tracking
  _applyFields(recordId, updates, clearSelection = false) {
    set(state => ({
      workOrders: state.workOrders.map(w =>
        w.recordId === recordId ? { ...w, ...updates } : w
      ),
      pendingChanges: {
        ...state.pendingChanges,
        [recordId]: { ...state.pendingChanges[recordId], ...updates },
      },
      ...(clearSelection ? { selectedWorkOrder: null } : {}),
    }))
  },

  assignWorkOrder(recordId, technicianId, start, end) {
    const wo = get().workOrders.find(w => w.recordId === recordId)
    if (!wo) return

    const before = {
      assignedTechnicianId: wo.assignedTechnicianId,
      scheduledStart: wo.scheduledStart,
      scheduledEnd: wo.scheduledEnd,
      status: wo.status,
    }
    const after = {
      assignedTechnicianId: technicianId,
      scheduledStart: start,
      scheduledEnd: end,
      status: wo.status === 'New' ? 'Scheduled' : wo.status,
    }

    get()._applyFields(recordId, after)
    useUndoStore.getState().pushAction({ type: 'assign', recordId, before, after })
  },

  unassignWorkOrder(recordId) {
    const wo = get().workOrders.find(w => w.recordId === recordId)
    if (!wo) return

    const before = {
      assignedTechnicianId: wo.assignedTechnicianId,
      scheduledStart: wo.scheduledStart,
      scheduledEnd: wo.scheduledEnd,
      status: wo.status,
    }
    const after = {
      assignedTechnicianId: null,
      scheduledStart: null,
      scheduledEnd: null,
      status: 'New',
    }

    get()._applyFields(recordId, after, true)
    useUndoStore.getState().pushAction({ type: 'unassign', recordId, before, after })
  },

  pinWorkOrder(recordId) {
    const wo = get().workOrders.find(w => w.recordId === recordId)
    if (!wo) return

    const newPinned = !wo.pinned
    const before = { pinned: wo.pinned }
    const after = { pinned: newPinned }

    get()._applyFields(recordId, after)
    useUndoStore.getState().pushAction({ type: 'pin', recordId, before, after })
  },

  // Execute undo: revert to before-state
  executeUndo() {
    const action = useUndoStore.getState().undo()
    if (!action) return
    get()._applyFields(action.recordId, action.before)
    get().addToast('Undone', 'info')
  },

  // Execute redo: reapply after-state
  executeRedo() {
    const action = useUndoStore.getState().redo()
    if (!action) return
    get()._applyFields(action.recordId, action.after)
    get().addToast('Redone', 'info')
  },

  bulkPinWorkOrders(recordIds, pinned) {
    set(state => {
      const newWOs = state.workOrders.map(w =>
        recordIds.includes(w.recordId) ? { ...w, pinned } : w
      )
      const newPending = { ...state.pendingChanges }
      recordIds.forEach(id => {
        newPending[id] = { ...newPending[id], pinned }
      })
      return { workOrders: newWOs, pendingChanges: newPending }
    })
  },

  toggleSelectUnassigned(recordId) {
    set(state => {
      const ids = [...state.selectedUnassignedIds]
      const idx = ids.indexOf(recordId)
      if (idx >= 0) ids.splice(idx, 1)
      else ids.push(recordId)
      return { selectedUnassignedIds: ids }
    })
  },

  clearSelectedUnassigned() {
    set({ selectedUnassignedIds: [] })
  },

  selectAllUnassigned() {
    const ids = get().workOrders
      .filter(wo => !wo.assignedTechnicianId && wo.status !== 'Complete' && wo.status !== 'Cancelled')
      .map(wo => wo.recordId)
    set({ selectedUnassignedIds: ids })
  },

  bulkAssignWorkOrders(recordIds, technicianId, startTime) {
    const { workOrders } = get()
    let cursor = typeof startTime === 'string' ? new Date(startTime) : new Date(startTime)

    for (const rid of recordIds) {
      const wo = workOrders.find(w => w.recordId === rid)
      if (!wo) continue
      const duration = (wo.estDuration || 1) * 60 * 60 * 1000 // hours to ms
      const start = new Date(cursor)
      const end = new Date(cursor.getTime() + duration)
      get().assignWorkOrder(rid, technicianId, start.toISOString(), end.toISOString())
      cursor = end
    }
    set({ selectedUnassignedIds: [] })
  },

  async saveChanges() {
    const { pendingChanges, workOrders } = get()
    const entries = Object.entries(pendingChanges)
    if (entries.length === 0) return

    set({ saving: true })
    try {
      // Include _version for conflict detection
      const updates = entries.map(([recordId, fields]) => {
        const wo = workOrders.find(w => w.recordId === parseInt(recordId) || w.recordId === recordId)
        return { recordId: parseInt(recordId) || recordId, _version: wo?._version, ...fields }
      })
      const result = await batchUpdateWorkOrders(updates)

      // Update local versions from server response
      if (result.results) {
        set(state => ({
          workOrders: state.workOrders.map(w => {
            const res = result.results.find(r => r.recordId === w.recordId && r.success && r._version)
            return res ? { ...w, _version: res._version } : w
          }),
        }))
      }

      set({ pendingChanges: {}, saving: false })
      get().addToast(`${entries.length} change${entries.length > 1 ? 's' : ''} saved`, 'success')
    } catch (err) {
      set({ saving: false })
      if (err.response?.status === 409 || err.status === 409) {
        get().addToast('Conflict: another user modified these records. Reloading data...', 'error')
        get().addNotification('Save conflict detected — data was reloaded to resolve', 'warning')
        // Reload to get fresh data
        get().loadData()
      } else {
        get().addToast('Failed to save changes', 'error')
      }
    }
  },

  discardChanges() {
    // Reload original data to revert local-only changes
    get().loadData()
    set({ pendingChanges: {} })
  },

  applyAIScheduleChanges(changes) {
    set(state => {
      const updatedWOs = [...state.workOrders]
      const newPending = { ...state.pendingChanges }
      for (const change of changes) {
        if (!change.accepted || change.changeType === 'unassignable') continue
        const rid = change.workOrder.recordId
        const idx = updatedWOs.findIndex(w => w.recordId === rid)
        if (idx > -1) {
          const updates = {
            assignedTechnicianId: change.technician.recordId,
            scheduledStart: change.proposedStart,
            scheduledEnd: change.proposedEnd,
            status: 'Scheduled',
            aiScheduled: true,
          }
          updatedWOs[idx] = { ...updatedWOs[idx], ...updates }
          newPending[rid] = { ...newPending[rid], ...updates }
        }
      }
      return { workOrders: updatedWOs, pendingChanges: newPending }
    })
  },

  addToast(message, type = 'info', duration = 4000) {
    const id = Date.now()
    set(state => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }))
    }, duration)
  },

  removeToast(id) {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }))
  },

  addNotification(message, severity = 'info') {
    const id = Date.now() + Math.random()
    set(state => ({
      notifications: [{ id, message, severity, timestamp: new Date().toISOString(), read: false }, ...state.notifications].slice(0, 50),
    }))
  },

  dismissNotification(id) {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }))
  },

  markNotificationsRead() {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
    }))
  },
}))
