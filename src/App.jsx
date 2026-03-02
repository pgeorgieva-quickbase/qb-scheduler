import React, { useEffect, useState, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import QuickbaseTopNav from './components/shell/QuickbaseTopNav'
import QuickbaseSidebar from './components/shell/QuickbaseSidebar'
import SetupWizard from './components/wizard/SetupWizard'
import SetupPage from './components/wizard/SetupPage'
import SchedulerReport from './components/scheduler/SchedulerReport'
import AIScheduleModal from './components/ai-schedule/AIScheduleModal'
import KeyboardShortcutHelp from './components/scheduler/KeyboardShortcutHelp'
import ToastContainer from './components/shared/Toast'
import DevTogglesPanel from './components/shared/DevTogglesPanel'
import { useSchedulerStore } from './stores/schedulerStore'
import { useWizardStore } from './stores/wizardStore'
import { useDevTogglesStore } from './stores/devTogglesStore'
import { useNavigationStore } from './stores/navigationStore'
import AvailabilityPage from './components/availability/AvailabilityPage'

export default function App() {
  const { loading, error, loadData } = useSchedulerStore()
  const { isOpen, isComplete, checkExistingConfig, openWizard } = useWizardStore()
  const { setupInPage } = useDevTogglesStore()
  const currentPage = useNavigationStore(s => s.currentPage)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)

  useEffect(() => {
    // Check for saved config
    const hasConfig = checkExistingConfig()
    if (!hasConfig) {
      openWizard()
    }
    // Load scheduler data
    loadData()
  }, [])

  // Reload data when wizard completes
  useEffect(() => {
    if (isComplete) {
      loadData()
    }
  }, [isComplete])

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Skip when typing in input/textarea/select
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const ctrl = e.ctrlKey || e.metaKey

      // Ctrl+Z → undo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useSchedulerStore.getState().executeUndo()
        return
      }

      // Ctrl+Y or Ctrl+Shift+Z → redo
      if ((ctrl && e.key === 'y') || (ctrl && e.key === 'z' && e.shiftKey)) {
        e.preventDefault()
        useSchedulerStore.getState().executeRedo()
        return
      }

      // Ctrl+S → save
      if (ctrl && e.key === 's') {
        e.preventDefault()
        useSchedulerStore.getState().saveChanges()
        return
      }

      // Delete/Backspace → unassign selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedWorkOrder, unassignWorkOrder } = useSchedulerStore.getState()
        if (selectedWorkOrder && selectedWorkOrder.assignedTechnicianId) {
          e.preventDefault()
          unassignWorkOrder(selectedWorkOrder.recordId)
        }
        return
      }

      // P → pin/unpin selected
      if (e.key === 'p' || e.key === 'P') {
        const { selectedWorkOrder, pinWorkOrder } = useSchedulerStore.getState()
        if (selectedWorkOrder) {
          e.preventDefault()
          pinWorkOrder(selectedWorkOrder.recordId)
        }
        return
      }

      // ? → help
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcutHelp(s => !s)
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // When "Setup in page" is active and wizard is open, show setup page in main content
  const showSetupPage = setupInPage && isOpen

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-canvas overflow-hidden">
        {/* Quickbase top navigation bar */}
        <QuickbaseTopNav />

        {/* Main layout: sidebar + content */}
        <div className="flex-1 flex min-h-0">
          <QuickbaseSidebar />

          <main className="flex-1 min-h-0 min-w-0">
            {showSetupPage ? (
              <SetupPage />
            ) : currentPage === 'availability' ? (
              <AvailabilityPage />
            ) : loading && !useSchedulerStore.getState().technicians.length ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-qb-blue border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-[13px] text-ink-secondary mt-3">Loading scheduler data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <p className="text-[13px] text-status-critical">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-3 px-3 py-1.5 rounded text-[13px] font-medium text-qb-blue hover:bg-qb-blue-light transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <SchedulerReport />
            )}
          </main>
        </div>

        {/* Modals & overlays — only render modal wizard when NOT in page mode */}
        {!setupInPage && <SetupWizard />}
        <AIScheduleModal />
        {showShortcutHelp && <KeyboardShortcutHelp onClose={() => setShowShortcutHelp(false)} />}
        <ToastContainer />
        <DevTogglesPanel />
      </div>
    </DndProvider>
  )
}
