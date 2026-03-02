import React from 'react'
import { X, Check } from 'lucide-react'
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

export default function SetupWizard() {
  const {
    isOpen, isComplete, currentStep, setStep, closeWizard, completeWizard,
    reportTitle, fieldMappings, selectedTables, schedulingConstraints, tabLabels,
  } = useWizardStore()

  const stepLabels = ['Report Basics', tabLabels.workOrders, tabLabels.technicians]

  if (!isOpen) return null

  const StepComponent = allSteps[currentStep]?.component

  // Validation: check required fields per step, accounting for constraint-dependent fields
  const woMappings = fieldMappings.workOrders || {}
  const techMappings = fieldMappings.technicians || {}
  const sc = schedulingConstraints

  // WO: core 4 always required + skills if useSkills
  const woValid =
    !!(woMappings.title?.fieldId && woMappings.scheduledStart?.fieldId && woMappings.scheduledEnd?.fieldId && woMappings.assignedTechnician?.fieldId) &&
    (!sc.useSkills || !!woMappings.skills?.fieldId)

  // Tech: name always required + skills if useSkills + hourlyRate if usePayRate
  const techValid =
    !!(selectedTables.technicians && techMappings.name?.fieldId) &&
    (!sc.useSkills || !!techMappings.skills?.fieldId) &&
    (!sc.usePayRate || !!techMappings.hourlyRate?.fieldId)

  const stepComplete = [
    // Step 0: Preferences — just needs a title
    !!reportTitle?.trim(),
    // Step 1: Work Orders — core + constraint-dependent fields
    woValid,
    // Step 2: Technicians — core + constraint-dependent fields
    techValid,
  ]

  const allValid = stepComplete.every(Boolean)
  const isEditing = isComplete

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40">
      <div className="bg-white rounded-lg shadow-modal w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header — clean, QB-native */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-surface-active/60">
          <h2 className="text-[15px] font-semibold text-ink-primary">Scheduler Setup</h2>
          <button
            onClick={closeWizard}
            className="text-ink-tertiary hover:text-ink-secondary transition-colors p-1 rounded hover:bg-surface-hover"
          >
            <X size={16} />
          </button>
        </div>

        {/* Clickable tab progress with completion indicators */}
        <WizardProgress
          currentStep={currentStep}
          activeSteps={allSteps}
          onStepClick={setStep}
          stepComplete={stepComplete}
        />

        {/* Step content — canvas background so cards pop */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-canvas">
          <StepComponent />
        </div>

        {/* Footer — context-aware with step info and validation */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-surface-active/60">
          <span className="text-[12px] text-ink-tertiary">
            Step {currentStep + 1} of 3 — {stepLabels[currentStep]}
          </span>
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
  )
}
