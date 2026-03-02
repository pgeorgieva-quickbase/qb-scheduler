import { create } from 'zustand'

const STORAGE_KEY = 'qb-scheduler-dev-toggles'

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return null
}

const defaults = {
  setupInModals: true,
  setupInPage: false,
  availabilityInQBTable: false,
}

export const useDevTogglesStore = create((set, get) => ({
  ...defaults,
  ...(loadFromStorage() || {}),
  panelOpen: false,

  togglePanel() {
    set(s => ({ panelOpen: !s.panelOpen }))
  },

  setToggle(key, value) {
    const updates = { [key]: value }

    // Setup in modals and setup in page are mutually exclusive
    if (key === 'setupInModals' && value) {
      updates.setupInPage = false
    } else if (key === 'setupInPage' && value) {
      updates.setupInModals = false
    }

    set(updates)

    // Persist (exclude panelOpen)
    const state = get()
    const toSave = {
      setupInModals: state.setupInModals,
      setupInPage: state.setupInPage,
      availabilityInQBTable: state.availabilityInQBTable,
      ...updates,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  },
}))
