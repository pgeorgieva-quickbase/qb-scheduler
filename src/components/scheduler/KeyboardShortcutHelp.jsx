import React from 'react'
import { X } from 'lucide-react'

const SHORTCUTS = [
  { keys: 'Ctrl + Z', action: 'Undo last action' },
  { keys: 'Ctrl + Y', action: 'Redo last action' },
  { keys: 'Ctrl + Shift + Z', action: 'Redo last action' },
  { keys: 'Ctrl + S', action: 'Save pending changes' },
  { keys: 'Delete / Backspace', action: 'Unassign selected work order' },
  { keys: 'P', action: 'Pin/unpin selected work order' },
  { keys: '?', action: 'Show this help dialog' },
]

export default function KeyboardShortcutHelp({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h2 className="text-[14px] font-semibold text-gray-800">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="space-y-2">
            {SHORTCUTS.map(s => (
              <div key={s.keys} className="flex items-center justify-between">
                <span className="text-[13px] text-gray-600">{s.action}</span>
                <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] font-mono text-gray-700">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-[13px] font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
