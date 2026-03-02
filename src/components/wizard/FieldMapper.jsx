import React from 'react'
import { ChevronDown } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import clsx from 'clsx'

export default function FieldMapper({
  label,
  fieldKey,
  suggestion,
  availableFields,
  selectedFieldId,
  onSelect,
  required = false,
  placeholder,
  extraOptions = [],
}) {
  const allOptions = [...extraOptions, ...availableFields]
  const selectedField = allOptions.find(f => f.fieldId === selectedFieldId)
  const isAISuggested = suggestion && selectedFieldId === suggestion.fieldId

  return (
    <div className="flex items-center gap-4 py-2.5">
      {/* Label */}
      <div className="w-40 flex-shrink-0">
        <span className="text-[13px] font-medium text-ink-secondary">
          {label}
          {required && <span className="text-status-critical ml-0.5">*</span>}
        </span>
      </div>

      {/* Field selector */}
      <div className="flex-1 relative">
        <select
          value={selectedFieldId || ''}
          onChange={(e) => {
            const fid = parseInt(e.target.value)
            const field = allOptions.find(f => f.fieldId === fid)
            onSelect(fieldKey, fid, field?.name || '')
          }}
          className={clsx(
            'w-full appearance-none rounded-md py-2 pl-3',
            'text-[13px] text-ink-primary',
            'border border-transparent',
            'bg-surface-hover focus:bg-white',
            'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/30',
            'transition-all cursor-pointer',
            isAISuggested ? 'pr-[120px]' : 'pr-8',
            !selectedFieldId && 'text-ink-tertiary',
          )}
        >
          <option value="">{placeholder || '— Select field —'}</option>
          {extraOptions.length > 0 && extraOptions.map(f => (
            <option key={`extra-${f.fieldId}`} value={f.fieldId}>
              {f.name} ({f.type})
            </option>
          ))}
          {availableFields.map(f => (
            <option key={f.fieldId} value={f.fieldId}>
              {f.name} ({f.type})
            </option>
          ))}
        </select>
        {isAISuggested && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <AISparkleIcon size={12} className="text-ai-purple" />
            <span className="text-[11px] text-ai-purple font-medium">AI suggested</span>
          </div>
        )}
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none"
        />
      </div>
    </div>
  )
}
