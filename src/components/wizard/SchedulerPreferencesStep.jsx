import React, { useState, useEffect, useRef } from 'react'
import { Zap, ChevronDown, Plus, X, Check, Settings2 } from 'lucide-react'
import { useWizardStore } from '../../stores/wizardStore'
import clsx from 'clsx'

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const constraintOptions = [
  { key: 'useSkills', label: 'Skill Matching', description: 'Assign jobs only to technicians with the right certifications' },
  { key: 'usePayRate', label: 'Cost Optimization', description: 'Factor in hourly rates to minimize labor costs' },
]

const viewOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

function Toggle({ enabled, onChange, size = 'md' }) {
  const sizes = {
    md: { track: 'w-10 h-[22px]', thumb: 'w-4 h-4 top-[3px]', on: 'translate-x-[22px]', off: 'translate-x-[3px]' },
    sm: { track: 'w-9 h-5', thumb: 'w-4 h-4 top-0.5', on: 'translate-x-4', off: 'translate-x-0.5' },
  }
  const s = sizes[size]
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={clsx(
        'relative rounded-full flex-shrink-0 transition-colors',
        s.track,
        enabled ? 'bg-qb-blue' : 'bg-surface-active',
      )}
    >
      <div
        className={clsx(
          'absolute rounded-full bg-white shadow-sm transition-transform',
          s.thumb,
          enabled ? s.on : s.off,
        )}
      />
    </button>
  )
}

