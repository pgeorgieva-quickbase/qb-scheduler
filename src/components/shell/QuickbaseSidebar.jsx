import React, { useState } from 'react'
import {
  Home, Users, Settings, ChevronRight, ChevronDown, Search, Plus, Table2,
  FileText, Calendar, Receipt, Building2,
} from 'lucide-react'
import clsx from 'clsx'

const primaryNav = [
  { key: 'home', icon: Home, label: 'App home' },
  { key: 'users', icon: Users, label: 'Users' },
  { key: 'settings', icon: Settings, label: 'App settings' },
]

const tables = [
  { key: 'work-orders', icon: FileText, label: 'Work Orders', count: 29 },
  { key: 'technicians', icon: Users, label: 'Technicians', count: 8 },
  { key: 'availability', icon: Calendar, label: 'Availability Events', count: 5 },
  { key: 'customers', icon: Building2, label: 'Customers', count: 10 },
  { key: 'invoices', icon: Receipt, label: 'Invoices', count: 24 },
]

export default function QuickbaseSidebar() {
  const [tablesOpen, setTablesOpen] = useState(true)

  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-surface-active/60 flex flex-col h-full overflow-hidden">
      {/* Primary navigation */}
      <nav className="px-2 pt-2 pb-1 space-y-0.5">
        {primaryNav.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              className={clsx(
                'flex items-center gap-2.5 w-full px-2.5 py-[7px] rounded text-[13px] font-medium transition-colors',
                'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
              )}
            >
              <Icon size={15} className="flex-shrink-0 opacity-70" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Tables section */}
      <div className="flex-1 min-h-0 flex flex-col px-2 pt-1">
        <div className="flex items-center justify-between px-2.5 mb-1.5">
          <button
            onClick={() => setTablesOpen(!tablesOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider hover:text-ink-secondary transition-colors"
          >
            {tablesOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Tables
          </button>
          <div className="flex items-center gap-1">
            <button className="text-ink-tertiary hover:text-ink-secondary p-0.5 transition-colors">
              <Plus size={13} />
            </button>
            <button className="text-ink-tertiary hover:text-ink-secondary p-0.5 transition-colors">
              <Search size={13} />
            </button>
          </div>
        </div>

        {tablesOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pb-2">
            {tables.map(table => {
              const Icon = table.icon
              return (
                <button
                  key={table.key}
                  className={clsx(
                    'flex items-center gap-2.5 w-full px-2.5 py-[6px] rounded text-[13px] font-medium transition-colors',
                    'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary',
                  )}
                >
                  <Table2 size={13} className="flex-shrink-0 text-ink-tertiary" />
                  <span className="truncate flex-1 text-left">{table.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
