import React, { useEffect, useRef } from 'react'
import { Lock, Unlock, X, Sparkles } from 'lucide-react'
import { useSchedulerStore } from '../../stores/schedulerStore'

export default function ContextMenu({ workOrder, position, onClose }) {
  const ref = useRef(null)
  const { pinWorkOrder, unassignWorkOrder, addToast } = useSchedulerStore()

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Clamp position so menu doesn't go off-screen
  const style = {
    top: Math.min(position.y, window.innerHeight - 200),
    left: Math.min(position.x, window.innerWidth - 200),
  }

  const handlePin = () => {
    pinWorkOrder(workOrder.recordId)
    addToast(
      workOrder.pinned
        ? `${workOrder.workOrderNumber} unpinned`
        : `${workOrder.workOrderNumber} pinned — excluded from optimization`,
      'info'
    )
    onClose()
  }

  const handleUnassign = () => {
    unassignWorkOrder(workOrder.recordId)
    addToast(`${workOrder.workOrderNumber} unassigned`, 'info')
    onClose()
  }

  return (
    <div ref={ref} className="context-menu" style={style}>
      <button className="context-menu-item" onClick={handlePin}>
        {workOrder.pinned ? <Unlock size={13} /> : <Lock size={13} />}
        <span>{workOrder.pinned ? 'Unpin' : 'Pin (Lock)'}</span>
      </button>
      {workOrder.assignedTechnicianId && (
        <button className="context-menu-item context-menu-item-danger" onClick={handleUnassign}>
          <X size={13} />
          <span>Unassign</span>
        </button>
      )}
      <div className="context-menu-separator" />
      <button className="context-menu-item context-menu-item-disabled" disabled>
        <Sparkles size={13} />
        <span>AI Suggest</span>
      </button>
    </div>
  )
}
