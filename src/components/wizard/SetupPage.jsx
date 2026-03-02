import React from 'react'
import { Check, ArrowLeft } from 'lucide-react'
import WizardProgress from './WizardProgress'
import SchedulerPreferencesStep from './SchedulerPreferencesStep'
import WorkOrderMappingStep from './WorkOrderMappingStep'
import TechnicianMappingStep from './TechnicianMappingStep'
import { useWizardStore } from '../../stores/wizardStore'

const allSteps = [
  { component: SchedulerPreferencesStep, key: 'preferences' },
  { component: WorkOrderMappingStep, key: 'workOrders' },
  { component: TechnicianMappingStep, key: 'technicians' },
]

export default function SetupPage() {
  const {
    isOpen, isComplete, currentStep, setStep, closeWizard, completeWizard,
    reportTitle, fieldMappings, selectedTables, schedulingConstraints, tabLabels,
  } = useWizardStore()

  const stepLabels = ['Report Basics', tabLabels.workOrders, tabLabels.technicians]

  if (!isOpen) return null

  const StepComponent = allSteps[currentStep]?.component

  // Same validation as SetupWizard
  const woMappings = fieldMappings.workOrders || {}
  const techMappings = fieldMappings.technicians || {}
  const sc = schedulingConstraints

  const woValid =
    !!(woMappings.title?.fieldId && woMappings.scheduledStart?.fieldId && woMappings.scheduledEnd?.fieldId && woMappings.assignedTechnician?.fieldId) &&
    (!sc.useSkills || !!woMappings.skills?.fieldId)

  const techValid =
    !!(selectedTables.technicians && techMappings.name?.fieldId) &&
    (!sc.useSkills || !!techMappings.skills?.fieldId) &&
    (!sc.usePayRate || !!techMappings.hourlyRate?.fieldId)

  const stepComplete = [
    !!reportTitle?.trim(),
    woValid,
    techValid,
  ]

  const allValid = stepComplete.every(Boolean)
  const isEditing = isComplete

  return (
    <div className="flex flex-col h-full bg-canvas">
      {/* Page header */}
      <div className="bg-white border-b border-surface-active/60">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              {isEditing && (
                <button
                  onClick={closeWizard}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-ink-secondary hover:text-ink-primary transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Scheduler
                </button>
              )}
              {!isEditing && (
                <h2 className="text-[15px] font-semibold text-ink-primary">Scheduler Setup</h2>
              )}
            </div>
            <button
              onClick={completeWizard}
              disabled={!allValid}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-qb-blue text-white text-[13px] font-semibold hover:bg-qb-blue-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={14} />
              {isEditing ? 'Save Changes' : 'Create Scheduler'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress tabs */}
      <div className="bg-white border-b border-surface-active/40">
        <div className="max-w-4xl mx-auto">
          <WizardProgress
            currentStep={currentStep}
            activeSteps={allSteps}
            onStepClick={setStep}
            stepComplete={stepComplete}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <StepComponent />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-surface-active/60">
        <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <span className="text-[12px] text-ink-tertiary">
            Step {currentStep + 1} of 3 — {stepLabels[currentStep]}
          </span>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setStep(currentStep - 1)}
                className="px-4 py-2 rounded-md text-[13px] font-medium text-ink-secondary hover:bg-surface-hover transition-colors"
              >
                Previous
              </button>
            )}
            {currentStep < 2 ? (
              <button
                onClick={() => setStep(currentStep + 1)}
                className="px-4 py-2 rounded-md bg-qb-blue text-white text-[13px] font-medium hover:bg-qb-blue-hover transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={completeWizard}
                disabled={!allValid}
                className="flex items-center gap-2 px-5 py-2 rounded-md bg-qb-blue text-white text-[13px] font-semibold hover:bg-qb-blue-hover transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check size={14} />
                {isEditing ? 'Save Changes' : 'Create Scheduler'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
