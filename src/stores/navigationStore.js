import { create } from 'zustand'

export const useNavigationStore = create((set) => ({
  currentPage: 'scheduler', // 'scheduler' | 'availability'
  navigateTo: (page) => set({ currentPage: page }),
}))
