import { create } from 'zustand'

const MAX_HISTORY = 50

export const useUndoStore = create((set, get) => ({
  past: [],
  future: [],

  get canUndo() {
    return get().past.length > 0
  },

  get canRedo() {
    return get().future.length > 0
  },

  pushAction(action) {
    set(state => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), action],
      future: [],
    }))
  },

  undo() {
    const { past, future } = get()
    if (past.length === 0) return null

    const action = past[past.length - 1]
    set({
      past: past.slice(0, -1),
      future: [...future, action],
    })
    return action
  },

  redo() {
    const { past, future } = get()
    if (future.length === 0) return null

    const action = future[future.length - 1]
    set({
      past: [...past, action],
      future: future.slice(0, -1),
    })
    return action
  },

  clear() {
    set({ past: [], future: [] })
  },
}))
