import React, { useState } from 'react'
import {
  Home, ChevronRight, FileText, Download, Grid3X3, MoreHorizontal,
  LayoutGrid, List, Settings, BarChart3, Pencil,
} from 'lucide-react'
import { useWizardStore } from '../../stores/wizardStore'
import clsx from 'clsx'

const reportViews = [
  { key: 'timeline', label: 'Timeline Scheduler' },
  { key: 'table', label: 'Table View' },
  { key: 'calendar', label: 'Calendar' },
]

export default function QuickbasePageBar() {
  const { reportTitle, openWizard } = useWizardStore()
  const [activeView, setActiveView] = useState('timeline')

  const displayTitle = reportTitle || 'Timeline Scheduler'

  return (
    <div className="h-10 bg-white border-b border-surface-active/60 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left: Breadcrumb navigation */}
      <div className="flex items-center gap-0 min-w-0">
        {/* Home */}
        <button className="p-1.5 rounded text-ink-tertiary hover:text-ink-primary hover:bg-surface-hover transition-colors">
          <Home size={14} />
        </button>

        <ChevronRight size={12} className="text-ink-tertiary/60 mx-0.5 flex-shrink-0" />

        {/* Table icon + name (Work Orders) */}
        <button className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-hover transition-colors group">
          <div className="w-5 h-5 rounded bg-qb-blue flex items-center justify-center flex-shrink-0">
            <FileText size={11} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold text-ink-primary">Work Orders</span>
          {/* Reports & Settings links */}
          <div className="flex items-center gap-0.5 ml-0.5">
            <span className="text-[11px] text-qb-blue font-medium hover:underline cursor-pointer">Reports</span>
            <span className="text-[11px] text-ink-tertiary mx-0.5">•</span>
            <span className="text-[11px] text-qb-blue font-medium hover:underline cursor-pointer">Settings</span>
          </div>
        </button>

        <ChevronRight size={12} className="text-ink-tertiary/60 mx-0.5 flex-shrink-0" />

        {/* Report icon + Report name */}
        <div className="flex items-center gap-1.5 px-2 py-1 min-w-0">
          <BarChart3 size={13} className="text-ink-tertiary flex-shrink-0" />
          <span className="text-[13px] font-medium text-ink-primary truncate">{displayTitle}</span>
          <button
            onClick={openWizard}
            className="p-0.5 rounded text-ink-tertiary hover:text-ink-primary hover:bg-surface-hover transition-colors flex-shrink-0"
            title="Edit report settings"
          >
            <Pencil size={11} />
          </button>
        </div>
      </div>

      {/* Right: View toggles + actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* View selector tabs */}
        <div className="flex items-center bg-surface-hover/70 rounded-md p-0.5 mr-2">
          {reportViews.map(view => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={clsx(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                activeView === view.key
                  ? 'bg-white text-ink-primary shadow-sm'
                  : 'text-ink-tertiary hover:text-ink-secondary',
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-surface-active/60 mx-1" />

        {/* Action buttons */}
        <button className="p-1.5 rounded text-ink-tertiary hover:text-ink-primary hover:bg-surface-hover transition-colors" title="Download">
          <Download size={14} />
        </button>
        <button className="p-1.5 rounded text-ink-tertiary hover:text-ink-primary hover:bg-surface-hover transition-colors" title="Grid view">
          <Grid3X3 size={14} />
        </button>
        <button className="p-1.5 rounded text-ink-tertiary hover:text-ink-primary hover:bg-surface-hover transition-colors" title="More options">
          <MoreHorizontal size={14} />
        </button>

        <div className="w-px h-5 bg-surface-active/60 mx-1" />

        {/* Layout toggle */}
        <div className="flex items-center bg-surface-hover/70 rounded-md p-0.5">
          <button className="p-1 rounded bg-white text-ink-primary shadow-sm" title="Grid">
            <LayoutGrid size={13} />
          </button>
          <button className="p-1 rounded text-ink-tertiary hover:text-ink-secondary" title="List">
            <List size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
