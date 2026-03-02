import React from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import { useAIScheduleStore } from '../../stores/aiScheduleStore'

export default function ApplyingStep({ acceptedCount }) {
  const step = useAIScheduleStore(s => s.step)
  const isDone = step === 'done'

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      {isDone ? (
        <>
          <div className="w-16 h-16 rounded-2xl bg-status-scheduled/10 flex items-center justify-center">
            <CheckCircle size={32} className="text-status-scheduled" />
          </div>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold text-ink-primary">Schedule Applied</h3>
            <p className="text-[13px] text-ink-secondary mt-1">
              {acceptedCount} work orders updated successfully
            </p>
          </div>
          <p className="text-2xs text-ink-tertiary text-center max-w-xs">
            Changes have been saved to Quickbase. You can undo this action within 30 seconds using the notification below.
          </p>
        </>
      ) : (
        <>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--ai-gradient)' }}
          >
            <Loader2 size={28} className="text-white animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold text-ink-primary">Applying Changes</h3>
            <p className="text-[13px] text-ink-secondary mt-1">
              Updating {acceptedCount} work orders in Quickbase...
            </p>
          </div>
        </>
      )}
    </div>
  )
}
