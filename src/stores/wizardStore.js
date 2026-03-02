import { create } from 'zustand'
import { suggestTables, suggestFieldMappings, fetchTables, fetchTableFields } from '../services/quickbaseApi.js'

export const useWizardStore = create((set, get) => ({
  // Wizard state
  currentStep: 0, // 0-2 (3 tabs: Preferences, Work Orders, Technicians)
  isOpen: false,
  isComplete: false,
  loading: false,
  openDefaultsModal: false,  // flag to open Schedule Report Defaults modal from other steps

  // Report metadata (Tab 0: Preferences)
  reportTitle: '',
  reportDescription: '',

  // Editable tab labels (users can rename Work Orders / Technicians)
  tabLabels: {
    workOrders: 'Work Orders',
    technicians: 'Technicians',
  },

  // Timeline display settings (Tab 0: Preferences)
  timelineSettings: {
    showWeekends: false,
    defaultView: 'week',       // 'day' | 'week' | 'month'
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],  // subset of Mon-Fri
    workingHoursFrom: '08:00',
    workingHoursTo: '17:00',
    customNonWorkingDays: [],   // [{ date: 'YYYY-MM-DD', label: 'Holiday name' }]
  },

  // Step 1: Table connections
  availableTables: [],
  tableSuggestions: null,
  selectedTables: {
    workOrders: null,
    technicians: null,
    availability: null,
  },

  // Step 2-3: Field mappings
  fieldMappings: {
    workOrders: {},
    technicians: {},
    availability: {},
  },
  fieldSuggestions: {
    workOrders: null,
    technicians: null,
    availability: null,
  },
  tableFields: {
    workOrders: [],
    technicians: [],
    availability: [],
  },

  // AI Optimization master toggle (on by default)
  useAIOptimization: true,

  // Scheduling constraint toggles (set in Step 1, visible when AI is ON)
  schedulingConstraints: {
    useSkills: false,
    usePayRate: false,
    useAvailability: true,
  },

  // Availability configuration (Technicians step)
  availabilityMode: 'defaults', // 'defaults' | 'custom'

  // QB table-based availability mapping (used when dev toggle "availabilityInQBTable" is ON)
  availabilityTableMapping: {
    tableId: null,
    tableName: '',
    fields: {
      technician: { fieldId: null, fieldName: '' },    // FK to technician record
      date: { fieldId: null, fieldName: '' },           // Date field
      startTime: { fieldId: null, fieldName: '' },      // Shift start time
      endTime: { fieldId: null, fieldName: '' },        // Shift end time
      status: { fieldId: null, fieldName: '' },         // Available / Unavailable
      availabilityType: { fieldId: null, fieldName: '' }, // Type label (Vacation, Sick, etc.)
    },
  },

  customAvailability: {
    // Cell-based: keyed by "techId:YYYY-MM-DD"
    // Value: { status: 'available'|'unavailable', shifts: [{ start: '08:00', end: '17:00' }] }
    cells: {},
    // AI-generated description text (optional)
    aiDescription: '',
  },

  // Additional fields (Plus-button pattern, max 5 per table)
  additionalFields: {
    workOrders: [],     // [{ fieldId, fieldName }]
    technicians: [],    // [{ fieldId, fieldName }]
  },

  // Table-level filters — flexible, based on mapped fields
  tableFilters: {
    workOrders: [],     // [{ fieldKey, fieldName, operator: 'equals'|'contains'|'in', value }]
    technicians: [],    // same shape
  },

  // Actions
  openWizard() {
    set({ isOpen: true, currentStep: 0 })
  },

  closeWizard() {
    set({ isOpen: false })
  },

  setStep(step) {
    set({ currentStep: step })
  },

  setReportTitle(title) {
    set({ reportTitle: title })
  },

  setReportDescription(description) {
    set({ reportDescription: description })
  },

  setTabLabel(key, label) {
    set(state => ({
      tabLabels: { ...state.tabLabels, [key]: label },
    }))
  },

  setUseAIOptimization(value) {
    set({ useAIOptimization: value })
  },

  setConstraint(key, value) {
    set(state => ({
      schedulingConstraints: { ...state.schedulingConstraints, [key]: value },
    }))
  },

  setAvailabilityMode(mode) {
    set({ availabilityMode: mode })
  },

  setCustomAvailabilityCells(cells) {
    set(state => ({
      customAvailability: { ...state.customAvailability, cells },
    }))
  },

  setCustomAvailabilityCell(key, value) {
    set(state => ({
      customAvailability: {
        ...state.customAvailability,
        cells: { ...state.customAvailability.cells, [key]: value },
      },
    }))
  },

  setCustomAvailabilityAIDescription(text) {
    set(state => ({
      customAvailability: { ...state.customAvailability, aiDescription: text },
    }))
  },

  // --- QB table availability mapping ---

  setAvailabilityTable(tableId, tableName) {
    set(state => ({
      availabilityTableMapping: {
        ...state.availabilityTableMapping,
        tableId,
        tableName,
      },
    }))
  },

  setAvailabilityTableField(fieldKey, fieldId, fieldName) {
    set(state => ({
      availabilityTableMapping: {
        ...state.availabilityTableMapping,
        fields: {
          ...state.availabilityTableMapping.fields,
          [fieldKey]: { fieldId, fieldName },
        },
      },
    }))
  },

  // --- Timeline display settings ---

  setTimelineSetting(key, value) {
    set(state => ({
      timelineSettings: { ...state.timelineSettings, [key]: value },
    }))
  },

  addNonWorkingDay(date, label) {
    set(state => ({
      timelineSettings: {
        ...state.timelineSettings,
        customNonWorkingDays: [...state.timelineSettings.customNonWorkingDays, { date, label }],
      },
    }))
  },

  removeNonWorkingDay(index) {
    set(state => ({
      timelineSettings: {
        ...state.timelineSettings,
        customNonWorkingDays: state.timelineSettings.customNonWorkingDays.filter((_, i) => i !== index),
      },
    }))
  },

  // --- Additional fields (Plus-button rows) ---

  addAdditionalField(role) {
    set(state => {
      const current = state.additionalFields[role] || []
      if (current.length >= 5) return state
      return {
        additionalFields: {
          ...state.additionalFields,
          [role]: [...current, { fieldId: null, fieldName: '' }],
        },
      }
    })
  },

  removeAdditionalField(role, index) {
    set(state => ({
      additionalFields: {
        ...state.additionalFields,
        [role]: state.additionalFields[role].filter((_, i) => i !== index),
      },
    }))
  },

  setAdditionalField(role, index, fieldId, fieldName) {
    set(state => {
      const updated = [...state.additionalFields[role]]
      updated[index] = { fieldId, fieldName }
      return {
        additionalFields: {
          ...state.additionalFields,
          [role]: updated,
        },
      }
    })
  },

  // --- Table filters (dynamic, based on mapped fields) ---

  addTableFilter(role) {
    set(state => ({
      tableFilters: {
        ...state.tableFilters,
        [role]: [...state.tableFilters[role], { fieldKey: '', fieldName: '', operator: 'equals', value: '' }],
      },
    }))
  },

  removeTableFilter(role, index) {
    set(state => ({
      tableFilters: {
        ...state.tableFilters,
        [role]: state.tableFilters[role].filter((_, i) => i !== index),
      },
    }))
  },

  setTableFilterField(role, index, fieldKey, fieldName) {
    set(state => {
      const updated = [...state.tableFilters[role]]
      updated[index] = { ...updated[index], fieldKey, fieldName }
      return {
        tableFilters: { ...state.tableFilters, [role]: updated },
      }
    })
  },

  setTableFilterOperator(role, index, operator) {
    set(state => {
      const updated = [...state.tableFilters[role]]
      updated[index] = { ...updated[index], operator }
      return {
        tableFilters: { ...state.tableFilters, [role]: updated },
      }
    })
  },

  setTableFilterValue(role, index, value) {
    set(state => {
      const updated = [...state.tableFilters[role]]
      updated[index] = { ...updated[index], value }
      return {
        tableFilters: { ...state.tableFilters, [role]: updated },
      }
    })
  },

  // --- Step navigation (3 tabs: 0=Preferences, 1=WO, 2=Technicians) ---

  getStepCount() {
    return 3
  },

  nextStep() {
    set(state => ({
      currentStep: Math.min(state.currentStep + 1, 2),
    }))
  },

  prevStep() {
    set(state => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    }))
  },

  // --- Field mapping ---

  async loadTablesAndSuggest() {
    set({ loading: true })
    try {
      const [tables, suggestions] = await Promise.all([
        fetchTables(),
        suggestTables(),
      ])
      set({
        availableTables: tables,
        tableSuggestions: suggestions,
        selectedTables: {
          workOrders: suggestions.workOrders ? { tableId: suggestions.workOrders.tableId, name: suggestions.workOrders.name } : null,
          technicians: suggestions.technicians ? { tableId: suggestions.technicians.tableId, name: suggestions.technicians.name } : null,
          availability: suggestions.availability ? { tableId: suggestions.availability.tableId, name: suggestions.availability.name } : null,
        },
        loading: false,
      })
    } catch (err) {
      set({ loading: false })
    }
  },

  selectTable(role, tableId) {
    const table = get().availableTables.find(t => t.tableId === tableId)
    set(state => ({
      selectedTables: {
        ...state.selectedTables,
        [role]: table ? { tableId, name: table.name } : null,
      },
    }))
  },

  async loadFieldsAndSuggest(role) {
    const tableId = get().selectedTables[role]?.tableId
    if (!tableId) return

    set({ loading: true })
    try {
      const [fields, suggestions] = await Promise.all([
        fetchTableFields(tableId),
        suggestFieldMappings(tableId, role),
      ])
      set(state => ({
        tableFields: { ...state.tableFields, [role]: fields },
        fieldSuggestions: { ...state.fieldSuggestions, [role]: suggestions },
        fieldMappings: { ...state.fieldMappings, [role]: suggestions },
        loading: false,
      }))
    } catch (err) {
      set({ loading: false })
    }
  },

  setFieldMapping(role, fieldKey, fieldId, fieldName) {
    set(state => ({
      fieldMappings: {
        ...state.fieldMappings,
        [role]: {
          ...state.fieldMappings[role],
          [fieldKey]: {
            ...(state.fieldMappings[role]?.[fieldKey] || {}),
            fieldId,
            fieldName,
            confidence: 100,
            reason: 'Manually selected',
          },
        },
      },
    }))
  },

  acceptAllSuggestions(role) {
    const suggestions = get().fieldSuggestions[role]
    if (suggestions) {
      set(state => ({
        fieldMappings: { ...state.fieldMappings, [role]: { ...suggestions } },
      }))
    }
  },

  // --- Complete / persist ---

  completeWizard() {
    const config = {
      version: 2,
      reportTitle: get().reportTitle,
      reportDescription: get().reportDescription,
      tabLabels: get().tabLabels,
      tables: get().selectedTables,
      fieldMappings: get().fieldMappings,
      additionalFields: get().additionalFields,
      useAIOptimization: get().useAIOptimization,
      schedulingConstraints: get().schedulingConstraints,
      timelineSettings: get().timelineSettings,
      tableFilters: get().tableFilters,
      availabilityMode: get().availabilityMode,
      customAvailability: get().customAvailability,
      availabilityTableMapping: get().availabilityTableMapping,
      constraints: {
        maxDailyHours: 10,
        maxWeeklyHours: 40,
        bufferMinutes: 15,
        allowOvertimeWithWarning: true,
        blockDoubleBooking: true,
        requireSkillMatch: get().schedulingConstraints.useSkills,
      },
    }
    localStorage.setItem('qb-scheduler-config', JSON.stringify(config))
    set({ isComplete: true, isOpen: false })
  },

  checkExistingConfig() {
    const saved = localStorage.getItem('qb-scheduler-config')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        set({
          isComplete: true,
          reportTitle: config.reportTitle || '',
          reportDescription: config.reportDescription || '',
          tabLabels: config.tabLabels || { workOrders: 'Work Orders', technicians: 'Technicians' },
          selectedTables: config.tables,
          fieldMappings: config.fieldMappings,
          additionalFields: config.additionalFields || { workOrders: [], technicians: [] },
          useAIOptimization: config.useAIOptimization !== undefined ? config.useAIOptimization : true,
          schedulingConstraints: config.schedulingConstraints || { useSkills: false, usePayRate: false, useAvailability: false },
          timelineSettings: {
            showWeekends: false,
            defaultView: 'week',
            workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            workingHoursFrom: '08:00',
            workingHoursTo: '17:00',
            customNonWorkingDays: [],
            ...(config.timelineSettings || {}),
          },
          tableFilters: config.tableFilters || { workOrders: [], technicians: [] },
          availabilityMode: config.availabilityMode || 'defaults',
          customAvailability: config.customAvailability || { cells: {}, aiDescription: '' },
          availabilityTableMapping: config.availabilityTableMapping || {
            tableId: null, tableName: '',
            fields: {
              technician: { fieldId: null, fieldName: '' },
              date: { fieldId: null, fieldName: '' },
              startTime: { fieldId: null, fieldName: '' },
              endTime: { fieldId: null, fieldName: '' },
              status: { fieldId: null, fieldName: '' },
              availabilityType: { fieldId: null, fieldName: '' },
            },
          },
        })
        return true
      } catch { /* ignore */ }
    }
    return false
  },

  resetConfig() {
    localStorage.removeItem('qb-scheduler-config')
    set({
      isComplete: false,
      currentStep: 0,
      reportTitle: '',
      reportDescription: '',
      tabLabels: { workOrders: 'Work Orders', technicians: 'Technicians' },
      selectedTables: { workOrders: null, technicians: null, availability: null },
      fieldMappings: { workOrders: {}, technicians: {}, availability: {} },
      fieldSuggestions: { workOrders: null, technicians: null, availability: null },
      useAIOptimization: true,
      schedulingConstraints: { useSkills: false, usePayRate: false, useAvailability: false },
      timelineSettings: { showWeekends: false, defaultView: 'week', workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], workingHoursFrom: '08:00', workingHoursTo: '17:00', customNonWorkingDays: [] },
      additionalFields: { workOrders: [], technicians: [] },
      tableFilters: { workOrders: [], technicians: [] },
      availabilityMode: 'defaults',
      customAvailability: { cells: {}, aiDescription: '' },
      availabilityTableMapping: {
        tableId: null, tableName: '',
        fields: {
          technician: { fieldId: null, fieldName: '' },
          date: { fieldId: null, fieldName: '' },
          startTime: { fieldId: null, fieldName: '' },
          endTime: { fieldId: null, fieldName: '' },
          status: { fieldId: null, fieldName: '' },
          availabilityType: { fieldId: null, fieldName: '' },
        },
      },
    })
  },
}))
