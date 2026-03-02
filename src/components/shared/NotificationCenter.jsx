import React, { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, Info, Clock, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useSchedulerStore } from '../../stores/schedulerStore'
import clsx from 'clsx'

const SEVERITY_CONFIG = {
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  error: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
}

export default function NotificationCenter() {
  const { notifications, dismissNotification, markNotificationsRead, unreadNotificationCount } = useSchedulerStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { const next = !open; setOpen(next); if (next) markNotificationsRead() }}
        className="relative p-2 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell size={16} strokeWidth={1.5} />
        {unreadNotificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-[320px] max-h-[400px] flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-[13px] font-semibold text-gray-800">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-[10px] text-gray-400">{notifications.length} total</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map(n => {
                const config = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.info
                const Icon = config.icon
                return (
                  <div
                    key={n.id}
                    className={clsx(
                      'flex items-start gap-2.5 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                      !n.read && config.bg,
                    )}
                  >
                    <Icon size={14} className={clsx('flex-shrink-0 mt-0.5', config.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-gray-700 leading-snug">{n.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={9} />
                        {format(new Date(n.timestamp), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); dismissNotification(n.id) }}
                      className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
