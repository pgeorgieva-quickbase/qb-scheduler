import React, { useEffect, useMemo } from 'react'
import { Loader2, Plus, X, ChevronDown, CalendarDays, ExternalLink } from 'lucide-react'
import AISparkleIcon from '../shared/AISparkleIcon'
import FieldMapper from './FieldMapper'
import { useWizardStore } from '../../stores/wizardStore'
import { useNavigationStore } from '../../stores/navigationStore'
import clsx from 'clsx'

const coreFields = [
  { key: 'name', label: 'Name', alwaysRequired: true },
  { key: 'skills', label: 'Skills / Certifications', constraintKey: 'useSkills' },
  { key: 'hourlyRate', label: 'Hourly Rate', constraintKey: 'usePayRate' },
]

const OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'is one of' },
]

export default function TechnicianMappingStep() {
  const {
    fieldMappings, fieldSuggestions, tableFields, loading,
    loadFieldsAndSuggest, setFieldMapping,
    schedulingConstraints,
    additionalFields, addAdditionalField, removeAdditionalField, setAdditionalField,
    tableFilters, addTableFilter, removeTableFilter, setTableFilterField, setTableFilterOperator, setTableFilterValue,
    selectedTables, availableTables, loadTablesAndSuggest,
  } = useWizardStore()

  const suggestions = fieldSuggestions.technicians
  const fields = tableFields.technicians
  const mappings = fieldMappings.technicians

  const additional = additionalFields.technicians || []
  const filters = tableFilters.technicians || []

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
    if (selectedTables.technicians && fields.length === 0) {
      loadFieldsAndSuggest('technicians')
    }
  }, [selectedTables.technicians])

  const essentialFieldIds = useMemo(() => {
    return essentialFields.map(f => mappings?.[f.key]?.fieldId).filter(Boolean)
  }, [mappings, essentialFields])

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
  }, [mappings, essentialFields, additional])

  return (
    <div className="space-y-4">
      {/* Technician details */}
      {!selectedTables.technicians ? (
        <div className="v-card">
          <h3 className="text-[13px] font-semibold text-ink-primary mb-2">Technician Details</h3>
          <p className="text-2xs text-ink-tertiary py-4 text-center">Connecting to your technician table...</p>
        </div>
      ) : loading && fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={24} className="text-qb-blue animate-spin" />
          <div className="flex items-center gap-2">
            <AISparkleIcon size={16} className="text-ai-purple" />
            <span className="text-sm text-ink-secondary">Detecting technician fields — one moment...</span>
          </div>
        </div>
      ) : (
      <>
      {/* Technician details */}
      <div className="v-card">
        <h3 className="text-[13px] font-semibold text-ink-primary mb-2">Technician Details</h3>
        <div className="space-y-0.5">
          {essentialFields.map(f => (
            <FieldMapper
              key={f.key}
              label={f.label}
              fieldKey={f.key}
              required={f.required}
              extraOptions={f.extraOptions}
              suggestion={suggestions?.[f.key]}
              availableFields={fields}
              selectedFieldId={mappings?.[f.key]?.fieldId}
              onSelect={(key, fid, fname) => setFieldMapping('technicians', key, fid, fname)}
            />
          ))}
        </div>
      </div>

      {/* Manage Availability — only visible after initial setup */}
      {useWizardStore.getState().isComplete && (
        <div className="v-card flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-ink-primary mb-0.5">Availability Schedule</h3>
            <p className="text-[11px] text-ink-tertiary">
              View and manage technician working hours, time off, and recurring schedules.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              useWizardStore.getState().closeWizard()
              useNavigationStore.getState().navigateTo('availability')
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-qb-blue/20 bg-qb-blue-light text-qb-blue text-[12px] font-semibold hover:bg-qb-blue/10 transition-colors flex-shrink-0"
          >
            <CalendarDays size={14} />
            Manage Availability
            <ExternalLink size={11} className="opacity-50" />
          </button>
        </div>
      )}

      {/* Additional fields */}
      <div className="v-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold text-ink-primary">Additional Fields</h3>
          <button
            onClick={() => addAdditionalField('technicians')}
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
          <p className="text-2xs text-ink-tertiary py-2">Add up to 5 extra fields to show alongside each technician — like region, team, or phone number.</p>
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
                        setAdditionalField('technicians', index, fid, f?.name || '')
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
                    onClick={() => removeAdditionalField('technicians', index)}
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
            onClick={() => addTableFilter('technicians')}
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
          <p className="text-2xs text-ink-tertiary py-2">No filters — all technicians from this table will appear on the schedule.</p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative w-[160px] flex-shrink-0">
                  <select
                    value={filter.fieldKey || ''}
                    onChange={(e) => {
                      const selected = allMappedFields.find(f => f.key === e.target.value)
                      setTableFilterField('technicians', index, e.target.value, selected?.name || '')
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
                    onChange={(e) => setTableFilterOperator('technicians', index, e.target.value)}
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
                  onChange={(e) => setTableFilterValue('technicians', index, e.target.value)}
                  placeholder="Value..."
                  className="flex-1 bg-surface-hover rounded-md px-3 py-2 text-[12px] text-ink-primary border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/30 transition-all placeholder:text-ink-tertiary"
                />

                <button
                  onClick={() => removeTableFilter('technicians', index)}
                  className="text-ink-tertiary hover:text-status-critical transition-colors p-1 rounded hover:bg-surface-hover flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

    </div>
  )
}