export default function SchedulerPreferencesStep() {
  const {
    useAIOptimization, setUseAIOptimization,
    schedulingConstraints, setConstraint,
    reportTitle, reportDescription, setReportTitle, setReportDescription,
    timelineSettings, setTimelineSetting, addNonWorkingDay, removeNonWorkingDay,
    openDefaultsModal,
  } = useWizardStore()

  const [defaultsOpen, setDefaultsOpen] = useState(false)

  // Allow other steps to trigger this modal via store flag
  useEffect(() => {
    if (openDefaultsModal) {
      setDefaultsOpen(true)
      useWizardStore.setState({ openDefaultsModal: false })
    }
  }, [openDefaultsModal])
  const [newDayDate, setNewDayDate] = useState('')
  const [newDayLabel, setNewDayLabel] = useState('')

  const handleAddNonWorkingDay = () => {
    if (!newDayDate) return
    addNonWorkingDay(newDayDate, newDayLabel || 'Non-working day')
    setNewDayDate('')
    setNewDayLabel('')
  }

  const toggleWorkingDay = (day) => {
    const current = timelineSettings.workingDays || ALL_DAYS
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...ALL_DAYS.filter(d => current.includes(d) || d === day)]
    setTimelineSetting('workingDays', updated)
  }

  return (
    <div className="space-y-4">
      {/* Card 1: Report Details */}
      <div className="v-card">
        <h3 className="text-[13px] font-semibold text-ink-primary mb-3">Report Basics</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-1">Title <span className="text-status-critical">*</span></label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g., Weekly Dispatch Board"
              className={clsx(
                'w-full rounded-md px-3 py-2.5',
                'text-[13px] text-ink-primary border border-surface-active/60',
                'bg-surface-hover focus:bg-white',
                'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                'transition-all placeholder:text-ink-tertiary',
              )}
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-1">Description</label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="What is this schedule used for? e.g., Daily technician dispatch for the Northeast region"
              rows={2}
              className={clsx(
                'w-full rounded-md px-3 py-2.5 resize-none',
                'text-[13px] text-ink-primary border border-surface-active/60',
                'bg-surface-hover focus:bg-white',
                'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                'transition-all placeholder:text-ink-tertiary',
              )}
            />
          </div>
        </div>
      </div>

      {/* Card 2: AI Optimization */}
      <div className="v-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={clsx(
              'flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-colors',
              useAIOptimization
                ? 'bg-gradient-to-br from-ai-purple/15 to-ai-indigo/15 text-ai-purple'
                : 'bg-surface-hover text-ink-tertiary',
            )}>
              <Zap size={15} />
            </div>
            <div>
              <h3 className={clsx(
                'text-[13px] font-semibold',
                useAIOptimization ? 'text-ai-purple' : 'text-ink-primary',
              )}>
                AI Optimization
              </h3>
              <p className="text-[11px] text-ink-tertiary">Let AI build the best schedule based on your constraints</p>
            </div>
          </div>
          <Toggle
            enabled={useAIOptimization}
            onChange={setUseAIOptimization}
          />
        </div>

        {/* Constraint checkboxes — clean list, only visible when AI is ON */}
        {useAIOptimization && (
          <div className="mt-4 pt-3 border-t border-surface-active/40 space-y-2 animate-fade-in">
            <p className="text-[12px] font-medium text-ink-secondary mb-1">What should the AI consider?</p>

            {/* Availability — always on, non-interactive */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-surface-hover/30">
              <div className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 bg-qb-blue border-qb-blue opacity-60">
                <Check size={10} className="text-white" strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-medium text-ink-primary">
                  Availability
                </span>
                <span className="text-[11px] text-ink-tertiary ml-1.5">Respect technician working days and shift hours</span>
              </div>
              <span className="text-[10px] font-medium text-ink-tertiary uppercase tracking-wide">Always on</span>
            </div>

            {constraintOptions.map(opt => {
              const enabled = schedulingConstraints[opt.key]
              return (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all hover:bg-surface-hover/50"
                >
                  <div className={clsx(
                    'w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all',
                    enabled
                      ? 'bg-qb-blue border-qb-blue'
                      : 'border-surface-active bg-white',
                  )}>
                    {enabled && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-medium text-ink-primary">
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-ink-tertiary ml-1.5">{opt.description}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setConstraint(opt.key, e.target.checked)}
                    className="sr-only"
                  />
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Card 3: Timeline Display */}
      <div className="v-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-ink-primary">Timeline View</h3>
          <button
            type="button"
            onClick={() => setDefaultsOpen(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-qb-blue hover:text-qb-blue/80 transition-colors cursor-pointer"
          >
            <Settings2 size={13} />
            Schedule Report Defaults
          </button>
        </div>

        <div className="space-y-4">
          {/* Show weekends checkbox */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={clsx(
              'w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all',
              timelineSettings.showWeekends
                ? 'bg-qb-blue border-qb-blue'
                : 'border-surface-active bg-white',
            )}>
              {timelineSettings.showWeekends && <Check size={10} className="text-white" strokeWidth={3} />}
            </div>
            <div>
              <span className="text-[13px] font-medium text-ink-primary">Show weekends</span>
              <p className="text-[11px] text-ink-tertiary">Include Sat & Sun columns on the timeline</p>
            </div>
            <input
              type="checkbox"
              checked={timelineSettings.showWeekends}
              onChange={(e) => setTimelineSetting('showWeekends', e.target.checked)}
              className="sr-only"
            />
          </label>

          {/* Default view dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-medium text-ink-secondary whitespace-nowrap">Default view</label>
            <div className="relative w-32">
              <select
                value={timelineSettings.defaultView}
                onChange={(e) => setTimelineSetting('defaultView', e.target.value)}
                className={clsx(
                  'w-full appearance-none rounded-md px-3 py-2 pr-8',
                  'text-[13px] text-ink-primary border border-surface-active/60',
                  'bg-surface-hover focus:bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                  'transition-all cursor-pointer',
                )}
              >
                {viewOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Schedule Report Defaults Modal */}
      {defaultsOpen && (
        <ScheduleDefaultsModal
          timelineSettings={timelineSettings}
          setTimelineSetting={setTimelineSetting}
          toggleWorkingDay={toggleWorkingDay}
          addNonWorkingDay={addNonWorkingDay}
          removeNonWorkingDay={removeNonWorkingDay}
          newDayDate={newDayDate}
          setNewDayDate={setNewDayDate}
          newDayLabel={newDayLabel}
          setNewDayLabel={setNewDayLabel}
          handleAddNonWorkingDay={handleAddNonWorkingDay}
          onClose={() => setDefaultsOpen(false)}
        />
      )}
    </div>
  )
}


function ScheduleDefaultsModal({
  timelineSettings, setTimelineSetting, toggleWorkingDay,
  addNonWorkingDay, removeNonWorkingDay,
  newDayDate, setNewDayDate, newDayLabel, setNewDayLabel,
  handleAddNonWorkingDay, onClose,
}) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-primary/40 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-lg shadow-modal w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-active/40">
          <div className="flex items-center gap-2">
            <Settings2 size={15} className="text-ink-secondary" />
            <h3 className="text-[14px] font-semibold text-ink-primary">Schedule Report Defaults</h3>
          </div>
          <button
            onClick={onClose}
            className="text-ink-tertiary hover:text-ink-primary transition-colors p-1 rounded-md hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">
          {/* Working Days */}
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-2">Working days <span className="font-normal text-ink-tertiary">— select your business days</span></label>
            <div className="flex gap-2">
              {ALL_DAYS.map(day => {
                const active = (timelineSettings.workingDays || ALL_DAYS).includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkingDay(day)}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-[12px] font-medium transition-all border',
                      active
                        ? 'bg-qb-blue text-white border-qb-blue'
                        : 'bg-white text-ink-secondary border-surface-active/60 hover:border-qb-blue/40 hover:text-ink-primary',
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-2">Working hours <span className="font-normal text-ink-tertiary">— standard shift window</span></label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={timelineSettings.workingHoursFrom || '08:00'}
                onChange={(e) => setTimelineSetting('workingHoursFrom', e.target.value)}
                className={clsx(
                  'rounded-md px-3 py-2 w-32',
                  'text-[13px] text-ink-primary border border-surface-active/60',
                  'bg-surface-hover focus:bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                  'transition-all',
                )}
              />
              <span className="text-[12px] text-ink-tertiary">to</span>
              <input
                type="time"
                value={timelineSettings.workingHoursTo || '17:00'}
                onChange={(e) => setTimelineSetting('workingHoursTo', e.target.value)}
                className={clsx(
                  'rounded-md px-3 py-2 w-32',
                  'text-[13px] text-ink-primary border border-surface-active/60',
                  'bg-surface-hover focus:bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                  'transition-all',
                )}
              />
            </div>
          </div>

          {/* Custom Non-Working Days */}
          <div>
            <label className="block text-[12px] font-medium text-ink-secondary mb-2">Holidays & closures <span className="font-normal text-ink-tertiary">— days when no work is scheduled</span></label>

            {timelineSettings.customNonWorkingDays.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {timelineSettings.customNonWorkingDays.map((day, i) => (
                  <div key={i} className="flex items-center gap-2 bg-surface-hover/50 rounded-md px-3 py-1.5">
                    <span className="text-[12px] font-medium text-ink-primary w-24">{day.date}</span>
                    <span className="text-[12px] text-ink-secondary flex-1">{day.label}</span>
                    <button
                      onClick={() => removeNonWorkingDay(i)}
                      className="text-ink-tertiary hover:text-status-critical transition-colors p-0.5 rounded"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className={clsx(
                  'rounded-md px-3 py-2 w-40',
                  'text-[12px] text-ink-primary border border-surface-active/60',
                  'bg-surface-hover focus:bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                  'transition-all',
                )}
              />
              <input
                type="text"
                value={newDayLabel}
                onChange={(e) => setNewDayLabel(e.target.value)}
                placeholder="e.g., Independence Day, Office Closure"
                className={clsx(
                  'flex-1 rounded-md px-3 py-2',
                  'text-[12px] text-ink-primary border border-surface-active/60',
                  'bg-surface-hover focus:bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-qb-blue/20 focus:border-qb-blue/40',
                  'transition-all placeholder:text-ink-tertiary',
                )}
              />
              <button
                type="button"
                onClick={handleAddNonWorkingDay}
                disabled={!newDayDate}
                className={clsx(
                  'flex items-center gap-1 text-[12px] font-medium px-3 py-2 rounded-md transition-all',
                  !newDayDate
                    ? 'text-ink-tertiary cursor-not-allowed opacity-50'
                    : 'text-qb-blue hover:bg-qb-blue-light',
                )}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-surface-active/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-white bg-qb-blue rounded-md hover:bg-qb-blue/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
