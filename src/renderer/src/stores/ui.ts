import { create } from 'zustand'

type UiState = {
  isDarkMode: boolean
  menuOpen: boolean
  viewMode: 'edit' | 'view'
}

type UiActions = {
  toggleDarkMode: () => void
  toggleMenu: () => void
  toggleViewMode: () => void
  setViewMode: (mode: 'edit' | 'view') => void
}

const useUi = create<UiState & UiActions>((set) => ({
  isDarkMode: false,
  menuOpen: true,
  viewMode: 'edit',
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
  toggleViewMode: () => set((state) => ({ viewMode: state.viewMode === 'edit' ? 'view' : 'edit' })),
  setViewMode: (mode) => set(() => ({ viewMode: mode }))
}))

export type { UiState, UiActions }

export default useUi
