import { ElectronAPI } from '@electron-toolkit/preload'

export interface LibraryAPI {
  // List & Search
  getSongs: () => Promise<SongMeta[]>
  searchSongs: (query: string) => Promise<SongMeta[]>
  getSong: (id: string) => Promise<SongMeta | null>

  // Add & Update
  pickAndAddSong: () => Promise<{
    success?: boolean
    meta?: SongMeta
    ast?: Song
    error?: string
    duplicate?: boolean
    existingSong?: SongMeta
    existingId?: string
  } | null>

  updateSong: (id: string, updates: Partial<SongMeta>) => Promise<{ success: boolean }>
  deleteSong: (id: string) => Promise<{ success: boolean }>
}

export interface SongAPI {
  // View
  open: (songId: string) => Promise<{
    success?: boolean
    meta?: SongMeta
    ast?: Song
    error?: string
  }>

  // Edit
  edit: (songId: string) => Promise<{
    success?: boolean
    meta?: SongMeta
    rawContent?: string
    error?: string
  }>

  // Save
  save: (
    songId: string,
    newContent: string
  ) => Promise<{
    success?: boolean
    error?: string
  }>
}

export interface CacheAPI {
  rebuild: (songId: string) => Promise<{
    success?: boolean
    ast?: Song
    error?: string
  }>

  clearAll: () => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    // api: unknown
    library: LibraryAPI
    song: SongAPI
    cache: CacheAPI
  }
}
