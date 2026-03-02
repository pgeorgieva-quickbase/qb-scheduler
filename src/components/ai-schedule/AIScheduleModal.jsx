import React from 'react'
import { X, Play } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import ScopeConfigStep from './ScopeConfigStep'
import ProcessingStep from './ProcessingStep'
import DiffPreviewStep from './DiffPreviewStep'
import { useAIScheduleStore } from '../../stores/aiScheduleStore'
import { useSchedulerStore } from '../../stores/schedulerStore'

export default function AIScheduleModal() {
  const {
    isOpen, step, close, error,
    runOptimization, changes,
  } = useAIScheduleStore()

  const { technicians, workOrders, availability, applyAIScheduleChanges, addToast } = useSchedulerStore()

  if (!isOpen) return null

  const unassigned = workOrders.filter(wo => !wo.assignedTechnicianId)
  const eligible = workOrders.filter(wo => wo.status !== 'Complete' && wo.status !== 'Cancelled')
  const acceptedCount = changes.filter(c => c.accepted && c.changeType !== 'unassignable').length

  const handleOptimize = () => {
    runOptimization(technicians, workOrders, availability, applyAIScheduleChanges)
  }

  const handleClose = () => {
    if (step === 'preview' && acceptedCount > 0) {
      addToast(`${acceptedCount} work order${acceptedCount !== 1 ? 's' : ''} scheduled by AI — Save to persist`, 'success', 10000)
    }
    close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-active/60">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: 'var(--ai-gradient)' }}
            >
              <AISparkleIcon size={14} className="text-white" />
            </div>
            <h2 className="text-[14px] font-semibold text-ink-primary">AI Scheduler</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-ink-tertiary hover:text-ink-secondary transition-colors p-1 rounded hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-status-critical/5 border border-status-critical/20 text-[13px] text-status-critical">
              {error}
            </div>
          )}

          {step === 'config' && (
            <ScopeConfigStep
              unassignedCount={unassigned.length}
              totalEligible={eligible.length}
            />
          )}
          {step === 'processing' && (
            <ProcessingStep
              jobCount={unassigned.length}
              techCount={technicians.length}
            />
          )}
          {step === 'preview' && <DiffPreviewStep />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-surface-active/60">
          {step === 'config' && (
            <>
              <button
                onClick={handleClose}
                className="text-[13px] font-medium text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleOptimize}
                disabled={unassigned.length === 0 && eligible.length === 0}
                className="ai-btn flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold disabled:opacity-50"
              >
                <Play size={14} />
                Optimize Schedule
              </button>
            </>
          )}

          {step === 'processing' && (
            <>
              <span />
              <button
                onClick={handleClose}
                className="text-[13px] font-medium text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <span />
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-md bg-qb-blue text-white text-[13px] font-semibold hover:bg-qb-blue-hover transition-colors shadow-sm"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
