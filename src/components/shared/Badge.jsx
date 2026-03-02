import React from 'react'
import clsx from 'clsx'

const variants = {
  priority1: 'bg-status-critical/10 text-status-critical',
  priority2: 'bg-status-in-progress/10 text-status-in-progress',
  priority3: 'bg-ink-tertiary/10 text-ink-secondary',
  priority4: 'bg-ink-tertiary/10 text-ink-tertiary',
  skill: 'bg-qb-blue-light text-qb-blue',
  status: 'bg-status-scheduled/10 text-status-scheduled',
  duration: 'bg-surface-hover text-ink-secondary',
  ai: 'bg-ai-purple/10 text-ai-purple',
  new: 'bg-status-new/10 text-status-new',
  change: 'bg-status-scheduled/10 text-status-scheduled',
  warning: 'bg-status-in-progress/10 text-status-in-progress',
  error: 'bg-status-critical/10 text-status-critical',
}

export default function Badge({ variant = 'skill', children, className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-semibold whitespace-nowrap',
        variants[variant] || variants.skill,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const labels = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low' }
  return (
    <Badge variant={`priority${priority}`}>
      {labels[priority] || `P${priority}`}
    </Badge>
  )
}

export function ConfidenceBadge({ confidence }) {
  const level = confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low'
  const cls = {
    high: 'confidence-high',
    medium: 'confidence-medium',
    low: 'confidence-low',
  }
  return (
    <span className={clsx('inline-flex items-center rounded-sm px-1.5 py-0.5 text-2xs font-semibold', cls[level])}>
      {confidence}%
    </span>
  )
}
