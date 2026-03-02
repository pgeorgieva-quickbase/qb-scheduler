import React from 'react'
import { Settings, X, Monitor, Layout, Database } from 'lucide-react'
import { useDevTogglesStore } from '../../stores/devTogglesStore'
import clsx from 'clsx'

const toggles = [
  {
    key: 'setupInModals',
    label: 'Setup in modals',
    description: 'Current flow — setup wizard opens as a modal overlay',
    icon: Monitor,
  },
  {
    key: 'setupInPage',
    label: 'Setup in page',
    description: 'Setup wizard renders as a standalone page in the main content area',
    icon: Layout,
  },
  {
    key: 'availabilityInQBTable',
    label: 'Availability in QB table',
    description: 'Replace standard/custom availability with a Quickbase table mapping',
    icon: Database,
  },
]

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={clsx(
        'relative w-9 h-5 rounded-full flex-shrink-0 transition-colors',
        enabled ? 'bg-qb-blue' : 'bg-surface-active',
      )}
    >
      <div
        className={clsx(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export default function DevTogglesPanel() {
  const { panelOpen, togglePanel, setToggle, ...state } = useDevTogglesStore()

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={togglePanel}
        className={clsx(
          'fixed bottom-4 right-4 z-[100] w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all',
          panelOpen
            ? 'bg-ink-primary text-white'
            : 'bg-white border border-surface-active/60 text-ink-secondary hover:text-ink-primary hover:shadow-xl',
        )}
        title="Dev Toggles"
      >
        <Settings size={18} className={panelOpen ? 'animate-spin' : ''} style={panelOpen ? { animationDuration: '3s' } : undefined} />
      </button>

      {/* Panel */}
      {panelOpen && (
        <div className="fixed bottom-16 right-4 z-[100] w-[320px] bg-white rounded-lg shadow-modal border border-surface-active/40 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-active/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-critical animate-pulse" />
              <span className="text-[13px] font-semibold text-ink-primary">Dev Toggles</span>
            </div>
            <button
              onClick={togglePanel}
              className="text-ink-tertiary hover:text-ink-primary transition-colors p-0.5 rounded hover:bg-surface-hover"
            >
              <X size={14} />
            </button>
          </div>

          {/* Toggles */}
          <div className="px-4 py-3 space-y-3">
            {toggles.map(t => {
              const Icon = t.icon
              const enabled = state[t.key]
              return (
                <div key={t.key} className="flex items-start gap-3">
                  <div className={clsx(
                    'flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 mt-0.5 transition-colors',
                    enabled ? 'bg-qb-blue/10 text-qb-blue' : 'bg-surface-hover text-ink-tertiary',
                  )}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={clsx(
                        'text-[12px] font-semibold',
                        enabled ? 'text-ink-primary' : 'text-ink-secondary',
                      )}>
                        {t.label}
                      </span>
                      <Toggle enabled={enabled} onChange={(v) => setToggle(t.key, v)} />
                    </div>
                    <p className="text-[10px] text-ink-tertiary leading-snug mt-0.5">{t.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-surface-active/20">
            <p className="text-[9px] text-ink-tertiary text-center">
              Dev only — toggles persist in localStorage
            </p>
          </div>
        </div>
      )}
    </>
  )
}
