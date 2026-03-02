import React, { useState, useRef, useEffect } from 'react'
import { Settings, FileText, Users, Check, Pencil } from 'lucide-react'
import { useWizardStore } from '../../stores/wizardStore'
import clsx from 'clsx'

const stepMeta = {
  preferences: { icon: Settings, editable: false },
  workOrders: { icon: FileText, editable: true, labelKey: 'workOrders' },
  technicians: { icon: Users, editable: true, labelKey: 'technicians' },
}

const defaultLabels = {
  preferences: 'Report Basics',
}

function EditableLabel({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) onChange(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className="bg-transparent border-b border-qb-blue/40 text-inherit font-inherit outline-none w-[100px] text-[13px] py-0 px-0"
        style={{ font: 'inherit' }}
      />
    )
  }

  return (
    <span
      className="group/label inline-flex items-center gap-1 cursor-pointer"
      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
      title="Click to rename"
    >
      <span>{value}</span>
      <Pencil size={10} className="opacity-0 group-hover/label:opacity-50 transition-opacity flex-shrink-0" />
    </span>
  )
}

export default function WizardProgress({ currentStep, activeSteps, onStepClick, stepComplete = [] }) {
  const { tabLabels, setTabLabel } = useWizardStore()

  return (
    <div className="flex items-center border-b border-surface-active/60 bg-white">
      {activeSteps.map((step, i) => {
        const meta = stepMeta[step.key]
        if (!meta) return null
        const isActive = i === currentStep
        const isDone = stepComplete[i]
        const Icon = meta.icon

        const label = meta.editable
          ? (tabLabels[meta.labelKey] || step.key)
          : defaultLabels[step.key]

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepClick(i)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-all relative',
              'hover:bg-surface-hover/50 cursor-pointer',
              isActive
                ? 'text-qb-blue'
                : 'text-ink-tertiary hover:text-ink-secondary',
            )}
          >
            {/* Completion indicator or icon */}
            {isDone && !isActive ? (
              <div className="w-[18px] h-[18px] rounded-full bg-status-scheduled/10 flex items-center justify-center flex-shrink-0">
                <Check size={11} className="text-status-scheduled" strokeWidth={2.5} />
              </div>
            ) : (
              <Icon size={15} />
            )}

            {meta.editable ? (
              <EditableLabel
                value={label}
                onChange={(newLabel) => setTabLabel(meta.labelKey, newLabel)}
              />
            ) : (
              <span>{label}</span>
            )}

            {/* Active underline indicator — 3px for QB fidelity */}
            {isActive && (
              <div className="absolute bottom-0 left-3 right-3 h-[3px] bg-qb-blue rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
