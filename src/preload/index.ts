import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { SongMeta } from '../core/types'
// import { SongMeta } from '../core/types'
import { CacheAPI, LibraryAPI, SongAPI } from './index.d'

// Custom APIs for renderer
const api = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    // contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('library', {
      // List & Search
      getSongs: () => ipcRenderer.invoke('library:getSongs'),

      searchSongs: (query: string) => ipcRenderer.invoke('library:searchSongs', query),

      getSong: (id: string) => ipcRenderer.invoke('library:getSong', id),

      // Add & Update
      pickAndAddSong: () => ipcRenderer.invoke('library:pickAndAddSong'),

      updateSong: (id: string, updates: Partial<SongMeta>) =>
        ipcRenderer.invoke('library:updateSong', id, updates),

      deleteSong: (id: string) => ipcRenderer.invoke('library:deleteSong', id)
    } as LibraryAPI)

    contextBridge.exposeInMainWorld('song', {
      // View
      open: (songId: string) => ipcRenderer.invoke('song:open', songId),

      // Edit
      edit: (songId: string) => ipcRenderer.invoke('song:edit', songId),

      // Save
      save: (songId: string, newContent: string) =>
        ipcRenderer.invoke('song:save', songId, newContent)
    } as SongAPI)

    contextBridge.exposeInMainWorld('cache', {
      rebuild: (songId: string) => ipcRenderer.invoke('cache:rebuild', songId),

      clearAll: () => ipcRenderer.invoke('cache:clearAll')
    } as CacheAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
