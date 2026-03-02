import React from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'
import { useSchedulerStore } from '../../stores/schedulerStore'

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
}

const styles = {
  success: 'border-status-scheduled/30 bg-white',
  warning: 'border-status-in-progress/30 bg-white',
  error: 'border-status-critical/30 bg-white',
  info: 'border-qb-blue/30 bg-white',
}

const iconColors = {
  success: 'text-status-scheduled',
  warning: 'text-status-in-progress',
  error: 'text-status-critical',
  info: 'text-qb-blue',
}

export default function ToastContainer() {
  const toasts = useSchedulerStore(s => s.toasts)
  const removeToast = useSchedulerStore(s => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || icons.info
        return (
          <div
            key={toast.id}
            className={clsx(
              'flex items-center gap-3 rounded-md border px-4 py-3 shadow-toast animate-slide-up',
              'min-w-[300px] max-w-[420px]',
              styles[toast.type] || styles.info,
            )}
          >
            <Icon size={18} className={iconColors[toast.type] || iconColors.info} />
            <span className="text-sm text-ink-primary flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-ink-tertiary hover:text-ink-secondary transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
