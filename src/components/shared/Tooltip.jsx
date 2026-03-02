import React, { useState, useRef } from 'react'

export default function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = useState(false)
  const timeout = useRef(null)

  const show = () => {
    timeout.current = setTimeout(() => setVisible(true), 400)
  }

  const hide = () => {
    clearTimeout(timeout.current)
    setVisible(false)
  }

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && content && (
        <div
          className={`absolute z-50 px-2.5 py-1.5 rounded-md bg-ink-primary text-white text-2xs font-normal whitespace-nowrap shadow-popover animate-fade-in ${posClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}
