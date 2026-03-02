import React, { useEffect, useMemo } from 'react'
import { Loader2, Plus, X, ChevronDown } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import FieldMapper from './FieldMapper'
import { useWizardStore } from '../../stores/wizardStore'
import clsx from 'clsx'

const coreFields = [
  { key: 'title', label: 'Title', alwaysRequired: true },
  { key: 'scheduledStart', label: 'Start Time', alwaysRequired: true },
  { key: 'scheduledEnd', label: 'End Time', alwaysRequired: true },
  { key: 'assignedTechnician', label: 'Assigned Technician', alwaysRequired: true },
  { key: 'skills', label: 'Required Skills', constraintKey: 'useSkills' },
]

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'is one of' },
]

export default function WorkOrderMappingStep() {
  const {
    fieldMappings, fieldSuggestions, tableFields, loading,
    loadFieldsAndSuggest, setFieldMapping,
    additionalFields, addAdditionalField, removeAdditionalField, setAdditionalField,
    tableFilters, addTableFilter, removeTableFilter, setTableFilterField, setTableFilterOperator, setTableFilterValue,
    selectedTables, availableTables, loadTablesAndSuggest,
    schedulingConstraints,
  } = useWizardStore()

  const suggestions = fieldSuggestions.workOrders
  const fields = tableFields.workOrders
  const mappings = fieldMappings.workOrders
  const additional = additionalFields.workOrders || []
  const filters = tableFilters.workOrders || []

  // All fields shown always; required status depends on constraints
  const essentialFields = useMemo(() =>
    coreFields.map(f => ({
      ...f,
      required: f.alwaysRequired || (f.constraintKey ? !!schedulingConstraints[f.constraintKey] : false),
    })),
    [schedulingConstraints],
  )

  useEffect(() => {
    if (availableTables.length === 0) {
      loadTablesAndSuggest()
    }
  }, [])

  useEffect(() => {
    if (selectedTables.workOrders && fields.length === 0) {
      loadFieldsAndSuggest('workOrders')
    }
  }, [selectedTables.workOrders])

  const essentialFieldIds = useMemo(() => {
    return essentialFields.map(f => mappings?.[f.key]?.fieldId).filter(Boolean)
  }, [mappings])

  const additionalFieldIds = additional.map(f => f.fieldId).filter(Boolean)

  const availableForAdditional = useMemo(() => {
    const usedIds = new Set([...essentialFieldIds, ...additionalFieldIds])
    return fields.filter(f => !usedIds.has(f.fieldId))
  }, [fields, essentialFieldIds, additionalFieldIds])

  const allMappedFields = useMemo(() => {
    const result = []
    for (const ef of essentialFields) {
      if (mappings?.[ef.key]?.fieldName) {
        result.push({ key: ef.key, name: mappings[ef.key].fieldName })
      }
    }
    for (const af of additional) {
      if (af.fieldName) {
        result.push({ key: `additional_${af.fieldId}`, name: af.fieldName })
      }
    }
    return result
  }, [mappings, additional])

  if (loading && fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={24} className="text-qb-blue animate-spin" />
        <div className="flex items-center gap-2">
          <AISparkleIcon size={16} className="text-ai-purple" />
          <span className="text-sm text-ink-secondary">Detecting work order fields — one moment...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Field mapping */}
      <div className="v-card">
        <h3 className="text-[13px] font-semibold text-ink-primary mb-2">Work Order Details</h3>
        <div className="space-y-0.5">
          {essentialFields.map(f => (
            <FieldMapper
              key={f.key}
              label={f.label}
              fieldKey={f.key}
              required={f.required}
              suggestion={suggestions?.[f.key]}
              availableFields={fields}
              selectedFieldId={mappings?.[f.key]?.fieldId}
              onSelect={(key, fid, fname) => setFieldMapping('workOrders', key, fid, fname)}
            />
          ))}
        </div>
      </div>

      {/* Additional fields */}
      <div className="v-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-ink-primary">Additional Fields</h3>
          <button
            onClick={() => addAdditionalField('workOrders')}
            disabled={additional.length >= 5 || availableForAdditional.length === 0}
            className={clsx(
              'flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md transition-all',
              additional.length >= 5 || availableForAdditional.length === 0
                ? 'text-ink-tertiary cursor-not-allowed opacity-50'
                : 'text-qb-blue hover:bg-qb-blue-light',
            )}
          >
            <Plus size={14} />
            Add Field
          </button>
        </div>

        {additional.length === 0 ? (
          <p className="text-2xs text-ink-tertiary py-2">Add up to 5 extra fields to display on timeline blocks — like priority, region, or notes.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-2xs text-ink-tertiary">{additional.length}/5 fields added</p>
            {additional.map((field, index) => {
              const usedIds = new Set([...essentialFieldIds, ...additionalFieldIds.filter(id => id !== field.fieldId)])
              const options = fields.filter(f => f.fieldId === field.fieldId || !usedIds.has(f.fieldId))

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <select
                      value={field.fieldId || ''}
                      onChange={(e) => {
                        const fid = parseInt(e.target.value)
                        const f = fields.find(x => x.fieldId === fid)
                        setAdditionalField('workOrders', index, fid, f?.name || '')
                      }}
                      className="w-full appearance-none bg-surface-hover rounded-md px-3 py-2 pr-8 text-[13px] text-ink-primary border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/30 transition-all cursor-pointer"
                    >
                      <option value="">— Select field —</option>
                      {options.map(f => (
                        <option key={f.fieldId} value={f.fieldId}>
                          {f.name} ({f.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
                  </div>
                  <button
                    onClick={() => removeAdditionalField('workOrders', index)}
                    className="text-ink-tertiary hover:text-status-critical transition-colors p-1 rounded hover:bg-surface-hover flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Data filters */}
      <div className="v-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-ink-primary">Data Filters</h3>
          <button
            onClick={() => addTableFilter('workOrders')}
            disabled={allMappedFields.length === 0}
            className={clsx(
              'flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-md transition-all',
              allMappedFields.length === 0
                ? 'text-ink-tertiary cursor-not-allowed opacity-50'
                : 'text-qb-blue hover:bg-qb-blue-light',
            )}
          >
            <Plus size={14} />
            Add Filter
          </button>
        </div>

        {filters.length === 0 ? (
          <p className="text-2xs text-ink-tertiary py-2">No filters — all work orders from this table will appear on the timeline.</p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative w-[160px] flex-shrink-0">
                  <select
                    value={filter.fieldKey || ''}
                    onChange={(e) => {
                      const selected = allMappedFields.find(f => f.key === e.target.value)
                      setTableFilterField('workOrders', index, e.target.value, selected?.name || '')
                    }}
                    className="w-full appearance-none bg-surface-hover rounded-md px-3 py-2 pr-7 text-[12px] text-ink-primary border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-qb-blue/20 transition-all cursor-pointer"
                  >
                    <option value="">Field...</option>
                    {allMappedFields.map(f => (
                      <option key={f.key} value={f.key}>{f.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
                </div>

                <div className="relative w-[100px] flex-shrink-0">
                  <select
                    value={filter.operator || 'equals'}
                    onChange={(e) => setTableFilterOperator('workOrders', index, e.target.value)}
                    className="w-full appearance-none bg-surface-hover rounded-md px-3 py-2 pr-7 text-[12px] text-ink-primary border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-qb-blue/20 transition-all cursor-pointer"
                  >
                    {OPERATORS.map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
                </div>

                <input
                  type="text"
                  value={filter.value || ''}
                  onChange={(e) => setTableFilterValue('workOrders', index, e.target.value)}
                  placeholder="Value..."
                  className="flex-1 bg-surface-hover rounded-md px-3 py-2 text-[12px] text-ink-primary border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/30 transition-all placeholder:text-ink-tertiary"
                />

                <button
                  onClick={() => removeTableFilter('workOrders', index)}
                  className="text-ink-tertiary hover:text-status-critical transition-colors p-1 rounded hover:bg-surface-hover flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
