import { create } from 'zustand'
import { addDays, startOfDay } from 'date-fns'
import { buildSolviceRequest, syncSolve, solutionToChanges, calculateStats } from '../services/solviceService.js'
import { batchUpdateWorkOrders } from '../services/quickbaseApi.js'

export const useAIScheduleStore = create((set, get) => ({
  // Modal state
  isOpen: false,
  step: 'config', // 'config' | 'processing' | 'preview'

  // Config
  scope: 'unassigned', // 'unassigned' | 'all'
  dateRange: {
    from: startOfDay(new Date()),
    to: addDays(startOfDay(new Date()), 7),
  },
  optimizationGoal: 'balance', // 'balance' | 'earliest'
  showAdvanced: false,

  // Results
  changes: [],
  stats: null,
  solution: null,
  error: null,

  // Rollback
  snapshot: null,

  // Explainable AI: reasons why WOs couldn't be assigned (persists across modal close)
  unassignableReasons: {}, // { [recordId]: reason }

  // Run history (persisted in localStorage)
  runHistory: [],

  // Actions
  open() {
    set({
      isOpen: true,
      step: 'config',
      changes: [],
      stats: null,
      error: null,
      snapshot: null,
    })
  },

  close() {
    set({ isOpen: false, step: 'config' })
  },

  setScope(scope) {
    set({ scope })
  },

  setDateRange(from, to) {
    set({ dateRange: { from, to } })
  },

  setOptimizationGoal(goal) {
    set({ optimizationGoal: goal })
  },

  toggleAdvanced() {
    set(state => ({ showAdvanced: !state.showAdvanced }))
  },

  toggleChangeAccepted(index) {
    set(state => ({
      changes: state.changes.map((c, i) =>
        i === index ? { ...c, accepted: !c.accepted } : c
      ),
    }))
  },

  acceptAll() {
    set(state => ({
      changes: state.changes.map(c =>
        c.changeType !== 'unassignable' ? { ...c, accepted: true } : c
      ),
    }))
  },

  rejectAll() {
    set(state => ({
      changes: state.changes.map(c => ({ ...c, accepted: false })),
    }))
  },

  async runOptimization(technicians, workOrders, availability, applyToStore) {
    set({ step: 'processing', error: null })

    try {
      const { scope, dateRange } = get()

      // Filter WOs based on scope (always exclude pinned)
      const eligibleWOs = scope === 'unassigned'
        ? workOrders.filter(wo => !wo.assignedTechnicianId && !wo.pinned)
        : workOrders.filter(wo => wo.status !== 'Complete' && wo.status !== 'Cancelled' && !wo.pinned)

      if (eligibleWOs.length === 0) {
        set({ error: 'No work orders to schedule', step: 'config' })
        return
      }

      // Build date range array
      const dates = []
      let d = dateRange.from
      while (d <= dateRange.to) {
        dates.push(new Date(d))
        d = addDays(d, 1)
      }

      // Build Solvice request
      const request = buildSolviceRequest(technicians, eligibleWOs, availability, dates)

      // Run synchronous solve (mock API returns instantly)
      const solution = await syncSolve(request)

      // Convert to preview changes
      const changes = solutionToChanges(solution, eligibleWOs, technicians)
      const stats = calculateStats(changes)

      // Extract unassignable reasons for display on unassigned cards
      const unassignableReasons = {}
      for (const c of changes) {
        if (c.changeType === 'unassignable') {
          unassignableReasons[c.workOrder.recordId] = c.reason || 'No qualified technician available'
        }
      }

      // Auto-apply accepted changes to local store (pending until user saves)
      if (applyToStore) {
        applyToStore(changes)
      }

      // Log run to history
      const { optimizationGoal } = get()
      const applied = changes.filter(c => c.accepted && c.changeType !== 'unassignable').length
      get()._pushRunHistory({
        timestamp: new Date().toISOString(),
        scope,
        goal: optimizationGoal,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        applied,
        stats: calculateStats(changes),
      })

      set({ solution, changes, stats, step: 'preview', unassignableReasons })
    } catch (err) {
      set({ error: err.message, step: 'config' })
    }
  },

  async applyChanges(applyToStore) {
    set({ step: 'applying' })

    const { changes } = get()
    const accepted = changes.filter(c => c.accepted && c.changeType !== 'unassignable')

    if (accepted.length === 0) {
      set({ step: 'done' })
      return
    }

    // Create rollback snapshot
    const snapshot = accepted.map(c => ({
      recordId: c.workOrder.recordId,
      assignedTechnicianId: c.workOrder.assignedTechnicianId,
      scheduledStart: c.workOrder.scheduledStart,
      scheduledEnd: c.workOrder.scheduledEnd,
      status: c.workOrder.status,
    }))
    set({ snapshot })
    localStorage.setItem('qb-scheduler-rollback', JSON.stringify({
      snapshot,
      timestamp: Date.now(),
      batchId: `ai-${Date.now()}`,
    }))

    try {
      // Build update payloads
      const updates = accepted.map(c => ({
        recordId: c.workOrder.recordId,
        assignedTechnicianId: c.technician.recordId,
        scheduledStart: c.proposedStart,
        scheduledEnd: c.proposedEnd,
        status: 'Scheduled',
        aiScheduled: true,
      }))

      // Apply to Quickbase (mock)
      await batchUpdateWorkOrders(updates)

      // Apply to local store
      applyToStore(changes)

      // Log this run to history
      const { scope, dateRange, optimizationGoal, stats } = get()
      get()._pushRunHistory({
        timestamp: new Date().toISOString(),
        scope,
        goal: optimizationGoal,
        dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
        applied: accepted.length,
        stats,
      })

      set({ step: 'done' })
    } catch (err) {
      set({ error: err.message, step: 'preview' })
    }
  },

  loadRunHistory() {
    try {
      const saved = localStorage.getItem('qb-scheduler-run-history')
      if (saved) set({ runHistory: JSON.parse(saved) })
    } catch { /* ignore */ }
  },

  _pushRunHistory(entry) {
    set(state => {
      const history = [...state.runHistory, entry].slice(-20) // keep last 20
      localStorage.setItem('qb-scheduler-run-history', JSON.stringify(history))
      return { runHistory: history }
    })
  },

  async rollback(applyToStore) {
    const saved = localStorage.getItem('qb-scheduler-rollback')
    if (!saved) return

    const { snapshot } = JSON.parse(saved)
    await batchUpdateWorkOrders(snapshot)
    localStorage.removeItem('qb-scheduler-rollback')

    // Reload data instead of manual revert
    set({ step: 'config', isOpen: false })
  },
}))
