import React, { useState, useEffect } from 'react'
import AISparkleIcon from '../shared/AISparkleIcon'

const stages = [
  { label: 'Gathering data from Quickbase...', duration: 1200 },
  { label: 'Analyzing constraints & availability...', duration: 800 },
  { label: 'Building optimization model...', duration: 1000 },
  { label: 'Running Solvice VRP solver...', duration: 2000 },
  { label: 'Computing optimal assignments...', duration: 1500 },
]

export default function ProcessingStep({ jobCount, techCount }) {
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    let timeout
    if (currentStage < stages.length - 1) {
      timeout = setTimeout(() => {
        setCurrentStage(s => s + 1)
      }, stages[currentStage].duration)
    }
    return () => clearTimeout(timeout)
  }, [currentStage])

  const progress = ((currentStage + 1) / stages.length) * 100

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      {/* Animated sparkle */}
      <div className="relative">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-soft"
          style={{ background: 'var(--ai-gradient)' }}
        >
          <AISparkleIcon size={32} className="text-white" />
        </div>
        <div
          className="absolute inset-0 rounded-2xl opacity-30 animate-ping"
          style={{ background: 'var(--ai-gradient)' }}
        />
      </div>

      {/* Stats */}
      <div className="text-center">
        <h3 className="text-[15px] font-semibold text-ink-primary">Optimizing Schedule</h3>
        <p className="text-[13px] text-ink-secondary mt-1">
          Scheduling {jobCount} work orders across {techCount} technicians
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'var(--ai-gradient)',
            }}
          />
        </div>
      </div>

      {/* Stage labels */}
      <div className="space-y-1 text-center min-h-[60px]">
        {stages.map((stage, i) => (
          <div
            key={i}
            className={`text-[12px] transition-opacity duration-300 ${
              i === currentStage ? 'text-ink-primary opacity-100' : i < currentStage ? 'text-ink-tertiary opacity-50' : 'opacity-0'
            }`}
          >
            {i < currentStage ? '✓ ' : i === currentStage ? '' : ''}{stage.label}
          </div>
        ))}
      </div>
    </div>
  )
}
