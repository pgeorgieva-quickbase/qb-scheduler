import React from 'react'
import ReportToolbar from './ReportToolbar'
import TimelineGrid from './TimelineGrid'
import UnassignedPanel from './UnassignedPanel'
import WorkOrderPopover from './WorkOrderPopover'

export default function SchedulerReport() {
  return (
    <div className="flex flex-col h-full bg-canvas">
      <ReportToolbar />
      {/* Bryntum-style: timeline left, unassigned panel right */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 flex flex-col">
          <TimelineGrid />
        </div>
        <UnassignedPanel />
      </div>
      <WorkOrderPopover />
    </div>
  )
}
