import { create } from 'zustand'

export type SelectedSongsState = {
  selectedSongs: string[]
  selectedSong: string | null
  selectedKey: string
}

export type SelectedSongsActions = {
  selectSong: (id: string) => void
  addSong: (id: string) => void
  removeSong: (id: string) => void
  clearSelection: () => void
  setSelectedKey: (key: string) => void
}

const initialState: SelectedSongsState = {
  selectedSongs: [],
  selectedSong: '',
  selectedKey: 'A'
}

const selectedSongsStore = create<SelectedSongsState & SelectedSongsActions>((set, get) => ({
  selectedSongs: initialState.selectedSongs,
  selectedSong: initialState.selectedSong,
  selectedKey: initialState.selectedKey,
  selectSong: (id) => {
    if (get().selectedSong === id) return
    if (!get().selectedSongs.includes(id)) set({ selectedSongs: [...get().selectedSongs, id] })
    set({ selectedSong: id })
  },
  addSong: (id) => set({ selectedSongs: [...get().selectedSongs, id] }),
  removeSong: (id) => {
    const selectedSongs = get().selectedSongs.filter((songId) => songId !== id)
    const selectedSong = selectedSongs.length > 0 ? selectedSongs[selectedSongs.length - 1] : ''
    return set({
      selectedSong,
      selectedSongs
    })
  },
  clearSelection: () => set({ selectedSongs: [], selectedSong: '' }),
  setSelectedKey: (key) => set({ selectedKey: key })
}))

export const useSelectedSongs = selectedSongsStore
