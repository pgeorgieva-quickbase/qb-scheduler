import React from 'react'
import { Info } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import { ConfidenceBadge } from '../shared/Badge'
import Tooltip from '../shared/Tooltip'

export default function AISuggestionBadge({ suggestion, onAccept, onOverride }) {
  if (!suggestion) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <AISparkleIcon size={14} className="text-ai-purple" />
        <ConfidenceBadge confidence={suggestion.confidence} />
      </div>
      <Tooltip content={suggestion.reason} position="bottom">
        <button className="text-ink-tertiary hover:text-ink-secondary transition-colors">
          <Info size={13} />
        </button>
      </Tooltip>
    </div>
  )
}
